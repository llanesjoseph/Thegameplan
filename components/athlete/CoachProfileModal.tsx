'use client'

import { useState, useEffect } from 'react'
import { X, MapPin, Award, Instagram, Facebook, Twitter, Linkedin, Youtube, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface CoachProfileModalProps {
  isOpen: boolean
  onClose: () => void
  coachId: string
  coachSlug?: string
  hideLessons?: boolean
}

export default function CoachProfileModal({ isOpen, onClose, coachId, coachSlug, hideLessons = false }: CoachProfileModalProps) {
  const [coach, setCoach] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && (coachSlug || coachId)) {
      fetchCoachProfile()
    }
  }, [isOpen, coachSlug, coachId])

  const fetchCoachProfile = async () => {
    try {
      setLoading(true)
      setError(null)

      const identifier = coachSlug || coachId
      const response = await fetch(`/api/coach-profile/${identifier}`)
      const result = await response.json()

      if (!result.success) {
        setError(result.error || 'Coach not found')
        return
      }

      setCoach(result.data)
    } catch (error) {
      console.error('Error fetching coach profile:', error)
      setError('Failed to load coach profile')
    } finally {
      setLoading(false)
    }
  }

  const normalizeSocialUrl = (platform: string, value?: string) => {
    if (!value) return ''
    const trimmed = value.trim()
    if (!trimmed) return ''
    if (/^https?:\/\//i.test(trimmed)) return trimmed
    const handle = trimmed.replace(/^@/, '')
    switch (platform) {
      case 'instagram':
        return `https://www.instagram.com/${handle}`
      case 'facebook':
        return `https://www.facebook.com/${handle}`
      case 'twitter':
        return `https://twitter.com/${handle}`
      case 'linkedin':
        return `https://www.linkedin.com/in/${handle}`
      case 'youtube':
        return `https://www.youtube.com/${handle}`
      default:
        return trimmed
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Close Button */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white sticky top-0 z-10">
          <h2
            className="text-2xl font-bold"
            style={{ fontFamily: '"Open Sans", sans-serif', color: '#000000' }}
          >
            Coach Profile
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" style={{ color: '#000000' }} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-black mx-auto mb-4"></div>
                <p style={{ color: '#000000', fontFamily: '"Open Sans", sans-serif' }}>Loading coach profile...</p>
              </div>
            </div>
          ) : error || !coach ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <p className="text-red-600 mb-4" style={{ fontFamily: '"Open Sans", sans-serif' }}>
                  {error || 'Coach not found'}
                </p>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                  style={{ fontFamily: '"Open Sans", sans-serif' }}
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Hero Section */}
              <div className="flex flex-col md:flex-row gap-6">
                {/* Profile Image */}
                <div className="flex-shrink-0">
                  <div className="w-48 h-48 rounded-2xl overflow-hidden bg-gray-100 shadow-lg">
                    {coach.profileImageUrl ? (
                      <img
                        src={coach.profileImageUrl}
                        alt={coach.displayName || coach.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <img src="/brand/athleap-logo-colored.png" alt="AthLeap" className="w-1/2 opacity-50" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Coach Info */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h1
                      className="text-3xl font-bold mb-2"
                      style={{ fontFamily: '"Open Sans", sans-serif', color: '#000000' }}
                    >
                      {coach.displayName || coach.name}
                    </h1>
                    {coach.tagline && (
                      <p
                        className="text-lg mb-3"
                        style={{ fontFamily: '"Open Sans", sans-serif', color: '#666666' }}
                      >
                        {coach.tagline}
                      </p>
                    )}
                  </div>

                  {/* Meta Info */}
                  <div className="flex flex-wrap gap-4">
                    {coach.sport && (
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5" style={{ color: '#666666' }} />
                        <span style={{ fontFamily: '"Open Sans", sans-serif', color: '#666666' }}>
                          {coach.sport}
                        </span>
                      </div>
                    )}
                    {coach.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5" style={{ color: '#666666' }} />
                        <span style={{ fontFamily: '"Open Sans", sans-serif', color: '#666666' }}>
                          {coach.location}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Social Links */}
                  {(coach.instagram || coach.facebook || coach.twitter || coach.linkedin || coach.youtube || coach.socialLinks) && (
                    <div className="flex flex-wrap gap-3 pt-2">
                      {coach.instagram || coach.socialLinks?.instagram ? (
                        <a
                          href={normalizeSocialUrl('instagram', coach.instagram || coach.socialLinks?.instagram)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity"
                        >
                          <Instagram className="w-4 h-4" />
                          <span className="text-sm font-semibold">Instagram</span>
                        </a>
                      ) : null}
                      {coach.facebook || coach.socialLinks?.facebook ? (
                        <a
                          href={normalizeSocialUrl('facebook', coach.facebook || coach.socialLinks?.facebook)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:opacity-90 transition-opacity"
                        >
                          <Facebook className="w-4 h-4" />
                          <span className="text-sm font-semibold">Facebook</span>
                        </a>
                      ) : null}
                      {coach.twitter || coach.socialLinks?.twitter ? (
                        <a
                          href={normalizeSocialUrl('twitter', coach.twitter || coach.socialLinks?.twitter)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black text-white hover:opacity-90 transition-opacity"
                        >
                          <Twitter className="w-4 h-4" />
                          <span className="text-sm font-semibold">Twitter</span>
                        </a>
                      ) : null}
                      {coach.linkedin || coach.socialLinks?.linkedin ? (
                        <a
                          href={normalizeSocialUrl('linkedin', coach.linkedin || coach.socialLinks?.linkedin)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-700 text-white hover:opacity-90 transition-opacity"
                        >
                          <Linkedin className="w-4 h-4" />
                          <span className="text-sm font-semibold">LinkedIn</span>
                        </a>
                      ) : null}
                      {coach.youtube || coach.socialLinks?.youtube ? (
                        <a
                          href={normalizeSocialUrl('youtube', coach.youtube || coach.socialLinks?.youtube)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:opacity-90 transition-opacity"
                        >
                          <Youtube className="w-4 h-4" />
                          <span className="text-sm font-semibold">YouTube</span>
                        </a>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>

              {/* Bio Section */}
              {(coach.bio || coach.description) && (
                <div className="pt-4 border-t border-gray-200">
                  <h3
                    className="text-xl font-bold mb-3"
                    style={{ fontFamily: '"Open Sans", sans-serif', color: '#000000' }}
                  >
                    About
                  </h3>
                  <p
                    className="text-base leading-relaxed whitespace-pre-wrap"
                    style={{ fontFamily: '"Open Sans", sans-serif', color: '#333333' }}
                  >
                    {coach.bio || coach.description}
                  </p>
                </div>
              )}

              {/* Specialties */}
              {coach.specialties && coach.specialties.length > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <h3
                    className="text-xl font-bold mb-3"
                    style={{ fontFamily: '"Open Sans", sans-serif', color: '#000000' }}
                  >
                    Specialties
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {coach.specialties.map((specialty: string, index: number) => (
                      <span
                        key={index}
                        className="px-4 py-2 rounded-full bg-gray-100 text-sm font-medium"
                        style={{ fontFamily: '"Open Sans", sans-serif', color: '#000000' }}
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* View Full Profile Button */}
              <div className="pt-4 border-t border-gray-200">
                <Link
                  href={coachSlug ? `/coach-profile/${coachSlug}` : `/coach-profile/${coachId}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-semibold transition-all hover:opacity-90"
                  style={{ backgroundColor: '#C40000', fontFamily: '"Open Sans", sans-serif' }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onClose()
                  }}
                >
                  <span>View Full Profile</span>
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
