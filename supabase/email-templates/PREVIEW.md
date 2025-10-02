# Email Templates Preview

Visual overview of all Ottopen email templates.

## 🎨 Design System

### Colors

- **Primary Blue**: `#2563eb` (RGB: 37, 99, 235)
- **Dark Blue**: `#1d4ed8` (RGB: 29, 78, 216)
- **Background**: `#ffffff` (White)
- **Text Dark**: `#0a0a0a` (Near Black)
- **Text Medium**: `#525252` (Gray)
- **Text Light**: `#737373` (Light Gray)
- **Footer BG**: `#fafafa` (Off White)

### Typography

- **Font Family**: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif
- **Header Title**: 28px, Bold (24px on mobile)
- **Greeting**: 18px, Medium
- **Body Text**: 16px, Regular
- **Footer**: 14px, Regular

### Layout

- **Max Width**: 600px
- **Header Padding**: 40px vertical, 30px horizontal
- **Content Padding**: 40px vertical, 30px horizontal
- **Mobile Padding**: 30px vertical, 20px horizontal
- **Border Radius**: 8px for cards, 4px for notes

---

## 📧 Template Previews

### 1. Confirm Signup (confirm-signup.html)

**Subject**: Confirm Your Email - Ottopen

**Use Case**: Sent when a new user signs up

**Key Features**:

- ✅ Welcome message with brand introduction
- ✅ Large, prominent confirmation button
- ✅ Security tip about 24-hour expiration
- ✅ Alternative text link for accessibility
- ✅ Footer with help center link

**Visual Structure**:

```
┌─────────────────────────────────────┐
│  [Blue Gradient Header]             │
│  [White Logo]                       │
│  Welcome to Ottopen                 │
└─────────────────────────────────────┘
│                                     │
│  Hello!                             │
│                                     │
│  Thanks for signing up...           │
│  To get started, please confirm...  │
│                                     │
│  ┌─────────────────────────────┐  │
│  │   [Confirm Email Button]    │  │
│  └─────────────────────────────┘  │
│                                     │
│  🔒 Security tip: Link expires...   │
│                                     │
│  Button not working?                │
│  [Text link]                        │
│                                     │
├─────────────────────────────────────┤
│  [Gray Footer]                      │
│  Ottopen - Where stories come...    │
│  Need help? Help Center             │
└─────────────────────────────────────┘
```

---

### 2. Invite User (invite.html)

**Subject**: You've Been Invited to Ottopen

**Use Case**: Sent when an existing user invites someone

**Key Features**:

- ✅ Exciting invitation header
- ✅ Highlighted feature benefits box
- ✅ Clear call-to-action
- ✅ Security note about expiration
- ✅ Professional branding

**Visual Structure**:

```
┌─────────────────────────────────────┐
│  [Blue Gradient Header]             │
│  [White Logo]                       │
│  You're Invited!                    │
└─────────────────────────────────────┘
│                                     │
│  Hello!                             │
│                                     │
│  You've been invited to join...     │
│                                     │
│  ┌─────────────────────────────┐  │
│  │  [Blue Highlight Box]       │  │
│  │  ✨ Join thousands of...    │  │
│  └─────────────────────────────┘  │
│                                     │
│  ┌─────────────────────────────┐  │
│  │   [Accept Invitation]       │  │
│  └─────────────────────────────┘  │
│                                     │
│  🔒 Link expires in 24 hours...     │
│                                     │
└─────────────────────────────────────┘
```

---

### 3. Magic Link (magic-link.html)

**Subject**: Your Magic Link - Sign In to Ottopen

**Use Case**: Passwordless authentication

**Key Features**:

- ✅ Clear sign-in instruction
- ✅ Educational box about magic links
- ✅ Yellow warning for 1-hour expiration
- ✅ Guidance for suspicious activity
- ✅ Alternative link option

**Visual Structure**:

```
┌─────────────────────────────────────┐
│  [Blue Gradient Header]             │
│  [White Logo]                       │
│  Sign In to Ottopen                 │
└─────────────────────────────────────┘
│                                     │
│  Hello!                             │
│                                     │
│  Click below to securely sign in... │
│                                     │
│  ┌─────────────────────────────┐  │
│  │   [Sign In Button]          │  │
│  └─────────────────────────────┘  │
│                                     │
│  ┌─────────────────────────────┐  │
│  │  [Blue Info Box]            │  │
│  │  🔐 How Magic Links Work    │  │
│  │  Magic links provide...     │  │
│  └─────────────────────────────┘  │
│                                     │
│  ⚠️ Important: Expires in 1 hour   │
│                                     │
│  Didn't request this?               │
│  You can safely ignore...           │
└─────────────────────────────────────┘
```

---

### 4. Password Recovery (recovery.html)

**Subject**: Reset Your Password - Ottopen

**Use Case**: Password reset requests

**Key Features**:

- ✅ Clear password reset flow
- ✅ Green tips box for strong passwords
- ✅ Yellow expiration warning
- ✅ Red security alert for unauthorized requests
- ✅ Helpful password guidelines

**Visual Structure**:

