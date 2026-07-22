import { useEffect } from 'react'
import { supabase } from '../lib/supabase/client'

export function useRealtimeRefetch(table: string, onChange: () => void) {
  useEffect(() => {
    const channel = supabase
      .channel(`realtime:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        onChange()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, onChange])
}
