import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type {
  Post,
  User,
  Job,
  Submission,
  Manuscript,
  WritingGoal,
  WritingSession,
  UserStatistics,
  JobApplication,
  Referral,
  ReferralCode,
} from '@/src/lib/supabase'

function getServerSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const cookieStore = cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // Ignore in Server Components
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch (error) {
          // Ignore in Server Components
        }
      },
    },
  })
}

// Posts
export async function getServerPosts(
  options: {
    limit?: number
    offset?: number
    userId?: string
    published?: boolean
  } = {}
): Promise<Post[]> {
  const supabase = getServerSupabase()
  const { limit = 20, offset = 0, userId, published = true } = options

  let query = supabase
    .from('posts_with_stats')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
    .range(offset, offset + limit - 1)

  if (userId) {
    query = query.eq('user_id', userId)
  }

  if (published !== undefined) {
    query = query.eq('published', published)
  }

  const { data, error } = await query

  if (error) {
    console.error('Failed to get posts:', error)
    return []
  }

  return data || []
}

// Users
export async function getServerUsers(query: string, limit = 20): Promise<User[]> {
  const supabase = getServerSupabase()

  const { data, error } = await supabase
    .from('user_public_profiles')
    .select('*')
    .or(`display_name.ilike.%${query}%, username.ilike.%${query}%, bio.ilike.%${query}%`)
    .limit(limit)

  if (error) {
    console.error('Failed to search users:', error)
    return []
  }

  return data || []
}

// Application Stats
export async function getServerApplicationStats(): Promise<Record<string, number>> {
  const supabase = getServerSupabase()

  const { data, error } = await supabase
    .from('application_statistics')
    .select('stat_key, stat_value')

  if (error) {
    console.error('Failed to get application statistics:', error)
    return {
      active_writers: 0,
      stories_shared: 0,
      published_works: 0,
      total_users: 0,
    }
  }

  const stats: Record<string, number> = {}
  data?.forEach(stat => {
    stats[stat.stat_key] = stat.stat_value
  })

  return stats
}

// Jobs
export async function getServerJobs(options?: {
  limit?: number
  category?: string
  jobType?: string
  experienceLevel?: string
  featured?: boolean
}): Promise<Job[]> {
  const supabase = getServerSupabase()

  let query = supabase
    .from('jobs')
    .select(
      `
      *,
      poster:users!jobs_poster_id_fkey(id, username, display_name, avatar_url, account_type)
    `
    )
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.category && options.category !== 'all') {
    query = query.eq('category', options.category)
  }

  if (options?.jobType && options.jobType !== 'all') {
    query = query.eq('job_type', options.jobType)
  }

  if (options?.experienceLevel && options.experienceLevel !== 'all') {
    query = query.eq('experience_level', options.experienceLevel)
  }

  if (options?.featured) {
    query = query.eq('is_featured', true)
  }

  const { data, error } = await query

  if (error) {
    console.error('Failed to fetch jobs:', error)
    return []
  }

  return data || []
}

// User Statistics
export async function getServerUserStatistics(userId: string): Promise<UserStatistics | null> {
  const supabase = getServerSupabase()

  const { data, error } = await supabase
    .from('user_statistics')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Failed to get user statistics:', error)
    return null
  }

  return data
}

// Writing Goals
export async function getServerWritingGoals(userId: string): Promise<WritingGoal[]> {
  const supabase = getServerSupabase()

  const { data, error } = await supabase
    .from('writing_goals')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to get writing goals:', error)
    return []
  }

  return data || []
}

// Writing Sessions
export async function getServerWritingSessions(
  userId: string,
  limit = 30
): Promise<WritingSession[]> {
  const supabase = getServerSupabase()

  const { data, error } = await supabase
    .from('writing_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('session_date', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Failed to get writing sessions:', error)
    return []
  }

  return data || []
}

// Writing Streak
export async function getServerWritingStreak(userId: string): Promise<number> {
  const supabase = getServerSupabase()

  const { data, error } = await supabase.rpc('calculate_writing_streak', {
    target_user_id: userId,
  })

  if (error) {
    console.error('Failed to calculate writing streak:', error)
    return 0
  }

  return data || 0
}

// Followers
export async function getServerFollowers(userId: string): Promise<User[]> {
  const supabase = getServerSupabase()

  const { data, error } = await supabase
    .from('follows')
    .select(
      `
      follower:users!follower_id(*)
    `
    )
    .eq('following_id', userId)

  if (error) {
    console.error('Failed to get followers:', error)
    return []
  }

  return (data?.map((f: any) => f.follower) || []) as User[]
}

