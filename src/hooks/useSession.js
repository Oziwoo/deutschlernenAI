import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const DEVICE_KEY = 'dl_device_id'

function getOrCreateDeviceId() {
  let id = localStorage.getItem(DEVICE_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(DEVICE_KEY, id)
  }
  return id
}

export function useSession() {
  const [sessionId, setSessionId] = useState(null)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    async function init() {
      try {
        const deviceId = getOrCreateDeviceId()

        // Try to get existing session
        const { data: existing } = await supabase
          .from('sessions')
          .select('id')
          .eq('device_id', deviceId)
          .maybeSingle()

        if (existing) {
          setSessionId(existing.id)
          // Update last_seen
          await supabase.from('sessions').update({ last_seen: new Date().toISOString() }).eq('id', existing.id)
        } else {
          // Create new session
          const { data: created, error } = await supabase
            .from('sessions')
            .insert({ device_id: deviceId })
            .select('id')
            .single()

          if (error) throw error
          setSessionId(created.id)
        }
      } catch (err) {
        console.error('Session error:', err)
        // Fallback: use device_id as session identifier
        setSessionId(getOrCreateDeviceId())
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  return { sessionId, loading }
}
