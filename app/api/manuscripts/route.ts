import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'

// GET /api/manuscripts - list current user's manuscripts
export async function GET() {
  const supabase = createServerSupabaseClient() as any
  const {
    data: { user },
    error: sessionError,
  } = await supabase.auth.getUser()

  if (sessionError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('manuscripts')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ manuscripts: data || [] })
}

// POST /api/manuscripts - create a new manuscript for current user
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient() as any
  const {
    data: { user },
    error: sessionError,
  } = await supabase.auth.getUser()

  if (sessionError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: any = {}
  try {
    body = await request.json()
  } catch (_) {
    // ignore, allow empty body
  }

  const title =
    typeof body?.title === 'string' && body.title.trim() ? body.title.trim() : 'Untitled Manuscript'
  const genre = typeof body?.genre === 'string' && body.genre.trim() ? body.genre.trim() : 'fiction'
  const type = typeof body?.type === 'string' && body.type.trim() ? body.type.trim() : 'book'
  const logline =
    typeof body?.logline === 'string' ? body.logline : 'A new story waiting to be told'
  const synopsis = typeof body?.synopsis === 'string' ? body.synopsis : 'Synopsis to be written...'

  const insertPayload = {
    user_id: user.id,
    title,
    genre,
    type,
    logline,
    synopsis,
    page_count: 0,
    target_word_count: 80000,
  }

  const { data, error } = await supabase
    .from('manuscripts')
    .insert(insertPayload)
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ manuscript: data }, { status: 201 })
}
