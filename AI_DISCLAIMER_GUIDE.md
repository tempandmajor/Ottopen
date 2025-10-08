# AI Disclaimer & Legal Compliance Guide

## Overview

Ottopen uses AI-powered features extensively throughout the platform. This guide documents our compliance approach for AI disclaimers and legal requirements.

## Legal Requirements

### Why AI Disclaimers Are Necessary

1. **Accuracy & Reliability**: AI can generate inaccurate, incomplete, or misleading information
2. **Liability Protection**: Clear disclaimers limit legal liability for AI-generated content
3. **User Transparency**: Users must understand they're interacting with AI, not human experts
4. **Regulatory Compliance**: Emerging AI regulations require disclosure
5. **Copyright/IP**: AI-generated content may unintentionally replicate copyrighted material
6. **Professional Standards**: Writing industry standards require disclosure of AI assistance

### Regulatory Landscape

- **FTC Guidelines**: Must disclose when AI influences consumer decisions
- **EU AI Act**: Requires transparency for AI-generated content
- **Copyright Law**: AI-generated content has complex IP implications
- **Professional Writing Standards**: Industry best practices require AI disclosure

## Implementation Status

### ✅ Completed

#### 1. Terms of Service (Section 6)

**Location**: `/app/legal/terms/page.tsx`

**Coverage**:

- AI-generated content is assistance only
- User responsibility for review and editing
- AI may not be accurate, appropriate, or original
- User retains ownership and responsibility
- Third-party AI processing disclosure
- No guarantee of accuracy or suitability
- Usage limits by subscription tier

**Compliance Level**: ⭐⭐⭐⭐⭐ Excellent

#### 2. UI Disclaimers

**Component**: `/src/components/AIDisclaimer.tsx`

**Variants**:

- **Default**: Full disclaimer with bullet points
- **Compact**: Short warning for space-constrained UIs
- **Inline**: Minimal text for tooltips/hints

**Key Messages**:

- Review required
- May contain errors
- User responsibility
- Fact-check needed
- Original work emphasis

**Compliance Level**: ⭐⭐⭐⭐⭐ Excellent

#### 3. AI Assistant Panels

**Implemented In**:

- Editor AI Assistant: `/app/editor/[manuscriptId]/components/AIAssistantPanel.tsx`
- Script AI Assistant: `/app/scripts/[scriptId]/components/ScriptAIAssistantPanel.tsx`

**Implementation**: Compact disclaimer shown at top of all AI panels

**Compliance Level**: ⭐⭐⭐⭐⭐ Excellent

## Recommended Updates

### 1. Privacy Policy - AI Data Processing

**Current Status**: ⚠️ **NEEDS UPDATE**

**Required Additions**:

```markdown
## AI Services and Data Processing

### Third-Party AI Providers

We use the following AI services to power our writing assistance features:

- **Anthropic Claude**: Character development, dialogue enhancement, critique
- **OpenAI GPT**: General writing assistance, brainstorming
- **DeepSeek**: Cost-effective AI for Pro tier users
- **Google Gemini**: Free tier AI assistance
- **Perplexity AI**: Research and fact-checking (optional)

### Data Sent to AI Providers

When you use AI features, the following data may be sent to third-party AI providers:

- Your manuscript/script content (contextual excerpts only)
- User prompts and questions
- Genre, style, and format preferences
- NO personal identifying information (name, email, etc.)
- NO payment information
- NO account credentials

### AI Provider Data Retention

- **Anthropic**: Does not train on user data (zero retention for opt-out users)
- **OpenAI**: Does not train on API data (30-day retention for abuse monitoring)
- **DeepSeek**: Does not train on API data
- **Google**: May use data for service improvement (can opt-out)
- **Perplexity**: Does not train on API data

### Your AI Data Rights

You can:

- Opt-out of AI features entirely (Settings > AI Preferences)
- Request deletion of AI processing logs (Settings > Privacy > Export/Delete Data)
- Choose which AI provider to use (Studio tier only)
- Disable AI features on a per-document basis

### AI Content Ownership

- You retain full ownership of all content you create, including AI-assisted content
- AI-generated suggestions become your property once accepted and edited
- We claim no ownership over your AI-assisted works
```

