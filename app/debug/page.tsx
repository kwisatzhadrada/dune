'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { siteUrl } from '@/lib/siteUrl'

export default function DebugPage() {
  const [result, setResult] = useState<string>('')
  const [running, setRunning] = useState(false)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const siteUrlValue = process.env.NEXT_PUBLIC_SITE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const redirectTo = `${siteUrl()}/auth/callback`

  async function testSignup() {
    setRunning(true)
    setResult('Running...')
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email: `debug-test-${Date.now()}@example.com`,
      password: 'test1234',
      options: { emailRedirectTo: redirectTo },
    })
    const out = {
      error: error ? {
        name: error.name,
        message: error.message,
        status: error.status,
        stack: (error as any).stack,
        raw: JSON.parse(JSON.stringify(error)),
      } : null,
      data: data ? { user: data.user?.id, session: !!data.session } : null,
    }
    setResult(JSON.stringify(out, null, 2))
    setRunning(false)
  }

  return (
    <div style={{ fontFamily: 'monospace', padding: 32, background: '#08081C', color: '#EDEAF8', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: 24 }}>DreamLink Debug</h1>

      <table style={{ borderCollapse: 'collapse', marginBottom: 32, width: '100%' }}>
        <tbody>
          {[
            ['NEXT_PUBLIC_SUPABASE_URL', supabaseUrl],
            ['NEXT_PUBLIC_SITE_URL', siteUrlValue],
            ['NEXT_PUBLIC_SUPABASE_ANON_KEY', anonKey ? anonKey.slice(0, 20) + '…' : undefined],
            ['window.location.origin', typeof window !== 'undefined' ? window.location.origin : 'SSR'],
            ['siteUrl() result', siteUrl()],
            ['emailRedirectTo', redirectTo],
          ].map(([k, v]) => (
            <tr key={k} style={{ borderBottom: '1px solid #3C3A58' }}>
              <td style={{ padding: '8px 16px 8px 0', color: '#8A88A8', whiteSpace: 'nowrap' }}>{k}</td>
              <td style={{ padding: '8px 0', color: v ? '#22C55E' : '#EF4444', wordBreak: 'break-all' }}>
                {v ?? '(undefined — NOT SET)'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        onClick={testSignup}
        disabled={running}
        style={{ background: '#6D28D9', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 12, cursor: 'pointer', marginBottom: 16, fontSize: 14 }}
      >
        {running ? 'Testing...' : 'Test supabase.auth.signUp()'}
      </button>

      {result && (
        <pre style={{ background: '#0C0D22', border: '1px solid #3C3A58', borderRadius: 12, padding: 16, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: 13 }}>
          {result}
        </pre>
      )}
    </div>
  )
}
