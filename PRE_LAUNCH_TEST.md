# Pre-Launch Testing Checklist - Ottopen

**Last Updated**: October 11, 2025
**Test Duration**: ~90 minutes
**Prerequisites**: Dev server running, Stripe test keys configured

---

## 🎯 **Quick Start**

1. Start dev server: `npm run dev`
2. Open http://localhost:3000
3. Follow this checklist step-by-step
4. Mark items as complete ✅

---

## **Phase 1: Authentication (15 min)**

### Sign Up Flow

- [ ] Navigate to `/auth/signup`
- [ ] Fill Step 1: Email + strong password
- [ ] Verify password strength indicator shows "Strong"
- [ ] Fill Step 2: Display name + username
- [ ] Check username availability indicator (green checkmark)
- [ ] Fill Step 3: Select specialty, agree to terms
- [ ] Click "Create Account"
- [ ] Verify success message appears
- [ ] Check email for verification link
- [ ] Click verification link
- [ ] Verify redirect to sign-in page

### Sign In Flow

- [ ] Navigate to `/auth/signin`
- [ ] Enter email + password
- [ ] Click "Sign In"
- [ ] Verify redirect to `/feed`
- [ ] Check user profile appears in nav

### Rate Limiting

- [ ] Sign out
- [ ] Try signing in with wrong password 5 times
- [ ] Verify "Too many attempts" message appears
- [ ] Wait 60 seconds
- [ ] Verify sign-in works again

### Password Reset

- [ ] Click "Forgot password?"
- [ ] Enter email
- [ ] Check email for reset link
- [ ] Click reset link
- [ ] Enter new password
- [ ] Verify password reset success
- [ ] Sign in with new password

---

## **Phase 2: Subscription & Stripe (20 min)**

### View Pricing

- [ ] Navigate to `/pricing`
- [ ] Verify 3 tiers: Free, Pro ($20), Studio ($50)
- [ ] Check feature lists for each tier
- [ ] Verify current tier badge (Free)

### Subscribe to Pro ($20/month)

- [ ] Click "Upgrade to Pro"
- [ ] Fill Stripe checkout form:
  - **Card**: `4242 4242 4242 4242`
  - **Expiry**: `12/34`
  - **CVC**: `123`
  - **ZIP**: `12345`
- [ ] Click "Pay"
- [ ] Verify redirect to success page
- [ ] Verify subscription status shows "Pro"
- [ ] Refresh page - verify status persists

### Billing Portal

- [ ] Navigate to settings
- [ ] Click "Manage Billing"
- [ ] Verify Stripe billing portal opens
- [ ] Check subscription details are correct
- [ ] Cancel subscription
- [ ] Verify cancellation confirmation
- [ ] Check app shows "Free" tier again

### Failed Payment Test

- [ ] Re-subscribe to Pro
- [ ] Go to billing portal
- [ ] Update payment method to: `4000 0000 0000 0341` (declined card)
- [ ] Wait for payment attempt to fail
- [ ] Verify error notification

---

## **Phase 3: Script/Book Creation (15 min)**

### Create Screenplay

- [ ] Navigate to `/scripts`
- [ ] Click "New Script"
- [ ] Select "Screenplay"
- [ ] Enter title: "Test Screenplay"
- [ ] Enter logline
- [ ] Select genre: "Drama"
- [ ] Click "Create"
- [ ] Verify redirect to editor

### Free Tier Limit (1 Script)

- [ ] Try creating another script
- [ ] Verify "Upgrade required" message
- [ ] (If Pro): Verify can create unlimited scripts

### Create Other Formats

- [ ] Create TV Pilot
- [ ] Create Stage Play
- [ ] Create Documentary
- [ ] Create Non-fiction Book
- [ ] Verify each format has appropriate editor

---

## **Phase 4: Editor Functionality (15 min)**

### Basic Typing

