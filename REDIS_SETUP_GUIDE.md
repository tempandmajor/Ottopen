# Redis Rate Limiting Setup Guide

This guide walks you through setting up Upstash Redis for production-grade rate limiting on Ottopen.

---

## Why Redis Rate Limiting is Critical

**Current Issue**: The app uses in-memory rate limiting (`src/lib/rate-limit.ts`), which:

- ❌ Does not work across multiple serverless instances (Vercel functions)
- ❌ Resets on every deployment
- ❌ Cannot prevent API abuse at scale
- ❌ Each serverless function has its own memory = ineffective rate limiting

**With Redis**:

- ✅ Shared state across all serverless instances
- ✅ Persistent rate limit counters
- ✅ Prevents API abuse and DDoS attacks
- ✅ Protects AI API costs from exhaustion
- ✅ Production-ready horizontal scaling

---

## Step 1: Create Upstash Redis Database

### Option A: Upstash (Recommended - Free Tier Available)

1. **Sign up for Upstash**
   - Go to https://upstash.com
   - Click "Sign Up" (free tier: 10,000 commands/day)
   - Authenticate with GitHub or email

2. **Create a Redis Database**
   - Click "Create Database"
   - Choose a name: `ottopen-rate-limiting`
   - Select region: **US East** (closest to your Vercel region)
   - Choose "Global" for multi-region replication (paid) or "Regional" (free)
   - Click "Create"

3. **Get Credentials**
   - On the database dashboard, click "REST API" tab
   - Copy these values:
     - `UPSTASH_REDIS_REST_URL` (e.g., `https://us1-xxx.upstash.io`)
     - `UPSTASH_REDIS_REST_TOKEN` (long token string)

### Option B: Vercel KV (Alternative if using Vercel)

1. **Create Vercel KV Store**
   - Go to Vercel Dashboard → Storage → Create
   - Select "KV" (powered by Upstash)
   - Choose a name: `ottopen-rate-limiting`
   - Click "Create"

2. **Get Credentials**
   - Vercel automatically adds these to your project:
     - `KV_REST_API_URL`
     - `KV_REST_API_TOKEN`
     - `KV_REST_API_READ_ONLY_TOKEN`

---

## Step 2: Add Environment Variables

### For Development (`.env.local`)

Add these lines to your `.env.local` file:

```bash
# Upstash Redis for Rate Limiting
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_token_here
```

### For Production (Vercel)

#### Via Vercel Dashboard:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add each variable:
   - **Name**: `UPSTASH_REDIS_REST_URL`
   - **Value**: Your Upstash REST URL
   - **Environment**: Production, Preview, Development (check all)
   - Click "Save"
3. Repeat for `UPSTASH_REDIS_REST_TOKEN`

#### Via Vercel CLI:

```bash
# Add production variables
npx vercel env add UPSTASH_REDIS_REST_URL production
npx vercel env add UPSTASH_REDIS_REST_TOKEN production

# Add to preview/development if needed
npx vercel env add UPSTASH_REDIS_REST_URL preview
npx vercel env add UPSTASH_REDIS_REST_TOKEN preview
```

---

## Step 3: Update Rate Limiting Code

The codebase already has Redis rate limiting implementation at `src/lib/rate-limit-redis.ts`. We need to switch from in-memory to Redis.

### Update API Routes to Use Redis

Find all files using the old rate limiter and update them:

```bash
# Search for files using the old rate limiter
grep -r "from '@/src/lib/rate-limit'" --include="*.ts" app/api/
```

**Replace**:

```typescript
import { RateLimiter } from '@/src/lib/rate-limit'
```

**With**:

```typescript
import { createRedisRateLimiter } from '@/src/lib/rate-limit-redis'
```

**Example Update** (`app/api/ai/*/route.ts`):

**Before**:

```typescript
import { RateLimiter } from '@/src/lib/rate-limit'

const limiter = new RateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
})
```

**After**:

```typescript
import { createRedisRateLimiter } from '@/src/lib/rate-limit-redis'

const limiter = createRedisRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
  prefix: 'ai-request', // unique prefix per route
})
```

---

## Step 4: Test Rate Limiting

### Local Testing

1. **Start development server**:

   ```bash
   npm run dev
   ```

2. **Test an AI endpoint**:

   ```bash
   # Make multiple rapid requests (should be rate limited after 10 requests)
   for i in {1..15}; do
     curl -X POST http://localhost:3000/api/ai/brainstorm \
       -H "Content-Type: application/json" \
       -d '{"prompt": "test"}' \
       -w "\nStatus: %{http_code}\n"
     sleep 0.5
   done
   ```

3. **Expected behavior**:
   - First 10 requests: `200 OK`
   - Requests 11-15: `429 Too Many Requests`
   - After 60 seconds: Rate limit resets

### Production Testing

After deployment:

```bash
# Replace with your production URL
PROD_URL="https://ottopen.app"

for i in {1..15}; do
  curl -X POST $PROD_URL/api/ai/brainstorm \
    -H "Content-Type: application/json" \
    -d '{"prompt": "test"}' \
    -w "\nStatus: %{http_code}\n"
  sleep 0.5
done
```

