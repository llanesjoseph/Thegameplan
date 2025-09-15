'use client'

import { useState, createContext, useContext } from 'react'
import AIAssistant from './AIAssistant'
import { platformAssistantContext } from '@/lib/ai-service'
import { MessageCircle } from 'lucide-react'

interface AIAssistantContextType {
  showAssistant: () => void
  hideAssistant: () => void
  isVisible: boolean
}

const AIAssistantContext = createContext<AIAssistantContextType | null>(null)

export const useGlobalAI = () => {
  const context = useContext(AIAssistantContext)
  if (!context) {
    throw new Error('useGlobalAI must be used within AIAssistantProvider')
  }
  return context
}

export function AIAssistantProvider({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false)

  const showAssistant = () => setIsVisible(true)
  const hideAssistant = () => setIsVisible(false)

  return (
    <AIAssistantContext.Provider value={{ showAssistant, hideAssistant, isVisible }}>
      {children}
      
      {/* Global Floating AI Assistant */}
      {isVisible && (
        <AIAssistant
          mode="floating"
          title="Platform Assistant"
          context="You are a helpful platform assistant for a sports training platform. Help users navigate features, understand the platform, get technical support, and maximize their experience. Be friendly, clear, and solution-focused."
          placeholder="How can I help you with the platform today?"
          onClose={hideAssistant}
        />
      )}
      
      {/* Global AI Assistant Trigger Button */}
      {!isVisible && (
        <button
          onClick={showAssistant}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center"
          title="Open AI Assistant"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}
    </AIAssistantContext.Provider>
  )
}

export default AIAssistantProvider