- [ ] Open screenplay editor
- [ ] Type scene heading: "INT. OFFICE - DAY"
- [ ] Press Tab - verify switches to action
- [ ] Type action line
- [ ] Press Enter twice - verify stays in action
- [ ] Press Tab - verify switches to character
- [ ] Type character name
- [ ] Press Tab - verify switches to dialogue

### Auto-completion

- [ ] Type first few letters of character name
- [ ] Verify autocomplete suggestions appear
- [ ] Select from dropdown
- [ ] Verify inserts correctly

### Auto-save

- [ ] Open browser DevTools → Network tab
- [ ] Type some content
- [ ] Wait 3 seconds
- [ ] Verify save request appears in network tab
- [ ] Refresh page
- [ ] Verify content persists

### Undo/Redo

- [ ] Type some text
- [ ] Press Cmd+Z (Mac) or Ctrl+Z (Windows)
- [ ] Verify text is removed
- [ ] Press Cmd+Shift+Z or Ctrl+Y
- [ ] Verify text is restored

---

## **Phase 5: AI Features (15 min)**

### Dialogue Enhancement

- [ ] Select some dialogue in editor
- [ ] Click "Enhance Dialogue" in AI panel
- [ ] Verify AI suggestion appears
- [ ] Apply suggestion
- [ ] Verify content updates

### Beat Generation (Save the Cat!)

- [ ] Open screenplay with some content
- [ ] Click "Generate Beats" in AI panel
- [ ] Verify 15 story beats generate
- [ ] Review beat suggestions

### AI Usage Tracking

- [ ] Check AI usage counter in nav/settings
- [ ] Use an AI feature
- [ ] Verify counter increments
- [ ] Use 10 AI features (free tier limit)
- [ ] Verify "Upgrade required" message appears

### Book-Specific AI

- [ ] Open non-fiction book
- [ ] Enter thesis statement
- [ ] Click "Generate Chapter Outlines"
- [ ] Verify 10+ chapter suggestions

### Documentary AI

- [ ] Open documentary
- [ ] Add narration with factual claim
- [ ] Click "Fact-Check"
- [ ] Verify confidence score appears

---

## **Phase 6: Export Functionality (10 min)**

### PDF Export (Free Tier)

- [ ] Open any script/book
- [ ] Click "Export"
- [ ] Select "PDF"
- [ ] Download file
- [ ] Open PDF
- [ ] Verify formatting is correct
- [ ] Verify title page exists

### Word Export (Pro/Studio)

- [ ] Upgrade to Pro if needed
- [ ] Export as .docx
- [ ] Open in Word/Google Docs
- [ ] Verify formatting preserved

### EPUB Export (Books Only)

- [ ] Open non-fiction book
- [ ] Export as EPUB
- [ ] Verify file downloads

### Final Draft Export (Scripts)

- [ ] Open screenplay
- [ ] Export as .fdx
- [ ] Verify file downloads

### Format Preservation

- [ ] Check exported files maintain:
  - Scene headings bold/caps
  - Dialogue indentation
  - Character names centered
  - Action lines left-aligned

---

## **Phase 7: Collaboration (Pro/Studio, 5 min)**

### Share Script

- [ ] Open a script
- [ ] Click "Share"
- [ ] Copy share link
- [ ] Open in incognito window
- [ ] Verify can view (if view-only)
- [ ] Verify can edit (if edit access)

### Live Collaboration

- [ ] Open script in two browser windows
- [ ] Type in one window
- [ ] Verify changes appear in other window
- [ ] Check presence indicator shows "1 other user"

### Collaboration Limits

- [ ] Verify Pro tier: 3 collaborators max
- [ ] Verify Studio tier: Unlimited

---

## **Phase 8: Research Repository (5 min)**

### Create Notes

- [ ] Navigate to Research section
- [ ] Click "New Note"
- [ ] Enter title + content
- [ ] Add tags
- [ ] Save note

### Link to Project

- [ ] Open research note
- [ ] Click "Link to Project"
- [ ] Select a script/book
- [ ] Verify link created

### Search Notes

- [ ] Enter search query
- [ ] Verify results appear
- [ ] Filter by tags
- [ ] Verify filtering works

