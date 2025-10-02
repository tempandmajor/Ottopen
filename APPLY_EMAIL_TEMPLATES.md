# 📧 How to Apply Email Templates to Supabase

## Quick Start Guide

Your professional, branded email templates are ready! Here's how to apply them to your Supabase project.

## 🚀 Step-by-Step Instructions

### 1. Access Supabase Dashboard

1. Go to https://app.supabase.com
2. Sign in to your account
3. Select your **Ottopen** project

### 2. Navigate to Email Templates

1. Click **Authentication** in the left sidebar
2. Click **Email Templates** in the sub-menu

### 3. Apply Each Template

You'll see 5 template sections. Apply each one:

#### A. **Confirm Signup**

1. Click on "Confirm signup"
2. **Subject Line**: `Confirm Your Email - Ottopen`
3. **Template Body**: Copy entire content from `supabase/email-templates/confirm-signup.html`
4. Paste into the editor
5. Click **Save**

#### B. **Invite User**

1. Click on "Invite user"
2. **Subject Line**: `You've Been Invited to Ottopen`
3. **Template Body**: Copy from `supabase/email-templates/invite.html`
4. Click **Save**

#### C. **Magic Link**

1. Click on "Magic Link"
2. **Subject Line**: `Your Magic Link - Sign In to Ottopen`
3. **Template Body**: Copy from `supabase/email-templates/magic-link.html`
4. Click **Save**

#### D. **Change Email Address**

1. Click on "Change Email Address"
2. **Subject Line**: `Confirm Your Email Change - Ottopen`
3. **Template Body**: Copy from `supabase/email-templates/email-change.html`
4. Click **Save**

#### E. **Reset Password**

1. Click on "Reset Password"
2. **Subject Line**: `Reset Your Password - Ottopen`
3. **Template Body**: Copy from `supabase/email-templates/recovery.html`
4. Click **Save**

## ✅ Test Your Templates

### Send Test Emails

1. Go to **Authentication** → **Users**
2. Click **Invite user**
3. Enter a test email address (use your own or a temp email service)
4. Check your inbox
5. Verify:
   - ✅ Logo displays correctly
   - ✅ Colors match your brand
   - ✅ Button works and redirects properly
   - ✅ Mobile responsive (test on phone)

### Testing Services

- **Temp Email**: https://temp-mail.org
- **Mailtrap**: https://mailtrap.io (catch test emails)
- **Litmus**: https://litmus.com (test across email clients)

## 🎨 Customization (Optional)

### Change Colors

If you want to update brand colors:

1. Find the color hex codes in each template:
   - Primary Blue: `#2563eb`
   - Dark Blue: `#1d4ed8`

2. Replace with your brand colors using find/replace:

   ```bash
   cd supabase/email-templates
   sed -i '' 's/#2563eb/#YOUR_COLOR/g' *.html
   sed -i '' 's/#1d4ed8/#YOUR_DARK_COLOR/g' *.html
   ```

3. Re-apply templates to Supabase Dashboard

### Update Logo

1. Generate your SVG logo with white fill
2. Open any template file
3. Find `<svg class="logo">`
4. Replace SVG content
5. Update all 5 templates with the same logo
6. Re-apply to Supabase Dashboard

## 📱 Mobile Preview

Templates are fully responsive! Test on:

- iPhone (Safari)
- Android (Gmail app)
- Tablets

## 🔧 Troubleshooting

### Logo Not Showing

- Ensure SVG is inline (not external image URL)
- Check SVG syntax is valid
- Verify fill colors are set

### Colors Look Different

- Some email clients strip gradients
- Templates have fallback solid colors built-in
- Test on multiple email clients

### Links Not Working

- Verify Supabase variables: `{{ .ConfirmationURL }}`, `{{ .Email }}`
- Check Site URL in Supabase settings (Authentication → URL Configuration)
- Ensure exact template variable syntax

### Template Variables Not Replaced

- Make sure you're copying from the `.html` files, not `.md` files
- Don't modify Supabase variable syntax: `{{ .VariableName }}`
- Verify template is saved in dashboard

## 📚 Reference Files

- **Templates**: `supabase/email-templates/*.html`
- **Setup Guide**: `supabase/email-templates/README.md`
- **Visual Preview**: `supabase/email-templates/PREVIEW.md`

## 🎯 What's Included

All templates feature:

- ✅ Responsive mobile design
- ✅ Inline SVG logo (no external dependencies)
- ✅ Brand colors (blue gradient)
- ✅ Professional layout
- ✅ Security messaging
- ✅ Clear call-to-action buttons
- ✅ Alternative text links
- ✅ Cross-client compatibility

## ⏱️ Time Required

- **Setup**: ~15-20 minutes (one-time)
- **Testing**: ~10 minutes
- **Customization** (optional): ~30 minutes

## 📞 Need Help?

If you encounter issues:

1. Check Supabase email logs in Dashboard
2. Review the troubleshooting section in `README.md`
3. Test with different email providers
4. Verify Supabase auth settings

---

**Last Updated**: 2025-01-02
**Templates Version**: 1.0.0
