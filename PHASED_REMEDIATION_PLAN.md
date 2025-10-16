# PHASED REMEDIATION PLAN

## Script Soiree - Comprehensive Issue Resolution Strategy

**Created**: October 15, 2025
**Total Phases**: 24 phases
**Total Estimated Time**: 102.5 hours
**Testing After Every Phase**: ✅ Required
**Rollback Plan**: ✅ Included

---

## 🎯 STRATEGY OVERVIEW

This plan breaks down all 18 identified issues into **24 carefully sequenced phases** with testing checkpoints after each phase. Each phase is designed to:

1. **Minimize risk** - Small, focused changes
2. **Enable testing** - Testable outcomes after each phase
3. **Allow rollback** - Git commits after each successful phase
4. **Maintain stability** - Never break existing functionality
5. **Build incrementally** - Later phases leverage earlier work

---

## 📋 PHASE STRUCTURE

Each phase includes:

- **Objective**: What we're fixing
- **Files Affected**: Exact files to modify
- **Estimated Time**: Hours needed
- **Testing Checklist**: What to verify
- **Rollback Procedure**: How to undo if issues arise
- **Success Criteria**: When to proceed to next phase

---

# SPRINT 1: CRITICAL SECURITY FIXES (Phases 1-8)

## PHASE 1: Setup Infrastructure for Logging Migration

**Duration**: 2 hours
**Risk Level**: 🟢 Low
**Dependencies**: None

### Objective

Create centralized logging infrastructure without touching existing code. This allows us to migrate gradually.

### Files to Create

1. `/src/lib/logger.ts` - Centralized logging service
2. `/src/lib/logger.test.ts` - Unit tests for logger
3. `.env.example` - Add logging configuration

### Implementation Steps

```typescript
// /src/lib/logger.ts
import { logError as editorLogError } from './editor-logger'

interface LogContext {
  userId?: string
  requestId?: string
  [key: string]: any
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(`[INFO] ${message}`, context)
    }
    // In production, send to monitoring service (Sentry, Datadog, etc.)
    this.sendToMonitoring('info', message, context)
  }

  error(message: string, error: Error, context?: LogContext): void {
    if (this.isDevelopment) {
      console.error(`[ERROR] ${message}`, error, context)
    }
    // Use existing editor logger for Sentry integration
    editorLogError(error, context)
  }

  warn(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, context)
    }
    this.sendToMonitoring('warn', message, context)
  }

  private sendToMonitoring(level: string, message: string, context?: LogContext): void {
    // Only in production
    if (process.env.NODE_ENV !== 'production') return

    // TODO: Integrate with your monitoring service
    // Example: Sentry, Datadog, CloudWatch, etc.
  }
}

export const logger = new Logger()
```

### Testing Checklist

- [ ] Run `npm run typecheck` - Should pass
- [ ] Run `npm run lint` - Should pass
- [ ] Run `npm run test` - Logger unit tests pass
- [ ] Verify logger.info() outputs in development
- [ ] Verify logger.error() outputs in development

### Success Criteria

- ✅ Logger module created and tested
- ✅ No existing functionality broken
- ✅ TypeScript compilation succeeds

### Rollback Procedure

```bash
git reset --hard HEAD
# Or delete the new files
rm src/lib/logger.ts src/lib/logger.test.ts
```

### Git Commit Message

```
feat: Add centralized logging infrastructure

- Create logger service with info/warn/error methods
- Support development vs production environments
- Integrate with existing editor-logger for Sentry
- Add unit tests for logger module

Phase 1/24 of remediation plan
```

---

## PHASE 2: Migrate API Route Logging (Part 1 - Stripe Webhooks)

**Duration**: 1.5 hours
**Risk Level**: 🟡 Medium
**Dependencies**: Phase 1

### Objective

Replace console.log/console.error in the most critical file (Stripe webhook handler) with structured logging. This file handles payments and must be rock-solid.

### Files to Modify

1. `/app/api/webhooks/stripe/route.ts` (5 console statements)

### Implementation Steps

```typescript
// Before (lines 175, 205, 209, 235):
console.log('Processing subscription:', subscription.id)
console.error('Webhook error:', err)

// After:
import { logger } from '@/src/lib/logger'

logger.info('Processing subscription', {
  subscriptionId: subscription.id,
  customerId: subscription.customer,
})

logger.error('Webhook processing failed', err as Error, {
  eventType: event.type,
  eventId: event.id,
})
```

### Testing Checklist

- [ ] Run `npm run build` - Should succeed
- [ ] Run Stripe webhook in development:
  ```bash
  # Use Stripe CLI to send test webhook
  stripe trigger customer.subscription.created
  ```
- [ ] Verify structured logs appear in console
- [ ] Check Vercel logs format (if deployed)
- [ ] Test error scenario (invalid signature)
- [ ] Verify error logging captures full context

### Success Criteria

- ✅ All 5 console statements replaced
- ✅ Webhook processes successfully
- ✅ Logs contain structured context
- ✅ No errors in webhook processing

### Rollback Procedure

```bash
git revert HEAD
# Test webhook still works
stripe trigger customer.subscription.created
```

### Git Commit Message

```
refactor(webhooks): Replace console logging with structured logger in Stripe webhook

- Replace 5 console.log/error statements with logger
- Add context (subscriptionId, customerId, eventType)
- Improve error tracking with structured data

Fixes security issue: console.log data leakage
Phase 2/24 of remediation plan
```

---

## PHASE 3: Migrate API Route Logging (Part 2 - AI Routes)

**Duration**: 2 hours
**Risk Level**: 🟡 Medium
**Dependencies**: Phase 2

### Objective

Replace console logging in all 15 AI route handlers. These routes process user content and must not log sensitive data.

### Files to Modify

```
/app/api/ai/brainstorm/route.ts
/app/api/ai/critique/route.ts
/app/api/ai/describe/route.ts
/app/api/ai/expand/route.ts
/app/api/ai/rewrite/route.ts
/app/api/ai/generate-logline/route.ts
/app/api/ai/character-consistency/route.ts
/app/api/ai/plot-holes/route.ts
/app/api/ai/readability/route.ts
/app/api/ai/research/route.ts
/app/api/ai/short-story/generate-outline/route.ts
```

### Implementation Pattern

```typescript
// Pattern to follow for all AI routes
import { logger } from '@/src/lib/logger'

export async function POST(req: Request) {
  try {
    // BEFORE: console.log('AI request:', userId, tokens)
    // AFTER:
    logger.info('AI request initiated', {
      endpoint: 'brainstorm', // or current route name
      userId,
      tokenLimit: tokens,
      // DO NOT LOG: actual user content/prompts
    })

    // ... AI processing

    // BEFORE: console.log('AI response:', response.length)
    // AFTER:
    logger.info('AI request completed', {
      endpoint: 'brainstorm',
      userId,
      responseLength: response.length,
      processingTimeMs: Date.now() - startTime,
    })
  } catch (error) {
    // BEFORE: console.error('AI error:', error)
    // AFTER:
    logger.error('AI request failed', error as Error, {
      endpoint: 'brainstorm',
      userId,
    })
  }
}
```

### Testing Checklist

- [ ] Test each AI endpoint individually:
  ```bash
  # Example for brainstorm endpoint
  curl -X POST http://localhost:3000/api/ai/brainstorm \
    -H "Content-Type: application/json" \
    -d '{"prompt": "test", "maxTokens": 100}'
  ```
- [ ] Verify logs show structured data
- [ ] Verify user content is NOT logged
- [ ] Check error handling still works
- [ ] Run `npm run build` - Should succeed

### Success Criteria

- ✅ All 15 AI routes migrated
- ✅ No user content in logs
- ✅ Performance metrics captured
- ✅ Error handling intact

### Rollback Procedure

```bash
git revert HEAD
# Test one AI route
curl -X POST http://localhost:3000/api/ai/brainstorm ...
```

### Git Commit Message

```
refactor(ai): Migrate all AI routes to structured logging

- Replace console logging in 15 AI endpoint handlers
- Add performance tracking (processing time)
- Remove user content from logs (security)
- Standardize error context across routes

Fixes security issue: AI route logging
Phase 3/24 of remediation plan
```

---

## PHASE 4: Migrate Service Layer Logging (database.ts)

**Duration**: 2 hours
**Risk Level**: 🟡 Medium
**Dependencies**: Phase 3

### Objective

Replace console logging in the massive database service file (1,951 lines) without changing business logic.

### Files to Modify

1. `/src/lib/database.ts` (30+ console statements estimated)

### Implementation Strategy

