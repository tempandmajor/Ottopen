# Ghostwriter Pricing System - Complete Guide

## 🎯 Overview

The platform now supports industry-standard ghostwriter pricing models based on real-world rates from 2025:

- ✅ **Per Word** (Industry Standard) - $0.10 to $2.50/word
- ✅ **Per Page** - $50 to $300/page
- ✅ **Per Project** - $6,000 to $150,000+
- ✅ **Hourly** - $25 to $200/hour

## 📊 Pricing Models Explained

### 1. Per Word Pricing (Most Common)

**Industry Standard:** Most popular pricing method for ghostwriting

| Experience Level          | Rate Range         | Typical Book Cost (60k words) |
| ------------------------- | ------------------ | ----------------------------- |
| Beginner (0-2 years)      | $0.10 - $0.25/word | $6,000 - $15,000              |
| Intermediate (2-5 years)  | $0.25 - $0.50/word | $15,000 - $30,000             |
| Professional (5-10 years) | $0.50 - $1.00/word | $30,000 - $60,000             |
| Expert (10+ years)        | $1.00 - $2.50/word | $60,000 - $150,000            |

**When to Use:**

- Full-length books (novels, memoirs, business books)
- Clear word count requirements
- Standard industry practice

**Example Calculation:**

```
50,000 word book × $0.30/word = $15,000
```

---

### 2. Per Page Pricing

**Industry Standard:** $50 - $300 per finished page (250-300 words/page)

| Experience Level | Rate Range       |
| ---------------- | ---------------- |
| Beginner         | $50 - $100/page  |
| Intermediate     | $100 - $150/page |
| Professional     | $150 - $250/page |
| Expert           | $250 - $300/page |

**When to Use:**

- Academic writing
- Technical documentation
- Short-form content
- Clients who think in pages vs words

**Example Calculation:**

```
200 pages × $125/page = $25,000
```

---

### 3. Per Project Pricing

**Industry Standard:** Fixed rate for entire project (50k-70k word book)

| Experience Level | Rate Range          |
| ---------------- | ------------------- |
| Beginner         | $6,000 - $15,000    |
| Intermediate     | $15,000 - $30,000   |
| Professional     | $30,000 - $60,000   |
| Expert           | $60,000 - $150,000+ |

**When to Use:**

- Complex projects with unclear scope
- Clients who prefer fixed budgets
- Projects with heavy research/interviews
- Premium/specialized content

**Example:**

```
Business book ghostwriting: $45,000 flat rate
Includes: Research, interviews, writing, 2 rounds of revisions
```

---

### 4. Hourly Pricing

**Industry Standard:** $25 - $200/hour

| Experience Level | Rate Range       |
| ---------------- | ---------------- |
| Beginner         | $25 - $49/hour   |
| Intermediate     | $49 - $84/hour   |
| Professional     | $84 - $150/hour  |
| Expert           | $150 - $200/hour |

**When to Use:**

- Editing and revision work
- Consulting/developmental editing
- Uncertain project scope
- Short-term projects

**Example Calculation:**

```
100 hours × $65/hour = $6,500
```

---

## 🗄️ Database Schema

### Users Table - New Pricing Columns

```sql
-- Pricing configuration
pricing_model TEXT                     -- 'per_word', 'per_page', 'per_project', 'hourly'
rate_per_word DECIMAL(10,4)           -- e.g., 0.30
rate_per_page DECIMAL(10,2)           -- e.g., 125.00
rate_hourly DECIMAL(10,2)             -- e.g., 65.00
project_rate_min DECIMAL(10,2)        -- e.g., 15000.00
project_rate_max DECIMAL(10,2)        -- e.g., 30000.00

-- Experience & specialization
experience_level TEXT                  -- 'beginner', 'intermediate', 'professional', 'expert'
specializations TEXT[]                 -- ['fiction', 'business', 'memoir']
turnaround_time_days INTEGER          -- Average completion time
minimum_project_budget DECIMAL(10,2)  -- Minimum project they'll accept
```

### Jobs Table - New Pricing Columns

```sql
-- Job pricing details
pricing_model TEXT                     -- 'per_word', 'per_page', 'per_project', 'hourly', 'milestone'
estimated_word_count INTEGER          -- e.g., 50000
estimated_page_count INTEGER          -- e.g., 200
estimated_hours DECIMAL(10,2)         -- e.g., 100.00
rate_offered_per_word DECIMAL(10,4)   -- e.g., 0.30
rate_offered_per_page DECIMAL(10,2)   -- e.g., 125.00
rate_offered_hourly DECIMAL(10,2)     -- e.g., 65.00
budget DECIMAL(10,2)                  -- Total budget (for per_project)
```

