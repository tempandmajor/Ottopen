-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_type_enum') THEN
        CREATE TYPE account_type_enum AS ENUM ('writer', 'platform_agent', 'external_agent', 'producer', 'publisher', 'theater_director', 'reader_evaluator');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_tier_enum') THEN
        CREATE TYPE account_tier_enum AS ENUM ('free', 'premium', 'pro', 'industry_basic', 'industry_premium');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status_enum') THEN
        CREATE TYPE verification_status_enum AS ENUM ('pending', 'verified', 'rejected');
    END IF;
END $$;

-- Create users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  bio TEXT DEFAULT '',
  specialty TEXT DEFAULT '',
  avatar_url TEXT,
  stripe_customer_id TEXT UNIQUE,
  account_type account_type_enum DEFAULT 'writer' NOT NULL,
  account_tier account_tier_enum DEFAULT 'free' NOT NULL,
  verification_status verification_status_enum DEFAULT 'pending' NOT NULL,
  industry_credentials TEXT,
  company_name TEXT,
  license_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create posts table
CREATE TABLE posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create comments table
CREATE TABLE comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create likes table
CREATE TABLE likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(post_id, user_id)
);

-- Create follows table
CREATE TABLE follows (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(follower_id, following_id)
);

-- Create conversations table for organizing messages
CREATE TABLE conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user1_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  user2_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  last_message_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user1_id, user2_id)
);

-- Create messages table for direct messaging
CREATE TABLE messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add foreign key constraint for last_message_id after messages table is created
ALTER TABLE conversations ADD CONSTRAINT fk_conversations_last_message
  FOREIGN KEY (last_message_id) REFERENCES messages(id) ON DELETE SET NULL;

-- Create notifications table
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'like', 'comment', 'follow', 'message'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  related_id UUID, -- ID of the related post, comment, user, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
-- Existing social media indexes
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_published ON posts(published);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);

-- Message and conversation indexes
CREATE INDEX idx_conversations_user1_id ON conversations(user1_id);
CREATE INDEX idx_conversations_user2_id ON conversations(user2_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_read ON messages(read);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- User profile indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_account_type ON users(account_type);
CREATE INDEX idx_users_account_tier ON users(account_tier);
CREATE INDEX idx_users_verification_status ON users(verification_status);
CREATE INDEX idx_users_stripe_customer_id ON users(stripe_customer_id);

-- Literary feature indexes
CREATE INDEX idx_manuscripts_user_id ON manuscripts(user_id);
CREATE INDEX idx_manuscripts_status ON manuscripts(status);
CREATE INDEX idx_manuscripts_type ON manuscripts(type);
CREATE INDEX idx_manuscripts_created_at ON manuscripts(created_at DESC);

CREATE INDEX idx_submissions_manuscript_id ON submissions(manuscript_id);
CREATE INDEX idx_submissions_submitter_id ON submissions(submitter_id);
CREATE INDEX idx_submissions_reviewer_id ON submissions(reviewer_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_created_at ON submissions(created_at DESC);

CREATE INDEX idx_agency_agreements_user_id ON agency_agreements(user_id);
CREATE INDEX idx_agency_agreements_manuscript_id ON agency_agreements(manuscript_id);
CREATE INDEX idx_agency_agreements_status ON agency_agreements(status);

CREATE INDEX idx_jobs_poster_id ON jobs(poster_id);
CREATE INDEX idx_jobs_category ON jobs(category);
CREATE INDEX idx_jobs_job_type ON jobs(job_type);
CREATE INDEX idx_jobs_is_active ON jobs(is_active);
CREATE INDEX idx_jobs_is_featured ON jobs(is_featured);
CREATE INDEX idx_jobs_deadline ON jobs(deadline);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);

CREATE INDEX idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX idx_job_applications_applicant_id ON job_applications(applicant_id);
CREATE INDEX idx_job_applications_status ON job_applications(status);
CREATE INDEX idx_job_applications_applied_at ON job_applications(applied_at DESC);

CREATE INDEX idx_job_saves_job_id ON job_saves(job_id);
CREATE INDEX idx_job_saves_user_id ON job_saves(user_id);

CREATE INDEX idx_referral_codes_user_id ON referral_codes(user_id);
CREATE INDEX idx_referral_codes_code ON referral_codes(code);
CREATE INDEX idx_referral_codes_is_active ON referral_codes(is_active);

CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX idx_referrals_status ON referrals(status);
CREATE INDEX idx_referrals_referral_code ON referrals(referral_code);

CREATE INDEX idx_referral_credits_user_id ON referral_credits(user_id);
CREATE INDEX idx_referral_credits_is_used ON referral_credits(is_used);
CREATE INDEX idx_referral_credits_expires_at ON referral_credits(expires_at);

CREATE INDEX idx_referral_milestones_user_id ON referral_milestones(user_id);
CREATE INDEX idx_referral_milestones_milestone_type ON referral_milestones(milestone_type);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_manuscripts_updated_at BEFORE UPDATE ON manuscripts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agency_agreements_updated_at BEFORE UPDATE ON agency_agreements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE manuscripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_milestones ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Users policies
CREATE POLICY "Users can view all profiles" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Posts policies
CREATE POLICY "Anyone can view published posts" ON posts
  FOR SELECT USING (published = true OR auth.uid() = user_id);

CREATE POLICY "Users can create own posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" ON posts
  FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Anyone can view comments on published posts" ON comments
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM posts WHERE posts.id = comments.post_id AND posts.published = true
  ));

