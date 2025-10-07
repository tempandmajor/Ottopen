import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'

/**
 * Server-side admin authorization check
 * Verifies user is authenticated and has admin privileges
 *
 * @throws Redirects to dashboard if not admin
 * @returns User object if admin
 */
export async function requireAdmin() {
  const supabase = await createServerSupabaseClient()

  // Check if user is authenticated
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError || !session?.user) {
    redirect('/auth/signin?error=auth-required&redirect=/admin')
  }

  const userId = session.user.id

  // Check if user has admin privileges
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('is_admin, account_type, display_name')
    .eq('id', userId)
    .single()

  if (userError || !userData) {
    redirect('/dashboard?error=user-not-found')
  }

  if (!userData.is_admin) {
    // Log unauthorized admin access attempt
    await supabase.from('security_events').insert({
      event_type: 'unauthorized_admin_access',
      user_id: userId,
      risk_score: 70,
      risk_factors: ['admin_access_attempt', 'unauthorized'],
      details: {
        attempted_path: '/admin',
        user_account_type: userData.account_type,
      },
    })

    redirect('/dashboard?error=admin-only')
  }

  // Log successful admin access
  await supabase.from('audit_logs').insert({
    user_id: userId,
    actor_type: 'user',
    action: 'admin.access',
    resource_type: 'admin_panel',
    severity: 'info',
    description: `Admin ${userData.display_name} accessed admin panel`,
  })

  return {
    ...session.user,
    is_admin: userData.is_admin,
    display_name: userData.display_name,
  }
}

/**
 * Check if user is admin (non-throwing version)
 * For conditional UI rendering
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) return false

    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', session.user.id)
      .single()

    return userData?.is_admin === true
  } catch {
    return false
  }
}
