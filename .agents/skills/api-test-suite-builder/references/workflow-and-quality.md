# Generation Workflow & Quality Bar

Read this when running the end-to-end generation process, writing test helpers, or
checking generated suites against the quality bar before shipping.

## Test Generation Process

When given a codebase, follow this workflow:

1. **Scan routes** using detection commands for the detected framework
2. **Read each route handler** to understand: request schema, auth middleware, response types, business rules
3. **Generate test file per resource** (not per route) using the matrices above
4. **Name tests descriptively**: `"returns 401 when token is expired"` not `"auth test 3"`
5. **Use factories/fixtures** for test data — never hardcode IDs or tokens
6. **Assert response shape**, not just status codes
7. **Include negative tests** — error paths catch 80% of production bugs
8. **Add contract tests** for any API consumed by external services
9. **Add load tests** for any endpoint expected to handle >100 RPM

## Test Helper Patterns

```typescript
// tests/helpers/auth.ts — reusable auth utilities
import jwt from 'jsonwebtoken'

export function generateToken(user: { id: string; role: string }, expiresIn = '1h') {
  return jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn })
}

export function generateExpiredToken(user: { id: string }) {
  return jwt.sign({ sub: user.id }, process.env.JWT_SECRET!, { expiresIn: '-1h' })
}

// tests/helpers/request.ts — authed request helper
export async function authedRequest(
  method: string,
  path: string,
  body?: any,
  userOverrides?: Partial<User>,
) {
  const user = await createTestUser(userOverrides)
  const token = generateToken(user)
  const req = request(app)[method.toLowerCase()](path)
    .set('Authorization', `Bearer ${token}`)
  if (body) req.send(body)
  return req
}

// tests/helpers/factory.ts — test data factories
export function buildProject(overrides = {}) {
  return {
    name: `Project ${Date.now()}`,
    description: 'Test project',
    visibility: 'private',
    ...overrides,
  }
}
```

## Common Pitfalls

- **Testing only happy paths** — 80% of production bugs live in error paths; test those first
- **Hardcoded IDs and tokens** — use factories; data changes between environments
- **Shared state between tests** — always clean up; one test's data should not affect another
- **Testing implementation, not behavior** — assert what the API returns, not how it does it
- **Missing boundary tests** — off-by-one errors are the most common bug in pagination and limits
- **Ignoring Content-Type** — test that the API rejects wrong content types
- **Not testing token expiry separately from invalid tokens** — they produce different error codes
- **Flaky tests from timing** — never depend on clock time; use deterministic test data

## Best Practices

1. One describe block per endpoint, nested by concern (auth, validation, business logic)
2. Seed only the minimal data each test needs — do not load the entire database
3. Assert specific error codes and field names, not just HTTP status
4. Test that sensitive fields (password, secret_key) are never present in responses
5. For contract tests, run them in CI against both consumer and provider
6. For load tests, set SLA thresholds (`p(95)<200`) and fail the build if violated
7. Keep test files colocated with the code they test or in a parallel `tests/` tree

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| Generated tests fail with `Cannot find module` errors | Test helper imports reference paths that don't exist in target project | Update import paths in generated files to match the project's `tsconfig.json` paths or Jest `moduleNameMapper` configuration |
| Auth tests all return 200 instead of 401/403 | Test app instance is not using the same auth middleware as production | Ensure `createTestApp()` loads the full middleware stack including auth guards; check that `JWT_SECRET` env var is set in the test environment |
| Pact contract verification fails on CI but passes locally | Provider state callbacks are missing or the provider is running a different version | Pin the provider version in CI, ensure all `given()` states have matching provider state handlers, and verify the Pact broker URL is correct |
| k6 load tests report 0 requests or instant completion | `BASE_URL` environment variable is not set or points to an unreachable host | Pass `-e BASE_URL=http://localhost:3000` explicitly and verify the server is running before starting the k6 run |
| Pagination tests fail with inconsistent ordering | The API does not enforce a default sort order, so results vary between runs | Add an explicit `ORDER BY` clause to the API query or include `?sort=created_at` in test requests to guarantee deterministic ordering |
| Input validation tests pass but miss real-world edge cases | Generated boundary values use generic limits (256 chars) that don't match actual schema constraints | Read the schema or validator definitions (Zod, Joi, Pydantic) and adjust boundary values to match declared `maxLength`, `minimum`, and `enum` values |
| Tests are flaky due to database state leakage between runs | Tests share a database and don't clean up after themselves | Wrap each test in a transaction that rolls back, or use `beforeEach` to truncate relevant tables; avoid relying on auto-increment IDs |

## Success Criteria

- **Route coverage >= 95%**: Every API endpoint in the codebase has at least one generated test file covering auth, validation, and happy path scenarios
- **Error path ratio >= 3:1**: At least three negative/error test cases exist for every happy-path test case per endpoint
- **Test execution time < 60s**: The full generated unit/integration test suite runs in under 60 seconds (excluding load tests)
- **Zero hardcoded secrets**: No test file contains hardcoded API keys, tokens, or passwords; all credentials come from environment variables or factories
- **Contract test coverage for all external APIs**: Every endpoint consumed by an external service or frontend client has a corresponding Pact or schema snapshot test
- **Load test SLA thresholds defined**: Every load-tested endpoint has explicit P95 and P99 latency thresholds and an error rate ceiling configured in the k6 script
- **CI integration complete**: Generated tests run automatically in the CI pipeline with clear pass/fail reporting and no manual intervention required