**Recommended Location**: `/app/legal/privacy/page.tsx` - Add new section

---

### 2. Community Guidelines - AI-Generated Content

**Current Status**: ⚠️ **NEEDS UPDATE**

**Required Additions**:

```markdown
## AI-Generated Content Disclosure

### Posting AI-Assisted Work

If you share content in the community feed, book clubs, or forums:

- **Encouraged**: Disclose when content is primarily AI-generated
- **Required**: Mark entirely AI-generated content with [AI Generated] tag
- **Prohibited**: Passing off AI-generated content as entirely human-written in contests or paid submissions
- **Best Practice**: Describe your creative process when sharing AI-assisted work

### AI-Assisted Writing vs. AI-Generated

- **AI-Assisted**: You wrote most content, used AI for suggestions/editing (✅ Full sharing allowed)
- **AI-Generated**: AI wrote most content, you edited/curated (⚠️ Disclosure recommended)
- **AI-Created**: Entirely AI-generated with minimal human input (🚫 Must be clearly marked)

### Professional Submissions

For marketplace listings and paid opportunities:

- Disclose AI usage in submission guidelines
- Clients have right to know if work is AI-assisted
- Some opportunities may prohibit AI-generated content
- Misrepresenting AI content as human-written may result in account suspension
```

**Recommended Location**: `/app/legal/community/page.tsx` - Add new section

---

### 3. DMCA Policy - AI Copyright Issues

**Current Status**: ⚠️ **NEEDS UPDATE**

**Required Additions**:

```markdown
## AI-Generated Content and Copyright

### Copyright Concerns with AI

AI-generated content may inadvertently reproduce:

- Copyrighted text from training data
- Distinctive phrases or passages
- Plot structures or character archetypes
- Stylistic patterns from copyrighted works

### Your Responsibilities

If you use AI-generated content:

1. **Review for originality** - Check that AI hasn't reproduced copyrighted material
2. **Edit substantially** - Transform AI suggestions into your unique voice
3. **Fact-check** - Verify AI hasn't copied factual content verbatim
4. **Run plagiarism checks** - Use tools like Turnitin or Copyscape before publishing

### Copyright Liability

- **You are responsible** for ensuring your final work doesn't infringe copyright
- We are not liable for copyright issues arising from AI-generated content
- AI-assisted content is your responsibility to verify and edit

### DMCA Takedown for AI Content

If you believe AI-generated content on our platform infringes your copyright:

1. Follow standard DMCA takedown process
2. Note the content is AI-generated in your notice
3. Provide evidence of substantial similarity
```

**Recommended Location**: `/app/legal/dmca/page.tsx` - Add subsection

---

### 4. Subscription Terms - AI Usage Limits

**Current Status**: ✅ Partially covered in Terms of Service, but should be explicit

**Recommended Addition**:

Create `/app/legal/ai-usage-policy/page.tsx`:

```markdown
# AI Usage Policy

## Subscription Tier Limits

### Free Tier

- **AI Provider**: Google Gemini Flash
- **Requests**: 10 per month
- **Tokens per request**: 500 (~375 words)
- **Features**: Basic brainstorming, simple rewrites
- **Cooldown**: 24 hours between requests

### Pro Tier ($10/month)

- **AI Provider**: DeepSeek V3
- **Requests**: 100 per month
- **Tokens per request**: 2,000 (~1,500 words)
- **Features**: All AI features except memory persistence
- **Cooldown**: 1 hour between requests

### Studio Tier ($25/month)

- **AI Provider**: Claude 4.5 Sonnet + all others
- **Requests**: Unlimited
- **Tokens per request**: 4,000 (~3,000 words)
- **Features**: All AI features + memory persistence + multi-turn conversations
- **Cooldown**: None
- **Priority**: Faster response times

## Fair Use Policy

### Acceptable Use

- Writing assistance for your own creative works
- Research and fact-checking
- Editing and improving your drafts
- Learning and skill development

### Prohibited Use

- **Bulk content generation** for spam or SEO farms
- **Automated posting** of AI-generated content
- **Reselling access** to AI features
- **Commercial AI services** using our API
- **Training competing AI models** with our data
- **Circumventing rate limits** with multiple accounts

## Enforcement

Violations may result in:

1. **First offense**: Warning + 7-day AI feature suspension
2. **Second offense**: 30-day AI feature suspension
3. **Third offense**: Permanent AI feature revocation
4. **Severe abuse**: Account termination

## Credits and Rollover

- **Unused requests do NOT roll over** to next month
- **Upgrades**: Immediate access to higher tier limits
- **Downgrades**: Effective next billing cycle
```

