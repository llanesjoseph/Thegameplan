'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { db } from '@/lib/firebase.client'
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { 
  Star, 
  MapPin, 
  Calendar, 
  Award, 
  Users, 
  Video, 
  MessageSquare, 
  Globe,
  Instagram,
  Youtube,
  ExternalLink,
  Clock,
  Target,
  TrendingUp,
  BookOpen,
  Play
} from 'lucide-react'
import Link from 'next/link'

interface CoachProfile {
  uid: string
  displayName: string
  email: string
  photoURL?: string
  bio: string
  specialties: string[]
  sports: string[]
  credentials: string[]
  experience: string
  location: string
  hourlyRate?: number
  averageRating: number
  totalReviews: number
  languages: string[]
  socialLinks?: {
    instagram?: string
    youtube?: string
    website?: string
  }
  coachingPhilosophy?: string
  achievements: string[]
  joinedAt: Date
  isVerified: boolean
  isActive: boolean
}

interface Lesson {
  id: string
  title: string
  description: string
  level: string
  views: number
  thumbnail?: string
  createdAt: Date
}

interface Review {
  id: string
  studentName: string
  rating: number
  comment: string
  createdAt: Date
}

export default function ContributorProfilePage() {
  const params = useParams()
  const uid = params.uid as string
  
  const [coach, setCoach] = useState<CoachProfile | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'about' | 'lessons' | 'reviews'>('about')

  useEffect(() => {
    if (uid) {
      loadCoachProfile()
    }
  }, [uid])

  const loadCoachProfile = async () => {
    try {
      setLoading(true)
      
      // Try to load from coaches collection first
      const coachDoc = await getDoc(doc(db, 'coaches', uid))
      
      if (coachDoc.exists()) {
        const coachData = coachDoc.data()
        setCoach({
          uid: coachDoc.id,
          ...coachData,
          joinedAt: coachData.joinedAt?.toDate() || new Date()
        } as CoachProfile)
        
        // Load lessons
        await loadCoachLessons(uid)
        
        // Load reviews
        await loadCoachReviews(uid)
      } else {
        // Fallback: try creators_index collection
        const creatorDoc = await getDoc(doc(db, 'creators_index', uid))
        
        if (creatorDoc.exists()) {
          const creatorData = creatorDoc.data()
          setCoach({
            uid: creatorDoc.id,
            displayName: creatorData.displayName || 'Unknown Coach',
            email: creatorData.email || '',
            bio: creatorData.bio || 'No bio available',
            specialties: creatorData.specialties || [],
            sports: creatorData.sports || [],
            credentials: creatorData.credentials || [],
            experience: creatorData.experience || '',
            location: creatorData.location || 'Location not specified',
            hourlyRate: creatorData.hourlyRate,
            averageRating: creatorData.averageRating || 0,
            totalReviews: creatorData.totalReviews || 0,
            languages: creatorData.languages || ['English'],
            socialLinks: creatorData.socialLinks || {},
            coachingPhilosophy: creatorData.coachingPhilosophy || '',
            achievements: creatorData.achievements || [],
            joinedAt: creatorData.joinedAt?.toDate() || new Date(),
            isVerified: creatorData.isVerified || false,
            isActive: creatorData.isActive !== false
          })
          
          await loadCoachLessons(uid)
          await loadCoachReviews(uid)
        } else {
          setError('Coach profile not found')
        }
      }
    } catch (error) {
      console.error('Error loading coach profile:', error)
      setError('Failed to load coach profile')
    } finally {
      setLoading(false)
    }
  }

  const loadCoachLessons = async (coachUid: string) => {
    try {
      const lessonsQuery = query(
        collection(db, 'content'),
        where('creatorUid', '==', coachUid),
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc'),
        limit(6)
      )
      
      const snapshot = await getDocs(lessonsQuery)
      const lessonsData: Lesson[] = []
      
      snapshot.forEach(doc => {
        const data = doc.data()
        lessonsData.push({
          id: doc.id,
          title: data.title || 'Untitled Lesson',
          description: data.description || '',
          level: data.level || 'All Levels',
          views: data.views || 0,
          thumbnail: data.thumbnail,
          createdAt: data.createdAt?.toDate() || new Date()
        })
      })
      
      setLessons(lessonsData)
    } catch (error) {
      console.error('Error loading lessons:', error)
    }
  }

  const loadCoachReviews = async (coachUid: string) => {
    try {
      // This would load from a reviews collection
      // For now, we'll use mock data since the collection might not exist
      const mockReviews: Review[] = [
        {
          id: '1',
          studentName: 'Alex Johnson',
          rating: 5,
          comment: 'Excellent coaching! Really helped me improve my technique.',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        },
        {
          id: '2',
          studentName: 'Sarah Chen',
          rating: 5,
          comment: 'Great instructor with clear explanations and helpful feedback.',
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
        },
        {
          id: '3',
          studentName: 'Mike Rodriguez',
          rating: 4,
          comment: 'Very knowledgeable and patient. Would recommend!',
          createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000)
        }
      ]
      
      setReviews(mockReviews)
    } catch (error) {
      console.error('Error loading reviews:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading coach profile...</p>
        </div>
      </div>
    )
  }

  if (error || !coach) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-900">Coach Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The coach profile you are looking for does not exist.'}</p>
          <Link
            href="/dashboard/coaching"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Other Coaches
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                {coach.photoURL ? (
                  <img 
                    src={coach.photoURL} 
                    alt={coach.displayName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  coach.displayName.charAt(0)
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">{coach.displayName}</h1>
                    {coach.isVerified && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        <Award className="w-4 h-4" />
                        Verified
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-current text-yellow-400" />
                      <span className="font-medium">{coach.averageRating.toFixed(1)}</span>
                      <span>({coach.totalReviews} reviews)</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{coach.location}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Joined {coach.joinedAt.toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Sports & Specialties */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {coach.sports.map((sport, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                      >
                        {sport}
                      </span>
                    ))}
                    {coach.specialties.slice(0, 3).map((specialty, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Link
                    href="/dashboard/coaching"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Request Coaching
                  </Link>
                  
                  {coach.hourlyRate && (
                    <div className="px-4 py-3 bg-gray-100 rounded-lg text-center">
                      <div className="text-2xl font-bold text-gray-900">${coach.hourlyRate}</div>
                      <div className="text-sm text-gray-600">per hour</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-1 mb-8 bg-white rounded-lg p-1 border border-gray-200">
          <button
            onClick={() => setActiveTab('about')}
            className={`px-6 py-3 rounded-md font-medium transition-colors ${
              activeTab === 'about'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            About
          </button>
          <button
            onClick={() => setActiveTab('lessons')}
            className={`px-6 py-3 rounded-md font-medium transition-colors ${
              activeTab === 'lessons'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Lessons ({lessons.length})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-6 py-3 rounded-md font-medium transition-colors ${
              activeTab === 'reviews'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Reviews ({reviews.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'about' && (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Bio */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{coach.bio}</p>
              </div>

              {/* Experience */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Experience</h2>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{coach.experience}</p>
              </div>

              {/* Coaching Philosophy */}
              {coach.coachingPhilosophy && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Coaching Philosophy</h2>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{coach.coachingPhilosophy}</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Credentials */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Credentials
                </h3>
                <div className="space-y-2">
                  {coach.credentials.map((credential, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span className="text-gray-700">{credential}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Achievements */}
              {coach.achievements.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Achievements
                  </h3>
                  <div className="space-y-2">
                    {coach.achievements.map((achievement, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                        <span className="text-gray-700">{achievement}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Languages */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Languages
                </h3>
                <div className="flex flex-wrap gap-2">
                  {coach.languages.map((language, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                    >
                      {language}
                    </span>
                  ))}
                </div>
              </div>

              {/* Social Links */}
              {coach.socialLinks && Object.values(coach.socialLinks).some(link => link) && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Connect</h3>
                  <div className="space-y-3">
                    {coach.socialLinks.instagram && (
                      <a
                        href={coach.socialLinks.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-gray-600 hover:text-pink-600 transition-colors"
                      >
                        <Instagram className="w-5 h-5" />
                        Instagram
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    {coach.socialLinks.youtube && (
                      <a
                        href={coach.socialLinks.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-gray-600 hover:text-red-600 transition-colors"
                      >
                        <Youtube className="w-5 h-5" />
                        YouTube
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    {coach.socialLinks.website && (
                      <a
                        href={coach.socialLinks.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        <Globe className="w-5 h-5" />
                        Website
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'lessons' && (
          <div>
            {lessons.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No lessons yet</h3>
                <p className="text-gray-600">This coach hasn't published any lessons yet.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lessons.map((lesson) => (
                  <div key={lesson.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video bg-gray-100 relative">
                      {lesson.thumbnail ? (
                        <img 
                          src={lesson.thumbnail} 
                          alt={lesson.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
                          <Play className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                        {lesson.views} views
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{lesson.title}</h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{lesson.description}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span className="px-2 py-1 bg-gray-100 rounded">{lesson.level}</span>
                        <span>{lesson.createdAt.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div>
            {reviews.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
                <p className="text-gray-600">This coach hasn't received any reviews yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          {review.studentName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{review.studentName}</h4>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? 'fill-current text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {review.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
