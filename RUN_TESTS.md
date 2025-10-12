# Quick Test Guide - Ottopen

## ✅ Setup Complete!

Playwright browsers are installed and ready. You have:

- **Chromium** (Chrome/Edge) ✅
- **Firefox** ✅
- **Webkit** (Safari) ✅

---

## 🚀 Run Tests Now

### **1. Interactive UI Mode (RECOMMENDED)**

Best for development - see tests run in a visual interface:

```bash
npm run test:e2e:ui
```

This opens a UI where you can:

- Click to run individual tests
- See tests execute in real-time
- Debug failures with time-travel
- Watch network requests

### **2. Run All E2E Tests (Headless)**

Fastest way to run all tests:

```bash
npm run test:e2e
```

### **3. Watch Tests Run (Headed Mode)**

See the actual browser open and tests execute:

```bash
npm run test:e2e:headed
```

### **4. Run Unit Tests**

Quick validation of logic:

```bash
npm test
```

### **5. Run Everything**

Full test suite (unit + E2E):

```bash
npm run test:all
```

---

## 📊 Current Test Coverage

### E2E Tests Available:

- **Authentication** (9 tests)
  - Sign in/up flows
  - Password validation
  - Rate limiting
  - Forgot password

- **Subscription** (4 tests)
  - Pricing page
  - Checkout flow
  - Billing portal

- **Script Editor** (5 tests)
  - Create scripts
  - Format options
  - Validation

- **Exports** (10 tests)
  - All 6 export formats
  - Tier restrictions

### Unit Tests:

- Auth validation schemas ✅
- Database operations ✅
- Error handling ✅
- Rate limiting ✅

---

## 🎯 Quick Start Testing

### Test the Critical Path (5 minutes):

1. **Start dev server:**

   ```bash
   npm run dev
   ```

2. **In another terminal, run auth tests:**

   ```bash
   npm run test:e2e -- auth.spec.ts --headed
   ```

3. **Watch tests run automatically!**

---

## 🐛 Debug Failed Tests

If a test fails:

```bash
# Run in debug mode (pauses at each step)
npm run test:e2e:debug

# Run specific test file
npm run test:e2e -- auth.spec.ts

# Run specific browser
npm run test:e2e:chromium

# See detailed logs
npm run test:e2e -- --reporter=list
```

---

## 📸 Screenshots & Videos

When tests fail, Playwright automatically saves:

- **Screenshots**: `test-results/` folder
- **Videos**: `test-results/` folder
- **Traces**: For time-travel debugging

View test reports:

```bash
npx playwright show-report
```

---

## ⚡ Performance Tips

### Run Tests Faster:

```bash
# Run only Chromium (skip Firefox/Safari)
npm run test:e2e:chromium

# Run in parallel (default)
npm run test:e2e -- --workers=4

# Run single browser, single worker (slowest but most stable)
npm run test:e2e -- --project=chromium --workers=1
```

---

## 🎬 What Playwright Does

### Each test automatically:

1. ✅ Opens a fresh browser
2. ✅ Navigates to your app
3. ✅ Clicks buttons, fills forms
4. ✅ Checks if elements appear/disappear
5. ✅ Takes screenshots on failure
6. ✅ Records video of the session
7. ✅ Closes browser when done

### Example test flow:

```typescript
test('should sign in', async ({ page }) => {
  await page.goto('/auth/signin') // Open page
  await page.fill('[name="email"]', 'test@..') // Type email
  await page.fill('[name="password"]', 'pass') // Type password
  await page.click('button[type="submit"]') // Click sign in
  await expect(page).toHaveURL('/feed') // Verify redirect
})
```

---

## 📋 Test Checklist

Before going live, run:

- [ ] `npm run test:all` - All tests pass
- [ ] `npm run test:e2e:headed` - Watch key flows work
- [ ] Manual test with Stripe test card `4242 4242 4242 4242`
- [ ] Test on mobile viewport (included in E2E tests)
- [ ] Check `playwright-report/index.html` for failures

---

## 🔧 Configuration

### Browser Configuration:

- **Location**: `playwright.config.ts`
- **Test files**: `e2e/*.spec.ts`
- **Timeouts**: 30 seconds default
- **Retries**: 2 on CI, 0 locally

### Modify tests:

1. Edit files in `e2e/` folder
2. Add new `.spec.ts` files for new features
3. Tests auto-discover and run

---

## 📦 What's Installed

Browser storage locations:

```
~/Library/Caches/ms-playwright/
├── chromium-1194/      (Google Chrome engine)
├── firefox-1495/       (Mozilla Firefox engine)
└── webkit-2215/        (Safari engine)
```

Total size: ~400MB

---

## 🆘 Common Issues

### "Error: Browser not found"

```bash
npx playwright install
```

### "Port 3000 already in use"

```bash
# Kill the process
lsof -ti:3000 | xargs kill -9

# Or change port in playwright.config.ts
```

### "Tests timeout"

```bash
# Increase timeout in playwright.config.ts
timeout: 60000  // 60 seconds
```

### "Test failed but looks correct"

```bash
# Update expected behavior (snapshots)
npm run test:e2e -- --update-snapshots
```

---

## 🎓 Learn More

- **Playwright Docs**: https://playwright.dev
- **Test Best Practices**: See `TESTING.md`
- **Writing Tests**: https://playwright.dev/docs/writing-tests

---

## ✅ You're Ready!

Start testing with:

```bash
npm run test:e2e:ui
```

This opens an interactive interface - just click a test to watch it run!

---

## 📞 Need Help?

- Check `TESTING.md` for comprehensive guide
- Review `playwright.config.ts` for configuration
- See `e2e/*.spec.ts` for test examples

**Happy Testing! 🚀**