---

## Step 5: Monitor Redis Usage

### Upstash Dashboard

1. Go to Upstash Dashboard → Your Database
2. Check metrics:
   - **Commands/day**: Should stay under free tier (10,000/day)
   - **Data size**: Rate limit keys are small (~100 bytes each)
   - **Throughput**: Monitor peak usage times

### Set Up Alerts (Optional)

1. Upstash Dashboard → Alerts
2. Create alert for:
   - Commands approaching limit (e.g., 8,000/day)
   - High error rate

---

## Step 6: Verify Rate Limiting is Working

### Check Redis Keys

Using Upstash CLI or dashboard:

```bash
# List all rate limit keys (via Upstash Dashboard → Data Browser)
KEYS ratelimit:*
```

You should see keys like:

```
ratelimit:ai-request:127.0.0.1
ratelimit:auth:192.168.1.1
ratelimit:api:10.0.0.1
```

### Verify Across Multiple Instances

Deploy to Vercel (which uses multiple instances):

```bash
# Deploy
npx vercel --prod

# Test rate limiting - should work consistently across requests
# even if they hit different serverless instances
```

---

## Troubleshooting

### Issue: "Redis connection failed"

**Solution**:

- Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set
- Check URL format: must start with `https://`
- Ensure token is correct (no extra spaces)

### Issue: Rate limiting not working

**Solution**:

- Check Redis keys exist: Upstash Dashboard → Data Browser
- Verify environment variables are loaded: Add `console.log(process.env.UPSTASH_REDIS_REST_URL)` in route handler
- Check rate limiter is using Redis, not in-memory fallback

### Issue: "Too many commands" on free tier

**Solution**:

- Upstash free tier: 10,000 commands/day
- Each rate limit check = 2-3 commands
- If exceeded, upgrade to paid tier ($0.20/100K commands) or optimize rate limit windows

### Issue: Rate limits reset on deployment

**Solution**:

- This means you're still using in-memory rate limiting
- Verify all routes import from `rate-limit-redis`, not `rate-limit`
- Check environment variables are set in Vercel

---

## Cost Estimation

### Upstash Pricing

**Free Tier**:

- 10,000 commands/day
- Enough for ~3,000 API requests/day (assuming 3 commands per request)

**Pay-as-you-go**:

- $0.20 per 100,000 commands
- For 100,000 API requests/day: ~$0.60/day = **$18/month**

**Example Calculation**:

- 1,000 users/day
- Each user makes 10 API calls
- 10,000 API calls/day × 3 commands = 30,000 commands/day
- Cost: 30,000 × 30 days = 900,000 commands/month
- Monthly cost: **$1.80/month**

---

## Security Best Practices

1. **Never commit Redis credentials**
   - Keep in `.env.local` (already in `.gitignore`)
   - Use Vercel environment variables for production

2. **Rotate tokens periodically**
   - Upstash Dashboard → Settings → Regenerate Token
   - Update in Vercel environment variables

3. **Use different Redis instances**
   - Development: Separate database
   - Production: Separate database
   - Prevents dev testing from affecting production rate limits

4. **Monitor for abuse**
   - Set up Upstash alerts
   - Monitor Redis command count
   - Check for unusual traffic patterns

---

## Deployment Checklist

Before deploying to production:

- [ ] Upstash Redis database created
- [ ] `UPSTASH_REDIS_REST_URL` added to Vercel env vars
- [ ] `UPSTASH_REDIS_REST_TOKEN` added to Vercel env vars
- [ ] All API routes updated to use `rate-limit-redis`
- [ ] Local testing shows rate limiting works
- [ ] Redis keys visible in Upstash dashboard
- [ ] Upstash alerts configured
- [ ] `.env.local` has Redis credentials (for local dev)
- [ ] `.env.example` documents Redis variables (already done)

---

## Next Steps After Setup

1. **Customize Rate Limits per Endpoint**
   - AI endpoints: 10 requests/minute per user
   - Auth endpoints: 5 requests/minute per IP
   - Public API: 100 requests/hour per API key

2. **Add User-Based Rate Limiting**
   - Currently: IP-based
   - Upgrade: Track by `user_id` for authenticated requests
   - Prevents VPN/proxy bypass

3. **Implement Tiered Rate Limits**
   - Free tier: 10 AI requests/day
   - Pro tier: 100 AI requests/day
   - Studio tier: Unlimited

4. **Monitor and Optimize**
   - Review Upstash metrics weekly
   - Adjust rate limits based on usage patterns
   - Set up alerting for abuse

---

## Support

- **Upstash Docs**: https://upstash.com/docs/redis/overall/getstarted
- **Vercel KV Docs**: https://vercel.com/docs/storage/vercel-kv
- **Rate Limiting Best Practices**: https://upstash.com/docs/redis/features/ratelimiting

---

**Status**: Once this guide is completed, the app will have production-ready rate limiting! 🚀
