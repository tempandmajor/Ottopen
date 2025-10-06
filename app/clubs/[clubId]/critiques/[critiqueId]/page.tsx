import { CritiqueDetailView } from './CritiqueDetailView'

export const dynamic = 'force-dynamic'

export default function CritiqueDetailPage({
  params,
}: {
  params: { clubId: string; critiqueId: string }
}) {
  return <CritiqueDetailView clubId={params.clubId} critiqueId={params.critiqueId} />
}
