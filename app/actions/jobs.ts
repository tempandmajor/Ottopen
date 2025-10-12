'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Job } from '@/src/lib/supabase'

function getServerSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const cookieStore = cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: Record<string, unknown>) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // Ignore
        }
      },
      remove(name: string, options: Record<string, unknown>) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch (error) {
          // Ignore
        }
      },
    },
  })
}

export async function createJobAction(
  job: Omit<Job, 'id' | 'created_at' | 'updated_at' | 'applications_count'>
): Promise<{ success: boolean; error?: string; data?: Job }> {
  try {
    const supabase = getServerSupabase()

    const { data, error } = await supabase.from('jobs').insert(job).select().single()

    if (error) {
      console.error('Failed to create job:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/opportunities')
    return { success: true, data }
  } catch (error) {
    console.error('Create job error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function saveJobAction(
  userId: string,
  jobId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getServerSupabase()

    const { error } = await supabase.from('job_saves').insert({ user_id: userId, job_id: jobId })

    if (error) {
      console.error('Failed to save job:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/opportunities')
    return { success: true }
  } catch (error) {
    console.error('Save job error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function unsaveJobAction(
  userId: string,
  jobId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getServerSupabase()

    const { error } = await supabase
      .from('job_saves')
      .delete()
      .eq('user_id', userId)
      .eq('job_id', jobId)

    if (error) {
      console.error('Failed to unsave job:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/opportunities')
    return { success: true }
  } catch (error) {
    console.error('Unsave job error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function applyToJobAction(
  jobId: string,
  applicantId: string,
  coverLetter: string,
  portfolioLinks?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getServerSupabase()

    const { data, error } = await supabase
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
      console.error('Failed to apply to job:', error)
      return { success: false, error: error.message }
    }

    // Update applications count
    await supabase.rpc('increment_job_applications', { job_id: jobId })

    revalidatePath('/opportunities')
    return { success: true }
  } catch (error) {
    console.error('Apply to job error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
