import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'
import logger from '@/src/lib/logger'

// GET /api/messages/threads?parentMessageId=xxx - Get thread replies
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const parentMessageId = searchParams.get('parentMessageId')
    const threadId = searchParams.get('threadId')

    if (!parentMessageId && !threadId) {
      return NextResponse.json(
        { error: 'Parent message ID or thread ID is required' },
        { status: 400 }
      )
    }

    let query = supabase.from('messages').select(`
        *,
        sender:users!sender_id(id, display_name, username, avatar_url),
        reactions:message_reactions(id, emoji, user_id),
        attachments:message_attachments(*)
      `)

    if (parentMessageId) {
      query = query.eq('parent_message_id', parentMessageId)
    } else if (threadId) {
      query = query.eq('thread_id', threadId)
    }

    const { data: replies, error } = await query
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ replies })
  } catch (error) {
    logger.error('Error fetching thread replies:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/messages/threads - Create a reply in a thread
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { parentMessageId, content, conversationId } = await request.json()

    if (!parentMessageId || !content?.trim() || !conversationId) {
      return NextResponse.json(
        { error: 'Parent message ID, content, and conversation ID are required' },
        { status: 400 }
      )
    }

    // Get parent message to set thread_id
    const { data: parentMessage } = await supabase
      .from('messages')
      .select('thread_id, sender_id, receiver_id')
      .eq('id', parentMessageId)
      .single()

    if (!parentMessage) {
      return NextResponse.json({ error: 'Parent message not found' }, { status: 404 })
    }

    // Determine receiver_id (opposite of sender in parent message)
    const receiverId =
      parentMessage.sender_id === user.id ? parentMessage.receiver_id : parentMessage.sender_id

    // Create reply
    const { data: reply, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        receiver_id: receiverId,
        content: content.trim(),
        parent_message_id: parentMessageId,
        thread_id: parentMessage.thread_id || parentMessageId, // Use existing thread_id or create new
      })
      .select(
        `
        *,
        sender:users!sender_id(id, display_name, username, avatar_url)
      `
      )
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ reply })
  } catch (error) {
    logger.error('Error creating thread reply:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
