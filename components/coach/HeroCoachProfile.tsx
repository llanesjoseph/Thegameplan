'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Mail, Star, Award, BookOpen, Users, Trophy, ArrowLeft, MapPin, Instagram, Youtube, Linkedin, Facebook } from 'lucide-react'
import ContactCoachModal from './ContactCoachModal'
import { useAuth } from '@/hooks/use-auth'

interface HeroCoachProfileProps {
  coach: {
    uid: string
    displayName: string
    email: string
    bio?: string
    sport?: string
    yearsExperience?: number
    specialties?: string[]
    certifications?: string[] | string
    achievements?: string[] | string
    profileImageUrl?: string
    coverImageUrl?: string
    bannerUrl?: string
    tagline?: string
    title?: string
    location?: string
    websiteUrl?: string
    website?: string
    instagram?: string
    youtube?: string
    linkedin?: string
    facebook?: string
    socialLinks?: {
      twitter?: string
      instagram?: string
      linkedin?: string
    }
  }
  totalLessons: number
  totalAthletes: number
  lessons: Array<{
    id: string
    title: string
    description?: string
    sport?: string
    level?: string
    createdAt: any
    videoUrl?: string
    thumbnailUrl?: string
  }>
  isInIframe?: boolean
  onBack?: () => void
}

