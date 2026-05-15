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
  const [user, setUser]           = useState(null)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      
      // We will link session to user later when sessionId is available
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    async function init() {
      try {
        const deviceId = getOrCreateDeviceId()
        const { data: existing } = await supabase
          .from('sessions')
          .select('id, user_id')
          .eq('device_id', deviceId)
          .maybeSingle()

        let sid = null
        if (existing) {
          sid = existing.id
          const updates = { last_seen: new Date().toISOString() }
          if (user && !existing.user_id) updates.user_id = user.id
          await supabase.from('sessions').update(updates).eq('id', existing.id)
        } else {
          const payload = { device_id: deviceId }
          if (user) payload.user_id = user.id
          const { data: created, error } = await supabase
            .from('sessions')
            .insert(payload)
            .select('id')
            .single()

          if (error) throw error
          sid = created.id
        }
        
        setSessionId(sid)
        
        // If user is logged in but session wasn't linked previously, link it now
        if (user && sid && existing && !existing.user_id) {
           await supabase.from('sessions').update({ user_id: user.id }).eq('id', sid)
        }

      } catch (err) {
        console.error('Session error:', err)
        setSessionId(getOrCreateDeviceId())
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [user]) // Re-run if user changes so we link the device

  return { sessionId, user, loading }
}
