import './globals.css'
import type { Metadata } from 'next'
import { UserIdentity } from '@/components/user-identity'
import RoleSwitcherDemo from '@/components/ui/RoleSwitcherDemo'
import AbstractBackground from '@/components/AbstractBackground'
import Navigation from '@/components/Navigation'
import Link from 'next/link'

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
        {/* Footer */}
        <footer className="mt-16 border-t border-gray-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <div>
                <h3 className="text-gray-800 font-semibold mb-3">Game Plan</h3>
                <p className="text-gray-600 text-sm leading-relaxed">Elite performance coaching, powered by AI and delivered by world-class athletes.</p>
              </div>
              <div>
                <h4 className="text-gray-800 font-semibold mb-3">Platform</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li><Link href="/contributors" className="hover:text-cardinal">Contributors</Link></li>
                  <li><Link href="/lessons" className="hover:text-cardinal">Lessons</Link></li>
                  <li><Link href="/gear" className="hover:text-cardinal">Gear</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-gray-800 font-semibold mb-3">Company</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li><Link href="/subscribe" className="hover:text-cardinal">Subscribe</Link></li>
                  <li><Link href="/terms" className="hover:text-cardinal">Terms</Link></li>
                  <li><Link href="/privacy" className="hover:text-cardinal">Privacy</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-gray-800 font-semibold mb-3">Get the Edge</h4>
                <p className="text-gray-600 text-sm mb-3">Join the network for elite training insights.</p>
                <Link href="/subscribe" className="inline-flex items-center gap-2 px-4 py-2 bg-cardinal text-white rounded-lg hover:bg-cardinal-dark">Subscribe</Link>
              </div>
            </div>
            <div className="mt-10 text-xs text-gray-500">© {new Date().getFullYear()} Game Plan. All rights reserved.</div>
          </div>
        </footer>
      </body>
    </html>
  )
}
