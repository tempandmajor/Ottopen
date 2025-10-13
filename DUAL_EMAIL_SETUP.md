# 📧 Dual Email Provider Setup - Ottopen

**Strategy:** Resend for Auth + SendGrid for Application Emails

---

## Overview

Your app now uses **two email providers** for better reliability and separation of concerns:

| Provider     | Purpose                                             | Sender Address                              |
| ------------ | --------------------------------------------------- | ------------------------------------------- |
| **Resend**   | Authentication emails (via Supabase)                | `auth@ottopen.com` or `noreply@ottopen.com` |
| **SendGrid** | Application emails, notifications, customer support | `notifications@ottopen.com`                 |

---

## ✅ What's Already Configured

### Resend (Supabase Auth) ✅

- Configured in Supabase Dashboard
- Handles all authentication flows:
  - Email verification on signup
  - Password reset emails
  - Magic link login
  - Email change confirmation

**No code changes needed** - Supabase handles this automatically.

### SendGrid (Your Application) ✅

- NPM package installed: `@sendgrid/mail`
- API key configured in `.env.local`
- Helper functions created in `src/lib/sendgrid.ts`

---

## 🎯 When to Use Each Provider

### Use Resend (Automatic via Supabase)

- User signs up → Email verification sent
- User forgets password → Password reset sent
- User requests magic link → Magic link sent
- User changes email → Confirmation sent

**You don't need to write code for these** - Supabase handles them automatically.

### Use SendGrid (Manual via Your Code)

- Contact form submission → Notify admin team
- Customer inquiry → Notify support team
- New message received → Notify recipient
- Referral reward earned → Notify referrer
- Newsletter/announcement → Notify all users

**You write the code** using the functions in `src/lib/sendgrid.ts`.

---

## 📝 Implementation Examples

### Example 1: Contact Form API Route

Create: `app/api/contact/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { sendContactFormNotification } from '@/lib/sendgrid'

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json()

    // Validate input
    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    // Send email to admin via SendGrid
    await sendContactFormNotification({
      name,
      email,
      subject,
      message,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
```

### Example 2: New Message Notification

In your messaging API route:

```typescript
import { sendMessageNotification } from '@/lib/sendgrid'

// After creating a new message in database
await sendMessageNotification({
  recipientEmail: recipient.email,
  recipientName: recipient.name,
  senderName: sender.name,
  messagePreview: message.substring(0, 100),
  messageUrl: `https://ottopen.app/messages/${conversationId}`,
})
```

### Example 3: Referral Reward Notification

In your referral webhook handler:

```typescript
import { sendReferralRewardNotification } from '@/lib/sendgrid'

// After processing referral payment
await sendReferralRewardNotification({
  userEmail: referrer.email,
  userName: referrer.name,
  rewardAmount: 20,
  referredUserName: newUser.name,
})
```

---

## 🔧 Environment Variables Needed

Add these to both `.env.local` and Vercel Production:

```bash
# SendGrid (already added to .env.local)
SENDGRID_API_KEY=<your-sendgrid-api-key>

# Optional: Custom sender addresses
SENDGRID_FROM_EMAIL=notifications@ottopen.com
ADMIN_EMAIL=hello@ottopen.com
SUPPORT_EMAIL=support@ottopen.com
```

---

## 📋 Setup Checklist

### SendGrid Setup (5 minutes)

1. **Verify Sender Email**
   - Go to: https://app.sendgrid.com
   - Settings → Sender Authentication
   - Verify `notifications@ottopen.com`

2. **Add to Vercel** (if not already done)

   ```bash
   npx vercel env add SENDGRID_API_KEY production
   # When prompted, paste your SendGrid API key from .env.local
   ```

3. **Test Locally**
   ```bash
   # In your terminal
   node -e "
     const { sendEmail } = require('./src/lib/sendgrid.ts');
     sendEmail({
       to: 'your-email@example.com',
       subject: 'Test from Ottopen',
       text: 'SendGrid is working!'
     });
   "
   ```

---

## 🧪 Testing

### Test Auth Emails (Resend)

1. Go to: https://ottopen.app/auth/signup
2. Create test account with your email
3. Check inbox for verification email
4. Should be from `auth@ottopen.com` or `noreply@ottopen.com`

### Test Application Emails (SendGrid)

1. Use the contact form on your site
2. Check admin inbox for notification
3. Should be from `notifications@ottopen.com`

---

## 📊 Email Limits

| Provider     | Free Tier Limit | Use Case                              |
| ------------ | --------------- | ------------------------------------- |
| **Resend**   | 3,000/month     | Auth emails (low volume) ✅           |
| **SendGrid** | 100/day         | Application emails (medium volume) ✅ |

**Total capacity:** ~3,000-6,000 emails/month for free

This is plenty for MVP and early growth!

---

## 🚨 Troubleshooting

### Auth emails not sending

- **Check:** Resend configuration in Supabase Dashboard
- **Fix:** Go to Supabase → Authentication → Email Settings

### Application emails not sending

- **Check:** SendGrid sender verification status
- **Fix:** Verify sender email at https://app.sendgrid.com

### Emails going to spam

- **Solution:** Complete Domain Authentication in SendGrid
- **Time:** 24-48 hours for DNS propagation

---

## 🎯 Benefits of Dual Setup

1. **Reliability**
   - If one provider has issues, the other still works
   - Auth emails never blocked by application email volume

2. **Reputation Management**
   - Separate sending reputation for auth vs marketing
   - Reduces risk of being flagged as spam

3. **Better Analytics**
   - Track auth emails separately from application emails
   - Easier debugging and monitoring

4. **Compliance**
   - Different CAN-SPAM rules for transactional vs marketing
   - Easier to manage unsubscribe lists

---

## ✅ You're All Set!

Your dual email system is configured and ready to use:

- ✅ Resend handles all auth emails automatically
- ✅ SendGrid ready for your application emails
- ✅ Helper functions available in `src/lib/sendgrid.ts`
- ✅ Examples provided for common use cases

**Next step:** Verify sender email in SendGrid and start using the helper functions in your API routes!