Work through the file section by section:

1. User operations (lines 1-400)
2. Post operations (lines 401-800)
3. Message operations (lines 801-1200)
4. Other operations (lines 1201-1951)

### Implementation Pattern

```typescript
// Add at top of file
import { logger } from './logger'

// BEFORE:
console.log('Creating post:', postData)
console.error('Database error:', error)

// AFTER:
logger.info('Database operation: create post', {
  operation: 'createPost',
  userId: postData.userId,
  // DO NOT LOG: actual post content
})

// In error handler (already exists at line 144):
private handleError(operation: string, error: any): string {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error'

  // BEFORE: console.error
  // AFTER:
  logger.error(`Database operation failed: ${operation}`, error as Error, {
    operation,
    errorCode: error?.code,
  })

  return errorMessage
}
```

### Testing Checklist

- [ ] Test user CRUD operations:
  ```bash
  # Create account, update profile, etc.
  ```
- [ ] Test post creation/editing
- [ ] Test messaging functionality
- [ ] Test job marketplace operations
- [ ] Run full test suite: `npm run test`
- [ ] Check for any database errors in logs

### Success Criteria

- ✅ All console statements in database.ts replaced
- ✅ All database operations still functional
- ✅ Error handling preserved
- ✅ Test suite passes

### Rollback Procedure

```bash
git revert HEAD
npm run test  # Verify all tests still pass
```

### Git Commit Message

```
refactor(database): Migrate database service to structured logging

- Replace 30+ console statements in database.ts
- Preserve existing error handling logic
- Add operation context to all logs
- Remove sensitive user data from logs

Fixes security issue: Database service logging
Phase 4/24 of remediation plan
```

---

## PHASE 5: Migrate Client Component Logging

**Duration**: 1.5 hours
**Risk Level**: 🟢 Low
**Dependencies**: Phase 4

### Objective

Replace console.log in client-side components. These are lower risk since they don't run in production server logs, but should still use proper error boundaries.

### Files to Modify (Highest priority client components)

```
/app/editor/workspace/EditorWorkspaceView.tsx (10 console.log)
/src/lib/rate-limit-new.ts (8 console.log)
/lib/server/data.ts (8 console.log)
```

### Implementation Pattern

```typescript
// For client components
'use client'
import { logger } from '@/src/lib/logger'

// BEFORE:
console.log('Scene moved:', from, to)

// AFTER:
logger.info('Editor action: scene moved', {
  component: 'EditorWorkspaceView',
  fromIndex: from,
  toIndex: to,
  // Client-side logs are less critical but still structured
})
```

### Testing Checklist

- [ ] Test editor drag-and-drop functionality
- [ ] Test scene reordering
- [ ] Test chapter management
- [ ] Verify browser console shows structured logs
- [ ] Test error scenarios (invalid moves)

### Success Criteria

- ✅ Client console.log statements migrated
- ✅ Editor functionality unchanged
- ✅ Error boundaries working
- ✅ Development experience preserved

### Rollback Procedure

```bash
git revert HEAD
# Test editor manually
```

### Git Commit Message

```
refactor(client): Migrate client component logging to structured logger

- Update EditorWorkspaceView.tsx console statements
- Update rate-limit-new.ts logging
- Preserve development debugging experience
- Add component context to logs

Phase 5/24 of remediation plan
```

---

## PHASE 6: Add Webhook Idempotency Check

**Duration**: 1.5 hours
**Risk Level**: 🔴 High
**Dependencies**: Phase 2 (needs webhook logging migrated first)

### Objective

Prevent duplicate webhook processing by checking if event already processed. This is CRITICAL to prevent duplicate charges.

### Files to Modify

1. `/app/api/webhooks/stripe/route.ts`

### Implementation

```typescript
// Add after signature validation (around line 58)
export async function POST(req: Request) {
  // ... existing signature validation code ...

  const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

  // ✅ NEW: Idempotency check
  const { data: existingEvent } = await supabaseAdmin
    .from('webhook_events')
    .select('id, status')
    .eq('payload->id', event.id)
    .single()

  if (existingEvent) {
    logger.info('Webhook event already processed', {
      eventId: event.id,
      eventType: event.type,
      previousStatus: existingEvent.status,
    })
    return NextResponse.json({
      received: true,
      status: 'duplicate',
      message: 'Event already processed',
    })
  }

  // ✅ NEW: Mark event as processing IMMEDIATELY
  await supabaseAdmin.from('webhook_events').insert({
    webhook_type: 'stripe',
    event_type: event.type,
    payload: event,
    headers: Object.fromEntries(headers().entries()),
    status: 'processing', // Mark as processing, not completed
    processed_at: new Date().toISOString(),
  })

  // ... rest of webhook handler ...

  // ✅ UPDATE: Mark as completed at end
  await supabaseAdmin
    .from('webhook_events')
    .update({ status: 'completed' })
    .eq('payload->id', event.id)

  return NextResponse.json({ received: true, status: 'processed' })
}
```

### Testing Checklist

- [ ] Test normal webhook flow:
  ```bash
  stripe trigger customer.subscription.created
  ```
- [ ] Verify event recorded in webhook_events table
- [ ] **CRITICAL TEST**: Send same webhook twice:
  ```bash
  # Use Stripe CLI to replay event
  stripe events resend evt_xxx
  ```
- [ ] Verify second attempt returns "duplicate" status
- [ ] Verify subscription only created once in database
- [ ] Check webhook_events table has one entry with status='completed'

### Success Criteria

- ✅ Duplicate webhooks rejected
- ✅ Single subscription created
- ✅ webhook_events table accurate
- ✅ No duplicate referral earnings

### Rollback Procedure

```bash
git revert HEAD
# Test webhook still processes
stripe trigger customer.subscription.created
# Verify subscription created
```

### Git Commit Message

```
fix(webhooks): Add idempotency check to prevent duplicate processing

CRITICAL SECURITY FIX:
- Check if event.id already exists in webhook_events
- Mark event as 'processing' immediately to prevent race conditions
- Return early if duplicate detected
- Update status to 'completed' after successful processing

Prevents duplicate charges and referral earnings

Fixes critical issue: Webhook idempotency
Phase 6/24 of remediation plan
```

---

## PHASE 7: Fix Overly Permissive RLS Policies

**Duration**: 2 hours
**Risk Level**: 🔴 High
**Dependencies**: None (database only)

### Objective

Remove dangerous RLS policies that allow any user to modify statistics tables.

### Files to Create

1. `/supabase/migrations/20251015120000_fix_permissive_rls_policies.sql`

### Implementation

```sql
-- /supabase/migrations/20251015120000_fix_permissive_rls_policies.sql

-- Remove overly permissive policies
DROP POLICY IF EXISTS "System can manage user statistics" ON user_statistics;
DROP POLICY IF EXISTS "System can manage application statistics" ON application_statistics;

-- Add proper restrictive policies for user_statistics
CREATE POLICY "Users can view own statistics" ON user_statistics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public statistics" ON user_statistics
  FOR SELECT USING (
    -- Allow viewing stats for users who have public profiles
    EXISTS(SELECT 1 FROM users WHERE id = user_id AND is_public IS TRUE)
  );

-- System updates will use service role (bypasses RLS)
-- No INSERT/UPDATE/DELETE policies for regular users

-- Add admin-only policy for application_statistics
CREATE POLICY "Admins can view application statistics" ON application_statistics
  FOR SELECT USING (
    EXISTS(SELECT 1 FROM users WHERE id = auth.uid() AND is_admin IS TRUE)
  );

-- Service role will handle updates (bypasses RLS)

-- Add comment for documentation
COMMENT ON TABLE user_statistics IS 'User statistics - updates via service role only';
COMMENT ON TABLE application_statistics IS 'Global app stats - admin view only, service role updates';
```

### Testing Checklist

- [ ] Apply migration:
  ```bash
  npx supabase db push
  ```
- [ ] **CRITICAL TEST**: Try to modify statistics as regular user:

  ```sql
  -- Login as regular user in Supabase Studio
  SET LOCAL ROLE authenticated;
  SET LOCAL request.jwt.claims.sub TO 'test-user-id';

  -- Should FAIL:
  UPDATE user_statistics SET posts_count = 999 WHERE user_id = 'other-user-id';
  -- Expected: permission denied

  -- Should SUCCEED:
  SELECT * FROM user_statistics WHERE user_id = current_setting('request.jwt.claims.sub');
  ```

- [ ] Verify automated stats updates still work (uses service role)
- [ ] Check user profiles display stats correctly

### Success Criteria

