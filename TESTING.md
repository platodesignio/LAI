# TESTING.md — Laozi AI

## Testing Strategy and Instructions

---

## 1. Overview

| Layer | Tool | Location | Coverage |
|-------|------|----------|----------|
| Unit | Vitest | `tests/unit/` | Validators, safety filters, mode routing, rate limiting |
| Integration | Vitest | `tests/integration/` | API route logic with mocked DB |
| End-to-end | Playwright | `tests/e2e/` | Full browser flows |

---

## 2. Running Tests

### All unit and integration tests
```bash
npm test
```

### Watch mode (during development)
```bash
npm run test:watch
```

### Coverage report
```bash
npm run test:coverage
# Opens coverage/index.html
```

### End-to-end tests
```bash
# Requires a running dev server
npm run dev &
npm run test:e2e

# With UI
npm run test:e2e:ui
```

### E2E against a specific URL
```bash
E2E_BASE_URL=https://staging.laozi.ai npm run test:e2e
```

---

## 3. Unit Tests

### `tests/unit/validators.test.ts`
Tests all Zod validation schemas:
- `registerSchema` — email format, password strength rules
- `loginSchema` — required fields
- `forgotPasswordSchema` — email format
- `resetPasswordSchema` — password match, token required
- `chatRequestSchema` — mode enum, message array, content length
- `createConversationSchema` — mode required, title optional
- `feedbackSchema` — executionId required, rating range, email format
- `contactSchema` — message length, required fields
- `createNoteSchema` — noteType enum, required fields

### `tests/unit/safety.test.ts`
Tests pre- and post-model safety filters:
- Safe content passes without incident
- Self-harm patterns → log_and_allow
- Explicit abuse patterns → block
- Harassment patterns → log_and_allow
- Medical/legal advice patterns in output → log_and_allow
- Case insensitivity of pattern matching
- Options are passed through to logIncident

### `tests/unit/modes.test.ts`
Tests mode system:
- getAllModes() returns all 5 modes with names and descriptions
- getModeDisplayName() returns correct display names
- getActiveModePrompt() loads from DB when available
- getActiveModePrompt() falls back to hardcoded prompt when DB returns null
- getActiveModePrompt() falls back when DB throws
- Fallback prompts exist for all 5 modes

### `tests/unit/rate-limit.test.ts`
Tests rate limit logic:
- First request allowed when no bucket exists
- Requests allowed below the limit
- Requests denied when at the limit
- Bucket resets when window expires
- resetAt is returned correctly

---

## 4. Integration Tests

### `tests/integration/auth.test.ts`
Tests auth route handlers with mocked DB:
- Register: creates user, returns 201
- Register: 409 on duplicate email
- Register: 400 on invalid input
- Register: 503 when registration disabled
- Login: 200 + session creation for valid credentials
- Login: 401 for unknown email
- Login: 401 for wrong password
- Login: 403 EMAIL_NOT_VERIFIED when email not verified
- Forgot password: always returns 200 (anti-enumeration)
- Forgot password: sends email when user exists

### `tests/integration/admin.test.ts`
Tests admin route protection:
- Unauthenticated → 401
- Non-admin → 403
- Admin → 200 for all admin endpoints
- Feature flags list returns array
- Health check returns status ok

### `tests/integration/feedback.test.ts`
Tests feedback endpoint:
- Valid feedback creates record and returns 201
- Missing executionId → 400
- Empty comment → 400
- Rate limited → 429

---

## 5. End-to-End Tests

### `tests/e2e/happy-path.spec.ts`
Covers the full user journey:
1. Homepage renders correctly
2. Register a new account
3. Verify email (requires E2E_DB_ACCESS env var for full test)
4. Sign in
5. Public pages accessible (7 routes)
6. API health check passes
7. Authenticated routes redirect to login when unauthenticated
8. Admin routes redirect to login when unauthenticated
9. Contact form validates
10. Modes page lists all 5 modes

---

## 6. Smoke Test Checklist

Run manually after every production deployment:

### Public routes
- [ ] `GET /` — Homepage loads, headline visible
- [ ] `GET /about` — Renders without error
- [ ] `GET /modes` — All 5 modes listed
- [ ] `GET /pricing` — Renders tiers
- [ ] `GET /contact` — Form renders
- [ ] `GET /legal/terms` — Renders
- [ ] `GET /legal/privacy` — Renders
- [ ] `GET /auth/login` — Form renders
- [ ] `GET /auth/register` — Form renders
- [ ] `GET /auth/forgot-password` — Form renders

### API endpoints
- [ ] `GET /api/health` — Returns `{"status":"ok","db":"ok"}`
- [ ] `POST /api/auth/register` with invalid data — Returns 400
- [ ] `POST /api/auth/login` with wrong password — Returns 401
- [ ] `GET /api/admin/users` without auth — Returns 401
- [ ] `GET /api/admin/feature-flags` without auth — Returns 401

### Authenticated flows
- [ ] Login with admin credentials
- [ ] `/admin/dashboard` loads with stats
- [ ] `/admin/feature-flags` lists flags, toggle works
- [ ] `/admin/prompt-policies` lists all 5 modes with prompts
- [ ] Login with user credentials
- [ ] `/chat` loads with mode selector
- [ ] Start a conversation in QUIET_MIRROR mode
- [ ] Chat streaming works (see text appear)
- [ ] Submit feedback on a message
- [ ] Save a note from a message
- [ ] `/notes` lists the saved note
- [ ] `/sessions` lists the conversation
- [ ] Sign out redirects to login

---

## 7. Known Test Limitations

1. **E2E email verification** — The happy path test skips email verification unless `E2E_DB_ACCESS=true` and a test token endpoint is available. In practice, manually verify by checking the `verificationToken` column in the DB.

2. **AI streaming in tests** — Chat streaming tests are integration-level only (mocked provider). Full streaming is tested manually via smoke tests.

3. **SMTP in tests** — Email sending is mocked in all automated tests. Manual smoke test required to verify SMTP configuration.

4. **Rate limit persistence** — Integration tests mock the DB so rate limit state does not persist. Load test rate limiting behavior manually.

---

## 8. Adding New Tests

### Unit test convention
```typescript
// tests/unit/<feature>.test.ts
import { describe, it, expect, vi } from "vitest";
// Mock external dependencies
vi.mock("@/lib/db", () => ({ db: { ... } }));
// Test pure logic
describe("featureName", () => {
  it("does the expected thing", () => { ... });
});
```

### Integration test convention
```typescript
// tests/integration/<route>.test.ts
import { describe, it, expect, vi } from "vitest";
// Mock all infrastructure
vi.mock("@/lib/db", () => ({ ... }));
vi.mock("@/lib/auth/session", () => ({ ... }));
// Import and call route handler directly
const { POST } = await import("@/app/api/.../route");
const res = await POST(req);
expect(res.status).toBe(200);
```

### E2E test convention
```typescript
// tests/e2e/<flow>.spec.ts
import { test, expect } from "@playwright/test";
test("user can do X", async ({ page }) => {
  await page.goto("/some-route");
  await expect(page.getByText("Expected content")).toBeVisible();
});
```
