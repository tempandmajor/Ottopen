# Google OAuth Setup Guide for Ottopen

> **⚠️ NOTE**: This guide is outdated. All code implementation is **COMPLETE**!
> **See `GOOGLE_OAUTH_SETUP.md` for the updated configuration-only guide (15-20 min setup)**

---

**Implementation Status**: ✅ **Code Complete** - Only configuration needed

This guide walks you through implementing Google OAuth authentication in Ottopen using Supabase.

## Prerequisites

- Supabase project (Free plan supports OAuth!)
- Google Cloud Platform account
- Ottopen application deployed or running locally

---

## Step 1: Configure Google Cloud Console

### 1.1 Create OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Select **Application type**: Web application
6. Add **Name**: "Ottopen OAuth"

### 1.2 Configure Authorized Redirect URIs

Add these redirect URIs:

**For Local Development:**

```
http://localhost:3000/auth/callback
https://[your-project-ref].supabase.co/auth/v1/callback
```

**For Production:**

```
https://ottopen.app/auth/callback
https://[your-project-ref].supabase.co/auth/v1/callback
```

### 1.3 Save Credentials

- Copy **Client ID**
- Copy **Client Secret**
- Keep these secure!

---

## Step 2: Configure Supabase

### 2.1 Enable Google Provider

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Authentication** → **Providers**
4. Find **Google** in the list
5. Toggle **Enable Google Provider** to ON

### 2.2 Add Google Credentials

1. Paste your **Google Client ID**
2. Paste your **Google Client Secret**
3. Click **Save**

### 2.3 Configure Site URL (Production Only)

1. Navigate to **Authentication** → **URL Configuration**
2. Set **Site URL** to: `https://ottopen.app`
3. Add **Redirect URLs**:
   ```
   https://ottopen.app/**
   http://localhost:3000/** (for local testing)
   ```

---

## Step 3: Update Application Code

### 3.1 Update Sign In Page

Edit `/app/auth/signin/page.tsx`:

```typescript
'use client'

import { Button } from '@/src/components/ui/button'
import { useAuth } from '@/src/contexts/auth-context'
import { FcGoogle } from 'react-icons/fc'

export default function SignIn() {
  const { signIn, signInWithGoogle } = useAuth()

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithGoogle()
      if (!result.success) {
        toast.error(result.error || 'Google sign-in failed')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    }
  }

  return (
    <Card>
      <CardContent>
        {/* ... existing email/password form ... */}

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        {/* Google Sign In Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
        >
          <FcGoogle className="mr-2 h-5 w-5" />
          Continue with Google
        </Button>
      </CardContent>
    </Card>
  )
}
```

### 3.2 Update Sign Up Page

Add the same Google button to `/app/auth/signup/page.tsx`:

```typescript
{/* Add after the signup form, before "Already have an account" */}

{/* Divider */}
<div className="relative my-6">
  <div className="absolute inset-0 flex items-center">
    <span className="w-full border-t" />
  </div>
  <div className="relative flex justify-center text-xs uppercase">
    <span className="bg-background px-2 text-muted-foreground">
      Or sign up with
    </span>
  </div>
</div>

{/* Google Sign Up Button */}
<Button
  type="button"
  variant="outline"
  className="w-full"
  onClick={handleGoogleSignIn}
>
  <FcGoogle className="mr-2 h-5 w-5" />
  Sign up with Google
</Button>
```

### 3.3 Update Auth Context

Edit `/src/contexts/auth-context.tsx` to add the `signInWithGoogle` function:

```typescript
import { supabase } from '@/src/lib/supabase'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // ... existing code ...

  const signInWithGoogle = async () => {
    try {
      if (!supabase) {
        return { success: false, error: 'Supabase client not configured' }
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        console.error('Google sign-in error:', error)
        return { success: false, error: error.message }
      }

      // Supabase will redirect to Google, then back to callback
      return { success: true }
    } catch (error: any) {
      console.error('Unexpected error during Google sign-in:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        signInWithGoogle, // Add this
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
```

### 3.4 Create OAuth Callback Handler

Create `/app/auth/callback/page.tsx`:

