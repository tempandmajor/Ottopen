# User Access Guide - How to Use All Features

## ✅ System Status

### Stripe Configuration ✅

- **Webhook Active**: `https://ottopen.app/api/webhooks/stripe`
  - Events: subscription.created, subscription.updated, subscription.deleted, account.updated
- **Products Live**: 7 products configured
- **Prices Set**: All tier pricing configured
- **Environment Variables**: All set in Vercel production

### Supabase Configuration ✅

- **Database Tables**: All marketplace tables created
  - job_contracts, job_milestones, job_reviews, job_disputes, payment_transactions
- **User Fields**: All enhanced fields added
  - hourly_rate, portfolio_url, writer_bio, rating, payout_method, etc.
- **RLS Policies**: Enabled and secured
- **Migrations**: Applied successfully

---

## 🎯 How Users Access Features

### 1. **Pricing & Subscriptions**

#### Access Point: `/pricing`

**For Writers:**

1. Go to **https://ottopen.app/pricing**
2. Click "For Writers" tab
3. See plans:
   - **Free** - $0/month (click "Get Started Free")
   - **Premium** - $20/month (click "Subscribe Now")
   - **Pro** - $50/month (click "Subscribe Now")
4. Clicking subscribe redirects to Stripe Checkout
5. After payment, webhook updates account tier automatically

**For Industry Professionals:**

1. Go to **https://ottopen.app/pricing**
2. Click "For Industry" tab
3. See plans:
   - **External Agent** - $200/month
   - **Publisher Access** - $300/month
   - **Producer Premium** - $500/month
4. Click "Get Started" → Stripe Checkout
5. Account tier upgrades automatically

**What Happens After Subscribe:**

- User redirected to `/dashboard?session_id={CHECKOUT_SESSION_ID}`
- Stripe webhook fires → updates `users.account_tier`
- Features unlock immediately based on new tier

---

### 2. **Job Marketplace (Free to Use)**

#### For Clients (Posting Jobs):

**Access Point**: `/opportunities`

**Step-by-Step:**

1. Go to **https://ottopen.app/opportunities**
2. Click **"Post a Job"** button (top right)
3. Fill out job form:
   - Title, company, location
   - Description, requirements
   - Budget/compensation (this is what writer will receive)
   - Job type, category, experience level
4. Click **"Post Job"** - No payment required! ✅
5. Job appears in public job board
6. Wait for writer applications

**Hiring a Writer:**

1. Go to **"My Jobs"** tab in `/opportunities`
2. Click on your job → see applications
3. Review applicant profiles, proposals, ratings
4. Click **"Hire"** on preferred applicant
5. **Set milestones** (optional):
   ```
   Milestone 1: Outline - $200
   Milestone 2: First Draft - $500
   Milestone 3: Final Draft - $300
   Total: $1000
   ```
6. Or set as **single payment** (no milestones)
7. **Enter payment method** (Stripe Checkout)
8. **Funds held in escrow** ✅

**Releasing Payment:**

1. Writer submits deliverable
2. You receive notification
3. Review work at `/dashboard/contracts/[contractId]`
4. Click **"Approve Milestone"**
5. Payment auto-releases to writer (minus 10% + Stripe fees)
6. Or click **"Request Revision"** for changes

**Leaving a Review:**

1. After job completion
2. Go to `/dashboard/contracts/[contractId]`
3. Click **"Leave Review"**
4. Rate 1-5 stars + detailed feedback
5. Review appears on writer's profile

---

#### For Writers (Applying to Jobs):

**Setup Payouts (One-Time Setup):**

**Access Point**: `/dashboard/payout` (or settings)

1. Go to **https://ottopen.app/dashboard/payout**
2. **Choose payout method**:

   **Option A: Stripe Connect** (Recommended for US, CA, GB, AU, etc.)
   - Click **"Setup Stripe Connect"**
   - Redirects to Stripe onboarding
   - Fill in personal/business details
   - Link bank account
   - Complete verification
   - Redirected back to dashboard
   - Status: "Onboarded ✅"

   **Option B: Global Payout** (For other countries)
   - Click **"Setup Bank Account"**
   - Select country
   - Enter bank details:
     - **US**: Routing number + Account number
     - **Europe**: IBAN
     - **Other**: SWIFT/BIC + Account details
   - Click **"Save Bank Account"**
   - Status: "Bank Account Added ✅"

