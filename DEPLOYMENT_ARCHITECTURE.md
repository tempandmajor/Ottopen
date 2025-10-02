# 🏗️ Deployment Architecture - API Keys & Secrets Management

## Current Architecture

Your Ottopen app uses **Next.js API Routes** for AI functionality:

```
User → Next.js App → API Routes (/app/api/ai/*) → AI Providers
                         ↓
                   process.env.ANTHROPIC_API_KEY
                   process.env.OPENAI_API_KEY
```

**Where keys are stored:**

- Development: `.env.local` (gitignored)
- Production: Vercel Environment Variables

---

## ✅ Current Approach (Recommended)

### Why This Works

**Next.js API Routes are server-side only:**

- Keys are read from `process.env` at runtime
- Never exposed to the browser
- Industry-standard approach
- Zero client-side risk

**Example from your code** (`src/lib/ai/anthropic-client.ts:10`):

```typescript
anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})
```

This is **secure** because:

- Runs only on the server (Next.js API routes)
- Environment variables never sent to client
- Same security as Supabase Edge Functions

---

## 🔄 Alternative: Supabase Edge Functions

### When to Consider This

Use Supabase Edge Functions if:

- You want centralized secret management
- You're deploying to multiple platforms
- You need Supabase-specific features (RLS, realtime)
- You want to reduce Next.js API route complexity

### Migration Required

**Current:** Next.js API Route

```typescript
// app/api/ai/brainstorm/route.ts
export async function POST(request: NextRequest) {
  const aiClient = new AIClient(userTier)
  const response = await aiClient.complete(...)
  return NextResponse.json(response)
}
```

**Alternative:** Supabase Edge Function

```typescript
// supabase/functions/ai-brainstorm/index.ts
Deno.serve(async req => {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  // AI logic here
  return new Response(JSON.stringify(response))
})
```

---

## 📊 Comparison

| Feature               | Next.js API Routes (Current) | Supabase Edge Functions |
| --------------------- | ---------------------------- | ----------------------- |
| **Security**          | ✅ Secure (server-only)      | ✅ Secure (server-only) |
| **Secret Management** | Vercel env vars              | Supabase secrets        |
| **Setup Complexity**  | ✅ Simple (already done)     | ⚠️ Requires migration   |
| **Performance**       | ✅ Fast (same region)        | ✅ Fast (global edge)   |
| **Cost**              | Vercel pricing               | Supabase pricing        |
| **Vendor Lock-in**    | Vercel                       | Supabase                |
| **Current Status**    | ✅ Working                   | ❌ Not implemented      |

---

## 🎯 Recommendation: Stick with Current Approach

**Why:**

1. ✅ Already working and secure
2. ✅ No refactoring needed
3. ✅ Better Next.js integration
4. ✅ Faster for your use case (AI calls from Next.js)

**Your API keys are safe because:**

- Next.js API routes are server-side only
- Environment variables never exposed to browser
- Same security level as Supabase Edge Functions

---

## 🔐 How to Manage Secrets (Current Setup)

### Development

```bash
# .env.local (gitignored)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-proj-...
PERPLEXITY_API_KEY=pplx-...
```

### Production (Vercel)

**Option 1: Dashboard**

1. Go to: https://vercel.com/dashboard
2. Project → Settings → Environment Variables
3. Add each key for Production environment

**Option 2: CLI**

```bash
vercel env add ANTHROPIC_API_KEY production
vercel env add OPENAI_API_KEY production
vercel env add PERPLEXITY_API_KEY production
```

---

## 🔄 If You Want to Use Supabase Edge Functions

### Step 1: Create Edge Function

```bash
# Create function
npx supabase functions new ai-brainstorm

# Set secrets
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
npx supabase secrets set OPENAI_API_KEY=sk-proj-...
npx supabase secrets set PERPLEXITY_API_KEY=pplx-...
```

### Step 2: Implement Function

```typescript
// supabase/functions/ai-brainstorm/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Anthropic from 'npm:@anthropic-ai/sdk@0.30.1'

serve(async req => {
  try {
    // Get API key from Supabase secrets
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), { status: 500 })
    }

    // Parse request
    const { messages, maxTokens } = await req.json()

    // Call Anthropic
    const anthropic = new Anthropic({ apiKey })
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      messages,
      max_tokens: maxTokens || 4096,
    })

    return new Response(
      JSON.stringify({
        content: response.content[0].text,
        tokensUsed: response.usage,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
```

### Step 3: Deploy

```bash
npx supabase functions deploy ai-brainstorm
```

### Step 4: Update Client Code

```typescript
// app/api/ai/brainstorm/route.ts
export async function POST(request: NextRequest) {
  const { user } = await getServerUser()

  // Call Supabase Edge Function instead
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const response = await fetch(`${supabaseUrl}/functions/v1/ai-brainstorm`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${user.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages, maxTokens }),
  })

  return NextResponse.json(await response.json())
}
```

---

## 🤔 Which Approach Should You Use?

### Use Next.js API Routes (Current) If:

- ✅ You're primarily deploying to Vercel
- ✅ You want simple setup and maintenance
- ✅ You prefer TypeScript/Node.js ecosystem
- ✅ You want to stick with what's working

### Use Supabase Edge Functions If:

- You need global edge deployment
- You want all logic in Supabase ecosystem
- You're comfortable with Deno runtime
- You want to call AI from multiple platforms

---

## 🎯 Final Recommendation

**Keep your current setup** (Next.js API Routes + Vercel env vars).

**Why:**

1. It's already secure
2. It's already working
3. No migration needed
4. Simpler to maintain

**Your secrets are safe because:**

- ✅ Server-side only (never sent to browser)
- ✅ Encrypted in transit and at rest
- ✅ Only accessible to your server code
- ✅ Same security as Supabase Edge Functions

---

## 📋 Action Items

### For Current Setup (Recommended)

1. ✅ Rotate exposed API keys
2. ✅ Add keys to Vercel environment variables
3. ✅ Deploy to production
4. ✅ Test AI features

**Time required:** 15-20 minutes

### For Supabase Edge Functions (Optional)

1. Create Edge Functions for each AI route
2. Set Supabase secrets
3. Deploy functions
4. Update Next.js API routes to call Edge Functions
5. Test and verify

**Time required:** 2-3 hours

---

## 🔒 Security Best Practices (Both Approaches)

1. **Rotate keys regularly** (quarterly minimum)
2. **Use different keys** for dev/staging/production
3. **Never commit** `.env*` files to git
4. **Monitor usage** in provider dashboards
5. **Set up rate limiting** to prevent abuse
6. **Use least privilege** (read-only keys where possible)

---

## 📞 Questions?

**"Are my keys safe in Vercel?"**
Yes! Vercel environment variables are:

- Encrypted at rest
- Only accessible to your server code
- Never sent to the browser
- Same security as AWS Secrets Manager

**"Why not use Supabase Edge Functions?"**
You can! But it's not necessary. Your current setup is equally secure.

**"Should I migrate to Edge Functions?"**
Only if you have specific needs (global deployment, Supabase ecosystem, etc.). Otherwise, stick with what works.

---

**Last Updated:** 2025-01-02
**Current Status:** Next.js API Routes with Vercel env vars (Recommended ✅)
