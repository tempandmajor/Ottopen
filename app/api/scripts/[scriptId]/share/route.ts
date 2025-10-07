import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { ScriptService } from '@/src/lib/script-service'
import { randomBytes } from 'crypto'
import { logError } from '@/src/lib/errors'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// POST /api/scripts/[scriptId]/share - Generate shareable link with permissions
export async function POST(request: NextRequest, { params }: { params: { scriptId: string } }) {
  try {
    const { user, supabase } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const script = await ScriptService.getById(params.scriptId)
    if (!script) {
      return NextResponse.json({ error: 'Script not found' }, { status: 404 })
    }

    if (script.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { permission, expiresIn } = body // permission: 'read' | 'write' | 'comment'

    // SEC-FIX: Use cryptographically secure random token instead of UUID
    const token = randomBytes(32).toString('base64url')
    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null

    // Store share link in database
    const { data: shareLink, error } = await supabase
      .from('script_share_links')
      .insert({
        script_id: params.scriptId,
        token,
        permission,
        created_by: user.id,
        expires_at: expiresAt,
      })
      .select()
      .single()

    if (error) throw error

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/scripts/shared/${token}`

    return NextResponse.json({
      shareLink,
      url: shareUrl,
    })
  } catch (error: any) {
    logError(error, { context: 'create_share_link', scriptId: params.scriptId })
    return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 })
  }
}

// GET /api/scripts/[scriptId]/share - List all share links for script
export async function GET(request: NextRequest, { params }: { params: { scriptId: string } }) {
  try {
    const { user, supabase } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const script = await ScriptService.getById(params.scriptId)
    if (!script) {
      return NextResponse.json({ error: 'Script not found' }, { status: 404 })
    }

    if (script.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: shareLinks, error } = await supabase
      .from('script_share_links')
      .select('*')
      .eq('script_id', params.scriptId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ shareLinks })
  } catch (error: any) {
    logError(error, { context: 'get_share_links', scriptId: params.scriptId })
    return NextResponse.json({ error: 'Failed to get share links' }, { status: 500 })
  }
}
