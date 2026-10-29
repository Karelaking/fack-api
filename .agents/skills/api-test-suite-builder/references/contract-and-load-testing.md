# Contract & Load Testing

Read this when generating consumer-driven contract tests (Pact) or load/performance
scripts (k6) for an endpoint.

## Contract Testing with Pact

```typescript
// tests/contracts/projects.pact.test.ts
import { PactV3, MatchersV3 } from '@pact-foundation/pact'

const { like, eachLike, string, integer, iso8601DateTimeWithMillis } = MatchersV3

const provider = new PactV3({
  consumer: 'frontend-app',
  provider: 'projects-api',
})

describe('Projects API Contract', () => {
  it('returns a list of projects', async () => {
    provider
      .given('projects exist')
      .uponReceiving('a request for projects')
      .withRequest({
        method: 'GET',
        path: '/api/v1/projects',
        headers: { Authorization: like('Bearer token123') },
      })
      .willRespondWith({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          data: eachLike({
            id: string('proj_abc123'),
            name: string('My Project'),
            visibility: string('private'),
            created_at: iso8601DateTimeWithMillis('2026-01-15T10:30:00.000Z'),
            owner: {
              id: string('user_xyz'),
              name: string('Jane Doe'),
            },
          }),
          meta: {
            total: integer(1),
            page: integer(1),
            has_more: false,
          },
        },
      })

    await provider.executeTest(async (mockServer) => {
      const response = await fetch(`${mockServer.url}/api/v1/projects`, {
        headers: { Authorization: 'Bearer token123' },
      })
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.data[0]).toHaveProperty('id')
      expect(body.data[0]).toHaveProperty('name')
      expect(body.meta).toHaveProperty('total')
    })
  })
})
```

## Load Testing with k6

```javascript
// tests/load/api-load.k6.js
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

const errorRate = new Rate('errors')
const listLatency = new Trend('list_projects_duration')
const createLatency = new Trend('create_project_duration')

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // ramp up to 10 users
    { duration: '1m',  target: 50 },   // ramp up to 50 users
    { duration: '2m',  target: 50 },   // sustain 50 users
    { duration: '30s', target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200', 'p(99)<500'],  // SLA: P95 < 200ms
    errors: ['rate<0.01'],                            // Error rate < 1%
    list_projects_duration: ['p(95)<150'],
    create_project_duration: ['p(95)<300'],
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'test-token'

const headers = {
  Authorization: `Bearer ${AUTH_TOKEN}`,
  'Content-Type': 'application/json',
}

export default function () {
  // GET /api/v1/projects
  const listRes = http.get(`${BASE_URL}/api/v1/projects?limit=20`, { headers })
  listLatency.add(listRes.timings.duration)
  check(listRes, {
    'list: status 200': (r) => r.status === 200,
    'list: has data array': (r) => JSON.parse(r.body).data !== undefined,
  }) || errorRate.add(1)

  sleep(1)

  // POST /api/v1/projects
  const createRes = http.post(
    `${BASE_URL}/api/v1/projects`,
    JSON.stringify({
      name: `Load Test Project ${Date.now()}`,
      description: 'Created by k6 load test',
      visibility: 'private',
    }),
    { headers }
  )
  createLatency.add(createRes.timings.duration)
  check(createRes, {
    'create: status 201': (r) => r.status === 201,
    'create: has id': (r) => JSON.parse(r.body).data.id !== undefined,
  }) || errorRate.add(1)

  sleep(1)
}
```

### Run Load Tests

```bash
# Local
k6 run tests/load/api-load.k6.js

# With environment variables
k6 run -e BASE_URL=https://staging.app.com -e AUTH_TOKEN=$STAGING_TOKEN tests/load/api-load.k6.js

# Output to cloud dashboard
k6 cloud tests/load/api-load.k6.js
```