- ✅ Regular users cannot modify statistics
- ✅ Users can view own statistics
- ✅ Automated updates work (service role)
- ✅ Admin users can view all stats

### Rollback Procedure

```sql
-- Create rollback migration if needed
-- /supabase/migrations/20251015120001_rollback_rls_policies.sql
DROP POLICY IF EXISTS "Users can view own statistics" ON user_statistics;
DROP POLICY IF EXISTS "Users can view public statistics" ON user_statistics;
DROP POLICY IF EXISTS "Admins can view application statistics" ON application_statistics;

-- Restore original policies
CREATE POLICY "System can manage user statistics" ON user_statistics
  FOR ALL USING (true);
CREATE POLICY "System can manage application statistics" ON application_statistics
  FOR ALL USING (true);
```

### Git Commit Message

```
fix(database): Remove overly permissive RLS policies on statistics tables

CRITICAL SECURITY FIX:
- Remove "FOR ALL USING (true)" policies on user_statistics
- Remove "FOR ALL USING (true)" policies on application_statistics
- Add read-only policies for regular users
- System updates now require service role (secure)

Prevents unauthorized statistics manipulation

Fixes critical issue: Overly permissive RLS
Phase 7/24 of remediation plan
```

---

## PHASE 8: Enable RLS on Missing Tables

**Duration**: 1.5 hours
**Risk Level**: 🟡 Medium
**Dependencies**: Phase 7

### Objective

Enable RLS on tables that currently have no row-level security protection.

### Files to Create

1. `/supabase/migrations/20251015130000_enable_rls_missing_tables.sql`

### Implementation

```sql
-- /supabase/migrations/20251015130000_enable_rls_missing_tables.sql

-- Enable RLS on stripe_events table
ALTER TABLE IF EXISTS stripe_events ENABLE ROW LEVEL SECURITY;

-- Only service role can manage stripe events (bypasses RLS)
-- No policies needed - service role only

-- Enable RLS on webhook_events table (if exists)
ALTER TABLE IF EXISTS webhook_events ENABLE ROW LEVEL SECURITY;

-- Admin-only read access to webhook logs
CREATE POLICY "Admins can view webhook events" ON webhook_events
  FOR SELECT USING (
    EXISTS(SELECT 1 FROM users WHERE id = auth.uid() AND is_admin IS TRUE)
  );

-- Service role handles inserts (bypasses RLS)

-- Verify RLS is enabled on all critical tables
DO $$
DECLARE
  missing_rls TEXT;
BEGIN
  SELECT string_agg(tablename, ', ')
  INTO missing_rls
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT IN (
      SELECT tablename
      FROM pg_tables t
      JOIN pg_class c ON c.relname = t.tablename
      WHERE c.relrowsecurity = true
    );

  IF missing_rls IS NOT NULL THEN
    RAISE WARNING 'Tables without RLS: %', missing_rls;
  END IF;
END $$;
```

### Testing Checklist

- [ ] Apply migration:
  ```bash
  npx supabase db push
  ```
- [ ] Verify RLS enabled:
  ```sql
  SELECT tablename, relrowsecurity as has_rls
  FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename
  WHERE schemaname = 'public'
    AND tablename IN ('stripe_events', 'webhook_events')
  ORDER BY tablename;
  ```
- [ ] Test webhook still writes events (service role)
- [ ] Test regular user cannot read stripe_events:
  ```sql
  SET ROLE authenticated;
  SELECT * FROM stripe_events; -- Should return 0 rows
  ```
- [ ] Test admin can read webhook_events
- [ ] Test Stripe webhook processing still works

### Success Criteria

- ✅ RLS enabled on all tables
- ✅ Service role can still write
- ✅ Regular users blocked from sensitive tables
- ✅ Webhooks process normally

### Rollback Procedure

```sql
-- /supabase/migrations/20251015130001_rollback_rls_enable.sql
ALTER TABLE IF EXISTS stripe_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS webhook_events DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view webhook events" ON webhook_events;
```

### Git Commit Message

```
fix(database): Enable RLS on stripe_events and webhook_events tables

SECURITY FIX:
- Enable row-level security on stripe_events table
- Enable row-level security on webhook_events table
- Add admin-only read policy for webhook logs
- Service role bypasses RLS for system operations

Prevents unauthorized access to audit trails

Fixes critical issue: Missing RLS on audit tables
Phase 8/24 of remediation plan
```

---

# SPRINT 2: ARCHITECTURE IMPROVEMENTS (Phases 9-16)

## PHASE 9: Add Authorization to SECURITY DEFINER Functions

**Duration**: 2 hours
**Risk Level**: 🔴 High
**Dependencies**: Phase 7

### Objective

Add proper authorization checks to functions that run with elevated privileges (SECURITY DEFINER).

### Files to Create

1. `/supabase/migrations/20251015140000_fix_security_definer_functions.sql`

### Implementation

```sql
-- /supabase/migrations/20251015140000_fix_security_definer_functions.sql

-- Fix update_user_statistics function
CREATE OR REPLACE FUNCTION update_user_statistics(target_user_id UUID)
RETURNS void AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Authorization check
  SELECT is_admin INTO v_is_admin
  FROM users
  WHERE id = auth.uid();

  IF auth.uid() != target_user_id AND (v_is_admin IS NOT TRUE) THEN
    RAISE EXCEPTION 'Unauthorized: Cannot update statistics for other users'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Original function logic
  INSERT INTO user_statistics (
    user_id,
    posts_count,
    followers_count,
    following_count,
    likes_received,
    comments_received
  )
  SELECT
    target_user_id,
    COUNT(DISTINCT p.id),
    COUNT(DISTINCT f1.follower_id),
    COUNT(DISTINCT f2.following_id),
    COUNT(DISTINCT l.id),
    COUNT(DISTINCT c.id)
  FROM users u
  LEFT JOIN posts p ON p.user_id = u.id
  LEFT JOIN follows f1 ON f1.following_id = u.id
  LEFT JOIN follows f2 ON f2.follower_id = u.id
  LEFT JOIN likes l ON l.post_id = p.id
  LEFT JOIN comments c ON c.post_id = p.id
  WHERE u.id = target_user_id
  ON CONFLICT (user_id) DO UPDATE SET
    posts_count = EXCLUDED.posts_count,
    followers_count = EXCLUDED.followers_count,
    following_count = EXCLUDED.following_count,
    likes_received = EXCLUDED.likes_received,
    comments_received = EXCLUDED.comments_received,
    updated_at = NOW();

EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE;
  WHEN OTHERS THEN
    RAISE WARNING 'Error updating user statistics: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;

-- Add comment
COMMENT ON FUNCTION update_user_statistics IS
  'Updates user statistics with authorization check. Only user themselves or admins can update.';
```

### Testing Checklist

- [ ] Apply migration:
  ```bash
  npx supabase db push
  ```
- [ ] Test as regular user (should succeed for own stats):
  ```sql
  SET ROLE authenticated;
  SET LOCAL request.jwt.claims.sub TO 'user-a-id';
  SELECT update_user_statistics('user-a-id'::uuid);
  -- Should succeed
  ```
- [ ] **CRITICAL TEST**: Try to update another user's stats:
  ```sql
  SET ROLE authenticated;
  SET LOCAL request.jwt.claims.sub TO 'user-a-id';
  SELECT update_user_statistics('user-b-id'::uuid);
  -- Should FAIL with "Unauthorized" error
  ```
- [ ] Test as admin (should succeed for any user):
  ```sql
  -- Login as admin user
  SELECT update_user_statistics('any-user-id'::uuid);
  -- Should succeed
  ```
- [ ] Verify automated stats updates still work

### Success Criteria

- ✅ Function blocks unauthorized calls
- ✅ Users can update own statistics
- ✅ Admins can update any statistics
- ✅ Error messages are clear

### Rollback Procedure

```sql
-- Restore original function without auth check
CREATE OR REPLACE FUNCTION update_user_statistics(target_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Original logic without auth check
  INSERT INTO user_statistics ...
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Git Commit Message

```
fix(database): Add authorization check to update_user_statistics function

CRITICAL SECURITY FIX:
- Add auth.uid() check to SECURITY DEFINER function
- Allow users to update own stats only
- Allow admins to update any user's stats
- Improve error handling and messages

Prevents unauthorized statistics manipulation via function call

