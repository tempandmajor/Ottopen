'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Manuscript, Submission } from '@/src/lib/supabase'

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

export async function createManuscriptAction(
  manuscript: Omit<Manuscript, 'id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; error?: string; data?: Manuscript }> {
  try {
    const supabase = getServerSupabase()

    const { data, error } = await supabase.from('manuscripts').insert(manuscript).select().single()

    if (error) {
      console.error('Failed to create manuscript:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/submissions')
    return { success: true, data }
  } catch (error) {
    console.error('Create manuscript error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function updateManuscriptAction(
  manuscriptId: string,
  updates: Partial<Manuscript>
): Promise<{ success: boolean; error?: string; data?: Manuscript }> {
  try {
    const supabase = getServerSupabase()

    const { data, error } = await supabase
      .from('manuscripts')
      .update(updates)
      .eq('id', manuscriptId)
      .select()
      .single()

    if (error) {
      console.error('Failed to update manuscript:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/submissions')
    return { success: true, data }
  } catch (error) {
    console.error('Update manuscript error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function createSubmissionAction(
  submission: Omit<Submission, 'id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; error?: string; data?: Submission }> {
  try {
    const supabase = getServerSupabase()

    const { data, error } = await supabase
      .from('submissions')
      .insert({
        ...submission,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create submission:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/submissions')
    return { success: true, data }
  } catch (error) {
    console.error('Create submission error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function withdrawSubmissionAction(
  submissionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getServerSupabase()

    const { error } = await supabase
      .from('submissions')
      .update({ status: 'rejected' })
      .eq('id', submissionId)

    if (error) {
      console.error('Failed to withdraw submission:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/submissions')
    return { success: true }
  } catch (error) {
    console.error('Withdraw submission error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
