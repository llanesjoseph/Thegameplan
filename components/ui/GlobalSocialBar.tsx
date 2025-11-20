'use client'

const SOCIAL_LINKS = [
  {
    href: 'https://www.linkedin.com/company/wix-com',
    icon: 'https://static.wixstatic.com/media/6ea5b4a88f0b4f91945b40499aa0af00.png/v1/fill/w_24,h_24,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/6ea5b4a88f0b4f91945b40499aa0af00.png',
    label: 'LinkedIn'
  },
  {
    href: 'https://www.facebook.com/wix',
    icon: 'https://static.wixstatic.com/media/0fdef751204647a3bbd7eaa2827ed4f9.png/v1/fill/w_24,h_24,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/0fdef751204647a3bbd7eaa2827ed4f9.png',
    label: 'Facebook'
  },
  {
    href: 'https://www.twitter.com/wix',
    icon: 'https://static.wixstatic.com/media/c7d035ba85f6486680c2facedecdcf4d.png/v1/fill/w_24,h_24,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/c7d035ba85f6486680c2facedecdcf4d.png',
    label: 'Twitter'
  },
  {
    href: 'https://www.instagram.com/wix',
    icon: 'https://static.wixstatic.com/media/01c3aff52f2a4dffa526d7a9843d46ea.png/v1/fill/w_24,h_24,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/01c3aff52f2a4dffa526d7a9843d46ea.png',
    label: 'Instagram'
  }
]

export default function GlobalSocialBar() {
  return (
    <footer className="w-full bg-white border-t border-gray-200">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-end gap-5">
        <ul className="flex items-center gap-4" aria-label="Social Bar">
          {SOCIAL_LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                target="_blank"
                rel="noreferrer"
                aria-label={link.label}
                className="inline-flex"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={link.icon} alt={link.label} className="w-6 h-6 object-cover" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  )
}