```
┌─────────────────────────────────────┐
│  [Blue Gradient Header]             │
│  [White Logo]                       │
│  Reset Your Password                │
└─────────────────────────────────────┘
│                                     │
│  Hello!                             │
│                                     │
│  We received a request to reset...  │
│                                     │
│  ┌─────────────────────────────┐  │
│  │   [Reset Password]          │  │
│  └─────────────────────────────┘  │
│                                     │
│  ⏱️ Link expires in 1 hour         │
│                                     │
│  ┌─────────────────────────────┐  │
│  │  [Green Tips Box]           │  │
│  │  💡 Tips for Strong Pass    │  │
│  │  • Use 12+ characters       │  │
│  │  • Mix case, numbers...     │  │
│  └─────────────────────────────┘  │
│                                     │
│  🚨 Didn't request this?            │
│  [Red warning box]                  │
└─────────────────────────────────────┘
```

---

### 5. Email Change (email-change.html)

**Subject**: Confirm Your Email Change - Ottopen

**Use Case**: Email address update confirmation

**Key Features**:

- ✅ Prominent display of new email
- ✅ Clear confirmation flow
- ✅ Security warnings
- ✅ Explanation of next steps
- ✅ Support contact information

**Visual Structure**:

```
┌─────────────────────────────────────┐
│  [Blue Gradient Header]             │
│  [White Logo]                       │
│  Confirm Email Change               │
└─────────────────────────────────────┘
│                                     │
│  Hello!                             │
│                                     │
│  You requested to change email...   │
│                                     │
│  ┌─────────────────────────────┐  │
│  │  [Blue Highlight Box]       │  │
│  │  NEW EMAIL ADDRESS          │  │
│  │  user@example.com           │  │
│  └─────────────────────────────┘  │
│                                     │
│  ┌─────────────────────────────┐  │
│  │   [Confirm Email Change]    │  │
│  └─────────────────────────────┘  │
│                                     │
│  🔒 Link expires in 24 hours...     │
│                                     │
│  🚨 Didn't request this?            │
│  [Red warning - contact support]    │
│                                     │
│  What happens next?                 │
│  Future emails go to new address... │
└─────────────────────────────────────┘
```

---

## 🎯 Key Design Elements

### Header

- **Gradient Background**: Blue gradient (135deg, #2563eb to #1d4ed8)
- **Logo**: White version on blue background, 60x60px
- **Title**: White text, centered, bold

### Primary Button

- **Style**: Blue gradient background, white text
- **Padding**: 16px vertical, 40px horizontal
- **Hover Effect**: Subtle upward movement (-2px)
- **Border Radius**: 8px

### Info Boxes

- **Blue Info**: Light blue background (#f0f9ff), blue border-left
- **Yellow Warning**: Light yellow background (#fef3c7), orange border-left
- **Red Alert**: Light red background (#fef2f2), red border-left
- **Green Tips**: Light green background (#f0fdf4), green text

### Footer

- **Background**: Off-white (#fafafa)
- **Border**: 1px solid #e5e5e5 on top
- **Links**: Blue (#2563eb), no underline
- **Small Text**: Light gray (#a3a3a3), 12px

---

## 📱 Mobile Responsiveness

**Breakpoint**: 600px

### Changes on Mobile:

- Header padding: 30px vertical, 20px horizontal (from 40/30)
- Content padding: 30px vertical, 20px horizontal (from 40/30)
- Header title: 24px (from 28px)
- All other proportions scale appropriately

---

## ✅ Cross-Client Compatibility

### Tested & Supported:

- ✅ Gmail (Desktop & Mobile)
- ✅ Apple Mail (macOS & iOS)
- ✅ Outlook (2016+, Web)
- ✅ Yahoo Mail
- ✅ ProtonMail
- ✅ Thunderbird

### Fallbacks Included:

- Gradient backgrounds → Solid color fallback
- Custom fonts → System font stack
- SVG logo → Inline for maximum compatibility

---

## 🔄 Template Variables Used

All templates use these Supabase variables:

| Variable                 | Purpose      | Example                                        |
| ------------------------ | ------------ | ---------------------------------------------- |
| `{{ .ConfirmationURL }}` | Action link  | https://app.ottopen.com/auth/confirm?token=... |
| `{{ .Email }}`           | User's email | user@example.com                               |
| `{{ .SiteURL }}`         | App URL      | https://ottopen.com                            |
| `{{ .Token }}`           | Auth token   | abc123xyz (if needed)                          |
| `{{ .TokenHash }}`       | Token hash   | (if needed)                                    |

---

## 📊 Performance Metrics

- **Email Size**: ~12-15KB per template
- **Load Time**: < 1 second (inline CSS + SVG)
- **Render Time**: Instant (no external resources)
- **Mobile Score**: 100% responsive

---

## 🎨 Customization Quick Reference

### Change Primary Color

```bash
# In all templates, replace:
#2563eb → YOUR_PRIMARY_COLOR
#1d4ed8 → YOUR_PRIMARY_DARK
```

### Change Company Name

```bash
# In all templates, replace:
Ottopen → YOUR_COMPANY_NAME
```

### Update Logo

1. Generate SVG with white fill
2. Set viewBox to "0 0 32 32"
3. Replace `<svg class="logo">` content in all templates

### Modify Button Text

Each template has customizable button text:

- Confirm signup: "Confirm Email Address"
- Invite: "Accept Invitation"
- Magic link: "Sign In to Ottopen"
- Recovery: "Reset Password"
- Email change: "Confirm Email Change"

---

**Last Updated**: 2025-01-02
**Version**: 1.0.0
**Compatibility**: Supabase Auth v2+
