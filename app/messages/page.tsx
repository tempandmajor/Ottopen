import MessagesClient from './MessagesClient'

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic'

export default function MessagesPage() {
  return <MessagesClient />
}
