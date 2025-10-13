import { requireAuth } from '@/lib/server/auth'
import { RevenueAnalyticsView } from './RevenueAnalyticsView'

// User-specific analytics must not be cached
export const dynamic = 'force-dynamic'

export default async function RevenueAnalyticsPage() {
  const user = await requireAuth()
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/analytics/revenue?type=writer&days=30`,
    { cache: 'no-store' }
  )
  const initialAnalytics = res.ok ? await res.json() : null

  return <RevenueAnalyticsView initialAnalytics={initialAnalytics} defaultDays="30" />
}