### Pricing Guidelines Table

```sql
CREATE TABLE pricing_guidelines (
  id UUID PRIMARY KEY,
  experience_level TEXT NOT NULL,           -- 'beginner', 'intermediate', 'professional', 'expert'
  pricing_model TEXT NOT NULL,              -- 'per_word', 'per_page', 'per_project', 'hourly'
  min_rate DECIMAL(10,4) NOT NULL,
  max_rate DECIMAL(10,4) NOT NULL,
  description TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(experience_level, pricing_model)
);
```

---

## 🔧 API Endpoints

### 1. Get Pricing Guidelines

```typescript
GET /api/pricing/guidelines?experience_level=intermediate&pricing_model=per_word

Response:
{
  "guidelines": [
    {
      "experience_level": "intermediate",
      "pricing_model": "per_word",
      "min_rate": 0.25,
      "max_rate": 0.50,
      "description": "Mid-range ghostwriters, $15,000-$30,000 per book"
    }
  ]
}
```

### 2. Create/Hire with Pricing

```typescript
POST /api/jobs/[jobId]/hire

Body:
{
  "applicationId": "uuid",
  "pricingModel": "per_word",
  "estimatedWordCount": 50000,
  "ratePerWord": 0.30,
  "milestones": [
    { "title": "First Draft", "amount": 7500, "description": "Complete first draft" },
    { "title": "Final Draft", "amount": 7500, "description": "Revisions and final" }
  ]
}

Response:
{
  "success": true,
  "contract": { ... },
  "clientSecret": "pi_xxx",
  "fees": {
    "totalAmount": 15000,
    "platformFee": 1500,      // 10%
    "stripeFee": 435,         // 2.9% + $0.30
    "writerReceives": 13065
  }
}
```

---

## 🎨 UI Components

### PricingCalculator Component

**Location:** `src/components/PricingCalculator.tsx`

**Props:**

```typescript
interface PricingCalculatorProps {
  mode?: 'writer' | 'client'
  onPricingChange?: (pricing: WriterPricing | JobPricing) => void
  initialValues?: {
    pricing_model?: PricingModel
    experience_level?: ExperienceLevel
  }
}
```

**Writer Mode:**

```tsx
<PricingCalculator
  mode="writer"
  onPricingChange={pricing => {
    // pricing = { pricing_model, rate_per_word, experience_level, ... }
  }}
/>
```

**Client Mode:**

```tsx
<PricingCalculator
  mode="client"
  onPricingChange={pricing => {
    // pricing = { pricing_model, estimated_word_count, rate_offered_per_word, ... }
  }}
/>
```

**Features:**

- ✅ Real-time cost calculation
- ✅ Industry rate recommendations
- ✅ Auto word/page count conversion
- ✅ Experience level guidance
- ✅ Validation and error handling

---

## 📐 Pricing Utilities

**Location:** `src/lib/pricing-utils.ts`

### Key Functions:

```typescript
// Calculate estimated project cost
calculateEstimatedCost(pricing: JobPricing): { min, max, display }

// Get recommended rates by experience
getRecommendedRates(level: ExperienceLevel, model: PricingModel): { min, max, description }

// Format pricing for display
formatPricingDisplay(pricing: WriterPricing): string
// Returns: "$0.30/word" or "$125/page" or "$15,000-$30,000/project"

// Convert between words and pages
estimatePageCountFromWords(wordCount: number): number  // ~275 words/page
estimateWordCountFromPages(pageCount: number): number

// Validate pricing configuration
validateWriterPricing(pricing: WriterPricing): { valid: boolean, error?: string }
```

---

## 👤 User Workflows

### For Writers (Setting Rates)

1. **Go to Profile/Settings**
   - Navigate to pricing section

2. **Choose Pricing Model**
   - Per Word (recommended)
   - Per Page
   - Per Project (range)
   - Hourly

3. **Set Experience Level**
   - Beginner, Intermediate, Professional, Expert
   - System shows recommended rates

4. **Set Rates**
   - Enter rate based on model
   - See real-time validation
   - Compare to industry standards

5. **Save**
   - Rates appear on profile
   - Shown in job applications
   - Used for client calculations

---

### For Clients (Hiring Writers)

1. **Post Job**
   - Select pricing model
   - Set word count/page count/hours
   - Set offered rate or budget

2. **Review Applications**
   - See writer's rates
   - Compare to job budget
   - Auto-calculate total cost

