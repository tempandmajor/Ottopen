// Database types for Supabase
// This file provides typed access to database tables

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          display_name: string
          username: string
          bio: string | null
          specialty: string | null
          avatar_url: string | null
          location: string | null
          website_url: string | null
          twitter_handle: string | null
          linkedin_url: string | null
          stripe_customer_id: string | null
          stripe_connect_account_id: string | null
          stripe_connect_onboarded: boolean | null
          stripe_connect_charges_enabled: boolean | null
          stripe_connect_payouts_enabled: boolean | null
          is_admin: boolean | null
          is_online: boolean | null
          last_seen: string | null
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
          industry_credentials: string | null
          company_name: string | null
          license_number: string | null
          open_for_collaboration: boolean | null
          accepting_beta_readers: boolean | null
          preferred_genres: string[] | null
          posts_last_30_days: number | null
          avg_post_engagement: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          display_name: string
          username: string
          bio?: string | null
          specialty?: string | null
          avatar_url?: string | null
          location?: string | null
          website_url?: string | null
          twitter_handle?: string | null
          linkedin_url?: string | null
          stripe_customer_id?: string | null
          stripe_connect_account_id?: string | null
          stripe_connect_onboarded?: boolean | null
          stripe_connect_charges_enabled?: boolean | null
          stripe_connect_payouts_enabled?: boolean | null
          is_admin?: boolean | null
          is_online?: boolean | null
          last_seen?: string | null
          account_type?:
            | 'writer'
            | 'platform_agent'
            | 'external_agent'
            | 'producer'
            | 'publisher'
            | 'theater_director'
            | 'reader_evaluator'
          account_tier?: 'free' | 'premium' | 'pro' | 'industry_basic' | 'industry_premium'
          verification_status?: 'pending' | 'verified' | 'rejected'
          industry_credentials?: string | null
          company_name?: string | null
          license_number?: string | null
          open_for_collaboration?: boolean | null
          accepting_beta_readers?: boolean | null
          preferred_genres?: string[] | null
          posts_last_30_days?: number | null
          avg_post_engagement?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string
          username?: string
          bio?: string | null
          specialty?: string | null
          avatar_url?: string | null
          location?: string | null
          website_url?: string | null
          twitter_handle?: string | null
          linkedin_url?: string | null
          stripe_customer_id?: string | null
          stripe_connect_account_id?: string | null
          stripe_connect_onboarded?: boolean | null
          stripe_connect_charges_enabled?: boolean | null
          stripe_connect_payouts_enabled?: boolean | null
          is_admin?: boolean | null
          is_online?: boolean | null
          last_seen?: string | null
          account_type?:
            | 'writer'
            | 'platform_agent'
            | 'external_agent'
            | 'producer'
            | 'publisher'
            | 'theater_director'
            | 'reader_evaluator'
          account_tier?: 'free' | 'premium' | 'pro' | 'industry_basic' | 'industry_premium'
          verification_status?: 'pending' | 'verified' | 'rejected'
          industry_credentials?: string | null
          company_name?: string | null
          license_number?: string | null
          open_for_collaboration?: boolean | null
          accepting_beta_readers?: boolean | null
          preferred_genres?: string[] | null
          posts_last_30_days?: number | null
          avg_post_engagement?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          excerpt: string | null
          image_url: string | null
          mood: string | null
          published: boolean
          genre: string | null
          content_type:
            | 'screenplay'
            | 'stage_play'
            | 'book'
            | 'short_story'
            | 'poetry'
            | 'article'
            | 'essay'
            | null
          reading_time_minutes: number | null
          completion_status: 'complete' | 'wip' | 'hiatus' | null
          created_at: string
          updated_at: string
          likes_count: number | null
          comments_count: number | null
          reshares_count: number | null
          views_count: number | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: string
          excerpt?: string | null
          image_url?: string | null
          mood?: string | null
          published?: boolean
          genre?: string | null
          content_type?:
            | 'screenplay'
            | 'stage_play'
            | 'book'
            | 'short_story'
            | 'poetry'
            | 'article'
            | 'essay'
            | null
          reading_time_minutes?: number | null
          completion_status?: 'complete' | 'wip' | 'hiatus' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          excerpt?: string | null
          image_url?: string | null
          mood?: string | null
          published?: boolean
          genre?: string | null
          content_type?:
            | 'screenplay'
            | 'stage_play'
            | 'book'
            | 'short_story'
            | 'poetry'
            | 'article'
            | 'essay'
            | null
          reading_time_minutes?: number | null
          completion_status?: 'complete' | 'wip' | 'hiatus' | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'posts_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      likes: {
        Row: {
          id: string
          post_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          id: string
          post_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          content?: string
          created_at?: string
        }
        Relationships: []
      }
      reshares: {
        Row: {
          id: string
          post_id: string
          user_id: string
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          comment?: string | null
          created_at?: string
        }
        Relationships: []
      }
      user_statistics: {
        Row: {
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
          last_activity_date: string | null
          updated_at: string
        }
        Insert: {
          user_id: string
          posts_count?: number
          published_posts_count?: number
          followers_count?: number
          following_count?: number
          likes_received_count?: number
          comments_received_count?: number
          current_streak_days?: number
          longest_streak_days?: number
          total_words_written?: number
          manuscripts_count?: number
          last_activity_date?: string | null
          updated_at?: string
        }
        Update: {
          user_id?: string
          posts_count?: number
          published_posts_count?: number
          followers_count?: number
          following_count?: number
          likes_received_count?: number
          comments_received_count?: number
          current_streak_days?: number
          longest_streak_days?: number
          total_words_written?: number
          manuscripts_count?: number
          last_activity_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      saved_searches: {
        Row: {
          id: string
          user_id: string
          query: string
          filters: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          query: string
          filters: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          query?: string
          filters?: Json
          created_at?: string
        }
        Relationships: []
      }
      user_social_links: {
        Row: {
          id: string
          user_id: string
          platform: string
          url: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          platform: string
          url: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          platform?: string
          url?: string
          created_at?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          user_id: string
          email_notifications: boolean
          push_notifications: boolean
          new_followers: boolean
          new_messages: boolean
          post_likes: boolean
          post_comments: boolean
          mentions: boolean
          newsletter: boolean
          profile_visibility: string
          show_in_directory: boolean
          allow_messages_from: string
          hide_location: boolean
          show_email: boolean
          show_followers: boolean
          searchable: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          email_notifications?: boolean
          push_notifications?: boolean
          new_followers?: boolean
          new_messages?: boolean
          post_likes?: boolean
          post_comments?: boolean
          mentions?: boolean
          newsletter?: boolean
          profile_visibility?: string
          show_in_directory?: boolean
          allow_messages_from?: string
          hide_location?: boolean
          show_email?: boolean
          show_followers?: boolean
          searchable?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          email_notifications?: boolean
          push_notifications?: boolean
          new_followers?: boolean
          new_messages?: boolean
          post_likes?: boolean
          post_comments?: boolean
          mentions?: boolean
          newsletter?: boolean
          profile_visibility?: string
          show_in_directory?: boolean
          allow_messages_from?: string
          hide_location?: boolean
          show_email?: boolean
          show_followers?: boolean
          searchable?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier access
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
