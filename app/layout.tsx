import './globals.css'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Inter, Oswald, Permanent_Marker, Open_Sans } from 'next/font/google'
import BugReportButton from '@/components/ui/BugReportButton'
import GlobalSocialBar from '@/components/ui/GlobalSocialBar'

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

const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-open-sans',
  weight: ['400', '700'],
  display: 'swap'
})

export const metadata: Metadata = {
  title: 'AthLeap',
 description: 'AI-powered sports performance platform for elite athletes and coaches.',
 icons: { icon: '/brand/athleap-logo-colored.png' }
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
   <body className={`bg-white text-gray-800 ${inter.variable} ${oswald.variable} ${permanentMarker.variable} ${openSans.variable}`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // GLOBAL BULLETPROOF: Suppress ALL browser extension errors (password managers, form fillers, etc.)
              // This runs FIRST before any other scripts to catch all errors
              (function() {
                if (typeof window === 'undefined') return;
                
                // Helper function to check if error is from browser extension
                function isExtensionError(message) {
                  if (!message || typeof message !== 'string') return false;
                  const lowerMessage = message.toLowerCase();
                  return (
                    lowerMessage.includes('content_script.js') ||
                    lowerMessage.includes('cannot read properties of undefined') ||
                    lowerMessage.includes('reading \'control\'') ||
                    lowerMessage.includes('reading "control"') ||
                    lowerMessage.includes('chrome-extension://') ||
                    lowerMessage.includes('moz-extension://') ||
                    lowerMessage.includes('safari-extension://') ||
                    lowerMessage.includes('edge-extension://') ||
                    (lowerMessage.includes('typeerror') && lowerMessage.includes('control')) ||
                    (lowerMessage.includes('undefined') && lowerMessage.includes('control'))
                  );
                }
                
                // Store original functions
                const originalError = console.error;
                const originalWarn = console.warn;
                const originalLog = console.log;
                
                // GLOBAL: Catch all window errors
                window.onerror = function(message, source, lineno, colno, error) {
                  const errorMessage = message?.toString() || '';
                  if (isExtensionError(errorMessage) || isExtensionError(source || '')) {
                    return true; // Suppress the error
                  }
                  return false; // Let other errors through
                };
                
                // GLOBAL: Catch unhandled promise rejections from extensions
                window.addEventListener('unhandledrejection', function(event) {
                  const reason = event.reason?.toString() || '';
                  const errorMessage = event.reason?.message || '';
                  if (isExtensionError(reason) || isExtensionError(errorMessage)) {
                    event.preventDefault(); // Suppress the error
                    event.stopPropagation(); // Stop propagation
                    return;
                  }
                }, true); // Use capture phase to catch early
                
                // Override console.error
                console.error = function(...args) {
                  const message = args.map(arg => 
                    typeof arg === 'string' ? arg : 
                    arg?.toString() || 
                    JSON.stringify(arg)
                  ).join(' ');
                  
                  if (isExtensionError(message)) {
                    return; // Silently ignore extension errors
                  }
                  originalError.apply(console, args);
                };
                
                // Override console.warn
                console.warn = function(...args) {
                  const message = args.map(arg => 
                    typeof arg === 'string' ? arg : 
                    arg?.toString() || 
                    JSON.stringify(arg)
                  ).join(' ');
                  
                  if (isExtensionError(message)) {
                    return; // Silently ignore extension warnings
                  }
                  originalWarn.apply(console, args);
                };
                
                // Also filter console.log for extension errors (some extensions use log)
                console.log = function(...args) {
                  const message = args.map(arg => 
                    typeof arg === 'string' ? arg : 
                    arg?.toString() || 
                    JSON.stringify(arg)
                  ).join(' ');
                  
                  if (isExtensionError(message)) {
                    return; // Silently ignore extension logs
                  }
                  originalLog.apply(console, args);
                };
              })();
            `,
          }}
        />
    {/* Skip to content for keyboard users */}
    <a href="#main-content" className="sr-only focus:not-sr-only focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-black absolute top-2 left-2 bg-white text-black px-3 py-2 rounded">
     Skip to main content
    </a>
    <main id="main-content" role="main">
     {children}
    </main>
    <GlobalSocialBar />
    <Suspense fallback={null}>
     <BugReportButton />
    </Suspense>
    <Analytics />
    <SpeedInsights />
   </body>
  </html>
 )
}