3. **Hire Writer**
   - Choose pricing model (can negotiate)
   - Set final word count/budget
   - Optional: Add milestones
   - Pay into escrow

4. **Track Progress**
   - Monitor milestones
   - Approve deliverables
   - Release payments

---

## 💰 Fee Structure

**Platform Fee:** 10% of job amount
**Stripe Fee:** 2.9% + $0.30

### Example Breakdown ($15,000 job):

```
Client Pays:        $15,000
Platform Fee (10%): $1,500
Stripe Fee (2.9%):  $435
Stripe Fixed:       $0.30
─────────────────────────
Writer Receives:    $13,065
```

---

## 🔄 Pricing Model Migration

### Old System (Deprecated):

```sql
hourly_rate DECIMAL(10,2)  -- Single rate, not industry-standard
```

### New System:

```sql
pricing_model TEXT                    -- Flexible model selection
rate_per_word DECIMAL(10,4)          -- Per word (most common)
rate_per_page DECIMAL(10,2)          -- Per page
rate_hourly DECIMAL(10,2)            -- Hourly (still supported)
project_rate_min DECIMAL(10,2)       -- Project range
project_rate_max DECIMAL(10,2)       -- Project range
experience_level TEXT                 -- Affects recommendations
```

**Migration Applied:** ✅

- `hourly_rate` column dropped
- New pricing columns added
- Pricing guidelines table created with industry standards

---

## 📱 User Interface Examples

### Writer Profile Display:

```
John Doe - Professional Ghostwriter ⭐4.8
────────────────────────────────────
💰 Pricing: $0.50/word
📊 Experience: Professional (7 years)
📚 Specializations: Business, Memoir, Fiction
⏱️ Turnaround: 60 days
💵 Minimum Project: $20,000

Estimated Cost for 50k words: $25,000
```

### Job Listing Display:

```
Fiction Novel Ghostwriter Needed
─────────────────────────────────
💰 Budget: $0.35/word
📖 Word Count: 60,000 words
💵 Total: ~$21,000
📅 Deadline: 90 days
```

---

## 🧮 Common Calculations

### Full-Length Book (60,000 words):

| Model            | Calculation      | Result  |
| ---------------- | ---------------- | ------- |
| Per Word ($0.30) | 60,000 × $0.30   | $18,000 |
| Per Page ($125)  | 218 pages × $125 | $27,250 |
| Per Project      | Fixed            | $25,000 |
| Hourly ($65)     | 150 hours × $65  | $9,750  |

### Short Story (10,000 words):

| Model            | Calculation     | Result |
| ---------------- | --------------- | ------ |
| Per Word ($0.50) | 10,000 × $0.50  | $5,000 |
| Per Page ($150)  | 36 pages × $150 | $5,400 |

---

## ✅ Implementation Checklist

- [x] Database migration completed
- [x] Pricing guidelines table populated
- [x] API routes created
- [x] Pricing calculator component built
- [x] Hire flow updated for new models
- [x] Fee calculation updated
- [x] Utility functions created
- [x] Industry standards researched
- [x] Documentation completed

---

## 🚀 Next Steps (Optional)

1. **Add to Writer Onboarding**
   - Guide writers through setting rates
   - Show industry comparisons
   - Suggest rates based on experience

2. **Job Posting Enhancement**
   - Integrate calculator in job form
   - Show estimated cost in real-time
   - Suggest appropriate pricing model

3. **Search & Filter**
   - Filter writers by rate range
   - Sort by price
   - Budget-based recommendations

4. **Analytics**
   - Track average rates by model
   - Show market trends
   - Pricing optimization suggestions

---

## 📚 Resources

**Industry Research Sources:**

- Reedsy: Professional ghostwriter marketplace data (2025)
- Pixel Writing Studio: Industry rate analysis
- Ghostwriters & Co: Cost breakdown studies
- The Writing King: Professional rates guide

**Rate Ranges Summary:**

- Entry-level: $0.10-$0.25/word ($6k-$15k/book)
- Mid-range: $0.25-$0.50/word ($15k-$30k/book)
- Professional: $0.50-$1.00/word ($30k-$60k/book)
- Expert: $1.00-$2.50/word ($60k-$150k/book)

---

## 🔗 Related Documentation

- [Job Marketplace Implementation](JOB_MARKETPLACE_IMPLEMENTATION.md)
- [User Access Guide](USER_ACCESS_GUIDE.md)
- [Stripe Connect Setup](src/lib/stripe-connect-service.ts)
- [Pricing Utilities](src/lib/pricing-utils.ts)

---

**Last Updated:** January 11, 2025
**Status:** ✅ Production Ready
