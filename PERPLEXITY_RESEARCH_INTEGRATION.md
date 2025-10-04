# 🔍 Perplexity Research Integration

## Overview

Perplexity AI has been integrated into Ottopen as a **real-time research assistant** for fiction writers. This feature complements the creative AI capabilities (GPT-5, Claude 4.5) with accurate, cited research from the web.

---

## ✅ What Was Implemented

### 1. **Perplexity API Client** (`src/lib/ai/perplexity-client.ts`)

- Real-time web search with citations
- Streaming support for live research
- Recency filters (day, week, month, year)
- Domain filtering capabilities
- Models supported:
  - `llama-3.1-sonar-large-128k-online` (Premium/Enterprise)
  - `llama-3.1-sonar-small-128k-online` (Free/Pro)
  - `llama-3.1-sonar-huge-128k-online` (Highest quality)

### 2. **Research API Route** (`app/api/ai/research/route.ts`)

- POST endpoint: `/api/ai/research`
- Handles streaming and non-streaming responses
- Usage tracking and limits enforcement
- User tier-based model selection

### 3. **Research Panel Component** (`app/editor/[manuscriptId]/components/ResearchPanel.tsx`)

Features:

- **Context-aware research** - Understands your story's genre, setting, time period, characters, and current scene
- Real-time research queries with citations
- Time filters (day, week, month, year)
- Toggle story context on/off
- Copy to clipboard functionality
- Add research to Story Bible
- Citation links with external navigation
- Loading states and error handling

### 4. **Editor Integration**

- Research button in bottom toolbar
- Side panel for research (alongside AI Assistant)
- Full integration with EditorWorkspace

### 5. **AI Provider Updates**

- Added Perplexity to AI provider types
- Added cost tracking for Perplexity models
- Updated AI usage tracker with Perplexity pricing

---

## 🎯 Use Cases for Writers

### **Context-Aware Research** 🎯

When you enable "Use story context", Perplexity knows:

- Your story's **genre** (e.g., Historical Fiction, Sci-Fi)
- The **setting** (e.g., Victorian London, Mars Colony)
- The **time period** (e.g., 1850s, 2150)
- Your **characters** (by name)
- The **current scene** you're writing

**Example:**

- Story: Historical Fiction, Victorian London, 1850s
- Query: "What would a middle-class family eat for dinner?"
- Perplexity tailors answer to **Victorian England, 1850s, middle-class**

### 1. **Historical Research**

```
Query: "What was daily life like for middle-class families?"
```

With context enabled, Perplexity automatically knows you mean Victorian England!
Get accurate, cited information about:

- Social customs and etiquette (specific to 1850s London)
- Household layouts and furnishings
- Daily routines and meals
- Clothing and fashion

### 2. **Technical Accuracy**

```
Query: "How does forensic blood spatter analysis work in crime scene investigation?"
```

Research technical details for:

- Crime fiction and thrillers
- Medical dramas
- Scientific accuracy

### 3. **World-Building**

```
Query: "What are traditional Japanese tea ceremony protocols and cultural significance?"
```

Build authentic settings:

- Cultural practices
- Historical contexts
- Geographic details

### 4. **Contemporary Details**

```
Query: "What is the current state of AI technology in 2025?"
```

Keep stories current with:

- Recent events (with recency filter)
- Modern technology
- Current trends

---

## 💰 Pricing

| Model                     | Input Cost (per 1K tokens) | Output Cost (per 1K tokens) | Use Case                     |
| ------------------------- | -------------------------- | --------------------------- | ---------------------------- |
| `sonar-small-128k-online` | $0.0002                    | $0.0002                     | Free/Pro users               |
| `sonar-large-128k-online` | $0.001                     | $0.001                      | Premium/Enterprise (default) |
| `sonar-huge-128k-online`  | $0.005                     | $0.005                      | Highest quality research     |

**Extremely affordable** compared to GPT-5 and Claude 4.5!

---

## 🔧 Setup Instructions

### 1. Get Perplexity API Key

1. Go to: https://www.perplexity.ai/settings/api
2. Sign up or log in
3. Click **"Create API Key"**
4. Copy the key (starts with `pplx-...`)

### 2. Add to Environment Variables

#### Development (`.env.local`):

```bash
PERPLEXITY_API_KEY=pplx-your-key-here
```

#### Production (Vercel):

```bash
vercel env add PERPLEXITY_API_KEY production
# Paste your key when prompted
```

### 3. Deploy

```bash
vercel --prod
```

---

## 📊 How It Works

### Architecture Flow:

```
User Query → Research Panel
    ↓
/api/ai/research (Next.js API Route)
    ↓
Perplexity Client (src/lib/ai/perplexity-client.ts)
    ↓
Perplexity API (https://api.perplexity.ai)
    ↓
Real-time Web Search + AI Synthesis
    ↓
Answer + Citations
    ↓
Display in Research Panel
```

### Features:

