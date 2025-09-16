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
      <body className="bg-white text-gray-800">
        <AbstractBackground />
        <Navigation />
        <main className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {children}
        </main>
        <RoleSwitcherDemo />
      </body>
    </html>
  )
}
