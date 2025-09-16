'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { auth, db, storage } from '@/lib/firebase.client'
import { useEnhancedRole } from "@/hooks/use-role-switcher"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from 'next/navigation'
import CreatorAccessGate from '@/components/CreatorAccessGate'
import { collection, addDoc, query, where, getCountFromServer, serverTimestamp, getDoc, doc, getDocs, orderBy, deleteDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
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
  Plus,
  FileVideo,
  ArrowLeft,
  ExternalLink,
  Edit3,
  Trash2,
  MoreVertical,
  Bot,
  Sparkles,
  Lightbulb,
  Wand2,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

export default function CreatorDashboard() {
  const { role, loading: loadingRole } = useEnhancedRole()
  const { user: authUser, loading: authLoading } = useAuth()
  const router = useRouter()
  
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create')
  
  const schema = z.object({
    title: z.string().min(3),
    description: z.string().min(10),
    level: z.enum(['All Levels', 'Beginner', 'Intermediate', 'Advanced']),
  })
  
  type FormValues = z.infer<typeof schema>
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '', level: 'All Levels' }
  })
  
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [thumbFile, setThumbFile] = useState<File | null>(null)
  const [creating, setCreating] = useState(false)
  const [lessonCount, setLessonCount] = useState<number>(0)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [publishedLessons, setPublishedLessons] = useState<any[]>([])
  const [loadingLessons, setLoadingLessons] = useState(false)
  
  // AI Features State
  const [showAIFeatures, setShowAIFeatures] = useState(false)
  const [generatingIdeas, setGeneratingIdeas] = useState(false)
  const [enhancingContent, setEnhancingContent] = useState(false)
  const [aiSuggestions, setAISuggestions] = useState<string[]>([])
  const [selectedSport, setSelectedSport] = useState('BJJ')

  // Load lesson count
  useEffect(() => {
    const loadLessonCount = async () => {
      if (!authUser) return
      try {
        const q = query(collection(db, 'content'), where('creatorUid', '==', authUser.uid))
        const snapshot = await getCountFromServer(q)
        setLessonCount(snapshot.data().count)
      } catch (error) {
        console.error('Error loading lesson count:', error)
      }
    }
    loadLessonCount()
  }, [authUser])

  const loadPublishedLessons = async () => {
    if (!authUser?.uid) return
    setLoadingLessons(true)
    try {
      // Simplified query without orderBy to avoid index issues
      const q = query(
        collection(db, 'content'),
        where('creatorUid', '==', authUser.uid)
      )
      const snapshot = await getDocs(q)
      const lessons = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      // Sort locally by createdAt if available
      lessons.sort((a, b) => {
        const aDate = a.createdAt?.toDate?.() || new Date(0)
        const bDate = b.createdAt?.toDate?.() || new Date(0)
        return bDate.getTime() - aDate.getTime()
      })
      setPublishedLessons(lessons)
    } catch (error) {
      console.error('Error loading lessons:', error)
      setPublishedLessons([]) // Set empty array on error
    } finally {
      setLoadingLessons(false)
    }
  }

  // Load published lessons for manage tab
  useEffect(() => {
    if (activeTab === 'manage' && authUser?.uid) {
      loadPublishedLessons()
    }
  }, [activeTab, authUser?.uid])

  const onSubmit = async (data: FormValues) => {
    if (!authUser) return
    
    setCreating(true)
    try {
      let videoUrl = ''
      let thumbnailUrl = ''

      // Upload video if provided
      if (videoFile) {
        const videoRef = ref(storage, `content/${authUser.uid}/${Date.now()}_${videoFile.name}`)
        await uploadBytes(videoRef, videoFile)
        videoUrl = await getDownloadURL(videoRef)
      }

      // Upload thumbnail if provided
      if (thumbFile) {
        const thumbRef = ref(storage, `content/${authUser.uid}/thumb_${Date.now()}_${thumbFile.name}`)
        await uploadBytes(thumbRef, thumbFile)
        thumbnailUrl = await getDownloadURL(thumbRef)
      }

      // Create lesson document
      const lessonData = {
        title: data.title,
        description: data.description,
        level: data.level,
        creatorUid: authUser.uid,
        videoUrl,
        thumbnail: thumbnailUrl,
        views: 0,
        status: 'published',
        visibility: 'public',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      await addDoc(collection(db, 'content'), lessonData)
      
      // Reset form and show success
      reset()
      setVideoFile(null)
      setThumbFile(null)
      setUploadSuccess(true)
      setLessonCount(prev => prev + 1)
      
    } catch (error) {
      console.error('Error creating lesson:', error)
    } finally {
      setCreating(false)
    }
  }

  const deleteLesson = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return
    
    try {
      await deleteDoc(doc(db, 'content', lessonId))
      setPublishedLessons(prev => prev.filter(lesson => lesson.id !== lessonId))
      setLessonCount(prev => prev - 1)
    } catch (error) {
      console.error('Error deleting lesson:', error)
    }
  }

  // AI Helper Functions
  const generateLessonIdeas = async () => {
    setGeneratingIdeas(true)
    try {
      // Simulate AI generation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      let allIdeas = []
      
      if (selectedSport === 'BJJ') {
        allIdeas = [
          // Guard Fundamentals
          'BJJ Guard Fundamentals: Closed Guard Control and Attacks',
          'Open Guard Mastery: Spider Guard and De La Riva',
          'Half Guard Essentials: Sweeps and Submissions',
          'Butterfly Guard: Hooks and Elevation Techniques',
          'X-Guard System: Entry and Sweep Mechanics',
          'Rubber Guard: Flexibility and Control',
          
          // Submissions
          'Advanced Triangle Chokes: Setup and Finishing Techniques',
          'Kimura Lock System: From Setup to Submission',
          'Armbar Mastery: Multiple Entry Points and Variations',
          'Rear Naked Choke: Perfect Technique and Timing',
          'Guillotine Choke Variations: High Elbow and Arm-in',
          'Omoplata System: Shoulder Lock and Transitions',
          'Heel Hooks: Entry, Control, and Finishing',
          'Americana/Keylock: Pressure and Positioning',
          'Ezekiel Choke: From Mount and Guard',
          'Loop Choke: Gi-Based Strangulation',
          
          // Escapes and Defense
          'Escaping Side Control: Hip Movement and Frame Techniques',
          'Mount Escape Fundamentals: Bridge and Roll Mechanics',
          'Back Escape: Hand Fighting and Hip Movement',
          'Turtle Position Defense: Protecting and Recovering',
          'Submission Defense: Posture and Hand Placement',
          'Guard Retention: Keeping Guard Under Pressure',
          
          // Positions and Control
          'Back Control Excellence: Securing and Finishing',
          'Mount Attacks: Submissions and Transitions',
          'Side Control Mastery: Pressure and Submissions',
          'Knee on Belly: Control and Attack Options',
          'North-South Position: Chokes and Transitions',
          'Scarf Hold: Old School Control and Attacks',
          
          // Transitions and Flow
          'Guard Passing Fundamentals: Pressure and Movement',
          'Transition Chains: Flowing Between Positions',
          'Takedown to Guard Pass: Standing to Ground',
          'Scrambling: Chaos Management and Recovery',
          'Berimbolo: Modern Guard Transition',
          
          // Gi vs No-Gi
          'Gi vs No-Gi Differences: Adapting Your Game',
          'Gi Grips: Collar and Sleeve Control',
          'No-Gi Fundamentals: Underhooks and Overhooks',
          'Lapel Guards: Worm Guard and Squid Guard',
          
          // Competition and Mental
          'Competition Strategy: Mental Preparation and Game Planning',
          'Rolling Intensity: Training Smart vs Training Hard',
          'Building Your A-Game: Developing Signature Moves',
          'Pressure vs Speed: Finding Your Style',
          'Recovery and Injury Prevention for BJJ Athletes',
          
          // Advanced Concepts
          'Leg Lock System: Modern Leg Attack Fundamentals',
          'Wrestling for BJJ: Takedowns and Top Control',
          'Judo Throws: Entries and Setups for BJJ',
          'Flow Rolling: Developing Smooth Transitions',
          'Countering Common Guard Passes',
          'Creating Angles: Off-Balancing and Control'
        ]
      } else if (selectedSport === 'MMA') {
        allIdeas = [
          'MMA Takedown Defense: Sprawling and Counter-Attacks',
          'Ground and Pound: Maintaining Position and Striking',
          'Cage Wrestling: Using the Fence to Your Advantage',
          'Submission Defense: Escaping Common Holds',
          'Stand-up Game: Striking to Grappling Transitions',
          'Mental Toughness: Preparing for Competition',
          'Weight Cutting: Safe and Effective Methods',
          'Game Planning: Studying Opponents and Strategy',
          'Clinch Work: Controlling and Striking in Close Range',
          'Dirty Boxing: Inside Fighting Techniques',
          'Leg Kick Defense: Checking and Countering',
          'Transition Training: Blending Disciplines Seamlessly',
          'Recovery Methods: Between Rounds and Training',
          'Cardio for MMA: Specific Energy System Development',
          'Fight IQ: Reading Situations and Adapting',
          'Pre-Fight Routine: Mental and Physical Preparation',
          'Post-Fight Analysis: Learning from Performance',
          'Sparring Safety: Training Hard While Staying Healthy',
          'Nutrition for Fighters: Fueling Performance',
          'Injury Prevention: Staying Healthy Long-term',
          'Video Study: Breaking Down Opponents',
          'Pressure Fighting: Moving Forward Effectively',
          'Counter-Fighting: Timing and Distance Management',
          'Championship Mindset: Developing Elite Mental Toughness'
        ]
      } else if (selectedSport === 'boxing') {
        allIdeas = [
          'Boxing Footwork: Angles and Distance Management',
          'Power Punching: Generating Force and Accuracy',
          'Defensive Boxing: Head Movement and Blocking',
          'Combination Striking: Flowing Punch Sequences',
          'Counter-Punching: Reading and Responding',
          'Ring Generalship: Controlling Space and Pace',
          'Conditioning: Boxing-Specific Fitness Training',
          'Mental Game: Confidence and Focus in the Ring',
          'Jab Mastery: The Most Important Punch in Boxing',
          'Body Work: Targeting and Effectiveness',
          'Slip and Counter: Defensive Offense Techniques',
          'Infighting: Close-Range Boxing Skills',
          'Southpaw vs Orthodox: Style Matchup Strategies',
          'Ring Cutting: Trapping Your Opponent',
          'Hand Speed Development: Training for Quickness',
          'Punch Selection: Choosing the Right Tool',
          'Rhythm and Timing: Finding Your Boxing Flow',
          'Pressure Boxing: Walking Down Opponents',
          'Boxing Psychology: Mental Warfare in the Ring',
          'Amateur vs Pro Boxing: Key Differences',
          'Sparring Etiquette: Training Partner Respect',
          'Weight Management: Making Weight Safely',
          'Equipment Selection: Gloves, Wraps, and Gear',
          'Recovery and Injury Prevention: Longevity in Boxing'
        ]
      } else if (selectedSport === 'wrestling') {
        allIdeas = [
          'Wrestling Takedowns: Double Leg and Single Leg Mastery',
          'Sprawl Defense: Stopping Takedown Attempts',
          'Top Position Control: Rides and Breakdowns',
          'Escapes from Bottom: Hip Heists and Stand-ups',
          'Pinning Combinations: Securing the Fall',
          'Conditioning: Wrestling-Specific Strength and Cardio',
          'Mental Toughness: Grinding Through Adversity',
          'Competition Preparation: Cutting Weight and Strategy',
          'Chain Wrestling: Flowing Between Attacks',
          'Neutral Position: Ties and Hand Fighting',
          'Mat Wrestling: Ground Control and Positioning',
          'Scrambling: Chaos Wrestling and Recovery',
          'Cradles and Tilts: Securing Back Points',
          'Funk Wrestling: Unorthodox Techniques',
          'Greco-Roman Techniques: Upper Body Wrestling',
          'Freestyle Wrestling: Leg Attacks and Defense',
          'Folkstyle Wrestling: American Collegiate Style',
          'Wrestling Psychology: Mental Edge on the Mat',
          'Technique Drilling: Perfect Practice Methods',
          'Strength Training: Wrestling-Specific Power',
          'Flexibility: Mobility for Wrestling Performance',
          'Tournament Strategy: Peaking at the Right Time',
          'Coaching Wrestling: Teaching Techniques Effectively',
          'Wrestling History: Learning from the Legends'
        ]
      } else {
        allIdeas = [
          `${selectedSport} Fundamentals: Mastering Basic Techniques`,
          `Advanced ${selectedSport} Strategies for Competitive Play`,
          `${selectedSport} Conditioning and Fitness Training`,
          `Mental Game in ${selectedSport}: Building Confidence`,
          `${selectedSport} Equipment Guide and Maintenance`,
          `Injury Prevention in ${selectedSport}`,
          `${selectedSport} Rules and Regulations Explained`,
          `Team Communication in ${selectedSport}`,
          `${selectedSport} Skill Development: Progressive Training`,
          `Game Analysis in ${selectedSport}: Reading the Flow`,
          `Leadership in ${selectedSport}: Captain Qualities`,
          `Youth Development in ${selectedSport}: Building Skills Early`,
          `${selectedSport} Nutrition: Fueling Performance`,
          `Recovery Methods for ${selectedSport} Athletes`,
          `Competition Psychology in ${selectedSport}`,
          `${selectedSport} Drills: Effective Practice Methods`
        ]
      }
      
      // Randomize and select 8 different suggestions from the larger pool
      const shuffled = allIdeas.sort(() => 0.5 - Math.random())
      setAISuggestions(shuffled.slice(0, 8))
    } catch (error) {
      console.error('Error generating ideas:', error)
    } finally {
      setGeneratingIdeas(false)
    }
  }

  const enhanceDescription = async () => {
    const currentTitle = watch('title')
    const currentDescription = watch('description')
    
    if (!currentTitle && !currentDescription) return
    
    setEnhancingContent(true)
    try {
      // Simulate AI enhancement
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      let enhanced = currentDescription
      if (currentDescription.length < 100) {
        enhanced = `${currentDescription}

This comprehensive lesson covers:
• Step-by-step technique breakdown
• Common mistakes and how to avoid them
• Practice drills for skill development
• Real-world applications and scenarios
• Progressive training methods

Perfect for ${watch('level')?.toLowerCase() || 'all skill levels'}, this lesson combines theoretical understanding with practical application to ensure lasting improvement and technical mastery.`
      } else {
        enhanced = `${currentDescription}

Enhanced with detailed explanations, visual demonstrations, and progressive skill-building exercises designed to maximize learning outcomes and ensure practical application of concepts covered.`
      }
      
      reset({
        ...watch(),
        description: enhanced
      })
    } catch (error) {
      console.error('Error enhancing content:', error)
    } finally {
      setEnhancingContent(false)
    }
  }

  const applySuggestion = (suggestion: string) => {
    reset({
      ...watch(),
      title: suggestion
    })
    setAISuggestions([])
  }

  if (loadingRole || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cardinal mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <CreatorAccessGate>
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/overview" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Lesson Studio</h1>
              <p className="text-gray-600">Create and manage your educational content</p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="flex gap-4">
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-cardinal" />
                <span className="font-semibold text-gray-900">{lessonCount}</span>
                <span className="text-gray-600 text-sm">Lessons</span>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {uploadSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div className="flex-1">
                <p className="text-green-800 font-medium">Lesson published successfully!</p>
                <p className="text-green-600 text-sm">Your content is now available to students.</p>
              </div>
              <button
                onClick={() => setUploadSuccess(false)}
                className="text-green-600 hover:text-green-800 text-sm"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 p-1 bg-white rounded-lg border border-gray-200 relative z-10">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setActiveTab('create')
            }}
            className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'create'
                ? 'bg-cardinal text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Plus className="w-4 h-4" />
            Create Content
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setActiveTab('manage')
            }}
            className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'manage'
                ? 'bg-cardinal text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <FileVideo className="w-4 h-4" />
            Manage Library
          </button>
        </div>


        {/* Content */}
        {activeTab === 'create' && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Create New Lesson</h2>
                  <p className="text-gray-600">Fill out the form below to create your lesson</p>
                </div>
                
                {/* AI Features Toggle */}
                <button
                  type="button"
                  onClick={() => setShowAIFeatures(!showAIFeatures)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                    showAIFeatures
                      ? 'bg-gradient-to-r from-purple-600 to-cardinal text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Bot className="w-4 h-4" />
                  AI Assistant
                  {showAIFeatures ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* AI Features Panel */}
            {showAIFeatures && (
              <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-red-50 border border-purple-200 rounded-lg">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-purple-900">AI Content Assistant</h3>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Sport Selection */}
                  <div>
                    <label className="block text-sm font-medium text-purple-800 mb-2">
                      Select Sport for Ideas
                    </label>
                    <select
                      value={selectedSport}
                      onChange={(e) => setSelectedSport(e.target.value)}
                      className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="BJJ">Brazilian Jiu-Jitsu (BJJ)</option>
                      <option value="soccer">Soccer</option>
                      <option value="basketball">Basketball</option>
                      <option value="tennis">Tennis</option>
                      <option value="baseball">Baseball</option>
                      <option value="football">Football</option>
                      <option value="volleyball">Volleyball</option>
                      <option value="golf">Golf</option>
                      <option value="swimming">Swimming</option>
                      <option value="MMA">Mixed Martial Arts (MMA)</option>
                      <option value="boxing">Boxing</option>
                      <option value="wrestling">Wrestling</option>
                    </select>
                  </div>

                  {/* AI Action Buttons */}
                  <div className="flex gap-2 items-end">
                    <button
                      type="button"
                      onClick={generateLessonIdeas}
                      disabled={generatingIdeas}
                      className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
                    >
                      {generatingIdeas ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Lightbulb className="w-4 h-4" />
                      )}
                      {generatingIdeas ? 'Generating...' : 'Get Ideas'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={enhanceDescription}
                      disabled={enhancingContent || !watch('description')}
                      className="px-3 py-2 bg-cardinal text-white rounded-lg hover:bg-cardinal-dark disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
                    >
                      {enhancingContent ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Wand2 className="w-4 h-4" />
                      )}
                      {enhancingContent ? 'Enhancing...' : 'Enhance Description'}
                    </button>
                  </div>
                </div>

                {/* AI Suggestions */}
                {aiSuggestions.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      Lesson Ideas for {selectedSport}
                    </h4>
                    <div className="grid gap-2">
                      {aiSuggestions.slice(0, 4).map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => applySuggestion(suggestion)}
                          className="text-left p-3 bg-white border border-purple-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors"
                        >
                          <span className="text-gray-900 text-sm">{suggestion}</span>
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setAISuggestions([])}
                      className="mt-2 text-purple-600 text-sm hover:text-purple-800"
                    >
                      Clear suggestions
                    </button>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lesson Title *
                  </label>
                  <input
                    {...register('title')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cardinal focus:border-transparent"
                    placeholder="Enter lesson title..."
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skill Level *
                  </label>
                  <select
                    {...register('level')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cardinal focus:border-transparent"
                  >
                    <option value="All Levels">All Levels</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  {...register('description')}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cardinal focus:border-transparent"
                  placeholder="Describe what students will learn..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              {/* File Uploads */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Video File
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-cardinal transition-colors">
                    <Video className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="video-upload"
                    />
                    <label htmlFor="video-upload" className="cursor-pointer">
                      <span className="text-cardinal font-medium">Choose video file</span>
                      <p className="text-gray-500 text-sm mt-1">MP4, MOV up to 500MB</p>
                    </label>
                  </div>
                  {videoFile && (
                    <p className="mt-2 text-sm text-gray-600">Selected: {videoFile.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thumbnail Image
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-cardinal transition-colors">
                    <Image className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setThumbFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="thumb-upload"
                    />
                    <label htmlFor="thumb-upload" className="cursor-pointer">
                      <span className="text-cardinal font-medium">Choose thumbnail</span>
                      <p className="text-gray-500 text-sm mt-1">PNG, JPG up to 5MB</p>
                    </label>
                  </div>
                  {thumbFile && (
                    <p className="mt-2 text-sm text-gray-600">Selected: {thumbFile.name}</p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2 bg-cardinal text-white rounded-lg font-medium hover:bg-cardinal-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {creating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Publish Lesson
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'manage' && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Lesson Library</h2>
              <p className="text-gray-600">Manage your published content</p>
            </div>

            {loadingLessons ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cardinal mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading lessons...</p>
              </div>
            ) : publishedLessons.length === 0 ? (
              <div className="text-center py-12">
                <Video className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No lessons yet</h3>
                <p className="text-gray-600 mb-4">Create your first lesson to get started</p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="px-4 py-2 bg-cardinal text-white rounded-lg font-medium hover:bg-cardinal-dark"
                >
                  Create Lesson
                </button>
              </div>
            ) : (
              <div className="grid gap-6">
                {publishedLessons.map((lesson) => (
                  <div key={lesson.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300">
                    <div className="flex">
                      {/* Thumbnail Section */}
                      <div className="flex-shrink-0 w-48 h-32 bg-gray-100 relative">
                        {lesson.thumbnail ? (
                          <img 
                            src={lesson.thumbnail} 
                            alt={lesson.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-100 to-purple-100">
                            <Video className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                        
                        {/* Media Indicators */}
                        <div className="absolute top-2 left-2 flex gap-1">
                          {lesson.videoUrl && (
                            <div className="px-2 py-1 bg-black/70 text-white text-xs rounded-full flex items-center gap-1">
                              <Play className="w-3 h-3" />
                              Video
                            </div>
                          )}
                          {lesson.thumbnail && (
                            <div className="px-2 py-1 bg-black/70 text-white text-xs rounded-full flex items-center gap-1">
                              <Image className="w-3 h-3" />
                              Thumb
                            </div>
                          )}
                        </div>

                        {/* Status Badge */}
                        <div className="absolute bottom-2 left-2">
                          <div className={`px-2 py-1 text-xs rounded-full font-medium ${
                            lesson.status === 'published' 
                              ? 'bg-green-100 text-green-800'
                              : lesson.status === 'draft'
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {lesson.status || 'Published'}
                          </div>
                        </div>

                        {/* Duration Overlay (if available) */}
                        {lesson.duration && (
                          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                            {lesson.duration}
                          </div>
                        )}
                      </div>

                      {/* Content Section */}
                      <div className="flex-1 p-6">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{lesson.title}</h3>
                            <p className="text-gray-600 text-sm line-clamp-2 mb-3">{lesson.description}</p>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 ml-4">
                            <Link
                              href={`/lesson/${lesson.id}`}
                              className="p-2 text-gray-400 hover:text-cardinal rounded-lg hover:bg-red-50 transition-colors"
                              title="View lesson"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                            <button
                              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                              title="Edit lesson"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteLesson(lesson.id)}
                              className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                              title="Delete lesson"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Metadata */}
                        <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{lesson.level}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            <span>{(lesson.views || 0).toLocaleString()} views</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{lesson.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}</span>
                          </div>
                          {lesson.visibility && (
                            <div className="flex items-center gap-1">
                              {lesson.visibility === 'public' ? (
                                <>
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                  <span className="text-green-600">Public</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-4 h-4 text-orange-500" />
                                  <span className="text-orange-600">Private</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>


                        {/* Tags (if any) */}
                        {lesson.tags && lesson.tags.length > 0 && (
                          <div className="flex gap-2 flex-wrap">
                            {lesson.tags.slice(0, 3).map((tag, index) => (
                              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                {tag}
                              </span>
                            ))}
                            {lesson.tags.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                +{lesson.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        </div>
      </main>
    </CreatorAccessGate>
  )
}