Fixes critical issue: SECURITY DEFINER without auth
Phase 9/24 of remediation plan
```

---

## PHASE 10: Add Escrow Transfer Idempotency

**Duration**: 1.5 hours
**Risk Level**: 🔴 High
**Dependencies**: Phase 6 (similar pattern)

### Objective

Prevent duplicate escrow payments by adding idempotency keys to Stripe transfer operations.

### Files to Modify

1. `/src/lib/stripe-connect-service.ts`

### Implementation

```typescript
// /src/lib/stripe-connect-service.ts

export async function releaseEscrowPayment(
  paymentIntentId: string,
  writerConnectAccountId: string,
  amount: number,
  contractId: string,
  milestoneId?: string
): Promise<{ success: boolean; transferId?: string; error?: string }> {
  try {
    const platformFee = calculatePlatformFee(amount)

    // ✅ NEW: Generate idempotency key
    const idempotencyKey = `transfer:${contractId}:${milestoneId || 'final'}:${paymentIntentId}`

    // ✅ NEW: Check if transfer already exists
    const existingTransfers = await stripe.transfers.list(
      {
        limit: 1,
      },
      {
        idempotencyKey, // Stripe will return existing transfer if key matches
      }
    )

    if (existingTransfers.data.length > 0) {
      logger.info('Transfer already exists', {
        transferId: existingTransfers.data[0].id,
        contractId,
        milestoneId,
      })
      return {
        success: true,
        transferId: existingTransfers.data[0].id,
      }
    }

    // Create transfer with idempotency key
    const transfer = await stripe.transfers.create(
      {
        amount: Math.round((amount - platformFee) * 100),
        currency: 'usd',
        destination: writerConnectAccountId,
        transfer_group: contractId,
        metadata: {
          contract_id: contractId,
          milestone_id: milestoneId || '',
          platform_fee: platformFee.toString(),
          payment_intent: paymentIntentId,
        },
      },
      {
        idempotencyKey, // ✅ CRITICAL: Prevents duplicate transfers
      }
    )

    logger.info('Escrow payment released', {
      transferId: transfer.id,
      amount,
      platformFee,
      contractId,
      milestoneId,
    })

    return {
      success: true,
      transferId: transfer.id,
    }
  } catch (error) {
    logger.error('Failed to release escrow payment', error as Error, {
      contractId,
      milestoneId,
      writerConnectAccountId,
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
```

### Testing Checklist

- [ ] Test normal escrow release:
  ```typescript
  // In test environment
  const result = await releaseEscrowPayment('pi_test_123', 'acct_test_456', 1000, 'contract_789')
  expect(result.success).toBe(true)
  ```
- [ ] **CRITICAL TEST**: Call function twice with same parameters:

  ```typescript
  const result1 = await releaseEscrowPayment(...)
  const result2 = await releaseEscrowPayment(...) // Same params

  // Should return same transfer ID
  expect(result1.transferId).toBe(result2.transferId)
  ```

- [ ] Check Stripe dashboard - only ONE transfer created
- [ ] Test different milestone IDs create different transfers
- [ ] Verify idempotency key format in Stripe logs

### Success Criteria

- ✅ Duplicate calls return same transfer
- ✅ Only one transfer created in Stripe
- ✅ Different milestones create separate transfers
- ✅ Error handling preserved

### Rollback Procedure

```typescript
// Remove idempotency key parameter
const transfer = await stripe.transfers.create({
  // ... params
})
// (no second options parameter)
```

### Git Commit Message

```
fix(payments): Add idempotency to escrow transfer operations

CRITICAL SECURITY FIX:
- Add idempotency key to stripe.transfers.create()
- Key format: transfer:{contractId}:{milestoneId}:{paymentIntentId}
- Check for existing transfers before creating
- Prevent duplicate payments to writers

Fixes critical issue: Duplicate escrow payments
Phase 10/24 of remediation plan
```

---

## PHASE 11: Fix Stripe Dispute Handler Bug

**Duration**: 1 hour
**Risk Level**: 🟡 Medium
**Dependencies**: Phase 2

### Objective

Fix the bug where dispute handler uses charge ID instead of customer ID.

### Files to Modify

1. `/app/api/webhooks/stripe/route.ts`

### Implementation

```typescript
// Around line 320-330 in webhooks/stripe/route.ts

async function handleChargeDisputeCreated(dispute: Stripe.Dispute, supabaseAdmin: SupabaseClient) {
  try {
    // ✅ FIX: Properly retrieve customer ID from charge
    const chargeId = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id

    if (!chargeId) {
      logger.warn('Dispute has no associated charge', { disputeId: dispute.id })
      return
    }

    // Fetch the charge to get customer ID
    const charge = await stripe.charges.retrieve(chargeId)

    const customerId = typeof charge.customer === 'string' ? charge.customer : charge.customer?.id

    if (!customerId) {
      logger.warn('Charge has no associated customer', {
        disputeId: dispute.id,
        chargeId,
      })
      return
    }

    // Find user by Stripe customer ID
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('stripe_customer_id', customerId)
      .single()

    if (!user) {
      logger.warn('User not found for disputed charge', {
        disputeId: dispute.id,
        customerId,
      })
      return
    }

    // Create notification for user about dispute
    await supabaseAdmin.from('notifications').insert({
      user_id: user.id,
      type: 'payment_dispute',
      content: `A payment dispute was filed for ${charge.amount / 100} ${charge.currency}. Reason: ${dispute.reason}`,
      metadata: {
        dispute_id: dispute.id,
        charge_id: chargeId,
        amount: charge.amount,
        currency: charge.currency,
        reason: dispute.reason,
      },
    })

    logger.info('Dispute notification created', {
      disputeId: dispute.id,
      userId: user.id,
      amount: charge.amount,
    })
  } catch (error) {
    logger.error('Failed to handle dispute', error as Error, {
      disputeId: dispute.id,
    })
  }
}
```

### Testing Checklist

- [ ] Test with Stripe CLI:
  ```bash
  stripe trigger charge.dispute.created
  ```
- [ ] Verify charge is retrieved correctly
- [ ] Verify customer ID extracted from charge
- [ ] Verify user found in database
- [ ] Verify notification created for user
- [ ] Check logs show correct customer ID (not charge ID)

### Success Criteria

- ✅ Correct customer ID retrieved
- ✅ User notified of dispute
- ✅ No errors in webhook processing
- ✅ Logs show proper data flow

### Rollback Procedure

```bash
git revert HEAD
```

### Git Commit Message

```
fix(webhooks): Correct customer ID lookup in dispute handler

BUG FIX:
- Retrieve charge object to get customer ID
- Previous code used charge ID instead of customer ID
- Add proper error handling for missing charge/customer
- Improve logging for dispute flow

Fixes bug: Stripe dispute handler customer lookup
Phase 11/24 of remediation plan
```

---

## PHASE 12: Replace TypeScript 'any' Types (Part 1 - Utilities)

**Duration**: 3 hours
**Risk Level**: 🟢 Low
**Dependencies**: None

### Objective

Create proper TypeScript interfaces for commonly-used types, starting with utilities and helpers.

### Files to Create/Modify

1. `/src/types/cookies.ts` - Cookie types
2. `/src/types/settings.ts` - Settings types
3. `/lib/server/auth.ts` - Use new cookie types

### Implementation

```typescript
// /src/types/cookies.ts
export interface CookieOptions {
  path?: string
  domain?: string
  maxAge?: number
  expires?: Date
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'lax' | 'strict' | 'none'
}

export interface CookieStore {
  get(name: string): { value: string } | undefined
  set(name: string, value: string, options?: CookieOptions): void
  delete(name: string, options?: CookieOptions): void
}

// /src/types/settings.ts
export interface NotificationSettings {
  email_notifications: boolean
  push_notifications: boolean
  comment_notifications: boolean
  like_notifications: boolean
  follow_notifications: boolean
  mention_notifications: boolean
  reply_notifications: boolean
}

export interface PrivacySettings {
  profile_visibility: 'public' | 'private' | 'followers_only'
  show_email: boolean
  show_location: boolean
  allow_messages_from: 'everyone' | 'followers' | 'none'
  show_activity_status: boolean
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: string
  timezone: string
  editor_font_size: number
  editor_theme: string
}

// /lib/server/auth.ts - Update cookie store
import { CookieStore, CookieOptions } from '@/src/types/cookies'

// BEFORE:
const cookieStore = {
  get: (name: string) => any,
  set: (name: string, value: string, options: any) => void,
}

// AFTER:
const cookieStore: CookieStore = {
  get(name: string) {
    const cookie = cookies().get(name)
    return cookie ? { value: cookie.value } : undefined
  },
  set(name: string, value: string, options?: CookieOptions) {
    cookies().set(name, value, options)
  },
  delete(name: string, options?: CookieOptions) {
    cookies().delete(name)
  },
}
```

### Testing Checklist

- [ ] Run `npm run typecheck` - Should pass with no 'any' errors in modified files
- [ ] Test authentication flow (login/logout)
- [ ] Test cookie setting/reading
- [ ] Verify settings pages work correctly
- [ ] Run `npm run build` - Should succeed

### Success Criteria

- ✅ All utility 'any' types replaced
- ✅ TypeScript compilation succeeds
- ✅ No runtime errors
- ✅ Better IDE autocomplete

### Rollback Procedure

```bash
git revert HEAD
npm run typecheck  # Should still pass
```

### Git Commit Message

```
refactor(types): Add proper TypeScript types for cookies and settings

TYPE SAFETY IMPROVEMENT:
- Create CookieOptions and CookieStore interfaces
- Create NotificationSettings, PrivacySettings types
- Replace 'any' types in auth utilities
- Improve type inference in IDE

Fixes issue: TypeScript 'any' usage (Part 1)
Phase 12/24 of remediation plan
```

---

## PHASE 13: Replace TypeScript 'any' Types (Part 2 - Database)

**Duration**: 4 hours
**Risk Level**: 🟡 Medium
**Dependencies**: Phase 12

### Objective

Add proper types to database service methods, replacing 'any' parameters.

### Files to Modify

1. `/src/lib/database.ts` (30+ any types)
2. `/src/types/database.ts` (create new file)

### Implementation

```typescript
// /src/types/database.ts
import { NotificationSettings, PrivacySettings } from './settings'

export interface CreatePostData {
  user_id: string
  title?: string
  content: string
  genre?: string
  published: boolean
  tags?: string[]
}

export interface UpdatePostData {
  title?: string
  content?: string
  genre?: string
  published?: boolean
  tags?: string[]
}

export interface CreateUserData {
  email: string
  display_name: string
  username: string
  avatar_url?: string
  bio?: string
}

export interface UpdateUserData {
  display_name?: string
  username?: string
  avatar_url?: string
  bio?: string
  location?: string
  website?: string
}

// /src/lib/database.ts - Update method signatures

// BEFORE:
async upsertNotificationSettings(userId: string, settings: any): Promise<void>

// AFTER:
async upsertNotificationSettings(
  userId: string,
  settings: Partial<NotificationSettings>
): Promise<void> {
  // Implementation unchanged
}

// BEFORE:
async createPost(postData: any): Promise<string | null>

// AFTER:
async createPost(postData: CreatePostData): Promise<string | null> {
  // Implementation unchanged
}

// BEFORE:
async updatePost(postId: string, updates: any): Promise<boolean>

// AFTER:
async updatePost(postId: string, updates: UpdatePostData): Promise<boolean> {
  // Implementation unchanged
}

// BEFORE:
private handleError(operation: string, error: any): string

// AFTER:
private handleError(operation: string, error: unknown): string {
  const err = error instanceof Error ? error : new Error(String(error))
  logger.error(`Database operation failed: ${operation}`, err, { operation })
  return err.message
}
```

### Testing Checklist

- [ ] Run `npm run typecheck` - Should pass
- [ ] Test post creation with valid data
- [ ] Test post creation with invalid data (should get TypeScript error)
- [ ] Test user settings updates
- [ ] Run full test suite: `npm run test`
- [ ] Verify autocomplete works in IDE

### Success Criteria

- ✅ 30+ 'any' types replaced in database.ts
- ✅ TypeScript catches invalid data
- ✅ All database operations functional
- ✅ Better developer experience

### Rollback Procedure

```bash
git revert HEAD
npm run typecheck
```

### Git Commit Message

```
refactor(database): Replace 'any' types with proper interfaces

TYPE SAFETY IMPROVEMENT:
- Add CreatePostData, UpdatePostData interfaces
- Add CreateUserData, UpdateUserData interfaces
- Update 30+ method signatures in database.ts
- Replace 'any' with 'unknown' in error handler
- Improve type safety across database layer

Fixes issue: TypeScript 'any' usage (Part 2)
Phase 13/24 of remediation plan
```

---

## PHASE 14: Replace TypeScript 'any' Types (Part 3 - API Routes)

**Duration**: 3 hours
**Risk Level**: 🟡 Medium
**Dependencies**: Phase 13

### Objective

Add proper types to API route handlers, especially Supabase client usage.

### Files to Modify

1. `/app/api/webhooks/stripe/route.ts` (use SupabaseClient type)
2. 10-15 other API routes with 'any' types

### Implementation

```typescript
// /app/api/webhooks/stripe/route.ts

import { SupabaseClient } from '@supabase/supabase-js'

// BEFORE:
async function handleSubscriptionCreated(subscription: Stripe.Subscription, supabaseAdmin: any) {}

// AFTER:
async function handleSubscriptionCreated(
  subscription: Stripe.Subscription,
  supabaseAdmin: SupabaseClient
): Promise<void> {
  // Implementation unchanged, but now type-safe
}

// Similar updates for other handlers
async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  supabaseAdmin: SupabaseClient
): Promise<void> {}

async function handleChargeDisputeCreated(
  dispute: Stripe.Dispute,
  supabaseAdmin: SupabaseClient
): Promise<void> {}
```

### Testing Checklist

- [ ] Run `npm run typecheck` - Should pass
- [ ] Test Stripe webhook:
  ```bash
  stripe trigger customer.subscription.created
  ```
- [ ] Verify handler functions work correctly
- [ ] Check Supabase operations have proper types
- [ ] Run `npm run build` - Should succeed

### Success Criteria

- ✅ SupabaseClient type used throughout
- ✅ TypeScript autocomplete works for Supabase methods
- ✅ Webhooks process correctly
- ✅ No 'any' types in webhook handlers

### Rollback Procedure

```bash
git revert HEAD
```

### Git Commit Message

```
refactor(api): Replace 'any' types with SupabaseClient in API routes

TYPE SAFETY IMPROVEMENT:
- Use SupabaseClient type for supabaseAdmin parameter
- Add return type annotations to async functions
- Update webhook handler signatures
- Improve type inference in API routes

Fixes issue: TypeScript 'any' usage (Part 3)
Phase 14/24 of remediation plan
```

---

## PHASE 15: Remove Duplicate Components (Part 1)

**Duration**: 2 hours
**Risk Level**: 🟡 Medium
**Dependencies**: None

### Objective

Remove unused base component implementations, keeping only the "Enhanced" versions.

### Files to Delete

```
/app/submissions/SubmissionsView.tsx (unused)
/app/search/SearchPageView.tsx (unused)
```

### Files to Rename

```
/app/submissions/EnhancedSubmissionsView.tsx → SubmissionsView.tsx
/app/search/EnhancedSearchView.tsx → SearchView.tsx
```

### Files to Update (imports)

```
/app/submissions/page.tsx
/app/search/page.tsx
```

### Implementation

```bash
# Step 1: Verify which files import the components
grep -r "SubmissionsView" app/
grep -r "SearchPageView" app/

# Step 2: Create backup branch
git checkout -b phase-15-remove-duplicates

# Step 3: Remove unused files
git rm app/submissions/SubmissionsView.tsx
git rm app/search/SearchPageView.tsx

# Step 4: Rename Enhanced versions
git mv app/submissions/EnhancedSubmissionsView.tsx app/submissions/SubmissionsView.tsx
git mv app/search/EnhancedSearchView.tsx app/search/SearchView.tsx

# Step 5: Update imports in page files
```

```typescript
// /app/submissions/page.tsx
// BEFORE:
import { EnhancedSubmissionsView } from './EnhancedSubmissionsView'

// AFTER:
import { SubmissionsView } from './SubmissionsView'

export default function SubmissionsPage() {
  return <SubmissionsView />
}

// /app/search/page.tsx
// BEFORE:
import { EnhancedSearchView } from './EnhancedSearchView'

// AFTER:
import { SearchView } from './SearchView'

export default function SearchPage() {
  return <SearchView />
}
```

### Testing Checklist

- [ ] Run `npm run build` - Should succeed
- [ ] Test submissions page loads: http://localhost:3000/submissions
- [ ] Test search page loads: http://localhost:3000/search
- [ ] Test all features on submissions page:
  - [ ] Upload manuscript
  - [ ] Filter submissions
  - [ ] View analytics
- [ ] Test all features on search page:
  - [ ] Search posts
  - [ ] Filter by genre
  - [ ] View results
- [ ] Run `npm run typecheck` - Should pass

### Success Criteria

- ✅ Unused files deleted
- ✅ Enhanced versions renamed
- ✅ All imports updated
- ✅ Pages load without errors
- ✅ All features functional

### Rollback Procedure

```bash
git checkout main
git branch -D phase-15-remove-duplicates
```

### Git Commit Message

```
refactor: Remove duplicate component implementations

CODE CLEANUP:
- Delete unused SubmissionsView.tsx
- Delete unused SearchPageView.tsx
- Rename EnhancedSubmissionsView → SubmissionsView
- Rename EnhancedSearchView → SearchView
- Update imports in page components

Reduces codebase by ~2,000 lines

Fixes issue: Duplicate components
Phase 15/24 of remediation plan
```

---

## PHASE 16: Remove Duplicate Components (Part 2)

**Duration**: 2 hours
**Risk Level**: 🟡 Medium
**Dependencies**: Phase 15

### Objective

Continue removing duplicate components for remaining features.

### Files to Process

```
/app/profile/[username]/EnhancedProfileView.tsx → ProfileView.tsx
/app/feed/EnhancedFeedView.tsx → FeedView.tsx
(Check for other Enhanced* components)
```

### Implementation

Same pattern as Phase 15:

1. Verify usage with grep
2. Create backup branch
3. Delete unused base versions
4. Rename Enhanced versions
5. Update imports

### Testing Checklist

- [ ] Test profile pages load
- [ ] Test feed page loads
- [ ] Test all profile features work
- [ ] Test feed filtering/sorting
- [ ] Run full build and typecheck

### Success Criteria

- ✅ All duplicate components removed
- ✅ Codebase ~4,000 lines smaller
- ✅ No broken imports
- ✅ All features functional

### Git Commit Message

```
refactor: Complete duplicate component removal

CODE CLEANUP:
- Remove remaining Enhanced* component duplicates
- Standardize component naming
- Update all imports
- Reduce codebase size

Completes duplicate component cleanup

Fixes issue: Duplicate components (Part 2)
Phase 16/24 of remediation plan
```

---

# SPRINT 3: FEATURE COMPLETION & OPTIMIZATION (Phases 17-24)

## PHASE 17: Split God Object - Database Service (Part 1)

**Duration**: 4 hours
**Risk Level**: 🟡 Medium
**Dependencies**: Phase 13 (needs proper types)

### Objective

Split the massive database.ts (1,951 lines) into domain-specific services. Part 1 focuses on user operations.

### Files to Create

```
/src/lib/database/index.ts
/src/lib/database/user-service.ts
/src/lib/database/base-service.ts
```

### Implementation

```typescript
// /src/lib/database/base-service.ts
import { createClient } from '@supabase/supabase-js'
import { logger } from '../logger'

export class BaseService {
  protected supabase

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  protected handleError(operation: string, error: unknown): string {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error(`Database operation failed: ${operation}`, err, { operation })
    return err.message
  }
}

// /src/lib/database/user-service.ts
import { BaseService } from './base-service'
import { CreateUserData, UpdateUserData } from '@/src/types/database'
import { NotificationSettings, PrivacySettings } from '@/src/types/settings'

export class UserService extends BaseService {
  async createUser(userData: CreateUserData): Promise<string | null> {
    // Copy implementation from database.ts
  }

  async updateUser(userId: string, updates: UpdateUserData): Promise<boolean> {
    // Copy implementation from database.ts
  }

  async getUserById(userId: string): Promise<any> {
    // Copy implementation from database.ts
  }

  async upsertNotificationSettings(
    userId: string,
    settings: Partial<NotificationSettings>
  ): Promise<void> {
    // Copy implementation from database.ts
  }

  async upsertPrivacySettings(userId: string, settings: Partial<PrivacySettings>): Promise<void> {
    // Copy implementation from database.ts
  }

  // ... other user-related methods
}

// /src/lib/database/index.ts
export { UserService } from './user-service'
export { BaseService } from './base-service'

// For backwards compatibility during migration
import { UserService } from './user-service'
const userService = new UserService()
export { userService }
```

### Migration Strategy

1. Create new service files
2. Copy methods from database.ts
3. Keep old database.ts intact temporarily
4. Update imports gradually in following phases

### Testing Checklist

- [ ] Run `npm run typecheck` - Should pass
- [ ] Test user creation
- [ ] Test user profile updates
- [ ] Test settings updates
- [ ] Run user-related tests
- [ ] Verify no regressions

### Success Criteria

- ✅ UserService created with all user methods
- ✅ Original database.ts still works
- ✅ All user operations functional
- ✅ Tests pass

### Git Commit Message

```
refactor(database): Extract UserService from god object

ARCHITECTURE IMPROVEMENT:
- Create BaseService with common functionality
- Extract user operations to UserService
- Maintain backwards compatibility with database.ts
- Prepare for gradual migration

Part 1 of database.ts splitting

Fixes issue: God object pattern (Part 1)
Phase 17/24 of remediation plan
```

---

## PHASE 18: Split God Object - Database Service (Part 2)

**Duration**: 4 hours
**Risk Level**: 🟡 Medium
**Dependencies**: Phase 17

### Objective

Continue splitting database.ts by extracting post and messaging operations.

### Files to Create

```
/src/lib/database/post-service.ts
/src/lib/database/message-service.ts
```

### Implementation

Similar to Phase 17:

- Extract post CRUD operations
- Extract messaging operations
- Maintain backwards compatibility

### Testing Checklist

- [ ] Test post creation/editing
- [ ] Test messaging features
- [ ] Test comments and likes
- [ ] Run post-related tests

### Success Criteria

- ✅ PostService created
- ✅ MessageService created
- ✅ All features functional
- ✅ No regressions

### Git Commit Message

```
refactor(database): Extract Post and Message services

ARCHITECTURE IMPROVEMENT:
- Create PostService for post operations
- Create MessageService for messaging
- Continue database.ts refactoring
- Maintain backwards compatibility

Part 2 of database.ts splitting

Fixes issue: God object pattern (Part 2)
Phase 18/24 of remediation plan
```

---

## PHASE 19: Add Rate Limiting to AI Routes

**Duration**: 3 hours
**Risk Level**: 🟡 Medium
**Dependencies**: None (Upstash already configured)

### Objective

Add rate limiting to all 15 AI endpoints to prevent abuse and control costs.

### Files to Create

1. `/src/middleware/rate-limit-ai.ts`

### Implementation

```typescript
// /src/middleware/rate-limit-ai.ts
import { rateLimit } from '@/src/lib/rate-limit-new'
import { NextResponse } from 'next/server'
import { logger } from '@/src/lib/logger'

export async function rateLimitAI(
  req: Request,
  userId: string,
  tier: string
): Promise<NextResponse | null> {
  // Tier-based limits
  const limits = {
    free: { max: 10, window: '1d' }, // 10 per day
    premium: { max: 100, window: '1d' }, // 100 per day
    pro: { max: 500, window: '1d' }, // 500 per day
    studio: { max: 10000, window: '1d' }, // Unlimited (high limit)
  }

  const limit = limits[tier as keyof typeof limits] || limits.free

  const result = await rateLimit(req, `ai-${tier}:${userId}`, {
    max: limit.max,
    window: limit.window,
  })

  if (!result.success) {
    logger.warn('AI rate limit exceeded', {
      userId,
      tier,
      endpoint: new URL(req.url).pathname,
    })

    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        limit: limit.max,
        window: limit.window,
        retryAfter: result.retryAfter,
      },
      { status: 429 }
    )
  }

  return null // Success - continue processing
}
```

### Apply to Each AI Route

```typescript
// Example: /app/api/ai/brainstorm/route.ts
import { rateLimitAI } from '@/src/middleware/rate-limit-ai'
import { getServerUser } from '@/lib/server/auth'

export async function POST(req: Request) {
  // Get user
  const { user, error } = await getServerUser()
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ✅ NEW: Rate limiting
  const rateLimitError = await rateLimitAI(req, user.id, user.account_tier || 'free')
  if (rateLimitError) {
    return rateLimitError
  }

  // ... rest of AI processing
}
```

### Testing Checklist

- [ ] Test AI endpoint within limits (should succeed)
- [ ] Test exceeding rate limit:
  ```bash
  # Call endpoint 11 times as free tier user
  for i in {1..11}; do
    curl -X POST http://localhost:3000/api/ai/brainstorm ...
  done
  ```
- [ ] Verify 429 response on 11th call
- [ ] Verify different tiers have different limits
- [ ] Test rate limit reset after window expires

### Success Criteria

- ✅ All 15 AI routes protected
- ✅ Tier-based limits enforced
- ✅ Clear error messages
- ✅ Monitoring in place

### Git Commit Message

```
feat(ai): Add tier-based rate limiting to AI endpoints

SECURITY & COST CONTROL:
- Create rateLimitAI middleware
- Apply to all 15 AI routes
- Implement tier-based limits (free: 10/day, premium: 100/day, etc.)
- Add rate limit monitoring and logging

Prevents AI abuse and controls costs

Fixes issue: Missing rate limiting on AI routes
Phase 19/24 of remediation plan
```

---

## PHASE 20: Add Missing Database Indexes

**Duration**: 2 hours
**Risk Level**: 🟢 Low
**Dependencies**: None

### Objective

Add performance indexes for frequently-queried columns.

### Files to Create

1. `/supabase/migrations/20251015150000_add_performance_indexes.sql`

### Implementation

```sql
-- /supabase/migrations/20251015150000_add_performance_indexes.sql

-- Add index on posts.genre (frequent filter)
CREATE INDEX IF NOT EXISTS idx_posts_genre
  ON posts(genre)
  WHERE genre IS NOT NULL AND published = true;

-- Add composite index on manuscripts status + completion
CREATE INDEX IF NOT EXISTS idx_manuscripts_status_complete
  ON manuscripts(status, is_complete);

-- Add index on jobs.remote_ok (frequent filter)
CREATE INDEX IF NOT EXISTS idx_jobs_remote
  ON jobs(remote_ok, is_active)
  WHERE is_active = true;

-- Add index on conversations.updated_at (sorting)
CREATE INDEX IF NOT EXISTS idx_conversations_updated
  ON conversations(updated_at DESC);

-- Add index on follows for follower count queries
CREATE INDEX IF NOT EXISTS idx_follows_following
  ON follows(following_id)
  WHERE unfollowed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_follows_follower
  ON follows(follower_id)
  WHERE unfollowed_at IS NULL;

-- Add index on likes for post popularity queries
CREATE INDEX IF NOT EXISTS idx_likes_post
  ON likes(post_id, created_at DESC)
  WHERE unliked_at IS NULL;

-- Add comment to document index purpose
COMMENT ON INDEX idx_posts_genre IS
  'Performance index for genre filtering on published posts';
COMMENT ON INDEX idx_manuscripts_status_complete IS
  'Composite index for manuscript status queries';
```

### Testing Checklist

- [ ] Apply migration:
  ```bash
  npx supabase db push
  ```
- [ ] Verify indexes created:
  ```sql
  SELECT indexname, tablename, indexdef
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%'
  ORDER BY tablename, indexname;
  ```
- [ ] Test query performance:
  ```sql
  EXPLAIN ANALYZE
  SELECT * FROM posts
  WHERE genre = 'fiction' AND published = true
  ORDER BY created_at DESC
  LIMIT 20;
  -- Should use idx_posts_genre
  ```
- [ ] Verify application performance improvement
- [ ] Check index size:
  ```sql
  SELECT
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
  FROM pg_stat_user_indexes
  WHERE indexrelname LIKE 'idx_%'
  ORDER BY pg_relation_size(indexrelid) DESC;
  ```

### Success Criteria

- ✅ All indexes created successfully
- ✅ Queries use new indexes (EXPLAIN shows index scans)
- ✅ Performance improved (measure query time before/after)
- ✅ No negative impact on write operations

### Rollback Procedure

```sql
-- /supabase/migrations/20251015150001_rollback_indexes.sql
DROP INDEX IF EXISTS idx_posts_genre;
DROP INDEX IF EXISTS idx_manuscripts_status_complete;
DROP INDEX IF EXISTS idx_jobs_remote;
DROP INDEX IF EXISTS idx_conversations_updated;
DROP INDEX IF EXISTS idx_follows_following;
DROP INDEX IF EXISTS idx_follows_follower;
DROP INDEX IF EXISTS idx_likes_post;
```

### Git Commit Message

```
perf(database): Add performance indexes for frequent queries

PERFORMANCE IMPROVEMENT:
- Add index on posts.genre for filtering
- Add composite index on manuscripts (status, is_complete)
- Add index on jobs.remote_ok for job search
- Add index on conversations.updated_at for sorting
- Add indexes on follows and likes for counts

Improves query performance on high-traffic endpoints

Fixes issue: Missing database indexes
Phase 20/24 of remediation plan
```

---

## PHASE 21: Implement/Remove TODO Items (Part 1 - Critical)

**Duration**: 8 hours
**Risk Level**: 🟡 Medium
**Dependencies**: Phases 1-20 (needs logging infrastructure)

### Objective

Resolve the most critical TODO items that affect functionality.

### High-Priority TODOs to Implement

#### TODO 1: Sentry Integration in Logger

**File**: `/src/lib/editor-logger.ts:43`
**Estimated**: 2 hours

```typescript
// /src/lib/editor-logger.ts

// BEFORE:
// TODO: Send to Sentry or other monitoring service

// AFTER:
import * as Sentry from '@sentry/nextjs'

export function logError(error: Error, context?: Record<string, any>): void {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('[Editor Error]', error, context)
  }

  // Send to Sentry in production
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureException(error, {
      contexts: {
        custom: context,
      },
      tags: {
        component: context?.component || 'unknown',
      },
    })
  }
}
```

#### TODO 2: Fetch Actual Notifications

**File**: `/app/notifications/page.tsx:9`
**Estimated**: 3 hours

```typescript
// BEFORE:
const notifications: any[] = [] // TODO: Fetch actual notifications

