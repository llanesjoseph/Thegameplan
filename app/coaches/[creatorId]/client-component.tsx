'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Play, Facebook, Twitter, Instagram, Linkedin, MessageCircle, Send, X, User, Heart, Star, Bookmark, ArrowLeft, Home } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useEnhancedRole } from '@/hooks/use-role-switcher'
import { useRouter } from 'next/navigation'
import { db, auth } from '@/lib/firebase.client'
import { collection, doc, addDoc, deleteDoc, getDocs, query, where, orderBy } from 'firebase/firestore'
import AppHeader from '@/components/ui/AppHeader'
import DOMPurify from 'isomorphic-dompurify'
import FollowButton from '@/components/coach/FollowButton'

interface Creator {
 id: string
 name: string
 firstName: string
 lastName?: string
 sport: string
 tagline: string
 heroImageUrl: string
 headshotUrl: string
 credentials: string
 description: string
 actionPhotos: string[]
 highlightVideo?: string
 socialLinks: {
  facebook?: string
  twitter?: string
  instagram?: string
  linkedin?: string
 }
 trainingLibrary: Array<{
  id: string
  title: string
  status: 'Ended' | 'In Progress' | 'Upcoming'
  thumbnail: string
 }>
}

// Fetch creator data from API
const getCreatorData = async (creatorId: string): Promise<Creator | null> => {
  try {
    const response = await fetch(`/api/coaches/${creatorId}`)
    if (!response.ok) {
      console.error(`Failed to fetch creator ${creatorId}: ${response.status}`)
      return null
    }
    const data = await response.json()
    return data.success ? data.data : null
  } catch (error) {
    console.error('Error fetching creator data:', error)
    return null
  }
}