**Apply to Jobs:**

1. Go to **https://ottopen.app/opportunities**
2. Browse jobs or use filters
3. Click on interesting job
4. Click **"Apply"**
5. Write proposal/cover letter
6. Submit application
7. Wait for client response

**Complete Work:**

1. Client hires you → notification sent
2. Go to `/dashboard/contracts/[contractId]`
3. See milestone details
4. Work on deliverable
5. When done, click **"Submit Milestone"**
6. Upload deliverable (link or file)
7. Add notes/description
8. Click **"Submit for Review"**

**Get Paid:**

1. Client approves milestone
2. Payment auto-released from escrow
3. Funds transferred to your account:
   - **Stripe Connect**: 2-3 business days
   - **Global Payout**: 3-5 business days
4. View transaction in `/dashboard/earnings`
5. Platform keeps 10% + Stripe fees (~3%)

**Your Profile Shows:**

- Total earnings
- Jobs completed (auto-incremented)
- Average rating (auto-calculated from reviews)
- Portfolio URL
- Hourly rate (set in settings)

---

### 3. **Writer Profile & Rates**

#### Access Point: `/settings` or `/profile/edit`

**Set Your Rates:**

1. Go to **https://ottopen.app/settings**
2. Find **"Writer Profile"** section
3. Fill in:
   - **Hourly Rate**: e.g., $50/hour
   - **Writer Bio**: Professional description
   - **Portfolio URL**: Your website
   - **Specialty**: e.g., "Screenwriting, Fiction"
4. Click **"Save Profile"**

**What Gets Displayed:**

- Shows on your public profile
- Appears in job applications
- Clients can see before hiring
- Builds credibility

---

### 4. **Reviews & Ratings**

#### Leaving a Review:

**Access Point**: `/dashboard/contracts/[contractId]`

1. Go to completed contract
2. Click **"Leave Review"** button
3. Fill out review form:
   - **Overall Rating**: 1-5 stars ⭐
   - **Communication**: 1-5 stars
   - **Quality**: 1-5 stars
   - **Professionalism**: 1-5 stars
   - **Timeliness**: 1-5 stars
   - **Review Text**: Detailed feedback
4. Click **"Submit Review"**

**What Happens:**

- Review posted to recipient's profile
- Recipient's rating auto-updates (average of all reviews)
- `users.total_reviews` increments
- Shows on public profile

#### Responding to Reviews:

1. Go to your profile reviews
2. Click **"Respond"** on a review
3. Write response
4. Click **"Post Response"**
5. Response appears below review

---

### 5. **Milestones**

#### Access Point: During job hire OR `/dashboard/contracts/[contractId]`

**Client Creates Milestones:**

1. When hiring writer, click **"Add Milestones"**
2. For each milestone:
   - Title: "First Draft"
   - Description: "Complete outline and first 3 chapters"
   - Amount: $500
3. Add multiple milestones
4. Total must equal job budget
5. Submit → escrow created for full amount

**Writer Submits Milestone:**

1. Go to `/dashboard/contracts/[contractId]`
2. See current milestone
3. Click **"Submit Deliverable"**
4. Add deliverable URL or upload
5. Add notes
6. Submit for approval

**Client Approves/Rejects:**

- **Approve**: Payment released immediately
- **Reject**: Writer must revise
- **Auto-Release**: After 7 days if no action

---

### 6. **Feature Gates & Upgrades**

#### When Feature is Locked:

**What User Sees:**

- **Blurred overlay** on premium content
- **Lock icon** with tier badge
- **"Upgrade to [Tier]"** button
- Description of what's locked

**Example Scenarios:**

**Free Writer tries to submit 6th manuscript:**

```
❌ Submission Limit Reached
"You've reached your submission limit (5/month).
Upgrade to Premium for unlimited submissions."
[Upgrade to Premium] [View All Plans]
```

**Free Industry user tries to access manuscripts:**

```
❌ Manuscript Library Locked
"Upgrade to Industry Basic to access manuscript library"
[Upgrade to Industry Basic] [View Pricing]
```

