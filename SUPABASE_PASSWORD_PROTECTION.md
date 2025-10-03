# 🔐 Enable Leaked Password Protection - Setup Guide

**Priority:** Medium
**Est. Time:** 2 minutes
**Impact:** Improved account security

---

## What is Leaked Password Protection?

Supabase can automatically check passwords against the HaveIBeenPwned.org database to prevent users from using compromised passwords. This feature is currently **disabled** and should be enabled for production.

---

## Current Status

⚠️ **DISABLED** - Users can currently use compromised passwords

---

## How to Enable

### Step 1: Access Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/gbugafddunddrvkvgifl
2. Navigate to **Authentication** → **Policies** (or **Auth** → **Password Protection**)

### Step 2: Enable Password Protection

1. Find the **"Leaked Password Protection"** section
2. Toggle the switch to **ON** / **Enabled**
3. Save changes

---

## What This Does

### For New Sign-ups:

- ✅ Automatically checks password against HaveIBeenPwned.org
- ✅ Rejects passwords found in data breaches
- ✅ Prompts user to choose a different password

### For Existing Users:

- ✅ Checks password on next login/password change
- ✅ Prompts password update if compromised
- ⚠️ Does NOT force immediate password resets (non-disruptive)

### What Gets Checked:

- ✅ Common passwords (e.g., "password123")
- ✅ Passwords from known data breaches
- ✅ Dictionary words and simple patterns

---

## Privacy & Security

### How It Works:

1. Password is hashed locally using SHA-1
2. Only first 5 characters of hash are sent to HaveIBeenPwned API
3. API returns all hashes starting with those 5 chars
4. Full match is checked locally
5. **Your actual password never leaves the server**

### Privacy Guarantee:

- ✅ k-Anonymity model (industry standard)
- ✅ Password never transmitted
- ✅ GDPR compliant
- ✅ No user data shared with third parties

Learn more: https://haveibeenpwned.com/API/v3#PwnedPasswords

---

## User Experience Impact

### What Users Will See:

#### During Sign-up:

```
❌ This password has appeared in data breaches
   Please choose a different password
```

#### During Password Reset:

```
⚠️ Your current password has been found in data breaches
   Please choose a new, secure password
```

### UX Best Practices:

- ✅ Clear error message
- ✅ Suggests strong password
- ✅ No account lockout (security without friction)

---

## Alternative Configuration (Optional)

If you want more control, you can also configure:

### Minimum Password Length:

- Current: 6 characters (default)
- Recommended: 8-12 characters
- Location: Auth Settings → Password Requirements

### Password Strength Requirements:

- Require uppercase letters
- Require lowercase letters
- Require numbers
- Require special characters

---

## Verification Steps

After enabling, test with a known compromised password:

### Test Case:

1. Try signing up with password: `password123`
2. **Expected Result:** Error message about compromised password
3. Try a strong password: `MyS3cure!Pass2025`
4. **Expected Result:** Account created successfully

---

## Rollback (If Needed)

If you need to disable this feature:

1. Go to Supabase Dashboard → Auth → Password Protection
2. Toggle switch to **OFF** / **Disabled**
3. Save changes

**Note:** We do NOT recommend disabling this feature in production.

---

## Impact Assessment

### Benefits:

- ✅ **High** - Prevents account takeover via credential stuffing
- ✅ **High** - Protects users with poor password hygiene
- ✅ **Medium** - Reduces support tickets for compromised accounts
- ✅ **Low** - Minimal impact on user experience

### Risks:

- ⚠️ **Very Low** - Some users may need to choose new passwords
- ⚠️ **Very Low** - Slight increase in sign-up friction

### Trade-off Analysis:

✅ **Recommended for Production** - Benefits far outweigh minimal friction

---

## Documentation Links

- [Supabase Password Security](https://supabase.com/docs/guides/auth/password-security)
- [HaveIBeenPwned API](https://haveibeenpwned.com/API/v3)
- [k-Anonymity Model](https://en.wikipedia.org/wiki/K-anonymity)

---

## Action Items

- [ ] Access Supabase Dashboard
- [ ] Navigate to Auth → Password Protection
- [ ] Enable "Leaked Password Protection"
- [ ] Save changes
- [ ] Test with compromised password
- [ ] Verify error message appears
- [ ] Document in security compliance log

---

**Priority:** Medium (do before production launch)
**Time Required:** 2 minutes
**Technical Difficulty:** Very Low (just toggle a switch)
**User Impact:** Minimal (improves security)

✅ **Strongly Recommended**