const formatAIResponse = (content: string): string => {
 // Clean and format AI response content for better readability
 let formatted = content
  // Remove any problematic class strings and HTML artifacts
  .replace(/class="[^"]*"/g, '')
  .replace(/ text-emerald-600/g, '')
  .replace(/italic text-slate-600/g, '')
  .replace(/ml-\d+ mb-\d+/g, '')

  // Remove duplicate sections (like repeated "Safety Notes" or headers)
  .replace(/(###?\s*Safety Notes.*?)###?\s*Safety Notes.*?(?=###|$)/gs, '$1')
  .replace(/(###?\s*\w+.*?)###?\s*\1/gs, '$1')

  // Clean up malformed bullet points
  .replace(/^\s*[•\-\*]\s*([•\-\*]\s*)/gm, '• ')
  .replace(/^\s*([•\-\*])\s*([•\-\*])\s*/gm, '• ')

 // Handle headers with proper styling
 formatted = formatted
  .replace(/^###?\s*(.+)$/gm, '<h4 class="text-gray-900 mb-3 mt-4">$1</h4>')

  // Convert **bold** to proper HTML
  .replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900">$1</strong>')

  // Convert *italic* to proper HTML
  .replace(/\*(.*?)\*/g, '<em class="italic text-gray-700">$1</em>')

  // Handle special callouts like "Pro tip:"
  .replace(/^(Pro tip|Tip|Note):\s*(.+)$/gm, '<div class="bg-blue-50 border-l-4 border-blue-400 p-3 my-3 rounded-r"><div class="flex"><strong class="text-blue-800 mr-2">$1:</strong><span class="text-blue-700">$2</span></div></div>')

  // Handle "Trust your preparation" type callouts
  .replace(/^(Trust your preparation|Remember|Important)[\s\-:]*(.+)$/gm, '<div class="bg-green-50 border-l-4 border-green-400 p-3 my-3 rounded-r"><div class="flex"><strong class="text-green-800 mr-2">$1:</strong><span class="text-green-700">$2</span></div></div>')

  // Convert numbered lists with better spacing
  .replace(/^(\d+)\.\s+(.+)$/gm, '<div class="mb-2 pl-2"><span class="text-gray-800 mr-2">$1.</span><span>$2</span></div>')

  // Handle bullet points with consistent formatting and proper indentation
  .replace(/^[•\-\*]\s+(.+)$/gm, '<div class="mb-2 pl-4 flex items-start"><span class="text-gray-600 mr-2 mt-0.5">•</span><span class="leading-relaxed">$1</span></div>')

 // Split content by double line breaks to create sections
 const sections = formatted.split(/\n\s*\n/).filter(section => section.trim())

 const processedSections = sections.map(section => {
  section = section.trim()
  // If section doesn't have HTML tags and isn't empty, wrap it in a paragraph
  if (section && !section.includes('<div') && !section.includes('<h4') && !section.includes('<strong')) {
   return `<p class="mb-3 leading-relaxed text-gray-800">${section}</p>`
  }
  return section
 }).filter(Boolean)

 return '<div class="space-y-1">' + processedSections.join('\n') + '</div>'
}

interface CreatorPageClientProps {
 creatorId: string
}

interface Message {
 id: string
 content: string
 sender: 'user' | 'creator'
 timestamp: Date
 isFavorited?: boolean
}

interface SavedResponse {
 id: string
 docId?: string // Firestore document ID
 messageId: string
 content: string
 question: string
 creatorId: string
 creatorName: string
 sport: string
 timestamp: Date
 savedAt: Date
 userId: string
}

export default function CreatorPageClient({ creatorId }: CreatorPageClientProps) {
 const { user } = useAuth()
 const { role } = useEnhancedRole()
 const router = useRouter()
 const [creator, setCreator] = useState<Creator | null>(null)
 const [creatorLoading, setCreatorLoading] = useState(true)
 const [showAIChat, setShowAIChat] = useState(false)
 const [messages, setMessages] = useState<Message[]>([])
 const [currentMessage, setCurrentMessage] = useState('')
 const [isLoading, setIsLoading] = useState(false)
 const [savedResponses, setSavedResponses] = useState<SavedResponse[]>([])
 const [showSavedResponses, setShowSavedResponses] = useState(false)

 useEffect(() => {
  const loadCreatorData = async () => {
   setCreatorLoading(true)
   const creatorData = await getCreatorData(creatorId)
   setCreator(creatorData)
   setCreatorLoading(false)
  }
  loadCreatorData()

  // Load saved responses from Firestore
  const loadSavedResponses = async () => {
   if (user) {
    try {
     const savedResponsesRef = collection(db, 'savedResponses')
     const q = query(
      savedResponsesRef,
      where('userId', '==', user.uid),
      where('creatorId', '==', creatorId)
     )
     const querySnapshot = await getDocs(q)

     const responses: SavedResponse[] = []
     querySnapshot.forEach((doc) => {
      const data = doc.data()
      responses.push({
       ...data,
       docId: doc.id,
       timestamp: data.timestamp?.toDate() || new Date(),
       savedAt: data.savedAt?.toDate() || new Date()
      } as SavedResponse)
     })

     // Sort by savedAt in descending order (newest first)
     const sortedResponses = responses.sort((a, b) => b.savedAt.getTime() - a.savedAt.getTime())
     setSavedResponses(sortedResponses)

     // Mark messages as favorited if they exist in saved responses
     setMessages(prev => prev.map(msg => ({
      ...msg,
      isFavorited: responses.some(saved => saved.messageId === msg.id)
     })))
    } catch (error) {
     console.warn('Failed to load saved responses from Firestore, trying localStorage:', error)

     // Fallback to localStorage
     try {
      const saved = localStorage.getItem(`savedResponses_${user.uid}_${creatorId}`)
      if (saved) {
       const responses: SavedResponse[] = JSON.parse(saved).map((response: any) => ({
        ...response,
        timestamp: new Date(response.timestamp),
        savedAt: new Date(response.savedAt)
       }))
       // Sort by savedAt in descending order (newest first)
       const sortedResponses = responses.sort((a, b) => b.savedAt.getTime() - a.savedAt.getTime())
       setSavedResponses(sortedResponses)

       // Mark messages as favorited if they exist in saved responses
       setMessages(prev => prev.map(msg => ({
        ...msg,
        isFavorited: responses.some(saved => saved.messageId === msg.id)
       })))

       console.log('Loaded saved responses from localStorage')
      }
     } catch (localError) {
      console.error('Failed to load from localStorage as well:', localError)
     }
    }
   }
  }

  loadSavedResponses()
 }, [creatorId, user])

 const saveResponse = async (message: Message) => {
  if (!user || !creator || message.sender !== 'creator') return

  try {
   // Find the user's question that preceded this response
   const messageIndex = messages.findIndex(msg => msg.id === message.id)
   let questionContent = "Question not found"

   // Look backwards to find the previous user message
   for (let i = messageIndex - 1; i >= 0; i--) {
    if (messages[i].sender === 'user') {
     questionContent = messages[i].content
     break
    }
   }

   const savedResponseData = {
    messageId: message.id,
    content: message.content,
    question: questionContent,
    creatorId: creator.id,
    creatorName: creator.firstName,
    sport: creator.sport,
    timestamp: new Date(),
    savedAt: new Date(),
    userId: user.uid
   }

   // Try to save to Firestore first
   try {
    const savedResponsesRef = collection(db, 'savedResponses')
    const docRef = await addDoc(savedResponsesRef, savedResponseData)

    const savedResponse: SavedResponse = {
     id: docRef.id,
     docId: docRef.id,
     ...savedResponseData
    }

    const updatedSaved = [...savedResponses, savedResponse]
    setSavedResponses(updatedSaved)

    // Mark message as favorited
    setMessages(prev => prev.map(msg =>
     msg.id === message.id ? { ...msg, isFavorited: true } : msg
    ))

    console.log('Response saved successfully to Firestore')
   } catch (firestoreError) {
    console.warn('Failed to save to Firestore, falling back to localStorage:', firestoreError)

    // Fallback to localStorage
    const savedResponse: SavedResponse = {
     id: Date.now().toString(),
     docId: undefined,
     ...savedResponseData
    }

    const updatedSaved = [...savedResponses, savedResponse]
    setSavedResponses(updatedSaved)

    // Save to localStorage as backup
    localStorage.setItem(`savedResponses_${user.uid}_${creatorId}`, JSON.stringify(updatedSaved))

    // Mark message as favorited
    setMessages(prev => prev.map(msg =>
     msg.id === message.id ? { ...msg, isFavorited: true } : msg
    ))

    console.log('Response saved successfully to localStorage')
   }
  } catch (error) {
   console.error('Failed to save response:', error)
  }
 }

 const removeFavorite = async (messageId: string) => {
  if (!user) return

  try {
   // Find the saved response to delete
   const savedResponse = savedResponses.find(saved => saved.messageId === messageId)

   // Try to delete from Firestore first
   if (savedResponse && savedResponse.docId) {
    try {
     await deleteDoc(doc(db, 'savedResponses', savedResponse.docId))
     console.log('Response removed successfully from Firestore')
    } catch (firestoreError) {
     console.warn('Failed to remove from Firestore:', firestoreError)
    }
   }

   const updatedSaved = savedResponses.filter(saved => saved.messageId !== messageId)
   setSavedResponses(updatedSaved)

   // Update localStorage as well (fallback or backup)
   localStorage.setItem(`savedResponses_${user.uid}_${creatorId}`, JSON.stringify(updatedSaved))

   // Mark message as not favorited
   setMessages(prev => prev.map(msg =>
    msg.id === messageId ? { ...msg, isFavorited: false } : msg
   ))

   console.log('Response removed successfully')
  } catch (error) {
   console.error('Failed to remove response:', error)
  }
 }

 const handleBackToDashboard = () => {
  switch (role) {
   case 'superadmin':
   case 'admin':
    router.push('/dashboard/overview')
    break
   case 'coach':
   case 'creator':
    // All coach-style roles now use the unified coach dashboard
    router.push('/dashboard/coach')
    break
   case 'user':
   default:
    router.push('/dashboard')
    break
  }
 }

 // Local fallback response system
 const getLocalFallbackResponse = (question: string, creator: Creator): string => {
  const lowerQuestion = question.toLowerCase()
  const sport = creator.sport.toLowerCase()
  const firstName = creator.firstName

  // Training and technique questions
  if (lowerQuestion.includes('train') || lowerQuestion.includes('practice')) {
   return `Great question about training! As a ${sport} player, I always focus on consistent practice and proper technique. For ${sport}, I recommend starting with fundamental movements and gradually building complexity. Remember to warm up properly and listen to your body. What specific area of training are you most interested in improving?`
  }

  // Technique-specific questions
  if (lowerQuestion.includes('technique') || lowerQuestion.includes('skill')) {
   return `Technique is everything in ${sport}! The key is repetition with proper form. I always tell athletes to focus on quality over quantity. Start slow, get the mechanics right, then gradually increase speed and intensity. What specific technique would you like to work on?`
  }

  // Mental preparation questions
  if (lowerQuestion.includes('mental') || lowerQuestion.includes('mindset') || lowerQuestion.includes('confidence')) {
   return `Mental preparation is just as important as physical training! I focus on visualization, positive self-talk, and staying present in the moment. Building confidence comes from preparation - the more you practice, the more confident you'll feel. What mental challenges are you facing in your ${sport} journey?`
  }

  // Injury or physical concerns
  if (lowerQuestion.includes('injury') || lowerQuestion.includes('pain') || lowerQuestion.includes('hurt')) {
   return `I understand your concern about injuries. As an athlete, safety is always my top priority. Please consult with a qualified healthcare professional or sports medicine doctor for any injury-related questions. They can provide proper medical advice that I cannot. In the meantime, focus on proper warm-up, cool-down, and listening to your body.`
  }

  // Motivation and goals
  if (lowerQuestion.includes('motivation') || lowerQuestion.includes('goal') || lowerQuestion.includes('improve')) {
   return `I love your motivation to improve! Setting clear, achievable goals is crucial for success in ${sport}. Break down your big goals into smaller, daily actions. Celebrate small wins along the way, and remember that progress takes time. What specific goals are you working toward in your ${sport} journey?`
  }

  // Equipment and gear questions
  if (lowerQuestion.includes('equipment') || lowerQuestion.includes('gear') || lowerQuestion.includes('shoe')) {
   return `Good equipment can definitely help your performance! For ${sport}, I recommend investing in quality basics first - proper footwear, comfortable clothing, and any sport-specific gear that fits well. The most important thing is that you feel comfortable and confident. What specific equipment are you considering?`
  }

  // General advice and catch-all
  return `Thanks for your question! While I'd love to give you a detailed response, I'm having some technical difficulties right now. As a ${sport} athlete, I always encourage focusing on the fundamentals, staying consistent with training, and keeping a positive mindset. Feel free to try asking again, or check out my training library below for more insights! Remember, every champion started as a beginner - keep pushing forward! 🏆`
 }

 const handleSendMessage = async () => {
  if (!currentMessage.trim() || !creator) return

  // Check if user is authenticated
  if (!user) {
   const authPromptMessage: Message = {
    id: Date.now().toString(),
    content: `Hi there! I'd love to answer your question, but you'll need to sign in first to start our conversation. Click the "Sign in" link below to get started, and then we can chat about anything ${creator.sport.toLowerCase()}-related! 😊`,
    sender: 'creator',
    timestamp: new Date()
   }
   setMessages(prev => [...prev, authPromptMessage])
   return
  }

  const userMessage: Message = {
   id: Date.now().toString(),
   content: currentMessage,
   sender: 'user',
   timestamp: new Date()
  }

  setMessages(prev => [...prev, userMessage])
  const originalMessage = currentMessage
  setCurrentMessage('')
  setIsLoading(true)

  try {
   // Get the auth token
   if (!auth.currentUser) {
    throw new Error('User not properly authenticated')
   }
   const token = await auth.currentUser.getIdToken()

   const response = await fetch('/api/ai-coaching', {
    method: 'POST',
    headers: {
     'Content-Type': 'application/json',
     'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
     question: originalMessage,
     creatorId: creator.id,
     userId: user.uid,
     userEmail: user.email
    }),
   })

   const data = await response.json()

   if (response.ok && data.success) {
    const creatorMessage: Message = {
     id: (Date.now() + 1).toString(),
     content: data.response,
     sender: 'creator',
     timestamp: new Date()
    }
    setMessages(prev => [...prev, creatorMessage])
   } else {
    // Enhanced error handling with specific fallback
    const fallbackResponse = getLocalFallbackResponse(originalMessage, creator)
    const errorMessage: Message = {
     id: (Date.now() + 1).toString(),
     content: fallbackResponse,
     sender: 'creator',
     timestamp: new Date()
    }
    setMessages(prev => [...prev, errorMessage])
   }
  } catch (error) {
   console.error('Chat error:', error)
   // Enhanced fallback with creator-specific response
   const fallbackResponse = getLocalFallbackResponse(originalMessage, creator)
   const errorMessage: Message = {
    id: (Date.now() + 1).toString(),
    content: fallbackResponse,
    sender: 'creator',
    timestamp: new Date()
   }
   setMessages(prev => [...prev, errorMessage])
  } finally {
   setIsLoading(false)
  }
 }

 // Show loading state while fetching
 if (creatorLoading) {
  return (
   <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
     <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
     <p className="text-gray-600">Loading coach profile...</p>
    </div>
   </div>
  )
 }

 // Show not found only after loading is complete
 if (!creator) {
  return (
   <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
     <h1 className="text-2xl mb-4">Coach Not Found</h1>
     <Link href="/coaches" className="text-blue-600 hover:underline">
      Back to Coaches
     </Link>
    </div>
   </div>
  )
 }

 return (
  <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
   <AppHeader />

   {/* Navigation Bar */}
   {user && (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
     <div className="max-w-7xl mx-auto flex items-center gap-4">
      <button
       onClick={handleBackToDashboard}
       className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
      >
       <ArrowLeft className="w-4 h-4" />
       <span className="text-sm ">Back to Dashboard</span>
      </button>
      <div className="text-gray-300">|</div>
      <button
       onClick={() => router.push('/coaches')}
       className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
      >
       <Home className="w-4 h-4" />
       <span className="text-sm ">All Coaches</span>
      </button>
     </div>
    </div>
   )}

   {/* Hero Section */}
   <section className="bg-blue-900 text-white">
    {/* Top Section with Name and Credentials */}
    <div className="text-center py-12">
     <h1 className="text-4xl md:text-5xl mb-4">
      {creator.name}
     </h1>
     <p className="text-lg mb-2">{creator.tagline}</p>
     <p className="text-lg">{creator.credentials}</p>

     {/* Profile Picture */}
     <div className="mt-8 flex justify-center">
      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white bg-gray-200 flex items-center justify-center">
       {creator.headshotUrl && !creator.headshotUrl.includes('placeholder') ? (
        <Image
         src={creator.headshotUrl}
         alt={creator.name}
         width={128}
         height={128}
         className="w-full h-full object-cover"
         onError={(e) => {
          const target = e.target as HTMLImageElement
          target.style.display = 'none'
         }}
        />
       ) : (
        <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white text-2xl font-bold">
         {creator.firstName.charAt(0)}{creator.lastName ? creator.lastName.charAt(0) : ''}
        </div>
       )}
      </div>
     </div>

     {/* Follow Button */}
     <div className="mt-6 flex justify-center">
      <FollowButton coachId={creator.id} coachName={creator.name} variant="default" />
     </div>
    </div>

    {/* Action Photos Section */}
    <div className="relative">
     <div className="grid grid-cols-2 h-96">
      {/* Left side - Single larger image */}
      <div className="relative overflow-hidden">
       <Image
        src={creator.actionPhotos[0]}
        alt={`${creator.firstName} action photo 1`}
        fill
        className="object-cover"
       />
      </div>

      {/* Right side - Single larger image */}
      <div className="relative overflow-hidden">
       <Image
        src={creator.actionPhotos[1]}
        alt={`${creator.firstName} action photo 2`}
        fill
        className="object-cover"
       />
      </div>
     </div>

     {/* Overlay Content */}
     <div className="absolute inset-0 bg-black/50 flex items-center">
      <div className="w-full max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
       {/* Left Side - Quote */}
       <div className="text-white">
        <blockquote className="text-2xl md:text-3xl  leading-relaxed">
         {creator.tagline || creator.description || `${creator.sport} training with ${creator.firstName}`}
        </blockquote>

        {/* Social Links */}
        <div className="flex gap-4 mt-6">
         {creator.socialLinks.facebook && (
          <a href={creator.socialLinks.facebook} className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition">
           <Facebook className="w-5 h-5 text-white" />
          </a>
         )}
         {creator.socialLinks.twitter && (
          <a href={creator.socialLinks.twitter} className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center hover:bg-blue-500 transition">
           <Twitter className="w-5 h-5 text-white" />
          </a>
         )}
         {creator.socialLinks.linkedin && (
          <a href={creator.socialLinks.linkedin} className="w-10 h-10 bg-blue-800 rounded-full flex items-center justify-center hover:bg-blue-900 transition">
           <Linkedin className="w-5 h-5 text-white" />
          </a>
         )}
         {creator.socialLinks.instagram && (
          <a href={creator.socialLinks.instagram} className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center hover:bg-pink-700 transition">
           <Instagram className="w-5 h-5 text-white" />
          </a>
         )}
        </div>
       </div>

       {/* Right Side - Highlight Video */}
       {creator.highlightVideo && (
        <div className="relative">
         <div className="aspect-video bg-black rounded-lg overflow-hidden">
          <iframe
           src={creator.highlightVideo}
           title={`${creator.firstName} Highlights`}
           className="w-full h-full"
           frameBorder="0"
           allowFullScreen
          />
         </div>
         <div className="absolute top-4 left-4">
          <div className="bg-blue-900 text-white px-3 py-1 rounded text-sm ">
           HIGHLIGHTS
          </div>
         </div>
        </div>
       )}
      </div>
     </div>
    </div>
   </section>

   {/* Ask Me About Soccer Section */}
   <section className="py-16 bg-gray-100">
    <div className="max-w-7xl mx-auto px-4">
     <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      {/* Left Side - Text Content */}
      <div>
       <h2 className="text-4xl mb-6 text-gray-900">
        Ask Me About {creator.sport}
       </h2>
       <p className="text-lg text-gray-700 mb-8 leading-relaxed">
        {creator.description}
       </p>
       <button
        onClick={() => setShowAIChat(true)}
        className="bg-blue-500 text-white px-6 py-3 rounded-lg  hover:bg-blue-600 transition flex items-center gap-2"
       >
        <MessageCircle className="w-5 h-5" />
        Ask {creator.firstName}
       </button>
      </div>

      {/* Right Side - Large Action Photo */}
      <div className="relative">
       <div className="aspect-[4/3] rounded-lg overflow-hidden bg-red-600">
        <Image
         src={creator.actionPhotos[2]}
         alt={`${creator.firstName} in action`}
         fill
         className="object-cover"
        />
       </div>
      </div>
     </div>
    </div>
   </section>

   {/* Training Library Section */}
   <section className="py-16 bg-white">
    <div className="max-w-7xl mx-auto px-4">
     <h2 className="text-3xl mb-12 text-gray-900">
      {creator.firstName}'s Training Library
     </h2>

     <div className="space-y-6">
      {creator.trainingLibrary.map((item) => (
       <div key={item.id} className="flex items-center gap-6 p-6 bg-gray-50 rounded-lg">
        {/* Thumbnail */}
        <div className="w-20 h-14 bg-gray-300 rounded overflow-hidden flex-shrink-0">
         <Image
          src={item.thumbnail}
          alt={item.title}
          width={80}
          height={56}
          className="w-full h-full object-cover"
         />
        </div>

        {/* Content */}
        <div className="flex-1">
         <h3 className="text-lg  text-gray-900 mb-2">
          {item.title}
         </h3>
         <div className="flex items-center gap-4">
          <span className={`px-3 py-1 rounded-full text-sm  ${
           item.status === 'Ended'
            ? 'bg-green-100 text-green-800'
            : item.status === 'In Progress'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-gray-100 text-gray-800'
          }`}>
           {item.status}
          </span>
         </div>
        </div>
       </div>
      ))}
     </div>
    </div>
   </section>

   {/* AI Chat Modal */}
   {showAIChat && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
     <div className="bg-white rounded-xl max-w-4xl w-full max-h-[85vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
       <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full overflow-hidden">
         <Image
          src={creator.headshotUrl}
          alt={creator.firstName}
          width={40}
          height={40}
          className="w-full h-full object-cover"
         />
        </div>
        <div>
         <h3 className=" text-gray-900 text-lg">Ask {creator.firstName}</h3>
         <p className="text-sm text-gray-600 ">{creator.sport} Coach</p>
        </div>
       </div>
       <div className="flex items-center gap-2">
        <button
         onClick={() => setShowSavedResponses(!showSavedResponses)}
         className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm  transition-colors ${
          showSavedResponses
           ? 'bg-red-100 text-red-700 hover:bg-red-200'
           : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
         }`}
        >
         <Heart className={`w-4 h-4 ${showSavedResponses ? 'fill-current' : ''}`} />
         Saved ({savedResponses.length})
        </button>
        <button
         onClick={() => setShowAIChat(false)}
         className="text-gray-400 hover:text-gray-600"
        >
         <X className="w-6 h-6" />
        </button>
       </div>
      </div>

      {/* Messages/Saved Responses */}
      <div className="flex-1 overflow-y-auto p-0">
       {!showSavedResponses ? (
        <>
         {messages.length === 0 && (
          <div className="text-center py-12 px-6">
           <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
           <p className="text-gray-500 mb-2">Start a conversation with {creator.firstName}</p>
           <p className="text-sm text-gray-400">Ask about techniques, training, or anything soccer-related!</p>
          </div>
         )}

         {messages.map((message) => (
          <div key={message.id} className={`w-full py-4 px-6 border-b border-gray-100 ${
           message.sender === 'user' ? 'bg-gray-50' : 'bg-white'
          }`}>
           <div className="max-w-4xl mx-auto">
            <div className="flex gap-4">
             <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
              {message.sender === 'creator' ? (
               <Image
                src={creator.headshotUrl}
                alt={creator.firstName}
                width={32}
                height={32}
                className="w-full h-full object-cover"
               />
              ) : (
               <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
               </div>
              )}
             </div>
             <div className="flex-1 min-w-0">
              <div className=" text-sm text-gray-900 mb-2">
               {message.sender === 'creator' ? creator.firstName : 'You'}
              </div>
              <div className="text-gray-800 text-sm leading-relaxed">
               {message.sender === 'creator' ? (
                <div dangerouslySetInnerHTML={{
                 __html: DOMPurify.sanitize(formatAIResponse(message.content))
                }} />
               ) : (
                <div>{message.content}</div>
               )}
              </div>
              {message.sender === 'creator' && (
               <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-100">
                <button
                 onClick={() => message.isFavorited ? removeFavorite(message.id) : saveResponse(message)}
                 className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs  transition-colors ${
                  message.isFavorited
                   ? 'text-red-700 bg-red-50 hover:bg-red-100 border border-red-200'
                   : 'text-gray-600 hover:text-red-600 hover:bg-red-50 border border-gray-200 hover:border-red-200'
                 }`}
                >
                 <Heart className={`w-3 h-3 ${message.isFavorited ? 'fill-current' : ''}`} />
                 {message.isFavorited ? 'Saved' : 'Save'}
                </button>
               </div>
              )}
             </div>
            </div>
           </div>
          </div>
         ))}

         {isLoading && (
          <div className="w-full py-4 px-6 border-b border-gray-100 bg-white">
           <div className="max-w-4xl mx-auto">
            <div className="flex gap-4">
             <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
              <Image
               src={creator.headshotUrl}
               alt={creator.firstName}
               width={32}
               height={32}
               className="w-full h-full object-cover"
              />
             </div>
             <div className="flex-1 min-w-0">
              <div className=" text-sm text-gray-900 mb-2">
               {creator.firstName}
              </div>
              <div className="flex space-x-1">
               <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
               <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
               <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
             </div>
            </div>
           </div>
          </div>
         )}
        </>
       ) : (
        <>
         {/* Saved Responses View */}
         {savedResponses.length === 0 ? (
          <div className="text-center py-12 px-6">
           <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
           <p className="text-gray-500 mb-2">No saved responses yet</p>
           <p className="text-sm text-gray-400">Save responses from your conversations to access them later!</p>
          </div>
         ) : (
          <>
           <div className="p-4 bg-gray-50 border-b">
            <h4 className=" text-gray-900 text-base">Saved Responses ({savedResponses.length})</h4>
            <p className="text-sm text-gray-600 ">Your favorited responses from {creator.firstName}</p>
           </div>
           {savedResponses.map((response) => (
            <div key={response.id} className="w-full py-4 px-6 border-b border-gray-100 bg-white">
             <div className="max-w-4xl mx-auto">
              <div className="flex gap-4">
               <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                <Image
                 src={creator.headshotUrl}
                 alt={creator.firstName}
                 width={32}
                 height={32}
                 className="w-full h-full object-cover"
                />
               </div>
               <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                 <div className=" text-sm text-gray-900">{creator.firstName}</div>
                 <div className="text-xs text-gray-500 ">
                  {new Date(response.savedAt).toLocaleDateString()}
                 </div>
                </div>
                <div className="text-gray-800 text-sm leading-relaxed">
                 <div dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(formatAIResponse(response.content))
                 }} />
                </div>
                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-100">
                 <button
                  onClick={() => removeFavorite(response.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs  text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
                 >
                  <Heart className="w-3 h-3 fill-current" />
                  Remove
                 </button>
                </div>
               </div>
              </div>
             </div>
            </div>
           ))}
          </>
         )}
        </>
       )}
      </div>

      {/* Input */}
      <div className="border-t p-6">
       <div className="flex gap-3">
        <input
         type="text"
         value={currentMessage}
         onChange={(e) => setCurrentMessage(e.target.value)}
         onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
         placeholder={`Ask ${creator.firstName} anything about ${creator.sport.toLowerCase()}...`}
         className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
         disabled={isLoading}
        />
        <button
         onClick={handleSendMessage}
         disabled={!currentMessage.trim() || isLoading}
         className="bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors "
        >
         <Send className="w-4 h-4" />
        </button>
       </div>
       {!user && (
        <p className="text-xs text-gray-500 mt-2 text-center">
         <Link href="/dashboard" className="text-blue-500 hover:underline">Sign in</Link> to start asking questions
        </p>
       )}
      </div>
     </div>
    </div>
   )}
  </div>
 )
}