// AFTER:
import { NotificationService } from '@/src/lib/database/notification-service'

export default async function NotificationsPage() {
  const { user } = await getServerUser()
  if (!user) redirect('/login')

  const notifications = await NotificationService.getUserNotifications(user.id, {
    limit: 50,
    unreadFirst: true,
  })

  return <NotificationsView notifications={notifications} />
}
```

#### TODO 3: Implement Gemini Client

**File**: `/src/lib/ai/ai-client.ts:95`
**Estimated**: 3 hours

```typescript
// /src/lib/ai/ai-client.ts

// BEFORE:
// TODO: Implement Gemini client

// AFTER:
import { GoogleGenerativeAI } from '@google/generative-ai'

class GeminiClient implements AIClient {
  private client: GoogleGenerativeAI

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey)
  }

  async generateText(prompt: string, options: AIOptions): Promise<string> {
    const model = this.client.getGenerativeModel({
      model: 'gemini-pro',
    })

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: options.maxTokens,
        temperature: options.temperature || 0.7,
      },
    })

    return result.response.text()
  }
}
```

### Testing Checklist

- [ ] Test Sentry error reporting in staging
- [ ] Verify notifications fetch and display
- [ ] Test Gemini AI client with API key
- [ ] Run `npm run build` - Should succeed
- [ ] Check for any remaining console.logs

### Success Criteria

- ✅ All critical TODOs implemented
- ✅ Features fully functional
- ✅ Sentry receiving errors
- ✅ Tests pass

### Git Commit Message

```
feat: Implement critical TODO items

