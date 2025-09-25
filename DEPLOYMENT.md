# Ottopen Deployment Guide

## Production Environment Setup

The app is now production-ready with full Supabase integration!

### Environment Variables Required for Production:

```bash
# Supabase Configuration (Already configured)
NEXT_PUBLIC_SUPABASE_URL=https://wkvatudgffosjfwqyxgt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrdmF0dWRnZmZvc2pmd3F5eGd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1OTIwNzYsImV4cCI6MjA3NDE2ODA3Nn0.d2KK6lraqrJ519T1ek3tDimJxP7lmNsdUib7l4Dyugs

# Application Configuration
NEXT_PUBLIC_APP_URL=https://ottopen.app
NODE_ENV=production

# Security (Update with strong production values)
NEXTAUTH_SECRET=ottopen-production-secret-key-change-me
NEXTAUTH_URL=https://ottopen.app
```

## Database Schema Applied

✅ **Complete Production Database Setup:**

- Users with account types (writer, agent, producer, etc.)
- Posts, comments, likes, follows
- Conversations and messaging system
- Manuscripts and submissions
- Agency agreements
- Job board with applications
- Referral system with credits and milestones
- Row Level Security (RLS) enabled on all tables
- Comprehensive security policies

## Features Enabled for Production:

### User Registration & Authentication

- ✅ Complete signup flow with professional account types
- ✅ Account type selection (Writer, Literary Agent, Producer, Publisher, Theater Director, Reader/Evaluator)
- ✅ Professional fields collection (Company name, credentials, license numbers)
- ✅ Secure password handling with verification
- ✅ Email verification system

### Literary Agency Platform

- ✅ Manuscript submission system
- ✅ Agent-writer relationships
- ✅ Submission tracking and feedback
- ✅ Agency agreement management

### Job Board

- ✅ Job posting and application system
- ✅ Saved jobs functionality
- ✅ Application status tracking

### Referral System

- ✅ Referral code generation
- ✅ Credit system (days/dollars)
- ✅ Milestone achievements

## Deployment Instructions:

### For Vercel (Recommended):

1. Connect your GitHub repo to Vercel
2. Add all environment variables from `.env.production` to Vercel dashboard
3. Deploy!

### For other platforms:

1. Set the environment variables in your hosting platform
2. Ensure Node.js 18+ is available
3. Run `npm run build` and `npm start`

## Database Security:

- All tables have Row Level Security enabled
- Users can only access their own data
- Agents have appropriate access to submitted manuscripts
- Job posters can manage their job applications
- Secure messaging between users

## Ready for Production:

- ✅ Zero TypeScript errors
- ✅ All tests passing
- ✅ Production build successful
- ✅ Database schema complete
- ✅ Security policies implemented
- ✅ Authentication fully functional

The app is ready for users to sign up on ottopen.app!
