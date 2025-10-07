import { createClient } from '@supabase/supabase-js'

// Configuration management with security considerations
function getSupabaseConfig() {
  // Primary: Environment variables (production/development)
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (envUrl && envKey) {
    return { url: envUrl, anonKey: envKey }
  }

  // Development fallback - use environment variables if available
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
    const fallbackUrl = process.env.SUPABASE_FALLBACK_URL
    const fallbackKey = process.env.SUPABASE_FALLBACK_ANON_KEY

    if (fallbackUrl && fallbackKey) {
      console.warn('⚠️  Using fallback Supabase configuration from environment.')
      return { url: fallbackUrl, anonKey: fallbackKey }
    }

    console.warn('⚠️  No Supabase configuration found. Please set environment variables.')
  }

  // Return empty config instead of throwing - this allows the module to load
  return { url: '', anonKey: '' }
}

const { url: supabaseUrl, anonKey: supabaseAnonKey } = getSupabaseConfig()

// Client-side Supabase client - only create if config is valid
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
        },
      })
    : null

// Check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  // If explicitly disabled, return false
  if (typeof process !== 'undefined' && process.env?.DISABLE_SUPABASE === 'true') {
    return false
  }

  // Check if supabase client was successfully created
  return supabase !== null
}

// Database types
export interface User {
  id: string
  email: string
  display_name: string
  username: string
  bio?: string
  specialty?: string
  avatar_url?: string
  location?: string
  website_url?: string
  twitter_handle?: string
  linkedin_url?: string
  stripe_customer_id?: string
  stripe_connect_account_id?: string
  stripe_connect_onboarded?: boolean
  stripe_connect_charges_enabled?: boolean
  stripe_connect_payouts_enabled?: boolean
  is_admin?: boolean
  is_online?: boolean
  last_seen?: string
  account_type:
    | 'writer'
    | 'platform_agent'
    | 'external_agent'
    | 'producer'
    | 'publisher'
    | 'theater_director'
    | 'reader_evaluator'
  account_tier: 'free' | 'premium' | 'pro' | 'industry_basic' | 'industry_premium'
  verification_status: 'pending' | 'verified' | 'rejected'
  industry_credentials?: string
  company_name?: string
  license_number?: string
  open_for_collaboration?: boolean
  accepting_beta_readers?: boolean
  preferred_genres?: string[]
  posts_last_30_days?: number
  avg_post_engagement?: number
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  user_id: string
  title: string
  content: string
  excerpt?: string
  image_url?: string
  mood?: string
  published: boolean
  genre?: string
  content_type?:
    | 'screenplay'
    | 'stage_play'
    | 'book'
    | 'short_story'
    | 'poetry'
    | 'article'
    | 'essay'
  reading_time_minutes?: number
  completion_status?: 'complete' | 'wip' | 'hiatus'
  created_at: string
  updated_at: string
  user?: User
  likes_count?: number
  comments_count?: number
  reshares_count?: number
  views_count?: number
  // User profile fields from posts_with_stats view
  display_name?: string
  username?: string
  avatar_url?: string
  bio?: string
  specialty?: string
}

export interface Comment {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  user?: User
}

export interface Like {
  id: string
  post_id: string
  user_id: string
  created_at: string
}

export interface Follow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  receiver_id: string
  content: string
  read: boolean
  created_at: string
  sender?: User
  receiver?: User
}

export interface Conversation {
  id: string
  user1_id: string
  user2_id: string
  last_message_id?: string
  created_at: string
  updated_at: string
  user1?: User
  user2?: User
  last_message?: Message
  unread_count: number
}

// Manuscript and Submission interfaces
export interface Manuscript {
  id: string
  user_id: string
  title: string
  logline: string
  synopsis: string
  genre: string
  type: 'screenplay' | 'tv_pilot' | 'stage_play' | 'book' | 'short_story'
  page_count: number
  status: 'draft' | 'submitted' | 'under_review' | 'represented' | 'passed'
  is_complete: boolean
  file_path?: string
  file_url?: string
  file_size?: number
  file_type?: string
  version_number?: number
  parent_manuscript_id?: string
  word_count?: number
  language?: string
  content_warnings?: string[]
  previous_publications?: string[]
  awards?: string[]
  query_letter?: string
  character_count?: number
  target_audience?: string
  comparable_works?: string
  author_bio?: string
  created_at: string
  updated_at: string
  user?: User
}