- **Real-time search**: Perplexity indexes web content within seconds
- **Citations**: Every answer includes source URLs
- **Recency filters**: Get the freshest information
- **Fast**: ~358ms median latency
- **Accurate**: Optimized for factual research

---

## 🎨 Usage in Editor

### Opening Research Panel:

1. Open any manuscript in the editor
2. Click **"Research"** button in bottom toolbar
3. Research panel opens on the right side

### Making a Query:

1. Type your research question in the text area
2. (Optional) Select a time filter: day, week, month, year
3. ✨ **Toggle "Use story context"** to make research context-aware
4. Press Enter or click the Search button
5. Wait for the answer with citations

### Context-Aware Research:

When **"Use story context"** is enabled:

- Perplexity sees your manuscript's genre, setting, time period
- Knows your character names
- Has access to the current scene (first 500 characters)
- Tailors research to be **specific and relevant** to your story

**Example Without Context:**

```
Query: "What weapons did soldiers use?"
Answer: General overview of military weapons throughout history
```

**Example With Context (Historical Fiction, American Civil War, 1863):**

```
Query: "What weapons did soldiers use?"
Answer: Specific to Union/Confederate soldiers in 1863, including:
- Springfield Model 1861 rifled musket
- Colt Army Model 1860 revolver
- Artillery pieces used in the Battle of Gettysburg
```

### Using Results:

- **Copy Answer**: Click copy button or use "Copy Answer" button
- **Add to Story Bible**: Click to save research notes
- **Visit Sources**: Click citation links to verify information

---

## 🔒 Security & Privacy

- API key stored as environment variable (server-side only)
- Never exposed to client/browser
- Same security model as OpenAI/Anthropic keys
- Usage tracked and enforced per user tier

---

## 📈 Feature Comparison

| Feature                  | GPT-5 / Claude 4.5            | Perplexity                 |
| ------------------------ | ----------------------------- | -------------------------- |
| **Creative Writing**     | ✅ Excellent                  | ❌ Not designed for this   |
| **Real-time Web Search** | ❌ No                         | ✅ Yes (within seconds)    |
| **Citations**            | ❌ No                         | ✅ Yes (with URLs)         |
| **Fact-Checking**        | ⚠️ Limited (knowledge cutoff) | ✅ Real-time               |
| **Cost**                 | $$$                           | $ (much cheaper)           |
| **Use Case**             | Prose, dialogue, scenes       | Research, facts, citations |

**Recommendation**: Use both together:

- **GPT-5/Claude 4.5**: Creative writing, expanding scenes, character work
- **Perplexity**: Research, fact-checking, world-building

---

## 🚀 Future Enhancements

Potential improvements:

1. **Image search**: Enable `returnImages: true` for visual references
2. **Domain filtering**: Restrict to specific sources (e.g., .edu, .gov)
3. **Research history**: Save and organize research queries
4. **Auto-research**: Suggest research based on manuscript content
5. **Story Bible integration**: Auto-tag research with characters/locations

---

## 📝 API Reference

### POST /api/ai/research

**Request:**

```json
{
  "query": "What is the typical layout of a Victorian mansion?",
  "manuscriptId": "uuid",
  "recencyFilter": "year",
  "stream": false
}
```

**Response:**

```json
{
  "success": true,
  "answer": "Victorian mansions typically featured...",
  "citations": [
    "https://example.com/victorian-architecture",
    "https://example.com/mansion-layouts"
  ],
  "model": "llama-3.1-sonar-large-128k-online",
  "provider": "perplexity",
  "tokensUsed": {
    "total": 850,
    "prompt": 120,
    "completion": 730
  }
}
```

---

## ✅ Testing

### Test the API:

```bash
curl -X POST http://localhost:3000/api/ai/research \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{
    "query": "What is the capital of France?",
    "manuscriptId": "test-123"
  }'
```

### Expected Response:

```json
{
  "success": true,
  "answer": "Paris is the capital of France...",
  "citations": ["https://..."],
  "model": "llama-3.1-sonar-small-128k-online",
  "tokensUsed": {...}
}
```

---

## 📚 Resources

- **Perplexity API Docs**: https://docs.perplexity.ai/
- **Perplexity Dashboard**: https://www.perplexity.ai/settings/api
- **Pricing**: https://www.perplexity.ai/pricing
- **Blog Post**: https://www.perplexity.ai/hub/blog/introducing-the-perplexity-search-api

---

## 🎉 Benefits for Writers

1. **Save Time**: Hours of research → seconds
2. **Accuracy**: Real-time, cited information
3. **Confidence**: Verify facts with sources
4. **World-Building**: Build authentic, detailed settings
5. **Productivity**: Stay in editor, don't context-switch to Google
6. **Cost-Effective**: Much cheaper than using GPT-5 for research

---

## Support

If you encounter issues:

1. Check Perplexity API key is set correctly
2. Verify API key has credits/billing enabled
3. Check browser console for errors
4. Review server logs for API errors

**Happy researching! 📖✨**
