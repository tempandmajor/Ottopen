-- Update Writer Pricing Metrics
-- Replace hourly_rate with industry-standard ghostwriter pricing metrics

-- Remove hourly_rate, add comprehensive pricing options
ALTER TABLE users DROP COLUMN IF EXISTS hourly_rate;

-- Add ghostwriter pricing columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS pricing_model TEXT CHECK (pricing_model IN ('per_word', 'per_page', 'per_project', 'hourly'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS rate_per_word DECIMAL(10,4); -- e.g., 0.15 to 2.50
ALTER TABLE users ADD COLUMN IF NOT EXISTS rate_per_page DECIMAL(10,2); -- e.g., 100 to 300
ALTER TABLE users ADD COLUMN IF NOT EXISTS rate_hourly DECIMAL(10,2); -- e.g., 49 to 200
ALTER TABLE users ADD COLUMN IF NOT EXISTS project_rate_min DECIMAL(10,2); -- e.g., 6000
ALTER TABLE users ADD COLUMN IF NOT EXISTS project_rate_max DECIMAL(10,2); -- e.g., 60000

-- Add experience level and specialization
ALTER TABLE users ADD COLUMN IF NOT EXISTS experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'professional', 'expert'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS specializations TEXT[]; -- e.g., {'fiction', 'business', 'memoir', 'technical'}
ALTER TABLE users ADD COLUMN IF NOT EXISTS turnaround_time_days INTEGER; -- Average project completion time
ALTER TABLE users ADD COLUMN IF NOT EXISTS minimum_project_budget DECIMAL(10,2); -- Minimum project they'll accept

-- Update jobs table to support pricing models
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS pricing_model TEXT CHECK (pricing_model IN ('per_word', 'per_page', 'per_project', 'hourly', 'milestone'));
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS estimated_word_count INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS estimated_page_count INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS estimated_hours DECIMAL(10,2);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS rate_offered_per_word DECIMAL(10,4);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS rate_offered_per_page DECIMAL(10,2);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS rate_offered_hourly DECIMAL(10,2);

-- Add pricing guidelines reference table
CREATE TABLE IF NOT EXISTS pricing_guidelines (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  experience_level TEXT NOT NULL,
  pricing_model TEXT NOT NULL,
  min_rate DECIMAL(10,4) NOT NULL,
  max_rate DECIMAL(10,4) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(experience_level, pricing_model)
);

-- Insert industry standard pricing guidelines
INSERT INTO pricing_guidelines (experience_level, pricing_model, min_rate, max_rate, description) VALUES
  -- Per Word Rates
  ('beginner', 'per_word', 0.10, 0.25, 'Entry-level ghostwriters, $6,000-$15,000 per book'),
  ('intermediate', 'per_word', 0.25, 0.50, 'Mid-range ghostwriters, $15,000-$30,000 per book'),
  ('professional', 'per_word', 0.50, 1.00, 'Professional ghostwriters, $30,000-$60,000 per book'),
  ('expert', 'per_word', 1.00, 2.50, 'Top-tier ghostwriters, $60,000-$150,000 per book'),

  -- Per Page Rates
  ('beginner', 'per_page', 50, 100, 'Entry-level ghostwriters'),
  ('intermediate', 'per_page', 100, 150, 'Mid-range ghostwriters'),
  ('professional', 'per_page', 150, 250, 'Professional ghostwriters'),
  ('expert', 'per_page', 250, 300, 'Top-tier ghostwriters'),

  -- Hourly Rates
  ('beginner', 'hourly', 25, 49, 'Entry-level ghostwriters'),
  ('intermediate', 'hourly', 49, 84, 'Mid-range ghostwriters'),
  ('professional', 'hourly', 84, 150, 'Professional ghostwriters'),
  ('expert', 'hourly', 150, 200, 'Top-tier ghostwriters'),

  -- Per Project Rates (full-length book 50k-70k words)
  ('beginner', 'per_project', 6000, 15000, 'Entry-level book projects'),
  ('intermediate', 'per_project', 15000, 30000, 'Mid-range book projects'),
  ('professional', 'per_project', 30000, 60000, 'Professional book projects'),
  ('expert', 'per_project', 60000, 150000, 'Premium/specialized book projects')
ON CONFLICT (experience_level, pricing_model) DO NOTHING;

-- Create index for pricing lookups
CREATE INDEX IF NOT EXISTS idx_users_pricing_model ON users(pricing_model) WHERE pricing_model IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_experience_level ON users(experience_level) WHERE experience_level IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_rate_per_word ON users(rate_per_word) WHERE rate_per_word IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_pricing_model ON jobs(pricing_model) WHERE pricing_model IS NOT NULL;

-- Add helpful comments
COMMENT ON COLUMN users.pricing_model IS 'Primary pricing model: per_word (industry standard), per_page, per_project, or hourly';
COMMENT ON COLUMN users.rate_per_word IS 'Rate per word in USD ($0.10 - $2.50 typical range)';
COMMENT ON COLUMN users.rate_per_page IS 'Rate per page in USD ($50 - $300 typical range)';
COMMENT ON COLUMN users.rate_hourly IS 'Hourly rate in USD ($25 - $200 typical range)';
COMMENT ON COLUMN users.project_rate_min IS 'Minimum project rate for full books';
COMMENT ON COLUMN users.project_rate_max IS 'Maximum project rate for full books';
COMMENT ON COLUMN users.experience_level IS 'Writer experience level (affects rate recommendations)';
COMMENT ON COLUMN users.specializations IS 'Writing specializations (fiction, business, memoir, technical, etc.)';
