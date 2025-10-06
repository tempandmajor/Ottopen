import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'
import { VersionManager } from '@/src/lib/version-control/version-manager'

export const dynamic = 'force-dynamic'

// GET - List all versions
export async function GET(request: NextRequest, { params }: { params: { scriptId: string } }) {
  try {
    const supabase = createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify script access
    const { data: script } = await supabase
      .from('scripts')
      .select('id')
      .eq('id', params.scriptId)
      .eq('user_id', user.id)
      .single()

    if (!script) {
      return NextResponse.json({ error: 'Script not found' }, { status: 404 })
    }

    const versions = await VersionManager.getVersions(params.scriptId)

    return NextResponse.json({
      success: true,
      versions,
    })
  } catch (error: any) {
    console.error('Get versions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch versions', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create new version
export async function POST(request: NextRequest, { params }: { params: { scriptId: string } }) {
  try {
    const supabase = createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { versionName, description } = body

    // Verify script access
    const { data: script } = await supabase
      .from('scripts')
      .select('id')
      .eq('id', params.scriptId)
      .eq('user_id', user.id)
      .single()

    if (!script) {
      return NextResponse.json({ error: 'Script not found' }, { status: 404 })
    }

    const version = await VersionManager.createVersion(
      params.scriptId,
      user.id,
      versionName || `Version ${new Date().toISOString()}`,
      description
    )

    if (!version) {
      return NextResponse.json({ error: 'Failed to create version' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      version,
    })
  } catch (error: any) {
    console.error('Create version error:', error)
    return NextResponse.json(
      { error: 'Failed to create version', details: error.message },
      { status: 500 }
    )
  }
}
