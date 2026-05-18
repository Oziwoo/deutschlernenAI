/**
 * Vercel Serverless Function: /api/explain
 * Uses Google Gemini API (free tier available)
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const LANG_NAMES = { en: 'English', pl: 'Polish' }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { id, word, article, category, lang = 'en' } = req.query
  if (!word || !id) return res.status(400).json({ error: 'Missing params' })

  const wordId = parseInt(id, 10)
  const langName = LANG_NAMES[lang] || 'English'

  // 1. Check Supabase cache (keyed by word_id + lang)
  try {
    const { data: cached } = await supabase
      .from('word_explanations')
      .select('explanation')
      .eq('word_id', wordId)
      .eq('lang', lang)
      .maybeSingle()

    if (cached?.explanation) {
      return res.status(200).json({ explanation: cached.explanation, cached: true })
    }
  } catch (err) {
    console.error('Cache read error:', err)
  }

  // 2. Generate with Google Gemini
  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'GOOGLE_API_KEY not set' })

  const articlePart = article ? `with article "${article}"` : ''
  const isNoun = !!article
  const isPreposition = category === 'con'

  const grammarNote = isNoun
    ? 'State the plural form and important case forms.'
    : isPreposition
      ? 'IMPORTANT: state which cases (Dativ, Akkusativ, Genitiv) this preposition/conjunction uses and how meaning changes.'
      : 'State the main grammatical forms (for verbs: Präsens and Perfekt).'

  const prompt = `You are an experienced German language teacher. Prepare an explanation for the German word.

Word: "${word}" ${articlePart}
Category: ${category}

Response structure:
1. Translation and meaning: Give a direct ${langName} translation. State the main meanings.
2. Grammar and context:
   - ${grammarNote}
   - Briefly explain in which situations this word is used.
3. Examples by level: Give 3 usage examples sorted by difficulty (A1, A2, B1). Start with the simplest. For each example give a full ${langName} translation.

Write in connected prose with headings. Length: about 180–230 words. Write in ${langName}.`

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`

    const response = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          maxOutputTokens: 600,
          temperature:     0.7,
        }
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Gemini error:', data)
      return res.status(500).json({ error: 'Gemini generation failed', detail: data })
    }

    const explanation = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Explanation unavailable.'

    // 3. Save to Supabase cache
    supabase
      .from('word_explanations')
      .upsert({ word_id: wordId, lang, explanation }, { onConflict: 'word_id,lang' })
      .then(({ error }) => { if (error) console.error('Cache write error:', error) })

    return res.status(200).json({ explanation, cached: false })

  } catch (err) {
    console.error('Handler error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