---

## Risk Assessment

### Current Risk Level: 🟢 LOW

**Strong Points**:

- ✅ Comprehensive ToS AI section
- ✅ UI disclaimers in place
- ✅ Clear ownership terms
- ✅ Liability limitations

**Gaps**:

- ⚠️ Privacy policy lacks AI data processing details
- ⚠️ No explicit AI usage policy document
- ⚠️ Community guidelines don't address AI disclosure

### Recommendations Priority

1. **HIGH PRIORITY** (Do Now):
   - Update Privacy Policy with AI data processing section
   - Add AI disclosure to Community Guidelines

2. **MEDIUM PRIORITY** (Next 30 Days):
   - Create dedicated AI Usage Policy page
   - Update DMCA policy with AI copyright considerations

3. **LOW PRIORITY** (When Convenient):
   - Add AI FAQ page
   - Create AI best practices guide for users

## Compliance Checklist

### Legal Documents

- [x] Terms of Service - AI section present
- [ ] Privacy Policy - AI data processing (NEEDS UPDATE)
- [ ] Community Guidelines - AI disclosure (NEEDS UPDATE)
- [ ] DMCA Policy - AI copyright (NEEDS UPDATE)
- [ ] AI Usage Policy - Dedicated page (NEEDS CREATION)

### User Interface

- [x] AI disclaimer component created
- [x] Disclaimers in AI assistant panels
- [ ] Disclaimer in AI API responses (RECOMMENDED)
- [ ] AI badge for AI-assisted posts (RECOMMENDED)
- [ ] AI usage dashboard (NICE TO HAVE)

### Technical

- [x] Rate limiting for AI endpoints
- [x] Tier-based AI provider routing
- [ ] AI usage tracking per user (RECOMMENDED)
- [ ] AI content flagging system (RECOMMENDED)

## Best Practices

### For Development Team

1. **Always add disclaimers** when introducing new AI features
2. **Log AI usage** for abuse detection
3. **Implement timeouts** to prevent excessive API calls
4. **Cache common responses** to reduce costs
5. **Monitor AI errors** and fallback gracefully

### For Content/Legal Team

1. **Review AI-related terms** quarterly
2. **Monitor regulatory changes** (EU AI Act, FTC guidelines)
3. **Update privacy policy** when adding new AI providers
4. **Document all AI providers** and their data retention policies
5. **Train support team** on AI-related user questions

### For Product Team

1. **Make AI opt-in** for sensitive features
2. **Provide clear value** for each AI feature
3. **Show AI transparency** (e.g., "Generated by Claude")
4. **Collect user feedback** on AI quality
5. **A/B test disclaimers** for user comprehension

## References

### Legal Resources

- FTC Disclosures Guide: https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers
- EU AI Act: https://artificialintelligenceact.eu/
- Copyright Office AI Guidance: https://www.copyright.gov/ai/

### AI Provider Terms

- Anthropic Terms: https://www.anthropic.com/legal/commercial-terms
- OpenAI Terms: https://openai.com/policies/terms-of-use
- Google Gemini Terms: https://ai.google.dev/terms
- DeepSeek Terms: https://platform.deepseek.com/terms

---

**Last Updated**: October 8, 2025
**Next Review**: January 8, 2026 (Quarterly)
**Owner**: Legal & Product Teams
