import './globals.css'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Inter, Oswald, Permanent_Marker } from 'next/font/google'
import BugReportButton from '@/components/ui/BugReportButton'

const inter = Inter({
 subsets: ['latin'],
 variable: '--font-inter',
 display: 'swap'
})

const oswald = Oswald({
 subsets: ['latin'],
 variable: '--font-oswald',
 weight: ['300', '400', '500', '600', '700'],
 display: 'swap'
})

const permanentMarker = Permanent_Marker({
 subsets: ['latin'],
 variable: '--font-permanent-marker',
 weight: '400',
 display: 'swap'
})

export const metadata: Metadata = {
 title: 'AthLeap – The Work Before the Win',
 description: 'AI-powered sports performance platform for elite athletes and coaches.',
 icons: { icon: '/logo-gp.svg' }
}

// Viewport configuration for proper mobile rendering
export const viewport = {
 width: 'device-width',
 initialScale: 1,
 maximumScale: 5,
 userScalable: true,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
 return (
  <html lang="en">
   <body className={`bg-white text-gray-800 ${inter.variable} ${oswald.variable} ${permanentMarker.variable}`}>
    {children}
    <Suspense fallback={null}>
     <BugReportButton />
    </Suspense>
    <Analytics />
    <SpeedInsights />
   </body>
  </html>
 )
}