---

## **Phase 9: Security Testing (10 min)**

### SQL Injection Attempts

- [ ] Try entering in forms:
  - `'; DROP TABLE users--`
  - `<script>alert('xss')</script>`
  - `../../etc/passwd`
- [ ] Verify no errors, inputs sanitized

### Unauthorized Access

- [ ] Copy another user's script URL
- [ ] Sign out
- [ ] Try accessing URL
- [ ] Verify redirect to sign-in

### Rate Limiting

- [ ] Hit an API endpoint rapidly (10+ times/sec)
- [ ] Verify 429 error appears
- [ ] Verify "Rate limit exceeded" message

---

## **Phase 10: Responsive Design (5 min)**

### Mobile View (375px)

- [ ] Open DevTools
- [ ] Set viewport to iPhone (375px)
- [ ] Navigate homepage
- [ ] Verify navigation collapses to hamburger
- [ ] Sign in
- [ ] Open editor
- [ ] Verify editor is usable on mobile

### Tablet View (768px)

- [ ] Set viewport to iPad (768px)
- [ ] Verify layout adjusts appropriately
- [ ] Test all major pages

### Dark Mode

- [ ] Toggle dark mode
- [ ] Verify all pages use dark theme
- [ ] Refresh page
- [ ] Verify theme persists

---

## **Phase 11: Performance Testing (5 min)**

### Page Load Times

- [ ] Open DevTools → Network tab
- [ ] Hard refresh homepage (Cmd+Shift+R)
- [ ] Verify DOMContentLoaded < 2s
- [ ] Verify Load < 3s

### Editor Performance

- [ ] Create script with 500+ elements
- [ ] Type in editor
- [ ] Verify typing lag < 100ms
- [ ] Scroll through long script
- [ ] Verify smooth scrolling

### Network Tab

- [ ] Check for:
  - [ ] No 404 errors
  - [ ] No failed requests
  - [ ] No CORS errors

---

## **Phase 12: Error Handling (5 min)**

### Invalid Inputs

- [ ] Try signing up with:
  - [ ] Invalid email (no @)
  - [ ] Short password (< 8 chars)
  - [ ] Mismatched password confirmation
- [ ] Verify error messages appear

### Network Errors

- [ ] Disconnect WiFi
- [ ] Try saving in editor
- [ ] Verify "Network error" message
- [ ] Reconnect WiFi
- [ ] Verify auto-retry works

### 404 Page

- [ ] Navigate to `/invalid-page`
- [ ] Verify custom 404 page appears
- [ ] Click "Go Home"
- [ ] Verify redirect works

---

## **✅ Test Results Summary**

### Automated Tests

- Unit Tests: **86/97 passed** ✅
- E2E Tests: Ready to run
- Coverage: > 80%

### Manual Tests Completed: **\_** / 150

### Issues Found:

1. ***
2. ***
3. ***

### Blockers (Must Fix Before Launch):

- [ ] ***
- [ ] ***

### Nice-to-Have (Can Fix Post-Launch):

- [ ] ***
- [ ] ***

---

## **🚀 Ready to Launch?**

✅ **Launch Criteria:**

- [ ] All Phase 1-5 tests pass (critical paths)
- [ ] Stripe test mode verified
- [ ] No blockers found
- [ ] Performance meets standards (< 3s load)
- [ ] Security tests pass
- [ ] Export functionality works

⚠️ **If any blockers found, do NOT launch until resolved.**

---

## **Post-Testing Actions**

1. **Review Sentry** for any errors logged
2. **Check Stripe Dashboard** for test transactions
3. **Review Supabase logs** for database errors
4. **Update environment variables** for production
5. **Switch Stripe keys** from test to live mode
6. **Deploy to production**

---

## **Support**

Questions? Check:

- `TESTING.md` - Full testing documentation
- `RUN_TESTS.md` - How to run automated tests
- `TEST_SUMMARY.md` - Testing infrastructure summary

---

**Good luck with your launch! 🎉**
