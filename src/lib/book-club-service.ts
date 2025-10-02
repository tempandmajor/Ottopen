// Book Club Service - Complete backend for community features
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ============================================================================
// TYPES
// ============================================================================

export type ClubType = 'public' | 'private' | 'invite-only'
export type MemberRole = 'owner' | 'moderator' | 'member'
export type MemberStatus = 'pending' | 'active' | 'banned'
export type EventType = 'reading' | 'sprint' | 'workshop' | 'ama' | 'challenge' | 'social'

export interface BookClub {
  id: string
  name: string
  description?: string
  club_type: ClubType
  genre: string[]
  tags: string[]
  avatar_url?: string
  banner_url?: string
  rules?: string
  welcome_message?: string
  created_by: string
  member_count: number
  max_members?: number
  is_featured: boolean
  created_at: string
  updated_at: string
}

export interface ClubMembership {
  id: string
  club_id: string
  user_id: string
  role: MemberRole
  status: MemberStatus
  credits: number
  reputation_score: number
  joined_at: string
  last_active_at: string
}

export interface ClubDiscussion {
  id: string
  club_id: string
  manuscript_id?: string
  chapter_id?: string
  title: string
  content: string
  author_id: string
  pinned: boolean
  locked: boolean
  view_count: number
  reply_count: number
  last_reply_at?: string
  created_at: string
  updated_at: string
}

export interface DiscussionReply {
  id: string
  discussion_id: string
  author_id: string
  content: string
  parent_reply_id?: string
  helpful_count: number
  created_at: string
  updated_at: string
}

export interface CritiqueSubmission {
  id: string
  club_id: string
  manuscript_id: string
  chapter_id?: string
  submitter_id: string
  title: string
  description?: string
  credits_cost: number
  min_critiques: number
  max_critiques: number
  deadline?: string
  status: 'open' | 'in-progress' | 'completed' | 'cancelled'
  critique_count: number
  created_at: string
  updated_at: string
}

export interface Critique {
  id: string
  submission_id: string
  reviewer_id: string
  content: string
  rating_overall?: number
  rating_plot?: number
  rating_characters?: number
  rating_prose?: number
  rating_pacing?: number
  helpful_votes: number
  not_helpful_votes: number
  created_at: string
  updated_at: string
}

export interface ClubEvent {
  id: string
  club_id: string
  title: string
  description?: string
  event_type: EventType
  start_time: string
  duration_minutes: number
  max_participants?: number
  participant_count: number
  location_type: 'virtual' | 'in-person' | 'hybrid'
  meeting_url?: string
  created_by: string
  created_at: string
  updated_at: string
}

// ============================================================================
// BOOK CLUB OPERATIONS
// ============================================================================

export class BookClubService {
  static async create(userId: string, data: Partial<BookClub>): Promise<BookClub> {
    const { data: club, error } = await supabase
      .from('book_clubs')
      .insert({
        created_by: userId,
        name: data.name || 'Untitled Club',
        club_type: data.club_type || 'public',
        ...data,
      })
      .select()
      .single()

    if (error) throw error

    // Automatically add creator as owner
    await this.addMember(club.id, userId, 'owner', 'active')

    return club
  }

  static async getById(id: string): Promise<BookClub | null> {
    const { data, error } = await supabase.from('book_clubs').select('*').eq('id', id).single()

    if (error) return null
    return data
  }

