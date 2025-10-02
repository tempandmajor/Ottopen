# 🔑 How to Add API Keys to Production

## ⚠️ FIRST: Rotate Your Exposed Keys

**Before adding ANY keys, rotate the exposed ones:**

### 1. Anthropic API Key

1. Go to: https://console.anthropic.com/settings/keys
2. Find and **delete** the old key: `sk-ant-api03-WSFTeRxA...`
3. Click **"Create Key"**
4. Copy the new key (starts with `sk-ant-api03-...`)
5. Save it somewhere safe temporarily

### 2. OpenAI API Key

1. Go to: https://platform.openai.com/api-keys
2. Find and **revoke** the old key: `sk-proj-Gdh2daWIXXA...`
3. Click **"Create new secret key"**
4. Copy the new key (starts with `sk-proj-...`)
5. Save it somewhere safe temporarily

### 3. Perplexity API Key

1. Go to: https://www.perplexity.ai/settings/api
2. Find and **revoke** the old key: `pplx-lUs5HrBHOa...`
3. Click **"Create API Key"**
4. Copy the new key (starts with `pplx-...`)
5. Save it somewhere safe temporarily

---

## 📍 Where to Add API Keys

### Option 1: Vercel (Recommended for Next.js)

#### A. Via Vercel Dashboard (Easiest)

1. **Go to your project**:
   - Visit: https://vercel.com/dashboard
   - Select your Ottopen project

2. **Navigate to Settings**:
   - Click **Settings** tab
   - Click **Environment Variables** in sidebar

3. **Add each variable**:
   - Click **Add New**
   - For each variable below:
     - **Key**: Variable name
     - **Value**: Your actual value
     - **Environments**: Select `Production` (and optionally `Preview` & `Development`)
     - Click **Save**

   ```bash
   # Required Variables:

   NEXT_PUBLIC_SUPABASE_URL
   Value: https://wkvatudgffosjfwqyxgt.supabase.co

   NEXT_PUBLIC_SUPABASE_ANON_KEY
   Value: [Your Supabase anon key]

   SUPABASE_SERVICE_ROLE_KEY
   Value: [Your Supabase service role key]

   NEXT_PUBLIC_APP_URL
   Value: https://ottopen.com (or your domain)

   ANTHROPIC_API_KEY
   Value: [Your NEW Anthropic key from step 1]

   OPENAI_API_KEY
   Value: [Your NEW OpenAI key from step 2]

   PERPLEXITY_API_KEY
   Value: [Your NEW Perplexity key from step 3]

   STRIPE_SECRET_KEY
   Value: [Your Stripe secret key]

   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
   Value: [Your Stripe publishable key]
   ```

4. **Redeploy**:
   - After adding all variables, redeploy your app
   - Go to **Deployments** tab
   - Click the three dots (...) on latest deployment
   - Click **Redeploy**

#### B. Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Add environment variables
vercel env add ANTHROPIC_API_KEY production
# Paste your NEW Anthropic key when prompted

vercel env add OPENAI_API_KEY production
# Paste your NEW OpenAI key when prompted

vercel env add PERPLEXITY_API_KEY production
# Paste your NEW Perplexity key when prompted

# Add other required variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add NEXT_PUBLIC_APP_URL production
vercel env add STRIPE_SECRET_KEY production
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production

# Deploy to production
vercel --prod
```

---

### Option 2: Netlify

#### A. Via Netlify Dashboard

1. **Go to your site**:
   - Visit: https://app.netlify.com
   - Select your Ottopen site

2. **Navigate to Environment Variables**:
   - Click **Site settings**
   - Click **Environment variables** in sidebar

3. **Add variables**:
   - Click **Add a variable**
   - Select **Add a single variable**
   - Enter key and value (same list as Vercel above)
   - Click **Create variable**
   - Repeat for all variables

4. **Trigger deploy**:
   - Go to **Deploys** tab
   - Click **Trigger deploy** → **Deploy site**

#### B. Via Netlify CLI

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Link site
netlify link

# Set environment variables
netlify env:set ANTHROPIC_API_KEY "your-new-key"
netlify env:set OPENAI_API_KEY "your-new-key"
netlify env:set PERPLEXITY_API_KEY "your-new-key"
# ... (add all other variables)

# Deploy
netlify deploy --prod
```

---

### Option 3: Railway

1. **Go to project**:
   - Visit: https://railway.app/dashboard
   - Select your Ottopen project

2. **Add variables**:
   - Click **Variables** tab
   - Click **+ New Variable**
   - Add each variable (same list as above)

