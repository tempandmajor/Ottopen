export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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
    const action = body.action

    if (action === 'increment_usage') {
      // Increment usage count
      const { data, error } = await supabase.rpc('increment_template_usage', {
        template_id: params.id,
      })

      if (error) {
        console.error('Increment usage error:', error)

        // Fallback: fetch current count and increment
        const { data: template } = await supabase
          .from('submission_templates')
          .select('usage_count')
          .eq('id', params.id)
          .single()

        if (template) {
          const { data: updated, error: updateError } = await supabase
            .from('submission_templates')
            .update({
              usage_count: (template.usage_count || 0) + 1,
            })
            .eq('id', params.id)
            .select()
            .single()

          if (updateError) {
            return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
          }

          return NextResponse.json(updated)
        }

        return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
      }

      return NextResponse.json(data)
    }

    // Regular update
    const { name, type, genre, template_data, is_public } = body

    const { data, error } = await supabase
      .from('submission_templates')
      .update({
        name,
        type,
        genre,
        template_data,
        is_public,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('user_id', user.id) // Ensure user owns the template
      .select()
      .single()

    if (error) {
      console.error('Update template error:', error)
      return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Update template error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { error } = await supabase
      .from('submission_templates')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id) // Ensure user owns the template

    if (error) {
      console.error('Delete template error:', error)
      return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete template error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
