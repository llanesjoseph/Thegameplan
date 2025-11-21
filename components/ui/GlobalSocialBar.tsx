'use client'

import { Facebook, Instagram, Linkedin, Twitter, Youtube } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

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
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-end gap-5">
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


