-- =============================================
-- Analytics & Reporting System
-- =============================================
-- Features: User analytics, script performance, engagement metrics, revenue tracking
-- Created: 2025-02-06

-- =============================================
-- 1. USER ANALYTICS
-- =============================================

-- User activity tracking
CREATE TABLE IF NOT EXISTS user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL, -- 'login', 'logout', 'script_create', 'script_edit', 'post_create', etc.
  entity_type VARCHAR(50), -- 'script', 'post', 'message', etc.
  entity_id UUID,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_activity_log_user_id ON user_activity_log(user_id);
CREATE INDEX idx_user_activity_log_created_at ON user_activity_log(created_at DESC);
CREATE INDEX idx_user_activity_log_activity_type ON user_activity_log(activity_type);

-- Session tracking
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_end TIMESTAMPTZ,
  duration_seconds INTEGER,
  pages_viewed INTEGER DEFAULT 0,
  actions_taken INTEGER DEFAULT 0,
  device_type VARCHAR(50),
  browser VARCHAR(100),
  os VARCHAR(100),
  country VARCHAR(100),
  city VARCHAR(100)
);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_session_start ON user_sessions(session_start DESC);

-- User engagement metrics (aggregated)
CREATE TABLE IF NOT EXISTS user_engagement_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  total_sessions INTEGER DEFAULT 0,
  total_time_seconds INTEGER DEFAULT 0,
  avg_session_duration_seconds INTEGER DEFAULT 0,
  total_actions INTEGER DEFAULT 0,
  scripts_created INTEGER DEFAULT 0,
  scripts_edited INTEGER DEFAULT 0,
  posts_created INTEGER DEFAULT 0,
  comments_made INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  last_active_at TIMESTAMPTZ,
  retention_score DECIMAL(5,2) DEFAULT 0, -- 0-100 score
  engagement_level VARCHAR(20) DEFAULT 'low', -- 'low', 'medium', 'high', 'power_user'
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_engagement_metrics_user_id ON user_engagement_metrics(user_id);
CREATE INDEX idx_user_engagement_metrics_engagement_level ON user_engagement_metrics(engagement_level);

-- =============================================
-- 2. SCRIPT PERFORMANCE ANALYTICS
-- =============================================

-- Script views tracking
CREATE TABLE IF NOT EXISTS script_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID NOT NULL REFERENCES manuscripts(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  view_duration_seconds INTEGER,
  percentage_read INTEGER, -- 0-100
  source VARCHAR(100), -- 'feed', 'profile', 'search', 'direct', etc.
  referrer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_script_views_script_id ON script_views(script_id);
CREATE INDEX idx_script_views_viewer_id ON script_views(viewer_id);
CREATE INDEX idx_script_views_created_at ON script_views(created_at DESC);

-- Script engagement metrics
CREATE TABLE IF NOT EXISTS script_engagement_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID NOT NULL REFERENCES manuscripts(id) ON DELETE CASCADE UNIQUE,
  total_views INTEGER DEFAULT 0,
  unique_viewers INTEGER DEFAULT 0,
  avg_view_duration_seconds INTEGER DEFAULT 0,
  avg_percentage_read DECIMAL(5,2) DEFAULT 0,
  total_likes INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,
  total_collaborators INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0, -- (likes + comments + shares) / views * 100
  virality_score DECIMAL(5,2) DEFAULT 0, -- Custom score based on shares and growth
  trending_score DECIMAL(5,2) DEFAULT 0, -- Time-weighted engagement score
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_script_engagement_metrics_script_id ON script_engagement_metrics(script_id);
CREATE INDEX idx_script_engagement_metrics_trending_score ON script_engagement_metrics(trending_score DESC);

-- Script collaboration metrics
CREATE TABLE IF NOT EXISTS script_collaboration_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID NOT NULL REFERENCES manuscripts(id) ON DELETE CASCADE UNIQUE,
  total_collaborators INTEGER DEFAULT 0,
  total_edits INTEGER DEFAULT 0,
  total_comments_internal INTEGER DEFAULT 0,
  avg_response_time_hours DECIMAL(10,2),
  most_active_collaborator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  collaboration_health_score DECIMAL(5,2) DEFAULT 0, -- 0-100
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_script_collaboration_metrics_script_id ON script_collaboration_metrics(script_id);

-- =============================================
-- 3. ENGAGEMENT METRICS
-- =============================================

-- Daily active users (DAU)
CREATE TABLE IF NOT EXISTS daily_active_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  total_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  returning_users INTEGER DEFAULT 0,
  churned_users INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_daily_active_users_date ON daily_active_users(date DESC);

-- Funnel analytics
CREATE TABLE IF NOT EXISTS funnel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  funnel_name VARCHAR(100) NOT NULL, -- 'onboarding', 'script_creation', 'subscription', etc.
  step_name VARCHAR(100) NOT NULL,
  step_order INTEGER NOT NULL,
  completed BOOLEAN DEFAULT false,
  time_spent_seconds INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_funnel_events_funnel_name ON funnel_events(funnel_name);
CREATE INDEX idx_funnel_events_user_id ON funnel_events(user_id);

-- Retention cohorts
CREATE TABLE IF NOT EXISTS retention_cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_month DATE NOT NULL, -- First day of month when users signed up
  total_users INTEGER DEFAULT 0,
  month_1_retained INTEGER DEFAULT 0,
  month_2_retained INTEGER DEFAULT 0,
  month_3_retained INTEGER DEFAULT 0,
  month_6_retained INTEGER DEFAULT 0,
  month_12_retained INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cohort_month)
);

