import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
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