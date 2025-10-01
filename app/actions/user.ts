'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { User } from '@/src/lib/supabase'

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
          // Ignore
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch (error) {
          // Ignore
        }
      },
    },
  })
}

export async function updateUserProfileAction(
  userId: string,
  updates: Partial<User>
): Promise<{ success: boolean; error?: string; data?: User }> {
  try {
    const supabase = getServerSupabase()

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Failed to update user profile:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/settings')
    revalidatePath('/dashboard')
    revalidatePath(`/profile/${userId}`)
    return { success: true, data }
  } catch (error) {
    console.error('Update user profile error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function followUserAction(
  followerId: string,
  followingId: string
): Promise<{ success: boolean; error?: string; isFollowing: boolean }> {
  try {
    const supabase = getServerSupabase()

    // Check if follow exists
    const { data: existingFollow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single()

    if (existingFollow) {
      // Unfollow
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId)

      if (error) {
        console.error('Failed to unfollow:', error)
        return { success: false, error: error.message, isFollowing: true }
      }

      revalidatePath('/authors')
      revalidatePath(`/profile/${followingId}`)
      return { success: true, isFollowing: false }
    } else {
      // Follow
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: followerId, following_id: followingId })

      if (error) {
        console.error('Failed to follow:', error)
        return { success: false, error: error.message, isFollowing: false }
      }

      revalidatePath('/authors')
      revalidatePath(`/profile/${followingId}`)
      return { success: true, isFollowing: true }
    }
  } catch (error) {
    console.error('Follow user error:', error)
    return { success: false, error: 'An unexpected error occurred', isFollowing: false }
  }
}

export async function updateNotificationSettingsAction(
  userId: string,
  settings: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getServerSupabase()

    const { error } = await supabase
      .from('user_notification_settings')
      .upsert({ user_id: userId, ...settings }, { onConflict: 'user_id' })

    if (error) {
      console.error('Failed to update notification settings:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/settings')
    return { success: true }
  } catch (error) {
    console.error('Update notification settings error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function updatePrivacySettingsAction(
  userId: string,
  settings: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getServerSupabase()

    const { error } = await supabase
      .from('user_privacy_settings')
      .upsert({ user_id: userId, ...settings }, { onConflict: 'user_id' })

    if (error) {
      console.error('Failed to update privacy settings:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/settings')
    return { success: true }
  } catch (error) {
    console.error('Update privacy settings error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
