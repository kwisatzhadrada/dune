'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*'

interface UseRealtimeOptions {
  table: string
  schema?: string
  event?: RealtimeEvent
  filter?: string
  onData: (payload: any) => void
}

export function useRealtime({ table, schema = 'public', event = '*', filter, onData }: UseRealtimeOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  // Keep onData in a ref so the subscription always calls the latest version
  // without needing to teardown/resubscribe on every render
  const onDataRef = useRef(onData)
  onDataRef.current = onData

  useEffect(() => {
    const supabase = createClient()
    const channelConfig: any = { event, schema, table }
    if (filter) channelConfig.filter = filter

    const channelName = `realtime-${table}-${schema}${filter ? `-${filter}` : ''}`
    channelRef.current = supabase
      .channel(channelName)
      .on('postgres_changes', channelConfig, (payload) => {
        onDataRef.current(payload)
      })
      .subscribe()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [table, schema, event, filter])

  return channelRef.current
}
