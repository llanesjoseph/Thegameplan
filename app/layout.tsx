import './globals.css'
import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export const metadata: Metadata = {
  title: 'PLAYBOOKD – The Work Before the Win',
  description: 'AI-powered sports performance platform for elite athletes and coaches.',
  icons: { icon: '/logo-gp.svg' }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-800">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}