# Next.js Architecture Migration Guide

## ✅ Completed Work

### 1. Server Infrastructure Created

- ✅ `lib/server/auth.ts` - Server-side authentication utilities
- ✅ `lib/server/data.ts` - Server-side data fetching functions
- ✅ `app/actions/jobs.ts` - Job-related server actions
- ✅ `app/actions/submissions.ts` - Submission server actions
- ✅ `app/actions/referrals.ts` - Referral server actions

### 2. Pages Refactored

- ✅ `app/opportunities/page.tsx` - Now uses RSC pattern with server-side data
- ✅ `app/opportunities/OpportunitiesView.tsx` - Client component using server actions
- ✅ Added `loading.tsx` files for: opportunities, dashboard, submissions, referrals

### 3. Configuration Updates

- ✅ `next.config.js` - Added `serverComponentsExternalPackages` for Supabase
- ✅ Server actions configuration enhanced

## 🔄 Remaining Work

### Priority 1: Refactor Remaining Pages

#### A. Dashboard Page (`app/dashboard/page.tsx`)

**Current State:** Entire page is client-side with useEffect data fetching

**Action Required:**

```typescript
// app/dashboard/page.tsx (NEW)
import { requireAuth } from '@/lib/server/auth'
import {
  getServerPosts,
  getServerUserStatistics,
  getServerWritingGoals,
  getServerWritingSessions,
  getServerWritingStreak,
  getServerFollowers,
  getServerUsers,
} from '@/lib/server/data'
import { DashboardView } from './DashboardView'

export default async function DashboardPage() {
  const user = await requireAuth()
  const userId = user.profile?.id || user.id

  const [
    userStatistics,
    userPosts,
    followers,
    writingStreak,
    writingSessions,
    writingGoals,
    recentPosts,
    suggestedAuthors,
  ] = await Promise.all([
    getServerUserStatistics(userId),
    getServerPosts({ userId, limit: 100 }),
    getServerFollowers(userId),
    getServerWritingStreak(userId),
    getServerWritingSessions(userId, 30),
    getServerWritingGoals(userId),
    getServerPosts({ limit: 5, published: true }),
    getServerUsers('', 4),
  ])

  return (
    <DashboardView
      user={user}
      userStatistics={userStatistics}
      userPosts={userPosts}
      followers={followers}
      writingStreak={writingStreak}
      writingSessions={writingSessions}
      writingGoals={writingGoals}
      recentPosts={recentPosts}
      suggestedAuthors={suggestedAuthors}
    />
  )
}
```

**Then rename and update:**

1. Rename `app/dashboard/page.tsx` → `app/dashboard/DashboardView.tsx`
2. Add `'use client'` directive
3. Update function signature to accept props
4. Remove all `useEffect` calls
5. Use initial data from props
6. Remove `<ProtectedRoute>` wrapper

#### B. Submissions Page (`app/submissions/page.tsx`)

**Current State:** Client-side with OpportunitiesClient pattern

**Action Required:**

```typescript
// app/submissions/page.tsx (NEW)
import { requireAuth } from '@/lib/server/auth'
import { getServerUserManuscripts, getServerUserSubmissions } from '@/lib/server/data'
import { SubmissionsView } from './SubmissionsView'

export default async function SubmissionsPage() {
  const user = await requireAuth()
  const userId = user.profile?.id || user.id

  const [manuscripts, submissions] = await Promise.all([
    getServerUserManuscripts(userId),
    getServerUserSubmissions(userId),
  ])

  return <SubmissionsView user={user} manuscripts={manuscripts} submissions={submissions} />
}
```

**Then:**

1. Rename `SubmissionsClient.tsx` → `SubmissionsView.tsx`
2. Add props interface
3. Remove useEffect
4. Update to use server actions from `app/actions/submissions.ts`

#### C. Referrals Page (`app/referrals/page.tsx`)

**Action Required:**

```typescript
// app/referrals/page.tsx (NEW)
import { requireAuth } from '@/lib/server/auth'
import {
  getServerUserReferralCode,
  getServerUserReferrals,
  getServerReferralStats,
} from '@/lib/server/data'
import { ReferralsView } from './ReferralsView'

export default async function ReferralsPage() {
  const user = await requireAuth()
  const userId = user.profile?.id || user.id

  const [referralCode, referrals, stats] = await Promise.all([
    getServerUserReferralCode(userId),
    getServerUserReferrals(userId),
    getServerReferralStats(userId),
  ])

  return (
    <ReferralsView
      user={user}
      referralCode={referralCode}
      referrals={referrals}
      stats={stats}
    />
  )
}
```

**Then:**

1. Rename `ReferralsClient.tsx` → `ReferralsView.tsx`
2. Follow same pattern as other pages

#### D. Homepage (`app/page.tsx`)

**Current State:** Client-side useEffect for stats and posts

**Action Required:**

