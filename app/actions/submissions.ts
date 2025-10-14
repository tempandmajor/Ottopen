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

    // Server-side validation mirroring client
    if (!manuscript.title || !manuscript.title.trim()) {
      return { success: false, error: 'Title is required' }
    }
    if (!manuscript.type) {
      return { success: false, error: 'Type is required' }
    }
    if (!manuscript.genre || !manuscript.genre.trim()) {
      return { success: false, error: 'Genre is required' }
    }
    if (!manuscript.page_count || manuscript.page_count <= 0) {
      return { success: false, error: 'Valid page count is required' }
    }
    if (!manuscript.logline || !manuscript.logline.trim()) {
      return { success: false, error: 'Logline is required' }
    }
    if (manuscript.logline && manuscript.logline.length > 200) {
      return { success: false, error: 'Logline must be 200 characters or less' }
    }
    if (!manuscript.synopsis || !manuscript.synopsis.trim()) {
      return { success: false, error: 'Synopsis is required' }
    }
    if (manuscript.synopsis && manuscript.synopsis.length > 2000) {
      return { success: false, error: 'Synopsis must be 2000 characters or less' }
    }

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

    // Server-side validation for submission
    if (!submission.manuscript_id) {
      return { success: false, error: 'manuscript_id is required' }
    }
    if (!submission.submitter_id) {
      return { success: false, error: 'submitter_id is required' }
    }
    if (!submission.submission_type) {
      return { success: false, error: 'submission_type is required' }
    }

    // If reviewer_id provided, validate eligibility
    if ((submission as any).reviewer_id) {
      const reviewerId = (submission as any).reviewer_id as string
      const { data: eligible, error: eligErr } = await supabase
        .from('eligible_recipients')
        .select('id')
        .eq('id', reviewerId)
        .maybeSingle()
      if (eligErr) {
        console.error('Eligibility check failed:', eligErr)
        return { success: false, error: 'Failed to validate recipient eligibility' }
      }
      if (!eligible) {
        return {
          success: false,
          error: 'Selected recipient is not eligible to receive submissions',
        }
      }
    }

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
      .update({ status: 'withdrawn' })
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