```typescript
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/src/lib/supabase'
import { toast } from 'react-hot-toast'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase will automatically handle the OAuth callback
        // Check if user is now authenticated
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error('Callback error:', error)
          toast.error('Authentication failed')
          router.push('/auth/signin')
          return
        }

        if (session) {
          // Check if this is a new user (first OAuth sign-in)
          const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('id', session.user.id)
            .single()

          if (!existingUser) {
            // New user - create profile
            const { error: insertError } = await supabase.from('users').insert({
              id: session.user.id,
              email: session.user.email,
              display_name: session.user.user_metadata.full_name || session.user.email?.split('@')[0],
              username: session.user.email?.split('@')[0] || `user_${session.user.id.slice(0, 8)}`,
              avatar_url: session.user.user_metadata.avatar_url,
              account_type: 'writer',
              account_tier: 'free',
              verification_status: 'verified', // OAuth users are auto-verified
            })

            if (insertError) {
              console.error('Error creating user profile:', insertError)
            }
          }

          toast.success('Signed in successfully!')
          router.push('/feed')
        } else {
          router.push('/auth/signin')
        }
      } catch (error) {
        console.error('Callback handler error:', error)
        toast.error('Something went wrong')
        router.push('/auth/signin')
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  )
}
```

### 3.5 Install Google Icon (Optional)

If not using `react-icons`:

```bash
npm install react-icons
```

---

## Step 4: Update Database Schema

Ensure your `users` table supports OAuth:

```sql
-- Add columns if they don't exist
ALTER TABLE users
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'email',
ADD COLUMN IF NOT EXISTS provider_id TEXT;

-- Optional: Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider, provider_id);
```

---

## Step 5: Testing OAuth Flow

### 5.1 Local Testing

1. Start your dev server:

   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/auth/signin`

3. Click "Continue with Google"

4. Select Google account

5. Verify redirect to `/feed`

### 5.2 Test Checklist

- [ ] Google sign-in button appears
- [ ] Clicking button redirects to Google
- [ ] Google account selection works
- [ ] Callback redirects to `/feed`
- [ ] User profile created in database
- [ ] Avatar from Google is saved
- [ ] Display name from Google is saved
- [ ] Email verification not required (OAuth users auto-verified)
- [ ] Existing OAuth users can sign in again
- [ ] Sign out works
- [ ] Sign in again after sign out works

---

## Step 6: Production Deployment

### 6.1 Update Environment Variables

Add to Vercel environment variables:

```env
# These are already in your Supabase config
NEXT_PUBLIC_SUPABASE_URL=your_production_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_key
```

### 6.2 Update Google Cloud Console

1. Go to Google Cloud Console
2. Update **Authorized redirect URIs** with production URL
3. Verify **Authorized JavaScript origins** includes `https://ottopen.app`

### 6.3 Deploy and Test

1. Deploy to Vercel
2. Test OAuth flow on production
3. Verify redirects work correctly

---

## Troubleshooting

### Error: "redirect_uri_mismatch"

**Solution:** Ensure redirect URI in Google Console matches exactly:

```
https://[your-project-ref].supabase.co/auth/v1/callback
```

### Error: "Invalid OAuth callback"

**Solution:**

- Check Site URL in Supabase → Authentication → URL Configuration
- Verify redirect URLs are whitelisted

### Users Not Being Created

**Solution:**

- Check Supabase logs for errors
- Verify `users` table exists
- Check RLS policies allow inserting for authenticated users

### Infinite Redirect Loop

**Solution:**

- Clear browser cookies
- Check callback handler doesn't redirect to itself
- Verify session is being established correctly

---

## Security Best Practices

1. **Never commit credentials to Git**
   - Keep `.env.local` in `.gitignore`
   - Use Vercel environment variables for production

2. **Rotate secrets regularly**
   - Change OAuth client secret periodically
   - Update in both Google Console and Supabase

3. **Monitor OAuth usage**
   - Check Supabase dashboard for unusual activity
   - Set up alerts for failed auth attempts

4. **Validate user data**
   - Don't trust all data from OAuth provider
   - Validate email format
   - Sanitize display names

---

## Cost Considerations

### Supabase Free Plan OAuth Limits:

- **50 Monthly Active Third-Party Users** included free
- After 50 MAU: $0.00325 per MAU

### Google OAuth:

- Free for most use cases
- Monitor quota in Google Cloud Console

---

## Additional Features

### Add More OAuth Providers

Supabase supports many providers (all available on free plan):

- GitHub
- GitLab
- Bitbucket
- Azure
- Facebook
- Apple
- Discord
- Twitch
- And more!

Same process as Google:

1. Get credentials from provider
2. Enable in Supabase
3. Add button to sign-in page

---

## Support

For issues:

1. Check [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
2. Review [Google OAuth 2.0 Docs](https://developers.google.com/identity/protocols/oauth2)
3. Contact support@ottopen.app

---

**Status:** Ready to implement ✅
**Estimated Time:** 30-60 minutes
**Difficulty:** Intermediate