CREATE POLICY "Authenticated users can create comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "Anyone can view likes" ON likes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create likes" ON likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes" ON likes
  FOR DELETE USING (auth.uid() = user_id);

-- Follows policies
CREATE POLICY "Anyone can view follows" ON follows
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create follows" ON follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete own follows" ON follows
  FOR DELETE USING (auth.uid() = follower_id);

-- Conversations policies
CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update own conversations" ON conversations
  FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Messages policies
CREATE POLICY "Users can view own messages" ON messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update own sent messages" ON messages
  FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Create views for common queries
CREATE VIEW posts_with_stats AS
SELECT
  p.*,
  u.display_name,
  u.username,
  u.avatar_url,
  COALESCE(l.likes_count, 0) as likes_count,
  COALESCE(c.comments_count, 0) as comments_count
FROM posts p
JOIN users u ON p.user_id = u.id
LEFT JOIN (
  SELECT post_id, COUNT(*) as likes_count
  FROM likes
  GROUP BY post_id
) l ON p.id = l.post_id
LEFT JOIN (
  SELECT post_id, COUNT(*) as comments_count
  FROM comments
  GROUP BY post_id
) c ON p.id = c.post_id;

-- Create function to get user stats
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS TABLE (
  posts_count BIGINT,
  followers_count BIGINT,
  following_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM posts WHERE user_id = user_uuid AND published = true),
    (SELECT COUNT(*) FROM follows WHERE following_id = user_uuid),
    (SELECT COUNT(*) FROM follows WHERE follower_id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create additional ENUM types for literary features
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'manuscript_type_enum') THEN
        CREATE TYPE manuscript_type_enum AS ENUM ('screenplay', 'tv_pilot', 'stage_play', 'book', 'short_story');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'manuscript_status_enum') THEN
        CREATE TYPE manuscript_status_enum AS ENUM ('draft', 'submitted', 'under_review', 'represented', 'passed');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'submission_status_enum') THEN
        CREATE TYPE submission_status_enum AS ENUM ('pending', 'under_review', 'feedback_provided', 'accepted', 'rejected');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'submission_type_enum') THEN
        CREATE TYPE submission_type_enum AS ENUM ('query', 'requested_material', 'unsolicited');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'agreement_type_enum') THEN
        CREATE TYPE agreement_type_enum AS ENUM ('representation', 'co_agent', 'evaluation_only');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'agreement_status_enum') THEN
        CREATE TYPE agreement_status_enum AS ENUM ('pending', 'active', 'terminated');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_type_enum') THEN
        CREATE TYPE job_type_enum AS ENUM ('freelance', 'contract', 'full_time', 'part_time', 'project_based');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_category_enum') THEN
        CREATE TYPE job_category_enum AS ENUM ('writing', 'screenwriting', 'editing', 'development', 'production', 'representation');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'experience_level_enum') THEN
        CREATE TYPE experience_level_enum AS ENUM ('entry', 'mid', 'senior', 'executive');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'compensation_type_enum') THEN
        CREATE TYPE compensation_type_enum AS ENUM ('hourly', 'project', 'salary', 'commission', 'undisclosed');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status_enum') THEN
        CREATE TYPE application_status_enum AS ENUM ('pending', 'reviewing', 'shortlisted', 'rejected', 'hired');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'referral_status_enum') THEN
        CREATE TYPE referral_status_enum AS ENUM ('pending', 'confirmed', 'credited', 'expired');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'credit_type_enum') THEN
        CREATE TYPE credit_type_enum AS ENUM ('days', 'dollars');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'milestone_type_enum') THEN
        CREATE TYPE milestone_type_enum AS ENUM ('ambassador', 'champion', 'legend', 'custom');
    END IF;
