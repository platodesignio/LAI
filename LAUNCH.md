# LAUNCH.md — Laozi AI

## Setup, Deployment, Operations, and Incident Response

---

## 1. Local Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 15+ (local or Docker)
- An SMTP service (Mailtrap for dev, Postmark/SES for prod)
- An Anthropic or OpenAI API key

### Steps

```bash
# Clone and install
git clone https://github.com/platodesignio/LAI.git
cd LAI
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local — fill in DATABASE_URL, DIRECT_URL, SESSION_SECRET, AI keys, SMTP

# Run migrations
npm run db:migrate:dev

# Seed database (dev only)
npm run db:seed

# Start dev server
npm run dev
```

Visit http://localhost:3000

Default seed credentials:
- Admin: `admin@laozi.ai` / `Admin123!ChangeThis`
- User: `demo@laozi.ai` / `User123!Demo`

---

## 2. Environment Variable Contract

All required variables must be set before deployment. See `.env.example` for the full contract.

**Minimum required for production:**
```
DATABASE_URL=
DIRECT_URL=
NEXT_PUBLIC_APP_URL=https://your-domain.com
SESSION_SECRET=<32+ random chars>
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
```

---

## 3. Vercel Deployment

### First deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Set environment variables (do this before first deploy)
vercel env add DATABASE_URL production
vercel env add DIRECT_URL production
vercel env add NEXT_PUBLIC_APP_URL production
vercel env add SESSION_SECRET production
vercel env add AI_PROVIDER production
vercel env add ANTHROPIC_API_KEY production
vercel env add SMTP_HOST production
vercel env add SMTP_PORT production
vercel env add SMTP_USER production
vercel env add SMTP_PASSWORD production
vercel env add SMTP_FROM production

# Deploy to production
vercel --prod
```

### Database setup on Vercel

1. Provision a PostgreSQL database (Neon, Railway, or Vercel Postgres)
2. For serverless environments, use a connection string with `?pgbouncer=true&connection_limit=1`
3. Set `DATABASE_URL` to the pooled connection string
4. Set `DIRECT_URL` to the direct (non-pooled) connection string — used for migrations
5. Run migrations as a build step or manually before deployment:

```bash
# Run migrations against production DB
DATABASE_URL=<direct_url> npx prisma migrate deploy
```

Or add to `package.json` scripts:
```json
"vercel-build": "prisma generate && prisma migrate deploy && next build"
```

And in `vercel.json`:
```json
{
  "buildCommand": "npm run vercel-build"
}
```

### Redeployment

```bash
git push origin main  # Triggers auto-deploy if connected via GitHub
# or
vercel --prod
```

---

## 4. Post-Deployment Smoke Test

Run these checks immediately after every deployment:

### Critical path checks

- [ ] `GET /api/health` returns `{"status":"ok","db":"ok"}`
- [ ] Homepage (`/`) loads without error
- [ ] `/auth/register` form renders and submits
- [ ] `/auth/login` renders with email and password fields
- [ ] `/modes` lists all 5 modes
- [ ] `/pricing` renders without broken links
- [ ] `/legal/terms` and `/legal/privacy` render
- [ ] `/contact` form renders

### Authenticated path checks

- [ ] Login with seeded admin account succeeds
- [ ] `/admin` dashboard loads
- [ ] `/admin/feature-flags` shows at least 7 flags
- [ ] `/admin/prompt-policies` shows prompts for all 5 modes
- [ ] Login with seeded user account succeeds
- [ ] `/chat` loads and shows mode selector
- [ ] Creating a conversation works
- [ ] Streaming chat response appears

### Admin function checks

- [ ] Toggle a feature flag — change persists
- [ ] Create a new prompt version — appears in list
- [ ] Mark an incident as resolved

---

## 5. Rollback Procedure

### Immediate rollback (Vercel)

```bash
# List recent deployments
vercel ls

# Promote a previous deployment to production
vercel promote <deployment-url>
```

Or via Vercel dashboard: Deployments → select previous → Promote to Production.

### Database rollback

Prisma does not auto-rollback. If a migration caused issues:

1. Assess whether data was altered or schema-only change
2. For schema-only: manually reverse the migration SQL
3. For data changes: restore from backup before migration
4. Mark the migration as rolled back:
   ```bash
   npx prisma migrate resolve --rolled-back 20240101000000_init
   ```

### Session invalidation after rollback

If the SESSION_SECRET changed or auth logic changed:
```sql
DELETE FROM "UserSession";
```
This forces all users to re-authenticate.

---

## 6. Incident Response

### Severity levels

| Severity | Description | Response Time |
|----------|-------------|---------------|
| CRITICAL | Data breach, auth bypass, total outage | Immediate |
| HIGH | Chat unavailable, payment disruption, mass errors | < 1 hour |
| MEDIUM | Feature degraded, elevated error rate | < 4 hours |
| LOW | Minor bug, isolated user report | Next business day |

### Response steps

1. **Identify** — Check `/admin/incidents` and `/admin/system-logs`
2. **Contain** — Use feature flags to disable affected feature:
   - `/admin/feature-flags` → disable `chat_enabled` if AI is causing harm
   - `/admin/feature-flags` → disable `registration_enabled` if auth is compromised
3. **Rollback** — If caused by deployment, promote previous build
4. **Communicate** — Notify affected users if data was involved
5. **Remediate** — Fix root cause, deploy fix
6. **Post-mortem** — Document in `/admin/incidents`, mark resolved

### Emergency access

If admin panel is inaccessible, use direct DB access:
```sql
-- Grant admin role to a user
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your@email.com';

-- Disable a feature flag
UPDATE "FeatureFlag" SET enabled = false WHERE key = 'chat_enabled';

-- Invalidate all sessions
DELETE FROM "UserSession";
```

---

## 7. Post-Launch Monitoring Checklist

Run weekly for the first month:

- [ ] Check `/admin/incidents` for unresolved items
- [ ] Review `/admin/feedback` for flagged items
- [ ] Check `/api/health` uptime (set up a monitor on Vercel or Uptime Robot)
- [ ] Review `/admin/analytics` for anomalies in usage patterns
- [ ] Check database size and query performance
- [ ] Rotate `SESSION_SECRET` if any session compromise is suspected (forces re-login for all users)
- [ ] Review rate limit incidents for abuse patterns
- [ ] Verify email delivery is working (send a test password reset)

---

## 8. Common Failure Cases and Remedies

| Failure | Symptom | Remedy |
|---------|---------|--------|
| DB connection exhausted | 500 errors on all routes | Add `?connection_limit=1` to DATABASE_URL; use pgBouncer |
| EMAIL not configured | Registration fails silently | Set SMTP_* env vars; check sendEmail logs |
| AI API key invalid | Chat returns 500 | Verify ANTHROPIC_API_KEY or OPENAI_API_KEY in Vercel env |
| SESSION_SECRET changed | All users logged out | This is expected; do not change in production without notice |
| No active PromptVersion | Chat falls back to hardcoded prompts | Run seed or create a version via /admin/prompt-policies |
| Rate limit too aggressive | Legitimate users blocked | Adjust RATE_LIMIT_CHAT_MAX env var or disable via feature flag |
| Prisma schema out of sync | "Table does not exist" errors | Run `npx prisma migrate deploy` |
| Next.js build fails | Deployment fails | Check type errors: `npm run type-check`; check lint: `npm run lint` |
