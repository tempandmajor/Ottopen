import { requireAuth } from '@/lib/server/auth'
import SearchPageView from './SearchPageView'

export const metadata = {
  title: 'Search - Ottopen',
  description: 'Search for works, authors, and content',
}

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function SearchPage() {
  const user = await requireAuth()

  return <SearchPageView user={user} />
}
