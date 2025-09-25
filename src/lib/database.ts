import { supabase, isSupabaseConfigured } from './supabase'
import { logError, logInfo } from './logger'
import type {
  User,
  Post,
  Comment,
  Like,
  Follow,
  Message,
  Conversation,
  WritingGoal,
  WritingSession,
  UserStatistics,
  ApplicationStatistics,
} from './supabase'

// Standardized return types for better error handling
export interface DatabaseResult<T> {
  data: T | null
  error: string | null
  success: boolean
}

export interface DatabaseListResult<T> {
  data: T[]
  error: string | null
  success: boolean
}

export interface DatabaseBooleanResult {
  success: boolean
  error: string | null
}

export class DatabaseService {
  private supabase: typeof supabase

  constructor(client?: typeof supabase) {
    this.supabase = client || supabase
  }

  // User Settings: Notifications
  async getNotificationSettings(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('user_notification_settings')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        logError('Failed to get notification settings', error)
        return null
      }
      return data || null
    } catch (error) {
      logError('Get notification settings error', error as Error)
      return null
    }
  }

  async upsertNotificationSettings(userId: string, settings: any) {
    try {
      const { data, error } = await this.supabase
        .from('user_notification_settings')
        .upsert({ user_id: userId, ...settings }, { onConflict: 'user_id' })
        .select('*')
        .single()

      if (error) {
        logError('Failed to upsert notification settings', error)
        return null
      }
      return data
    } catch (error) {
      logError('Upsert notification settings error', error as Error)
      return null
    }
  }

  // User Settings: Privacy
  async getPrivacySettings(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('user_privacy_settings')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        logError('Failed to get privacy settings', error)
        return null
      }
      return data || null
    } catch (error) {
      logError('Get privacy settings error', error as Error)
      return null
    }
  }

  async upsertPrivacySettings(userId: string, settings: any) {
    try {
      const { data, error } = await this.supabase
        .from('user_privacy_settings')
        .upsert({ user_id: userId, ...settings }, { onConflict: 'user_id' })
        .select('*')
        .single()

      if (error) {
        logError('Failed to upsert privacy settings', error)
        return null
      }
      return data
    } catch (error) {
      logError('Upsert privacy settings error', error as Error)
      return null
    }
  }

  private checkSupabaseConfig(): DatabaseBooleanResult {
    if (!isSupabaseConfigured()) {
      logInfo('Supabase not configured, returning empty data')
      return { success: false, error: 'Supabase is not configured' }
    }
    return { success: true, error: null }
  }

  private handleError(operation: string, error: any): string {
    const errorMessage = typeof error === 'string' ? error : error?.message || 'Unknown error'
    logError(`${operation} failed`, error)
    return errorMessage
  }

  // User operations
  async getUser(id: string): Promise<DatabaseResult<User>> {
    const configCheck = this.checkSupabaseConfig()
    if (!configCheck.success) {
      return { data: null, error: configCheck.error, success: false }
    }

    try {
      const { data, error } = await this.supabase.from('users').select('*').eq('id', id).single()

      if (error) {
        return {
          data: null,
          error: this.handleError('Get user', error),
          success: false,
        }
      }

      return { data, error: null, success: true }
    } catch (error) {
      return {
        data: null,
        error: this.handleError('Get user', error),
        success: false,
      }
    }
  }

  // Legacy methods for backward compatibility
  async getUserLegacy(id: string): Promise<User | null> {
    const result = await this.getUser(id)
    return result.data
  }

  async getUserByUsernameLegacy(username: string): Promise<User | null> {
    const result = await this.getUserByUsername(username)
    return result.data
  }

  async getUserByUsername(username: string): Promise<DatabaseResult<User>> {
    const configCheck = this.checkSupabaseConfig()
    if (!configCheck.success) {
      return { data: null, error: configCheck.error, success: false }
    }

    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single()

      if (error) {
        return {
          data: null,
          error: this.handleError('Get user by username', error),
          success: false,
        }
      }

      return { data, error: null, success: true }
    } catch (error) {
      return {
        data: null,
        error: this.handleError('Get user by username', error),
        success: false,
      }
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        logError('Failed to update user', error)
        return null
      }

      logInfo('User updated successfully', { userId: id })
      return data
    } catch (error) {
      logError('Update user error', error as Error)
      return null
    }
  }

  async getUserStats(userId: string) {
    try {
      const { data, error } = await this.supabase.rpc('get_user_stats', { user_uuid: userId })

      if (error) {
        logError('Failed to get user stats', error)
        return { posts_count: 0, followers_count: 0, following_count: 0 }
      }

      return data[0] || { posts_count: 0, followers_count: 0, following_count: 0 }
    } catch (error) {
      logError('Get user stats error', error as Error)
      return { posts_count: 0, followers_count: 0, following_count: 0 }
    }
  }

  // Post operations
  async getPosts(
    options: {
      limit?: number
      offset?: number
      userId?: string
      published?: boolean
    } = {}
  ): Promise<Post[]> {
    if (!this.checkSupabaseConfig()) {
      return []
    }

    try {
      const { limit = 20, offset = 0, userId, published = true } = options

      let query = this.supabase
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
        logError('Failed to get posts', error)
        return []
      }

      return data || []
    } catch (error) {
      logError('Get posts error', error as Error)
      return []
    }
  }

  async getPost(id: string): Promise<Post | null> {
    try {
      const { data, error } = await this.supabase
        .from('posts_with_stats')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        logError('Failed to get post', error)
        return null
      }

      return data
    } catch (error) {
      logError('Get post error', error as Error)
      return null
    }
  }

  async createPost(post: Omit<Post, 'id' | 'created_at' | 'updated_at'>): Promise<Post | null> {
    try {
      const { data, error } = await this.supabase.from('posts').insert(post).select().single()

      if (error) {
        logError('Failed to create post', error)
        return null
      }

      logInfo('Post created successfully', { postId: data.id })

      // Update user statistics in the background
      this.updateUserStatistics(post.user_id).catch(error => {
        logError('Failed to update user statistics after post creation', error)
      })

      // Update application statistics in the background
      this.updateApplicationStatistics().catch(error => {
        logError('Failed to update application statistics after post creation', error)
      })

      return data
    } catch (error) {
      logError('Create post error', error as Error)
      return null
    }
  }

  async updatePost(id: string, updates: Partial<Post>): Promise<Post | null> {
    try {
      const { data, error } = await this.supabase
        .from('posts')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        logError('Failed to update post', error)
        return null
      }

      logInfo('Post updated successfully', { postId: id })
      return data
    } catch (error) {
      logError('Update post error', error as Error)
      return null
    }
  }

  async deletePost(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.from('posts').delete().eq('id', id)

      if (error) {
        logError('Failed to delete post', error)
        return false
      }

      logInfo('Post deleted successfully', { postId: id })
      return true
    } catch (error) {
      logError('Delete post error', error as Error)
      return false
    }
  }

  async searchPosts(query: string, limit = 20): Promise<Post[]> {
    try {
      const { data, error } = await this.supabase
        .from('posts_with_stats')
        .select('*')
        .or(`title.ilike.%${query}%, content.ilike.%${query}%`)
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        logError('Failed to search posts', error)
        return []
      }

      return data || []
    } catch (error) {
      logError('Search posts error', error as Error)
      return []
    }
  }

  // Comment operations
  async getComments(postId: string): Promise<Comment[]> {
    try {
      const { data, error } = await this.supabase
        .from('comments_with_user_public')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (error) {
        logError('Failed to get comments', error)
        return []
      }

      return data || []
    } catch (error) {
      logError('Get comments error', error as Error)
      return []
    }
  }

  async createComment(comment: Omit<Comment, 'id' | 'created_at'>): Promise<Comment | null> {
    try {
      const { data, error } = await this.supabase
        .from('comments')
        .insert(comment)
        .select('id')
        .single()

      if (error) {
        logError('Failed to create comment', error)
        return null
      }

      // Read enriched row from the view
      const { data: enriched, error: viewError } = await this.supabase
        .from('comments_with_user_public')
        .select('*')
        .eq('id', data.id)
        .single()

      if (viewError) {
        logError('Failed to read created comment from view', viewError)
        return null
      }

      logInfo('Comment created successfully', { commentId: enriched.id })
      return enriched as unknown as Comment
    } catch (error) {
      logError('Create comment error', error as Error)
      return null
    }
  }

  // Like operations
  async toggleLike(postId: string, userId: string): Promise<boolean> {
    try {
      // Check if like exists
      const { data: existingLike } = await this.supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single()

      if (existingLike) {
        // Remove like
        const { error } = await this.supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId)

        if (error) {
          logError('Failed to remove like', error)
          return false
        }

        logInfo('Like removed successfully', { postId, userId })
        return false
      } else {
        // Add like
        const { error } = await this.supabase
          .from('likes')
          .insert({ post_id: postId, user_id: userId })

        if (error) {
          logError('Failed to add like', error)
          return false
        }

        logInfo('Like added successfully', { postId, userId })
        return true
      }
    } catch (error) {
      logError('Toggle like error', error as Error)
      return false
    }
  }

  async isPostLiked(postId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        logError('Failed to check if post is liked', error)
        return false
      }

      return !!data
    } catch (error) {
      logError('Is post liked error', error as Error)
      return false
    }
  }

  // Follow operations
  async toggleFollow(followerId: string, followingId: string): Promise<boolean> {
    try {
      // Check if follow exists
      const { data: existingFollow } = await this.supabase
        .from('follows')
        .select('id')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .single()

      if (existingFollow) {
        // Unfollow
        const { error } = await this.supabase
          .from('follows')
          .delete()
          .eq('follower_id', followerId)
          .eq('following_id', followingId)

        if (error) {
          logError('Failed to unfollow', error)
          return false
        }

        logInfo('Unfollowed successfully', { followerId, followingId })
        return false
      } else {
        // Follow
        const { error } = await this.supabase
          .from('follows')
          .insert({ follower_id: followerId, following_id: followingId })

        if (error) {
          logError('Failed to follow', error)
          return false
        }

        logInfo('Followed successfully', { followerId, followingId })
        return true
      }
    } catch (error) {
      logError('Toggle follow error', error as Error)
      return false
    }
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('follows')
        .select('id')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .single()

      if (error && error.code !== 'PGRST116') {
        logError('Failed to check if following', error)
        return false
      }

      return !!data
    } catch (error) {
      logError('Is following error', error as Error)
      return false
    }
  }

  async getFollowers(userId: string): Promise<User[]> {
    try {
      const { data, error } = await this.supabase
        .from('follows')
        .select(
          `
          follower:users!follower_id(*)
        `
        )
        .eq('following_id', userId)

      if (error) {
        logError('Failed to get followers', error)
        return []
      }

      return (data?.map((f: any) => f.follower) || []) as User[]
    } catch (error) {
      logError('Get followers error', error as Error)
      return []
    }
  }

  async getFollowing(userId: string): Promise<User[]> {
    try {
      const { data, error } = await this.supabase
        .from('follows')
        .select(
          `
          following:users!following_id(*)
        `
        )
        .eq('follower_id', userId)

      if (error) {
        logError('Failed to get following', error)
        return []
      }

      return (data?.map((f: any) => f.following) || []) as User[]
    } catch (error) {
      logError('Get following error', error as Error)
      return []
    }
  }

  // Search operations
  async searchUsers(query: string, limit = 20): Promise<User[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_public_profiles')
        .select('*')
        .or(`display_name.ilike.%${query}%, username.ilike.%${query}%, bio.ilike.%${query}%`)
        .limit(limit)

      if (error) {
        logError('Failed to search users', error)
        return []
      }

      return data || []
    } catch (error) {
      logError('Search users error', error as Error)
      return []
    }
  }

  // Message operations
  async getConversations(userId: string): Promise<Conversation[]> {
    if (!this.checkSupabaseConfig()) {
      return []
    }

    try {
      const { data, error } = await this.supabase
        .from('conversations_with_users_public')
        .select('*')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('updated_at', { ascending: false })

      if (error) {
        logError('Failed to get conversations', error)
        return []
      }

      return data || []
    } catch (error) {
      logError('Get conversations error', error as Error)
      return []
    }
  }

  async getMessages(conversationId: string, limit = 50): Promise<Message[]> {
    if (!this.checkSupabaseConfig()) {
      return []
    }

    try {
      const { data, error } = await this.supabase
        .from('messages_with_users_public')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(limit)

      if (error) {
        logError('Failed to get messages', error)
        return []
      }

      return data || []
    } catch (error) {
      logError('Get messages error', error as Error)
      return []
    }
  }

  async sendMessage(params: {
    sender_id: string
    receiver_id: string
    content: string
    conversation_id?: string
  }): Promise<Message | null> {
    if (!this.checkSupabaseConfig()) {
      return null
    }

    try {
      let conversationId = params.conversation_id

      // If no conversation ID provided, create or get existing conversation
      if (!conversationId) {
        const conversation = await this.createOrGetConversation(
          params.sender_id,
          params.receiver_id
        )
        if (!conversation) {
          logError('Failed to create or get conversation')
          return null
        }
        conversationId = conversation.id
      }

      const { data, error } = await this.supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: params.sender_id,
          receiver_id: params.receiver_id,
          content: params.content,
          read: false,
        })
        .select('id')
        .single()

      if (error) {
        logError('Failed to send message', error)
        return null
      }

      // Update conversation's last_message_id and updated_at
      await this.supabase
        .from('conversations')
        .update({
          last_message_id: data.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId)

      // Read enriched row from the view
      const { data: enriched, error: viewError } = await this.supabase
        .from('messages_with_users_public')
        .select('*')
        .eq('id', data.id)
        .single()

      if (viewError) {
        logError('Failed to read created message from view', viewError)
        return null
      }

      logInfo('Message sent successfully', { messageId: enriched.id })
      return enriched as unknown as Message
    } catch (error) {
      logError('Send message error', error as Error)
      return null
    }
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<boolean> {
    if (!this.checkSupabaseConfig()) {
      return false
    }

    try {
      const { error } = await this.supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .eq('receiver_id', userId)
        .eq('read', false)

      if (error) {
        logError('Failed to mark messages as read', error)
        return false
      }

      return true
    } catch (error) {
      logError('Mark messages as read error', error as Error)
      return false
    }
  }

  async createOrGetConversation(user1Id: string, user2Id: string): Promise<Conversation | null> {
    if (!this.checkSupabaseConfig()) {
      return null
    }

    try {
      // First try to find existing conversation
      const { data: existing } = await this.supabase
        .from('conversations')
        .select('*')
        .or(
          `and(user1_id.eq.${user1Id},user2_id.eq.${user2Id}),and(user1_id.eq.${user2Id},user2_id.eq.${user1Id})`
        )
        .single()

      if (existing) {
        return existing
      }

      // Create new conversation
      const { data, error } = await this.supabase
        .from('conversations')
        .insert({
          user1_id: user1Id,
          user2_id: user2Id,
        })
        .select()
        .single()

      if (error) {
        logError('Failed to create conversation', error)
        return null
      }

      return data
    } catch (error) {
      logError('Create or get conversation error', error as Error)
      return null
    }
  }

  // Application statistics operations
  async getApplicationStatistics(): Promise<Record<string, number>> {
    if (!this.checkSupabaseConfig()) {
      return {
        active_writers: 2400,
        stories_shared: 12000,
        published_works: 500,
        total_users: 5000,
      }
    }

    try {
      const { data, error } = await this.supabase
        .from('application_statistics')
        .select('stat_key, stat_value')

      if (error) {
        logError('Failed to get application statistics', error)
        return {}
      }

      const stats: Record<string, number> = {}
      data?.forEach(stat => {
        stats[stat.stat_key] = stat.stat_value
      })

      return stats
    } catch (error) {
      logError('Get application statistics error', error as Error)
      return {}
    }
  }

  async updateApplicationStatistics(): Promise<boolean> {
    if (!this.checkSupabaseConfig()) {
      return false
    }

    try {
      const { error } = await this.supabase.rpc('update_application_statistics')

      if (error) {
        logError('Failed to update application statistics', error)
        return false
      }

      return true
    } catch (error) {
      logError('Update application statistics error', error as Error)
      return false
    }
  }

  // User statistics operations
  async getUserStatistics(userId: string): Promise<UserStatistics | null> {
    if (!this.checkSupabaseConfig()) {
      return null
    }

    try {
      const { data, error } = await this.supabase
        .from('user_statistics')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        logError('Failed to get user statistics', error)
        return null
      }

      return data
    } catch (error) {
      logError('Get user statistics error', error as Error)
      return null
    }
  }

  async updateUserStatistics(userId: string): Promise<boolean> {
    if (!this.checkSupabaseConfig()) {
      return false
    }

    try {
      const { error } = await this.supabase.rpc('update_user_statistics', {
        target_user_id: userId,
      })

      if (error) {
        logError('Failed to update user statistics', error)
        return false
      }

      return true
    } catch (error) {
      logError('Update user statistics error', error as Error)
      return false
    }
  }

  // Writing goals operations
  async getWritingGoals(userId: string): Promise<WritingGoal[]> {
    if (!this.checkSupabaseConfig()) {
      return []
    }

    try {
      const { data, error } = await this.supabase
        .from('writing_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        logError('Failed to get writing goals', error)
        return []
      }

      return data || []
    } catch (error) {
      logError('Get writing goals error', error as Error)
      return []
    }
  }

  async createWritingGoal(
    goal: Omit<WritingGoal, 'id' | 'created_at' | 'updated_at'>
  ): Promise<WritingGoal | null> {
    if (!this.checkSupabaseConfig()) {
      return null
    }

    try {
      const { data, error } = await this.supabase
        .from('writing_goals')
        .insert(goal)
        .select()
        .single()

      if (error) {
        logError('Failed to create writing goal', error)
        return null
      }

      logInfo('Writing goal created successfully', { goalId: data.id })
      return data
    } catch (error) {
      logError('Create writing goal error', error as Error)
      return null
    }
  }

  async updateWritingGoal(
    goalId: string,
    updates: Partial<WritingGoal>
  ): Promise<WritingGoal | null> {
    if (!this.checkSupabaseConfig()) {
      return null
    }

    try {
      const { data, error } = await this.supabase
        .from('writing_goals')
        .update(updates)
        .eq('id', goalId)
        .select()
        .single()

      if (error) {
        logError('Failed to update writing goal', error)
        return null
      }

      logInfo('Writing goal updated successfully', { goalId })
      return data
    } catch (error) {
      logError('Update writing goal error', error as Error)
      return null
    }
  }

  // Writing sessions operations
  async getWritingSessions(userId: string, limit = 30): Promise<WritingSession[]> {
    if (!this.checkSupabaseConfig()) {
      return []
    }

    try {
      const { data, error } = await this.supabase
        .from('writing_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('session_date', { ascending: false })
        .limit(limit)

      if (error) {
        logError('Failed to get writing sessions', error)
        return []
      }

      return data || []
    } catch (error) {
      logError('Get writing sessions error', error as Error)
      return []
    }
  }

  async createWritingSession(
    session: Omit<WritingSession, 'id' | 'created_at'>
  ): Promise<WritingSession | null> {
    if (!this.checkSupabaseConfig()) {
      return null
    }

    try {
      const { data, error } = await this.supabase
        .from('writing_sessions')
        .insert(session)
        .select()
        .single()

      if (error) {
        logError('Failed to create writing session', error)
        return null
      }

      logInfo('Writing session created successfully', { sessionId: data.id })
      return data
    } catch (error) {
      logError('Create writing session error', error as Error)
      return null
    }
  }

  async getWritingStreak(userId: string): Promise<number> {
    if (!this.checkSupabaseConfig()) {
      return 0
    }

    try {
      const { data, error } = await this.supabase.rpc('calculate_writing_streak', {
        target_user_id: userId,
      })

      if (error) {
        logError('Failed to calculate writing streak', error)
        return 0
      }

      return data || 0
    } catch (error) {
      logError('Calculate writing streak error', error as Error)
      return 0
    }
  }

  // Post view tracking
  async trackPostView(
    postId: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    if (!this.checkSupabaseConfig()) {
      return
    }

    try {
      const { error } = await this.supabase.from('post_views').insert({
        post_id: postId,
        user_id: userId,
        ip_address: ipAddress,
        user_agent: userAgent,
      })

      if (error && error.code !== '23505') {
        // Ignore unique constraint violations (duplicate views)
        logError('Failed to track post view', error)
      }
    } catch (error) {
      logError('Track post view error', error as Error)
    }
  }

  async getPostViews(postId: string): Promise<number> {
    if (!this.checkSupabaseConfig()) {
      return 0
    }

    try {
      const { count, error } = await this.supabase
        .from('post_views')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId)

      if (error) {
        logError('Failed to get post views', error)
        return 0
      }

      return count || 0
    } catch (error) {
      logError('Get post views error', error as Error)
      return 0
    }
  }
}

// Export singleton instance
export const dbService = new DatabaseService()
