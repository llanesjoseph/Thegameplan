'use client'

import { useState, useEffect } from 'react'
import { Plus, Check, UserPlus } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

interface FollowButtonProps {
  coachId: string
  coachName?: string
  variant?: 'default' | 'compact' | 'icon-only'
  onFollowChange?: (isFollowing: boolean) => void
}

export default function FollowButton({
  coachId,
  coachName = 'this coach',
  variant = 'default',
  onFollowChange
}: FollowButtonProps) {
  const { user } = useAuth()
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingStatus, setIsCheckingStatus] = useState(true)

  // Check if user is already following this coach
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!user || !coachId) {
        setIsCheckingStatus(false)
        return
      }

      try {
        const token = await user.getIdToken()
        const response = await fetch(`/api/athlete/follow-coach?coachId=${coachId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          const data = await response.json()
          setIsFollowing(data.isFollowing || false)
        }
      } catch (error) {
        console.error('Error checking follow status:', error)
      } finally {
        setIsCheckingStatus(false)
      }
    }

    checkFollowStatus()
  }, [user, coachId])

  const handleToggleFollow = async () => {
    if (!user) {
      alert('Please log in to follow coaches')
      return
    }

    if (isLoading) return

    setIsLoading(true)

    try {
      const token = await user.getIdToken()
      const method = isFollowing ? 'DELETE' : 'POST'

      const response = await fetch('/api/athlete/follow-coach', {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ coachId })
      })

      const data = await response.json()

      // Check if limit was reached (backend hard limit)
      if (!response.ok) {
        if (data.limitReached || response.status === 403) {
          // Show upgrade prompt with redirect option
          const shouldUpgrade = window.confirm(
            `${data.error || 'You have reached your coach limit.'}\n\nWould you like to view pricing plans and upgrade?`
          )
          if (shouldUpgrade) {
            window.location.href = data.upgradeUrl || '/dashboard/athlete/pricing'
          }
          return
        }
        throw new Error(data.error || 'Failed to toggle follow status')
      }

      const newFollowState = !isFollowing

      setIsFollowing(newFollowState)

      // Call callback if provided
      if (onFollowChange) {
        onFollowChange(newFollowState)
      }

      // Show success message
      if (newFollowState) {
        console.log(`✅ You are now following ${coachName}`)
      } else {
        console.log(`✅ You have unfollowed ${coachName}`)
      }

      // Trigger refresh in athlete dashboard
      localStorage.setItem('coachFollowUpdated', Date.now().toString())
      // Dispatch custom event for same-page updates
      window.dispatchEvent(new CustomEvent('coachFollowChange', { detail: { coachId, isFollowing: newFollowState } }))
    } catch (error) {
      console.error('Error toggling follow:', error)
      alert('Failed to update follow status. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isCheckingStatus) {
    return (
      <div className="animate-pulse">
        {variant === 'icon-only' ? (
          <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
        ) : (
          <div className="h-10 bg-gray-200 rounded-lg w-24"></div>
        )}
      </div>
    )
  }

  // Icon-only variant (for compact spaces)
  if (variant === 'icon-only') {
    return (
      <button
        onClick={handleToggleFollow}
        disabled={isLoading}
        className={`p-2 rounded-lg transition-all ${
          isFollowing
            ? 'bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600'
            : 'bg-[#FC0105] hover:bg-[#d70004] text-white'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
        title={isFollowing ? 'Unfollow' : 'Follow'}
      >
        {isFollowing ? (
          <Check className="w-4 h-4" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
      </button>
    )
  }

  // Compact variant (smaller button)
  if (variant === 'compact') {
    return (
      <button
        onClick={handleToggleFollow}
        disabled={isLoading}
        className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
          isFollowing
            ? 'bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 border border-gray-300'
            : 'bg-[#FC0105] hover:bg-[#d70004] text-white shadow-md hover:shadow-lg'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isFollowing ? (
          <>
            <Check className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Following</span>
          </>
        ) : (
          <>
            <Plus className="w-3.5 h-3.5" />
            <span>Follow</span>
          </>
        )}
      </button>
    )
  }

  // Default variant (full size button)
  return (
    <button
      onClick={handleToggleFollow}
      disabled={isLoading}
      className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
        isFollowing
          ? 'bg-white hover:bg-red-50 text-gray-700 hover:text-red-600 border-2 border-gray-300 hover:border-red-300'
          : 'bg-[#FC0105] hover:bg-[#d70004] text-white shadow-lg hover:shadow-xl'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
    >
      {isFollowing ? (
        <>
          <Check className="w-5 h-5" />
          <span>Following</span>
        </>
      ) : (
        <>
          <UserPlus className="w-5 h-5" />
          <span>Follow</span>
        </>
      )}
    </button>
  )
}