FEATURE COMPLETION:
- Integrate Sentry error reporting in logger
- Implement notifications fetching and display
- Add Google Gemini AI client
- Remove 3 critical TODO comments

Improves platform completeness

Fixes issue: Critical TODO items
Phase 21/24 of remediation plan
```

---

## PHASE 22: Implement/Remove TODO Items (Part 2 - Remaining)

**Duration**: 6 hours
**Risk Level**: 🟢 Low
**Dependencies**: Phase 21

### Objective

Resolve remaining TODOs or remove them with documentation.

### Strategy

For each remaining TODO (75 items):

1. Assess if feature is needed
2. Implement if critical
3. Create tracking issue if complex
4. Remove if obsolete

### Implementation

Create issues for complex TODOs:

- Story bible features (Editor)
- Advanced script features
- Analytics enhancements

Remove obsolete TODOs:

- Completed features
- Deprecated functionality

### Testing Checklist

- [ ] Verify no broken features after TODO removal
- [ ] Check created GitHub issues link correctly
- [ ] Run full test suite

### Success Criteria

- ✅ All TODOs resolved (implemented or documented)
- ✅ GitHub issues created for deferred work
- ✅ No TODO comments in main code

### Git Commit Message

```
chore: Resolve remaining TODO items

CLEANUP:
- Implement 10 simple TODOs
- Create GitHub issues for 20 complex TODOs
- Remove 45 obsolete TODO comments
- Document deferred features

