'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Don't show if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) return
    if ((navigator as any).standalone) return

    // Check if already dismissed this session
    if (sessionStorage.getItem('pwa-prompt-dismissed')) return

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const safari = /safari/i.test(navigator.userAgent) && !/chrome/i.test(navigator.userAgent)

    if (ios && safari) {
      setIsIOS(true)
      setTimeout(() => setShow(true), 3000)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setTimeout(() => setShow(true), 3000)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setShow(false)
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShow(false)
    setDismissed(true)
    sessionStorage.setItem('pwa-prompt-dismissed', '1')
  }

  if (!show || dismissed) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 lg:hidden">
      <div className="bg-[#1A1B3A] border border-[#6D28D9]/40 rounded-2xl p-4 shadow-2xl shadow-purple-900/30">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-[#6D28D9] rounded-xl flex items-center justify-center flex-shrink-0">
            <div className="w-4 h-4 bg-white rounded-full" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#EDEAF8] text-sm">Add DreamLink to Home Screen</p>
            {isIOS ? (
              <p className="text-[#8A88A8] text-xs mt-0.5">
                Tap <span className="text-[#8B5CF6]">Share</span> then <span className="text-[#8B5CF6]">Add to Home Screen</span> for the full app experience.
              </p>
            ) : (
              <p className="text-[#8A88A8] text-xs mt-0.5">
                Install for faster access and offline support.
              </p>
            )}
          </div>
          <button onClick={handleDismiss} className="text-[#8A88A8] text-lg leading-none flex-shrink-0 -mt-0.5">×</button>
        </div>
        {!isIOS && (
          <button
            onClick={handleInstall}
            className="mt-3 w-full bg-[#6D28D9] text-white text-sm font-semibold py-2.5 rounded-xl active:opacity-80 transition-opacity"
          >
            Install App
          </button>
        )}
      </div>
    </div>
  )
}
