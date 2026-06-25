'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) { setError(error.message); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#08081C] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-full bg-[#6D28D9] flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
            </div>
            <span className="font-['Space_Grotesk'] font-bold text-xl">DreamLink</span>
          </div>
          <h1 className="font-['Space_Grotesk'] text-2xl font-bold mb-2">Reset your password</h1>
          <p className="text-[#8A88A8] text-sm">We&apos;ll send you a link to reset it.</p>
        </div>

        {sent ? (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl px-4 py-4 text-center text-sm">
            Check your email for a password reset link!
            <div className="mt-3">
              <Link href="/login" className="text-[#8B5CF6] hover:underline">Back to login</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="bg-[#0C0D22] border border-[#3C3A58]/50 rounded-2xl p-6 space-y-4">
            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-4 py-3 text-sm">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-[#8A88A8] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#121428] border border-[#3C3A58] focus:border-[#6D28D9] text-[#EDEAF8] rounded-xl px-4 py-3 outline-none"
                required
              />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-[#6D28D9] hover:bg-[#8B5CF6] disabled:opacity-50 text-white py-3 rounded-xl font-semibold">
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
            <div className="text-center text-sm text-[#8A88A8]">
              <Link href="/login" className="text-[#8B5CF6] hover:underline">Back to login</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