// Saved Jobs
export async function getServerSavedJobs(userId: string): Promise<string[]> {
  const supabase = getServerSupabase()

  const { data, error } = await supabase.from('job_saves').select('job_id').eq('user_id', userId)

  if (error) {
    console.error('Failed to get saved jobs:', error)
    return []
  }

  return data?.map(save => save.job_id) || []
}

// Job Applications
export async function getServerUserJobApplications(userId: string): Promise<JobApplication[]> {
  const supabase = getServerSupabase()

  const { data, error } = await supabase
    .from('job_applications')
    .select(
      `
      *,
      job:jobs(id, title, company, location, is_active)
    `
    )
    .eq('applicant_id', userId)
    .order('applied_at', { ascending: false })

  if (error) {
    console.error('Failed to get user job applications:', error)
    return []
  }

  return data || []
}

// Manuscripts
export async function getServerUserManuscripts(userId: string): Promise<Manuscript[]> {
  const supabase = getServerSupabase()

  const { data, error } = await supabase
    .from('manuscripts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to get user manuscripts:', error)
    return []
  }

  return data || []
}

// Submissions
export async function getServerUserSubmissions(userId: string): Promise<Submission[]> {
  const supabase = getServerSupabase()

  const { data, error } = await supabase
    .from('submissions')
    .select(
      `
      *,
      manuscript:manuscripts(id, title, type, genre)
    `
    )
    .eq('submitter_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to get user submissions:', error)
    return []
  }

  return data || []
}

// Referrals
export async function getServerUserReferrals(userId: string): Promise<Referral[]> {
  const supabase = getServerSupabase()

  const { data, error } = await supabase
    .from('referrals')
    .select(
      `
      *,
      referred:users!referrals_referred_id_fkey(id, username, display_name, email)
    `
    )
    .eq('referrer_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to get user referrals:', error)
    return []
  }

  return data || []
}

// Referral Code
export async function getServerUserReferralCode(userId: string): Promise<ReferralCode | null> {
  const supabase = getServerSupabase()

  const { data, error } = await supabase
    .from('referral_codes')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Failed to get user referral code:', error)
    return null
  }

  return data
}

// Referral Stats
export async function getServerReferralStats(userId: string): Promise<{
  totalReferrals: number
  confirmedReferrals: number
  pendingReferrals: number
  totalCredits: number
  usedCredits: number
  availableCredits: number
}> {
  const supabase = getServerSupabase()

  const { data: referrals, error: referralsError } = await supabase
    .from('referrals')
    .select('status, credit_amount')
    .eq('referrer_id', userId)

  if (referralsError) {
    console.error('Failed to get referral stats:', referralsError)
    return {
      totalReferrals: 0,
      confirmedReferrals: 0,
      pendingReferrals: 0,
      totalCredits: 0,
      usedCredits: 0,
      availableCredits: 0,
    }
  }

  const { data: credits, error: creditsError } = await supabase
    .from('referral_credits')
    .select('credit_amount, used_amount')
    .eq('user_id', userId)

  if (creditsError) {
    console.error('Failed to get referral credits:', creditsError)
  }

  const totalReferrals = referrals?.length || 0
  const confirmedReferrals =
    referrals?.filter(r => r.status === 'confirmed' || r.status === 'credited').length || 0
  const pendingReferrals = referrals?.filter(r => r.status === 'pending').length || 0

  const totalCredits = credits?.reduce((sum, c) => sum + c.credit_amount, 0) || 0
  const usedCredits = credits?.reduce((sum, c) => sum + c.used_amount, 0) || 0
  const availableCredits = totalCredits - usedCredits

  return {
    totalReferrals,
    confirmedReferrals,
    pendingReferrals,
    totalCredits,
    usedCredits,
    availableCredits,
  }
}

// Application Statistics
export async function getServerApplicationStatistics(): Promise<{
  active_writers: number
  stories_shared: number
  published_works: number
  total_users: number
}> {
  const supabase = getServerSupabase()

  // Get total users count
  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })

  // Get published posts count (stories shared)
  const { count: storiesShared } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('published', true)

  // Get published works count (from posts or manuscripts)
  const { count: publishedWorks } = await supabase
    .from('manuscripts')
    .select('*', { count: 'exact', head: true })

  // Count users who have posted in the last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: activeUsers } = await supabase
    .from('posts')
    .select('author_id')
    .gte('created_at', thirtyDaysAgo.toISOString())

  const uniqueActiveUsers = new Set(activeUsers?.map(p => p.author_id) || [])

  return {
    active_writers: uniqueActiveUsers.size,
    stories_shared: storiesShared || 0,
    published_works: publishedWorks || 0,
    total_users: totalUsers || 0,
  }
}
