# Rate Limiting Setup - Ottopen

## ✅ Status: ACTIVE

Rate limiting is now configured and active in production using Upstash Redis.

## Configuration

### Upstash Redis

- **Provider**: Upstash Redis (Free tier)
- **Endpoint**: https://<your-upstash-endpoint>
- **Status**: ✅ Connected
- **Environment**: Production + Development

### Rate Limits by Endpoint

| Endpoint            | Limit        | Window     | Limiter    |
| ------------------- | ------------ | ---------- | ---------- |
| **AI Research**     | 10 requests  | 60 seconds | `ai`       |
| **Auth (Login)**    | 5 requests   | 60 seconds | `auth`     |
| **Auth (Signup)**   | 3 requests   | 5 minutes  | `auth`     |
| **Password Reset**  | 2 requests   | 5 minutes  | `auth`     |
| **Password Verify** | 10 requests  | 60 seconds | `auth`     |
| **General API**     | 100 requests | 60 seconds | `api`      |
| **Referrals**       | 20 requests  | 5 minutes  | `referral` |
| **Payouts**         | 5 requests   | 5 minutes  | `payout`   |

## Implementation

### Files

- **Primary**: `src/lib/rate-limit-new.ts` - Upstash SDK implementation
- **Alternative**: `src/lib/rate-limit-redis.ts` - Manual REST API implementation

### Usage Example

```typescript
import { withRateLimit } from '@/src/lib/rate-limit-new'

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = await withRateLimit(request, 'ai')
  if (!rateLimitResult.success) {
    return rateLimitResult.error! // Returns 429 with rate limit headers
  }

  // Your endpoint logic here
}
```

### Response Headers

When rate limited, the API returns:

- **Status**: 429 Too Many Requests
- **Headers**:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining in window
  - `X-RateLimit-Reset`: Unix timestamp when limit resets
  - `Retry-After`: Seconds until retry allowed

### Error Response

```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 45
}
```

## Protected Endpoints

### Currently Implemented

- ✅ `/api/ai/research` - AI research with Perplexity (10/min)
- ✅ `/api/auth/verify-password` - Password verification (10/min)

### Recommended to Add

- [ ] `/api/ai/generate` - AI generation endpoints
- [ ] `/api/auth/signin` - Sign-in endpoint
- [ ] `/api/auth/signup` - Sign-up endpoint
- [ ] `/api/auth/reset-password` - Password reset
- [ ] `/api/referrals/*` - Referral endpoints
- [ ] `/api/payouts/*` - Payout endpoints
- [ ] `/api/scripts/*` - Script operations

## Benefits

1. **DDoS Protection**: Prevents server overload from malicious traffic
2. **Cost Control**: Limits expensive AI API calls
3. **Brute Force Prevention**: Protects auth endpoints from credential stuffing
4. **Fair Usage**: Ensures equitable resource distribution
5. **Fraud Prevention**: Limits referral and payout abuse

## Monitoring

### Upstash Console

- Dashboard: https://console.upstash.com
- View real-time rate limit metrics
- Analytics enabled for all limiters

### Logs

Rate limiting logs appear in:

- Vercel deployment logs
- Browser console (429 responses)
- Application monitoring (if configured)

## Graceful Degradation

If Redis is unavailable:

- Logs warning: `⚠️ Rate limiting disabled`
- Allows all requests through
- Prevents service disruption
- Should be monitored in production

## Environment Variables

### Production (Vercel)

```bash
UPSTASH_REDIS_REST_URL=https://<your-upstash-endpoint>
UPSTASH_REDIS_REST_TOKEN=<your-upstash-token>
```

✅ **Status**: Configured in Vercel

### Development (.env.local)

```bash
UPSTASH_REDIS_REST_URL=https://<your-upstash-endpoint>
UPSTASH_REDIS_REST_TOKEN=<your-upstash-token>
```

✅ **Status**: Configured locally

## Testing Rate Limits

### Manual Testing

```bash
# Test AI endpoint (10 requests/minute limit)
for i in {1..12}; do
  curl -X POST https://ottopen.app/api/ai/research \
    -H "Content-Type: application/json" \
    -d '{"query":"test"}' \
    -w "\nStatus: %{http_code}\n"
  sleep 1
done
# First 10 should succeed (200), last 2 should fail (429)
```

### Expected Behavior

- Requests 1-10: ✅ Success (200)
- Requests 11+: ❌ Rate limited (429)
- After 60 seconds: ✅ Limit resets

## Next Steps

1. **Add rate limiting to remaining endpoints** (see "Recommended to Add" section)
2. **Monitor usage patterns** in Upstash console
3. **Adjust limits** based on actual usage data
4. **Set up alerts** for rate limit violations
5. **Consider tier-based limits** (Free vs Pro vs Studio)

## Troubleshooting

### Rate limit not working

1. Check Vercel environment variables are set
2. Verify Upstash Redis is accessible
3. Check logs for connection errors
4. Ensure using latest deployment

### Too restrictive

1. Adjust limits in `src/lib/rate-limit-new.ts`
2. Consider per-user limits instead of IP-based
3. Implement tier-based rate limits

### False positives

1. Review IP detection logic (X-Forwarded-For header)
2. Consider user ID-based limiting for authenticated users
3. Whitelist trusted IPs if needed

## Security Notes

- ✅ Credentials stored securely in Vercel environment
- ✅ Redis connection uses HTTPS/TLS
- ✅ Token never exposed in client-side code
- ✅ Rate limits applied server-side only
- ✅ Graceful degradation prevents service disruption

## Cost

- **Upstash Free Tier**: 10,000 requests/day
- **Current usage**: Well within free tier
- **Upgrade path**: Available if needed

---

**Last Updated**: October 8, 2025
**Status**: ✅ Production Ready with Rate Limiting Active
