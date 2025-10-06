# 🚀 Production Deployment Guide - Ottopen

## 🚨 CRITICAL SECURITY ACTIONS (DO THIS FIRST!)

### 1. Rotate ALL Exposed API Keys IMMEDIATELY

**You exposed these API keys in chat - they must be rotated NOW:**

#### Anthropic API Key

1. Go to: https://console.anthropic.com/settings/keys
2. Delete the exposed key: `sk-ant-api03-WSFTeRxA...`
3. Create a new API key
4. Save it securely (use password manager)

#### OpenAI API Key

1. Go to: https://platform.openai.com/api-keys
2. Revoke the exposed key: `sk-proj-Gdh2daWIXXA...`
3. Create a new API key
4. Save it securely

#### Perplexity API Key

1. Go to Perplexity dashboard
2. Regenerate/revoke the exposed key: `pplx-lUs5HrBHOa...`
3. Create a new API key
4. Save it securely

---

## ✅ Pre-Deployment Checklist

### Security

- [x] `.env` files are gitignored
- [x] No hardcoded secrets in codebase
- [x] Security headers configured
- [ ] All API keys rotated (DO THIS NOW!)
- [ ] Environment variables configured in production

### Code Quality

- [x] Build passes: `npm run build`
- [x] TypeScript compiles without errors
- [x] ESLint passes (1 warning about img tag - non-critical)
- [ ] All tests pass: `npm test`

### Configuration

- [x] `next.config.js` production-ready
- [x] Security headers enabled
- [x] Image optimization configured
- [x] Sentry monitoring configured

---

## 📋 Required Environment Variables

### Deployment Platform (Vercel/etc.)

Set these in your hosting platform's environment variables:

