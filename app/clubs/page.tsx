import { Metadata } from 'next'
import { ClubsView } from './ClubsView'

export const metadata: Metadata = {
  title: 'Book Clubs - Ottopen',
  description: 'Join writing communities, exchange critiques, and grow together',
}

export default function ClubsPage() {
  return <ClubsView />
}
