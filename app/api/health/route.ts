import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'
import { env } from '@/src/lib/env'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  checks: {
    database: {
      status: 'up' | 'down'
      latency?: number
      error?: string
    }
    environment: {
      status: 'configured' | 'misconfigured'
      missing?: string[]
    }
  }
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<HealthCheck | { status: string }>> {
  const { searchParams } = new URL(request.url)
  const detailed = searchParams.get('detailed')

  // Public endpoint - minimal info only
  if (detailed !== 'true') {
    return NextResponse.json({ status: 'healthy' }, { status: 200 })
  }

  // Detailed endpoint - require admin authentication
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Check if user is admin
  if (!user) {
    return NextResponse.json({ status: 'healthy' }, { status: 200 })
  }

  const { data: userProfile } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!userProfile?.is_admin) {
    return NextResponse.json({ status: 'healthy' }, { status: 200 })
  }

  // Admin authenticated - return detailed health check
  const startTime = Date.now()
  const checks: HealthCheck['checks'] = {
    database: { status: 'down' },
    environment: { status: 'configured' },
  }

  // Check database connection
  try {
    const dbStart = Date.now()

    // Simple query to check connection
    const { data, error } = await supabase.from('users').select('id').limit(1).single()

    const dbLatency = Date.now() - dbStart

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" which is fine
      checks.database = {
        status: 'down',
        error: error.message,
      }
    } else {
      checks.database = {
        status: 'up',
        latency: dbLatency,
      }
    }
  } catch (error) {
    checks.database = {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }

  // Check environment configuration (basic check only, no specific vars)
  const hasRequiredEnv = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.STRIPE_SECRET_KEY
  )

  if (!hasRequiredEnv) {
    checks.environment = {
      status: 'misconfigured',
      missing: ['Some required environment variables'],
    }
  }

  // Determine overall health status
  let status: HealthCheck['status'] = 'healthy'

  if (checks.database.status === 'down' || checks.environment.status === 'misconfigured') {
    status = 'unhealthy'
  } else if (checks.database.latency && checks.database.latency > 1000) {
    status = 'degraded'
  }

  const healthCheck: HealthCheck = {
    status,
    timestamp: new Date().toISOString(),
    version: 'production',
    checks,
  }

  // Return appropriate status code
  const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503

  return NextResponse.json(healthCheck, { status: statusCode })
}
