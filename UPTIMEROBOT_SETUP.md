# UptimeRobot Setup Guide

**Your Dashboard**: https://stats.uptimerobot.com/yYUokH8Z6O

## Monitors to Create

### 1. Homepage Monitor

- **Monitor Type**: HTTP(s)
- **Friendly Name**: Ottopen - Homepage
- **URL**: https://your-production-domain.com/
- **Monitoring Interval**: 5 minutes
- **Monitor Timeout**: 30 seconds
- **Expected Status Code**: 200

### 2. API Health Check Monitor

- **Monitor Type**: HTTP(s)
- **Friendly Name**: Ottopen - API Health
- **URL**: https://your-production-domain.com/api/health
- **Monitoring Interval**: 5 minutes
- **Monitor Timeout**: 30 seconds
- **Expected Status Code**: 200
- **Keyword**: "healthy" (check response contains this word)

### 3. Authentication Endpoint Monitor

- **Monitor Type**: HTTP(s)
- **Friendly Name**: Ottopen - Auth API
- **URL**: https://your-production-domain.com/api/auth/status
- **Monitoring Interval**: 5 minutes
- **Monitor Timeout**: 30 seconds

### 4. Subscription API Monitor

- **Monitor Type**: HTTP(s)
- **Friendly Name**: Ottopen - Subscription API
- **URL**: https://your-production-domain.com/api/subscription-status
- **Monitoring Interval**: 10 minutes
- **Monitor Timeout**: 30 seconds

### 5. Stripe Webhook Monitor (Optional)

- **Monitor Type**: HTTP(s)
- **Friendly Name**: Ottopen - Stripe Webhooks
- **URL**: https://your-production-domain.com/api/webhooks/stripe
- **Monitoring Interval**: 15 minutes
- **Monitor Timeout**: 30 seconds

## Alert Contacts Setup

### Email Alerts

1. Go to "My Settings" → "Alert Contacts"
2. Add your email address
3. Enable for all monitors

### SMS Alerts (Optional - Paid Feature)

1. Add phone number if you want SMS alerts
2. Configure for critical monitors only (Homepage, Health Check)

## Alert Settings

For each monitor, configure:

### Downtime Alerts

- **Alert when**: Down
- **Alert after**: 2 times (10 minutes total for 5-min interval)
- **Re-alert if still down**: Every 30 minutes

### Up Again Alerts

- **Send notification when**: Monitor is up again
- **Alert after**: 1 time

## Recommended Thresholds

### Response Time Alerts

In UptimeRobot Pro (if you upgrade):

- **Warning**: Response time > 2 seconds
- **Critical**: Response time > 5 seconds

## Free Tier Limits

UptimeRobot Free includes:

- ✅ 50 monitors
- ✅ 5-minute check intervals
- ✅ 2 months of logs
- ✅ Email alerts
- ✅ Public status pages

This is more than enough for production monitoring!

## Public Status Page

Create a public status page:

1. Go to "Add New Public Status Page"
2. Select monitors to display
3. Customize with your branding
4. Get public URL to share with users

Example: `https://stats.uptimerobot.com/yYUokH8Z6O`

## Setup Checklist

After deploying to production:

- [ ] Add Homepage monitor
- [ ] Add Health Check monitor (/api/health)
- [ ] Add Auth API monitor
- [ ] Add Subscription API monitor
- [ ] Configure email alerts
- [ ] Test alerts by pausing a monitor
- [ ] Create public status page
- [ ] Add status page link to your footer

## Integration with Your App

You can display uptime on your site:

```typescript
// components/status-badge.tsx
export async function StatusBadge() {
  const response = await fetch('/api/health')
  const data = await response.json()

  return (
    <div className={`status-badge ${data.status}`}>
      {data.status === 'healthy' ? '🟢' : '🟡'}
      {data.status}
    </div>
  )
}
```

## What to Monitor

✅ **Currently monitoring**:

- Application uptime
- API health
- Database connectivity
- Redis connectivity
- Environment configuration

🔄 **Future additions**:

- Third-party API status (Stripe, OpenAI)
- Specific page performance
- Scheduled job execution

---

**Next Steps**: After deployment, come back and set up these monitors with your production URL!
