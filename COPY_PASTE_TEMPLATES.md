# 📋 Copy-Paste Email Templates to Supabase

Quick reference guide with all template content ready to copy-paste directly into Supabase Dashboard.

## 🔗 Quick Links

**Supabase Dashboard**: https://app.supabase.com/project/wkvatudgffosjfwqyxgt/auth/templates

**Project**: Ottopen (wkvatudgffosjfwqyxgt)

---

## 1️⃣ Confirm Signup Template

### Subject Line

```
Confirm Your Email - Ottopen
```

### Template Body

**Location**: `supabase/email-templates/confirm-signup.html`

**Instructions**:

1. Go to: https://app.supabase.com/project/wkvatudgffosjfwqyxgt/auth/templates
2. Click "Confirm signup"
3. Paste subject line above
4. Copy entire content from `confirm-signup.html` file
5. Paste into template editor
6. Click Save

---

## 2️⃣ Invite User Template

### Subject Line

```
You've Been Invited to Ottopen
```

### Template Body

**Location**: `supabase/email-templates/invite.html`

**Instructions**:

1. Click "Invite user" in Supabase dashboard
2. Paste subject line above
3. Copy entire content from `invite.html` file
4. Paste into template editor
5. Click Save

---

## 3️⃣ Magic Link Template

### Subject Line

```
Your Magic Link - Sign In to Ottopen
```

### Template Body

**Location**: `supabase/email-templates/magic-link.html`

**Instructions**:

1. Click "Magic Link" in Supabase dashboard
2. Paste subject line above
3. Copy entire content from `magic-link.html` file
4. Paste into template editor
5. Click Save

---

## 4️⃣ Change Email Template

### Subject Line

```
Confirm Your Email Change - Ottopen
```

### Template Body

**Location**: `supabase/email-templates/email-change.html`

**Instructions**:

1. Click "Change Email Address" in Supabase dashboard
2. Paste subject line above
3. Copy entire content from `email-change.html` file
4. Paste into template editor
5. Click Save

---

## 5️⃣ Reset Password Template

### Subject Line

```
Reset Your Password - Ottopen
```

### Template Body

**Location**: `supabase/email-templates/recovery.html`

**Instructions**:

1. Click "Reset Password" in Supabase dashboard
2. Paste subject line above
3. Copy entire content from `recovery.html` file
4. Paste into template editor
5. Click Save

---

## ✅ Verification Checklist

After applying all templates:

- [ ] Confirm Signup - Subject and body updated
- [ ] Invite User - Subject and body updated
- [ ] Magic Link - Subject and body updated
- [ ] Change Email - Subject and body updated
- [ ] Reset Password - Subject and body updated

---

## 🧪 Test Your Templates

### Quick Test

1. Go to: https://app.supabase.com/project/wkvatudgffosjfwqyxgt/auth/users
2. Click "Invite user"
3. Enter your email address
4. Check your inbox
5. Verify logo, colors, and links work

### What to Check

- ✅ Logo displays (white on blue background)
- ✅ Blue gradient header (#2563eb → #1d4ed8)
- ✅ Button works and redirects correctly
- ✅ Footer links are correct
- ✅ Mobile responsive (test on phone)

---

## 🔧 Quick Commands

### Open Template Files

```bash
cd /Users/emmanuelakangbou/Downloads/script-soiree-main/supabase/email-templates

# View template
cat confirm-signup.html

# Copy to clipboard (macOS)
cat confirm-signup.html | pbcopy

# Copy all templates
for file in *.html; do
  echo "=== $file ==="
  cat "$file"
  echo ""
done
```

### Copy Template to Clipboard (macOS)

```bash
# Confirm Signup
pbcopy < supabase/email-templates/confirm-signup.html

# Invite User
pbcopy < supabase/email-templates/invite.html

# Magic Link
pbcopy < supabase/email-templates/magic-link.html

# Email Change
pbcopy < supabase/email-templates/email-change.html

# Recovery
pbcopy < supabase/email-templates/recovery.html
```

### Copy Template to Clipboard (Linux)

```bash
# Install xclip if needed: sudo apt-get install xclip

# Confirm Signup
xclip -selection clipboard < supabase/email-templates/confirm-signup.html

# Invite User
xclip -selection clipboard < supabase/email-templates/invite.html

# etc...
```

---

## 📱 Mobile Testing

After setup, test emails on:

- **iPhone**: Check in Mail app
- **Android**: Check in Gmail app
- **Desktop**: Gmail, Outlook, Apple Mail

---

## 🎨 Template Variables

These are automatically replaced by Supabase:

| Variable                 | Description     | Example                                    |
| ------------------------ | --------------- | ------------------------------------------ |
| `{{ .ConfirmationURL }}` | Action link     | https://ottopen.com/auth/confirm?token=... |
| `{{ .Email }}`           | Recipient email | user@example.com                           |
| `{{ .SiteURL }}`         | Your app URL    | https://ottopen.com                        |
| `{{ .Token }}`           | Auth token      | (if needed)                                |
| `{{ .TokenHash }}`       | Token hash      | (if needed)                                |

**Important**: Don't modify these variables when pasting into Supabase!

---

## 🚨 Common Issues

### Templates Not Saving

- Ensure you're logged into correct Supabase project
- Check for syntax errors in HTML
- Verify template variables are intact

### Logo Not Showing

- Logo is embedded as SVG (no external URL needed)
- Check SVG syntax is valid
- Ensure no extra characters were added

### Links Not Working

- Verify Site URL in Supabase settings
- Check Authentication → URL Configuration
- Ensure redirect URLs are allowed

---

## 📞 Support

**Supabase Project**: Ottopen (wkvatudgffosjfwqyxgt)

**Dashboard Links**:

- Templates: https://app.supabase.com/project/wkvatudgffosjfwqyxgt/auth/templates
- Users: https://app.supabase.com/project/wkvatudgffosjfwqyxgt/auth/users
- Settings: https://app.supabase.com/project/wkvatudgffosjfwqyxgt/auth/url-configuration

**Need Help?**

1. Check template files in `supabase/email-templates/`
2. Review `README.md` in same directory
3. Check Supabase logs in dashboard

---

⏱️ **Time to Complete**: ~10-15 minutes

🎯 **Result**: Professional, branded emails for all authentication flows!
