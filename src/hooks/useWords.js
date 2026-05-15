import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { words as staticWords } from '../data/words'

export function useWords(sessionId, user) {
  const [words, setWords] = useState(staticWords)

  const fetchCustomWords = async () => {
    if (!sessionId && !user) return

    let query = supabase.from('custom_words').select('*')
    if (user) {
      query = query.eq('user_id', user.id)
    } else {
      query = query.eq('session_id', sessionId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching custom words:', error)
      return
    }

    if (data && data.length > 0) {
      // Custom words start at ID 10000. Give them rank 1000+
      const mappedCustom = data.map((cw, i) => ({
        id: cw.id,
        word: cw.word,
        article: cw.article,
        category: cw.category,
        translation: cw.translation,
        rank: 1001 + i,
        isCustom: true
      }))
      setWords([...staticWords, ...mappedCustom])
    } else {
      setWords(staticWords)
    }
  }

  useEffect(() => {
    fetchCustomWords()
  }, [sessionId, user])

  return { words, fetchCustomWords }
}