  static async list(filters?: {
    club_type?: ClubType
    genre?: string
    search?: string
    limit?: number
  }): Promise<BookClub[]> {
    let query = supabase.from('book_clubs').select('*').order('member_count', { ascending: false })

    if (filters?.club_type) {
      query = query.eq('club_type', filters.club_type)
    }

    if (filters?.genre) {
      query = query.contains('genre', [filters.genre])
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  static async getFeatured(limit: number = 6): Promise<BookClub[]> {
    const { data, error } = await supabase
      .from('book_clubs')
      .select('*')
      .eq('is_featured', true)
      .limit(limit)

    if (error) throw error
    return data || []
  }

  static async getUserClubs(userId: string): Promise<BookClub[]> {
    const { data, error } = await supabase
      .from('club_memberships')
      .select('club_id, book_clubs(*)')
      .eq('user_id', userId)
      .eq('status', 'active')

    if (error) throw error
    return (data || []).map((m: any) => m.book_clubs)
  }

  static async update(id: string, updates: Partial<BookClub>): Promise<BookClub> {
    const { data, error } = await supabase
      .from('book_clubs')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase.from('book_clubs').delete().eq('id', id)
    if (error) throw error
  }

  static async getMembers(clubId: string): Promise<ClubMembership[]> {
    const { data, error } = await supabase
      .from('club_memberships')
      .select('*')
      .eq('club_id', clubId)
      .eq('status', 'active')
      .order('joined_at', { ascending: true })

    if (error) throw error
    return data || []
  }

  static async addMember(
    clubId: string,
    userId: string,
    role: MemberRole = 'member',
    status: MemberStatus = 'pending'
  ): Promise<ClubMembership> {
    const { data, error } = await supabase
      .from('club_memberships')
      .insert({
        club_id: clubId,
        user_id: userId,
        role,
        status,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async updateMember(
    membershipId: string,
    updates: Partial<ClubMembership>
  ): Promise<ClubMembership> {
    const { data, error } = await supabase
      .from('club_memberships')
      .update(updates)
      .eq('id', membershipId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async removeMember(clubId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('club_memberships')
      .delete()
      .eq('club_id', clubId)
      .eq('user_id', userId)

    if (error) throw error
  }

  static async getMembership(clubId: string, userId: string): Promise<ClubMembership | null> {
    const { data, error } = await supabase
      .from('club_memberships')
      .select('*')
      .eq('club_id', clubId)
      .eq('user_id', userId)
      .single()

    if (error) return null
    return data
  }
}

// ============================================================================
// DISCUSSION OPERATIONS
// ============================================================================

export class DiscussionService {
  static async create(
    clubId: string,
    authorId: string,
    data: Partial<ClubDiscussion>
  ): Promise<ClubDiscussion> {
    const { data: discussion, error } = await supabase
      .from('club_discussions')
      .insert({
        club_id: clubId,
        author_id: authorId,
        title: data.title || 'Untitled Discussion',
        content: data.content || '',
        ...data,
      })
      .select()
      .single()

    if (error) throw error
    return discussion
  }

  static async getById(id: string): Promise<ClubDiscussion | null> {
    const { data, error } = await supabase
      .from('club_discussions')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data
  }

  static async getByClubId(clubId: string, limit: number = 50): Promise<ClubDiscussion[]> {
    const { data, error } = await supabase
      .from('club_discussions')
      .select('*')
      .eq('club_id', clubId)
      .order('pinned', { ascending: false })
      .order('last_reply_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }

  static async update(id: string, updates: Partial<ClubDiscussion>): Promise<ClubDiscussion> {
    const { data, error } = await supabase
      .from('club_discussions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase.from('club_discussions').delete().eq('id', id)
    if (error) throw error
  }

  static async incrementViewCount(id: string): Promise<void> {
    const { error } = await supabase.rpc('increment_discussion_views', { discussion_id: id })
    if (error) console.error('Failed to increment view count:', error)
  }

  static async addReply(
    discussionId: string,
    authorId: string,
    content: string,
    parentReplyId?: string
  ): Promise<DiscussionReply> {
    const { data, error } = await supabase
      .from('discussion_replies')
      .insert({
        discussion_id: discussionId,
        author_id: authorId,
        content,
        parent_reply_id: parentReplyId,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getReplies(discussionId: string): Promise<DiscussionReply[]> {
    const { data, error } = await supabase
      .from('discussion_replies')
      .select('*')
      .eq('discussion_id', discussionId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  }
}

// ============================================================================
// CRITIQUE OPERATIONS
// ============================================================================

export class CritiqueService {
  static async createSubmission(
    clubId: string,
    submitterId: string,
    data: Partial<CritiqueSubmission>
  ): Promise<CritiqueSubmission> {
    // Check if user has enough credits
    const membership = await BookClubService.getMembership(clubId, submitterId)
    if (!membership || membership.credits < (data.credits_cost || 1)) {
      throw new Error('Insufficient credits')
    }

    const { data: submission, error } = await supabase
      .from('critique_submissions')
      .insert({
        club_id: clubId,
        submitter_id: submitterId,
        title: data.title || 'Untitled Submission',
        ...data,
      })
      .select()
      .single()

    if (error) throw error

    // Deduct credits
    await supabase
      .from('club_memberships')
      .update({ credits: membership.credits - (data.credits_cost || 1) })
      .eq('id', membership.id)

    return submission
  }

  static async getSubmissions(clubId: string, status?: string): Promise<CritiqueSubmission[]> {
    let query = supabase
      .from('critique_submissions')
      .select('*')
      .eq('club_id', clubId)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  static async submitCritique(
    submissionId: string,
    reviewerId: string,
    data: Partial<Critique>
  ): Promise<Critique> {
    const { data: critique, error } = await supabase
      .from('critiques')
      .insert({
        submission_id: submissionId,
        reviewer_id: reviewerId,
        content: data.content || '',
        ...data,
      })
      .select()
      .single()

    if (error) throw error

    // Get submission to award credits
    const { data: submission } = await supabase
      .from('critique_submissions')
      .select('club_id')
      .eq('id', submissionId)
      .single()

    if (submission) {
      // Award credit to reviewer
      const membership = await BookClubService.getMembership(submission.club_id, reviewerId)
      if (membership) {
        await supabase
          .from('club_memberships')
          .update({
            credits: membership.credits + 1,
            reputation_score: membership.reputation_score + 10,
          })
          .eq('id', membership.id)
      }
    }

    return critique
  }

  static async getCritiques(submissionId: string): Promise<Critique[]> {
    const { data, error } = await supabase
      .from('critiques')
      .select('*')
      .eq('submission_id', submissionId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async voteHelpful(critiqueId: string, helpful: boolean): Promise<void> {
    const field = helpful ? 'helpful_votes' : 'not_helpful_votes'
    const { error } = await supabase.rpc(`increment_${field}`, { critique_id: critiqueId })
    if (error) throw error
  }
}

// ============================================================================
// EVENT OPERATIONS
// ============================================================================

export class EventService {
  static async create(
    clubId: string,
    creatorId: string,
    data: Partial<ClubEvent>
  ): Promise<ClubEvent> {
    const { data: event, error } = await supabase
      .from('club_events')
      .insert({
        club_id: clubId,
        created_by: creatorId,
        title: data.title || 'Untitled Event',
        event_type: data.event_type || 'social',
        start_time: data.start_time || new Date().toISOString(),
        ...data,
      })
      .select()
      .single()

    if (error) throw error
    return event
  }

  static async getUpcoming(clubId: string): Promise<ClubEvent[]> {
    const { data, error } = await supabase
      .from('club_events')
      .select('*')
      .eq('club_id', clubId)
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })

    if (error) throw error
    return data || []
  }

  static async rsvp(
    eventId: string,
    userId: string,
    status: 'going' | 'maybe' | 'not-going'
  ): Promise<void> {
    const { error } = await supabase.from('event_participants').upsert({
      event_id: eventId,
      user_id: userId,
      status,
    })

    if (error) throw error
  }
}
