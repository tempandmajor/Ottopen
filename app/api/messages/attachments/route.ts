import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'

// POST /api/messages/attachments - Add attachment to message
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messageId, fileName, fileUrl, fileType, fileSize, mimeType, thumbnailUrl, duration } =
      await request.json()

    if (!messageId || !fileName || !fileUrl || !fileType) {
      return NextResponse.json(
        { error: 'Message ID, file name, URL, and type are required' },
        { status: 400 }
      )
    }

    // Verify the message belongs to the user
    const { data: message } = await supabase
      .from('messages')
      .select('sender_id')
      .eq('id', messageId)
      .single()

    if (!message || message.sender_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { data: attachment, error } = await supabase
      .from('message_attachments')
      .insert({
        message_id: messageId,
        file_name: fileName,
        file_url: fileUrl,
        file_type: fileType,
        file_size: fileSize,
        mime_type: mimeType,
        thumbnail_url: thumbnailUrl,
        duration: duration,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ attachment })
  } catch (error) {
    console.error('Error adding attachment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/messages/attachments?messageId=xxx - Get attachments for a message
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const searchParams = request.nextUrl.searchParams
    const messageId = searchParams.get('messageId')
    const conversationId = searchParams.get('conversationId')

    if (!messageId && !conversationId) {
      return NextResponse.json(
        { error: 'Message ID or Conversation ID is required' },
        { status: 400 }
      )
    }

    let attachments
    let error

    if (messageId) {
      const result = await supabase
        .from('message_attachments')
        .select(
          `
        *,
        message:messages(id, conversation_id, sender_id, created_at)
      `
        )
        .eq('message_id', messageId)
        .order('created_at', { ascending: false })

      attachments = result.data
      error = result.error
    } else if (conversationId) {
      // Get all messages in the conversation first
      const { data: messages } = await supabase
        .from('messages')
        .select('id')
        .eq('conversation_id', conversationId)

      if (messages && messages.length > 0) {
        const messageIds = messages.map(m => m.id)
        const result = await supabase
          .from('message_attachments')
          .select(
            `
          *,
          message:messages(id, conversation_id, sender_id, created_at)
        `
          )
          .in('message_id', messageIds)
          .order('created_at', { ascending: false })

        attachments = result.data
        error = result.error
      } else {
        attachments = []
        error = null
      }
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ attachments })
  } catch (error) {
    console.error('Error fetching attachments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/messages/attachments?attachmentId=xxx - Delete attachment
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
    const attachmentId = searchParams.get('attachmentId')

    if (!attachmentId) {
      return NextResponse.json({ error: 'Attachment ID is required' }, { status: 400 })
    }

    // Verify ownership
    const { data: attachment } = await supabase
      .from('message_attachments')
      .select('*, message:messages(sender_id)')
      .eq('id', attachmentId)
      .single()

    if (!attachment || attachment.message?.sender_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete from storage
    if (attachment.file_url) {
      const filePath = attachment.file_url.split('/').pop()
      if (filePath) {
        await supabase.storage.from('message-attachments').remove([filePath])
      }
    }

    // Delete record
    const { error } = await supabase.from('message_attachments').delete().eq('id', attachmentId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting attachment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
