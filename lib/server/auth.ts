import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { redirect } from 'next/navigation'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { User } from '@/src/lib/supabase'
import type { Database } from '@/src/lib/database.types'

export async function getServerUser(): Promise<{
  user: (SupabaseUser & { profile?: User }) | null
  supabase: ReturnType<typeof createServerClient>
}> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return { user: null, supabase: null as any }
  }

  const cookieStore = cookies()

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // Cookie setting fails in Server Components, that's okay
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch (error) {
          // Cookie removal fails in Server Components, that's okay
        }
      },
    },
  })

  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser()

  if (!supabaseUser) {
    return { user: null, supabase }
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', supabaseUser.id)
    .single()

  return {
    user: profile ? { ...supabaseUser, profile } : supabaseUser,
    supabase,
  }
}

export async function requireAuth() {
  const { user } = await getServerUser()
  if (!user) {
    redirect('/auth/signin')
  }
  return user
}

export async function requireNoAuth() {
  const { user } = await getServerUser()
  if (user) {
    redirect('/dashboard')
  }
}