export interface Submission {
  id: string
  manuscript_id: string
  submitter_id: string
  reviewer_id?: string
  status: 'pending' | 'under_review' | 'feedback_provided' | 'accepted' | 'rejected'
  submission_type: 'query' | 'requested_material' | 'unsolicited'
  reader_notes?: string
  agent_notes?: string
  feedback?: string
  score?: number
  created_at: string
  updated_at: string
  reviewed_at?: string
  manuscript?: Manuscript
  submitter?: User
  reviewer?: User
}

export interface AgencyAgreement {
  id: string
  user_id: string
  manuscript_id: string
  agreement_type: 'representation' | 'co_agent' | 'evaluation_only'
  commission_rate: number
  start_date: string
  end_date?: string
  terms: string
  status: 'pending' | 'active' | 'terminated'
  signed_at?: string
  created_at: string
  updated_at: string
}

// Job Board interfaces
export interface Job {
  id: string
  poster_id: string
  title: string
  company: string
  location: string
  remote_ok: boolean
  job_type: 'freelance' | 'contract' | 'full_time' | 'part_time' | 'project_based'
  category:
    | 'writing'
    | 'screenwriting'
    | 'editing'
    | 'development'
    | 'production'
    | 'representation'
  experience_level: 'entry' | 'mid' | 'senior' | 'executive'
  description: string
  requirements: string
  compensation_type: 'hourly' | 'project' | 'salary' | 'commission' | 'undisclosed'
  compensation_min?: number
  compensation_max?: number
  currency: string
  deadline?: string
  is_featured: boolean
  is_active: boolean
  applications_count: number
  created_at: string
  updated_at: string
  poster?: User
}

export interface JobApplication {
  id: string
  job_id: string
  applicant_id: string
  cover_letter: string
  portfolio_links?: string
  status: 'pending' | 'reviewing' | 'shortlisted' | 'rejected' | 'hired'
  applied_at: string
  reviewed_at?: string
  notes?: string
  job?: Job
  applicant?: User
}

export interface JobSave {
  id: string
  job_id: string
  user_id: string
  saved_at: string
  job?: Job
}

// Referral System interfaces
export interface ReferralCode {
  id: string
  user_id: string
  code: string
  is_active: boolean
  uses_count: number
  created_at: string
  user?: User
}

export interface Referral {
  id: string
  referrer_id: string
  referred_id: string
  referral_code: string
  status: 'pending' | 'confirmed' | 'credited' | 'expired'
  credit_amount: number
  credit_type: 'days' | 'dollars'
  referred_tier: string
  confirmed_at?: string
  credited_at?: string
  created_at: string
  referrer?: User
  referred?: User
}

export interface ReferralCredit {
  id: string
  user_id: string
  credit_amount: number
  credit_type: 'days' | 'dollars'
  source_referral_id: string
  is_used: boolean
  used_amount: number
  expires_at: string
  used_at?: string
  created_at: string
  source_referral?: Referral
}

export interface ReferralMilestone {
  id: string
  user_id: string
  milestone_type: 'ambassador' | 'champion' | 'legend' | 'custom'
  referral_count: number
  reward_description: string
  achieved_at: string
  is_claimed: boolean
  claimed_at?: string
  user?: User
}

export interface ReferralEarning {
  id: string
  user_id: string
  referral_id: string
  amount_cents: number
  currency: string
  status: 'pending' | 'available' | 'paid' | 'failed'
  paid_at?: string
  stripe_transfer_id?: string
  created_at: string
  updated_at: string
  referral?: Referral
}

export interface PayoutRequest {
  id: string
  user_id: string
  amount_cents: number
  currency: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  stripe_payout_id?: string
  failure_reason?: string
  requested_at: string
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface ReferralBalance {
  total_earned_cents: number
  available_cents: number
  pending_cents: number
  paid_cents: number
}

// New interfaces for enhanced functionality
export interface WritingGoal {
  id: string
  user_id: string
  goal_type: string
  target_value: number
  current_value: number
  unit: string
  period: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface WritingSession {
  id: string
  user_id: string
  words_written: number
  session_duration_minutes: number
  session_date: string
  notes?: string
  created_at: string
}

export interface UserStatistics {
  user_id: string
  posts_count: number
  published_posts_count: number
  followers_count: number
  following_count: number
  likes_received_count: number
  comments_received_count: number
  current_streak_days: number
  longest_streak_days: number
  total_words_written: number
  manuscripts_count: number
  last_activity_date?: string
  updated_at: string
}

export interface ApplicationStatistics {
  id: string
  stat_key: string
  stat_value: number
  stat_description?: string
  updated_at: string
}

export interface PostView {
  id: string
  post_id: string
  user_id?: string
  ip_address?: string
  user_agent?: string
  viewed_at: string
}
