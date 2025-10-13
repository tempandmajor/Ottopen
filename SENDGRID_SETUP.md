# 📧 SendGrid Email Configuration for Ottopen

**Status:** ✅ API Key Configured (in `.env.local` only)
**Security:** API key stored securely in environment variables

---

## ✅ Step 1: Local Environment (COMPLETED)

The SendGrid API key has been added to `.env.local`:

```bash
SENDGRID_API_KEY=<your-sendgrid-api-key>
```

---

## 🔧 Step 2: Configure Supabase to Use SendGrid

### Option A: Using Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard:**
   - Navigate to: https://supabase.com/dashboard/project/wkvatudgffosjfwqyxgt
   - (Your Ottopen project)

2. **Navigate to Auth Settings:**
   - Click on "Authentication" in the left sidebar
   - Click "SMTP Settings" or "Email Templates" → "Settings"

3. **Configure Custom SMTP:**
   - **Enable Custom SMTP:** Toggle ON
   - **Sender Email:** `noreply@ottopen.com` (or your verified SendGrid sender)
   - **Sender Name:** `Ottopen`
   - **Host:** `smtp.sendgrid.net`
   - **Port Number:** `587`
   - **Username:** `apikey` (literally the word "apikey")
   - **Password:** `<your-sendgrid-api-key>` (from `.env.local`)

4. **Save Configuration**

### Option B: Using Supabase API (Alternative)

```bash
curl -X PUT https://api.supabase.com/v1/projects/wkvatudgffosjfwqyxgt/config/auth \
  -H "Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "SMTP_HOST": "smtp.sendgrid.net",
    "SMTP_PORT": "587",
    "SMTP_USER": "apikey",
    "SMTP_PASS": "<your-sendgrid-api-key>",
    "SMTP_SENDER_EMAIL": "noreply@ottopen.com",
    "SMTP_SENDER_NAME": "Ottopen"
  }'
```

---

## 📋 Step 3: Verify SendGrid Domain (IMPORTANT!)

Before emails will send reliably, you need to verify your domain in SendGrid:

### 3.1 Access SendGrid Dashboard

1. Go to: https://app.sendgrid.com
2. Sign in with your SendGrid account

### 3.2 Verify Sender Identity

1. Navigate to: **Settings** → **Sender Authentication**
2. Click **"Verify a Single Sender"** (for quick setup) OR
3. Click **"Authenticate Your Domain"** (for better deliverability)

#### Quick Setup: Single Sender Verification

1. Enter sender email: `noreply@ottopen.com`
2. Enter sender name: `Ottopen`
3. Complete verification via email
4. ✅ You can now send from this address

#### Best Practice: Domain Authentication

1. Enter your domain: `ottopen.com`
2. Follow DNS configuration instructions
3. Add provided DNS records to your domain registrar
4. Wait for verification (usually 24-48 hours)
5. ✅ Unlimited sending from @ottopen.com addresses

**Recommended:** Domain authentication for production (better deliverability)

---

## 🧪 Step 4: Test Email Sending

### Test from Supabase Dashboard

1. Go to Supabase Dashboard → Authentication
2. Click "Email Templates"
3. Select any template (e.g., "Confirm Signup")
4. Click "Send Test Email"
5. Enter your email address
6. Check inbox (and spam folder!)

### Test from Application

Try the password reset flow:

1. Go to your app: http://localhost:3000
2. Click "Sign In" → "Forgot Password"
3. Enter your email
4. Check for password reset email

**Expected Result:** Email arrives within seconds

---

## 🚀 Step 5: Add to Vercel Production

Add the SendGrid API key to Vercel for production:

### Method 1: Vercel Dashboard (Recommended)

1. Go to: https://vercel.com/ottopens-projects/ottopen/settings/environment-variables
2. Click "Add New"
3. **Key:** `SENDGRID_API_KEY`
4. **Value:** `<your-sendgrid-api-key>` (from `.env.local`)
5. **Environment:** Production
6. Click "Save"

