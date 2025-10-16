import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'
import logger from '@/src/lib/logger'

// POST /api/messages/reactions - Add reaction to message
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messageId, emoji } = await request.json()

    if (!messageId || !emoji) {
      return NextResponse.json({ error: 'Message ID and emoji are required' }, { status: 400 })
    }

    // Add reaction
    const { data: reaction, error } = await supabase
      .from('message_reactions')
      .insert({
        message_id: messageId,
        user_id: user.id,
        emoji: emoji,
      })
      .select()
      .single()

    if (error) {
      // If duplicate, remove the reaction instead (toggle behavior)
      if (error.code === '23505') {
        const { error: deleteError } = await supabase
          .from('message_reactions')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', user.id)
          .eq('emoji', emoji)

        if (deleteError) {
          return NextResponse.json({ error: deleteError.message }, { status: 500 })
        }

        return NextResponse.json({ removed: true })
      }

      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ reaction })
  } catch (error) {
    logger.error('Error adding reaction:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/messages/reactions?messageId=xxx - Get reactions for a message
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const searchParams = request.nextUrl.searchParams
    const messageId = searchParams.get('messageId')

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 })
    }

    const { data: reactions, error } = await supabase
      .from('message_reactions')
      .select('*')
      .eq('message_id', messageId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Group reactions by emoji
    const groupedReactions = reactions.reduce(
      (acc, reaction) => {
        if (!acc[reaction.emoji]) {
          acc[reaction.emoji] = {
            emoji: reaction.emoji,
            count: 0,
            users: [],
          }
        }
        acc[reaction.emoji].count++
        acc[reaction.emoji].users.push(reaction.user_id)
        return acc
      },
      {} as Record<string, { emoji: string; count: number; users: string[] }>
    )

    return NextResponse.json({ reactions: Object.values(groupedReactions) })
  } catch (error) {
    logger.error('Error fetching reactions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/messages/reactions?messageId=xxx&emoji=xxx - Remove reaction
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const messageId = searchParams.get('messageId')
    const emoji = searchParams.get('emoji')

    if (!messageId || !emoji) {
      return NextResponse.json({ error: 'Message ID and emoji are required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('message_reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', user.id)
      .eq('emoji', emoji)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Error removing reaction:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
