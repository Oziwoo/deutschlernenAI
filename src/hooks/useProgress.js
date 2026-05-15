import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { calculateNext, getStats } from '../lib/srs'

export function useProgress(sessionId, user) {
  const [progressMap, setProgressMap] = useState({})   // wordId → record
  const [loading, setLoading]         = useState(true)

  // Load all progress for this session or user
  useEffect(() => {
    if (!sessionId && !user) return

    async function load() {
      setLoading(true)
      try {
        let query = supabase.from('progress').select('*')
        
        if (user) {
          query = query.eq('user_id', user.id)
        } else {
          query = query.eq('session_id', sessionId)
        }

        const { data, error } = await query

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
  }, [sessionId, user])

  // Update progress after a rating
  const updateProgress = useCallback(async (wordId, rating) => {
    if (!sessionId && !user) return

    const current = progressMap[wordId] || { interval: 1, ease: 2.5, review_count: 0 }
    const next    = calculateNext(current, rating)

    const upsertData = {
      word_id:      wordId,
      status:       next.status,
      interval:     next.interval,
      ease:         next.ease,
      review_count: next.review_count,
      next_review:  next.next_review,
      last_rating:  rating,
      updated_at:   new Date().toISOString(),
    }

    if (user) {
      upsertData.user_id = user.id
    } else {
      upsertData.session_id = sessionId
    }

    // Since we added unique(user_id, word_id) and unique(session_id, word_id),
    // upsert will work correctly based on the unique constraint that matches.
    const onConflict = user ? 'user_id,word_id' : 'session_id,word_id'

    try {
      const { data, error } = await supabase
        .from('progress')
        .upsert(upsertData, { onConflict })
        .select()
        .single()

      if (error) throw error

      setProgressMap(prev => ({ ...prev, [wordId]: data }))
    } catch (err) {
      console.error('Progress update error:', err)
      // Optimistic local update even if DB fails
      setProgressMap(prev => ({ ...prev, [wordId]: { ...upsertData, id: `local-${wordId}` } }))
    }
  }, [sessionId, user, progressMap])

  const stats = getStats(progressMap)

  return { progressMap, updateProgress, loading, stats }
}
