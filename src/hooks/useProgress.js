import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { calculateNext, getStats } from '../lib/srs'

const LS_KEY = 'dl_progress_v2'

function loadLocal() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') } catch { return {} }
}

function saveLocal(map) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(map)) } catch {}
}

export function useProgress(sessionId, user, words = []) {
  // Initialize immediately from localStorage — no async delay, always works
  const [progressMap, setProgressMap] = useState(loadLocal)
  const [loading, setLoading]         = useState(true)

  // Try to load from Supabase and merge (cloud is authoritative when available)
  useEffect(() => {
    if (!sessionId && !user) { setLoading(false); return }

    async function load() {
      try {
        let query = supabase.from('progress').select('*')
        if (user)      query = query.eq('user_id',    user.id)
        else if (sessionId) query = query.eq('session_id', sessionId)

        const { data, error } = await query
        if (error) throw error

        if (data && data.length > 0) {
          const map = {}
          data.forEach(p => { map[p.word_id] = p })
          setProgressMap(map)
          saveLocal(map)
        }
      } catch (err) {
        console.warn('Supabase load failed, using local cache:', err.message)
        // localStorage data already in state — nothing to do
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [sessionId, user])

  const updateProgress = useCallback(async (wordId, rating) => {
    const current = progressMap[wordId] || { interval: 1, ease: 2.5, review_count: 0 }
    const next    = calculateNext(current, rating)

    const record = {
      word_id:      wordId,
      status:       next.status,
      interval:     next.interval,
      ease:         next.ease,
      review_count: next.review_count,
      next_review:  next.next_review,
      last_rating:  rating,
      updated_at:   new Date().toISOString(),
    }

    // Always persist locally first — works even without Supabase
    const localRecord = { ...record, id: progressMap[wordId]?.id || `local-${wordId}` }
    const newMap = { ...progressMap, [wordId]: localRecord }
    setProgressMap(newMap)
    saveLocal(newMap)

    // Then attempt cloud sync
    if (!sessionId && !user) return

    const upsertData = { ...record }
    if (user)       upsertData.user_id    = user.id
    else            upsertData.session_id = sessionId

    const onConflict = user ? 'user_id,word_id' : 'session_id,word_id'

    try {
      const { data, error } = await supabase
        .from('progress')
        .upsert(upsertData, { onConflict })
        .select()
        .single()

      if (error) throw error

      const synced = { ...newMap, [wordId]: data }
      setProgressMap(synced)
      saveLocal(synced)
    } catch (err) {
      console.warn('Supabase sync failed, kept locally:', err.message)
    }
  }, [sessionId, user, progressMap])

  const stats = getStats(progressMap, words)

  return { progressMap, updateProgress, loading, stats }
}
