'use client'

import React, { useState } from 'react'
import { Star, Quote, ArrowLeft, ArrowRight, Trophy, Zap } from 'lucide-react'

const SuccessStories = () => {
 const [activeStory, setActiveStory] = useState(0)

 const stories = [
  {
   name: "Sarah Chen",
   role: "Professional Tennis Player",
   category: "athlete",
   image: "/api/placeholder/80/80",
   quote: "Game Plan's AI coaching helped me identify blind spots in my serve technique that my human coaches missed. My ace percentage improved by 40% in just 3 months.",
   achievement: "Ranked #12 WTA",
   metric: "+40% Ace Percentage",
   color: "from-[var(--primary-blue)] to-[var(--muted-teal)]"
  },
  {
   name: "Marcus Rodriguez",
   role: "Fitness Content Creator",
   category: "creator",
   image: "/api/placeholder/80/80",
   quote: "The content strategy insights were game-changing. My engagement rates tripled, and I finally understand what my audience truly wants to see.",
   achievement: "2.1M Followers",
   metric: "+300% Engagement",
   color: "from-[var(--accent-indigo)] to-[var(--secondary-slate)]"
  },
  {
   name: "Alex Kim",
   role: "Olympic Swimmer",
   category: "athlete",
   image: "/api/placeholder/80/80",
   quote: "The personalized training adjustments based on my recovery data helped me peak at exactly the right time for Olympics. Gold medal performance!",
   achievement: "Olympic Gold Medalist",
   metric: "-2.3s Personal Best",
   color: "from-[var(--warm-gray)] to-[var(--primary-blue)]"
  },
  {
   name: "Emma Thompson",
   role: "YouTube Creator",
   category: "creator",
   image: "/api/placeholder/80/80",
   quote: "From 5K to 500K subscribers in 8 months. The AI-driven content recommendations and timing optimization were incredibly accurate.",
   achievement: "500K Subscribers",
   metric: "+10,000% Growth",
   color: "from-[var(--muted-teal)] to-[var(--accent-indigo)]"
  }
 ]

 const nextStory = () => {
  setActiveStory((prev) => (prev + 1) % stories.length)
 }

 const prevStory = () => {
  setActiveStory((prev) => (prev - 1 + stories.length) % stories.length)
 }

 return (
  <section className="section-light-alt section-padding">
   <div className="container">
    <div className="text-center mb-16">
     <h2 className="section-title">
      Real <span className="gradient-text">Success Stories</span>
     </h2>
     <p className="section-subtitle">
      See how Game Plan has transformed careers and accelerated growth for thousands of users
     </p>
    </div>
    
    <div className="max-w-4xl mx-auto">
     {/* Main Story Display */}
     <div className="success-story-card relative overflow-hidden">
      <div className="flex flex-col lg:flex-row items-center gap-8">
       {/* Story Content */}
       <div className="flex-1 text-center lg:text-left">
        <div className="flex items-center justify-center lg:justify-start gap-2 mb-4">
         {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
         ))}
        </div>
        
        <div className="relative mb-6">
         <Quote className="absolute -top-2 -left-2 w-8 h-8 text-[var(--primary-cyan)]/20" />
         <blockquote className="text-xl text-[var(--deep-black)]  leading-relaxed pl-6">
          {stories[activeStory].quote}
         </blockquote>
        </div>
        
        <div className="flex items-center justify-center lg:justify-start gap-4 mb-6">
         <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
          <span className="text-2xl text-gray-600">
           {stories[activeStory].name.split(' ').map(n => n[0]).join('')}
          </span>
         </div>
         <div>
          <h4 className=" text-[var(--deep-black)]">{stories[activeStory].name}</h4>
          <p className="text-[var(--mid-gray)]">{stories[activeStory].role}</p>
         </div>
        </div>
        
        {/* Achievement Metrics */}
        <div className="flex items-center justify-center lg:justify-start gap-6">
         <div className={`px-4 py-2 bg-gradient-to-r ${stories[activeStory].color} rounded-full`}>
          <div className="flex items-center gap-2 text-white">
           {stories[activeStory].category === 'athlete' ? (
            <Trophy className="w-4 h-4" />
           ) : (
            <Zap className="w-4 h-4" />
           )}
           <span className=" text-sm">{stories[activeStory].achievement}</span>
          </div>
         </div>
         <div className="text-[var(--primary-cyan)] text-lg">
          {stories[activeStory].metric}
         </div>
        </div>
       </div>
       
       {/* Navigation */}
       <div className="flex lg:flex-col items-center gap-4">
        <button
         onClick={prevStory}
         className="w-12 h-12 bg-white border-2 border-[var(--light-gray)] rounded-full flex items-center justify-center hover:border-[var(--primary-blue)] hover:bg-[var(--primary-blue)] hover:text-white transition-all duration-300"
        >
         <ArrowLeft className="w-5 h-5" />
        </button>
        <button
         onClick={nextStory}
         className="w-12 h-12 bg-white border-2 border-[var(--light-gray)] rounded-full flex items-center justify-center hover:border-[var(--primary-blue)] hover:bg-[var(--primary-blue)] hover:text-white transition-all duration-300"
        >
         <ArrowRight className="w-5 h-5" />
        </button>
       </div>
      </div>
      
      {/* Background Decoration */}
      <div className={`absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br ${stories[activeStory].color} rounded-full opacity-5 blur-3xl`}></div>
      <div className={`absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-br ${stories[activeStory].color} rounded-full opacity-5 blur-2xl`}></div>
     </div>
     
     {/* Story Indicators */}
     <div className="flex justify-center gap-3 mt-8">
      {stories.map((_, index) => (
       <button
        key={index}
        onClick={() => setActiveStory(index)}
        className={`w-3 h-3 rounded-full transition-all duration-300 ${
         activeStory === index
          ? 'bg-[var(--primary-blue)] scale-125'
          : 'bg-gray-600 hover:bg-gray-500'
        }`}
       />
      ))}
     </div>
    </div>
    
    {/* Stats Row */}
    <div className="grid md:grid-cols-3 gap-8 mt-16 max-w-3xl mx-auto">
     <div className="text-center">
      <div className="text-4xl gradient-text mb-2">10,000+</div>
      <div className="text-[var(--mid-gray)] ">Success Stories</div>
     </div>
     <div className="text-center">
      <div className="text-4xl gradient-text mb-2">94%</div>
      <div className="text-[var(--mid-gray)] ">Goal Achievement</div>
     </div>
     <div className="text-center">
      <div className="text-4xl gradient-text mb-2">2.8x</div>
      <div className="text-[var(--mid-gray)] ">Faster Progress</div>
     </div>
    </div>
   </div>
  </section>
 )
}

export default SuccessStories