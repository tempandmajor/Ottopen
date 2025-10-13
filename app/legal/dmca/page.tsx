import { requireAuth } from '@/lib/server/auth'
import DMCAPageView from './DMCAPageView'

export const metadata = {
  title: 'DMCA Takedown - Ottopen',
  description: 'File or respond to copyright infringement notices',
}

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function DMCAPage() {
  const user = await requireAuth()

  return <DMCAPageView user={user} />
}
