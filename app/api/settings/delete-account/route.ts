import { NextRequest, NextResponse } from 'next/server'
import { dbService } from '@/src/lib/database'
import { getServerUser } from '@/lib/server/auth'
import { authService } from '@/src/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { password } = body

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    // Get authenticated user
    const { user, supabase } = await getServerUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id

    // Verify password
    const verifyResult = await authService.verifyCurrentPassword(password)
    if (!verifyResult.valid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    // Log the deletion activity before deleting
    try {
      await supabase.rpc('log_user_activity', {
        p_user_id: userId,
        p_action: 'account_deletion_initiated',
        p_details: { timestamp: new Date().toISOString() },
      })
    } catch (err) {
      console.error('Failed to log activity:', err)
    }

    // Delete user data in order (due to foreign key constraints)
    // The CASCADE should handle most of this, but we'll be explicit

    // 1. Delete posts (will cascade to comments, likes, etc.)
    await supabase.from('posts').delete().eq('user_id', userId)

    // 2. Delete follows (both directions)
    await supabase.from('follows').delete().eq('follower_id', userId)
    await supabase.from('follows').delete().eq('following_id', userId)

    // 3. Delete messages
    await supabase.from('messages').delete().eq('sender_id', userId)
    await supabase.from('messages').delete().eq('receiver_id', userId)

    // 4. Delete sessions
    await supabase.from('user_sessions').delete().eq('user_id', userId)

    // 5. Delete settings
    await supabase.from('notification_settings').delete().eq('user_id', userId)
    await supabase.from('privacy_settings').delete().eq('user_id', userId)

    // 6. Delete social links
    await supabase.from('user_social_links').delete().eq('user_id', userId)

    // 7. Delete blocked users
    await supabase.from('blocked_users').delete().eq('blocker_id', userId)
    await supabase.from('blocked_users').delete().eq('blocked_id', userId)

    // 8. Delete activity log
    await supabase.from('user_activity_log').delete().eq('user_id', userId)

    // 9. Delete user profile
    await supabase.from('users').delete().eq('id', userId)

    // 10. Delete auth user (Supabase Auth)
    const { error: authError } = await supabase.auth.admin.deleteUser(userId)
    if (authError) {
      console.error('Failed to delete auth user:', authError)
      // Continue anyway - user data is already deleted
    }

    // Sign out the user
    await supabase.auth.signOut()

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    })
  } catch (error) {
    console.error('Account deletion error:', error)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}