END $$;

-- Create manuscripts table
CREATE TABLE manuscripts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  logline TEXT NOT NULL,
  synopsis TEXT NOT NULL,
  genre TEXT NOT NULL,
  type manuscript_type_enum NOT NULL,
  page_count INTEGER NOT NULL DEFAULT 0,
  status manuscript_status_enum DEFAULT 'draft' NOT NULL,
  is_complete BOOLEAN DEFAULT false,
  file_path TEXT,
  query_letter TEXT,
  character_count INTEGER,
  target_audience TEXT,
  comparable_works TEXT,
  author_bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create submissions table
CREATE TABLE submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  manuscript_id UUID REFERENCES manuscripts(id) ON DELETE CASCADE NOT NULL,
  submitter_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status submission_status_enum DEFAULT 'pending' NOT NULL,
  submission_type submission_type_enum NOT NULL,
  reader_notes TEXT,
  agent_notes TEXT,
  feedback TEXT,
  score INTEGER CHECK (score >= 1 AND score <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Create agency agreements table
CREATE TABLE agency_agreements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  manuscript_id UUID REFERENCES manuscripts(id) ON DELETE CASCADE NOT NULL,
  agreement_type agreement_type_enum NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 15.00,
  start_date DATE NOT NULL,
  end_date DATE,
  terms TEXT NOT NULL,
  status agreement_status_enum DEFAULT 'pending' NOT NULL,
  signed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create jobs table
CREATE TABLE jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  poster_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL,
  remote_ok BOOLEAN DEFAULT false,
  job_type job_type_enum NOT NULL,
  category job_category_enum NOT NULL,
  experience_level experience_level_enum NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT NOT NULL,
  compensation_type compensation_type_enum NOT NULL,
  compensation_min DECIMAL(12,2),
  compensation_max DECIMAL(12,2),
  currency TEXT DEFAULT 'USD' NOT NULL,
  deadline TIMESTAMP WITH TIME ZONE,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  applications_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create job applications table
CREATE TABLE job_applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  applicant_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  cover_letter TEXT NOT NULL,
  portfolio_links TEXT,
  status application_status_enum DEFAULT 'pending' NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  UNIQUE(job_id, applicant_id)
);

-- Create job saves table
CREATE TABLE job_saves (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(job_id, user_id)
);

-- Create referral codes table
CREATE TABLE referral_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  uses_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create referrals table
CREATE TABLE referrals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  referrer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  referred_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  referral_code TEXT NOT NULL,
  status referral_status_enum DEFAULT 'pending' NOT NULL,
  credit_amount DECIMAL(10,2) DEFAULT 0.00,
  credit_type credit_type_enum DEFAULT 'days' NOT NULL,
  referred_tier TEXT NOT NULL,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  credited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create referral credits table
CREATE TABLE referral_credits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  credit_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  credit_type credit_type_enum NOT NULL,
  source_referral_id UUID REFERENCES referrals(id) ON DELETE CASCADE NOT NULL,
  is_used BOOLEAN DEFAULT false,
  used_amount DECIMAL(10,2) DEFAULT 0.00,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create referral milestones table
