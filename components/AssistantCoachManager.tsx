'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, arrayRemove, setDoc } from 'firebase/firestore'
import {
 UserPlus,
 Users,
 Search,
 Star,
 Trophy,
 CheckCircle,
 XCircle,
 Shield,
 Crown,
 Plus,
 Trash2
} from 'lucide-react'

interface User {
 id: string
 displayName: string
 email: string
 role: string
 specialties?: string[]
 sport?: string
 experience?: string
 isAssistantCoach?: boolean
 parentCoach?: string
}

interface AssistantCoachManagerProps {
 coachId: string
 currentAssistants: string[]
 onUpdate?: () => void
}

export default function AssistantCoachManager({
 coachId,
 currentAssistants = [],
 onUpdate
}: AssistantCoachManagerProps) {
 const { user } = useAuth()
 const [searchTerm, setSearchTerm] = useState('')
 const [searchResults, setSearchResults] = useState<User[]>([])
 const [assistants, setAssistants] = useState<User[]>([])
 const [isSearching, setIsSearching] = useState(false)
 const [isLoading, setIsLoading] = useState(false)

 // Load current assistant coaches
 useEffect(() => {
  const loadAssistants = async () => {
   if (currentAssistants.length === 0) return

   try {
    const assistantPromises = currentAssistants.map(async (assistantId) => {
     const userQuery = query(
      collection(db, 'users'),
      where('__name__', '==', assistantId)
     )
     const snapshot = await getDocs(userQuery)
     return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
     })) as User[]
    })

    const assistantArrays = await Promise.all(assistantPromises)
    const allAssistants = assistantArrays.flat()
    setAssistants(allAssistants)
   } catch (error) {
    console.error('Error loading assistants:', error)
   }
  }

  loadAssistants()
 }, [currentAssistants])

 // Search for potential assistant coaches
 const handleSearch = async () => {
  if (!searchTerm.trim()) return

  setIsSearching(true)

  try {
   // Search users by email or name
   const queries = [
    query(
     collection(db, 'users'),
     where('email', '>=', searchTerm.toLowerCase()),
     where('email', '<=', searchTerm.toLowerCase() + '\uf8ff')
    ),
    query(
     collection(db, 'users'),
     where('displayName', '>=', searchTerm),
     where('displayName', '<=', searchTerm + '\uf8ff')
    )
   ]

   const results: User[] = []

   for (const q of queries) {
    const snapshot = await getDocs(q)
    snapshot.docs.forEach(doc => {
     const userData = { id: doc.id, ...doc.data() } as User
     // Filter out current coach, existing assistants, and duplicates
     if (
      userData.id !== coachId &&
      !currentAssistants.includes(userData.id) &&
      !results.find(r => r.id === userData.id)
     ) {
      results.push(userData)
     }
    })
   }

   setSearchResults(results.slice(0, 10)) // Limit to 10 results
  } catch (error) {
   console.error('Error searching users:', error)
  } finally {
   setIsSearching(false)
  }
 }

 // Assign user as assistant coach
 const handleAssignAssistant = async (userId: string, userData: User) => {
  setIsLoading(true)

  try {
   // Update coach's assistant list
   await updateDoc(doc(db, 'coaches', coachId), {
    assistantCoaches: arrayUnion(userId),
    updatedAt: new Date().toISOString()
   })

   // Update user's role and parent coach
   await updateDoc(doc(db, 'users', userId), {
    role: 'assistant_coach',
    parentCoach: coachId,
    isAssistantCoach: true,
    updatedAt: new Date().toISOString()
   })

   // Create assistant coach profile
   const assistantProfile = {
    id: userId,
    name: userData.displayName,
    firstName: userData.displayName.split(' ')[0],
    email: userData.email,
    parentCoach: coachId,
    isAssistantCoach: true,
    specialties: userData.specialties || [],
    sport: userData.sport || '',
    experience: userData.experience || '',
    role: 'assistant_coach',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
   }

   await setDoc(doc(db, 'assistant_coaches', userId), assistantProfile)

   // Update local state
   setAssistants(prev => [...prev, userData])
   setSearchResults(prev => prev.filter(r => r.id !== userId))

   // Call onUpdate callback if provided
   onUpdate?.()

   alert(`${userData.displayName} has been assigned as an assistant coach!`)
  } catch (error) {
   console.error('Error assigning assistant coach:', error)
   alert('Error assigning assistant coach. Please try again.')
  } finally {
   setIsLoading(false)
  }
 }

 // Remove assistant coach
 const handleRemoveAssistant = async (userId: string, userName: string) => {
  if (!confirm(`Are you sure you want to remove ${userName} as an assistant coach?`)) {
   return
  }

  setIsLoading(true)

  try {
   // Update coach's assistant list
   await updateDoc(doc(db, 'coaches', coachId), {
    assistantCoaches: arrayRemove(userId),
    updatedAt: new Date().toISOString()
   })

   // Reset user's role back to regular user
   await updateDoc(doc(db, 'users', userId), {
    role: 'user',
    parentCoach: null,
    isAssistantCoach: false,
    updatedAt: new Date().toISOString()
   })

   // Remove assistant coach profile
   // Note: We're not deleting the document but could mark as inactive
   await updateDoc(doc(db, 'assistant_coaches', userId), {
    isActive: false,
    removedAt: new Date().toISOString()
   })

   // Update local state
   setAssistants(prev => prev.filter(a => a.id !== userId))

   // Call onUpdate callback if provided
   onUpdate?.()

   alert(`${userName} has been removed as an assistant coach.`)
  } catch (error) {
   console.error('Error removing assistant coach:', error)
   alert('Error removing assistant coach. Please try again.')
  } finally {
   setIsLoading(false)
  }
 }

 return (
  <div className="bg-gradient-to-br from-white to-sky-blue/5 rounded-2xl shadow-lg border border-white/50 p-8">
   <div className="flex items-center gap-3 mb-6">
    <div className="w-8 h-8 bg-gradient-to-r from-sky-blue to-black rounded-lg flex items-center justify-center">
     <Users className="w-4 h-4 text-white" />
    </div>
    <h3 className="text-xl text-dark font-heading">Assistant Coaches</h3>
   </div>

   {/* Current Assistants */}
   <div className="mb-8">
    <h4 className="text-lg font-semibold text-dark mb-4">Current Assistants ({assistants.length})</h4>

    {assistants.length === 0 ? (
     <div className="text-center py-8 text-dark/60">
      <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
      <p>No assistant coaches assigned yet.</p>
     </div>
    ) : (
     <div className="grid md:grid-cols-2 gap-4">
      {assistants.map((assistant) => (
       <div key={assistant.id} className="bg-white/80 rounded-xl p-4 border border-sky-blue/10">
        <div className="flex items-center justify-between mb-3">
         <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green to-green/80 rounded-lg flex items-center justify-center text-white ">
           {assistant.displayName.charAt(0)}
          </div>
          <div>
           <h5 className=" text-dark">{assistant.displayName}</h5>
           <p className="text-sm text-dark/60">{assistant.email}</p>
          </div>
         </div>

         <button
          onClick={() => handleRemoveAssistant(assistant.id, assistant.displayName)}
          disabled={isLoading}
          className="p-2 text-orange hover:bg-orange/10 rounded-lg transition-colors disabled:opacity-50"
         >
          <Trash2 className="w-4 h-4" />
         </button>
        </div>

        {assistant.specialties && assistant.specialties.length > 0 && (
         <div className="flex flex-wrap gap-1">
          {assistant.specialties.slice(0, 3).map((specialty, index) => (
           <span
            key={index}
            className="px-2 py-1 bg-green/20 text-green text-xs rounded-full border border-green/30"
           >
            {specialty}
           </span>
          ))}
          {assistant.specialties.length > 3 && (
           <span className="px-2 py-1 bg-dark/10 text-dark/60 text-xs rounded-full">
            +{assistant.specialties.length - 3} more
           </span>
          )}
         </div>
        )}
       </div>
      ))}
     </div>
    )}
   </div>

   {/* Add New Assistant */}
   <div>
    <h4 className="text-lg font-semibold text-dark mb-4">Add New Assistant Coach</h4>

    <div className="flex gap-3 mb-4">
     <div className="flex-1 relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark/40" />
      <input
       type="text"
       placeholder="Search by email or name..."
       value={searchTerm}
       onChange={(e) => setSearchTerm(e.target.value)}
       onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
       className="w-full pl-10 pr-4 py-3 border-2 border-sky-blue/20 bg-white/80 rounded-xl text-dark placeholder-dark/50 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/20 transition-all"
      />
     </div>
     <button
      onClick={handleSearch}
      disabled={isSearching || !searchTerm.trim()}
      className="px-6 py-3 bg-gradient-to-r from-sky-blue to-black text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all flex items-center gap-2"
     >
      {isSearching ? (
       <>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        Searching...
       </>
      ) : (
       <>
        <Search className="w-4 h-4" />
        Search
       </>
      )}
     </button>
    </div>

    {/* Search Results */}
    {searchResults.length > 0 && (
     <div className="space-y-3">
      <h5 className="font-semibold text-dark">Search Results</h5>
      {searchResults.map((result) => (
       <div key={result.id} className="bg-white/80 rounded-xl p-4 border border-sky-blue/10">
        <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-black to-sky-blue rounded-lg flex items-center justify-center text-white ">
           {result.displayName.charAt(0)}
          </div>

          <div className="flex-1">
           <div className="flex items-center gap-2 mb-1">
            <h6 className=" text-dark">{result.displayName}</h6>
            {result.role === 'creator' && (
             <Crown className="w-4 h-4 text-orange" />
            )}
            {result.isAssistantCoach && (
             <Shield className="w-4 h-4 text-sky-blue" />
            )}
           </div>

           <p className="text-sm text-dark/60 mb-2">{result.email}</p>

           <div className="flex items-center gap-4 text-xs text-dark/50">
            {result.sport && (
             <span className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              {result.sport}
             </span>
            )}
            {result.experience && <span>{result.experience}</span>}
            <span className="capitalize">Role: {result.role}</span>
           </div>
          </div>
         </div>

         <button
          onClick={() => handleAssignAssistant(result.id, result)}
          disabled={isLoading}
          className="px-4 py-2 bg-green/20 text-green rounded-lg hover:bg-green/30 transition-colors disabled:opacity-50 flex items-center gap-2"
         >
          <UserPlus className="w-4 h-4" />
          Assign
         </button>
        </div>
       </div>
      ))}
     </div>
    )}

    {searchTerm && searchResults.length === 0 && !isSearching && (
     <div className="text-center py-6 text-dark/60">
      <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
      <p>No users found matching "{searchTerm}"</p>
      <p className="text-xs mt-1">Try searching by exact email address</p>
     </div>
    )}
   </div>
  </div>
 )
}