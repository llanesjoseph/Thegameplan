'use client'

import React, { useState } from 'react'
import { Brain, Lightbulb, Target, Zap, Activity, Eye, MessageCircle, Sparkles } from 'lucide-react'

const AIFeatures = () => {
  const [activeFeature, setActiveFeature] = useState(0)

  const features = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: "Intelligent Analysis",
      description: "AI analyzes your performance, identifies patterns, and suggests personalized improvements.",
      color: "from-[var(--primary-blue)] to-[var(--accent-indigo)]"
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Adaptive Learning",
      description: "Dynamic curriculum that adjusts to your progress, strengths, and learning style.",
      color: "from-[var(--accent-indigo)] to-[var(--secondary-slate)]"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Fast Feedback",
      description: "Quick coaching insights and corrections as you train or create content.",
      color: "from-[var(--muted-teal)] to-[var(--primary-blue)]"
    },
    {
      icon: <Lightbulb className="w-6 h-6" />,
      title: "Strategic Insights",
      description: "Data-driven recommendations for optimal training schedules and content strategies.",
      color: "from-[var(--warm-gray)] to-[var(--accent-indigo)]"
    }
  ]

  return (
    <section className="section-light section-padding">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="section-title">
            Powered by <span className="gradient-text">Advanced AI</span>
          </h2>
          <p className="section-subtitle">
            Experience the future of personalized coaching with our intelligent learning system
          </p>
        </div>
        
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Feature List */}
            <div className="space-y-4">
              {features.map((feature, index) => (
                <FeatureCard
                  key={index}
                  feature={feature}
                  index={index}
                  isActive={activeFeature === index}
                  onClick={() => setActiveFeature(index)}
                />
              ))}
            </div>
            
            {/* Interactive Visualization */}
            <div className="flex justify-center">
              <AIVisualization activeFeature={activeFeature} />
            </div>
          </div>
        </div>
        
        {/* Feature Stats - Redesigned */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-[var(--deep-black)] mb-3">Trusted by thousands of users worldwide</h3>
            <p className="text-[var(--mid-gray)] max-w-2xl mx-auto">Our AI-powered platform delivers consistent, reliable results that help you achieve your goals faster.</p>
          </div>
          
          <div className="bg-gradient-to-r from-[var(--primary-blue)]/5 via-transparent to-[var(--accent-indigo)]/5 py-16 px-8 rounded-3xl">
            <div className="flex flex-col md:flex-row justify-center items-center gap-16 max-w-4xl mx-auto">
              <StatCard
                icon={<Activity className="w-8 h-8" />}
                number="99.7%"
                label="Accuracy Rate"
                color="text-[var(--muted-teal)]"
              />
              <div className="hidden md:block w-px h-20 bg-[var(--light-gray)]"></div>
              <StatCard
                icon={<Eye className="w-8 h-8" />}
                number="24/7"
                label="AI Monitoring"
                color="text-[var(--primary-blue)]"
              />
              <div className="hidden md:block w-px h-20 bg-[var(--light-gray)]"></div>
              <StatCard
                icon={<Sparkles className="w-8 h-8" />}
                number="10M+"
                label="Data Points"
                color="text-[var(--secondary-slate)]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

interface FeatureCardProps {
  feature: {
    icon: React.ReactNode
    title: string
    description: string
    color: string
  }
  index: number
  isActive: boolean
  onClick: () => void
}

const FeatureCard = ({ feature, index, isActive, onClick }: FeatureCardProps) => {
  return (
    <div
      className={`game-plan-card p-6 cursor-pointer transition-all duration-300 ${
        isActive ? 'border-[var(--primary-cyan)] transform translate-x-2' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center text-white flex-shrink-0`}>
          {feature.icon}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-[var(--deep-black)] mb-2">{feature.title}</h3>
          <p className="text-[var(--mid-gray)] leading-relaxed">{feature.description}</p>
        </div>
        <div className={`w-4 h-4 rounded-full border-2 border-[var(--light-gray)] transition-all duration-300 ${
          isActive ? 'bg-[var(--primary-cyan)] border-[var(--primary-cyan)]' : ''
        }`}></div>
      </div>
    </div>
  )
}

const AIVisualization = ({ activeFeature }: { activeFeature: number }) => {
  return (
    <div className="relative w-80 h-80">
      {/* Central AI Core */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div 
          className="w-24 h-24 bg-gradient-to-br from-[var(--primary-blue)] to-[var(--accent-indigo)] rounded-full flex items-center justify-center shadow-lg"
          style={{ 
            animation: 'morphing 6s ease-in-out infinite',
            boxShadow: '0 0 40px rgba(79, 70, 229, 0.4)'
          }}
        >
          <Brain className="w-12 h-12 text-white" />
        </div>
      </div>
      
      {/* Orbiting Elements */}
      {[0, 1, 2, 3].map((index) => (
        <OrbitingElement
          key={index}
          index={index}
          isActive={activeFeature === index}
          icon={[
            <Target className="w-4 h-4" />,
            <Zap className="w-4 h-4" />,
            <Lightbulb className="w-4 h-4" />,
            <Activity className="w-4 h-4" />
          ][index]}
        />
      ))}
      
      {/* Connecting Lines */}
      {[0, 1, 2, 3].map((index) => (
        <ConnectingLine
          key={index}
          index={index}
          isActive={activeFeature === index}
        />
      ))}
      
      {/* Pulse Rings */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-48 h-48 border border-[var(--primary-blue)]/20 rounded-full animate-pulse"></div>
        <div className="absolute inset-4 border border-[var(--accent-indigo)]/20 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute inset-8 border border-[var(--muted-teal)]/20 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
    </div>
  )
}

const OrbitingElement = ({ index, isActive, icon }: { index: number; isActive: boolean; icon: React.ReactNode }) => {
  const positions = [
    { top: '10%', left: '50%', transform: 'translateX(-50%)' },
    { top: '50%', right: '10%', transform: 'translateY(-50%)' },
    { bottom: '10%', left: '50%', transform: 'translateX(-50%)' },
    { top: '50%', left: '10%', transform: 'translateY(-50%)' }
  ]

  return (
    <div
      className={`absolute w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
        isActive
          ? 'bg-gradient-to-br from-[var(--primary-blue)] to-[var(--accent-indigo)] text-white scale-110 shadow-lg'
          : 'bg-white border-2 border-[var(--light-gray)] text-[var(--mid-gray)]'
      }`}
      style={{
        ...positions[index],
        animation: isActive ? 'pulse 2s ease-in-out infinite' : 'float 4s ease-in-out infinite'
      }}
    >
      {icon}
    </div>
  )
}

const ConnectingLine = ({ index, isActive }: { index: number; isActive: boolean }) => {
  const lineStyles = [
    { top: '35%', left: '50%', width: '2px', height: '15%', transformOrigin: 'top' },
    { top: '50%', right: '35%', width: '15%', height: '2px', transformOrigin: 'right' },
    { bottom: '35%', left: '50%', width: '2px', height: '15%', transformOrigin: 'bottom' },
    { top: '50%', left: '35%', width: '15%', height: '2px', transformOrigin: 'left' }
  ]

  return (
    <div
      className={`absolute transition-all duration-500 ${
        isActive
          ? 'bg-gradient-to-r from-[var(--primary-blue)] to-[var(--accent-indigo)]'
          : 'bg-[var(--light-gray)]'
      }`}
      style={{
        ...lineStyles[index],
        opacity: isActive ? 1 : 0.3,
        transform: `translate${index % 2 ? 'Y' : 'X'}(-50%)`
      }}
    />
  )
}

const StatCard = ({ icon, number, label, color }: {
  icon: React.ReactNode
  number: string
  label: string
  color: string
}) => {
  return (
    <div className="text-center">
      <div className={`w-20 h-20 ${color.replace('text-', 'bg-')}/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-${color.replace('text-', '')}/20`}>
        <div className={color}>
          {icon}
        </div>
      </div>
      <div className={`text-5xl font-black ${color} mb-2`}>{number}</div>
      <div className="text-[var(--mid-gray)] text-lg font-semibold">{label}</div>
    </div>
  )
}

export default AIFeatures