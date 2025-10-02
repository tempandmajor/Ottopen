# Deployment Checklist ✅

Since your API keys are already configured in Vercel, you're almost ready to deploy!

## Pre-Deployment Verification

### 1. Verify Environment Variables in Vercel Dashboard

Go to: `Vercel Dashboard → Your Project → Settings → Environment Variables`

**Required Variables**:

```bash
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
✅ SUPABASE_SERVICE_ROLE_KEY
✅ OPENAI_API_KEY (or ANTHROPIC_API_KEY)
```

**Optional but Recommended**:

```bash
□ ANTHROPIC_API_KEY (for multi-provider fallback)
□ NEXT_PUBLIC_APP_URL (your production URL)
□ SMTP_* (for email notifications)
□ SENTRY_DSN (for error tracking)
```

### 2. Database Setup

**Run Supabase Migrations**:

1. Go to Supabase Dashboard → SQL Editor
2. Run all migration files in `supabase/migrations/` in order
3. Verify tables created:
   - manuscripts
   - chapters
   - scenes
   - characters
   - ai_suggestions
   - ai_usage
   - writing_goals
   - etc.

**Or use Supabase CLI**:

```bash
npx supabase db push
```

### 3. Test AI Features Locally (Optional)

```bash
npm run dev
```

Test each feature:

- ✅ Expand
- ✅ Rewrite
- ✅ Describe
- ✅ Brainstorm
- ✅ Critique

### 4. Deploy to Vercel

**Option A: Git Push (Recommended)**

```bash
git add .
git commit -m "feat: complete AI implementation - Sudowrite alternative ready"
git push
```

Vercel auto-deploys on push to main branch.

**Option B: Vercel CLI**

```bash
vercel --prod
```

### 5. Post-Deployment Verification

**Test Production AI Endpoints**:

```bash
# Replace with your production URL
curl -X POST https://your-app.vercel.app/api/ai/expand \
  -H "Content-Type: application/json" \
  -d '{
    "contextBefore": "The door creaked open slowly...",
    "length": "paragraph"
  }'
```

**Check Critical Pages**:

- ✅ Homepage: `https://your-app.vercel.app/`
- ✅ Editor: `https://your-app.vercel.app/editor`
- ✅ AI Assistant Panel: Test in editor
- ✅ Authentication: Sign up flow
- ✅ Dashboard: After login

### 6. Monitor First Deployment

**Check Vercel Logs**:

- Go to: `Vercel Dashboard → Deployments → Latest`
- Monitor for errors in Runtime Logs
- Check Function Logs for AI API calls

**Common Issues & Solutions**:

❌ **"AI request failed"**
→ Check API keys are set in Production environment (not just Preview)
→ Verify Supabase URL/keys are correct

❌ **"Database connection failed"**
→ Run database migrations in Supabase
→ Check SUPABASE_SERVICE_ROLE_KEY is set

❌ **"Usage limit reached"**
→ Check ai_usage table exists
→ Verify checkUsageLimits() function works

### 7. Set Up Monitoring (Optional)

**Add Sentry for Error Tracking**:

```bash
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_AUTH_TOKEN=your_auth_token
```

**Add Analytics**:

```bash
NEXT_PUBLIC_GA_ID=your_google_analytics_id
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
```

## 🚀 Quick Deploy Command

If everything is set up in Vercel:

```bash
# Commit and push
git add .
git commit -m "feat: AI-powered writing platform - production ready"
git push origin main

# Vercel auto-deploys ✨
```

## 📊 Post-Launch Tasks

1. **Test AI Features** in production with real users
2. **Monitor API Costs** (OpenAI/Anthropic usage)
3. **Set Up Usage Alerts** when limits are reached
4. **Create Onboarding Flow** for new users
5. **Add Subscription Billing** (Stripe integration)
6. **Marketing Launch**:
   - Product Hunt
   - Writing community forums
   - Social media (Twitter, Reddit r/writing)

## 💰 Cost Management

**Monitor AI Costs**:

- OpenAI Dashboard: https://platform.openai.com/usage
- Anthropic Console: https://console.anthropic.com/

**Expected Costs (Monthly)**:

- Free tier: ~$10-50 (10k words/user)
- Pro tier: ~$100-500 (100k words/user)
- Premium tier: ~$500-2000 (500k words/user)

**Tip**: Set up billing alerts in OpenAI/Anthropic dashboards!

## 🎯 Success Metrics to Track

- User signups
- AI features usage (which are most popular?)
- Words generated per user
- Session duration
- Retention rate (7-day, 30-day)
- Conversion to paid tiers

---

## 🔥 You're Ready When:

- ✅ All environment variables set in Vercel
- ✅ Supabase migrations run
- ✅ Build passes (`npm run build`)
- ✅ At least one AI provider key configured
- ✅ Deployment successful in Vercel

**Your app is production-ready and can compete with Sudowrite!** 🎉
