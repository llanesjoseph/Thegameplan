'use client'

import { Facebook, Instagram, Linkedin, Twitter, Youtube } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

type SocialLink = {
  href: string
  label: string
  icon: LucideIcon
}

const SOCIAL_LINKS: SocialLink[] = [
  {
    href: 'https://www.linkedin.com/company/athleap',
    icon: Linkedin,
    label: 'LinkedIn'
  },
  {
    href: 'https://www.facebook.com/athleap',
    icon: Facebook,
    label: 'Facebook'
  },
  {
    href: 'https://twitter.com/athleap',
    icon: Twitter,
    label: 'Twitter'
  },
  {
    href: 'https://www.instagram.com/athleap',
    icon: Instagram,
    label: 'Instagram'
  },
  {
    href: 'https://www.youtube.com/@athleap',
    icon: Youtube,
    label: 'YouTube'
  }
]

export default function GlobalSocialBar() {
  const { user } = useAuth()

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-5">
        {/* Primary footer links - visible only to authenticated users (any role) */}
        {user ? (
          <nav className="flex items-center gap-4 text-xs sm:text-sm" aria-label="Athleap footer navigation">
            <a
              href="/coaches"
              className="text-gray-700 hover:text-black transition-colors"
            >
              Browse Coaches
            </a>
            <a
              href="/gear"
              className="text-gray-700 hover:text-black transition-colors"
            >
              Gear Store
            </a>
          </nav>
        ) : (
          <div className="text-xs sm:text-sm text-gray-500" aria-label="Athleap footer navigation">
            Sign in to browse coaches and gear
          </div>
        )}

        {/* Global social icons */}
        <ul className="flex items-center gap-4" aria-label="Athleap Social Links">
          {SOCIAL_LINKS.map(({ href, label, icon: Icon }) => (
            <li key={label}>
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="inline-flex items-center justify-center text-gray-600 hover:text-black transition-colors"
              >
                <Icon className="w-5 h-5" strokeWidth={1.75} />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  )
}