**How to Upgrade:**

1. Click **"Upgrade"** button
2. Redirected to `/pricing`
3. Choose appropriate tier
4. Complete Stripe Checkout
5. Access granted immediately

---

### 7. **Dashboard Views**

#### Writer Dashboard: `/dashboard`

**Shows:**

- **Active Contracts**: Ongoing jobs
- **Pending Milestones**: Work to submit
- **Earnings**: Total + pending
- **Jobs Completed**: Count
- **Average Rating**: Star rating
- **Recent Reviews**: Latest feedback

**Actions:**

- Submit milestones
- View payments
- Manage payout method

#### Client Dashboard: `/dashboard`

**Shows:**

- **Active Jobs**: Posted jobs
- **Hired Writers**: Current contracts
- **Pending Approvals**: Milestones to review
- **Spending**: Total + pending
- **Recent Hires**: Activity

**Actions:**

- Approve milestones
- Leave reviews
- Post new jobs

---

### 8. **Disputes (If Issues Arise)**

#### Access Point: `/dashboard/contracts/[contractId]`

**Raise a Dispute:**

1. Go to contract page
2. Click **"Raise Dispute"**
3. Select reason:
   - Quality issues
   - Late delivery
   - Scope disagreement
   - Other
4. Upload evidence (screenshots, files)
5. Describe issue
6. Submit

**What Happens:**

- Platform admin notified
- Payment held (not released)
- Both parties can add comments
- Admin reviews and resolves
- Decision is final

---

## 🔐 Security & Privacy

### Payment Security:

- ✅ Funds held in Stripe escrow
- ✅ No direct transfers between users
- ✅ Bank details tokenized (never stored raw)
- ✅ PCI-DSS compliant

### Data Privacy:

- ✅ Row Level Security (RLS) enabled
- ✅ Users only see their own contracts
- ✅ Reviews are public
- ✅ Bank details encrypted

---

## 📱 Mobile Access

All features work on mobile:

- Responsive pricing page
- Mobile-friendly job posting
- Stripe mobile checkout
- Dashboard optimized for mobile

---

## 🌍 International Support

### Supported Countries:

**Stripe Connect** (40+ countries):

- United States, Canada, United Kingdom, Australia
- All EU countries
- Singapore, Hong Kong, Japan, India
- [Full list in implementation doc]

**Global Payouts** (150+ countries):

- All other countries
- Bank transfer support
- 135+ currencies

---

## 🚀 Quick Start Checklist

### For Writers:

- [ ] Sign up at `/auth/signup`
- [ ] Setup payout method at `/dashboard/payout`
- [ ] Set hourly rate in `/settings`
- [ ] Browse jobs at `/opportunities`
- [ ] Apply to jobs
- [ ] Complete work & get paid

### For Clients:

- [ ] Sign up at `/auth/signup`
- [ ] Post job at `/opportunities` (free!)
- [ ] Review applications
- [ ] Hire writer (escrow payment)
- [ ] Approve milestones
- [ ] Leave review

### For Industry (Publishers/Producers/Agents):

- [ ] Sign up with industry account type
- [ ] Subscribe to plan at `/pricing`
- [ ] Access manuscript library
- [ ] Discover writers
- [ ] Manage submissions

---

## 📞 Support

### Common Issues:

**"Payment not releasing"**

- Check milestone status is "approved"
- Verify writer has payout setup
- Check transaction log

**"Can't access feature"**

- Check account tier
- Click upgrade prompt
- Subscribe to required tier

**"Payout not received"**

- Stripe Connect: 2-3 days
- Global Payout: 3-5 days
- Check bank details are correct

---

## 🎉 Summary

### Everything is Live & Working:

✅ **Stripe**: Webhook active, products configured, env vars set
✅ **Supabase**: All tables created, RLS enabled, migrations applied
✅ **Features**: All marketplace features deployed
✅ **Pricing**: Live at `/pricing`
✅ **Jobs**: Free posting at `/opportunities`
✅ **Payments**: Escrow + global payouts working
✅ **Reviews**: Rating system active
✅ **Security**: RLS policies enforced

**Users can access everything NOW!** 🚀

The system is production-ready and fully functional.
