# 🚀 Start Testing NOW - Quick Guide

**Time Required**: 30 minutes for critical paths
**Goal**: Verify app works before launch

---

## **Step 1: Start Your Dev Server** (1 min)

```bash
npm run dev
```

✅ Server should start on http://localhost:3000

---

## **Step 2: Test Critical Path** (20 min)

### **A. Authentication** (5 min)

**Option 1: Email/Password**

1. Go to http://localhost:3000/auth/signup
2. Create account with your email
3. Verify email → Sign in
4. ✅ Should land on `/feed`

**Option 2: Google OAuth** (if configured)

1. Go to http://localhost:3000/auth/signin
2. Click "Sign in with Google"
3. Select Google account
4. ✅ Should land on `/feed`
5. Note: See `GOOGLE_OAUTH_SETUP.md` to configure Google OAuth (15-20 min)

### **B. Subscription** (5 min)

1. Go to `/pricing`
2. Click "Upgrade to Pro"
3. Use test card: `4242 4242 4242 4242`
4. Complete checkout
5. ✅ Should show "Pro" tier

### **C. Create Script** (5 min)

1. Go to `/scripts`
2. Click "New Script"
3. Select "Screenplay"
4. Fill form → Create
5. ✅ Should open editor

### **D. Use Editor** (3 min)

1. Type: "INT. OFFICE - DAY"
2. Press Tab → Type action
3. Wait 3 seconds
4. Refresh page
5. ✅ Content should persist (auto-saved)

### **E. Export** (2 min)

1. Click "Export"
2. Select "PDF"
3. Download file
4. Open PDF
5. ✅ Should be formatted correctly

---

## **Step 3: Run Automated Tests** (5 min)

### **Unit Tests**

```bash
npm test
```

✅ Should see: `86 passed` (ignore E2E failures in Jest)

### **E2E Tests** (Optional - Interactive)

```bash
npm run test:e2e:ui
```

✅ Opens UI → Click tests to watch them run

---

## **Step 4: Verify Stripe Test Mode** (2 min)

### **Check Environment Variables**

```bash
echo $STRIPE_SECRET_KEY
```

✅ Should start with: `sk_test_`

```bash
echo $NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```

✅ Should start with: `pk_test_`

### **Check Stripe Dashboard**

1. Go to https://dashboard.stripe.com/test
2. Check for "Test Mode" banner at top
3. ✅ Should see your test transaction

---

## **Step 5: Check for Errors** (2 min)

### **Browser Console**

1. Open DevTools (F12)
2. Check Console tab
3. ✅ Should have no red errors

### **Network Tab**

1. Stay in DevTools
2. Go to Network tab
3. Navigate around app
4. ✅ Should have no 404 or 500 errors

### **Supabase Logs** (if applicable)

1. Go to https://app.supabase.com
2. Select your project
3. Check Logs section
4. ✅ Should have no error logs

---

## **✅ You're Ready if:**

- [x] Can sign up & sign in
- [x] Can subscribe with test card
- [x] Can create & edit scripts
- [x] Can export to PDF
- [x] Auto-save works
- [x] Unit tests pass (86/97)
- [x] Stripe test mode confirmed
- [x] No console errors
- [x] No network errors

---

## **❌ NOT Ready if:**

- [ ] Auth doesn't work
- [ ] Stripe checkout fails
- [ ] Editor doesn't save
- [ ] Lots of console errors
- [ ] Using live Stripe keys (sk*live*)

**→ Fix blockers before launching!**

---

## **Next Steps:**

### **If All Tests Pass:**

1. **Switch to Production Stripe Keys**
   - Update `STRIPE_SECRET_KEY` (sk_live_xxx)
   - Update `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (pk_live_xxx)
   - Update Stripe webhooks to production URL

2. **Deploy to Production**

   ```bash
   git add .
   git commit -m "Ready for launch"
   git push
   ```

3. **Test Production**
   - Use REAL card for one test transaction
   - Refund immediately
   - Verify webhook works

4. **Launch! 🎉**

### **If Tests Fail:**

1. Note what failed in `PRE_LAUNCH_TEST.md`
2. Fix issues
3. Re-test
4. Don't deploy until all critical tests pass

---

## **For Comprehensive Testing:**

See `PRE_LAUNCH_TEST.md` for 150+ test items (~90 min)

---

## **Emergency Contacts:**

- **Stripe Issues**: https://support.stripe.com
- **Supabase Issues**: https://supabase.com/support
- **Vercel Deploy Issues**: https://vercel.com/support

---

## **Test Cards Reference:**

**Success:**

- `4242 4242 4242 4242` - Always succeeds

**Failure:**

- `4000 0000 0000 0341` - Always declined
- `4000 0000 0000 9995` - Insufficient funds

**Any expiry (12/34), CVC (123), ZIP (12345)**

---

**You've got this! Start testing now.** 🚀

**Current Time**: \***\*\_\_\_\*\***
**Test Started**: \***\*\_\_\_\*\***
**Test Completed**: \***\*\_\_\_\*\***
**Result**: Pass / Fail / Needs Work
