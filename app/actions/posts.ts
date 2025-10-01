'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Post } from '@/src/lib/supabase'

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

export async function createPostAction(
  post: Omit<Post, 'id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; error?: string; data?: Post }> {
  try {
    const supabase = getServerSupabase()

    const { data, error } = await supabase.from('posts').insert(post).select().single()

    if (error) {
      console.error('Failed to create post:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/feed')
    revalidatePath('/dashboard')
    return { success: true, data }
  } catch (error) {
    console.error('Create post error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function updatePostAction(
  postId: string,
  updates: Partial<Post>
): Promise<{ success: boolean; error?: string; data?: Post }> {
  try {
    const supabase = getServerSupabase()

    const { data, error } = await supabase
      .from('posts')
      .update(updates)
      .eq('id', postId)
      .select()
      .single()

    if (error) {
      console.error('Failed to update post:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/feed')
    revalidatePath('/dashboard')
    revalidatePath(`/posts/${postId}`)
    return { success: true, data }
  } catch (error) {
    console.error('Update post error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function deletePostAction(
  postId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getServerSupabase()

    const { error } = await supabase.from('posts').delete().eq('id', postId)

    if (error) {
      console.error('Failed to delete post:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/feed')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Delete post error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function likePostAction(
  postId: string,
  userId: string
): Promise<{ success: boolean; error?: string; liked: boolean }> {
  try {
    const supabase = getServerSupabase()

    // Check if like exists
    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single()

    if (existingLike) {
      // Remove like
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId)

      if (error) {
        console.error('Failed to remove like:', error)
        return { success: false, error: error.message, liked: false }
      }

      revalidatePath('/feed')
      revalidatePath(`/posts/${postId}`)
      return { success: true, liked: false }
    } else {
      // Add like
      const { error } = await supabase.from('likes').insert({ post_id: postId, user_id: userId })

      if (error) {
        console.error('Failed to add like:', error)
        return { success: false, error: error.message, liked: false }
      }

      revalidatePath('/feed')
      revalidatePath(`/posts/${postId}`)
      return { success: true, liked: true }
    }
  } catch (error) {
    console.error('Like post error:', error)
    return { success: false, error: 'An unexpected error occurred', liked: false }
  }
}

export async function createCommentAction(
  postId: string,
  userId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getServerSupabase()

    const { error } = await supabase.from('comments').insert({
      post_id: postId,
      user_id: userId,
      content,
    })

    if (error) {
      console.error('Failed to create comment:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/feed')
    revalidatePath(`/posts/${postId}`)
    return { success: true }
  } catch (error) {
    console.error('Create comment error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
