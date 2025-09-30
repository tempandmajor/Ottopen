# Deployment Guide

## Production Deployment Checklist

### Pre-Deployment

- [ ] All environment variables configured in production
- [ ] Database migrations applied
- [ ] Stripe webhooks configured
- [ ] Sentry DSN configured
- [ ] Vercel KV (Redis) provisioned
- [ ] Domain configured with SSL
- [ ] All tests passing (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] TypeScript checks pass (`npm run typecheck`)
- [ ] Linting passes (`npm run lint`)

### Environment Variables

Configure these in Vercel dashboard or your hosting platform:

#### Required Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Application
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx...

# NextAuth
NEXTAUTH_SECRET=your-32+-character-secret-key
NEXTAUTH_URL=https://your-domain.com

# Sentry (Recommended)
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

#### Vercel KV (Automatically provided when provisioned)

```bash
KV_URL=redis://xxx
KV_REST_API_URL=https://xxx
KV_REST_API_TOKEN=xxx
KV_REST_API_READ_ONLY_TOKEN=xxx
```

---

## Deployment Steps

### 1. Vercel Deployment (Recommended)

#### Initial Setup

1. **Install Vercel CLI:**

   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**

   ```bash
   vercel login
   ```

3. **Link project:**

   ```bash
   vercel link
   ```

4. **Configure environment variables:**

   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   # ... add all required variables
   ```

5. **Deploy to production:**
   ```bash
   vercel --prod
   ```

#### Provision Vercel KV

1. Go to Vercel Dashboard → Storage → Create Database
2. Select KV (Redis)
3. Choose a name (e.g., `ottopen-redis`)
4. Environment variables are automatically added

#### Configure GitHub Integration

1. Connect GitHub repository in Vercel dashboard
2. Enable automatic deployments for main branch
3. Configure branch protection rules in GitHub
4. Every push to `main` will trigger deployment after CI passes

### 2. Database Setup

#### Apply Migrations

```bash
# Using Supabase CLI
npx supabase db push

# Or apply manually via Supabase dashboard SQL editor
```

#### Initialize Application Statistics

```sql
-- Run once after deployment
SELECT update_application_statistics();
```

#### Set Up Database Backups

1. Configure automated backups in Supabase dashboard
2. Recommended: Daily backups with 7-day retention minimum
3. Test restore procedure monthly

### 3. Stripe Configuration

#### Set Up Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook signing secret to environment variables

#### Configure Products

1. Create products in Stripe dashboard
2. Note down price IDs
3. Update application configuration

### 4. Monitoring Setup

#### Sentry Configuration

1. Create project at sentry.io
2. Copy DSN to environment variables
3. Configure alerts for:
   - Error rate > 1%
   - Response time > 3s
   - 500 errors

#### Vercel Analytics

Enable in project settings:

- Web Analytics
- Speed Insights
- Log Drains (optional)

#### Health Check Monitoring

Set up external monitoring (e.g., UptimeRobot, Pingdom):

- **Endpoint:** `https://your-domain.com/api/health`
- **Interval:** 5 minutes
- **Alert:** On status code != 200

### 5. Performance Optimization

#### Configure CDN

1. Cloudflare (recommended):
   - Add domain to Cloudflare
   - Enable Auto Minify (JS, CSS, HTML)
   - Enable Brotli compression
   - Set Browser Cache TTL to 4 hours
   - Enable Always Use HTTPS

#### Image Optimization

- Images automatically optimized by Next.js
- Configure custom loader if needed
- Consider using Cloudinary or imgix for heavy usage

#### Caching Strategy

```javascript
// Already configured in next.config.js
- Static assets: 1 year
- API responses: Vary by endpoint
- Images: 60 seconds minimum
```

---

## Post-Deployment

### 1. Verify Deployment

Run through this checklist:

```bash
# Check health endpoint
curl https://your-domain.com/api/health

# Verify authentication
curl https://your-domain.com/api/auth/status

# Check rate limiting headers
curl -I https://your-domain.com/api/health

# Test error handling
curl https://your-domain.com/api/nonexistent
```