```typescript
// app/page.tsx (UPDATE - keep 'use client' for redirect logic)
'use client'

import { Navigation } from '@/src/components/navigation'
import { Footer } from '@/src/components/footer'
// ... other imports
import { useState, useEffect } from 'react'
import { useAuth } from '@/src/contexts/auth-context'
import { useNavigate } from '@/src/hooks/use-navigate'

// Keep this client-side because of redirect logic
// But consider moving to middleware or server-side redirect
```

**Better Approach:**
Create a separate homepage wrapper that fetches data server-side but handles redirect client-side.

### Priority 2: Additional Server Actions

Create these files:

#### `app/actions/posts.ts`

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createPostAction(/* ... */) {
  // Implementation
}

export async function updatePostAction(/* ... */) {
  // Implementation
}

export async function deletePostAction(/* ... */) {
  // Implementation
}

export async function likePostAction(/* ... */) {
  // Implementation
}
```

#### `app/actions/user.ts`

```typescript
'use server'

export async function updateUserProfileAction(/* ... */) {
  // Implementation
}

export async function followUserAction(/* ... */) {
  // Implementation
}

export async function unfollowUserAction(/* ... */) {
  // Implementation
}
```

### Priority 3: Auth Flow Simplification

**Current Issues:**

- Complex client-side auth context with manual session syncing
- Watchdog timer to prevent infinite loading
- Protected Route wrapper on every page

**Recommended Changes:**

1. **Keep `src/contexts/auth-context.tsx` for now** (gradual migration)
2. **But remove dependency on it from pages** - pages should use server-side auth
3. **Update middleware** to handle more auth logic
4. **Create simplified client auth hook** for client components only:

```typescript
// src/hooks/use-client-auth.ts
'use client'
import { useAuth as useSupabaseAuth } from '@/src/contexts/auth-context'

export function useClientAuth() {
  const { user, loading } = useSupabaseAuth()
  // Simplified version - no signIn/signUp here
  return { user, loading }
}
```

### Priority 4: Settings Page

The settings page can remain fully client-side since it's form-heavy and doesn't benefit from SSR:

```typescript
// app/settings/page.tsx
import { requireAuth } from '@/lib/server/auth'
import { SettingsView } from './SettingsView'

export default async function SettingsPage() {
  const user = await requireAuth()
  return <SettingsView user={user} />
}
```

## 🎯 Step-by-Step Implementation Order

### Week 1

1. ✅ Complete opportunities page (DONE)
2. ⏳ Refactor dashboard page
3. ⏳ Create posts server actions

### Week 2

4. ⏳ Refactor submissions page
5. ⏳ Refactor referrals page
6. ⏳ Create user server actions

### Week 3

7. ⏳ Simplify homepage data fetching
8. ⏳ Update settings page
9. ⏳ Test all pages thoroughly

### Week 4

10. ⏳ Performance optimization
11. ⏳ Add error boundaries
12. ⏳ Final testing and cleanup

## 📝 Migration Checklist for Each Page

When migrating a page component:

- [ ] Create new page.tsx with async function
- [ ] Add `requireAuth()` call
- [ ] Fetch data server-side with Promise.all
- [ ] Create/rename View component with 'use client'
- [ ] Pass data as props to View component
- [ ] Remove all useEffect data fetching
- [ ] Remove ProtectedRoute wrapper
- [ ] Remove useAuth except for user profile access
- [ ] Update to use server actions instead of dbService
- [ ] Add loading.tsx file
- [ ] Test thoroughly

## 🚨 Common Pitfalls

1. **Don't mix server and client code**
   - Server components can't use hooks or event handlers
   - Client components can't be async or use server-only APIs

2. **Props must be serializable**
   - Can't pass functions or class instances
   - Dates become strings
   - undefined becomes null

3. **Server actions need 'use server'**
   - Must be at top of file
   - Can't use client-only code
   - Always return serializable data

4. **Cookies in server components**
   - Use try/catch when setting cookies
   - Server Components can't modify cookies easily
   - Use middleware or route handlers for cookie mutations

## 📊 Expected Performance Improvements

After full migration:

- **Initial page load:** 40-60% faster (SSR vs client fetch)
- **Time to Interactive:** 50-70% faster
- **SEO:** Massive improvement (content available on first paint)
- **User experience:** No loading spinners for initial data

## 🔍 Testing Strategy

For each refactored page:

1. **Visual Regression:** Ensure exact same appearance
2. **Functionality:** All buttons and interactions work
3. **Data accuracy:** Correct data displayed
4. **Loading states:** Proper suspense boundaries
5. **Error handling:** Graceful error display
6. **Performance:** Measure with Lighthouse

## 🛠️ Debugging Tips

1. **Enable verbose logging:**

   ```typescript
   console.log('[Server]:', data) // In server components
   console.log('[Client]:', data) // In client components
   ```

2. **Check Network tab:** Server actions appear as POST requests

3. **Use React DevTools:** See which components are server/client

4. **Check cookies:** Ensure auth cookies are set correctly

## 📚 Resources

- [Next.js Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Supabase with Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)

## ⚠️ Important Notes

- **DO NOT change any styling, design, or visual identity**
- **Keep exact same UI/UX**
- **Only change architecture, not appearance**
- **Test each page after migration**
- **Can be done incrementally (one page at a time)**
