import { requireAuth } from '@/lib/server/auth'
import { AnalyticsView } from './AnalyticsView'

// User-specific analytics must not be cached
export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const user = await requireAuth()
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/analytics/user?days=30`, {
    cache: 'no-store',
  })
  const initialAnalytics = res.ok ? await res.json() : null

  return <AnalyticsView initialAnalytics={initialAnalytics} defaultDays="30" />
}
