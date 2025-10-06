# Analytics & Reporting System

**Implementation Date:** 2025-02-06
**Status:** ✅ Complete

## Overview

Comprehensive analytics and reporting system for tracking user activity, script performance, platform metrics, and revenue analytics.

---

## 📊 Features Implemented

### 1. User Analytics

- **Activity Tracking**: Login, logout, script creation, post creation, etc.
- **Session Analytics**: Duration, pages viewed, actions taken
- **Engagement Metrics**: Total sessions, retention score, engagement level
- **Feature Usage**: Track which features users engage with most
- **Activity Trends**: Daily activity patterns and breakdown by type

### 2. Script Performance Analytics

- **View Tracking**: Track views with duration, percentage read, source
- **Engagement Metrics**: Views, likes, comments, shares
- **Collaboration Metrics**: Collaborator count, edits, internal comments
- **Top Viewers**: See who's viewing your scripts most (owner only)
- **Trending Scores**: Time-weighted engagement scoring

### 3. Engagement Metrics (Admin)

- **Daily Active Users (DAU)**: New users, returning users, churned users
- **Funnel Analytics**: Conversion tracking across onboarding, script creation, subscription
- **Retention Cohorts**: Month-over-month retention analysis
- **Feature Adoption**: Track which features are most/least used

### 4. Revenue Analytics

- **Writer Earnings**: Commission, referral, bonus earnings breakdown
- **Payment History**: Track all payments and transactions
- **Conversion Analytics**: Views to sales conversion rates
- **Platform Revenue (Admin)**: Total revenue, MRR, ARR, subscription metrics

### 5. Platform-Wide Statistics (Admin)

- **Platform Metrics**: Total users, active users, content created
- **Content Metrics**: Views, likes, comments, shares, engagement rates
- **Acquisition Metrics**: Signups by source/medium, ROI tracking, campaign performance

---

## 🗄️ Database Schema

### User Analytics Tables

- `user_activity_log` - Raw activity events
- `user_sessions` - Session tracking with device/location
- `user_engagement_metrics` - Aggregated user engagement data
- `feature_usage` - Feature usage tracking

### Script Analytics Tables

- `script_views` - Script view tracking
- `script_engagement_metrics` - Aggregated script metrics
- `script_collaboration_metrics` - Collaboration statistics

### Platform Metrics Tables

- `daily_active_users` - DAU tracking
- `funnel_events` - Funnel conversion tracking
- `retention_cohorts` - Cohort retention analysis
- `platform_metrics` - Platform-wide daily metrics
- `content_metrics` - Content engagement metrics
- `acquisition_metrics` - User acquisition tracking

### Revenue Tables

- `revenue_analytics` - Platform revenue tracking
- `writer_earnings_analytics` - Writer earnings by day
- `payment_history` - All payment transactions

---

## 🔌 API Endpoints

### User Analytics

```
GET  /api/analytics/user?userId={id}&days={n}
POST /api/analytics/user
```

- Get user analytics (own or admin)
- Track user activity

### Script Analytics

```
GET  /api/analytics/script/[scriptId]?days={n}
POST /api/analytics/script/[scriptId]
```

- Get script performance metrics
- Track script views

### Engagement Metrics (Admin)

```
GET  /api/analytics/engagement?days={n}&type={dau|funnel|retention|feature|all}
POST /api/analytics/engagement
```

- Get platform engagement metrics
- Track funnel events

### Revenue Analytics

```
GET /api/analytics/revenue?userId={id}&days={n}&type={writer|platform}
POST /api/analytics/revenue
```

- Get writer/platform revenue analytics
- Track payments

### Platform Analytics (Admin)

```
GET  /api/analytics/platform?days={n}&type={platform|content|acquisition|all}
POST /api/analytics/platform
```

- Get platform-wide statistics
- Track acquisition metrics

---

## 🎨 Dashboard UIs

### 1. User Analytics Dashboard (`/analytics`)

- **Summary Cards**: Sessions, time spent, actions, engagement level
- **Charts**:
  - Daily activity trend (line chart)
  - Activity by type (pie chart + bar chart)
  - Top features used (list)
- **Recent Activity**: Activity log with timestamps

### 2. Revenue Analytics Dashboard (`/analytics/revenue`)

