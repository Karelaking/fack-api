# Route Detection & Test Matrices

Read this when scanning a codebase for endpoints and generating auth, input-validation,
and pagination test cases.

## Route Detection Commands

### Next.js App Router
```bash
# Find all route handlers and extract HTTP methods
find ./app/api -name "route.ts" -o -name "route.js" | while read f; do
  route=$(echo "$f" | sed 's|./app||; s|/route\.[tj]s||')
  methods=$(grep -oE "export (async )?function (GET|POST|PUT|PATCH|DELETE)" "$f" | \
    grep -oE "(GET|POST|PUT|PATCH|DELETE)" | tr '\n' ',')
  echo "$methods $route"
done
```

### Express / Fastify
```bash
grep -rn "router\.\(get\|post\|put\|delete\|patch\)\|app\.\(get\|post\|put\|delete\|patch\)" \
  src/ --include="*.ts" --include="*.js" | \
  grep -oE "\.(get|post|put|delete|patch)\(['\"][^'\"]+['\"]" | \
  sed "s/\.\(.*\)('\(.*\)'/\U\1 \2/"
```

### FastAPI
```bash
grep -rn "@\(app\|router\)\.\(get\|post\|put\|delete\|patch\)" . --include="*.py" | \
  grep -oE "(get|post|put|delete|patch)\(['\"][^'\"]*['\"]"
```

### Go (net/http, Chi, Gin)
```bash
grep -rn "\.HandleFunc\|\.Handle\|\.GET\|\.POST\|\.PUT\|\.DELETE" . --include="*.go" | \
  grep -oE "(GET|POST|PUT|DELETE|HandleFunc)\(['\"][^'\"]*['\"]"
```

## Test Generation Framework

### Auth Test Matrix

For every authenticated endpoint, generate these test cases:

```typescript
// tests/api/[resource]/auth.test.ts
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createTestApp } from '../../helpers/app'
import { createTestUser, generateToken, generateExpiredToken } from '../../helpers/auth'

describe('GET /api/v1/projects - Authentication', () => {
  const app = createTestApp()

  it('returns 401 when no Authorization header is sent', async () => {
    const res = await request(app).get('/api/v1/projects')
    expect(res.status).toBe(401)
    expect(res.body.error).toMatchObject({
      code: 'UNAUTHORIZED',
      message: expect.any(String),
    })
  })

  it('returns 401 when token format is invalid', async () => {
    const res = await request(app)
      .get('/api/v1/projects')
      .set('Authorization', 'InvalidFormat')
    expect(res.status).toBe(401)
  })

  it('returns 401 when token is expired', async () => {
    const token = generateExpiredToken({ userId: 'user_123' })
    const res = await request(app)
      .get('/api/v1/projects')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('TOKEN_EXPIRED')
  })

  it('returns 403 when user lacks required role', async () => {
    const user = await createTestUser({ role: 'viewer' })
    const token = generateToken(user)
    const res = await request(app)
      .get('/api/v1/projects')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
  })

  it('returns 401 when token belongs to a deleted user', async () => {
    const user = await createTestUser()
    const token = generateToken(user)
    await deleteUser(user.id)
    const res = await request(app)
      .get('/api/v1/projects')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(401)
  })

  it('returns 200 with valid token and correct role', async () => {
    const user = await createTestUser({ role: 'member' })
    const token = generateToken(user)
    const res = await request(app)
      .get('/api/v1/projects')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('data')
  })
})
```

### Input Validation Matrix

```typescript
// tests/api/[resource]/validation.test.ts
describe('POST /api/v1/projects - Input Validation', () => {
  const validPayload = {
    name: 'My Project',
    description: 'A test project',
    visibility: 'private',
  }

  it('returns 422 when body is empty', async () => {
    const res = await authedRequest('POST', '/api/v1/projects', {})
    expect(res.status).toBe(422)
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'name', rule: 'required' }),
      ])
    )
  })

  it.each([
    ['name', undefined, 'required'],
    ['name', '', 'min_length'],
    ['name', 'a'.repeat(256), 'max_length'],
    ['name', 123, 'type'],
    ['visibility', 'invalid', 'enum'],
    ['description', 'a'.repeat(10001), 'max_length'],
  ])('returns 422 when %s is %s (%s)', async (field, value, rule) => {
    const payload = { ...validPayload, [field]: value }
    if (value === undefined) delete payload[field]
    const res = await authedRequest('POST', '/api/v1/projects', payload)
    expect(res.status).toBe(422)
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field, rule }),
      ])
    )
  })

  it('rejects SQL injection in string fields', async () => {
    const res = await authedRequest('POST', '/api/v1/projects', {
      ...validPayload,
      name: "'; DROP TABLE projects; --",
    })
    // Should either reject (422) or sanitize and succeed (201)
    expect([201, 422]).toContain(res.status)
    if (res.status === 201) {
      expect(res.body.data.name).not.toContain('DROP TABLE')
    }
  })

  it('rejects XSS payloads in string fields', async () => {
    const res = await authedRequest('POST', '/api/v1/projects', {
      ...validPayload,
      name: '<script>alert("xss")</script>',
    })
    if (res.status === 201) {
      expect(res.body.data.name).not.toContain('<script>')
    }
  })

  it('accepts valid payload and returns 201 with created resource', async () => {
    const res = await authedRequest('POST', '/api/v1/projects', validPayload)
    expect(res.status).toBe(201)
    expect(res.body.data).toMatchObject({
      id: expect.any(String),
      name: validPayload.name,
      visibility: validPayload.visibility,
      created_at: expect.any(String),
    })
    // Verify sensitive fields are NOT in response
    expect(res.body.data).not.toHaveProperty('internal_id')
  })
})
```

### Pagination Testing

```typescript
describe('GET /api/v1/projects - Pagination', () => {
  beforeAll(async () => {
    await seedProjects(25) // Create 25 test projects
  })

  it('returns first page with default limit', async () => {
    const res = await authedRequest('GET', '/api/v1/projects')
    expect(res.status).toBe(200)
    expect(res.body.data.length).toBeLessThanOrEqual(20) // default limit
    expect(res.body.meta).toMatchObject({
      total: 25,
      page: 1,
      has_more: true,
    })
  })

  it('returns second page correctly', async () => {
    const res = await authedRequest('GET', '/api/v1/projects?page=2&limit=10')
    expect(res.status).toBe(200)
    expect(res.body.data.length).toBe(10)
    expect(res.body.meta.page).toBe(2)
  })

  it('returns empty array for page beyond data', async () => {
    const res = await authedRequest('GET', '/api/v1/projects?page=100')
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
    expect(res.body.meta.has_more).toBe(false)
  })

  it('rejects limit above maximum', async () => {
    const res = await authedRequest('GET', '/api/v1/projects?limit=1000')
    expect(res.status).toBe(422)
  })

  it('returns consistent results with cursor-based pagination', async () => {
    const page1 = await authedRequest('GET', '/api/v1/projects?limit=5')
    const cursor = page1.body.meta.next_cursor
    const page2 = await authedRequest('GET', `/api/v1/projects?limit=5&cursor=${cursor}`)
    // No overlapping items between pages
    const ids1 = new Set(page1.body.data.map(p => p.id))
    const ids2 = new Set(page2.body.data.map(p => p.id))
    const overlap = [...ids1].filter(id => ids2.has(id))
    expect(overlap).toHaveLength(0)
  })
})
```
