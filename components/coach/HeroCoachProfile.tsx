'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Mail, Star, Award, BookOpen, Users, Trophy, ArrowLeft } from 'lucide-react'

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
        <div className="relative container mx-auto px-6 py-12 lg:py-16">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
            
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              <div className="w-40 h-40 md:w-48 md:h-48 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-gray-200">
                {coach.profileImageUrl ? (
                  <Image
                    src={coach.profileImageUrl}
                    alt={coach.displayName}
                    width={192}
                    height={192}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600 text-4xl font-bold">
                    {coach.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            
            {/* Text Content */}
            <div className="text-center md:text-left">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight drop-shadow-lg">
                {coach.displayName.toUpperCase()}
              </h1>
              <p className="mt-3 text-lg sm:text-xl font-semibold text-white drop-shadow-md">
                {coach.bio || `${coach.sport || 'Athletic'} Performance Training`}
              </p>
              <p className="mt-2 text-base sm:text-lg font-medium text-blue-100 drop-shadow-sm">
                {coach.yearsExperience ? `${coach.yearsExperience}+ Years Experience` : 'Certified Coach'}
              </p>
              
              {/* Stats */}
              <div className="mt-4 flex flex-wrap gap-4 justify-center md:justify-start">
                <div className="text-center bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                  <div className="text-xl font-bold text-white drop-shadow-md">{totalLessons}</div>
                  <div className="text-xs text-blue-100 font-medium">Lessons</div>
                </div>
                <div className="text-center bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                  <div className="text-xl font-bold text-white drop-shadow-md">{totalAthletes}</div>
                  <div className="text-xs text-blue-100 font-medium">Athletes</div>
                </div>
                <div className="text-center bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                  <div className="text-xl font-bold text-white drop-shadow-md">5.0</div>
                  <div className="text-xs text-blue-100 font-medium">Rating</div>
                </div>
              </div>
              
              <div className="mt-6 flex flex-wrap gap-3 justify-center md:justify-start">
                <a
                  href={`mailto:${coach.email}`}
                  className="inline-block bg-white text-blue-800 font-bold py-3 px-8 rounded-full shadow-lg text-lg transition-transform hover:scale-105"
                >
                  <Mail className="w-5 h-5 inline mr-2" />
                  Contact Coach
                </a>
                {lessons.length > 0 && (
                  <a
                    href="#library"
                    className="inline-block bg-blue-600 text-white font-bold py-3 px-8 rounded-full shadow-lg text-lg transition-transform hover:scale-105 hover:bg-blue-700"
                  >
                    <BookOpen className="w-5 h-5 inline mr-2" />
                    View Training Library
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* About Section */}
      {coach.bio && (
        <section id="about" className="py-12 lg:py-16 bg-white">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center gap-8 lg:gap-12">
              
              {/* Text Content */}
              <div className="w-full md:w-1/2">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                  About {coach.displayName.split(' ')[0]}
                </h2>
                <p className="mt-4 text-lg text-gray-600 leading-relaxed">
                  {coach.bio}
                </p>
                {coach.specialties && coach.specialties.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Specialties</h3>
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
                <a
                  href={`mailto:${coach.email}`}
                  className="mt-8 inline-block bg-blue-600 text-white font-bold py-3 px-10 rounded-lg shadow-lg text-lg transition-transform hover:bg-blue-700 hover:scale-105"
                >
                  Ask {coach.displayName.split(' ')[0]}
                </a>
              </div>
              
              {/* Image Placeholder */}
              <div className="w-full md:w-1/2">
                <div className="w-full h-80 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl shadow-xl flex items-center justify-center">
                  {coach.profileImageUrl ? (
                    <Image
                      src={coach.profileImageUrl}
                      alt={`${coach.displayName} coaching`}
                      width={400}
                      height={320}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <div className="text-center text-gray-500">
                      <div className="w-24 h-24 bg-blue-300 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <Users className="w-12 h-12 text-blue-600" />
                      </div>
                      <p className="text-lg font-medium">Coaching in Action</p>
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
        <section id="library" className="py-12 lg:py-16 bg-gray-50">
          <div className="container mx-auto px-6">
            
            {/* Section Header */}
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                {coach.displayName.split(' ')[0]}'s Training Library
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Access world-class training programs, drills, and mindset courses designed to elevate your game.
              </p>
            </div>
            
            {/* Card Grid */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        <section className="py-12 lg:py-16 bg-white">
          <div className="container mx-auto px-6">
            
            <div className="text-center max-w-2xl mx-auto mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Credentials & Achievements
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Professional qualifications and accomplishments that set {coach.displayName.split(' ')[0]} apart.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Certifications */}
              {coach.certifications && coach.certifications.length > 0 && (
                <div className="bg-gray-50 p-8 rounded-xl shadow-md">
                  <div className="flex items-center gap-3 mb-6">
                    <Award className="w-8 h-8 text-blue-600" />
                    <h3 className="text-2xl font-bold text-gray-900">Certifications</h3>
                  </div>
                  <ul className="space-y-3">
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
                <div className="bg-gray-50 p-8 rounded-xl shadow-md">
                  <div className="flex items-center gap-3 mb-6">
                    <Trophy className="w-8 h-8 text-yellow-600" />
                    <h3 className="text-2xl font-bold text-gray-900">Achievements</h3>
                  </div>
                  <ul className="space-y-3">
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
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-6 text-center">
          <p>&copy; 2025 {coach.displayName}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