CREATE INDEX idx_retention_cohorts_cohort_month ON retention_cohorts(cohort_month DESC);

-- Feature usage tracking
CREATE TABLE IF NOT EXISTS feature_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  usage_count INTEGER DEFAULT 1,
  first_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(feature_name, user_id)
);

CREATE INDEX idx_feature_usage_feature_name ON feature_usage(feature_name);
CREATE INDEX idx_feature_usage_user_id ON feature_usage(user_id);

-- =============================================
-- 4. REVENUE ANALYTICS
-- =============================================

-- Revenue tracking (aggregated from Stripe)
CREATE TABLE IF NOT EXISTS revenue_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  total_revenue_cents INTEGER DEFAULT 0,
  subscription_revenue_cents INTEGER DEFAULT 0,
  one_time_payment_revenue_cents INTEGER DEFAULT 0,
  refunds_cents INTEGER DEFAULT 0,
  net_revenue_cents INTEGER DEFAULT 0,
  new_subscriptions INTEGER DEFAULT 0,
  cancelled_subscriptions INTEGER DEFAULT 0,
  active_subscriptions INTEGER DEFAULT 0,
  mrr_cents INTEGER DEFAULT 0, -- Monthly Recurring Revenue
  arr_cents INTEGER DEFAULT 0, -- Annual Recurring Revenue
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_revenue_analytics_date ON revenue_analytics(date DESC);

-- Writer earnings tracking
CREATE TABLE IF NOT EXISTS writer_earnings_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  writer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_earnings_cents INTEGER DEFAULT 0,
  commission_earnings_cents INTEGER DEFAULT 0,
  referral_earnings_cents INTEGER DEFAULT 0,
  bonus_earnings_cents INTEGER DEFAULT 0,
  scripts_sold INTEGER DEFAULT 0,
  avg_script_price_cents INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0, -- (sales / views) * 100
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(writer_id, date)
);

CREATE INDEX idx_writer_earnings_analytics_writer_id ON writer_earnings_analytics(writer_id);
CREATE INDEX idx_writer_earnings_analytics_date ON writer_earnings_analytics(date DESC);

-- Payment history analytics
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payment_type VARCHAR(50) NOT NULL, -- 'subscription', 'one_time', 'refund', 'payout', etc.
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  stripe_payment_id VARCHAR(255),
  status VARCHAR(50) NOT NULL, -- 'succeeded', 'failed', 'pending', 'refunded'
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX idx_payment_history_created_at ON payment_history(created_at DESC);
CREATE INDEX idx_payment_history_status ON payment_history(status);

-- =============================================
-- 5. PLATFORM-WIDE STATISTICS
-- =============================================

-- Platform metrics (admin dashboard)
CREATE TABLE IF NOT EXISTS platform_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  total_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  new_signups INTEGER DEFAULT 0,
  total_scripts INTEGER DEFAULT 0,
  scripts_created_today INTEGER DEFAULT 0,
  total_posts INTEGER DEFAULT 0,
  posts_created_today INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  messages_sent_today INTEGER DEFAULT 0,
  total_revenue_cents INTEGER DEFAULT 0,
  avg_session_duration_seconds INTEGER DEFAULT 0,
  bounce_rate DECIMAL(5,2) DEFAULT 0,
  user_retention_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_platform_metrics_date ON platform_metrics(date DESC);

