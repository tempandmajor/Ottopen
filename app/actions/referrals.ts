'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { ReferralCode } from '@/src/lib/supabase'

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

export async function createReferralCodeAction(
  userId: string
): Promise<{ success: boolean; error?: string; data?: ReferralCode }> {
  try {
    const supabase = getServerSupabase()

    // Get user info
    const { data: user } = await supabase
      .from('users')
      .select('username, email')
      .eq('id', userId)
      .single()

    const username = user?.username || user?.email?.split('@')[0] || 'user'
    const code = `${username.toUpperCase()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    const { data, error } = await supabase
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
      console.error('Failed to create referral code:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/referrals')
    return { success: true, data }
  } catch (error) {
    console.error('Create referral code error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function deactivateReferralCodeAction(
  codeId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getServerSupabase()

    const { error } = await supabase
      .from('referral_codes')
      .update({ is_active: false })
      .eq('id', codeId)

    if (error) {
      console.error('Failed to deactivate referral code:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/referrals')
    return { success: true }
  } catch (error) {
    console.error('Deactivate referral code error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
