'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const THRESHOLD = 80
const MAX_PULL = 120

export default function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const startYRef = useRef(0)
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const pullingRef = useRef(false)

  const triggerHaptic = useCallback(() => {
    if ('vibrate' in navigator) navigator.vibrate(10)
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onTouchStart = (e: TouchEvent) => {
      // Only activate when at the top of the scroll container
      if (window.scrollY > 0) return
      startYRef.current = e.touches[0].clientY
      pullingRef.current = true
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!pullingRef.current) return
      const delta = e.touches[0].clientY - startYRef.current
      if (delta <= 0) { setPullDistance(0); return }
      // Prevent default scroll only when pulling down
      if (window.scrollY === 0 && delta > 0) e.preventDefault()
      const clamped = Math.min(delta * 0.5, MAX_PULL)
      setPullDistance(clamped)
      if (clamped >= THRESHOLD) triggerHaptic()
    }

    const onTouchEnd = async () => {
      if (!pullingRef.current) return
      pullingRef.current = false
      if (pullDistance >= THRESHOLD) {
        setRefreshing(true)
        triggerHaptic()
        router.refresh()
        await new Promise((r) => setTimeout(r, 1000))
        setRefreshing(false)
      }
      setPullDistance(0)
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [pullDistance, router, triggerHaptic])

  const progress = Math.min(pullDistance / THRESHOLD, 1)
  const showIndicator = pullDistance > 8 || refreshing

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Pull indicator */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 60,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
          transform: `translateY(${showIndicator ? Math.min(pullDistance, 48) - 40 : -40}px)`,
          transition: refreshing ? 'none' : 'transform 0.1s ease',
        }}
      >
        <div className="bg-[#1A1B3A] border border-[#3C3A58] rounded-full w-9 h-9 flex items-center justify-center shadow-lg">
          {refreshing ? (
            <div className="w-4 h-4 border-2 border-[#6D28D9] border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              style={{
                transform: `rotate(${progress * 180}deg)`,
                transition: 'transform 0.1s ease',
                opacity: progress,
              }}
            >
              <path d="M8 2v12M4 10l4 4 4-4" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>

      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: pullingRef.current ? 'none' : 'transform 0.3s ease',
        }}
      >
        {children}
      </div>
    </div>
  )
}
