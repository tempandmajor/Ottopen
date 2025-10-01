import { requireAuth } from '@/lib/server/auth'
import {
  getServerUserReferralCode,
  getServerUserReferrals,
  getServerReferralStats,
} from '@/lib/server/data'
import { ReferralsView } from './ReferralsView'

export default async function ReferralsPage() {
  const user = await requireAuth()
  const userId = user.profile?.id || user.id

  const [referralCode, referrals, stats] = await Promise.all([
    getServerUserReferralCode(userId),
    getServerUserReferrals(userId),
    getServerReferralStats(userId),
  ])

  return (
    <ReferralsView user={user} referralCode={referralCode} referrals={referrals} stats={stats} />
  )
}
