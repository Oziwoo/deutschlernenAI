/**
 * Vercel Serverless Function: /api/check-sentence
 * Checks user's sentence and provides feedback.
 */

const LANG_NAMES = { en: 'English', pl: 'Polish' }

function parseJSON(text) {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
  return JSON.parse(cleaned)
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()

  let word, sentence, lang
  if (req.method === 'POST' && req.body) {
    word     = req.body.word
    sentence = req.body.sentence
    lang     = req.body.lang || 'en'
  } else {
    word     = req.query.word
    sentence = req.query.sentence
    lang     = req.query.lang || 'en'
  }

  if (!word || !sentence) return res.status(400).json({ error: 'Missing word or sentence' })

  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'GOOGLE_API_KEY not set' })

  const langName = LANG_NAMES[lang] || 'English'

  const prompt = `You are a German language teacher. Your student wrote this sentence using the word "${word}": "${sentence}"

Check grammar and word usage. Reply ONLY in JSON format, no markdown:
{"status": "correct" or "minor_errors" or "incorrect", "feedback": "Comment in ${langName} (2-3 sentences)."}`

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`

    const response = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 }
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Gemini error:', JSON.stringify(data))
      return res.status(500).json({ error: 'Gemini check failed' })
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error('No text generated')

    console.log('Gemini check response:', text)
    const result = parseJSON(text)
    return res.status(200).json(result)

  } catch (err) {
    console.error('Handler error:', err.message)
    return res.status(500).json({ error: 'Internal server error', detail: err.message })
  }
}