- **Summary Cards**: Total earnings, scripts sold, conversion rate, avg price
- **Charts**:
  - Daily earnings trend (line chart)
  - Scripts sold (bar chart)
  - Earnings breakdown (pie chart)
  - Views vs sales (dual-axis line chart)
  - Conversion rate trend (line chart)
- **Payment History**: Table of recent payments

### 3. Admin Analytics Dashboard (`/admin/analytics`)

- **Platform Metrics Tab**:
  - User growth, active users, retention
  - Daily signups, content creation
- **Content Metrics Tab**:
  - Views, engagement rates
  - Trending scripts, viral posts
- **Acquisition Metrics Tab**:
  - Signups by source/medium (pie chart)
  - ROI by source (bar chart)
  - Top campaigns table

---

## 🔒 Security & RLS Policies

All analytics tables have Row Level Security enabled:

- **User Data**: Users can only view their own analytics
- **Script Data**: Owners can view their script analytics
- **Writer Earnings**: Writers can only view their own earnings
- **Platform Metrics**: Admin-only access
- **Admin Override**: Admins can view all analytics

---

## 📈 Key Metrics & Calculations

### Engagement Level

```sql
power_user: sessions >= 100 AND avg_duration >= 1800 AND actions >= 500
high:       sessions >= 50  AND avg_duration >= 900  AND actions >= 200
medium:     sessions >= 20  AND avg_duration >= 300  AND actions >= 50
low:        otherwise
```

### Trending Score

```sql
trending_score = (
  (views * 0.3) +
  (likes * 2.0) +
  (comments * 3.0) +
  (shares * 5.0)
) * (1.0 / (days_since_update + 1))
```

### Conversion Rate

```sql
conversion_rate = (total_sales / total_views) * 100
```

### ROI

```sql
roi = ((revenue - cost) / cost) * 100
```

---

## 🚀 Usage Examples

### Track User Activity

```javascript
await fetch('/api/analytics/user', {
  method: 'POST',
  body: JSON.stringify({
    activityType: 'script_create',
    entityType: 'script',
    entityId: scriptId,
    metadata: { title: 'My Script' },
  }),
})
```

### Track Script View

```javascript
await fetch(`/api/analytics/script/${scriptId}`, {
  method: 'POST',
  body: JSON.stringify({
    viewDuration: 180,
    percentageRead: 75,
    source: 'feed',
    referrer: document.referrer,
  }),
})
```

### Get User Analytics

```javascript
const response = await fetch('/api/analytics/user?days=30')
const data = await response.json()
// Returns: engagement, recentStats, activityByType, dailyActivity, topFeatures
```

### Get Script Performance

```javascript
const response = await fetch(`/api/analytics/script/${scriptId}?days=30`)
const data = await response.json()
// Returns: engagement, collaboration, recentStats, viewsBySource, topViewers
```

---

## 📝 Implementation Notes

### TypeScript Type Safety

- All API routes have proper TypeScript types
- Fixed `Object is possibly 'undefined'` errors with null-safe operators
- Explicit type annotations for complex objects

### Performance Considerations

- Pre-computed metrics in aggregated tables
- Indexes on frequently queried columns
- Limit on result sets to prevent large payloads
- Time-range filtering to reduce query scope

### Chart Library

- Uses Recharts for all data visualizations
- Responsive containers for mobile support
- Consistent color schemes across dashboards

---

## ✅ Build Status

**Build Result:** ✅ SUCCESS

All TypeScript errors resolved:

- Fixed division by zero issues with null checks
- Added explicit type annotations
- Proper null-safe operators for optional chaining

**Warnings (Non-blocking):**

- ESLint warnings about `<img>` vs `<Image>` (performance suggestions)
- Third-party dependency warnings from Prisma/Sentry (safe to ignore)
- Dynamic server usage in API routes (expected for authenticated endpoints)

---

## 🎯 Next Steps

1. **Data Collection**: Start tracking user activity and script views
2. **Aggregation Jobs**: Set up cron jobs to compute daily metrics
3. **Retention Calculations**: Calculate monthly cohort retention
4. **Revenue Integration**: Connect Stripe webhooks to payment_history table
5. **Admin Tooling**: Build admin UI for viewing platform-wide trends

---

**Implementation Complete!** 🎉
