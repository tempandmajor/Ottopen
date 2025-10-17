# Emergency Secret Rotation Checklist

All credentials that previously appeared in the repository must be treated as compromised.
Follow the steps below before deploying any new build.

## 1. Rotate Every Credential

- **Supabase**: Generate new anon and service-role keys for project `wkvatudgffosjfwqyxgt`. Revoke all refresh tokens and invalidate API keys in the dashboard.
- **Stripe**: Create new secret key and webhook signing secret for the production workspace.
- **SendGrid**: Generate a new API key with least-privilege scopes; delete the exposed key.
- **Upstash Redis**: Rotate the REST token (and optionally the endpoint) from the Upstash console.
- **Internal webhook secrets**: Regenerate `INTERNAL_WEBHOOK_SECRET` and any other shared secrets used by background services.
- **Test accounts**: Change passwords for any user credentials previously committed.

After rotation, update the values in Vercel (Production, Preview, Development) and any local `.env` files that are **not** committed to git.

## 2. Clean Up the Repository

- Secrets in `.env.*` have been replaced with placeholders; keep real values only in untracked local files.
- Run `git ls-files | grep '.env'` to confirm no new environment files are tracked.
- Force-push a rewritten history (e.g. using `git filter-repo` or BFG) if external distribution of the prior secrets is a concern.

## 3. Harden Supabase Project

- Enable email confirmation and require MFA for all organization members.
- Review the Auth → Logs tab for suspicious activity and sign out all sessions older than the rotation timestamp.
- Audit Row-Level Security policies for tables touched by service-role functions to ensure least privilege.

## 4. Verify Deployment Configuration

- After updating secrets, trigger a fresh Vercel deployment.
- Visit `/api/auth/status` and `/api/health` to confirm runtime configuration succeeds.
- Run `npm run test` locally with the new `.env.local` to catch missing keys before pushing.

Document the rotation timestamp and responsible person in your internal runbook so future audits can verify the recovery.
