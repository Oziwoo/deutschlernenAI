import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { calculateNext, getStats } from '../lib/srs'

export function useProgress(sessionId) {
  const [progressMap, setProgressMap] = useState({})   // wordId → record
  const [loading, setLoading]         = useState(true)

  // Load all progress for this session
  useEffect(() => {
    if (!sessionId) return

    async function load() {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('progress')
          .select('*')
          .eq('session_id', sessionId)

        if (error) throw error

        const map = {}
        ;(data || []).forEach(p => { map[p.word_id] = p })
        setProgressMap(map)
      } catch (err) {
        console.error('Progress load error:', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [sessionId])

  // Update progress after a rating
  const updateProgress = useCallback(async (wordId, rating) => {
    if (!sessionId) return

    const current = progressMap[wordId] || { interval: 1, ease: 2.5, review_count: 0 }
    const next    = calculateNext(current, rating)

    const upsertData = {
      session_id:   sessionId,
      word_id:      wordId,
      status:       next.status,
      interval:     next.interval,
      ease:         next.ease,
      review_count: next.review_count,
      next_review:  next.next_review,
      last_rating:  rating,
      updated_at:   new Date().toISOString(),
    }

    try {
      const { data, error } = await supabase
        .from('progress')
        .upsert(upsertData, { onConflict: 'session_id,word_id' })
        .select()
        .single()

      if (error) throw error

      setProgressMap(prev => ({ ...prev, [wordId]: data }))
    } catch (err) {
      console.error('Progress update error:', err)
      // Optimistic local update even if DB fails
      setProgressMap(prev => ({ ...prev, [wordId]: { ...upsertData, id: `local-${wordId}` } }))
    }
  }, [sessionId, progressMap])

  const stats = getStats(progressMap)

  return { progressMap, updateProgress, loading, stats }
}
