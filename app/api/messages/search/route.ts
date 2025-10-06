import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'

// GET /api/messages/search?q=query&conversationId=xxx - Search messages
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
    const query = searchParams.get('q')
    const conversationId = searchParams.get('conversationId')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!query?.trim()) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
    }

    // Use the search_messages function if available, otherwise fallback to LIKE
    const searchQuery = query.trim().replace(/\s+/g, ' & ') // Convert to tsquery format

    let messagesQuery

    if (conversationId) {
      // Search within a specific conversation
      messagesQuery = supabase
        .from('messages')
        .select(
          `
          *,
          sender:users!sender_id(id, display_name, username, avatar_url)
        `
        )
        .eq('conversation_id', conversationId)
        .textSearch('content', searchQuery)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(limit)
    } else {
      // Search across all user's conversations
      const { data: userConversations } = await supabase
        .from('conversations')
        .select('id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)

      const conversationIds = userConversations?.map(c => c.id) || []

      messagesQuery = supabase
        .from('messages')
        .select(
          `
          *,
          sender:users!sender_id(id, display_name, username, avatar_url),
          conversation:conversations(id, user1_id, user2_id)
        `
        )
        .in('conversation_id', conversationIds)
        .textSearch('content', searchQuery)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(limit)
    }

    const { data: messages, error } = await messagesQuery

    if (error) {
      // Fallback to LIKE search if full-text search fails
      let fallbackQuery

      if (conversationId) {
        fallbackQuery = supabase
          .from('messages')
          .select(
            `
            *,
            sender:users!sender_id(id, display_name, username, avatar_url)
          `
          )
          .eq('conversation_id', conversationId)
          .ilike('content', `%${query}%`)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(limit)
      } else {
        const { data: userConversations } = await supabase
          .from('conversations')
          .select('id')
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)

        const conversationIds = userConversations?.map(c => c.id) || []

        fallbackQuery = supabase
          .from('messages')
          .select(
            `
            *,
            sender:users!sender_id(id, display_name, username, avatar_url),
            conversation:conversations(id, user1_id, user2_id)
          `
          )
          .in('conversation_id', conversationIds)
          .ilike('content', `%${query}%`)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(limit)
      }

      const { data: fallbackMessages, error: fallbackError } = await fallbackQuery

      if (fallbackError) {
        return NextResponse.json({ error: fallbackError.message }, { status: 500 })
      }

      return NextResponse.json({ messages: fallbackMessages || [] })
    }

    return NextResponse.json({ messages: messages || [] })
  } catch (error) {
    console.error('Error searching messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