Cleans up codebase

Fixes issue: TODO comments (Part 2)
Phase 22/24 of remediation plan
```

---

## PHASE 23: Remove Placeholder Tests

**Duration**: 4 hours
**Risk Level**: 🟢 Low
**Dependencies**: None

### Objective

Either implement real tests or remove placeholder test files.

### Files to Process

```
__tests__/api/scripts.test.ts (13 placeholders)
__tests__/api/ai.test.ts (15 placeholders)
__tests__/api/stripe.test.ts (18 placeholders)
```

### Strategy

1. Implement real tests for critical paths (Stripe webhooks, AI routes)
2. Remove placeholder tests for non-critical paths
3. Set up proper test infrastructure

### Implementation Example

```typescript
// __tests__/api/stripe.test.ts

// BEFORE:
describe('Stripe webhook', () => {
  it('should process subscription.created event', () => {
    expect(true).toBe(true) // Placeholder
  })
})

// AFTER:
import { POST } from '@/app/api/webhooks/stripe/route'
import { createMocks } from 'node-mocks-http'

describe('Stripe webhook', () => {
  it('should process subscription.created event', async () => {
    const event = {
      id: 'evt_test_123',
      type: 'customer.subscription.created',
      data: {
        object: {
          id: 'sub_test_123',
          customer: 'cus_test_123',
          items: { data: [{ price: { id: 'price_test_123' } }] },
        },
      },
    }

    const signature = generateTestSignature(event)
    const { req } = createMocks({
      method: 'POST',
      headers: {
        'stripe-signature': signature,
      },
      body: event,
    })

    const response = await POST(req as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.received).toBe(true)
  })
})
```

### Testing Checklist

- [ ] Run `npm run test` - Should have actual tests
- [ ] Verify test coverage increased
- [ ] Check critical paths have tests
- [ ] Remove files with only placeholders

### Success Criteria

- ✅ Real tests for critical features
- ✅ Placeholder tests removed
- ✅ Test coverage >30% (up from 5%)
- ✅ CI/CD pipeline passes

### Git Commit Message

```
test: Replace placeholder tests with real implementations