3. **Deploy**:
   - Railway auto-deploys on variable changes

---

### Option 4: Fly.io

```bash
# Set secrets (environment variables)
fly secrets set ANTHROPIC_API_KEY="your-new-key"
fly secrets set OPENAI_API_KEY="your-new-key"
fly secrets set PERPLEXITY_API_KEY="your-new-key"
fly secrets set NEXT_PUBLIC_SUPABASE_URL="https://wkvatudgffosjfwqyxgt.supabase.co"
fly secrets set NEXT_PUBLIC_SUPABASE_ANON_KEY="your-key"
fly secrets set SUPABASE_SERVICE_ROLE_KEY="your-key"
fly secrets set NEXT_PUBLIC_APP_URL="https://ottopen.com"
fly secrets set STRIPE_SECRET_KEY="your-key"
fly secrets set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your-key"

# Deploy
fly deploy
```

---

### Option 5: Docker / Custom Server

Create `.env.production` file (NOT committed to git):

```bash
# Production Environment Variables
NEXT_PUBLIC_SUPABASE_URL=https://wkvatudgffosjfwqyxgt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=https://ottopen.com
ANTHROPIC_API_KEY=your_new_anthropic_key
OPENAI_API_KEY=your_new_openai_key
PERPLEXITY_API_KEY=your_new_perplexity_key
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
NODE_ENV=production
```

Then start your server:

```bash
# Load production env and start
NODE_ENV=production npm start
```

---

## 🔍 Where to Find Your Keys

### Supabase Keys

1. Go to: https://app.supabase.com/project/wkvatudgffosjfwqyxgt/settings/api
2. Copy **Project URL** → use for `NEXT_PUBLIC_SUPABASE_URL`
3. Copy **anon public** key → use for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Copy **service_role** key → use for `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep secret!)

### Stripe Keys

1. Go to: https://dashboard.stripe.com/apikeys
2. Copy **Publishable key** → use for `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. Copy **Secret key** → use for `STRIPE_SECRET_KEY` (⚠️ Keep secret!)

### AI Provider Keys

- **Anthropic**: https://console.anthropic.com/settings/keys
- **OpenAI**: https://platform.openai.com/api-keys
- **Perplexity**: https://www.perplexity.ai/settings/api

---

## ✅ Verification Checklist

After adding all keys:

- [ ] All keys rotated (new keys, not the exposed ones)
- [ ] All environment variables added to platform
- [ ] App redeployed
- [ ] Health check passes: `curl https://your-domain.com/api/health`
- [ ] Test authentication flow
- [ ] Test AI features (brainstorm, expand, etc.)
- [ ] Test Stripe subscription flow

---

## 🧪 Testing Your API Keys

### Test Anthropic

```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-3-5-sonnet-20241022","max_tokens":1024,"messages":[{"role":"user","content":"Hello"}]}'
```

### Test OpenAI

```bash
curl https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4","messages":[{"role":"user","content":"Hello"}]}'
```

### Test Perplexity

```bash
curl https://api.perplexity.ai/chat/completions \
  -H "Authorization: Bearer $PERPLEXITY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"llama-3.1-sonar-small-128k-online","messages":[{"role":"user","content":"Hello"}]}'
```

---

## 🚨 Common Issues

### "Invalid API Key" Error

- Make sure you copied the NEW rotated keys, not the old exposed ones
- Check for extra spaces or line breaks when pasting
- Verify the key starts with the correct prefix (sk-ant-, sk-proj-, pplx-)

### Environment Variables Not Working

- Make sure to redeploy after adding variables
- Check variable names match exactly (case-sensitive)
- For `NEXT_PUBLIC_*` vars, rebuild the app
- Clear browser cache and test in incognito

### Keys Still Exposed

- Never commit `.env*` files to git
- Check `.gitignore` includes `.env*`
- Use platform's secret management (Vercel, Railway, etc.)
- Rotate keys quarterly for security

---

## 📞 Need Help?

**Platform Documentation:**

- Vercel: https://vercel.com/docs/environment-variables
- Netlify: https://docs.netlify.com/environment-variables
- Railway: https://docs.railway.app/develop/variables
- Fly.io: https://fly.io/docs/reference/secrets/

**Your Setup:**

- GitHub Repo: https://github.com/tempandmajor/Ottopen
- Supabase Project: https://app.supabase.com/project/wkvatudgffosjfwqyxgt

---

⏱️ **Time Required**: 15-20 minutes to add all keys
🔐 **Security**: Always use platform secret management, never commit keys to git