```bash
# Supabase (Production)
NEXT_PUBLIC_SUPABASE_URL=https://wkvatudgffosjfwqyxgt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key  # ⚠️ CRITICAL - Get from Supabase Dashboard

# App Configuration
NEXT_PUBLIC_APP_URL=https://ottopen.app
NODE_ENV=production

# Security - CRITICAL (MUST BE SET)
NEXTAUTH_SECRET=<GENERATE_NEW_SECRET>  # Generate with: openssl rand -base64 32
NEXTAUTH_URL=https://ottopen.app
INTERNAL_WEBHOOK_SECRET=<GENERATE_NEW_SECRET>  # Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# AI Services (USE NEW ROTATED KEYS!)
ANTHROPIC_API_KEY=your_NEW_anthropic_key_here
OPENAI_API_KEY=your_NEW_openai_key_here
PERPLEXITY_API_KEY=your_NEW_perplexity_key_here

# Stripe
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key

# Upstash Redis (for rate limiting - RECOMMENDED)
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token

# Monitoring (Optional but recommended)
SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_ORG=your_sentry_org
SENTRY_PROJECT=your_sentry_project

# Email (if using SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

---

## 🔒 Security Best Practices

### 1. API Key Management

- ✅ Never commit `.env` files to git
- ✅ Use different keys for dev/staging/production
- ✅ Rotate keys regularly (quarterly minimum)
- ✅ Use password manager for key storage
- ✅ Limit API key permissions to minimum required

### 2. CORS & Origins

The app is configured to only allow server actions from your domain in production.

### 3. Security Headers (Already Configured)

- ✅ X-Frame-Options: DENY (prevents clickjacking)
- ✅ X-Content-Type-Options: nosniff
- ✅ X-XSS-Protection: enabled
- ✅ Referrer-Policy: strict-origin-when-cross-origin
- ✅ Permissions-Policy: restricts camera/mic/location
- ✅ Powered-By header: removed

### 4. Rate Limiting

Consider adding rate limiting to API routes:

```typescript
// Example: /app/api/ai/*/route.ts
import { ratelimit } from '@/lib/ratelimit'

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const { success } = await ratelimit.limit(ip)

  if (!success) {
    return new Response('Too Many Requests', { status: 429 })
  }

  // Your API logic
}
```

---

## 🚀 Deployment Steps

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI** (if not already):

   ```bash
   npm i -g vercel
   ```

2. **Link Project**:

   ```bash
   vercel link
   ```

3. **Set Environment Variables**:

   ```bash
   # Set variables via CLI
   vercel env add ANTHROPIC_API_KEY production
   vercel env add OPENAI_API_KEY production
   # ... etc for all required vars

   # OR set via Vercel Dashboard:
   # https://vercel.com/your-team/ottopen/settings/environment-variables
   ```

4. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

### Option 2: Other Platforms (Railway, Fly.io, etc.)

1. Set all environment variables in platform dashboard
2. Configure build command: `npm run build`
3. Configure start command: `npm start`
4. Set Node.js version: `20.x` (in package.json or platform config)

---

## 🧪 Post-Deployment Testing

### 1. Health Check

```bash
curl https://ottopen.com/api/health
```

### 2. Test Authentication Flow

1. Sign up with test email
2. Check Supabase email template arrives
3. Verify email confirmation works
4. Test password reset flow

### 3. Test AI Features

1. Create a manuscript
2. Test AI brainstorm
3. Test AI expand/rewrite
4. Check API usage in provider dashboards

### 4. Test Subscription Flow

1. Navigate to subscription page
2. Test Stripe checkout
3. Verify webhook handling
4. Check subscription status updates

### 5. Security Headers

```bash
curl -I https://ottopen.com | grep -E "X-Frame|X-Content|X-XSS|Referrer"
```

---

## 📊 Monitoring & Logging

### Sentry Setup (Recommended)

1. Create project at https://sentry.io
2. Add environment variables (see above)
3. Test error tracking:
   ```bash
   # Trigger test error
   curl https://ottopen.com/api/sentry-example-api
   ```

### Application Monitoring

- Monitor Vercel Analytics
- Check Supabase Dashboard for:
  - Auth metrics
  - Database performance
  - API usage
- Monitor AI provider usage:
  - Anthropic: https://console.anthropic.com/usage
  - OpenAI: https://platform.openai.com/usage
  - Perplexity: Check dashboard

---

## 🔄 Continuous Deployment

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

      - name: Deploy to Vercel
        run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## 🐛 Troubleshooting

### Build Failures

- Check environment variables are set
- Verify Node.js version is 18+
- Clear `.next` cache: `rm -rf .next`

### Authentication Issues

- Verify Supabase URL configuration
- Check redirect URLs in Supabase dashboard
- Ensure cookies are enabled

### API Errors

- Check API key validity
- Monitor rate limits
- Review Sentry error logs

### Email Template Issues

- Verify templates uploaded to Supabase
- Check spam filter warnings resolved
- Test with different email providers

---

## 📞 Support & Resources

### Documentation

- Next.js: https://nextjs.org/docs
- Supabase: https://supabase.com/docs
- Vercel: https://vercel.com/docs

### Monitoring Dashboards

- Vercel: https://vercel.com/dashboard
- Supabase: https://app.supabase.com
- Anthropic: https://console.anthropic.com
- OpenAI: https://platform.openai.com
- Stripe: https://dashboard.stripe.com

---

## 🎯 Post-Launch Checklist

- [ ] All API keys rotated and secured
- [ ] Environment variables configured in production
- [ ] DNS configured and SSL active
- [ ] Monitoring dashboards set up
- [ ] Error tracking configured
- [ ] Backup strategy established
- [ ] Documentation updated
- [ ] Team has access to necessary dashboards
- [ ] Email templates applied and tested
- [ ] Rate limiting configured
- [ ] Security headers verified
- [ ] Performance metrics baseline established

---

**Last Updated**: 2025-01-02
**Version**: 1.0.0

⚠️ **REMEMBER**: Rotate those exposed API keys immediately before deploying!
