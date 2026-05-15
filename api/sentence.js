/**
 * Vercel Serverless Function: /api/sentence
 * Generates a German sentence using the provided word.
 */

// Strips ```json ... ``` markdown fences that Gemini sometimes adds
function parseJSON(text) {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
  return JSON.parse(cleaned)
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { word } = req.query
  if (!word) return res.status(400).json({ error: 'Missing word' })

  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'GOOGLE_API_KEY not set' })

  const prompt = `Ты — преподаватель немецкого. Составь ОДНО простое, естественное предложение на немецком языке (уровень A1-A2), которое включает слово "${word}". 
Предложение должно быть осмысленным, но не слишком длинным (до 8 слов).
Также дай его точный перевод на русский язык.

Ответь ТОЛЬКО в формате JSON, без маркдауна, без пояснений:
{"german": "Предложение на немецком.", "russian": "Перевод на русский."}`

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`

    const response = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7 }
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Gemini error:', JSON.stringify(data))
      return res.status(500).json({ error: 'Gemini generation failed', detail: data })
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      console.error('No text in Gemini response:', JSON.stringify(data))
      throw new Error('No text generated')
    }

    console.log('Gemini raw response:', text)
    const result = parseJSON(text)
    return res.status(200).json(result)

  } catch (err) {
    console.error('Handler error:', err.message)
    return res.status(500).json({ error: 'Internal server error', detail: err.message })
  }
}
