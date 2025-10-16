import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { createRateLimitedHandler } from '@/src/lib/rate-limit-new'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'
import logger from '@/src/lib/logger'

export const dynamic = 'force-dynamic'

async function handleFollowMember(
  request: NextRequest,
  { params }: { params: { clubId: string; userId: string } }
) {
  try {
    const { user } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.id === params.userId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Check if already following
    const { data: existingFollow } = await supabase
      .from('member_follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', params.userId)
      .single()

    if (existingFollow) {
      // Unfollow
      const { error } = await supabase
        .from('member_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', params.userId)

      if (error) throw error

      return NextResponse.json({
        success: true,
        action: 'unfollowed',
      })
    } else {
      // Follow
      const { error } = await supabase.from('member_follows').insert({
        follower_id: user.id,
        following_id: params.userId,
      })

      if (error) throw error

      // Create notification
      await supabase.from('notifications').insert({
        user_id: params.userId,
        type: 'new_follower',
        title: 'New Follower',
        message: 'Someone started following you',
        action_url: `/profile/${user.id}`,
      })

      return NextResponse.json({
        success: true,
        action: 'followed',
      })
    }
  } catch (error: any) {
    logger.error('Follow member error:', error)
    return NextResponse.json(
      { error: 'Failed to follow member', details: error.message },
      { status: 500 }
    )
  }
}

export const POST = createRateLimitedHandler('api', handleFollowMember)
