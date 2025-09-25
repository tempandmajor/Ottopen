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
  if (process.env.NODE_ENV === 'development') {
    const fallbackUrl = process.env.SUPABASE_FALLBACK_URL
    const fallbackKey = process.env.SUPABASE_FALLBACK_ANON_KEY

    if (fallbackUrl && fallbackKey) {
      console.warn('⚠️  Using fallback Supabase configuration from environment.')
      return { url: fallbackUrl, anonKey: fallbackKey }
    }

    console.warn('⚠️  No Supabase configuration found. Please set environment variables.')
  }

  throw new Error(
    'Supabase configuration is missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.'
  )
}

const { url: supabaseUrl, anonKey: supabaseAnonKey } = getSupabaseConfig()

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
})

// Check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  // If explicitly disabled, return false
  if (process.env.DISABLE_SUPABASE === 'true') {
    return false
  }

  try {
    getSupabaseConfig()
    return true
  } catch {
    return false
  }
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
  stripe_customer_id?: string
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
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  user_id: string
  title: string
  content: string
  excerpt?: string
  published: boolean
  created_at: string
  updated_at: string
  user?: User
  likes_count?: number
  comments_count?: number
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
