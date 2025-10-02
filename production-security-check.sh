#!/bin/bash

echo "🔒 PRODUCTION SECURITY CHECKLIST"
echo "================================="
echo ""

# Check 1: Environment files
echo "✅ Environment Files:"
if [ -f .env.local ]; then
    echo "   - .env.local exists"
fi
if [ -f .env.production ]; then
    echo "   - .env.production exists"
fi
echo ""

# Check 2: Gitignore protection
echo "✅ Git Protection:"
grep -q "\.env" .gitignore && echo "   - .env files are gitignored" || echo "   ⚠️  .env files NOT protected!"
echo ""

# Check 3: No hardcoded secrets
echo "✅ Hardcoded Secrets Check:"
SECRET_COUNT=$(grep -r -i -E "(sk-ant-|sk-proj-|pplx-)" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git . 2>/dev/null | wc -l)
if [ "$SECRET_COUNT" -eq 0 ]; then
    echo "   - No hardcoded API keys found ✓"
else
    echo "   ⚠️  Found $SECRET_COUNT potential hardcoded secrets!"
fi
echo ""

# Check 4: Required env vars
echo "✅ Required Environment Variables:"
echo "   Add these to your production environment:"
echo "   - NEXT_PUBLIC_SUPABASE_URL"
echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "   - SUPABASE_SERVICE_ROLE_KEY"
echo "   - NEXT_PUBLIC_APP_URL"
echo "   - ANTHROPIC_API_KEY (rotate the exposed one!)"
echo "   - OPENAI_API_KEY (rotate the exposed one!)"
echo "   - PERPLEXITY_API_KEY (rotate the exposed one!)"
echo "   - STRIPE_SECRET_KEY"
echo "   - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
echo ""

# Check 5: Next.js config
echo "✅ Production Configuration:"
[ -f next.config.js ] && echo "   - next.config.js exists" || echo "   ⚠️  next.config.js missing!"
[ -f vercel.json ] && echo "   - vercel.json exists" || echo "   - vercel.json not found (optional)"
echo ""

# Check 6: Dependencies
echo "✅ Dependencies:"
npm outdated --depth=0 2>/dev/null | head -5
echo ""

echo "🚨 CRITICAL ACTIONS REQUIRED:"
echo "============================="
echo "1. ROTATE ALL API KEYS IMMEDIATELY:"
echo "   - Anthropic: https://console.anthropic.com/settings/keys"
echo "   - OpenAI: https://platform.openai.com/api-keys"
echo "   - Perplexity: (check their dashboard)"
echo ""
echo "2. Set environment variables in Vercel/hosting:"
echo "   - Go to project settings → Environment Variables"
echo "   - Add ALL required variables listed above"
echo ""
echo "3. Enable security headers in production"
echo "4. Set up proper CORS policies"
echo "5. Configure rate limiting for API routes"
echo ""