### 2. Performance Testing

```bash
# Install k6 for load testing
brew install k6

# Run load test
k6 run scripts/load-test.js
```

Sample load test script:

```javascript
// scripts/load-test.js
import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  stages: [
    { duration: '1m', target: 50 }, // Ramp up to 50 users
    { duration: '3m', target: 50 }, // Stay at 50 users
    { duration: '1m', target: 100 }, // Ramp up to 100 users
    { duration: '3m', target: 100 }, // Stay at 100 users
    { duration: '1m', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'], // Error rate under 1%
  },
}

export default function () {
  const res = http.get('https://your-domain.com/api/health')
  check(res, { 'status is 200': r => r.status === 200 })
  sleep(1)
}
```

### 3. Security Audit

- [ ] Run `npm audit` and fix critical vulnerabilities
- [ ] Verify security headers with securityheaders.com
- [ ] Test rate limiting on auth endpoints
- [ ] Verify RLS policies in Supabase
- [ ] Check for exposed secrets in code
- [ ] Review CORS configuration
- [ ] Test authentication flows

### 4. Monitoring Setup

#### Create Dashboard

Monitor these metrics:

- Request rate (req/min)
- Error rate (%)
- Response time (p50, p95, p99)
- Database query time
- Memory usage
- CPU usage

#### Set Up Alerts

Configure alerts for:

| Alert           | Condition          | Severity |
| --------------- | ------------------ | -------- |
| High error rate | > 5%               | Critical |
| Slow response   | p95 > 2s           | Warning  |
| Database down   | Health check fails | Critical |
| High memory     | > 80%              | Warning  |
| Rate limit hit  | > 100/min per IP   | Info     |

---

## Rollback Procedure

If issues occur after deployment:

### Quick Rollback (Vercel)

```bash
# List recent deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]
```

### Via Vercel Dashboard

1. Go to Deployments tab
2. Find last working deployment
3. Click "..." → Promote to Production

### Database Rollback

```bash
# Restore from backup (Supabase)
npx supabase db dump > backup.sql
npx supabase db reset
```

---

## Scaling Considerations

### Horizontal Scaling

Vercel automatically scales:

- No configuration needed
- Serverless functions scale to zero
- Edge network for global performance

### Database Scaling

When to upgrade Supabase tier:

- Database CPU > 80%
- Connection pool exhausted
- Query performance degradation
- Storage > 80% of quota

### Redis Scaling

Upgrade Vercel KV when:

- Memory usage > 80%
- Connection errors occur
- Response time increases

---

## Disaster Recovery

### Backup Strategy

1. **Database:**
   - Automated daily backups (Supabase)
   - Manual backup before major changes
   - Test restore monthly

2. **Application:**
   - Git repository is source of truth
   - Tagged releases for each deployment
   - Environment variables backed up securely

3. **User Data:**
   - Database backups include all user data
   - Stripe maintains payment history
   - Images stored in Supabase Storage with replication

### Recovery Time Objectives (RTO)

- **Critical services:** 1 hour
- **Full restoration:** 4 hours
- **Data loss tolerance:** 24 hours (last backup)

### Emergency Contacts

Maintain list of:

- Vercel support
- Supabase support
- Stripe support
- DNS provider support
- On-call engineer contacts

---

## Maintenance

### Regular Tasks

**Daily:**

- Monitor error rates in Sentry
- Check health endpoint status
- Review slow query log

**Weekly:**

- Review and respond to security alerts
- Update dependencies with security patches
- Check database performance metrics
- Review rate limiting logs

**Monthly:**

- Update dependencies
- Review and rotate API keys
- Performance audit
- Security audit
- Test disaster recovery
- Review and optimize database queries

### Dependency Updates

```bash
# Check for updates
npm outdated

# Update safely
npm update

# Test thoroughly
npm test
npm run build

# Deploy
git commit -am "chore: update dependencies"
git push
```

---

## Support

For deployment issues:

- GitHub Issues: [your-repo/issues](https://github.com/your-repo/issues)
- Email: devops@ottopen.com
- Slack: #deployments
