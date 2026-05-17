import { checkRateLimit } from './_rateLimit.js'

function parseJSON(text) {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
  return JSON.parse(cleaned)
}

const cache = new Map()

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (!checkRateLimit(req, res, 15)) return

  const { id, word } = req.query
  if (!word || !id) return res.status(400).json({ error: 'Missing params' })

  const wordId = parseInt(id, 10)
  if (cache.has(wordId)) return res.status(200).json({ conjugation: cache.get(wordId) })

  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'GOOGLE_API_KEY not set' })

  const prompt = `You are a German teacher. Provide the full conjugation table for the German verb "${word}".

Reply ONLY in valid JSON format, no markdown:
{
  "praesens": {"ich":"","du":"","er":"","wir":"","ihr":"","sie":""},
  "perfekt": "ich habe/bin + Partizip II (full example)",
  "praeteritum": {"ich":"","er":""},
  "imperativ": {"du":"","ihr":"","Sie":""}
}`

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 400 },
      }),
    })

    const data = await response.json()
    if (!response.ok) return res.status(500).json({ error: 'Generation failed' })

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error('No text generated')

    const result = parseJSON(text)
    cache.set(wordId, result)
    return res.status(200).json({ conjugation: result })
  } catch (err) {
    console.error('Conjugate error:', err.message)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
