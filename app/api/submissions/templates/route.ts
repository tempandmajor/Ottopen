export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's templates and public templates
    const { data: templates, error } = await supabase
      .from('submission_templates')
      .select('*')
      .or(`user_id.eq.${user.id},is_public.eq.true`)
      .order('usage_count', { ascending: false })

    if (error) {
      console.error('Templates error:', error)
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
    }

    return NextResponse.json(templates || [])
  } catch (error) {
    console.error('Templates error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, type, genre, template_data, is_public } = body

    if (!name || !type || !template_data) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, template_data' },
        { status: 400 }
      )
    }

    const { data: template, error } = await supabase
      .from('submission_templates')
      .insert({
        user_id: user.id,
        name,
        type,
        genre: genre || null,
        template_data,
        is_public: is_public || false,
      })
      .select()
      .single()

    if (error) {
      console.error('Create template error:', error)
      return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error('Create template error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
