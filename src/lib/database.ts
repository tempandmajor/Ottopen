import { supabase } from './supabase'
import { logError, logInfo } from './logger'
import type { User, Post, Comment, Like, Follow } from './supabase'

export class DatabaseService {
  private supabase: typeof supabase

  constructor(client?: typeof supabase) {
    this.supabase = client || supabase
  }

  // User operations
  async getUser(id: string): Promise<User | null> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        logError('Failed to get user', error)
        return null
      }

      return data
    } catch (error) {
      logError('Get user error', error as Error)
      return null
    }
  }

  async getUserByUsername(username: string): Promise<User | null> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single()

      if (error) {
        logError('Failed to get user by username', error)
        return null
      }

      return data
    } catch (error) {
      logError('Get user by username error', error as Error)
      return null
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
      const { data, error } = await this.supabase
        .rpc('get_user_stats', { user_uuid: userId })

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
  async getPosts(options: {
    limit?: number
    offset?: number
    userId?: string
    published?: boolean
  } = {}): Promise<Post[]> {
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
      const { data, error } = await this.supabase
        .from('posts')
        .insert(post)
        .select()
        .single()

      if (error) {
        logError('Failed to create post', error)
        return null
      }

      logInfo('Post created successfully', { postId: data.id })
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
      const { error } = await this.supabase
        .from('posts')
        .delete()
        .eq('id', id)

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
        .from('comments')
        .select(`
          *,
          user:users(*)
        `)
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
        .select(`
          *,
          user:users(*)
        `)
        .single()

      if (error) {
        logError('Failed to create comment', error)
        return null
      }

      logInfo('Comment created successfully', { commentId: data.id })
      return data
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
        .select(`
          follower:users!follower_id(*)
        `)
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
        .select(`
          following:users!following_id(*)
        `)
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
        .from('users')
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
}

// Export singleton instance
export const dbService = new DatabaseService()