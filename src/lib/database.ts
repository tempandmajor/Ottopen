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
  Job,
  JobApplication,
  Manuscript,
  Submission,
  ReferralCode,
  Referral,
  ReferralCredit,
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

  // Public getter for Supabase client (needed for real-time subscriptions)
  getSupabaseClient() {
    return this.supabase
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

  async searchPosts(query: string, limit = 20, offset = 0): Promise<Post[]> {
    try {
      const { data, error } = await this.supabase
        .from('posts_with_stats')
        .select('*')
        .or(`title.ilike.%${query}%, content.ilike.%${query}%`)
        .eq('published', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

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

  // Full-text search with filters
  async searchPostsFulltext(
    query: string,
    filters: {
      limit?: number
      offset?: number
      genre?: string
      contentType?: string
      published?: boolean
      minReadingTime?: number
      maxReadingTime?: number
      sortBy?: string
    } = {}
  ): Promise<Post[]> {
    try {
      const { data, error } = await this.supabase.rpc('search_posts_fulltext', {
        search_query: query,
        search_limit: filters.limit || 20,
        search_offset: filters.offset || 0,
        filter_genre: filters.genre || null,
        filter_content_type: filters.contentType || null,
        filter_published: filters.published ?? null,
        min_reading_time: filters.minReadingTime || null,
        max_reading_time: filters.maxReadingTime || null,
        sort_by: filters.sortBy || 'relevance',
      })

      if (error) {
        logError('Failed to search posts fulltext', error)
        return []
      }

      return data || []
    } catch (error) {
      logError('Search posts fulltext error', error as Error)
      return []
    }
  }

  async searchUsersFulltext(
    query: string,
    filters: {
      limit?: number
      offset?: number
      accountType?: string
      verified?: boolean
      sortBy?: string
    } = {}
  ): Promise<User[]> {
    try {
      const { data, error } = await this.supabase.rpc('search_users_fulltext', {
        search_query: query,
        search_limit: filters.limit || 20,
        search_offset: filters.offset || 0,
        filter_account_type: filters.accountType || null,
        filter_verified: filters.verified ?? null,
        sort_by: filters.sortBy || 'relevance',
      })

      if (error) {
        logError('Failed to search users fulltext', error)
        return []
      }

      return data || []
    } catch (error) {
      logError('Search users fulltext error', error as Error)
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
  async searchUsers(query: string, limit = 20, offset = 0): Promise<User[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_public_profiles')
        .select('*')
        .or(`display_name.ilike.%${query}%, username.ilike.%${query}%, bio.ilike.%${query}%`)
        .range(offset, offset + limit - 1)

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

  // PRIVACY: Get only users who opted into the directory
  async getOptedInAuthors(limit = 20, offset = 0): Promise<User[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_public_profiles')
        .select('*')
        .eq('show_in_directory', true)
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false })

      if (error) {
        logError('Failed to get opted-in authors', error)
        return []
      }

      return data || []
    } catch (error) {
      logError('Get opted-in authors error', error as Error)
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

  async getBulkUserStatistics(userIds: string[]): Promise<Map<string, UserStatistics>> {
    const statsMap = new Map<string, UserStatistics>()

    if (!this.checkSupabaseConfig() || userIds.length === 0) {
      return statsMap
    }

    try {
      const { data, error } = await this.supabase
        .from('user_statistics')
        .select('*')
        .in('user_id', userIds)

      if (error) {
        logError('Failed to get bulk user statistics', error)
        return statsMap
      }

      data?.forEach(stat => {
        statsMap.set(stat.user_id, stat)
      })

      return statsMap
    } catch (error) {
      logError('Get bulk user statistics error', error as Error)
      return statsMap
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

  // Job-related functions
  async getJobs(options?: {
    limit?: number
    category?: string
    jobType?: string
    experienceLevel?: string
    featured?: boolean
  }): Promise<Job[]> {
    if (!this.checkSupabaseConfig()) {
      return []
    }

    try {
      let query = this.supabase
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
        logError('Failed to fetch jobs', error)
        return []
      }

      return data || []
    } catch (error) {
      logError('Get jobs error', error as Error)
      return []
    }
  }

  async createJob(
    job: Omit<Job, 'id' | 'created_at' | 'updated_at' | 'applications_count'>
  ): Promise<Job | null> {
    if (!this.checkSupabaseConfig()) {
      return null
    }

    try {
      const { data, error } = await this.supabase.from('jobs').insert(job).select().single()

      if (error) {
        logError('Failed to create job', error)
        return null
      }

      return data
    } catch (error) {
      logError('Create job error', error as Error)
      return null
    }
  }

  async applyToJob(
    jobId: string,
    applicantId: string,
    coverLetter: string,
    portfolioLinks?: string
  ): Promise<JobApplication | null> {
    if (!this.checkSupabaseConfig()) {
      return null
    }

    try {
      const { data, error } = await this.supabase
        .from('job_applications')
        .insert({
          job_id: jobId,
          applicant_id: applicantId,
          cover_letter: coverLetter,
          portfolio_links: portfolioLinks,
          status: 'pending',
        })
        .select()
        .single()

      if (error) {
        logError('Failed to apply to job', error)
        return null
      }

      // Update applications count
      await this.supabase.rpc('increment_job_applications', { job_id: jobId })

      return data
    } catch (error) {
      logError('Apply to job error', error as Error)
      return null
    }
  }

  async getSavedJobs(userId: string): Promise<string[]> {
    if (!this.checkSupabaseConfig()) {
      return []
    }

    try {
      const { data, error } = await this.supabase
        .from('job_saves')
        .select('job_id')
        .eq('user_id', userId)

      if (error) {
        logError('Failed to get saved jobs', error)
        return []
      }

      return data?.map(save => save.job_id) || []
    } catch (error) {
      logError('Get saved jobs error', error as Error)
      return []
    }
  }

  async saveJob(userId: string, jobId: string): Promise<boolean> {
    if (!this.checkSupabaseConfig()) {
      return false
    }

    try {
      const { error } = await this.supabase
        .from('job_saves')
        .insert({ user_id: userId, job_id: jobId })

      if (error) {
        logError('Failed to save job', error)
        return false
      }

      return true
    } catch (error) {
      logError('Save job error', error as Error)
      return false
    }
  }

  async unsaveJob(userId: string, jobId: string): Promise<boolean> {
    if (!this.checkSupabaseConfig()) {
      return false
    }

    try {
      const { error } = await this.supabase
        .from('job_saves')
        .delete()
        .eq('user_id', userId)
        .eq('job_id', jobId)

      if (error) {
        logError('Failed to unsave job', error)
        return false
      }

      return true
    } catch (error) {
      logError('Unsave job error', error as Error)
      return false
    }
  }

  async getUserJobApplications(userId: string): Promise<JobApplication[]> {
    if (!this.checkSupabaseConfig()) {
      return []
    }

    try {
      const { data, error } = await this.supabase
        .from('job_applications')
        .select(
          `
          *,
          job:jobs(id, title, company, location, status)
        `
        )
        .eq('applicant_id', userId)
        .order('applied_at', { ascending: false })

      if (error) {
        logError('Failed to get user job applications', error)
        return []
      }

      return data || []
    } catch (error) {
      logError('Get user job applications error', error as Error)
      return []
    }
  }

  // Manuscript and Submission functions
  async getUserManuscripts(userId: string): Promise<Manuscript[]> {
    if (!this.checkSupabaseConfig()) {
      return []
    }

    try {
      const { data, error } = await this.supabase
        .from('manuscripts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        logError('Failed to get user manuscripts', error)
        return []
      }

      return data || []
    } catch (error) {
      logError('Get user manuscripts error', error as Error)
      return []
    }
  }

  async createManuscript(
    manuscript: Omit<Manuscript, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Manuscript | null> {
    if (!this.checkSupabaseConfig()) {
      return null
    }

    try {
      const { data, error } = await this.supabase
        .from('manuscripts')
        .insert(manuscript)
        .select()
        .single()

      if (error) {
        logError('Failed to create manuscript', error)
        return null
      }

      return data
    } catch (error) {
      logError('Create manuscript error', error as Error)
      return null
    }
  }

  async getUserSubmissions(userId: string): Promise<Submission[]> {
    if (!this.checkSupabaseConfig()) {
      return []
    }

    try {
      const { data, error } = await this.supabase
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
        logError('Failed to get user submissions', error)
        return []
      }

      return data || []
    } catch (error) {
      logError('Get user submissions error', error as Error)
      return []
    }
  }

  async createSubmission(
    submission: Omit<Submission, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Submission | null> {
    if (!this.checkSupabaseConfig()) {
      return null
    }

    try {
      const { data, error } = await this.supabase
        .from('submissions')
        .insert({
          ...submission,
          status: 'pending',
        })
        .select()
        .single()

      if (error) {
        logError('Failed to create submission', error)
        return null
      }

      return data
    } catch (error) {
      logError('Create submission error', error as Error)
      return null
    }
  }

  // Get user's liked posts
  async getUserLikedPosts(userId: string): Promise<Post[]> {
    if (!this.checkSupabaseConfig()) {
      return []
    }

    try {
      const { data, error } = await this.supabase
        .from('likes')
        .select(
          `
          post:posts(
            *,
            user:users!posts_user_id_fkey(id, username, display_name, avatar_url, account_type),
            likes_count,
            comments_count,
            views_count
          )
        `
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        logError('Failed to get user liked posts', error)
        return []
      }

      // Extract posts from the likes and filter out null posts
      const posts = data?.map(like => (like as any).post).filter(post => post) || []
      return posts
    } catch (error) {
      logError('Get user liked posts error', error as Error)
      return []
    }
  }

  // Get user's reshared posts (posts they've shared)
  async getUserResharedPosts(userId: string): Promise<Post[]> {
    if (!this.checkSupabaseConfig()) {
      return []
    }

    try {
      // For now, we'll return posts that mention being reshared by this user
      // In a real implementation, you might have a separate reshares table
      const { data, error } = await this.supabase
        .from('posts')
        .select(
          `
          *,
          user:users!posts_user_id_fkey(id, username, display_name, avatar_url, account_type),
          likes_count,
          comments_count,
          views_count
        `
        )
        .contains('content', `reshared by ${userId}`) // This is a placeholder implementation
        .eq('published', true)
        .order('created_at', { ascending: false })

      if (error) {
        logError('Failed to get user reshared posts', error)
        return []
      }

      return data || []
    } catch (error) {
      logError('Get user reshared posts error', error as Error)
      return []
    }
  }

  // Referral System functions
  async getUserReferralCode(userId: string): Promise<ReferralCode | null> {
    if (!this.checkSupabaseConfig()) {
      return null
    }

    try {
      const { data, error } = await this.supabase
        .from('referral_codes')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single()

      if (error && error.code !== 'PGRST116') {
        logError('Failed to get user referral code', error)
        return null
      }

      return data
    } catch (error) {
      logError('Get user referral code error', error as Error)
      return null
    }
  }

  async createReferralCode(userId: string): Promise<ReferralCode | null> {
    if (!this.checkSupabaseConfig()) {
      return null
    }

    try {
      // Generate unique code
      const userResult = await this.getUser(userId)
      const username =
        userResult?.data?.username || userResult?.data?.email?.split('@')[0] || 'user'
      const code = `${username.toUpperCase()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`

      const { data, error } = await this.supabase
        .from('referral_codes')
        .insert({
          user_id: userId,
          code,
          is_active: true,
          uses_count: 0,
        })
        .select()
        .single()

      if (error) {
        logError('Failed to create referral code', error)
        return null
      }

      return data
    } catch (error) {
      logError('Create referral code error', error as Error)
      return null
    }
  }

  async getUserReferrals(userId: string): Promise<Referral[]> {
    if (!this.checkSupabaseConfig()) {
      return []
    }

    try {
      const { data, error } = await this.supabase
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
        logError('Failed to get user referrals', error)
        return []
      }

      return data || []
    } catch (error) {
      logError('Get user referrals error', error as Error)
      return []
    }
  }

  async getReferralStats(userId: string): Promise<{
    totalReferrals: number
    confirmedReferrals: number
    pendingReferrals: number
    totalCredits: number
    usedCredits: number
    availableCredits: number
    currentStreak: number
  }> {
    if (!this.checkSupabaseConfig()) {
      return {
        totalReferrals: 0,
        confirmedReferrals: 0,
        pendingReferrals: 0,
        totalCredits: 0,
        usedCredits: 0,
        availableCredits: 0,
        currentStreak: 0,
      }
    }

    try {
      // Get referral stats
      const { data: referrals, error: referralsError } = await this.supabase
        .from('referrals')
        .select('status, credit_amount')
        .eq('referrer_id', userId)

      if (referralsError) {
        logError('Failed to get referral stats', referralsError)
        throw referralsError
      }

      // Get credit stats
      const { data: credits, error: creditsError } = await this.supabase
        .from('referral_credits')
        .select('credit_amount, used_amount')
        .eq('user_id', userId)

      if (creditsError) {
        logError('Failed to get referral credits', creditsError)
        throw creditsError
      }

      const totalReferrals = referrals?.length || 0
      const confirmedReferrals =
        referrals?.filter(r => r.status === 'confirmed' || r.status === 'credited').length || 0
      const pendingReferrals = referrals?.filter(r => r.status === 'pending').length || 0

      const totalCredits = credits?.reduce((sum, c) => sum + c.credit_amount, 0) || 0
      const usedCredits = credits?.reduce((sum, c) => sum + c.used_amount, 0) || 0
      const availableCredits = totalCredits - usedCredits

      // Calculate current streak (consecutive days with referrals)
      const currentStreak = this.calculateReferralStreak(referrals || [])

      return {
        totalReferrals,
        confirmedReferrals,
        pendingReferrals,
        totalCredits,
        usedCredits,
        availableCredits,
        currentStreak,
      }
    } catch (error) {
      logError('Get referral stats error', error as Error)
      return {
        totalReferrals: 0,
        confirmedReferrals: 0,
        pendingReferrals: 0,
        totalCredits: 0,
        usedCredits: 0,
        availableCredits: 0,
        currentStreak: 0,
      }
    }
  }

  private calculateReferralStreak(referrals: any[]): number {
    if (!referrals.length) return 0

    // Sort referrals by date
    const sortedReferrals = referrals
      .filter(r => r.status === 'confirmed' || r.status === 'credited')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    if (!sortedReferrals.length) return 0

    let streak = 1
    const today = new Date()
    const mostRecent = new Date(sortedReferrals[0].created_at)

    // Check if most recent referral was within the last 7 days
    const daysDiff = Math.floor((today.getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24))
    if (daysDiff > 7) return 0

    // Count consecutive weeks with referrals
    for (let i = 1; i < sortedReferrals.length; i++) {
      const current = new Date(sortedReferrals[i - 1].created_at)
      const previous = new Date(sortedReferrals[i].created_at)
      const weeksDiff = Math.floor(
        (current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24 * 7)
      )

      if (weeksDiff <= 2) {
        // Allow up to 2 weeks gap
        streak++
      } else {
        break
      }
    }

    return streak
  }

  async getUsersWithFilters(
    options: {
      specialty?: string
      location?: string
      limit?: number
      offset?: number
    } = {}
  ): Promise<User[]> {
    if (!this.checkSupabaseConfig()) {
      return []
    }

    try {
      let query = this.supabase.from('user_public_profiles').select('*')

      if (options.specialty && options.specialty !== 'all') {
        query = query.eq('specialty', options.specialty)
      }

      if (options.location) {
        query = query.ilike('location', `%${options.location}%`)
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(options.offset || 0, (options.offset || 0) + (options.limit || 20) - 1)

      if (error) {
        logError('Failed to get users with filters', error)
        return []
      }

      return data || []
    } catch (error) {
      logError('Get users with filters error', error as Error)
      return []
    }
  }
}

// Export singleton instance
export const dbService = new DatabaseService()
