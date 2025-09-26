'use client'

import React from 'react'
import { Trophy, Target, Video, BarChart3, Users, Zap } from 'lucide-react'

const LearningPaths = () => {
 return (
  <section className="section-light section-padding">
   <div className="container">
    <div className="text-center mb-16">
     <h2 className="section-title">
      Choose Your <span className="gradient-text">Learning Path</span>
     </h2>
     <p className="section-subtitle">
      Tailored experiences designed for your specific goals and aspirations
     </p>
    </div>
    
    <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
     <PathCard
      type="athlete"
      title="For Athletes"
      subtitle="Master Your Sport"
      description="Advanced training methods, mental conditioning, and performance optimization techniques from elite athletes and coaches."
      features={[
       { icon: <Trophy className="w-5 h-5" />, text: "Elite Performance Training" },
       { icon: <Target className="w-5 h-5" />, text: "Mental Conditioning" },
       { icon: <BarChart3 className="w-5 h-5" />, text: "Performance Analytics" }
      ]}
      cta="Start Athletic Journey"
      accentColor="from-[var(--primary-blue)] to-[var(--muted-teal)]"
     />
     
     <PathCard
      type="creator"
      title="For Creators"
      subtitle="Build Your Brand"
      description="Content strategy, audience growth, monetization techniques, and brand building from successful creators and marketers."
      features={[
       { icon: <Video className="w-5 h-5" />, text: "Content Mastery" },
       { icon: <Users className="w-5 h-5" />, text: "Audience Building" },
       { icon: <Zap className="w-5 h-5" />, text: "Monetization Strategy" }
      ]}
      cta="Start Creator Journey"
      accentColor="from-[var(--accent-indigo)] to-[var(--secondary-slate)]"
     />
    </div>
   </div>
  </section>
 )
}

interface PathCardProps {
 type: 'athlete' | 'creator'
 title: string
 subtitle: string
 description: string
 features: { icon: React.ReactNode; text: string }[]
 cta: string
 accentColor: string
}

const PathCard = ({ type, title, subtitle, description, features, cta, accentColor }: PathCardProps) => {
 return (
  <div className="learning-path-card group">
   <div className={`w-16 h-16 bg-gradient-to-br ${accentColor} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}>
    {type === 'athlete' ? (
     <Trophy className="w-8 h-8 text-white" />
    ) : (
     <Video className="w-8 h-8 text-white" />
    )}
   </div>
   
   <h3 className="text-2xl text-[var(--deep-black)] mb-2">{title}</h3>
   <h4 className="text-lg font-semibold text-[var(--primary-cyan)] mb-4">{subtitle}</h4>
   <p className="text-[var(--mid-gray)] mb-6 leading-relaxed">{description}</p>
   
   <div className="space-y-3 mb-8">
    {features.map((feature, index) => (
     <div key={index} className="flex items-center gap-3">
      <div className={`w-8 h-8 bg-gradient-to-br ${accentColor} rounded-lg flex items-center justify-center text-white`}>
       {feature.icon}
      </div>
      <span className="text-[var(--dark-gray)] font-medium">{feature.text}</span>
     </div>
    ))}
   </div>
   
   <button className={`w-full py-4 px-6 bg-gradient-to-r ${accentColor} text-white font-semibold rounded-2xl transition-all duration-300 hover:transform hover:translateY(-2px) hover:shadow-lg`}>
    {cta}
   </button>
   
   {/* Decorative Elements */}
   <div className="absolute -top-2 -right-2 w-20 h-20 bg-gradient-to-br from-[var(--primary-blue)]/10 to-[var(--accent-indigo)]/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
   <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-br from-[var(--muted-teal)]/10 to-[var(--warm-gray)]/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
  </div>
 )
}

export default LearningPaths