### Method 2: Vercel CLI

```bash
npx vercel env add SENDGRID_API_KEY production
# When prompted, paste your SendGrid API key from .env.local
```

---

## 📊 Email Sending Limits

**SendGrid Free Tier:**

- ✅ 100 emails per day
- ✅ Perfect for MVP and early users
- ✅ All email types included

**When to Upgrade:**

- If you exceed 100 emails/day
- Need dedicated IP address
- Want advanced analytics

**Upgrade Options:**

- Essentials: $19.95/mo (50K emails)
- Pro: $89.95/mo (100K emails)

---

## 📧 Email Templates in Supabase

After configuring SMTP, customize your email templates:

### Available Templates:

1. **Confirm Signup** - Email verification
2. **Invite User** - User invitations
3. **Magic Link** - Passwordless login
4. **Change Email Address** - Email change confirmation
5. **Reset Password** - Password reset

### Customization Steps:

1. Supabase Dashboard → Authentication → Email Templates
2. Select template
3. Edit subject and body (HTML supported)
4. Use variables: `{{ .ConfirmationURL }}`, `{{ .Token }}`, etc.
5. Save changes

**Tip:** Add your branding, logo, and colors to match Ottopen's design

---

## ✅ Verification Checklist

After completing setup:

- [ ] SendGrid API key added to `.env.local`
- [ ] Supabase SMTP configured with SendGrid
- [ ] Sender email verified in SendGrid
- [ ] Test email sent successfully
- [ ] Email received (check spam folder)
- [ ] SendGrid API key added to Vercel Production
- [ ] Email templates customized (optional)
- [ ] Domain authentication completed (recommended)

---

## 🐛 Troubleshooting

### Issue: Emails not sending

**Solutions:**

1. Check SendGrid dashboard → Activity Feed for errors
2. Verify sender email is authenticated
3. Check Supabase logs for SMTP errors
4. Ensure port 587 is not blocked

### Issue: Emails going to spam

**Solutions:**

1. Complete domain authentication in SendGrid
2. Add SPF and DKIM records to DNS
3. Use a recognizable sender name
4. Include unsubscribe link in emails

### Issue: "Sender not verified" error

**Solution:**

1. Go to SendGrid → Settings → Sender Authentication
2. Complete single sender verification
3. Check email for verification link
4. Click link to verify

### Issue: API key not working

**Solution:**

1. Verify API key is copied correctly (no extra spaces)
2. Check API key permissions in SendGrid
3. Generate new API key if needed

---

## 📈 Monitoring Email Delivery

### In SendGrid Dashboard:

1. **Activity Feed:** Real-time email events
2. **Stats:** Delivery rates, bounces, opens
3. **Suppressions:** Bounced/unsubscribed emails

### In Supabase:

1. Authentication → Logs
2. Filter by email events
3. Check for send failures

---

## 🔐 Security Best Practices

1. **Never commit API key to git** (✅ Already in .env.local)
2. **Use environment variables only** (✅ Configured)
3. **Rotate keys quarterly**
4. **Monitor for unauthorized usage**
5. **Set up SendGrid subusers** for team members

---

## 🎯 Next Steps

After email is configured:

1. ✅ **SendGrid configured** (you are here)
2. ⏳ Switch Stripe to live mode
3. ⏳ Add all env vars to Vercel Production
4. ⏳ Configure production webhook
5. ⏳ Deploy to production
6. ⏳ Test complete user flow

**Estimated Time Remaining:** 20-25 minutes

---

## 📞 Support Resources

- **SendGrid Docs:** https://docs.sendgrid.com
- **SendGrid Support:** https://support.sendgrid.com
- **Supabase Auth Docs:** https://supabase.com/docs/guides/auth
- **Supabase SMTP Guide:** https://supabase.com/docs/guides/auth/auth-smtp

---

**Status:** ✅ SendGrid API Key Ready
**Next Action:** Configure in Supabase Dashboard (Step 2)
**Priority:** High - Required for production email delivery
