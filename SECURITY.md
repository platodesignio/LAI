# SECURITY.md — Laozi AI

## Security Architecture and Responsibilities

---

## 1. Authentication

### Session management
- Sessions use cryptographically random 32-byte hex tokens stored in the database (`UserSession` table)
- Session cookie: `laozi_session`, HttpOnly, Secure (production), SameSite=Lax
- Sessions expire after 30 days (configurable via `SESSION_MAX_AGE`)
- Sessions are invalidated server-side on logout and password reset
- All active sessions are visible to the user in `/settings` with individual revoke capability

### Password security
- Passwords hashed with bcrypt, cost factor 12
- Minimum 8 characters, must contain uppercase and a number
- No maximum below 128 characters
- Password reset tokens expire after 1 hour
- All sessions are invalidated after a successful password reset

### Email verification
- Email verification required before login is permitted
- Verification tokens expire after 24 hours
- Tokens are single-use (cleared on successful verification)

### Brute force protection
- Auth endpoints rate-limited by IP: 10 requests per 15-minute window
- Rate limits enforced at the API route level
- Rate limit violations logged to the Incident table

---

## 2. Authorization

### Role-based access
- Two roles: `USER` and `ADMIN`
- Admin routes require `requireAdmin()` — checked in every admin page layout and every admin API route
- Resource ownership is verified on every read/write (e.g., conversation.userId === session.user.id)
- Middleware redirects unauthenticated users to login for protected paths

### Admin controls
- Admin users can modify feature flags, prompt versions, user roles, and resolve incidents
- All admin actions are written to the `AuditLog` table with userId, action, resource, and IP
- Admin cannot delete their own account via admin panel (self-deletion prevention)

---

## 3. Input Validation

- All API route inputs validated with Zod schemas before processing
- Validation errors return structured 400 responses — never expose stack traces
- Maximum length limits enforced on all string inputs
- Email inputs normalized (trimmed, lowercased) before DB queries

---

## 4. Security Headers

Applied via `middleware.ts` and `next.config.ts` to all responses:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; frame-ancestors 'none'; ...
```

---

## 5. Rate Limiting

- **Auth** (login, register, forgot-password): 10 requests / 15 min / IP
- **Chat**: 20 requests / hour / user
- **Feedback**: 30 requests / hour / user
- **Contact**: 5 requests / hour / IP
- Rate limiting uses database-backed sliding window buckets
- Rate limit incidents logged to `Incident` table
- Rate limiting can be disabled via `rate_limiting_enabled` feature flag (dev only)

---

## 6. AI Safety

### Pre-model filtering
Content patterns matched before sending to AI provider:
- Explicit self-harm instructions → log_and_allow + incident
- Harassment/tracking requests → log_and_allow + incident
- Fraud/coercion assistance → log_and_allow + incident
- Child sexual abuse material → block + incident

### Post-model filtering
Output patterns matched after generation:
- Medical advice claims → log_and_allow + incident
- Legal advice claims → log_and_allow + incident

### Design principles
- No actions are taken automatically against users based on safety filter matches
- Logs create visibility for human review; humans make final judgments
- Safety incidents are visible in `/admin/incidents` for admin review
- The product does not claim to be medically, legally, or spiritually authoritative

---

## 7. Data Protection

### What is stored
- User account: email, hashed password, name (optional), role, verification status
- Conversations and messages: full content stored in DB
- Execution metadata: provider, model, token counts, duration — no personal data
- Audit logs: actions, resource IDs, IP addresses, timestamps

### What is not stored
- Plaintext passwords (bcrypt only)
- Session tokens after logout
- Raw payment data (no payments implemented)
- Precise geolocation

### Data retention
- User data is retained until account deletion
- Account deletion cascades to conversations, notes, feedback (foreign key ON DELETE CASCADE)
- Session records are deleted on logout and on password reset
- Audit logs and incidents are retained indefinitely for compliance

### Encryption
- Data in transit: HTTPS enforced via Strict-Transport-Security header
- Data at rest: depends on database provider configuration (use encrypted storage)

---

## 8. Dependency Security

```bash
# Check for known vulnerabilities
npm audit

# Update dependencies
npm audit fix

# Check for outdated packages
npm outdated
```

Run `npm audit` before every production deployment. Do not deploy with high-severity audit findings.

---

## 9. Reporting Security Issues

Do not open public GitHub issues for security vulnerabilities.

Report security issues by email to: [security contact — configure before launch]

Include:
1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Suggested mitigation if known

Response commitment: acknowledge within 48 hours, patch critical issues within 7 days.

---

## 10. Production Hardening Checklist

Before each production deployment:

- [ ] `SESSION_SECRET` is at least 32 characters and randomly generated
- [ ] `NODE_ENV=production` is set in Vercel
- [ ] HTTPS is enforced (Vercel handles this automatically)
- [ ] Database is not publicly accessible without credentials
- [ ] SMTP credentials are not committed to version control
- [ ] API keys are not committed to version control
- [ ] `npm audit` shows no high/critical vulnerabilities
- [ ] Admin account uses a strong, unique password
- [ ] Rate limiting is enabled (`rate_limiting_enabled` feature flag = true)
- [ ] AI API keys have usage limits configured at the provider level
