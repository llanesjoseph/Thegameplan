'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ClarityButton from '@/components/ui/NexusButton'
import { Facebook, Instagram, Linkedin, Youtube, X } from 'lucide-react'
import AuthButtons from '@/components/auth/AuthButtons'
import { auth, db } from '@/lib/firebase.client'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

export default function LandingPage() {
 const [showAuthModal, setShowAuthModal] = useState(false)
 const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
 const [buttonPosition, setButtonPosition] = useState<{ x: number; y: number; width: number; height: number; modalX: number; modalY: number; originX: number; originY: number } | null>(null)
 const [isRedirecting, setIsRedirecting] = useState(false)
 const [signInHover, setSignInHover] = useState(false)
 const [joinNowHover, setJoinNowHover] = useState(false)
 const router = useRouter()

 // Handle auth state changes and redirect to role-specific page
 useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
   if (user) {
    try {
     // Show redirecting state immediately for instant feedback
     setIsRedirecting(true)
     setShowAuthModal(false)
     
     const token = await user.getIdToken()
     if (token) {
      console.log('[Landing] User authenticated, fetching role...')
      
      // Get user role using API (faster and more reliable)
      // Use Promise.race to timeout after 2 seconds
      const rolePromise = fetch('/api/user/role', {
       headers: {
        'Authorization': `Bearer ${token}`
       }
      }).then(async (response) => {
       if (response.ok) {
        const data = await response.json()
        if (data.success) {
         return data.data.role || 'athlete'
        }
       }
       // Fallback to direct Firestore fetch
       const userDoc = await getDoc(doc(db, 'users', user.uid))
       const userData = userDoc.data()
       return userData?.role || 'athlete'
      }).catch(async () => {
       // Fallback to direct Firestore fetch on error
       const userDoc = await getDoc(doc(db, 'users', user.uid))
       const userData = userDoc.data()
       return userData?.role || 'athlete'
      })
      
      const timeoutPromise = new Promise<string>((resolve) => {
       setTimeout(() => resolve('athlete'), 2000) // Default to athlete after 2s
      })
      
      const role = await Promise.race([rolePromise, timeoutPromise])
      
      console.log('[Landing] User role:', role)
      
      // Use hard redirect (window.location) for immediate navigation
      let redirectPath = '/dashboard/athlete'
      if (role === 'athlete') {
       redirectPath = '/dashboard/athlete'
      } else if (role === 'superadmin' || role === 'admin') {
       redirectPath = '/dashboard/admin'
      } else if (role === 'coach' || role === 'assistant_coach' || role === 'creator') {
        redirectPath = '/dashboard/coach'
      }
      
      console.log('[Landing] Redirecting to:', redirectPath)
      window.location.href = redirectPath
     }
    } catch (error) {
     console.error('Token verification failed:', error)
     setIsRedirecting(false)
    }
   } else {
    setIsRedirecting(false)
   }
  })
  return () => unsubscribe()
 }, [router])

 const getButtonPosition = (event: React.MouseEvent<HTMLButtonElement>, isSignIn: boolean) => {
  const button = event.currentTarget
  const rect = button.getBoundingClientRect()
  
  // Use bottom corners based on button type
  // Sign In: bottom-right corner (arrow points down-right)
  // Join Now: bottom-left corner (arrow points down-left)
  const originX = isSignIn ? rect.right : rect.left
  const originY = rect.bottom + 8 // Small gap below button
  
  // Position modal just below button, slightly offset
  // Keep it connected visually to the button
  const modalX = isSignIn ? rect.right - 20 : rect.left + 20 // Offset from corner
  const modalY = rect.bottom + 12 // Just below button with small gap
  
  return {
   x: originX,
   y: originY,
   width: rect.width,
   height: rect.height,
   modalX: modalX,
   modalY: modalY,
   originX: originX,
   originY: originY
  }
 }

 const openSignIn = () => {
  setAuthMode('signin')
  setShowAuthModal(true)
  setButtonPosition(null)
 }

 const openSignUp = () => {
  setAuthMode('signup')
  setShowAuthModal(true)
  setButtonPosition(null)
 }

 return (
  <div className="min-h-screen" style={{ fontFamily: '"Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
   {/* Add Open Sans Font */}
   <style jsx global>{`
    @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&display=swap');
    
    body {
      font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
   `}</style>

   {/* Header with Navigation */}
   <header className="relative z-50 bg-white shadow-sm" role="banner">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
     <div className="flex items-center justify-between h-16">
      {/* Logo - Clickable */}
      <div className="flex items-center">
       <Link href="/" className="flex-shrink-0">
        <p
         className="text-2xl tracking-wider uppercase font-bold cursor-pointer transition-opacity hover:opacity-80"
         style={{
          fontFamily: '"Open Sans", sans-serif',
          fontWeight: 700,
          color: '#440102' // New dark brown color
         }}
        >
         ATHLEAP
        </p>
       </Link>
      </div>

      {/* Right side buttons - Text changes on hover */}
      <div className="flex items-center gap-4">
       {/* Existing User - Sign In */}
       <button
        onClick={(e) => {
         e.preventDefault()
         e.stopPropagation()
         openSignIn()
        }}
        className="px-5 py-2 text-sm font-bold rounded border-2 transition-all hover:scale-105 relative overflow-hidden"
        style={{
         fontFamily: '"Open Sans", sans-serif',
         fontWeight: 700,
         color: signInHover ? '#FFFFFF' : '#440102',
         borderColor: signInHover ? '#FC0105' : '#440102',
         backgroundColor: signInHover ? '#FC0105' : 'transparent',
         minWidth: '120px',
         cursor: 'pointer'
        }}
        onMouseEnter={() => setSignInHover(true)}
        onMouseLeave={() => setSignInHover(false)}
       >
        {signInHover ? 'Existing User' : 'Sign In'}
       </button>

       {/* New User - Join Now */}
       <button
        onClick={(e) => {
         e.preventDefault()
         e.stopPropagation()
         openSignUp()
        }}
        className="px-5 py-2 text-sm font-bold rounded transition-all hover:scale-105 relative overflow-hidden"
        style={{
         fontFamily: '"Open Sans", sans-serif',
         fontWeight: 700,
         color: '#FFFFFF',
         backgroundColor: joinNowHover ? '#440102' : '#FC0105',
         border: 'none',
         minWidth: '120px',
         cursor: 'pointer'
        }}
        onMouseEnter={() => setJoinNowHover(true)}
        onMouseLeave={() => setJoinNowHover(false)}
       >
        {joinNowHover ? 'New User' : 'Join Now'}
       </button>
      </div>
     </div>
    </div>
   </header>

   {/* Hero Section - Transparent Logo */}
   <section className="relative w-full py-12 md:py-16 flex items-center justify-center" style={{ minHeight: '40vh', backgroundColor: '#440102' }}>
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
     <div className="flex flex-col items-center justify-center">
      
      {/* Transparent Logo - Centered and Scaled Down */}
      <div className="relative w-full flex items-center justify-center">
       <img 
        src="/brand/athleap-logo-colored.png" 
        alt="AthLeap Logo" 
        className="h-24 md:h-32 lg:h-40 w-auto mx-auto"
        style={{ maxWidth: '400px', height: 'auto', objectFit: 'contain' }}
       />
      </div>
     </div>
    </div>
   </section>

   {/* Description Section - Below Hero Image */}
   <section className="py-16 bg-white">
    <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
     <p 
      className="text-lg sm:text-xl leading-relaxed"
      style={{
        fontFamily: '"Open Sans", sans-serif',
        color: '#440102',
        lineHeight: '1.75'
      }}
     >
      AthLeap is blending the power of AI with the thrill of sports,
      creating unforgettable fan experiences and coaching next-generation athletes.
      Whether you're in the stands or on the field, this is the future of sports.
     </p>
    </div>
   </section>

   {/* Features Section */}
   <section className="py-16" style={{ backgroundColor: '#440102' }}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
      <h2 
       className="text-3xl sm:text-4xl mb-4"
       style={{
         fontFamily: '"Open Sans", sans-serif',
         fontWeight: 700,
         color: '#FFFFFF'
       }}
      >
       Simple steps to a stronger game...
      </h2>
     </div>

     <div className="grid md:grid-cols-3 gap-8">
      {/* Share Your Goals */}
      <div className="text-center">
       <h3 
        className="text-xl mb-4"
        style={{
          fontFamily: '"Open Sans", sans-serif',
          fontWeight: 700,
          color: '#FFFFFF'
        }}
       >
        Share Your Goals
       </h3>
       <p 
        className="leading-relaxed"
        style={{
          fontFamily: '"Open Sans", sans-serif',
          color: 'rgba(255, 255, 255, 0.9)',
          lineHeight: '1.75'
        }}
       >
        Create your athletic profile and share what's important to
        you. Set clear goals for your training and development journey.
       </p>
      </div>

      {/* Find Your Coach */}
      <div className="text-center">
       <h3 
        className="text-xl mb-4"
        style={{
          fontFamily: '"Open Sans", sans-serif',
          fontWeight: 700,
          color: '#FFFFFF'
        }}
       >
        Find Your Coach
       </h3>
       <p 
        className="leading-relaxed"
        style={{
          fontFamily: '"Open Sans", sans-serif',
          color: 'rgba(255, 255, 255, 0.9)',
          lineHeight: '1.75'
        }}
       >
        Our coaches have been carefully curated to provide top
        tier training experiences and elevate your athletic journey.
       </p>
      </div>

      {/* Enhance Performance */}
      <div className="text-center">
       <h3 
        className="text-xl mb-4"
        style={{
          fontFamily: '"Open Sans", sans-serif',
          fontWeight: 700,
          color: '#FFFFFF'
        }}
       >
        Enhance Performance
       </h3>
       <p 
        className="leading-relaxed"
        style={{
          fontFamily: '"Open Sans", sans-serif',
          color: 'rgba(255, 255, 255, 0.9)',
          lineHeight: '1.75'
        }}
       >
        Ask questions, engage with our community and track your
        progress with personalized performance insights.
       </p>
      </div>
     </div>
    </div>
   </section>

   {/* Footer - Social Icons Only */}
   <footer className="bg-white py-8" role="contentinfo">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
     <div className="flex items-center justify-center">
      {/* Social Links - Centered */}
      <div className="flex items-center gap-6">
       <a 
        href="https://www.facebook.com/athleap" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="transition-colors"
        style={{ color: '#440102' }}
        onMouseEnter={(e) => e.currentTarget.style.color = '#FC0105'}
        onMouseLeave={(e) => e.currentTarget.style.color = '#440102'}
        aria-label="AthLeap on Facebook"
       >
        <Facebook className="w-6 h-6" />
       </a>
       <a 
        href="https://www.linkedin.com/company/athleap" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="transition-colors"
        style={{ color: '#440102' }}
        onMouseEnter={(e) => e.currentTarget.style.color = '#FC0105'}
        onMouseLeave={(e) => e.currentTarget.style.color = '#440102'}
        aria-label="AthLeap on LinkedIn"
       >
        <Linkedin className="w-6 h-6" />
       </a>
       <a 
        href="https://www.youtube.com/@athleap" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="transition-colors"
        style={{ color: '#440102' }}
        onMouseEnter={(e) => e.currentTarget.style.color = '#FC0105'}
        onMouseLeave={(e) => e.currentTarget.style.color = '#440102'}
        aria-label="AthLeap on YouTube"
       >
        <Youtube className="w-6 h-6" />
       </a>
       <a 
        href="https://www.instagram.com/athleap" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="transition-colors"
        style={{ color: '#440102' }}
        onMouseEnter={(e) => e.currentTarget.style.color = '#FC0105'}
        onMouseLeave={(e) => e.currentTarget.style.color = '#440102'}
        aria-label="AthLeap on Instagram"
       >
        <Instagram className="w-6 h-6" />
       </a>
      </div>
     </div>
    </div>
   </footer>

   {/* Redirecting Overlay - Shows immediately when auth succeeds */}
   {isRedirecting && (
    <div 
     className="fixed inset-0 z-[60] flex items-center justify-center"
     style={{
      backgroundColor: 'rgba(68, 1, 2, 0.95)',
      backdropFilter: 'blur(8px)',
      animation: 'fadeInBackdrop 0.2s ease-out'
     }}
    >
     <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mb-4"></div>
      <p className="text-white font-bold text-xl mb-2" style={{ fontFamily: '"Open Sans", sans-serif', fontWeight: 700 }}>
       Welcome back!
      </p>
      <p className="text-white text-sm opacity-80" style={{ fontFamily: '"Open Sans", sans-serif' }}>
       Taking you to your dashboard...
      </p>
     </div>
    </div>
   )}

   {/* Auth Modal - Slide In Reveal with Visible Logo Behind */}
   {showAuthModal && !isRedirecting && (
    <div 
     className="fixed inset-0 z-50"
     style={{
      backgroundColor: 'rgba(68, 1, 2, 0.5)',
      backdropFilter: 'blur(1px)',
      animation: 'fadeInBackdrop 0.3s ease-out'
     }}
     onClick={(e) => {
      if (e.target === e.currentTarget) {
       setShowAuthModal(false)
       setButtonPosition(null)
      }
     }}
    >
     {/* Animated Container - Fixed locked position under buttons on right */}
     <div 
      className="fixed right-4 sm:right-6 lg:right-8"
      style={{
       top: '84px', // Fixed position: Header (64px) + gap (20px) = always below sign in
       width: 'calc(100% - 2rem)',
       maxWidth: '28rem',
       zIndex: 50,
       padding: '0',
       animation: 'slideDownAndScale 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
      }}
     >
      {/* Modal Card - Brand Themed Design */}
      <div 
       className="relative rounded-2xl shadow-2xl w-full ml-auto overflow-hidden"
       style={{
        fontFamily: '"Open Sans", sans-serif',
        boxShadow: '0 25px 70px rgba(68, 1, 2, 0.5)',
        border: 'none',
        background: '#FFFFFF',
        backdropFilter: 'blur(10px)'
       }}
      >
       {/* Brand Accent Header */}
       <div 
        className="w-full py-3 px-6"
        style={{
        background: '#FC0105'
        }}
       >
        <div className="flex items-center justify-between">
         <h2 
          className="text-xl font-bold text-white"
          style={{
           fontFamily: '"Open Sans", sans-serif',
           fontWeight: 700
          }}
         >
          {authMode === 'signup' ? 'Join AthLeap' : 'Welcome Back'}
         </h2>
         <button
          onClick={() => {
           setShowAuthModal(false)
           setButtonPosition(null)
          }}
          className="p-1.5 rounded-lg transition-all hover:bg-white/20"
          style={{ 
           color: '#FFFFFF'
          }}
          aria-label="Close"
         >
          <X className="w-4 h-4" />
         </button>
        </div>
        <p 
         className="text-sm text-white/90 mt-1"
         style={{
          fontFamily: '"Open Sans", sans-serif',
          fontWeight: 400
         }}
        >
         {authMode === 'signup' 
          ? 'Start your athletic journey today' 
          : 'Let\'s get back to training'}
        </p>
       </div>
       
       {/* Content */}
       <div className="p-6 bg-white">
        {/* Auth Buttons Component */}
        <div className="mb-4">
         <AuthButtons initialMode={authMode} />
        </div>

        {/* Toggle Mode */}
        <div className="text-center pt-4 border-t" style={{ borderColor: '#E5E5E5' }}>
         <button
          onClick={() => {
           setAuthMode(authMode === 'signin' ? 'signup' : 'signin')
          }}
          className="text-sm font-bold transition-colors"
          style={{
           fontFamily: '"Open Sans", sans-serif',
           fontWeight: 700,
           color: '#FC0105'
          }}
          onMouseEnter={(e) => {
           e.currentTarget.style.color = '#440102'
          }}
          onMouseLeave={(e) => {
           e.currentTarget.style.color = '#FC0105'
          }}
         >
          {authMode === 'signin' 
           ? 'New here? Join Now →' 
           : '← Already have an account? Sign In'}
         </button>
        </div>
       </div>
      </div>
     </div>
    </div>
   )}

   {/* Animation Styles - Slide In Reveal */}
   <style jsx global>{`
    @keyframes fadeInBackdrop {
     from {
      opacity: 0;
     }
     to {
      opacity: 1;
     }
    }
    
    @keyframes slideDownAndScale {
     0% {
      opacity: 0;
      transform: translateY(-10px) scale(0.95);
     }
     100% {
      opacity: 1;
      transform: translateY(0) scale(1);
     }
    }
   `}</style>
  </div>
 )
}