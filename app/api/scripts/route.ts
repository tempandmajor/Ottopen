import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server/auth'
import { ScriptService } from '@/src/lib/script-service'

// GET /api/scripts - List user's scripts
export async function GET(request: NextRequest) {
  try {
    const { user } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const script_type = searchParams.get('script_type') as any
    const status = searchParams.get('status') as any

    const scripts = await ScriptService.getUserScripts(user.id, {
      script_type,
      status,
    })

    return NextResponse.json({ scripts })
  } catch (error: any) {
    console.error('Failed to list scripts:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/scripts - Create new script
export async function POST(request: NextRequest) {
  try {
    const { user } = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const script = await ScriptService.create(user.id, body)

    return NextResponse.json({ script }, { status: 201 })
  } catch (error: any) {
    console.error('Failed to create script:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
