'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Mail, Star, Award, BookOpen, Users, Trophy, ArrowLeft } from 'lucide-react'
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
    certifications?: string[]
    achievements?: string[]
    profileImageUrl?: string
    coverImageUrl?: string
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

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <header className="relative bg-gray-800">
        {/* Background Image with Dark Blue Overlay */}
        <div className="absolute inset-0">
          {coach.coverImageUrl ? (
            <Image
              src={coach.coverImageUrl}
              alt={`${coach.displayName} background`}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-900 to-blue-700"></div>
          )}
          {/* Dark blue overlay to make text pop */}
          <div className="absolute inset-0 bg-blue-900 opacity-80"></div>
        </div>
        
        {/* Back Button */}
        {!isInIframe && onBack && (
          <button
            onClick={onBack}
            className="absolute top-6 left-6 z-10 inline-flex items-center gap-2 text-white hover:text-blue-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
        )}
        
        {/* Content */}
        <div className="relative container mx-auto px-4 py-4 lg:py-6">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
            
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-3 border-white shadow-xl overflow-hidden bg-gray-200">
                {coach.profileImageUrl ? (
                  <Image
                    src={coach.profileImageUrl}
                    alt={coach.displayName}
                    width={112}
                    height={112}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600 text-2xl font-bold">
                    {coach.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            
            {/* Text Content */}
            <div className="text-center md:text-left">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-tight drop-shadow-lg">
                {coach.displayName.toUpperCase()}
              </h1>
              <p className="mt-1 text-sm sm:text-base font-semibold text-white drop-shadow-md">
                {coach.bio || `${coach.sport || 'Athletic'} Performance Training`}
              </p>
              <p className="mt-1 text-xs sm:text-sm font-medium text-blue-100 drop-shadow-sm">
                {coach.yearsExperience ? `${coach.yearsExperience}+ Years Experience` : 'Certified Coach'}
              </p>
              
              {/* Stats */}
              <div className="mt-2 flex flex-wrap gap-2 justify-center md:justify-start">
                <div className="text-center bg-white/20 backdrop-blur-sm rounded-md px-2 py-1">
                  <div className="text-sm font-bold text-white drop-shadow-md">{totalLessons}</div>
                  <div className="text-xs text-blue-100 font-medium">Lessons</div>
                </div>
                <div className="text-center bg-white/20 backdrop-blur-sm rounded-md px-2 py-1">
                  <div className="text-sm font-bold text-white drop-shadow-md">{totalAthletes}</div>
                  <div className="text-xs text-blue-100 font-medium">Athletes</div>
                </div>
                <div className="text-center bg-white/20 backdrop-blur-sm rounded-md px-2 py-1">
                  <div className="text-sm font-bold text-white drop-shadow-md">5.0</div>
                  <div className="text-xs text-blue-100 font-medium">Rating</div>
                </div>
              </div>
              
              {lessons.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
                  <a
                    href="#library"
                    className="inline-block bg-blue-600 text-white font-bold py-2 px-6 rounded-full shadow-lg text-sm transition-transform hover:scale-105 hover:bg-blue-700"
                  >
                    <BookOpen className="w-4 h-4 inline mr-1" />
                    View Training Library
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* About Section */}
      {coach.bio && (
        <section id="about" className="py-6 lg:py-8 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center gap-4 lg:gap-6">
              
              {/* Text Content */}
              <div className="w-full md:w-1/2">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                  About {coach.displayName.split(' ')[0]}
                </h2>
                <div>
                  <p className="mt-2 text-base text-gray-600 leading-relaxed">
                    {coach.bio && coach.bio.length > 150 && !isBioExpanded
                      ? `${coach.bio.slice(0, 150)}...`
                      : coach.bio}
                  </p>
                  {coach.bio && coach.bio.length > 150 && (
                    <button
                      onClick={() => setIsBioExpanded(!isBioExpanded)}
                      className="text-sm font-semibold mt-1 text-red-600 hover:underline"
                    >
                      {isBioExpanded ? 'Read less' : 'Read more'}
                    </button>
                  )}
                </div>
                {coach.specialties && coach.specialties.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-base font-semibold text-gray-900 mb-2">Specialties</h3>
                    <div className="flex flex-wrap gap-2">
                      {coach.specialties.map((specialty, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Image Placeholder */}
              <div className="w-full md:w-1/2">
                <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg shadow-lg flex items-center justify-center">
                  {coach.profileImageUrl ? (
                    <Image
                      src={coach.profileImageUrl}
                      alt={`${coach.displayName} coaching`}
                      width={400}
                      height={192}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-center text-gray-500">
                      <div className="w-16 h-16 bg-blue-300 rounded-full mx-auto mb-2 flex items-center justify-center">
                        <Users className="w-8 h-8 text-blue-600" />
                      </div>
                      <p className="text-sm font-medium">Coaching in Action</p>
                    </div>
                  )}
                </div>
              </div>
              
            </div>
          </div>
        </section>
      )}

      {/* Training Library Section */}
      {lessons.length > 0 && (
        <section id="library" className="py-6 lg:py-8 bg-gray-50">
          <div className="container mx-auto px-4">
            
            {/* Section Header */}
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                {coach.displayName.split(' ')[0]}'s Training Library
              </h2>
              <p className="mt-2 text-base text-gray-600">
                Access world-class training programs, drills, and mindset courses designed to elevate your game.
              </p>
            </div>
            
            {/* Card Grid */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lessons.map((lesson, index) => (
                <div
                  key={lesson.id}
                  className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col transition-transform hover:scale-105"
                >
                  {lesson.thumbnailUrl ? (
                    <div className="h-48 overflow-hidden">
                      <Image
                        src={lesson.thumbnailUrl}
                        alt={lesson.title}
                        width={400}
                        height={192}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className="text-xl font-bold text-gray-900">{lesson.title}</h3>
                    {lesson.description && (
                      <p className="mt-2 text-gray-600 flex-grow line-clamp-3">
                        {lesson.description}
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {lesson.sport && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {lesson.sport}
                        </span>
                      )}
                      {lesson.level && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          {lesson.level}
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/lesson/${lesson.id}`}
                      className="mt-6 inline-block bg-gray-800 text-white font-semibold text-center py-2 px-5 rounded-lg hover:bg-gray-900 transition-colors"
                    >
                      Get Access
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Certifications & Achievements */}
      {((coach.certifications && coach.certifications.length > 0) || (coach.achievements && coach.achievements.length > 0)) && (
        <section className="py-6 lg:py-8 bg-white">
          <div className="container mx-auto px-4">
            
            <div className="text-center max-w-2xl mx-auto mb-4">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                Credentials & Achievements
              </h2>
              <p className="mt-2 text-base text-gray-600">
                Professional qualifications and accomplishments that set {coach.displayName.split(' ')[0]} apart.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* Certifications */}
              {coach.certifications && coach.certifications.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg shadow-md">
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="w-6 h-6 text-blue-600" />
                    <h3 className="text-lg font-bold text-gray-900">Certifications</h3>
                  </div>
                  <ul className="space-y-2">
                    {coach.certifications.map((cert, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="text-blue-600 text-xl">•</span>
                        <span className="text-gray-700">{cert}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Achievements */}
              {coach.achievements && coach.achievements.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg shadow-md">
                  <div className="flex items-center gap-2 mb-3">
                    <Trophy className="w-6 h-6 text-yellow-600" />
                    <h3 className="text-lg font-bold text-gray-900">Achievements</h3>
                  </div>
                  <ul className="space-y-2">
                    {coach.achievements.map((achievement, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="text-yellow-600 text-xl">•</span>
                        <span className="text-gray-700">{achievement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-6">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2025 {coach.displayName}. All rights reserved.</p>
        </div>
      </footer>

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
