/**
 * Vercel Serverless Function: /api/sentence
 * Generates a German sentence using the provided word.
 */

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

Ответь строго в формате JSON, без маркдауна и других слов:
{
  "german": "Предложение на немецком.",
  "russian": "Перевод на русский."
}`

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`

    const response = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json"
        }
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Gemini error:', data)
      return res.status(500).json({ error: 'Gemini generation failed' })
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error('No text generated')

    const result = JSON.parse(text)
    return res.status(200).json(result)

  } catch (err) {
    console.error('Handler error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
