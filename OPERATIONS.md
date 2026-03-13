# OPERATIONS.md — Laozi AI

## Operational Procedures and Runbooks

---

## 1. Routine Operations

### Daily
- Monitor `/api/health` endpoint (set up external uptime monitor)
- Check `/admin/incidents` for new HIGH or CRITICAL severity items
- Review AI provider usage against billing limits

### Weekly
- Review `/admin/feedback` — process flagged feedback items
- Check `/admin/analytics` for usage anomalies
- Run `npm audit` locally and patch if needed
- Review unresolved incidents in `/admin/incidents`

### Monthly
- Rotate credentials if any suspected compromise
- Review active user sessions for anomalies
- Review AuditLog for unexpected admin actions
- Check database storage growth
- Review and update prompt versions if needed

---

## 2. Database Operations

### Run migrations (production)
```bash
# Uses DIRECT_URL (bypasses pgBouncer)
DATABASE_URL=$DIRECT_URL npx prisma migrate deploy
```

### Check migration status
```bash
npx prisma migrate status
```

### Connect to production DB (read-only queries)
```bash
psql $DATABASE_URL
```

### Useful queries

```sql
-- Active sessions count
SELECT COUNT(*) FROM "UserSession" WHERE "expiresAt" > NOW();

-- Users registered in the last 7 days
SELECT COUNT(*) FROM "User" WHERE "createdAt" > NOW() - INTERVAL '7 days';

-- Messages per day, last 14 days
SELECT DATE("createdAt") as day, COUNT(*) as messages
FROM "Message"
WHERE "createdAt" > NOW() - INTERVAL '14 days'
GROUP BY DATE("createdAt")
ORDER BY day DESC;

-- Unresolved incidents by severity
SELECT severity, COUNT(*) FROM "Incident"
WHERE resolved = false
GROUP BY severity
ORDER BY severity;

-- Rate limit buckets (cleanup check)
SELECT COUNT(*) FROM "RateLimitBucket" WHERE "resetAt" < NOW();

-- Clean up expired rate limit buckets
DELETE FROM "RateLimitBucket" WHERE "resetAt" < NOW();

-- Clean up expired sessions
DELETE FROM "UserSession" WHERE "expiresAt" < NOW();
```

---

## 3. Feature Flag Operations

Feature flags are managed via `/admin/feature-flags`. All changes are audit-logged.

| Key | Default | Effect |
|-----|---------|--------|
| `chat_enabled` | true | Master toggle for chat. Disable to take chat offline. |
| `registration_enabled` | true | Allow new registrations. Disable during maintenance. |
| `feedback_enabled` | true | Allow feedback submission. |
| `note_conversion_enabled` | true | Allow note saving from chat. |
| `contact_enabled` | true | Enable contact form. |
| `rate_limiting_enabled` | true | Master toggle for rate limits. Disable only in dev. |
| `chat_provider_override` | false | Override AI_PROVIDER env var. Set metadata.provider. |

### Emergency chat disable
```sql
UPDATE "FeatureFlag" SET enabled = false WHERE key = 'chat_enabled';
```

### Switch AI provider at runtime
```sql
UPDATE "FeatureFlag"
SET enabled = true, metadata = '{"provider": "openai"}'
WHERE key = 'chat_provider_override';
```

---

## 4. Prompt Version Management

Prompt versions are managed via `/admin/prompt-policies`.

### Create a new version
1. Go to `/admin/prompt-policies`
2. Click "Create new version" for the relevant mode
3. Write the new system prompt
4. Check "Activate immediately" if ready to deploy
5. Save — old active version is automatically deactivated

### Rollback to a previous version
1. Go to `/admin/prompt-policies`
2. Find the previous version for the mode
3. Click "Activate" — this deactivates the current version

### Direct DB activation
```sql
-- Deactivate current active version for a mode
UPDATE "PromptVersion"
SET "isActive" = false
WHERE mode = 'QUIET_MIRROR' AND "isActive" = true;

-- Activate a specific version
UPDATE "PromptVersion"
SET "isActive" = true
WHERE id = '<version_id>';
```

---

## 5. User Management

### Grant admin role
Via admin panel: `/admin/users` → select user → Edit → Role = ADMIN

Or via SQL:
```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'user@example.com';
```

### Force password reset
```sql
-- Invalidate all sessions (forces re-login)
DELETE FROM "UserSession" WHERE "userId" = '<user_id>';
```

### Delete a user
Via admin panel: `/admin/users` → select user → Delete

This cascades to all conversations, messages, notes, and feedback.

---

## 6. Observability

### Structured logs
All application logs are written to stdout in JSON format when `LOG_JSON=true` (recommended for production).

Log fields:
- `ts`: ISO timestamp
- `level`: debug | info | warn | error
- `msg`: message
- Additional context fields per event

### Key log events to monitor

| Event | Level | Action |
|-------|-------|--------|
| `Starting chat stream` | info | Normal operation |
| `Pre-model safety match` | warn | Review incident |
| `Post-model safety match` | warn | Review incident |
| `Failed to persist assistant message` | error | DB issue |
| `AuditLog write failed` | error | DB issue |
| `Incident write failed` | error | DB issue |
| `Failed to send email` | error | SMTP issue |

### Request tracing
Every request includes `X-Request-Id` header (set by middleware). Every chat execution includes an `executionId` (prefixed `exec_`). Use these to correlate logs, incidents, and feedback.

---

## 7. Scaling Considerations

### Current architecture limits
- Database-backed rate limiting adds latency per request (< 10ms on local DB)
- Feature flag cache invalidation is per-instance (eventual consistency across Vercel instances ~30s)
- Email sending is synchronous in the request path — consider moving to a queue if SMTP is slow

### When to scale
- If P99 latency on chat route exceeds 2s (excluding AI generation time): add DB read replicas
- If connection pool exhaustion occurs: reduce `connection_limit` in DATABASE_URL
- If rate limit DB queries become a bottleneck: migrate to Redis (Upstash) for rate limiting

---

## 8. Backup and Recovery

### Database backups
Configure automated backups at the database provider level (Neon, Railway, Supabase all have this).

Recommended: daily backups, 14-day retention for production.

### Manual backup
```bash
pg_dump $DATABASE_URL > laozi_backup_$(date +%Y%m%d).sql
```

### Recovery
```bash
psql $DATABASE_URL < laozi_backup_20240101.sql
```

After recovery, verify:
1. User count matches expected
2. Feature flags are set correctly
3. Prompt versions are intact
4. Run smoke test checklist
