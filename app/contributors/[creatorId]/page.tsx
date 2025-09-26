import CreatorPageClient from './client-component'

// Generate static params for known creators
export async function generateStaticParams() {
 return [
  {
   creatorId: 'jasmine-aikey',
  },
  // Add more creator IDs as they are added to the platform
 ]
}

export default function CreatorPage({ params }: { params: { creatorId: string } }) {
 return <CreatorPageClient creatorId={params.creatorId} />
}