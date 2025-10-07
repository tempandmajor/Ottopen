import EnhancedFeedView from './EnhancedFeedView'

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic'

export default function Feed() {
  return <EnhancedFeedView />
}
