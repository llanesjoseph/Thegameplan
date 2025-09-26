'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight, Sparkles, Target, Zap } from 'lucide-react'

const CTA = () => {
 return (
  <section className="section-light section-padding relative overflow-hidden">
   <div className="container relative z-10">
    <div className="max-w-4xl mx-auto">
     <div className="game-plan-card p-12 text-center relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary-blue)]/5 to-[var(--accent-indigo)]/5"></div>
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-[var(--primary-blue)]/10 to-[var(--accent-indigo)]/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-[var(--muted-teal)]/10 to-[var(--secondary-slate)]/10 rounded-full blur-3xl"></div>
      
      {/* Floating Icons */}
      <div className="absolute top-8 left-8">
       <div className="w-12 h-12 bg-gradient-to-br from-[var(--primary-blue)] to-[var(--accent-indigo)] rounded-full flex items-center justify-center animate-pulse">
        <Target className="w-6 h-6 text-white" />
       </div>
      </div>
      <div className="absolute top-12 right-12">
       <div className="w-10 h-10 bg-gradient-to-br from-[var(--muted-teal)] to-[var(--warm-gray)] rounded-full flex items-center justify-center" style={{ animation: 'float 3s ease-in-out infinite' }}>
        <Zap className="w-5 h-5 text-white" />
       </div>
      </div>
      <div className="absolute bottom-8 left-16">
       <div className="w-8 h-8 bg-gradient-to-br from-[var(--secondary-slate)] to-[var(--accent-indigo)] rounded-full flex items-center justify-center" style={{ animation: 'float 4s ease-in-out infinite' }}>
        <Sparkles className="w-4 h-4 text-white" />
       </div>
      </div>
      
      <div className="relative z-10">
       {/* Badge */}
       <div className="game-plan-badge mx-auto mb-6">
        <Sparkles className="w-4 h-4" />
        Start Your Transformation Today
       </div>
       
       {/* Main Heading */}
       <h2 className="text-4xl lg:text-5xl text-[var(--deep-black)] mb-6">
        Ready to Unlock Your{' '}
        <span className="gradient-text">Full Potential?</span>
       </h2>
       
       {/* Description */}
       <p className="text-xl text-[var(--mid-gray)] mb-8 max-w-2xl mx-auto leading-relaxed">
        Join thousands of athletes and creators who are already achieving extraordinary results 
        with AI-powered coaching and personalized learning paths.
       </p>
       
       {/* CTA Buttons */}
       <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
        <Link 
         href="#" 
         className="btn btn-primary text-lg px-8 py-4 inline-flex items-center gap-2 group"
        >
         Start Free Today
         <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>
        <Link 
         href="#" 
         className="btn btn-secondary text-lg px-8 py-4"
        >
         Watch Demo
        </Link>
       </div>
       
       {/* Trust Indicators */}
       <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-[var(--mid-gray)]">
        <div className="flex items-center gap-2">
         <div className="w-4 h-4 bg-[var(--muted-teal)] rounded-full"></div>
         <span>No Credit Card Required</span>
        </div>
        <div className="flex items-center gap-2">
         <div className="w-4 h-4 bg-[var(--primary-blue)] rounded-full"></div>
         <span>14-Day Free Trial</span>
        </div>
        <div className="flex items-center gap-2">
         <div className="w-4 h-4 bg-[var(--accent-indigo)] rounded-full"></div>
         <span>Cancel Anytime</span>
        </div>
       </div>
      </div>
     </div>
    </div>
    
    {/* Trust Indicators */}
    <div className="grid md:grid-cols-3 gap-6 mt-16 max-w-3xl mx-auto">
     <div className="text-center">
      <div className="text-2xl gradient-text mb-2">AI-Powered</div>
      <div className="text-[var(--mid-gray)] font-medium">Performance Analysis</div>
     </div>
     <div className="text-center">
      <div className="text-2xl gradient-text mb-2">Expert</div>
      <div className="text-[var(--mid-gray)] font-medium">Coaching Network</div>
     </div>
     <div className="text-center">
      <div className="text-2xl gradient-text mb-2">Personalized</div>
      <div className="text-[var(--mid-gray)] font-medium">Training Paths</div>
     </div>
    </div>
   </div>
   
   {/* Background Pattern */}
   <div className="absolute inset-0 overflow-hidden">
    <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-[var(--primary-blue)]/5 to-[var(--accent-indigo)]/5 rounded-full blur-3xl"></div>
    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-[var(--muted-teal)]/5 to-[var(--secondary-slate)]/5 rounded-full blur-3xl"></div>
   </div>
  </section>
 )
}

export default CTA