# ✅ Deployment Verification Checklist

## 🎯 Current Status

- ✅ API keys added to Vercel environment variables
- ⏳ Need to trigger production deployment
- ⏳ Need to test AI features
- ⏳ Need to apply email templates

---

## 🚀 Step 1: Trigger Production Deployment

Since you've added new environment variables, you need to redeploy for them to take effect.

### Option A: Via Vercel Dashboard (Recommended)

1. **Go to your project**:
   - Visit: https://vercel.com/dashboard
   - Select your Ottopen project

2. **Trigger deployment**:
   - Go to **Deployments** tab
   - Find the latest deployment
   - Click the three dots **(...)**
   - Click **Redeploy**
   - Select **Use existing Build Cache** (faster)
   - Click **Redeploy**

3. **Wait for deployment** (~2-3 minutes):
   - Watch the deployment logs
   - Wait for "✓ Deployment Ready"

### Option B: Via CLI

```bash
# Login to Vercel first
vercel login

# Deploy to production
vercel --prod
```

### Option C: Push to GitHub (Auto-deploy)

```bash
# If you have auto-deploy enabled
git push origin main
```

---

## 🧪 Step 2: Verify Deployment

### A. Check Deployment Status

**Via Dashboard:**

1. Go to: https://vercel.com/dashboard
2. Check deployment status shows "Ready"
3. Note the deployment URL

**Via CLI:**

```bash
vercel ls
```

### B. Test Health Endpoint

```bash
# Replace with your actual domain
curl https://your-ottopen-domain.vercel.app/api/health

# Should return:
# {"status":"ok","timestamp":"..."}
```

---

## 🤖 Step 3: Test AI Features

### A. Test Authentication First

1. Visit your deployed app
2. Sign in with test account
3. Verify authentication works

### B. Test AI Brainstorm

1. Go to Editor
2. Create or open a manuscript
3. Click **AI Brainstorm**
4. Enter a topic (e.g., "time travel")
5. Click **Generate**

**Expected result:**

- ✅ AI generates brainstorm ideas
- ✅ No API key errors
- ✅ Content appears in editor

**If error occurs:**

- Check Vercel logs: `vercel logs --follow`
- Verify API keys are set correctly
- Check browser console for errors

### C. Test Other AI Features

Test each AI feature:

- [ ] AI Expand (expand a scene)
- [ ] AI Rewrite (rewrite selected text)
- [ ] AI Describe (describe a character)
- [ ] AI Critique (get feedback)

---

## 📧 Step 4: Apply Email Templates

Now that the app is deployed, apply your spam-filter-safe email templates:

### Quick Method

```bash
./apply-templates.sh
```

### Manual Method

1. **Go to Supabase Dashboard**:
   - Visit: https://app.supabase.com/project/wkvatudgffosjfwqyxgt/auth/templates

2. **Apply each template** (copy from `supabase/email-templates/`):

   **Confirm Signup:**
   - Subject: `Confirm Your Email - Ottopen`
   - Copy from: `confirm-signup.html`

   **Invite User:**
   - Subject: `You've Been Invited to Ottopen`
   - Copy from: `invite.html`

   **Magic Link:**
   - Subject: `Your Magic Link - Sign In to Ottopen`
   - Copy from: `magic-link.html`

   **Change Email:**
   - Subject: `Confirm Your Email Change - Ottopen`
   - Copy from: `email-change.html`

   **Reset Password:**
   - Subject: `Reset Your Password - Ottopen`
   - Copy from: `recovery.html`

3. **Click Save** after each template

---

## 🧪 Step 5: Test Email Templates

1. **Test signup email**:
   - Sign up with a new test email
   - Check inbox for confirmation email
   - Verify logo, colors, and button work

2. **Test password reset**:
   - Click "Forgot Password"
   - Enter email
   - Check inbox
   - Verify email looks professional

3. **Verify no spam warnings**:
   - Check email doesn't land in spam
   - All links work
   - Mobile-responsive design

---

## 🎯 Final Verification Checklist

### Deployment

- [ ] New deployment triggered
- [ ] Deployment shows "Ready" status
- [ ] Health endpoint responds
- [ ] No build errors in logs

### API Keys