CREATE TABLE referral_milestones (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  milestone_type milestone_type_enum NOT NULL,
  referral_count INTEGER NOT NULL,
  reward_description TEXT NOT NULL,
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  is_claimed BOOLEAN DEFAULT false,
  claimed_at TIMESTAMP WITH TIME ZONE
);

-- RLS Policies for new tables

-- Manuscripts policies
CREATE POLICY "Users can view own manuscripts" ON manuscripts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Agents can view submitted manuscripts" ON manuscripts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.account_type IN ('platform_agent', 'external_agent'))
    AND status IN ('submitted', 'under_review')
  );

CREATE POLICY "Users can create own manuscripts" ON manuscripts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own manuscripts" ON manuscripts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own manuscripts" ON manuscripts
  FOR DELETE USING (auth.uid() = user_id);

-- Submissions policies
CREATE POLICY "Users can view own submissions" ON submissions
  FOR SELECT USING (auth.uid() = submitter_id OR auth.uid() = reviewer_id);

CREATE POLICY "Agents can view assigned submissions" ON submissions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.account_type IN ('platform_agent', 'external_agent'))
  );

CREATE POLICY "Users can create submissions" ON submissions
  FOR INSERT WITH CHECK (auth.uid() = submitter_id);

CREATE POLICY "Reviewers can update submissions" ON submissions
  FOR UPDATE USING (auth.uid() = reviewer_id OR auth.uid() = submitter_id);

-- Agency agreements policies
CREATE POLICY "Users can view own agreements" ON agency_agreements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Agents can view relevant agreements" ON agency_agreements
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.account_type IN ('platform_agent', 'external_agent'))
  );

CREATE POLICY "Agents can create agreements" ON agency_agreements
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.account_type IN ('platform_agent', 'external_agent'))
  );

CREATE POLICY "Relevant parties can update agreements" ON agency_agreements
  FOR UPDATE USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.account_type IN ('platform_agent', 'external_agent'))
  );

-- Jobs policies
CREATE POLICY "Anyone can view active jobs" ON jobs
  FOR SELECT USING (is_active = true);

CREATE POLICY "Job posters can view own jobs" ON jobs
  FOR SELECT USING (auth.uid() = poster_id);

CREATE POLICY "Authenticated users can create jobs" ON jobs
  FOR INSERT WITH CHECK (auth.uid() = poster_id);

CREATE POLICY "Job posters can update own jobs" ON jobs
  FOR UPDATE USING (auth.uid() = poster_id);

CREATE POLICY "Job posters can delete own jobs" ON jobs
  FOR DELETE USING (auth.uid() = poster_id);

-- Job applications policies
CREATE POLICY "Users can view own applications" ON job_applications
  FOR SELECT USING (auth.uid() = applicant_id);

CREATE POLICY "Job posters can view applications" ON job_applications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_applications.job_id AND jobs.poster_id = auth.uid())
  );

CREATE POLICY "Authenticated users can apply to jobs" ON job_applications
  FOR INSERT WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "Job posters can update applications" ON job_applications
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_applications.job_id AND jobs.poster_id = auth.uid())
  );

-- Job saves policies
CREATE POLICY "Users can view own saved jobs" ON job_saves
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can save jobs" ON job_saves
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved jobs" ON job_saves
  FOR DELETE USING (auth.uid() = user_id);

-- Referral codes policies
CREATE POLICY "Users can view own referral codes" ON referral_codes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own referral codes" ON referral_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own referral codes" ON referral_codes
  FOR UPDATE USING (auth.uid() = user_id);

-- Referrals policies
CREATE POLICY "Users can view own referrals" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "System can create referrals" ON referrals
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update referrals" ON referrals
  FOR UPDATE USING (true);

-- Referral credits policies
CREATE POLICY "Users can view own credits" ON referral_credits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create credits" ON referral_credits
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own credits" ON referral_credits
  FOR UPDATE USING (auth.uid() = user_id);

-- Referral milestones policies
CREATE POLICY "Users can view own milestones" ON referral_milestones
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create milestones" ON referral_milestones
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own milestones" ON referral_milestones
  FOR UPDATE USING (auth.uid() = user_id);