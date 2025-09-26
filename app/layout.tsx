import './globals.css'
import type { Metadata } from 'next'
import { UserIdentity } from '@/components/user-identity'
import RoleSwitcherDemo from '@/components/ui/RoleSwitcherDemo'
import AbstractBackground from '@/components/AbstractBackground'
import Navigation from '@/components/Navigation'

export const metadata: Metadata = {
  title: 'Game Plan – The Work Before the Win',
  description: 'AI-powered sports performance platform for elite athletes and coaches.',
  icons: { icon: '/logo-gp.svg' }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" href="/fonts/LeagueSpartan-Regular.ttf" as="font" type="font/ttf" crossOrigin="" />
        <link rel="preload" href="/fonts/SportsWorld-Regular.ttf" as="font" type="font/ttf" crossOrigin="" />
      </head>
      <body className="bg-clarity-background text-clarity-text-primary font-body">
        <AbstractBackground />
        <Navigation />
        <main className="relative z-10">
          {children}
        </main>
        <RoleSwitcherDemo />
      </body>
    </html>
  )
}
