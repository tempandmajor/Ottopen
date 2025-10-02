import { Metadata } from 'next'
import { ClubDetailView } from './ClubDetailView'

export const metadata: Metadata = {
  title: 'Club - Ottopen',
}

export default function ClubDetailPage({ params }: { params: { clubId: string } }) {
  return <ClubDetailView clubId={params.clubId} />
}
