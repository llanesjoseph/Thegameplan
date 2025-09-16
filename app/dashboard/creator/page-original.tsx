'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { auth, db, storage } from '@/lib/firebase.client'
import { useEnhancedRole } from "@/hooks/use-role-switcher"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from 'next/navigation'
import { collection, addDoc, query, where, getCountFromServer, serverTimestamp, getDoc, doc, getDocs, orderBy, deleteDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import AIAssistant from '@/components/AIAssistant'
import { contentCreationContext } from '@/lib/ai-service'
import { 
  Play, 
  Upload, 
  Calendar, 
  Eye,
  Users,
  TrendingUp,
  Video,
  Image,
  Clock,
  CheckCircle,
  AlertCircle,
  FileVideo,
  Sparkles,
  Target,
  ArrowLeft,
  Plus,
  Bot,
  Wand2,
  MessageSquare,
  Edit3,
  Trash2,
  ExternalLink,
  MoreVertical
} from 'lucide-react'

export default function CreatorDashboard() {
  const { role, loading: loadingRole } = useEnhancedRole()
  const { user: authUser, loading: authLoading } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    if (loadingRole) return
    // Temporarily allow access for testing
    // if (role !== 'creator' && role !== 'admin' && role !== 'superadmin') {
    //   router.replace('/dashboard')
    // }
  }, [role, loadingRole, router])

  const [activeTab, setActiveTab] = useState<'create' | 'manage' | 'analytics'>('create')
  
  const schema = z.object({
    title: z.string().min(3),
    description: z.string().min(10),
    longDescription: z.string().optional(),
    level: z.enum(['All Levels', 'Beginner', 'Intermediate', 'Advanced']),
    schedule: z.object({ enabled: z.boolean(), date: z.string().optional() }).optional()
  })
  
  type FormValues = z.infer<typeof schema>
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '', longDescription: '', level: 'All Levels', schedule: { enabled: false, date: '' } }
  })
  
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [thumbFile, setThumbFile] = useState<File | null>(null)
  const [videoProgress, setVideoProgress] = useState<number>(0)
  const [thumbProgress, setThumbProgress] = useState<number>(0)
  const [creating, setCreating] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [lessonCount, setLessonCount] = useState<number>(0)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [showAIAssistant, setShowAIAssistant] = useState(false)
  const [showUniversalAI, setShowUniversalAI] = useState(false)
  const [aiSuggestion, setAISuggestion] = useState('')
  const [generatingContent, setGeneratingContent] = useState(false)
  const [selectedSport, setSelectedSport] = useState('soccer')
  const [additionalDetails, setAdditionalDetails] = useState('')
  const [refiningContent, setRefiningContent] = useState(false)
  const [polishingContent, setPolishingContent] = useState(false)
  const [polishingLongDescription, setPolishingLongDescription] = useState(false)
  const [longDescriptionPolished, setLongDescriptionPolished] = useState(false)
  const [basicContentPolished, setBasicContentPolished] = useState(false)
  const [publishedLessonId, setPublishedLessonId] = useState<string | null>(null)
  const [publishedLessons, setPublishedLessons] = useState<any[]>([])
  const [loadingLessons, setLoadingLessons] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Watch for changes to content but keep notifications visible
  // Users can manually dismiss them if they want
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      // Only reset if the field is completely cleared
      if (name === 'longDescription' && !value?.longDescription?.trim()) {
        setLongDescriptionPolished(false)
      }
      // Reset basic polish notification if both title and description are cleared
      if ((name === 'title' || name === 'description') && 
          !value?.title?.trim() && !value?.description?.trim()) {
        setBasicContentPolished(false)
      }
    })
    return () => subscription.unsubscribe()
  }, [watch])

  // Temporarily force canCreate to true for debugging
  const canCreate = useMemo(() => true, [])
  // Original: const canCreate = useMemo(() => !!watch('title')?.trim() && !!watch('description')?.trim(), [watch])

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // DEBUG: First, let's get ALL lessons to see what's in Firebase
        const allLessonsQuery = query(collection(db, 'content'))
        const allLessonsSnap = await getDocs(allLessonsQuery)
        const allLessons = allLessonsSnap.docs.map(doc => ({
          id: doc.id,
          creatorUid: doc.data().creatorUid,
          title: doc.data().title
        }))
        console.log('🔍 ALL LESSONS IN FIREBASE:', allLessons)
        console.log('🔍 CURRENT AUTH USER:', authUser)
        console.log('🔍 AUTH USER ID:', authUser?.uid)
        
        // Set total count for now (for debugging)
        setLessonCount(allLessons.length)
        
        // If user is authenticated, also try to get their specific lessons
        if (authUser?.uid) {
          const userQuery = query(collection(db, 'content'), where('creatorUid', '==', authUser.uid))
          const userSnap = await getCountFromServer(userQuery)
          console.log('👤 USER SPECIFIC LESSONS:', userSnap.data().count)
        }
      } catch (error) {
        console.error('🚨 FETCH ERROR:', error)
        setLessonCount(0)
      }
    }
    fetchCounts()
  }, [authUser?.uid, creating])

  // Fetch published lessons when manage tab is active
  useEffect(() => {
    if (activeTab === 'manage') {
      fetchPublishedLessons()
    }
  }, [activeTab])

  const fetchPublishedLessons = async () => {
    setLoadingLessons(true)
    try {
      // DEBUG: Show ALL lessons for now, regardless of authentication
      const q = query(
        collection(db, 'content'),
        orderBy('createdAt', 'desc')
      )
      const querySnapshot = await getDocs(q)
      const lessons = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setPublishedLessons(lessons)
      console.log('📚 DEBUG: Fetched ALL lessons:', lessons.length)
      console.log('📚 DEBUG: Lessons data:', lessons)
      
      // Show lessons for current user OR test user
      const testUserId = 'test_superadmin_creator'
      const currentUserId = authUser?.uid || testUserId
      
      const userLessons = lessons.filter(lesson => 
        lesson.creatorUid === currentUserId || 
        (lesson.creatorUid === testUserId && !authUser?.uid) // Show test lessons if not authenticated
      )
      console.log('👤 DEBUG: User/Test lessons:', userLessons.length, userLessons)
      console.log('🆔 Current User ID:', currentUserId)
      console.log('🆔 Test User ID:', testUserId)
    } catch (error) {
      console.error('🚨 Error fetching lessons:', error)
      setPublishedLessons([])
    } finally {
      setLoadingLessons(false)
    }
  }

  const deleteLesson = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson? This action cannot be undone.')) {
      return
    }
    try {
      await deleteDoc(doc(db, 'content', lessonId))
      setPublishedLessons(prev => prev.filter(lesson => lesson.id !== lessonId))
      setLessonCount(prev => Math.max(0, prev - 1))
      alert('Lesson deleted successfully!')
    } catch (error) {
      console.error('Error deleting lesson:', error)
      alert('Failed to delete lesson. Please try again.')
    }
  }

  const onSubmit = async (values: FormValues) => {
    console.log('🎯 FORM ONSUBMIT CALLED!')
    console.log('Form submitted with values:', values)
    console.log('User ID:', authUser?.uid)
    console.log('Can create:', canCreate)
    
    // TEST MODE: Allow creating lessons without authentication (using a test user ID)
    const userId = authUser?.uid || 'test_superadmin_creator'
    
    if (!authUser?.uid) {
      console.warn('⚠️ TEST MODE: Creating lesson without authentication using test user ID:', userId)
    }
    
    setCreating(true)
    setUploadSuccess(false)
    
    try {
      console.log('Starting lesson creation...')
      let videoUrl = ''
      let thumbnail = ''
      
      // Upload video file if provided
      if (videoFile) {
        console.log('Uploading video file:', videoFile.name)
        const videoRef = ref(storage, `uploads/${userId}/videos/${Date.now()}-${videoFile.name}`)
        await uploadBytes(videoRef, videoFile)
        videoUrl = await getDownloadURL(videoRef)
        console.log('Video uploaded successfully:', videoUrl)
      }

      // Upload thumbnail if provided
      if (thumbFile) {
        console.log('Uploading thumbnail file:', thumbFile.name)
        const thumbRef = ref(storage, `uploads/${userId}/thumbs/${Date.now()}-${thumbFile.name}`)
        await uploadBytes(thumbRef, thumbFile)
        thumbnail = await getDownloadURL(thumbRef)
        console.log('Thumbnail uploaded successfully:', thumbnail)
      }

      const lessonData = {
        creatorUid: userId,
        visibility: 'public',
        type: 'lesson',
        title: values.title,
        description: values.description,
        longDescription: values.longDescription || '',
        level: values.level,
        status: values.schedule?.enabled && values.schedule?.date ? 'scheduled' : 'published',
        scheduledAt: values.schedule?.enabled && values.schedule?.date ? new Date(values.schedule.date) : null,
        videoUrl,
        thumbnail,
        hasMedia: !!(videoFile || thumbFile),
        views: 0,
        createdAt: serverTimestamp()
      }
      
      console.log('Saving lesson data:', lessonData)
      
      // REAL FIREBASE SAVE - No fallbacks
      const docRef = await addDoc(collection(db, 'content'), lessonData)
      const savedLessonId = docRef.id
      console.log('✅ REAL FIREBASE SAVE SUCCESSFUL! Lesson ID:', docRef.id)
      
      // Verify the save by reading it back
      const savedDoc = await getDoc(doc(db, 'content', docRef.id))
      if (savedDoc.exists()) {
        console.log('✅ VERIFIED: Lesson exists in Firebase:', savedDoc.data())
      } else {
        throw new Error('Lesson was not properly saved to Firebase')
      }

      setUploadSuccess(true)
      setPublishedLessonId(savedLessonId)
      alert('✅ SUCCESS! Lesson has been published successfully!')
      
      // Update lesson count to show it worked
      setLessonCount(prev => prev + 1)
      
      reset()
      setVideoFile(null)
      setThumbFile(null)
      
      // Keep success message visible until user takes action
      // setTimeout(() => setUploadSuccess(false), 10000)
      
    } catch (e) {
      console.error('❌ FIREBASE SAVE FAILED:', e)
      
      // More specific error handling
      if (e instanceof Error) {
        if (e.message.includes('permission') || e.message.includes('PERMISSION_DENIED')) {
          alert(`🔒 FIREBASE PERMISSION ERROR: ${e.message}\n\nTo fix this, you need to update your Firebase Security Rules to allow writes to the 'content' collection.`)
        } else {
          alert(`❌ FIREBASE ERROR: ${e.message}\n\nPlease check your Firebase configuration and try again.`)
        }
      } else {
        alert('❌ Unknown Firebase error occurred. Check console for details.')
      }
      
      // Log detailed error for debugging
      console.error('Full error object:', e)
    } finally {
      setCreating(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const generateFullLesson = async (prompt: string, shouldSave = false) => {
    setGeneratingContent(true)
    try {
      // Use OpenAI to generate sport-specific content
      console.log(`🤖 Generating ${selectedSport} lesson for: ${prompt}`)
      
      const aiPrompt = `You are an expert ${selectedSport} instructor. Create a detailed lesson plan for "${prompt}" in ${selectedSport}. 

Please provide a comprehensive lesson in this exact JSON format:
{
  "title": "Engaging lesson title for ${prompt} in ${selectedSport}",
  "description": "Detailed description of what students will learn",
  "duration": "15 minutes",
  "difficulty": "Beginner",
  "objectives": ["Objective 1", "Objective 2", "Objective 3", "Objective 4"],
  "chapters": [
    {"title": "Chapter 1 Title", "duration": "3 min", "content": "What students learn in this chapter"},
    {"title": "Chapter 2 Title", "duration": "4 min", "content": "What students learn in this chapter"},
    {"title": "Chapter 3 Title", "duration": "5 min", "content": "What students learn in this chapter"},
    {"title": "Chapter 4 Title", "duration": "3 min", "content": "What students learn in this chapter"}
  ],
  "exercises": [
    {"name": "Exercise 1", "description": "Detailed exercise instructions", "duration": "5 minutes", "equipment": ["equipment needed"]},
    {"name": "Exercise 2", "description": "Detailed exercise instructions", "duration": "5 minutes", "equipment": ["equipment needed"]},
    {"name": "Exercise 3", "description": "Detailed exercise instructions", "duration": "5 minutes", "equipment": ["equipment needed"]}
  ]
}

Make sure all content is specifically relevant to ${selectedSport} and the topic "${prompt}". Use proper ${selectedSport} terminology and techniques.`

      const response = await fetch('/api/ai-coaching', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: aiPrompt }),
      })

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'API call failed')
      }

      console.log('✅ AI Response received:', data.response.substring(0, 200) + '...')
      
      // Try to extract JSON from the response
      let suggestion
      try {
        // Look for JSON in the response
        const jsonMatch = data.response.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          suggestion = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('No JSON found in response')
        }
      } catch (parseError) {
        console.warn('❌ Failed to parse AI JSON, using fallback structure')
        // Fallback structure if JSON parsing fails
        suggestion = {
          title: `${selectedSport} - ${prompt.charAt(0).toUpperCase() + prompt.slice(1)}`,
          description: data.response.substring(0, 200) + '...',
          duration: '15 minutes',
          difficulty: 'Beginner',
          objectives: ['Learn fundamental techniques', 'Practice key skills', 'Build confidence', 'Apply in game situations'],
          chapters: [
            { title: 'Introduction', duration: '3 min', content: 'Overview of key concepts' },
            { title: 'Technique Breakdown', duration: '5 min', content: 'Step-by-step instruction' },
            { title: 'Practice Drills', duration: '5 min', content: 'Guided practice exercises' },
            { title: 'Application', duration: '2 min', content: 'How to use in real situations' }
          ],
          exercises: [
            { name: 'Basic Drill', description: data.response.substring(0, 100), duration: '5 minutes', equipment: ['Basic equipment'] }
          ]
        }
      }
      
      // Use the old fallback structure for reference, but replace with AI content
      const detailedSportContent = {
        soccer: {
          'basics': {
            title: 'Master Soccer Fundamentals: Ball Control & First Touch',
            description: 'Learn essential ball control techniques that every soccer player needs to master. This lesson covers proper first touch, ball manipulation, and body positioning to improve your overall game control and confidence on the field.',
            duration: '15 minutes',
            difficulty: 'Beginner',
            objectives: [
              'Master proper first touch technique with both feet',
              'Develop consistent ball control under pressure',
              'Learn body positioning for optimal ball reception',
              'Practice cone drills for improved touch consistency'
            ],
            chapters: [
              {
                title: 'Introduction to Ball Control',
                duration: '3 min',
                content: 'Understanding the importance of first touch in soccer and how it affects your overall game performance.'
              },
              {
                title: 'Proper Stance and Body Position',
                duration: '4 min', 
                content: 'Learn the correct body positioning, foot placement, and stance for receiving passes effectively.'
              },
              {
                title: 'First Touch Techniques',
                duration: '5 min',
                content: 'Step-by-step breakdown of first touch with inside foot, outside foot, and instep techniques.'
              },
              {
                title: 'Practice Drills',
                duration: '3 min',
                content: 'Cone exercises and wall practice routines to develop muscle memory and consistency.'
              }
            ],
            exercises: [
              'Wall passing - 50 touches each foot',
              'Cone weaving with first touch control',
              'Partner passing with movement',
              'Pressure simulation drills'
            ],
            keyPoints: [
              'Keep your head up to scan the field',
              'Use the inside of your foot for better control',
              'Cushion the ball to reduce bounce',
              'Practice with both feet equally'
            ]
          },
          'shooting': {
            title: 'Perfect Your Soccer Shot: Power & Precision Training',
            description: 'Develop lethal shooting skills with proven techniques for both power and placement. Master the fundamentals of body positioning, foot placement, and follow-through to become a consistent goal scorer.',
            duration: '18 minutes',
            difficulty: 'Intermediate',
            objectives: [
              'Master proper shooting form and technique',
              'Develop power without sacrificing accuracy',
              'Learn to shoot with both feet effectively',
              'Practice finishing from various angles and distances'
            ],
            chapters: [
              {
                title: 'Shooting Fundamentals',
                duration: '4 min',
                content: 'Body positioning, plant foot placement, and the importance of keeping your head steady during the shot.'
              },
              {
                title: 'Power vs Placement',
                duration: '5 min',
                content: 'When to use power shots vs placed shots, and how to execute both techniques effectively.'
              },
              {
                title: 'Finishing from Different Angles',
                duration: '6 min',
                content: 'Adapting your shooting technique based on position relative to goal and defensive pressure.'
              },
              {
                title: 'Advanced Finishing Techniques',
                duration: '3 min',
                content: 'Volleys, half-volleys, and one-touch finishes for game situations.'
              }
            ],
            exercises: [
              'Target practice - corners and center',
              'Moving ball finishing',
              'Weak foot shooting development',
              '1v1 finishing under pressure'
            ],
            keyPoints: [
              'Strike through the center of the ball',
              'Keep your body over the ball',
              'Follow through toward your target',
              'Practice shooting with minimal touches'
            ]
          },
          'default': {
            title: 'Essential Soccer Skills: Foundation Training',
            description: 'Build a solid foundation with this comprehensive soccer skills lesson. Perfect for players looking to improve their fundamental techniques and game understanding.',
            duration: '12 minutes',
            difficulty: 'Beginner',
            objectives: [
              'Develop core soccer skills and techniques',
              'Build confidence with the ball',
              'Learn basic tactical concepts',
              'Establish proper training habits'
            ],
            chapters: [
              {
                title: 'Soccer Basics Overview',
                duration: '3 min',
                content: 'Introduction to fundamental soccer skills every player needs to develop.'
              },
              {
                title: 'Ball Familiarity',
                duration: '4 min',
                content: 'Getting comfortable with the ball through basic touches and movements.'
              },
              {
                title: 'Essential Techniques',
                duration: '5 min',
                content: 'Passing, receiving, and basic ball control in game-like situations.'
              }
            ],
            exercises: [
              'Ball juggling progression',
              'Basic passing patterns', 
              'Simple 1v1 scenarios',
              'Agility ladder work'
            ],
            keyPoints: [
              'Focus on consistent first touches',
              'Use both feet in all drills',
              'Maintain good body posture',
              'Keep your head up when possible'
            ]
          }
        },
        basketball: {
          'default': {
            title: 'Basketball Skills Development: Core Fundamentals',
            description: 'Build essential basketball skills with this comprehensive training lesson. Perfect for players looking to improve their fundamental techniques and game IQ.',
            duration: '14 minutes',
            difficulty: 'Beginner',
            objectives: [
              'Develop proper dribbling technique',
              'Learn basic shooting fundamentals',
              'Master passing accuracy',
              'Understand court positioning'
            ],
            chapters: [
              {
                title: 'Dribbling Fundamentals',
                duration: '4 min',
                content: 'Hand positioning, ball control, and protective dribbling techniques.'
              },
              {
                title: 'Shooting Form Basics',
                duration: '5 min',
                content: 'Proper stance, grip, and follow-through for consistent shooting.'
              },
              {
                title: 'Passing Techniques',
                duration: '3 min',
                content: 'Chest pass, bounce pass, and overhead pass fundamentals.'
              },
              {
                title: 'Court Awareness',
                duration: '2 min',
                content: 'Reading the game and understanding positioning.'
              }
            ],
            exercises: [
              'Stationary dribbling drills',
              'Form shooting close to basket',
              'Partner passing accuracy',
              'Defensive stance practice'
            ],
            keyPoints: [
              'Keep your head up while dribbling',
              'Follow through on every shot',
              'Use fingertip control on passes',
              'Stay balanced in all movements'
            ]
          }
        },
        bjj: {
          'default': {
            title: 'BJJ Skills Development: Positional Mastery',
            description: 'Build comprehensive Brazilian Jiu Jitsu skills with position-based training. Perfect for grapplers looking to develop systematic approaches to all aspects of the game.',
            duration: '16 minutes',
            difficulty: 'Intermediate',
            objectives: [
              'Understand fundamental BJJ positions',
              'Learn basic submission mechanics',
              'Develop guard retention skills',
              'Master basic escapes'
            ],
            chapters: [
              {
                title: 'Position Hierarchy',
                duration: '4 min',
                content: 'Understanding dominant and submissive positions in BJJ.'
              },
              {
                title: 'Guard Fundamentals',
                duration: '5 min',
                content: 'Closed guard, open guard basics, and retention concepts.'
              },
              {
                title: 'Basic Submissions',
                duration: '4 min',
                content: 'Armbar and triangle choke from guard position.'
              },
              {
                title: 'Escape Basics',
                duration: '3 min',
                content: 'Getting out of mount and side control positions.'
              }
            ],
            exercises: [
              'Guard retention drills',
              'Submission setup practice',
              'Positional sparring',
              'Escape sequence repetition'
            ],
            keyPoints: [
              'Maintain proper posture and base',
              'Create frames for defense',
              'Move with purpose and control',
              'Breathe and stay calm under pressure'
            ]
          }
        }
      }
      
      // We now have our AI-generated suggestion - no need for fallback logic!
      console.log('✅ Using AI-generated lesson:', suggestion.title)

      // If shouldSave is true, save the complete lesson to Firebase
      if (shouldSave && authUser) {
        const completeLesson = {
          id: `lesson_${Date.now()}`,
          creatorUid: authUser.uid,
          creatorName: authUser.displayName || 'Creator',
          title: suggestion.title,
          description: suggestion.description,
          sport: selectedSport,
          duration: suggestion.duration,
          difficulty: suggestion.difficulty,
          objectives: suggestion.objectives,
          chapters: suggestion.chapters,
          exercises: suggestion.exercises,
          status: 'draft',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }
        
        console.log('🔥 Saving lesson to Firebase:', completeLesson.title)
        await addDoc(collection(db, 'content'), completeLesson)
        setPublishedLessonId(completeLesson.id)
        console.log('✅ Lesson saved successfully!')
      }

      setAISuggestion(`
**Generated Lesson: ${suggestion.title}**

**Description:** ${suggestion.description}

**Duration:** ${suggestion.duration} | **Difficulty:** ${suggestion.difficulty}

**Learning Objectives:**
${suggestion.objectives.map(obj => `• ${obj}`).join('\n')}

**Lesson Chapters:**
${suggestion.chapters.map((chapter, i) => `${i+1}. **${chapter.title}** (${chapter.duration})\n   ${chapter.content}`).join('\n\n')}

**Practice Exercises:**
${suggestion.exercises.map((ex, i) => `${i+1}. **${ex.name}** (${ex.duration})\n   ${ex.description}\n   Equipment: ${ex.equipment.join(', ')}`).join('\n\n')}
      `)
      
    } catch (error) {
      console.error('AI generation error:', error instanceof Error ? error.message : String(error))
      setAISuggestion('')
    } finally {
      setGeneratingContent(false)
    }
  }

  // Legacy function for backwards compatibility
  const generateAIContent = (prompt: string) => {
    return generateFullLesson(prompt, false)
  }

  const createAndSaveLesson = (prompt: string) => {
    return generateFullLesson(prompt, true)
  }

  const polishLessonContent = async () => {
    const currentValues = watch()
    if (!currentValues.title || !currentValues.description) return
    
    setPolishingContent(true)
    try {
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 2500))
      
      const title = currentValues.title.trim()
      const description = currentValues.description.trim()
      
      // Enhanced title
      let enhancedTitle = title
      if (!title.includes(':') && title.length < 40) {
        // Add descriptive subtitle if title is simple
        if (title.toLowerCase().includes('choke')) {
          enhancedTitle = `${title}: Advanced Setup and Finishing Techniques`
        } else if (title.toLowerCase().includes('guard')) {
          enhancedTitle = `${title}: Systematic Training and Applications`
        } else if (title.toLowerCase().includes('pass')) {
          enhancedTitle = `${title}: Pressure and Movement Systems`
        } else {
          enhancedTitle = `${title}: Comprehensive Training Guide`
        }
      }
      
      // Enhanced description
      let enhancedDescription = description
      
      // Add professional structure if description is basic
      if (description.length < 100) {
        enhancedDescription = `${description}

This comprehensive lesson covers:
• Fundamental mechanics and proper form
• Step-by-step technique breakdown
• Common mistakes and how to avoid them
• Practice drills for skill development
• Real-world applications and scenarios

Perfect for ${currentValues.level?.toLowerCase() || 'all skill levels'}, this lesson combines theoretical understanding with practical application to ensure lasting improvement and technical mastery.`
      } else {
        // Polish existing longer description
        enhancedDescription = `${description}

Key learning outcomes include mastering proper technique, understanding tactical applications, and developing muscle memory through structured practice. This lesson integrates fundamental principles with advanced concepts, ensuring comprehensive skill development for long-term athletic growth.`
      }
      
      // Update form values
      reset({
        ...currentValues,
        title: enhancedTitle,
        description: enhancedDescription
      })
      
      // Show completion notification (stays visible)
      setBasicContentPolished(true)
      
    } catch (error) {
      console.error('Error polishing content:', error instanceof Error ? error.message : String(error))
    } finally {
      setPolishingContent(false)
    }
  }

  const polishLongDescription = async () => {
    const currentValues = watch()
    const longDesc = currentValues.longDescription?.trim() || ''
    const title = currentValues.title?.trim() || ''
    const description = currentValues.description?.trim() || ''
    
    if (!longDesc && !title && !description) return
    
    setPolishingLongDescription(true)
    try {
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      let polishedContent = ''
      
      if (longDesc.length > 0) {
        // Clean up and enhance existing long description
        polishedContent = `${longDesc}

## Detailed Learning Objectives
This comprehensive lesson is designed to provide in-depth understanding and practical mastery of the subject matter. Students will develop both theoretical knowledge and hands-on skills through structured learning modules.

## What You'll Master
• **Fundamental Techniques**: Core mechanics and proper form execution
• **Advanced Applications**: Real-world scenarios and tactical implementation  
• **Common Pitfalls**: Identification and correction of frequent mistakes
• **Progressive Training**: Skill-building exercises from basic to advanced
• **Performance Optimization**: Efficiency improvements and refinement techniques

## Lesson Structure & Flow
Each section builds upon previous concepts, ensuring comprehensive understanding. Interactive demonstrations, guided practice sessions, and detailed explanations combine to create an engaging learning experience.

## Expected Outcomes
By completion, students will have gained confidence, technical proficiency, and the ability to apply these skills independently in practical situations.`
      } else {
        // Generate comprehensive content from title and short description
        const topic = title || description || 'the subject'
        polishedContent = `## Course Overview
This comprehensive lesson provides detailed instruction on ${topic.toLowerCase()}. Designed for serious students looking to master both the theoretical foundations and practical applications.

## Learning Objectives
• **Technical Mastery**: Develop precise execution and proper form
• **Tactical Understanding**: Learn when, why, and how to apply techniques
• **Problem Solving**: Recognize and adapt to different scenarios
• **Skill Integration**: Connect individual techniques into fluid combinations
• **Performance Analysis**: Self-assessment and continuous improvement methods

## What You'll Learn
This lesson breaks down complex concepts into digestible segments, starting with fundamental principles and progressing through advanced applications. Each module includes:

### Foundation Module
- Proper positioning and body mechanics
- Core principles and underlying theory
- Safety considerations and injury prevention

### Application Module  
- Step-by-step technique breakdown
- Timing and distance management
- Adaptation for different situations

### Mastery Module
- Advanced variations and combinations
- Troubleshooting common problems
- Performance optimization strategies

## Teaching Methodology
Through a combination of clear explanations, visual demonstrations, and structured practice sessions, students develop both understanding and muscle memory. Each concept is reinforced through multiple learning modalities.

## Expected Results
Students completing this lesson will have developed competence, confidence, and the foundation for continued growth. The skills learned here serve as building blocks for more advanced training.`
      }
      
      // Update the long description
      reset({
        ...currentValues,
        longDescription: polishedContent
      })
      
      // Show completion notification (stays visible)
      setLongDescriptionPolished(true)
      
    } catch (error) {
      console.error('Error polishing long description:', error instanceof Error ? error.message : String(error))
    } finally {
      setPolishingLongDescription(false)
    }
  }

  const refineWithAdditionalDetails = async () => {
    if (!aiSuggestion || !additionalDetails.trim()) return
    
    setRefiningContent(true)
    try {
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const currentSuggestion = JSON.parse(aiSuggestion)
      const details = additionalDetails.trim()
      
      // Enhance the existing suggestion with additional details
      const refinedSuggestion = {
        ...currentSuggestion,
        description: currentSuggestion.description + ' ' + (
          details.includes('.') ? details : `Additional focus: ${details}.`
        ),
        objectives: [
          ...currentSuggestion.objectives,
          ...(details.toLowerCase().includes('drill') ? [`Practice specific drills: ${details}`] : []),
          ...(details.toLowerCase().includes('technique') ? [`Master advanced technique: ${details}`] : []),
          ...(details.toLowerCase().includes('common') || details.toLowerCase().includes('mistake') ? [`Avoid common mistakes: ${details}`] : [])
        ].slice(0, 6), // Limit to 6 objectives
        chapters: [
          ...currentSuggestion.chapters,
          {
            title: 'Advanced Applications',
            duration: '3 min',
            content: `Applying the lesson concepts with your specific focus: ${details}`
          }
        ],
        exercises: [
          ...currentSuggestion.exercises,
          `Custom drill: ${details.split(' ').slice(0, 8).join(' ')}${details.split(' ').length > 8 ? '...' : ''}`
        ],
        keyPoints: [
          ...currentSuggestion.keyPoints,
          `Remember: ${details.split(' ').slice(0, 10).join(' ')}${details.split(' ').length > 10 ? '...' : ''}`
        ].slice(0, 6) // Limit to 6 key points
      }
      
      setAISuggestion(JSON.stringify(refinedSuggestion))
      setAdditionalDetails('') // Clear the input after refining
      
    } catch (error) {
      console.error('Error refining content:', error instanceof Error ? error.message : String(error))
    } finally {
      setRefiningContent(false)
    }
  }

  const applyAISuggestion = () => {
    if (aiSuggestion) {
      try {
        const suggestion = JSON.parse(aiSuggestion)
        // Use react-hook-form's setValue to update form fields
        // Note: This would require importing setValue from useForm
        // For now, we'll just show the suggestion and let user copy
        setShowAIAssistant(false)
      } catch (error) {
        console.error('Error applying AI suggestion:', error instanceof Error ? error.message : String(error))
      }
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-6">
            <Link 
              href="/dashboard/overview" 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600 group-hover:text-purple-600" />
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-gray-900">
                  Content Studio
                </h1>
              </div>
              <p className="text-gray-600 text-lg">Create, manage, and analyze your educational content</p>
            </div>
          </div>
          
          {uploadSuccess && (
            <div className="bg-green-100 border border-green-300 rounded-lg px-4 py-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-800 font-medium">Lesson published successfully!</span>
            </div>
          )}
        </div>

        {/* Stats Dashboard - Compact Version */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Video className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-xl font-bold text-blue-600">{lessonCount}</div>
            </div>
            <div className="text-gray-900 font-medium text-sm">Lessons</div>
            <div className="text-gray-500 text-xs">Published</div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Eye className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-bold text-emerald-600">0</div>
            </div>
            <div className="text-gray-900 font-medium text-sm">Views</div>
            <div className="text-gray-500 text-xs">Total</div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-xl font-bold text-purple-600">0</div>
            </div>
            <div className="text-gray-900 font-medium text-sm">Students</div>
            <div className="text-gray-500 text-xs">Active</div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-orange-600" />
              </div>
              <div className="text-xl font-bold text-orange-600">-</div>
            </div>
            <div className="text-gray-900 font-medium text-sm">Engagement</div>
            <div className="text-gray-500 text-xs">Rate</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mb-8 p-1 bg-white rounded-xl border border-gray-200 shadow-sm">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'create'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Plus className="w-4 h-4" />
            Create Content
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'manage'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <FileVideo className="w-4 h-4" />
            Manage Library
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'analytics'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Analytics
          </button>
        </div>

        {/* Content Based on Active Tab */}
        {activeTab === 'create' && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Creation Form */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <Plus className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Create New Lesson</h2>
                      <p className="text-slate-300">Share your expertise with students worldwide</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setShowAIAssistant(true)}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg font-medium flex items-center gap-2 transition-all duration-200 transform hover:scale-105 shadow-lg shadow-cyan-500/25"
                  >
                    <Bot className="w-4 h-4" />
                    AI Assistant
                  </button>
                  
                  <button
                    onClick={() => setShowUniversalAI(true)}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-lg font-medium flex items-center gap-2 transition-all duration-200 transform hover:scale-105 shadow-lg shadow-purple-500/25"
                  >
                    <Sparkles className="w-4 h-4" />
                    Content AI Chat
                  </button>
                </div>

                {/* Success Message Banner */}
                {uploadSuccess && (
                  <div className="mb-6 p-6 bg-green-900/20 border border-green-500/30 rounded-xl">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-green-400 font-semibold text-lg mb-2">Lesson Published Successfully! 🎉</h3>
                        <p className="text-green-300 mb-4">Your lesson has been saved and is now available to students.</p>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-3 flex-wrap">
                          <button
                            onClick={() => {
                              // Navigate to view the published lesson
                              if (publishedLessonId) {
                                window.open(`/lesson/${publishedLessonId}`, '_blank')
                              } else {
                                alert('Lesson ID not available - but the lesson was published successfully!')
                              }
                            }}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Published Lesson
                          </button>
                          
                          <button
                            onClick={() => {
                              // Reset form to create another lesson
                              setUploadSuccess(false)
                              setPublishedLessonId(null)
                              window.scrollTo({ top: 0, behavior: 'smooth' })
                            }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create Another Lesson
                          </button>
                          
                          <button
                            onClick={() => {
                              // Go to manage lessons (library)
                              setActiveTab('manage')
                            }}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            Manage Lessons
                          </button>
                          
                          <button
                            onClick={() => {
                              setUploadSuccess(false)
                              setPublishedLessonId(null)
                            }}
                            className="px-3 py-2 text-green-400 hover:text-green-300 rounded-lg transition-colors text-sm"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                  {/* Basic Information */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-white font-semibold mb-2">Lesson Title *</label>
                      <input
                        {...register('title')}
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20 transition-all"
                        placeholder="Enter a compelling lesson title..."
                      />
                      {errors.title && (
                        <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          Title must be at least 3 characters
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-white font-semibold mb-2">Description *</label>
                      <textarea
                        {...register('description')}
                        rows={4}
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20 transition-all resize-none"
                        placeholder="Describe what students will learn in this lesson..."
                      />
                      {errors.description && (
                        <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          Description must be at least 10 characters
                        </p>
                      )}
                      
                      {/* AI Polish Button */}
                      {(watch('title') || watch('description')) && (
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-slate-400 text-sm">
                              Let AI enhance and expand your lesson details
                            </p>
                            <button
                              type="button"
                              onClick={polishLessonContent}
                              disabled={polishingContent || (!watch('title') && !watch('description'))}
                              className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20"
                              title="Enhance title and expand description with professional structure"
                            >
                              {polishingContent ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  Polishing...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-4 h-4" />
                                  AI Polish
                                </>
                              )}
                            </button>
                          </div>
                          
                          {polishingContent && (
                            <div className="bg-amber-600/10 border border-amber-400/20 rounded-lg p-3">
                              <div className="flex items-center gap-2 text-amber-300 text-sm">
                                <div className="w-4 h-4 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                                Enhancing your content with professional structure and detailed descriptions...
                              </div>
                            </div>
                          )}

                          {basicContentPolished && (
                            <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-4 h-4 text-white" />
                                  </div>
                                  <div>
                                    <h5 className="text-amber-200 font-medium text-sm">Basic Content Enhanced!</h5>
                                    <p className="text-amber-300/80 text-xs">Title and description have been professionally polished.</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => setBasicContentPolished(false)}
                                  className="text-amber-400 hover:text-amber-300 p-1 rounded-md hover:bg-amber-400/10 transition-colors"
                                  title="Dismiss notification"
                                >
                                  ✕
                                </button>
                              </div>
                              <div className="mt-2 text-xs text-amber-400/70">
                                ✓ Professional formatting applied • Ready for detailed content
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-white font-semibold mb-2">Skill Level</label>
                      <select
                        {...register('level')}
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20 transition-all"
                      >
                        <option value="All Levels">All Levels</option>
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>

                    {/* Long-form Description Section */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-white font-semibold">Detailed Course Content</label>
                        <span className="text-slate-400 text-sm">Optional • Rich formatting supported</span>
                      </div>
                      
                      <textarea
                        {...register('longDescription')}
                        rows={12}
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20 transition-all resize-none font-mono text-sm"
                        placeholder="Add comprehensive lesson details, learning objectives, modules, methodology, and expected outcomes..."
                      />
                      
                      {/* AI Polish Button for Long Description */}
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-slate-400 text-sm">
                            Transform your content into professional course materials
                          </p>
                          <button
                            type="button"
                            onClick={polishLongDescription}
                            disabled={polishingLongDescription}
                            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                            title="Generate comprehensive course structure and professional content"
                          >
                            {polishingLongDescription ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Wand2 className="w-4 h-4" />
                                AI Polish & Expand
                              </>
                            )}
                          </button>
                        </div>
                        
                        {polishingLongDescription && (
                          <div className="bg-emerald-600/10 border border-emerald-400/20 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-emerald-300 text-sm">
                              <div className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                              Creating comprehensive course content with learning objectives, modules, and professional structure...
                            </div>
                          </div>
                        )}

                        {longDescriptionPolished && (
                          <div className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-400/30 rounded-lg p-4 animate-fade-in">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                                  <CheckCircle className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <h4 className="text-emerald-300 font-semibold">Content Successfully Enhanced!</h4>
                                  <p className="text-emerald-200 text-sm">Your course content has been expanded with professional structure, learning objectives, and comprehensive modules.</p>
                                </div>
                              </div>
                              <button
                                onClick={() => setLongDescriptionPolished(false)}
                                className="text-emerald-400 hover:text-emerald-300 p-1 rounded-md hover:bg-emerald-400/10 transition-colors ml-3"
                                title="Dismiss notification"
                              >
                                ✕
                              </button>
                            </div>
                            <div className="mt-3 pt-3 border-t border-emerald-400/20">
                              <div className="flex items-center justify-between text-xs">
                                <div className="text-emerald-300">
                                  ✓ Learning objectives added • ✓ Module structure created • ✓ Professional formatting applied
                                </div>
                                <div className="text-emerald-400 font-medium">
                                  ✨ Ready to publish!
                                </div>
                              </div>
                            </div>
                            <div className="mt-2 text-xs text-emerald-400/70">
                              This notification will stay visible until dismissed or content is edited
                            </div>
                          </div>
                        )}
                        
                        <div className="text-xs text-slate-500">
                          Supports markdown formatting • Use ## for headers • Use • for bullet points
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Media Upload Section */}
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-semibold flex items-center gap-2">
                        <Upload className="w-5 h-5" />
                        Media Assets
                      </h3>
                      <span className="text-slate-400 text-sm">Optional • Can be added later</span>
                    </div>
                    
                    <div className="mb-4 p-3 bg-blue-600/10 border border-blue-400/20 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-300 text-sm">
                        <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                          <span className="text-white text-xs">ℹ</span>
                        </div>
                        <span className="font-medium">Media assets are now optional</span>
                      </div>
                      <p className="text-blue-200/80 text-xs mt-1 ml-6">
                        You can publish lessons without video or thumbnail files. Media can be added or updated at any time after publishing.
                      </p>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Video Upload */}
                      <div>
                        <label className="block text-white font-medium mb-3">Video File</label>
                        <div className="relative">
                          <input
                            type="file"
                            accept="video/*"
                            onChange={e => setVideoFile(e.target.files?.[0] || null)}
                            className="hidden"
                            id="video-upload"
                          />
                          <label
                            htmlFor="video-upload"
                            className="block w-full bg-slate-600/30 border-2 border-dashed border-slate-500/50 rounded-xl p-6 text-center cursor-pointer hover:border-purple-400/50 hover:bg-slate-600/50 transition-all"
                          >
                            <Video className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                            {videoFile ? (
                              <div>
                                <p className="text-white font-medium">{videoFile.name}</p>
                                <p className="text-slate-400 text-sm">{formatFileSize(videoFile.size)}</p>
                              </div>
                            ) : (
                              <div>
                                <p className="text-white font-medium mb-1">Drop your video here</p>
                                <p className="text-slate-400 text-sm">MP4, MOV, AVI supported</p>
                              </div>
                            )}
                          </label>
                        </div>
                      </div>

                      {/* Thumbnail Upload */}
                      <div>
                        <label className="block text-white font-medium mb-3">Thumbnail Image</label>
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={e => setThumbFile(e.target.files?.[0] || null)}
                            className="hidden"
                            id="thumbnail-upload"
                          />
                          <label
                            htmlFor="thumbnail-upload"
                            className="block w-full bg-slate-600/30 border-2 border-dashed border-slate-500/50 rounded-xl p-6 text-center cursor-pointer hover:border-purple-400/50 hover:bg-slate-600/50 transition-all"
                          >
                            <Image className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                            {thumbFile ? (
                              <div>
                                <p className="text-white font-medium">{thumbFile.name}</p>
                                <p className="text-slate-400 text-sm">{formatFileSize(thumbFile.size)}</p>
                              </div>
                            ) : (
                              <div>
                                <p className="text-white font-medium mb-1">Drop thumbnail here</p>
                                <p className="text-slate-400 text-sm">JPG, PNG (16:9 ratio preferred)</p>
                              </div>
                            )}
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Publishing Options */}
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Publishing Options
                    </h3>
                    
                    <div className="flex items-center gap-3 mb-4">
                      <input
                        type="checkbox"
                        {...register('schedule.enabled')}
                        id="schedule-enabled"
                        className="w-4 h-4 text-purple-600 bg-white border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                      />
                      <label htmlFor="schedule-enabled" className="text-white font-medium">
                        Schedule for later publication
                      </label>
                    </div>
                    
                    {watch('schedule.enabled') && (
                      <div className="ml-7">
                        <input
                          type="datetime-local"
                          {...register('schedule.date')}
                          className="bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
                        />
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end pt-6 border-t border-slate-600/30">
                    <button
                      type="submit"
                      disabled={!isClient || (!canCreate || creating)}
                      onClick={(e) => {
                        console.log('🚀 PUBLISH BUTTON CLICKED!');
                        console.log('canCreate:', canCreate);
                        console.log('Form values:', watch());
                        
                        // Since we're inside a form with type="submit", let the default form submission happen
                        // Just log for debugging
                      }}
                      className={`px-8 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all duration-200 ${
                        isClient && canCreate && !creating
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-600/25 transform hover:scale-105'
                          : 'bg-slate-600/50 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {creating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Publishing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          {videoFile || thumbFile ? 'Publish Lesson' : 'Publish Lesson (No Media)'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Sidebar - Guidelines & Tips */}
            <div className="space-y-6">
              {/* Upload Guidelines */}
              <div className="bg-gradient-to-br from-blue-600/10 to-blue-800/10 backdrop-blur-sm border border-blue-400/20 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-blue-400" />
                  <h3 className="text-white font-semibold">Content Guidelines</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <div className="text-white font-medium">Video Quality</div>
                      <div className="text-slate-300 text-sm">HD resolution (1080p) recommended for best viewing experience</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <div className="text-white font-medium">Optimal Duration</div>
                      <div className="text-slate-300 text-sm">5-30 minutes keeps students engaged throughout</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <div className="text-white font-medium">Clear Audio</div>
                      <div className="text-slate-300 text-sm">Ensure audio is crisp and background noise is minimal</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Success Tips */}
              <div className="bg-gradient-to-br from-emerald-600/10 to-emerald-800/10 backdrop-blur-sm border border-emerald-400/20 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-white font-semibold">Success Tips</h3>
                </div>
                <div className="space-y-2 text-slate-300 text-sm">
                  <p>• Start with a clear learning objective</p>
                  <p>• Use practical, real-world examples</p>
                  <p>• Include interactive elements when possible</p>
                  <p>• End with actionable takeaways</p>
                  <p>• Respond to student questions promptly</p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-gradient-to-br from-purple-600/10 to-purple-800/10 backdrop-blur-sm border border-purple-400/20 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  <h3 className="text-white font-semibold">Your Impact</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 text-sm">Lessons Created</span>
                    <span className="text-purple-300 font-semibold">{lessonCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 text-sm">Students Reached</span>
                    <span className="text-purple-300 font-semibold">0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 text-sm">Avg. Rating</span>
                    <span className="text-purple-300 font-semibold">-</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'manage' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <FileVideo className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Content Library</h2>
                    <p className="text-slate-300">Manage and organize your published lessons</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-300">{lessonCount}</div>
                  <div className="text-slate-400 text-sm">Total Lessons</div>
                </div>
              </div>
            </div>

            {/* Content List */}
            {loadingLessons ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white">Loading your content...</p>
                  </div>
                </div>
              </div>
            ) : publishedLessons.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                <div className="text-center py-12">
                  <FileVideo className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No lessons yet</h3>
                  <p className="text-slate-300 mb-6">Start creating content to see it here</p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Create Your First Lesson
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Your Lessons</h3>
                  <div className="text-sm text-slate-400">{publishedLessons.length} lesson{publishedLessons.length !== 1 ? 's' : ''}</div>
                </div>
                <div className={`space-y-3 ${publishedLessons.length > 4 ? 'max-h-80 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-500/30 hover:scrollbar-thumb-slate-400/50' : ''}`}>
                  {publishedLessons.map((lesson) => (
                    <div key={lesson.id} className="bg-slate-700/50 border border-slate-600/30 rounded-xl p-4 hover:bg-slate-700/70 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        {/* Lesson Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="text-lg font-semibold text-white truncate">
                              {lesson.title || 'Untitled Lesson'}
                            </h3>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <div className={`px-2 py-1 rounded text-xs font-medium ${
                                lesson.status === 'published' 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : lesson.status === 'scheduled'
                                  ? 'bg-orange-500/20 text-orange-400'
                                  : 'bg-gray-500/20 text-gray-400'
                              }`}>
                                {lesson.status || 'published'}
                              </div>
                              {lesson.level && (
                                <div className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">
                                  {lesson.level}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-slate-300 text-sm mb-2 line-clamp-2">
                            {lesson.description || 'No description provided'}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                            <div className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {lesson.views || 0} views
                            </div>
                            {lesson.createdAt && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {lesson.createdAt.toDate ? 
                                  lesson.createdAt.toDate().toLocaleDateString() : 
                                  new Date(lesson.createdAt.seconds * 1000).toLocaleDateString()
                                }
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              {lesson.hasMedia ? (
                                <>
                                  <Video className="w-3 h-3 text-green-400" />
                                  <span className="text-green-400">With Media</span>
                                </>
                              ) : (
                                <>
                                  <FileVideo className="w-3 h-3 text-slate-400" />
                                  <span>Text Only</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Link
                            href={`/lesson/${lesson.id}`}
                            className="p-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-colors"
                            title="View Lesson"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                          
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/lesson/${lesson.id}`)
                              alert('Lesson URL copied to clipboard!')
                            }}
                            className="p-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg transition-colors"
                            title="Copy URL"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => deleteLesson(lesson.id)}
                            className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
                            title="Delete Lesson"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Refresh Button */}
                <div className="mt-6 text-center">
                  <button
                    onClick={fetchPublishedLessons}
                    disabled={loadingLessons}
                    className="px-4 py-2 bg-slate-600/50 hover:bg-slate-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                  >
                    {loadingLessons ? 'Refreshing...' : 'Refresh Content'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Content Analytics</h3>
              <p className="text-slate-300">Track performance and student engagement</p>
              <p className="text-slate-400 text-sm mt-4">Coming soon - Detailed analytics dashboard</p>
            </div>
          </div>
        )}

        {/* AI Assistant Modal */}
        {showAIAssistant && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-slate-800 border border-slate-600/30 rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">AI Lesson Assistant</h3>
                    <p className="text-slate-300">Create complete lessons with detailed structure, exercises, and save to your library</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAIAssistant(false)
                    setAISuggestion('')
                  }}
                  className="text-slate-400 hover:text-white p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-8">
                <div>
                  <label className="block text-white font-semibold mb-4 text-lg">Step 1: Select Your Sport</label>
                  <div className="grid grid-cols-3 gap-3 mb-2">
                    {[
                      { id: 'soccer', name: 'Soccer', emoji: '⚽' },
                      { id: 'basketball', name: 'Basketball', emoji: '🏀' },
                      { id: 'tennis', name: 'Tennis', emoji: '🎾' },
                      { id: 'football', name: 'Football', emoji: '🏈' },
                      { id: 'baseball', name: 'Baseball', emoji: '⚾' },
                      { id: 'jiu-jitsu', name: 'Jiu-Jitsu', emoji: '🥋' },
                    ].map(sport => (
                      <button
                        key={sport.id}
                        onClick={() => setSelectedSport(sport.id)}
                        className={`p-3 border rounded-lg text-center transition-all ${
                          selectedSport === sport.id
                            ? 'bg-cyan-600/20 border-cyan-400/50 text-cyan-200'
                            : 'bg-slate-700/50 border-slate-600/50 text-white hover:bg-slate-600/50'
                        }`}
                      >
                        <div className="text-2xl mb-1">{sport.emoji}</div>
                        <div className="text-sm font-medium">{sport.name}</div>
                      </button>
                    ))}
                  </div>
                  {selectedSport && (
                    <div className="text-center mt-3">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-600/10 border border-cyan-400/20 rounded-full text-cyan-300 text-sm">
                        <span>Selected:</span>
                        <span className="font-semibold">
                          {[
                            { id: 'soccer', name: 'Soccer' },
                            { id: 'basketball', name: 'Basketball' },
                            { id: 'tennis', name: 'Tennis' },
                            { id: 'football', name: 'Football' },
                            { id: 'baseball', name: 'Baseball' },
                            { id: 'jiu-jitsu', name: 'Jiu-Jitsu' },
                          ].find(s => s.id === selectedSport)?.name}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {selectedSport && (
                  <div>
                    <label className="block text-white font-semibold mb-4 text-lg">Step 2: What would you like to teach?</label>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {(() => {
                      const sportTopics = {
                        soccer: [
                          { key: 'basics', title: 'Soccer Basics', subtitle: 'Fundamentals & First Touch' },
                          { key: 'shooting', title: 'Shooting', subtitle: 'Power & Precision' },
                          { key: 'passing', title: 'Passing', subtitle: 'Accuracy & Vision' },
                          { key: 'defense', title: 'Defense', subtitle: 'Positioning & Tackling' }
                        ],
                        basketball: [
                          { key: 'basics', title: 'Basketball Basics', subtitle: 'Dribbling & Handling' },
                          { key: 'shooting', title: 'Shooting', subtitle: 'Form & Consistency' },
                          { key: 'passing', title: 'Passing', subtitle: 'Vision & Precision' },
                          { key: 'defense', title: 'Defense', subtitle: 'Stance & Positioning' }
                        ],
                        tennis: [
                          { key: 'basics', title: 'Tennis Basics', subtitle: 'Grip & Stance' },
                          { key: 'shooting', title: 'Serving', subtitle: 'Power & Accuracy' },
                          { key: 'passing', title: 'Groundstrokes', subtitle: 'Forehand & Backhand' },
                          { key: 'defense', title: 'Defense', subtitle: 'Movement & Recovery' }
                        ],
                        football: [
                          { key: 'basics', title: 'Football Basics', subtitle: 'Throwing & Catching' },
                          { key: 'shooting', title: 'Passing', subtitle: 'Arm Strength & Precision' },
                          { key: 'passing', title: 'Route Running', subtitle: 'Precision & Timing' },
                          { key: 'defense', title: 'Defense', subtitle: 'Tackling & Coverage' }
                        ],
                        baseball: [
                          { key: 'basics', title: 'Baseball Basics', subtitle: 'Throwing & Catching' },
                          { key: 'shooting', title: 'Hitting', subtitle: 'Power & Contact' },
                          { key: 'passing', title: 'Fielding', subtitle: 'Positioning & Reactions' },
                          { key: 'defense', title: 'Pitching', subtitle: 'Location & Movement' }
                        ],
                        bjj: [
                          { key: 'basics', title: 'BJJ Fundamentals', subtitle: 'Posture, Base & Frames' },
                          { key: 'shooting', title: 'Submissions', subtitle: 'Finishing Mechanics' },
                          { key: 'passing', title: 'Guard Passing', subtitle: 'Pressure & Systems' },
                          { key: 'defense', title: 'Escapes & Defense', subtitle: 'Survival to Offense' }
                        ]
                      }

                      const currentTopics = sportTopics[selectedSport] || sportTopics[selectedSport === 'jiu-jitsu' ? 'bjj' : selectedSport] || sportTopics.soccer

                      return currentTopics.map((topic, index) => (
                        <button
                          key={index}
                          onClick={() => generateAIContent(topic.key)}
                          className="p-3 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 rounded-lg text-left transition-colors"
                        >
                          <div className="text-white font-medium">{topic.title}</div>
                          <div className="text-slate-400 text-sm">{topic.subtitle}</div>
                        </button>
                      ))
                    })()}
                    </div>
                    
                    <div className="relative">
                    <input
                      type="text"
                      placeholder="Or describe your lesson idea... (e.g., 'advanced dribbling for wingers')"
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 pr-12 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition-all"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          generateAIContent(e.currentTarget.value)
                        }
                      }}
                    />
                    <button
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement
                        if (input?.value.trim()) {
                          generateAIContent(input.value)
                        }
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      <Wand2 className="w-5 h-5" />
                    </button>
                    </div>
                  </div>
                )}

                {/* AI Generation Loading */}
                {generatingContent && (
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-6 h-6 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                      <span className="text-white font-medium">Generating lesson content...</span>
                    </div>
                    <div className="text-slate-400 text-sm">AI is crafting the perfect lesson structure for you</div>
                  </div>
                )}

                {/* AI Suggestions */}
                {aiSuggestion && !generatingContent && (
                  <div className="bg-gradient-to-br from-cyan-600/10 to-blue-600/10 rounded-xl p-6 border border-cyan-400/20">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-5 h-5 text-cyan-400" />
                      <span className="text-white font-semibold">AI Generated Content</span>
                    </div>
                    
                    {(() => {
                      try {
                        const suggestion = JSON.parse(aiSuggestion)
                        return (
                          <div className="space-y-6">
                            {/* Lesson Header */}
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-cyan-300 font-medium mb-2">Lesson Title:</label>
                                <div className="bg-slate-700/50 rounded-lg p-3 text-white border border-slate-600/50">
                                  {suggestion.title}
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-cyan-300 font-medium mb-2 text-sm">Duration:</label>
                                  <div className="bg-slate-700/50 rounded-lg p-2 text-white border border-slate-600/50 text-sm">
                                    {suggestion.duration}
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-cyan-300 font-medium mb-2 text-sm">Difficulty:</label>
                                  <div className="bg-slate-700/50 rounded-lg p-2 text-white border border-slate-600/50 text-sm">
                                    {suggestion.difficulty}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="block text-cyan-300 font-medium mb-2">Description:</label>
                              <div className="bg-slate-700/50 rounded-lg p-3 text-white border border-slate-600/50">
                                {suggestion.description}
                              </div>
                            </div>

                            {/* Learning Objectives */}
                            {suggestion.objectives && (
                              <div>
                                <label className="block text-cyan-300 font-medium mb-2">Learning Objectives:</label>
                                <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600/50">
                                  <ul className="text-white space-y-1">
                                    {suggestion.objectives.map((objective, index) => (
                                      <li key={index} className="flex items-start gap-2">
                                        <span className="text-cyan-400 mt-1">•</span>
                                        <span className="text-sm">{objective}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            )}

                            {/* Lesson Chapters */}
                            {suggestion.chapters && (
                              <div>
                                <label className="block text-cyan-300 font-medium mb-2">Lesson Structure:</label>
                                <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600/50 space-y-3">
                                  {suggestion.chapters.map((chapter, index) => (
                                    <div key={index} className="border-l-2 border-cyan-400/30 pl-3">
                                      <div className="flex items-center justify-between mb-1">
                                        <h4 className="text-white font-medium text-sm">{chapter.title}</h4>
                                        <span className="text-cyan-300 text-xs">{chapter.duration}</span>
                                      </div>
                                      <p className="text-slate-300 text-sm">{chapter.content}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Exercises and Key Points */}
                            <div className="grid md:grid-cols-2 gap-4">
                              {suggestion.exercises && (
                                <div>
                                  <label className="block text-cyan-300 font-medium mb-2">Practice Exercises:</label>
                                  <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600/50">
                                    <ul className="text-white space-y-1">
                                      {suggestion.exercises.map((exercise, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                          <span className="text-green-400 mt-1">→</span>
                                          <span className="text-sm">{exercise}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              )}

                              {suggestion.keyPoints && (
                                <div>
                                  <label className="block text-cyan-300 font-medium mb-2">Key Teaching Points:</label>
                                  <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600/50">
                                    <ul className="text-white space-y-1">
                                      {suggestion.keyPoints.map((point, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                          <span className="text-yellow-400 mt-1">★</span>
                                          <span className="text-sm">{point}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-between items-center gap-3 pt-4 border-t border-slate-600/30">
                              <div className="text-slate-400 text-sm">
                                Complete lesson structure ready for creation
                              </div>
                              <div className="flex gap-3">
                                <button
                                  onClick={async () => {
                                    try {
                                      const fullContent = `
LESSON: ${suggestion.title}

DURATION: ${suggestion.duration}
DIFFICULTY: ${suggestion.difficulty}

DESCRIPTION:
${suggestion.description}

LEARNING OBJECTIVES:
${suggestion.objectives?.map(obj => `• ${obj}`).join('\n') || 'N/A'}

LESSON STRUCTURE:
${suggestion.chapters?.map(ch => `${ch.title} (${ch.duration}): ${ch.content}`).join('\n') || 'N/A'}

EXERCISES:
${suggestion.exercises?.map(ex => `• ${ex}`).join('\n') || 'N/A'}

KEY POINTS:
${suggestion.keyPoints?.map(pt => `• ${pt}`).join('\n') || 'N/A'}
`
                                      await navigator.clipboard.writeText(fullContent)
                                      console.log('Lesson content copied to clipboard')
                                    } catch (error) {
                                      console.error('Failed to copy to clipboard:', error)
                                      // Fallback: show the content in an alert or create a text area
                                      alert('Copy failed. Please manually copy the lesson content.')
                                    }
                                  }}
                                  className="px-4 py-2 bg-slate-600/50 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                  Copy Full Lesson
                                </button>
                                
                                <button
                                  onClick={() => createAndSaveLesson('custom')}
                                  disabled={generatingContent}
                                  className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 text-white rounded-lg font-medium transition-all flex items-center gap-2"
                                >
                                  <Plus className="w-4 h-4" />
                                  Create & Save Lesson
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      } catch {
                        return <div className="text-red-400">Error displaying AI suggestion</div>
                      }
                    })()}
                  </div>
                )}

                {/* Additional Details Section */}
                {aiSuggestion && !generatingContent && (
                  <div className="bg-gradient-to-br from-purple-600/10 to-pink-600/10 rounded-xl p-6 border border-purple-400/20">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">+</span>
                      </div>
                      <span className="text-white font-semibold">Customize Your Lesson</span>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-purple-300 font-medium mb-2">
                          Add Additional Details or Specific Requirements:
                        </label>
                        <p className="text-sm text-purple-200 mb-3">
                          Describe specific techniques, drills, common mistakes, or focus areas you want to include in this lesson.
                        </p>
                        <textarea
                          value={additionalDetails}
                          onChange={(e) => setAdditionalDetails(e.target.value)}
                          placeholder="e.g., 'Focus on grip fighting transitions', 'Include common mistakes when defending', 'Add specific drills for beginners'..."
                          className="w-full h-24 bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 resize-none focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20 transition-all"
                        />
                      </div>
                      
                      <div className="flex justify-between items-center pt-3 border-t border-purple-400/20">
                        <div className="text-purple-300 text-sm">
                          AI will integrate your details into the lesson structure
                        </div>
                        <button
                          onClick={refineWithAdditionalDetails}
                          disabled={!additionalDetails.trim() || refiningContent}
                          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all flex items-center gap-2"
                        >
                          {refiningContent ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Refining...
                            </>
                          ) : (
                            <>
                              <Wand2 className="w-4 h-4" />
                              Refine Lesson
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Content Refinement Loading */}
                {refiningContent && (
                  <div className="bg-purple-600/10 rounded-xl p-6 border border-purple-400/20">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-6 h-6 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                      <span className="text-white font-medium">Integrating your details...</span>
                    </div>
                    <div className="text-purple-300 text-sm">AI is enhancing the lesson structure with your specific requirements</div>
                  </div>
                )}

                {/* Success Message */}
                {uploadSuccess && (
                  <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-400/30 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-green-400 font-semibold">Lesson Created Successfully!</h4>
                        <p className="text-green-300 text-sm">Your complete lesson has been saved to your library as a draft.</p>
                      </div>
                    </div>
                    <div className="text-green-200 text-sm">
                      You can now edit, add videos, and publish your lesson from your dashboard.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Universal AI Assistant */}
        {showUniversalAI && (
          <AIAssistant
            mode="floating"
            title="Content Creation Assistant"
            context={`You are a creative content strategist specializing in sports education and content creation. Help users create engaging, educational sports content including lesson plans, video scripts, training exercises, and course structures. Focus on making content engaging, educational, and well-structured.`}
            placeholder="Help me create engaging content, write scripts, or plan lessons..."
            onClose={() => setShowUniversalAI(false)}
          />
        )}
      </div>
    </main>
  )
}