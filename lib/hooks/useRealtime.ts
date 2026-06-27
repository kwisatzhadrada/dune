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
  const supabase = createClient()

  useEffect(() => {
    let channelConfig: any = {
      event,
      schema,
      table,
    }

    if (filter) {
      channelConfig.filter = filter
    }

    const channelName = `realtime-${table}-${schema}${filter ? `-${filter}` : ''}`
    channelRef.current = supabase
      .channel(channelName)
      .on('postgres_changes', channelConfig, (payload) => {
        onData(payload)
      })
      .subscribe()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, schema, event, filter])

  return channelRef.current
}
