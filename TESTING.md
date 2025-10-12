# Testing Guide for Ottopen

This document provides comprehensive guidance on testing the Ottopen application before production deployment.

## Table of Contents

1. [Test Setup](#test-setup)
2. [Running Tests](#running-tests)
3. [Test Structure](#test-structure)
4. [Manual Testing Checklist](#manual-testing-checklist)
5. [Stripe Test Mode](#stripe-test-mode)
6. [Test Coverage](#test-coverage)

---

## Test Setup

### Prerequisites

- Node.js 18+ installed
- All dependencies installed (`npm install`)
- Test environment variables configured
- Playwright browsers installed

### Install Playwright Browsers

```bash
npx playwright install
```

### Environment Variables

Create a `.env.test.local` file with test credentials:

```env
# Supabase Test Project
NEXT_PUBLIC_SUPABASE_URL=your_test_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_test_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_test_service_role_key

# Stripe Test Mode (ALWAYS use test keys)
STRIPE_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_test_xxxxx

# Anthropic (use limited test budget)
ANTHROPIC_API_KEY=your_test_api_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Running Tests

### Unit Tests (Jest)

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- __tests__/api/scripts.test.ts
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests
npx playwright test

# Run E2E tests in UI mode (recommended for development)
npx playwright test --ui

# Run specific test file
npx playwright test e2e/auth.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium

# Run tests in headed mode (see browser)
npx playwright test --headed

# Debug a test
npx playwright test --debug
```

### Integration Tests

```bash
# Run all tests (unit + E2E)
npm run test:all

# Run CI tests
npm run test:ci
```

---

## Test Structure

### Unit Tests (`__tests__/` and `src/**/__tests__/`)

- **Auth Tests**: `src/lib/__tests__/auth.test.ts`
- **API Route Tests**: `__tests__/api/*.test.ts`
- **Database Tests**: `src/lib/__tests__/database.test.ts`
- **Utility Tests**: `src/lib/__tests__/utils.test.ts`
- **Component Tests**: `src/components/__tests__/*.test.tsx`

### E2E Tests (`e2e/`)

- **Authentication Flow**: `e2e/auth.spec.ts`
- **Subscription Flow**: `e2e/subscription.spec.ts`
- **Script Editor**: `e2e/editor.spec.ts`
- **Export Functionality**: `e2e/exports.spec.ts`

---

## Manual Testing Checklist

### Critical Paths (Must Test Before Launch)

#### 1. **Authentication**

- [ ] Sign up with email/password
- [ ] Email verification
- [ ] Sign in with email/password
- [ ] Password reset flow
- [ ] Sign out
- [ ] Session persistence
- [ ] Session timeout (idle)
- [ ] Rate limiting (5 attempts)

#### 2. **Subscription & Payments (Stripe Test Mode)**

- [ ] View pricing page
- [ ] Subscribe to Pro tier ($20/month)
- [ ] Subscribe to Studio tier ($50/month)
- [ ] Verify Stripe test card: `4242 4242 4242 4242`
- [ ] Upgrade from Pro to Studio
- [ ] Downgrade from Studio to Pro
- [ ] Cancel subscription
- [ ] Access billing portal
- [ ] Verify subscription status updates
- [ ] Test failed payment (use `4000 0000 0000 0341`)

#### 3. **Script/Book Creation**

- [ ] Create screenplay
- [ ] Create TV pilot
- [ ] Create stage play
- [ ] Create documentary
- [ ] Create non-fiction book
- [ ] Verify free tier limit (1 active script)
- [ ] Verify Pro tier (unlimited)

#### 4. **Editor Functionality**

- [ ] Type in editor
- [ ] Auto-formatting (Tab key)
- [ ] Character autocomplete
- [ ] Location autocomplete
- [ ] Auto-save (watch network tab)
- [ ] Undo/redo
- [ ] Delete elements
- [ ] Reorder elements (drag-drop)

#### 5. **AI Features (Test with Sample Content)**

- [ ] Dialogue enhancement
- [ ] Beat generation (15 beats)
- [ ] Structure analysis
- [ ] Script coverage
- [ ] Character voice check
- [ ] Fact-checking (documentary)
- [ ] Interview questions
- [ ] Chapter outlines (book)
- [ ] Research assistant
- [ ] Paragraph enhancer
- [ ] Table read
- [ ] AI Writing Room
- [ ] Budget estimation
- [ ] Casting suggestions
- [ ] Marketing analysis
- [ ] Format conversion
- [ ] Verify AI request limits:
  - [ ] Free: 10/month
  - [ ] Pro: 100/month
  - [ ] Studio: Unlimited

#### 6. **Export Functionality**

- [ ] PDF export (all tiers)
- [ ] Word export (Pro/Studio)
- [ ] EPUB export (books, Pro/Studio)
- [ ] Final Draft export (scripts, Pro/Studio)
- [ ] Fountain export (Pro/Studio)
- [ ] Plain text export (all tiers)
- [ ] Verify watermark (Studio)
- [ ] Verify title page
- [ ] Verify formatting preservation

#### 7. **Collaboration (Pro/Studio)**

- [ ] Share script (view-only)
- [ ] Share script (edit)
- [ ] See live cursors
- [ ] See presence indicators
- [ ] Real-time syncing
- [ ] Verify collaboration limits:
  - [ ] Pro: 3 writers
  - [ ] Studio: Unlimited
- [ ] Remove collaborator

#### 8. **Research Repository**

- [ ] Create research note
- [ ] Edit note
- [ ] Delete note
- [ ] Tag notes
- [ ] Search notes
- [ ] Link note to project
- [ ] Cross-project access
- [ ] Export notes

#### 9. **Security & Performance**

- [ ] RLS policies (attempt unauthorized access)
- [ ] Rate limiting (hit API rapidly)
- [ ] Input validation (SQL injection attempts)
- [ ] XSS protection (script tags in input)
- [ ] File upload validation
- [ ] Large script handling (500+ elements)
- [ ] Concurrent edits (2 users)
- [ ] Page load time < 3s
- [ ] Editor typing lag < 100ms

#### 10. **Responsive Design**

- [ ] Mobile view (375px)
- [ ] Tablet view (768px)
- [ ] Desktop view (1920px)
- [ ] Dark mode toggle
- [ ] Theme persistence

#### 11. **Error Handling**

- [ ] Invalid email format
- [ ] Weak password
- [ ] Network error (disconnect WiFi)
- [ ] API timeout
- [ ] 404 page
- [ ] 500 error page
- [ ] Invalid script ID
- [ ] Unauthorized access

---

## Stripe Test Mode

### Test Card Numbers

Always use Stripe test cards during testing:

**Successful Payments:**

- `4242 4242 4242 4242` - Visa (always succeeds)
- `5555 5555 5555 4444` - Mastercard (always succeeds)

**Failed Payments:**

- `4000 0000 0000 0341` - Card declined
- `4000 0000 0000 9995` - Insufficient funds
- `4000 0000 0000 0069` - Expired card

**Test Details:**

- Expiry: Any future date (e.g., `12/34`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `12345`)

### Webhook Testing

Use Stripe CLI to test webhooks locally:

```bash
# Install Stripe CLI
brew install stripe/stripe-brew/stripe

# Login
stripe login

# Listen to webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger invoice.payment_failed
```

### Verifying Test Mode

Always confirm you're in test mode:

- Check Stripe dashboard (should show "Test Mode" banner)
- Verify keys start with `sk_test_` and `pk_test_`
- Check webhook endpoints are test endpoints

---

## Test Coverage

### Current Coverage

Run coverage report:

```bash
npm run test:coverage
```

### Coverage Goals

- **Overall**: > 80%
- **API Routes**: > 90%
- **Auth Logic**: > 95%
- **Payment Logic**: > 90%
- **AI Services**: > 70%

### Viewing Coverage Report

After running `npm run test:coverage`, open:

```
coverage/lcov-report/index.html
```

---

## Continuous Integration

### GitHub Actions

Tests run automatically on:

- Push to `main` branch
- Pull requests
- Pre-deployment checks

### Pre-commit Hooks

Husky runs these before each commit:

- Linting (`npm run lint`)
- Type checking (`npm run typecheck`)
- Unit tests (`npm test`)

---

## Test Data Cleanup

### After Testing

1. **Delete test users** from Supabase
2. **Cancel test subscriptions** in Stripe
3. **Clear test scripts/data** from database
4. **Review logs** in Sentry for errors

### Database Reset (Test Environment Only)

```sql
-- WARNING: Only run in test environment!
TRUNCATE TABLE scripts CASCADE;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE referrals CASCADE;
```

---

## Troubleshooting Tests

### Common Issues

**Tests timing out:**

- Increase timeout in `playwright.config.ts`
- Check if dev server is running

**Auth tests failing:**

- Verify test Supabase credentials
- Check RLS policies

**Stripe tests failing:**

- Confirm test API keys
- Verify webhook secret

**Flaky E2E tests:**

- Add `await page.waitForLoadState('networkidle')`
- Increase wait times
- Use `test.retry(2)` for flaky tests

### Debug Mode

```bash
# Playwright debug
npx playwright test --debug

# Jest debug (VS Code)
Add breakpoint → Run "Debug Jest Tests"

# Verbose output
npx playwright test --reporter=list
npm test -- --verbose
```

---

## Production Readiness Checklist

Before deploying to production:

- [ ] All tests passing
- [ ] Test coverage > 80%
- [ ] Manual testing checklist complete
- [ ] Stripe test mode verified
- [ ] Environment variables set in production
- [ ] Sentry configured for error tracking
- [ ] Rate limiting tested
- [ ] Security audit complete
- [ ] Performance benchmarks met
- [ ] Backup strategy in place
- [ ] Monitoring dashboard configured
- [ ] Support documentation ready

---

## Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Jest Documentation](https://jestjs.io/)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Supabase Testing](https://supabase.com/docs/guides/getting-started/local-development)

---

## Questions or Issues?

Contact the development team or refer to the main README.md for support information.
