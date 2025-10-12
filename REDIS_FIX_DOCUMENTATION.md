# Upstash Redis Environment Variable Fix

## Problem Summary

The application was experiencing recurring build failures in Vercel production with the following error:

```
[Upstash Redis] The redis url contains whitespace or newline, which can cause errors!
[Upstash Redis] The redis token contains whitespace or newline, which can cause errors!
c [UrlError]: Upstash Redis client was passed an invalid URL. You should pass a URL starting with https.
Received: "https://smiling-cricket-21202.upstash.io\n".
```

### Root Causes

1. **Environment variables containing whitespace**: When copying/pasting Redis credentials into Vercel dashboard, trailing newlines or whitespace were accidentally included
2. **Module-level Redis client creation**: The rate limiter created Redis clients at import time (during Next.js build), causing build-time errors
3. **Insufficient validation**: No defensive checks for malformed environment variables with clear error messages

## Solution Implemented

The fix implements a **three-layered defensive approach**:

### Layer 1: Environment Variable Validation Utility (`src/lib/env-validation.ts`)

Created a comprehensive validation utility that:

- **Validates URL format**: Ensures URLs start with the correct protocol (http/https)
- **Sanitizes whitespace**: Automatically trims leading/trailing whitespace and removes newlines
- **Provides clear warnings**: Logs descriptive warnings when whitespace is detected
- **Validates tokens**: Checks token length and format
- **Detailed error messages**: Gives actionable feedback when validation fails

**Key Functions:**

```typescript
// Validate and sanitize URL environment variables
export function validateUrlEnvVar(
  key: string,
  required: boolean = false,
  protocol: 'http' | 'https' = 'https'
): ValidationResult

// Validate and sanitize token/secret environment variables
export function validateTokenEnvVar(
  key: string,
  required: boolean = false,
  minLength: number = 10
): ValidationResult

// Get validated env var or throw descriptive error
export function getValidatedEnvVar(
  key: string,
  type: 'url' | 'token' = 'token',
  options?: {...}
): string | null
```

### Layer 2: Lazy Redis Client Initialization (`src/lib/rate-limit-redis.ts`)

**Before (Problematic):**

```typescript
// Created Redis client at module load time
export class RedisRateLimiter {
  private redis: RedisClient | null

  constructor(options: RateLimitOptions) {
    this.redis = createRedisClient() // ❌ Executes during build
  }
}

// Module-level instantiation
export const authRateLimiters = {
  signin: new RedisRateLimiter({...}), // ❌ Runs at import time
}
```

**After (Fixed):**

```typescript
// Lazy singleton pattern
let _redisClient: RedisClient | null | undefined = undefined

function getRedisClient(): RedisClient | null {
  if (_redisClient !== undefined) {
    return _redisClient // Return cached instance
  }

  // Initialize with validation only when first accessed
  const upstashUrl = getValidatedEnvVar('UPSTASH_REDIS_REST_URL', 'url', {...})
  const upstashToken = getValidatedEnvVar('UPSTASH_REDIS_REST_TOKEN', 'token', {...})

  if (upstashUrl && upstashToken) {
    _redisClient = createRedisClientImplementation(upstashUrl, upstashToken)
    return _redisClient
  }

  _redisClient = null
  return _redisClient
}

export class RedisRateLimiter {
  // No Redis client stored in constructor

  async checkRateLimit(request: NextRequest): Promise<RateLimitResult> {
    const redis = getRedisClient() // ✅ Only created when actually used
    // ...
  }
}
```

### Layer 3: Graceful Fallback

When Redis is not configured or fails:

- **Development**: Logs warning, allows requests through
- **Production**: Logs critical error, but doesn't crash - allows requests with warning
- **Error handling**: All Redis operations wrapped in try/catch with fallback behavior

```typescript
async checkRateLimit(request: NextRequest): Promise<RateLimitResult> {
  const redis = getRedisClient()

  if (!redis) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[RATE_LIMIT] CRITICAL: Redis not configured!')
    }
    // Fallback: allow request but warn
    return { success: true, limit: this.maxRequests, ... }
  }

  try {
    // Redis rate limiting logic
  } catch (error) {
    console.error('[RATE_LIMIT] Redis error, allowing request:', error)
    // Fallback: allow request on error
    return { success: true, limit: this.maxRequests, ... }
  }
}
```

## Benefits

### 1. Prevents Build-Time Errors

- Redis clients are no longer created during Next.js build phase
- Malformed environment variables don't crash the build
- Build succeeds even without Redis credentials (uses fallback)

### 2. Better Error Messages

Instead of cryptic Upstash errors, you get:

```
[ENV_VALIDATION] Environment variable UPSTASH_REDIS_REST_URL contains leading or trailing whitespace.
This has been automatically trimmed. Please update the value in your deployment settings.

[REDIS] Using Upstash Redis for rate limiting
```

### 3. Automatic Sanitization

- Whitespace is automatically trimmed
- Newlines are automatically removed
- URLs are validated for correct protocol
- Tokens are validated for minimum length

### 4. Production Resilience

- Rate limiting gracefully degrades if Redis is unavailable
- Application continues to function (though without rate limiting)
- Clear logging for debugging production issues

## Testing

✅ **Local Build Test**: Successfully builds without Redis credentials
✅ **Production Build Test**: Successfully builds with validation warnings
✅ **Runtime Test**: Redis client created only when rate limiting is actually used

## Deployment Checklist

When deploying to Vercel or any environment:

### 1. Clean Environment Variables

If you encounter Redis errors, check your environment variables:

```bash
# In Vercel dashboard, ensure no trailing whitespace/newlines in:
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

### 2. Monitor Logs

After deployment, check for validation warnings:

```
✅ Good: [ENV_VALIDATION] UPSTASH_REDIS_REST_URL validated successfully
⚠️  Warning: [ENV_VALIDATION] UPSTASH_REDIS_REST_URL contains whitespace (auto-fixed)
❌ Error: [ENV_VALIDATION] UPSTASH_REDIS_REST_URL is not a valid URL
```

### 3. Verify Rate Limiting

Check that Redis is being used:

```
[REDIS] Using Upstash Redis for rate limiting
```

If you see this instead, Redis is not configured:

```
[REDIS] No Redis configuration found. Rate limiting will use in-memory fallback.
```

## Preventing Future Issues

### Do's ✅

- Copy/paste environment variables carefully (no trailing spaces/newlines)
- Use the validation utility for all sensitive environment variables
- Use lazy initialization for services that connect to external resources
- Log validation warnings in development to catch issues early

### Don'ts ❌

- Don't create external service clients at module import time
- Don't assume environment variables are well-formed
- Don't crash the application if optional services (like Redis) are unavailable
- Don't ignore validation warnings in logs

## Related Files

- `src/lib/env-validation.ts` - Environment variable validation utility (NEW)
- `src/lib/rate-limit-redis.ts` - Redis rate limiter with lazy initialization (UPDATED)
- All API routes using rate limiting automatically benefit from these fixes

## Impact

This fix ensures that:

1. **Builds never fail** due to Redis configuration issues
2. **Validation warnings** alert developers to fix environment variables
3. **Production deployments** are resilient to Redis unavailability
4. **Future services** can use the validation utility to prevent similar issues

## Monitoring

To monitor if this issue recurs:

1. Check Vercel build logs for `[ENV_VALIDATION]` messages
2. Check production logs for `[REDIS]` initialization messages
3. Look for `[RATE_LIMIT]` errors indicating Redis failures

If you see repeated warnings about whitespace, update the environment variables in your deployment platform's dashboard to remove the trailing whitespace.
