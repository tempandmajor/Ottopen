import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { ScriptService } from '@/src/lib/script-service'
import logger from '@/src/lib/logger'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// GET /api/scripts - List user's scripts
export async function GET(request: NextRequest) {
  try {
    const { user } = await getServerUser()
    if (!user) {
      console.info('scripts.GET: unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const script_type = searchParams.get('script_type') as any
    const status = searchParams.get('status') as any

    const scripts = await ScriptService.getUserScripts(user.id, {
      script_type,
      status,
    })

    console.info('scripts.GET: ok', { count: Array.isArray(scripts) ? scripts.length : 0 })
    return NextResponse.json({ scripts })
  } catch (error: any) {
    logger.error('Failed to list scripts:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/scripts - Create new script
export async function POST(request: NextRequest) {
  try {
    const { user } = await getServerUser()
    if (!user) {
      console.info('scripts.POST: unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const script = await ScriptService.create(user.id, body)

    console.info('scripts.POST: created', { id: script?.id })
    return NextResponse.json({ script }, { status: 201 })
  } catch (error: any) {
    logger.error('Failed to create script:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
