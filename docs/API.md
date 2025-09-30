# API Documentation

## Overview

This document provides comprehensive documentation for all API endpoints in the Ottopen application.

**Base URL:** `https://your-domain.com/api`

## Authentication

Most endpoints require authentication via Supabase session cookies. Protected endpoints will return `401 Unauthorized` if the user is not authenticated.

## Error Responses

All errors follow a standardized format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}, // Optional, only in development
    "path": "/api/endpoint",
    "timestamp": "2025-09-29T12:00:00.000Z"
  }
}
```

### Error Codes

- `BAD_REQUEST` (400) - Invalid request parameters
- `UNAUTHORIZED` (401) - Authentication required
- `FORBIDDEN` (403) - Insufficient permissions
- `NOT_FOUND` (404) - Resource not found
- `VALIDATION_ERROR` (422) - Request validation failed
- `RATE_LIMIT_EXCEEDED` (429) - Too many requests
- `INTERNAL_ERROR` (500) - Server error
- `DATABASE_ERROR` (500) - Database operation failed

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Auth endpoints:** 5 requests/minute (sign in), 3 requests/5 minutes (sign up)
- **General API:** 100 requests/minute
- **Password reset:** 2 requests/5 minutes

Rate limit information is provided in response headers:

- `X-RateLimit-Limit` - Maximum requests allowed
- `X-RateLimit-Remaining` - Remaining requests in window
- `X-RateLimit-Reset` - Timestamp when limit resets
- `Retry-After` - Seconds until you can retry (429 responses)

---

## Health Check

### `GET /api/health`

Check the health status of the application and its dependencies.

**Authentication:** Not required

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2025-09-29T12:00:00.000Z",
  "version": "0.0.0",
  "checks": {
    "database": {
      "status": "up",
      "latency": 45
    },
    "environment": {
      "status": "configured"
    }
  }
}
```

**Status Codes:**

- `200 OK` - System is healthy
- `503 Service Unavailable` - System is unhealthy

---

## Authentication Endpoints

### `GET /api/auth/status`

Check if the current user is authenticated.

**Authentication:** Not required

**Response:**

```json
{
  "authenticated": true
}
```

**Status Codes:**

- `200 OK` - Status retrieved successfully
- `500 Internal Server Error` - Server error

---

### `POST /api/auth/verify-password`

Verify a user's password (for sensitive operations).

**Authentication:** Required

**Request Body:**

```json
{
  "password": "user_password"
}
```

**Response:**

```json
{
  "valid": true
}
```

**Status Codes:**

- `200 OK` - Password verified
- `400 Bad Request` - Invalid request
- `401 Unauthorized` - Not authenticated
- `429 Too Many Requests` - Rate limit exceeded

---

### `POST /api/auth/set-session`

Set authentication session cookies.

**Authentication:** Not required

**Request Body:**

```json
{
  "access_token": "token",
  "refresh_token": "token"
}
```

**Response:**

```json
{
  "success": true
}
```

**Status Codes:**

- `200 OK` - Session set successfully
- `400 Bad Request` - Invalid tokens

---

## Subscription Endpoints

### `POST /api/create-portal-session`

Create a Stripe customer portal session for subscription management.

**Authentication:** Required

**Response:**

```json
{
  "url": "https://billing.stripe.com/session/..."
}
```

**Status Codes:**

- `200 OK` - Portal session created
- `401 Unauthorized` - Not authenticated
- `500 Internal Server Error` - Stripe error

---

### `GET /api/subscription-status`

Get the current user's subscription status.

**Authentication:** Required

**Response:**

```json
{
  "status": "active",
  "plan": "premium",
  "current_period_end": "2025-10-29T12:00:00.000Z"
}
```

**Status Codes:**

- `200 OK` - Status retrieved
- `401 Unauthorized` - Not authenticated
- `404 Not Found` - No subscription found

---

## Analytics Endpoints

### `POST /api/track-view`

Track a post view for analytics.

**Authentication:** Optional (can track anonymous views)

**Request Body:**

```json
{
  "post_id": "uuid",
  "user_id": "uuid" // Optional
}
```

**Response:**

```json
{
  "success": true
}
```

**Status Codes:**

- `200 OK` - View tracked
- `400 Bad Request` - Invalid post_id
- `429 Too Many Requests` - Rate limit exceeded

---

### `POST /api/update-stats`

Update application-wide statistics (admin only).

**Authentication:** Required (admin)

**Response:**

```json
{
  "success": true,
  "updated": {
    "active_writers": 150,
    "stories_shared": 1234,
    "published_works": 56
  }
}
```

**Status Codes:**

- `200 OK` - Stats updated
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not admin
- `500 Internal Server Error` - Update failed

---

## Best Practices

### Making Requests

1. **Always include proper headers:**

   ```javascript
   headers: {
     'Content-Type': 'application/json',
   }
   ```

2. **Handle rate limits gracefully:**

   ```javascript
   if (response.status === 429) {
     const retryAfter = response.headers.get('Retry-After')
     // Wait and retry
   }
   ```

3. **Implement exponential backoff for retries:**

   ```javascript
   async function fetchWithRetry(url, options, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         const response = await fetch(url, options)
         if (response.ok) return response
         if (response.status === 429) {
           await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)))
           continue
         }
         throw new Error(`HTTP ${response.status}`)
       } catch (error) {
         if (i === maxRetries - 1) throw error
       }
     }
   }
   ```

4. **Always validate responses:**
   ```javascript
   const data = await response.json()
   if (data.error) {
     throw new Error(data.error.message)
   }
   ```

### Security

1. Never expose sensitive tokens in client-side code
2. Always validate user input on the server
3. Use HTTPS in production
4. Implement CSRF protection for state-changing operations
5. Sanitize user-generated content before storage

### Performance

1. Cache responses when appropriate
2. Use pagination for large datasets
3. Implement request debouncing for user-triggered actions
4. Monitor API response times via the health endpoint

---

## Support

For issues or questions:

- GitHub Issues: [github.com/your-repo/issues](https://github.com/your-repo/issues)
- Email: support@ottopen.com

## Changelog

### v0.0.0 (2025-09-29)

- Initial API documentation
- Added health check endpoint
- Added authentication endpoints
- Added subscription management
- Added analytics tracking
