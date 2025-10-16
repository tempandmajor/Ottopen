import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'
import logger from '@/src/lib/logger'

// PUT /api/messages/edit - Edit a message
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messageId, content } = await request.json()

    if (!messageId || !content?.trim()) {
      return NextResponse.json({ error: 'Message ID and content are required' }, { status: 400 })
    }

    // Get the current message
    const { data: currentMessage, error: fetchError } = await supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .eq('sender_id', user.id) // Only allow editing own messages
      .single()

    if (fetchError || !currentMessage) {
      return NextResponse.json({ error: 'Message not found or unauthorized' }, { status: 404 })
    }

    // Store the old content in edit history
    const { error: historyError } = await supabase.from('message_edit_history').insert({
      message_id: messageId,
      previous_content: currentMessage.content,
      edited_by: user.id,
    })

    if (historyError) {
      return NextResponse.json({ error: historyError.message }, { status: 500 })
    }

    // Update the message
    const { data: updatedMessage, error: updateError } = await supabase
      .from('messages')
      .update({
        content: content.trim(),
        edited_at: new Date().toISOString(),
      })
      .eq('id', messageId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ message: updatedMessage })
  } catch (error) {
    logger.error('Error editing message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/messages/edit?messageId=xxx - Get edit history for a message
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const searchParams = request.nextUrl.searchParams
    const messageId = searchParams.get('messageId')

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 })
    }

    const { data: history, error } = await supabase
      .from('message_edit_history')
      .select('*')
      .eq('message_id', messageId)
      .order('edited_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ history })
  } catch (error) {
    logger.error('Error fetching edit history:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/messages/edit - Delete a message
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

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 })
    }

    // Soft delete the message
    const { data: deletedMessage, error } = await supabase
      .from('messages')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user.id,
        content: '[Message deleted]',
      })
      .eq('id', messageId)
      .eq('sender_id', user.id) // Only allow deleting own messages
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: deletedMessage })
  } catch (error) {
    logger.error('Error deleting message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