export default function HeroCoachProfile({
  coach,
  totalLessons,
  totalAthletes,
  lessons,
  isInIframe = false,
  onBack
}: HeroCoachProfileProps) {
  const { user } = useAuth()
  const [showContactModal, setShowContactModal] = useState(false)
  const [isBioExpanded, setIsBioExpanded] = useState(false)
  const [isAchievementsExpanded, setIsAchievementsExpanded] = useState(false)
  const [showSocialIcons, setShowSocialIcons] = useState(false)

  // Auto-flip back after 5 seconds
  useEffect(() => {
    if (showSocialIcons) {
      const timer = setTimeout(() => {
        setShowSocialIcons(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [showSocialIcons])

  const bannerUrl = coach.bannerUrl || coach.coverImageUrl || coach.profileImageUrl
  const tagline = coach.tagline || coach.title
  const websiteUrl = coach.websiteUrl || coach.website
  const instagram = coach.instagram || coach.socialLinks?.instagram
  const youtube = coach.youtube
  const linkedin = coach.linkedin || coach.socialLinks?.linkedin
  const facebook = coach.facebook
  const bio = coach.bio || ''
  const achievements = typeof coach.achievements === 'string' ? coach.achievements : coach.achievements?.join('\n')
  const certifications = typeof coach.certifications === 'string' ? coach.certifications : coach.certifications?.join('\n')

  const handleSignOut = async () => {
    try {
      const { signOut } = await import('firebase/auth')
      const { auth } = await import('@/lib/firebase.client')
      await signOut(auth)
      window.location.href = '/'
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-cream to-sky-blue/10">
      {/* Header */}
      {!isInIframe && (
        <header className="bg-white/80 backdrop-blur-sm border-b border-white/50 px-4 sm:px-6 lg:px-8 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex-shrink-0">
              <span className="text-2xl font-bold" style={{ color: '#440102', fontFamily: '"Open Sans", sans-serif', fontWeight: 700 }}>
                ATHLEAP
              </span>
            </Link>
            <div className="flex items-center gap-3">
              {user ? (
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 rounded-lg text-white font-bold text-sm transition-opacity hover:opacity-90"
                  style={{ background: 'linear-gradient(to right, #FC0105, #000000)', fontFamily: '"Open Sans", sans-serif' }}
                >
                  Sign Out
                </button>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 rounded-lg border-2 border-black text-black font-bold text-sm transition-colors hover:bg-black hover:text-white"
                    style={{ fontFamily: '"Open Sans", sans-serif' }}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/onboarding"
                    className="px-4 py-2 rounded-lg text-white font-bold text-sm transition-opacity hover:opacity-90"
                    style={{ background: 'linear-gradient(to right, #FC0105, #000000)', fontFamily: '"Open Sans", sans-serif' }}
                  >
                    Join Now
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Back Button */}
      {!isInIframe && onBack && (
        <div className="max-w-4xl mx-auto px-6 pt-6">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-dark/60 hover:text-dark transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-4">
          {/* Banner with overlay profile */}
          <div className="relative">
            <div className="h-36 sm:h-44 md:h-56 rounded-xl overflow-hidden bg-gray-100">
              {bannerUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={bannerUrl} alt="Coach banner" className="w-full h-full object-cover" />
              ) : (
                <div className="relative w-full h-full bg-white">
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-gray-300" />
                </div>
              )}
            </div>
            {/* Profile photo fixed near top-right */}
            <div className="absolute top-6 right-6 w-[calc(50%-0.75rem)] sm:w-[calc(33.333%-0.667rem)] lg:w-[calc(25%-0.75rem)]">
              <div className="w-full rounded-lg overflow-hidden ring-4 ring-white shadow-xl bg-gray-100" style={{ aspectRatio: '1/1' }}>
                {coach.profileImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coach.profileImageUrl} alt={coach.displayName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#8B7D7B' }}>
                    <img src="/brand/athleap-logo-colored.png" alt="AthLeap" className="w-1/2 opacity-90" />
                  </div>
                )}
              </div>

              {/* Social Media Flip Card - Below Profile Photo */}
              {(instagram || youtube || linkedin || facebook) && (
                <div className="mt-4 w-full perspective-1000" style={{ perspective: '1000px' }}>
                  <div
                    className="relative w-full"
                    style={{
                      transformStyle: 'preserve-3d',
                      transition: 'transform 0.6s',
                      transform: showSocialIcons ? 'rotateY(180deg)' : 'rotateY(0deg)'
                    }}
                    onMouseEnter={() => setShowSocialIcons(true)}
                  >
                    {/* Front - Connect Button */}
                    <div
                      className="w-full backface-hidden"
                      style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(0deg)'
                      }}
                    >
                      <button
                        className="w-full py-2.5 rounded-lg text-white text-sm font-bold transition-colors"
                        style={{
                          backgroundColor: '#000000',
                          fontFamily: '"Open Sans", sans-serif',
                          fontWeight: 700
                        }}
                      >
                        Connect
                      </button>
                    </div>

                    {/* Back - Social Icons */}
                    <div
                      className="absolute inset-0 w-full backface-hidden"
                      style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)'
                      }}
                    >
                      <div className="w-full py-2 px-2 rounded-lg bg-black flex justify-center gap-2">
                        {instagram && (
                          <a
                            href={`https://instagram.com/${instagram.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                            style={{ backgroundColor: '#E4405F' }}
                            title="Instagram"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Instagram className="w-4 h-4 text-white" />
                          </a>
                        )}
                        {youtube && (
                          <a
                            href={youtube.startsWith('http') ? youtube : `https://youtube.com/${youtube}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                            style={{ backgroundColor: '#FF0000' }}
                            title="YouTube"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Youtube className="w-4 h-4 text-white" />
                          </a>
                        )}
                        {linkedin && (
                          <a
                            href={linkedin.startsWith('http') ? linkedin : `https://linkedin.com/in/${linkedin}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                            style={{ backgroundColor: '#0A66C2' }}
                            title="LinkedIn"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Linkedin className="w-4 h-4 text-white" />
                          </a>
                        )}
                        {facebook && (
                          <a
                            href={facebook.startsWith('http') ? facebook : `https://facebook.com/${facebook}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                            style={{ backgroundColor: '#1877F2' }}
                            title="Facebook"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Facebook className="w-4 h-4 text-white" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Text content below banner */}
          <div className="pt-6 sm:pt-8 space-y-4">
            {/* Name and Details */}
            <div>
              <h2
                className="text-2xl sm:text-3xl font-bold mb-1"
                style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif', fontWeight: 700 }}
              >
                {coach.displayName}
              </h2>
              {tagline && (
                <p className="text-base mb-2" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif', fontStyle: 'italic' }}>
                  {tagline}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 text-sm" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                {coach.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    <span>{coach.location}</span>
                  </div>
                )}
                {coach.yearsExperience && (
                  <div className="flex items-center gap-1.5">
                    <Award className="w-4 h-4" />
                    <span>{coach.yearsExperience} years experience</span>
                  </div>
                )}
              </div>
            </div>

            {/* Sport Badge */}
            {coach.sport && (
              <div>
                <span className="text-sm font-bold block mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                  Specialties:
                </span>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-bold"
                  style={{
                    fontFamily: '"Open Sans", sans-serif',
                    fontWeight: 700,
                    backgroundColor: '#000'
                  }}
                >
                  {coach.sport}
                </div>
              </div>
            )}

            {/* Content Section */}
            <div className="max-w-4xl space-y-4">
              {/* Bio */}
              {bio && (
                <div>
                  <h4 className="text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                    About
                  </h4>
                  <div>
                    <p className="text-sm leading-relaxed" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                      {bio.length > 150 && !isBioExpanded
                        ? `${bio.slice(0, 150)}...`
                        : bio}
                    </p>
                    {bio.length > 150 && (
                      <button
                        onClick={() => setIsBioExpanded(!isBioExpanded)}
                        className="text-sm font-semibold mt-1 hover:underline"
                        style={{ color: '#FC0105', fontFamily: '"Open Sans", sans-serif' }}
                      >
                        {isBioExpanded ? 'Read less' : 'Read more'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Achievements */}
              {achievements && (
                <div>
                  <h4 className="text-sm font-bold mb-2 flex items-center gap-1.5" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                    <Award className="w-4 h-4" />
                    Achievements
                  </h4>
                  <div>
                    <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                      {achievements.length > 150 && !isAchievementsExpanded
                        ? `${achievements.slice(0, 150)}...`
                        : achievements}
                    </p>
                    {achievements.length > 150 && (
                      <button
                        onClick={() => setIsAchievementsExpanded(!isAchievementsExpanded)}
                        className="text-sm font-semibold mt-1 hover:underline"
                        style={{ color: '#FC0105', fontFamily: '"Open Sans", sans-serif' }}
                      >
                        {isAchievementsExpanded ? 'Read less' : 'Read more'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {certifications && (
                <div>
                  <h4 className="text-sm font-bold mb-2 flex items-center gap-1.5" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                    <Award className="w-4 h-4" />
                    Certifications
                  </h4>
                  <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                    {certifications}
                  </p>
                </div>
              )}

              {/* Website */}
              {websiteUrl && (
                <div>
                  <h4 className="text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                    Website
                  </h4>
                  <a
                    href={websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold hover:underline inline-flex items-center gap-1"
                    style={{ color: '#FC0105', fontFamily: '"Open Sans", sans-serif' }}
                  >
                    {websiteUrl}
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              )}

              {/* Stats */}
              {(totalLessons > 0 || totalAthletes > 0) && (
                <div>
                  <h4 className="text-sm font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                    Stats
                  </h4>
                  <div className="flex flex-wrap gap-4 text-sm" style={{ fontFamily: '"Open Sans", sans-serif' }}>
                    {totalLessons > 0 && (
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4" style={{ color: '#FC0105' }} />
                        <span style={{ color: '#000000' }}><strong>{totalLessons}</strong> Lessons</span>
                      </div>
                    )}
                    {totalAthletes > 0 && (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" style={{ color: '#FC0105' }} />
                        <span style={{ color: '#000000' }}><strong>{totalAthletes}</strong> Athletes</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Training Library Section */}
        {lessons.length > 0 && (
          <div className="mt-12">
            <div className="mb-6">
              <h2 className="text-2xl font-bold" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                Training Library
              </h2>
              <p className="text-sm mt-1" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                Access world-class training programs designed to elevate your game
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 overflow-hidden hover:shadow-xl transition-shadow"
                >
                  {lesson.thumbnailUrl ? (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={lesson.thumbnailUrl}
                        alt={lesson.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="text-lg font-bold mb-2" style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>
                      {lesson.title}
                    </h3>
                    {lesson.description && (
                      <p className="text-sm mb-3 line-clamp-2" style={{ color: '#666', fontFamily: '"Open Sans", sans-serif' }}>
                        {lesson.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {lesson.level && (
                        <span
                          className="px-2 py-1 rounded-full text-xs font-bold text-white"
                          style={{
                            backgroundColor: lesson.level === 'intermediate' ? '#0A66C2' : lesson.level === 'advanced' ? '#FC0105' : '#00A651'
                          }}
                        >
                          {lesson.level}
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/lesson/${lesson.id}`}
                      className="block w-full text-center py-2 rounded-lg text-white font-bold text-sm transition-opacity hover:opacity-90"
                      style={{ background: 'linear-gradient(to right, #FC0105, #000000)', fontFamily: '"Open Sans", sans-serif' }}
                    >
                      View Lesson
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Contact Modal */}
      <ContactCoachModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        coachId={coach.uid}
        coachName={coach.displayName}
        athleteId={user?.uid}
      />
    </div>
  )
}