- [ ] Anthropic API key working
- [ ] OpenAI API key working
- [ ] Perplexity API key working (if used)
- [ ] No "invalid API key" errors

### AI Features

- [ ] AI Brainstorm works
- [ ] AI Expand works
- [ ] AI Rewrite works
- [ ] AI Describe works
- [ ] AI Critique works
- [ ] Token usage tracked in provider dashboards

### Email Templates

- [ ] All 5 templates applied to Supabase
- [ ] Signup email works
- [ ] Password reset email works
- [ ] Emails don't trigger spam filters
- [ ] Mobile-responsive
- [ ] Logo displays correctly

### Security

- [ ] API keys rotated (new keys, not exposed ones)
- [ ] Environment variables not exposed in client
- [ ] Security headers present (check with `curl -I`)
- [ ] No secrets in git history

---

## 🐛 Troubleshooting

### Deployment Fails

**Check logs:**

```bash
vercel logs --follow
```

**Common issues:**

- Missing environment variables
- Build errors (TypeScript/ESLint)
- Module not found errors

**Solutions:**

- Verify all required env vars are set
- Run `npm run build` locally first
- Check for typos in variable names

### API Key Errors

**Error: "Invalid API key"**

- Verify you copied the NEW rotated keys, not old ones
- Check for extra spaces in keys
- Verify variable names match exactly:
  - `ANTHROPIC_API_KEY` (not `ANTHROPIC_KEY`)
  - `OPENAI_API_KEY` (not `OPENAI_KEY`)

**Error: "API key not configured"**

- Keys might not be set for production environment
- Go to Vercel → Settings → Environment Variables
- Ensure keys are enabled for "Production"

### AI Features Not Working

**Check Vercel logs:**

```bash
vercel logs --follow
```

**Look for:**

- API key errors
- Rate limit errors
- Network timeout errors

**Test API keys manually:**

```bash
# Test Anthropic key
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: YOUR_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-3-5-sonnet-20241022","max_tokens":100,"messages":[{"role":"user","content":"test"}]}'
```

### Email Templates Issues

**Templates not saving:**

- Check for HTML syntax errors
- Ensure template variables are intact: `{{ .ConfirmationURL }}`
- Try copying smaller sections

**Emails in spam:**

- Verify you used the updated templates (spam-filter safe)
- Check sender domain reputation
- Test with different email providers

**Links not working:**

- Verify Site URL in Supabase settings
- Check redirect URLs are allowed
- Test in incognito mode

---

## 📊 Monitoring After Deployment

### Vercel Analytics

- Monitor page views
- Check for errors
- Review performance metrics

### Supabase Dashboard

- Auth metrics (signups, logins)
- Database performance
- API usage

### AI Provider Dashboards

- **Anthropic**: https://console.anthropic.com/usage
- **OpenAI**: https://platform.openai.com/usage
- Monitor token usage
- Check for errors
- Set up billing alerts

### Error Tracking (Sentry)

If configured:

- Review error frequency
- Check stack traces
- Monitor performance issues

---

## 🎉 Success Criteria

Your deployment is successful when:

- ✅ App loads without errors
- ✅ Users can sign up and log in
- ✅ AI features generate content
- ✅ Email templates deliver
- ✅ No console errors
- ✅ Mobile-responsive
- ✅ Security headers present
- ✅ API usage appears in provider dashboards

---

## 📞 Next Steps

Once everything is verified:

1. **Announce to users** (if applicable)
2. **Set up monitoring alerts**
3. **Schedule key rotation** (quarterly)
4. **Backup database** (Supabase automated backups)
5. **Document any custom configuration**

---

## 🔗 Useful Links

**Your Project:**

- Vercel Dashboard: https://vercel.com/dashboard
- Supabase Dashboard: https://app.supabase.com/project/wkvatudgffosjfwqyxgt
- GitHub Repo: https://github.com/tempandmajor/Ottopen

**Provider Dashboards:**

- Anthropic: https://console.anthropic.com
- OpenAI: https://platform.openai.com
- Stripe: https://dashboard.stripe.com

**Monitoring:**

- Vercel Analytics: (in project dashboard)
- Sentry: (if configured)

---

**Last Updated:** 2025-01-02
**Status:** Ready for verification ✅
