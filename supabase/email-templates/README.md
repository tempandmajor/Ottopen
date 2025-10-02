# Ottopen Email Templates

Professional, branded email templates for Supabase authentication emails.

## 📧 Templates Included

1. **confirm-signup.html** - Welcome email with email confirmation
2. **invite.html** - User invitation email
3. **magic-link.html** - Passwordless sign-in link
4. **recovery.html** - Password reset email
5. **email-change.html** - Email address change confirmation

## 🎨 Design Features

- **Brand Colors**: Primary blue gradient (#2563eb to #1d4ed8)
- **Embedded Logo**: SVG logo inline (no external image hosting needed)
- **Responsive**: Mobile-optimized with breakpoints
- **Professional Layout**: Clean, modern design with clear CTAs
- **Security Messaging**: Appropriate warnings and expiration notices
- **Accessibility**: Good contrast ratios and semantic HTML

## 🚀 How to Apply Templates to Supabase

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Email Templates**
3. For each template type, click **Edit template**
4. Copy the content from the corresponding HTML file
5. Paste into the Supabase template editor
6. Click **Save**

### Option 2: Via Supabase CLI

If you're using Supabase locally with the CLI:

```bash
# Make sure you're in your project directory
cd /path/to/your/project

# Copy templates to Supabase config directory
cp supabase/email-templates/*.html supabase/templates/

# Update your config.toml
# Add the following under [auth.email]:
```

Add to `supabase/config.toml`:

```toml
[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = true

[auth.email.template.invite]
subject = "You've Been Invited to Ottopen"
content_path = "./templates/invite.html"

[auth.email.template.confirmation]
subject = "Confirm Your Email - Ottopen"
content_path = "./templates/confirm-signup.html"

[auth.email.template.recovery]
subject = "Reset Your Password - Ottopen"
content_path = "./templates/recovery.html"

[auth.email.template.magic_link]
subject = "Your Magic Link - Sign In to Ottopen"
content_path = "./templates/magic-link.html"

[auth.email.template.email_change]
subject = "Confirm Your Email Change - Ottopen"
content_path = "./templates/email-change.html"
```

Then push to your hosted project:

```bash
supabase db push
```

### Option 3: Manual Configuration in Supabase Dashboard

1. **Sign in to Supabase Dashboard**: https://app.supabase.com
2. Select your project
3. Go to **Authentication** → **Email Templates**
4. You'll see sections for:
   - Confirm signup
   - Invite user
   - Magic Link
   - Change Email Address
   - Reset Password

5. For each section:
   - Click the template name
   - Replace the default template with the corresponding HTML from this directory
   - Update the **Subject Line** to match:
     - Confirm signup: `Confirm Your Email - Ottopen`
     - Invite user: `You've Been Invited to Ottopen`
     - Magic Link: `Your Magic Link - Sign In to Ottopen`
     - Change Email: `Confirm Your Email Change - Ottopen`
     - Reset Password: `Reset Your Password - Ottopen`
   - Click **Save**

## 📝 Template Variables

These Supabase variables are automatically populated:

- `{{ .ConfirmationURL }}` - The action URL (confirm email, reset password, etc.)
- `{{ .Email }}` - The recipient's email address
- `{{ .SiteURL }}` - Your application URL (from Supabase settings)
- `{{ .Token }}` - Auth token (if needed for custom flows)
- `{{ .TokenHash }}` - Hashed token (if needed)

## 🎨 Customization

### Update Brand Colors

The templates use these color values:

- **Primary Blue**: `#2563eb`
- **Dark Blue**: `#1d4ed8`
- **Text Dark**: `#0a0a0a`
- **Text Medium**: `#525252`
- **Text Light**: `#737373`

To change colors, find and replace in all templates:

```bash
# Example: Change primary blue to your brand color
sed -i '' 's/#2563eb/#YOUR_COLOR/g' *.html
sed -i '' 's/#1d4ed8/#YOUR_DARK_COLOR/g' *.html
```

### Update Logo

The logo is embedded as inline SVG. To update:

1. Open any template file
2. Find the `<svg class="logo">` element
3. Replace with your own SVG code
4. Ensure width/height is set to 60px for consistency
5. Update the same SVG in all 5 templates

### Update Company Name

Replace "Ottopen" throughout:

```bash
sed -i '' 's/Ottopen/YOUR_COMPANY_NAME/g' *.html
```

### Update Footer Links

Each template has footer links pointing to:

- `{{ .SiteURL }}/legal/support` - Help Center

Update these paths to match your actual routes.

## ✅ Testing Templates

### Test Locally

1. **Preview in Browser**: Open HTML files directly in browser
2. **Test Variables**: Replace template variables manually:

   ```html
   <!-- Change this: -->
   href="{{ .ConfirmationURL }}"

   <!-- To this for testing: -->
   href="https://example.com/confirm?token=test123"
   ```

### Test in Supabase

1. Go to **Authentication** → **Users**
2. Click **Invite user** and enter a test email
3. Check the test email inbox
4. Verify:
   - Logo displays correctly
   - Colors match brand
   - Button works
   - Mobile responsive
   - All links work

### Email Testing Tools

- [Litmus](https://litmus.com) - Test across email clients
- [Email on Acid](https://www.emailonacid.com) - Comprehensive testing
- [Mailtrap](https://mailtrap.io) - Catch test emails
- [Temp Mail](https://temp-mail.org) - Disposable email for testing

## 🔧 Troubleshooting

### Logo Not Showing

- Ensure SVG is inline (not external image)
- Check SVG syntax is valid
- Verify fill colors are set correctly

### Colors Wrong

- Check if email client supports CSS gradients
- Some clients strip `background: linear-gradient`
- Use fallback solid colors: `background-color: #2563eb`

### Template Variables Not Working

- Ensure exact syntax: `{{ .VariableName }}`
- Check Supabase documentation for variable names
- Verify template is saved in Supabase dashboard

### Responsive Issues

- Test on actual mobile devices
- Use email testing tools
- Check media query support

## 📚 Resources

- [Supabase Email Templates Docs](https://supabase.com/docs/guides/auth/auth-email-templates)
- [HTML Email Guide](https://templates.mailchimp.com/getting-started/html-email-basics/)
- [Can I Email](https://www.caniemail.com) - CSS support in email clients

## 🤝 Support

For issues with these templates:

1. Check Supabase email logs in Dashboard
2. Test with different email providers (Gmail, Outlook, etc.)
3. Verify template variables are correct
4. Check Supabase auth settings

---

**Note**: After updating templates in Supabase Dashboard, changes take effect immediately. Test with a real email to verify.
