import CreatorPageClient from './client-component'

// Force dynamic rendering to avoid build-time errors
export const dynamic = 'force-dynamic'

export default function CreatorPage({ params }: { params: { creatorId: string } }) {
 return <CreatorPageClient creatorId={params.creatorId} />
}