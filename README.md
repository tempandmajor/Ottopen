# 🎬 Ottopen Writing Suite

**The world's first AI-powered unified writing platform** for screenplays, documentaries, stage plays, and non-fiction books with 20+ professional AI features.

**Live Site**: https://ottopen.app

---

## 🚀 What Makes Ottopen Revolutionary

The **ONLY** platform that offers:

- ✅ **5 Writing Formats** - Screenplays, TV pilots, stage plays, documentaries, non-fiction books
- ✅ **20+ AI Features** - Dialogue enhancement, structure analysis, fact-checking, and more
- ✅ **6 Export Formats** - PDF, Word, EPUB, Final Draft, Fountain, Plain Text
- ✅ **Real-time Collaboration** - Google Docs-style editing with presence indicators
- ✅ **Shared Research** - Cross-project notes and citations
- ✅ **Cross-Format Conversion** - AI-powered format switching
- ✅ **Cloud-Native** - Write anywhere, any device
- ✅ **Affordable** - $20/month vs $250+ competitors

### Market Position

| Feature           | Ottopen | Final Draft | Scrivener | Atticus | Ulysses |
| ----------------- | ------- | ----------- | --------- | ------- | ------- |
| Script Formats    | 4       | 3           | 0         | 0       | 0       |
| Books             | ✅      | ❌          | ✅        | ✅      | ✅      |
| Documentaries     | ✅      | ❌          | ❌        | ❌      | ❌      |
| AI Features       | 20+     | 0           | 0         | 0       | 0       |
| Format Conversion | ✅      | ❌          | ❌        | ❌      | ❌      |
| Export Formats    | 6       | 2           | 3         | 2       | 2       |
| Real-time Collab  | ✅      | ⚠️          | ❌        | ❌      | ⚠️      |
| Price             | $20/mo  | $250        | $49       | $147    | $50/yr  |

---

## 📝 Writing Formats

### 🎬 Screenplays & TV Pilots

- Industry-standard formatting (US, UK, European)
- Auto-formatting (scene headings, dialogue, action)
- Character/location auto-population
- Scene numbering
- 90-120 page validation

### 🎭 Stage Plays

- Stage directions, music cues, sound effects
- British and European standards
- 80-100 page range

### 🎥 Documentaries

- Narration/voice-over
- Interview questions/answers
- B-roll descriptions
- Archive footage notes
- Lower thirds (on-screen text)
- 4-act structure

### 📚 Non-fiction Books

- Professional book typography (Georgia serif)
- Chapter titles, subtitles, paragraphs
- 3 heading levels
- Block quotes, lists
- Footnotes and citations
- 150-400 page range
- EPUB export

---

## 🤖 AI-Powered Features (20+)

### Screenplay AI

1. **Dialogue Enhancement** - Polish dialogue, add subtext
2. **Beat Generation** - Save the Cat! 15-beat structure
3. **Structure Analysis** - 3-act breakdown
4. **Script Coverage** - Professional reader's report
5. **Character Voice** - Consistency checking

### Documentary AI

6. **Fact-Checking** - Verify claims with confidence scores
7. **Interview Questions** - Story-driven questions
8. **Documentary Structure** - 4-act emotional arc
9. **Research Suggestions** - Topic exploration
10. **B-Roll Suggestions** - Visual recommendations
11. **Archive Footage** - Search suggestions

### Non-fiction Book AI

12. **Chapter Outlines** - 10+ chapter generation from thesis
13. **Research Assistant** - Questions, sources, keywords
14. **Book Fact-Checker** - Claim verification
15. **Citation Manager** - APA, MLA, Chicago formatting
16. **Paragraph Enhancer** - Clarify, strengthen, shorten, expand
17. **Bibliography** - Batch citation formatting

### Advanced AI (All Formats)

18. **Table Read** - Realistic actor performances
19. **AI Writing Room** - 5 perspectives (Producer, Director, Actor, Editor, Cinematographer)
20. **Budget Estimation** - Detailed production budgets
21. **Casting Suggestions** - Actor recommendations
22. **Marketing Analysis** - Target audience, comps

### Cross-Format AI

23. **Format Conversion** - 5 converters:
    - Screenplay → Book outline
    - Book → Documentary treatment
    - Screenplay ↔ Stage play
    - Documentary ↔ Screenplay
    - Any format → Treatment

---

## 💾 Universal Export

### 6 Professional Formats

1. **PDF** - Industry-standard with title pages, watermarks
2. **Microsoft Word (.docx)** - Full editing compatibility
3. **EPUB** - E-book format for books
4. **Final Draft (.fdx)** - Industry screenplay format
5. **Fountain** - Open-source screenplay format
6. **Plain Text** - Universal compatibility

---

## 🤝 Real-Time Collaboration

- **Live cursors** - See collaborators typing
- **Presence indicators** - Who's online
- **Real-time syncing** - Instant updates
- **Share links** - Granular permissions (view/comment/edit)
- **Collaboration limits**:
  - Free: 1 active script
  - Pro: 3 writers
  - Studio: Unlimited

---

## 📚 Shared Research Repository

- Create notes linked to multiple projects
- Tag-based organization
- Full-text search
- 6 source types (books, articles, websites, interviews, videos, other)
- Cross-project linking
- Statistics dashboard

---

## 💳 Subscription Tiers

### Free

- 1 active script/book
- Basic formatting
- PDF export
- 10 AI requests/month

### Pro ($20/mo)

- Unlimited scripts/books
- 100 AI requests/month
- Real-time collaboration (3 writers)
- All production reports
- All export formats
- Research repository

### Studio ($50/mo)

- Unlimited AI requests
- Unlimited collaboration
- Advanced AI features
- Priority support
- Custom watermarks

---

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+ & npm - [install with nvm](https://github.com/nvm-sh/nvm)
- Supabase account - [Create free account](https://supabase.com)
- Anthropic API key - [Get API key](https://console.anthropic.com/)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/tempandmajor/Ottopen.git
cd Ottopen

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Add your API keys to .env.local:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - ANTHROPIC_API_KEY
# - STRIPE_SECRET_KEY (for payments)

# Run Supabase migrations
# (from supabase/migrations/ directory)

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## 💻 Tech Stack

### Frontend

- **Next.js 14** - App Router
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library

### Backend

- **Next.js API Routes** - Serverless functions
- **Supabase** - PostgreSQL database
- **Row Level Security (RLS)** - Data security
- **Real-time subscriptions** - Live collaboration

### AI Integration

- **Anthropic Claude Sonnet 4** - Latest model
- **Multi-model support** - Fallback options
- **Usage tracking** - Cost optimization

### Payments

- **Stripe** - Subscription management
- **Billing portal** - Customer self-service

### Deployment

- **Vercel** - Production hosting
- **Automated CI/CD** - GitHub integration
- **Environment-based config** - Dev/staging/prod

---

## 📊 Project Statistics

- **30+ Feature Categories**
- **40+ API Endpoints**
- **5 Writing Formats**
- **20+ AI Features**
- **6 Export Formats**
- **650,000+ Total Addressable Market (writers)**

---

## 📧 Support

For questions or support:

- **Email**: support@ottopen.app
- **Website**: https://ottopen.app
- **Documentation**: See FEATURES.md for complete feature list

---

## 📜 License

© 2025 Ottopen. All rights reserved.

See legal pages for Terms of Service and Privacy Policy.

---

## 🎉 Status

**Version**: 6.0.0 (Phase 6C Complete)
**Status**: ✅ Production Ready - Writing Suite COMPLETE
**Live**: https://ottopen.app

**Last Updated**: October 2, 2025
