'use client'

import { createContext, useCallback, useContext, useRef, useState } from 'react'

type ToastType = 'success' | 'error' | 'info'
type Toast = { id: number; message: string; type: ToastType }

const ToastCtx = createContext<(msg: string, type?: ToastType) => void>(() => {})

export function useToast() {
  return useContext(ToastCtx)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counter = useRef(0)

  const show = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++counter.current
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }, [])

  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-max max-w-[calc(100vw-2rem)] pointer-events-none lg:bottom-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{ animation: 'toast-in 0.2s ease' }}
            className={`px-4 py-3 rounded-xl text-sm font-medium shadow-xl pointer-events-auto ${
              t.type === 'success' ? 'bg-[#16A34A] text-white' :
              t.type === 'error' ? 'bg-[#DC2626] text-white' :
              'bg-[#1A1B3A] border border-[#3C3A58] text-[#EDEAF8]'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
