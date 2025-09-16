'use client'

import { useEffect, useRef } from 'react'

interface YouTubePlayerProps {
  videoId: string
  className?: string
}

interface YouTubePlayer {
  destroy: () => void
}

interface YouTubeEvent {
  data: unknown
}

declare global {
  interface Window {
    YT: {
      Player: new (element: HTMLElement, config: any) => YouTubePlayer
    }
    onYouTubeIframeAPIReady: () => void
  }
}

export default function YouTubePlayer({ videoId, className = '' }: YouTubePlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null)
  const playerInstance = useRef<YouTubePlayer | null>(null)

  useEffect(() => {
    // Load YouTube IFrame API
    if (!window.YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

      window.onYouTubeIframeAPIReady = initializePlayer
    } else {
      initializePlayer()
    }

    function initializePlayer() {
      if (playerRef.current && !playerInstance.current) {
        playerInstance.current = new window.YT.Player(playerRef.current, {
          height: '100%',
          width: '100%',
          videoId: videoId,
          playerVars: {
            playsinline: 1,
            rel: 0,
            modestbranding: 1,
            fs: 1,
            cc_load_policy: 0,
            iv_load_policy: 3,
            showinfo: 0
          },
          events: {
            onReady: (event: YouTubeEvent) => {
              console.log('YouTube player ready')
            },
            onError: (event: YouTubeEvent) => {
              console.error('YouTube player error:', event.data)
            }
          }
        })
      }
    }

    return () => {
      if (playerInstance.current) {
        playerInstance.current.destroy()
        playerInstance.current = null
      }
    }
  }, [videoId])

  return (
    <div className={`aspect-video ${className}`}>
      <div ref={playerRef} className="w-full h-full rounded-xl" />
    </div>
  )
}