TEST COVERAGE IMPROVEMENT:
- Implement Stripe webhook tests
- Implement AI route tests
- Implement critical API route tests
- Remove placeholder expect(true).toBe(true)
- Increase coverage from 5% to 30%

Improves code quality and reliability

Fixes issue: Placeholder tests
Phase 23/24 of remediation plan
```

---

## PHASE 24: Final Cleanup and Optimization

**Duration**: 3 hours
**Risk Level**: 🟢 Low
**Dependencies**: All previous phases

### Objective

Final polish: remove backup files, optimize bundle size, clean up dependencies.

### Tasks

1. **Remove Backup Files**

```bash
find . -name "*.bak*" -o -name "*.backup" -o -name "*.old" | xargs git rm
echo "*.bak*\n*.backup\n*.old\n*.tmp" >> .gitignore
```

2. **Clean Up Unused Dependencies**

```bash
npm prune
npx depcheck  # Find unused dependencies
npm uninstall [unused packages]
```

3. **Optimize Bundle Size**

```bash
ANALYZE=true npm run build
# Review bundle analyzer output
# Identify large dependencies to code-split
```

4. **Update Documentation**

```markdown
# Update README.md with:

- New architecture (split services)
- Testing instructions
- Security improvements
- Deployment checklist
```

5. **Final TypeScript Strict Mode**

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedParameters": true, // Enable
    "noUnusedLocals": true, // Enable
    "noImplicitReturns": true // Enable
  }
}
```

### Testing Checklist

- [ ] Run `npm run build` - Should succeed
- [ ] Run `npm run typecheck` - Should pass with strict mode
- [ ] Run `npm run lint` - Should pass
- [ ] Run `npm run test` - All tests pass
- [ ] Test production build locally
- [ ] Check bundle size (should be smaller)
- [ ] Review all documentation updates

### Success Criteria

- ✅ No backup files in repo
- ✅ Unused dependencies removed
- ✅ Bundle optimized
- ✅ Full strict TypeScript mode
- ✅ Documentation up-to-date

### Git Commit Message

```
chore: Final cleanup and optimization

FINAL POLISH:
- Remove all backup files (.bak, .backup, .old)
- Clean up unused npm dependencies
- Enable full TypeScript strict mode
- Optimize bundle size
- Update documentation

Completes remediation plan

Phase 24/24 of remediation plan - COMPLETE ✅
```

---

# TESTING STRATEGY

## After Each Phase

### 1. Automated Testing

```bash
# Run before committing each phase
npm run typecheck      # TypeScript compilation
npm run lint           # Linting
npm run test           # Unit tests
npm run build          # Production build
```

### 2. Manual Testing Checklist

- [ ] Feature still works as before
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Performance not degraded

### 3. Rollback Verification

```bash
# Test rollback works
git stash
git revert HEAD
npm run build && npm run test
# If tests pass, rollback is safe
git reset --hard HEAD@{1}
git stash pop
```

## Integration Testing (After Each Sprint)

### Sprint 1 (After Phase 8)

```bash
# Test critical security features
npm run test:security
stripe trigger customer.subscription.created  # Test webhook idempotency
# Test RLS policies as regular user
```

### Sprint 2 (After Phase 16)

```bash
# Test architecture changes
npm run test:integration
# Test all API routes
# Test all UI components
```

### Sprint 3 (After Phase 24)

```bash
# Full end-to-end testing
npm run test:e2e
# Performance testing
# Security scan
```

## Deployment Testing

### Staging Deployment (After Each Sprint)

```bash
# Deploy to Vercel preview
git push origin phase-X-branch
# Test in staging environment
# Run smoke tests
```

### Production Deployment (After Phase 24)

```bash
# Final checks
npm run test:all
npm run build
# Deploy to production
# Monitor for 24 hours
```

---

# ROLLBACK PROCEDURES

## Phase-Level Rollback

```bash
# If phase fails
git revert HEAD
npm run test  # Verify system stable
git push origin main
```

## Sprint-Level Rollback

```bash
# If sprint causes issues
git revert --no-commit HEAD~8..HEAD  # Revert last 8 commits (1 sprint)
git commit -m "Revert Sprint 1"
npm run test
git push origin main
```

## Emergency Rollback

```bash
# If production broken
git checkout main
git reset --hard [last-known-good-commit]
git push -f origin main
# Redeploy to Vercel
```

---

# MONITORING & SUCCESS METRICS

## Track After Each Phase

### Code Quality Metrics

```bash
# Lines of code
cloc src/ app/ --exclude-dir=node_modules

# TypeScript 'any' count
grep -r ": any" src/ app/ | wc -l

# console.log count
grep -r "console\." src/ app/ | wc -l

# TODO count
grep -r "TODO" src/ app/ | wc -l
```

### Performance Metrics

- Bundle size (check ANALYZE output)
- Build time (measure with `time npm run build`)
- Test suite time
- Database query performance (EXPLAIN ANALYZE)

### Security Metrics

- RLS coverage (count tables with/without RLS)
- Rate-limited endpoints
- Protected routes

## Phase Completion Dashboard

| Phase | Status | Duration | Issues | Rollback Tested |
| ----- | ------ | -------- | ------ | --------------- |
| 1     | ⬜     | -        | -      | -               |
| 2     | ⬜     | -        | -      | -               |
| ...   | ...    | ...      | ...    | ...             |

---

# TIMELINE ESTIMATES

## Sprint 1 (Phases 1-8): 14 hours

- Week 1: Monday-Tuesday
- Critical security fixes
- Can deploy after Sprint 1

## Sprint 2 (Phases 9-16): 25 hours

- Week 1: Wednesday-Friday
- Week 2: Monday
- Architecture improvements

## Sprint 3 (Phases 17-24): 31 hours

- Week 2: Tuesday-Friday
- Feature completion & optimization

## Total: 70 hours (2 weeks with 2 developers, or 3.5 weeks with 1 developer)

---

# CONCLUSION

This 24-phase plan provides:

- ✅ Granular, testable steps
- ✅ Clear rollback procedures
- ✅ Testing after every phase
- ✅ Progressive improvement
- ✅ Minimal risk to production

**Recommendation**:

- Start with Phase 1 immediately
- Complete Sprint 1 (Phases 1-8) before any production deployment
- Run Sprints 2 and 3 post-launch for continued improvement

**Next Steps**:

1. Review and approve this plan
2. Create GitHub project board with 24 issues (one per phase)
3. Assign team members to phases
4. Begin Phase 1

---

**Plan Created**: October 15, 2025
**Next Review**: After Sprint 1 completion
**Contact**: Refer to phase-specific sections for details
