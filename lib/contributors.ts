export type Contributor = {
  name: string
  role: string
  avatarUrl: string
  heroImageUrl?: string
  tagline?: string
  badges?: string[]
  featured?: boolean
  links?: {
    github?: string
    twitter?: string
    website?: string
  }
}

// TODO: Replace placeholder entries with your real contributors from the previous repo
export const contributors: Contributor[] = [
  // Featured
  {
    name: 'Jasmine Aikey',
    role: 'Lead Soccer Contributor',
    avatarUrl: 'https://gostanford.com/imgproxy/bnk7b_7ewE7DRiny7Gl_9NJhuQA_CgYhBLoy36Mn_1w/rs:fit:1980:0:0/g:ce/q:90/aHR0cHM6Ly9zdG9yYWdlLmdvb2dsZWFwaXMuY29tL3N0YW5mb3JkLXByb2QvMjAyNC8wMS8yMi9hVWtTYVlvVlpabnJGS0VFaHhEUDdENkZHZEVSSHQ0MDNFcjZEaTZZLmpwZw.jpg',
    heroImageUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=1470&auto=format&fit=crop',
    tagline: 'All-America • Pac-12 Midfielder of the Year • College Cup',
    badges: [
      'All-America First Team',
      'Pac-12 Midfielder of the Year',
      'College Cup Appearances'
    ],
    featured: true,
    links: {
      website: '/gear'
    }
  },
]


