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

export async function GET(request: NextRequest): Promise<NextResponse<HealthCheck>> {
  const startTime = Date.now()
  const checks: HealthCheck['checks'] = {
    database: { status: 'down' },
    environment: { status: 'configured' },
  }

  // Check database connection
  try {
    const supabase = createServerSupabaseClient()
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

  // Check environment configuration
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
    'NEXTAUTH_SECRET',
  ]

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])

  if (missingVars.length > 0) {
    checks.environment = {
      status: 'misconfigured',
      missing: missingVars,
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
    version: process.env.npm_package_version || '0.0.0',
    checks,
  }

  // Return appropriate status code
  const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503

  return NextResponse.json(healthCheck, { status: statusCode })
}