-- Content metrics
CREATE TABLE IF NOT EXISTS content_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  total_views INTEGER DEFAULT 0,
  total_likes INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,
  avg_engagement_rate DECIMAL(5,2) DEFAULT 0,
  trending_scripts INTEGER DEFAULT 0,
  viral_posts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_content_metrics_date ON content_metrics(date DESC);

-- User acquisition metrics
CREATE TABLE IF NOT EXISTS acquisition_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  source VARCHAR(100) NOT NULL, -- 'organic', 'referral', 'social', 'paid', etc.
  medium VARCHAR(100), -- 'cpc', 'email', 'social', etc.
  campaign VARCHAR(255),
  signups INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  cost_cents INTEGER DEFAULT 0,
  revenue_cents INTEGER DEFAULT 0,
  roi DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(date, source, medium, campaign)
);

CREATE INDEX idx_acquisition_metrics_date ON acquisition_metrics(date DESC);
CREATE INDEX idx_acquisition_metrics_source ON acquisition_metrics(source);

-- =============================================
-- 6. RLS POLICIES
-- =============================================

ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_engagement_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_engagement_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_collaboration_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_active_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE retention_cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE writer_earnings_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE acquisition_metrics ENABLE ROW LEVEL SECURITY;

-- User can view their own activity
CREATE POLICY "Users can view their own activity"
  ON user_activity_log FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can view their own sessions"
  ON user_sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can view their own engagement metrics"
  ON user_engagement_metrics FOR SELECT
  USING (user_id = auth.uid());

-- Script views - owner can see who viewed
CREATE POLICY "Script owners can view their script views"
  ON script_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM manuscripts
      WHERE id = script_views.script_id
      AND user_id = auth.uid()
    )
  );

-- Script metrics - owner can see
CREATE POLICY "Script owners can view their metrics"
  ON script_engagement_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM manuscripts
      WHERE id = script_engagement_metrics.script_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Script owners can view collaboration metrics"
  ON script_collaboration_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM manuscripts
      WHERE id = script_collaboration_metrics.script_id
      AND user_id = auth.uid()
    )
  );

-- Writers can view their earnings
CREATE POLICY "Writers can view their own earnings"
  ON writer_earnings_analytics FOR SELECT
  USING (writer_id = auth.uid());

CREATE POLICY "Users can view their payment history"
  ON payment_history FOR SELECT
  USING (user_id = auth.uid());

-- Admin only for platform metrics
CREATE POLICY "Admins can view platform metrics"
  ON platform_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can view content metrics"
  ON content_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can view acquisition metrics"
  ON acquisition_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can view revenue analytics"
  ON revenue_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- =============================================
-- 7. HELPER FUNCTIONS
-- =============================================

-- Calculate engagement level based on metrics
CREATE OR REPLACE FUNCTION calculate_engagement_level(
  total_sessions_param INTEGER,
  avg_session_duration_param INTEGER,
  total_actions_param INTEGER
)
RETURNS VARCHAR AS $$
BEGIN
  IF total_sessions_param >= 100 AND avg_session_duration_param >= 1800 AND total_actions_param >= 500 THEN
    RETURN 'power_user';
  ELSIF total_sessions_param >= 50 AND avg_session_duration_param >= 900 AND total_actions_param >= 200 THEN
    RETURN 'high';
  ELSIF total_sessions_param >= 20 AND avg_session_duration_param >= 300 AND total_actions_param >= 50 THEN
    RETURN 'medium';
  ELSE
    RETURN 'low';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Update script trending score
CREATE OR REPLACE FUNCTION update_script_trending_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Simple trending algorithm: recent engagement weighted more heavily
  NEW.trending_score := (
    (NEW.total_views * 0.3) +
    (NEW.total_likes * 2.0) +
    (NEW.total_comments * 3.0) +
    (NEW.total_shares * 5.0)
  ) * (1.0 / (EXTRACT(EPOCH FROM (NOW() - NEW.updated_at)) / 86400.0 + 1.0));

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_script_trending_score ON script_engagement_metrics;
CREATE TRIGGER trigger_update_script_trending_score
  BEFORE UPDATE ON script_engagement_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_script_trending_score();

-- =============================================
-- MIGRATION COMPLETE
-- =============================================

COMMENT ON TABLE user_activity_log IS 'Analytics: User activity tracking';
COMMENT ON TABLE script_views IS 'Analytics: Script view tracking';
COMMENT ON TABLE script_engagement_metrics IS 'Analytics: Script performance metrics';
COMMENT ON TABLE revenue_analytics IS 'Analytics: Revenue and financial metrics';
COMMENT ON TABLE platform_metrics IS 'Analytics: Platform-wide statistics';
