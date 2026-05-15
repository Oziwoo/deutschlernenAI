/**
 * Vercel Serverless Function: /api/check-sentence
 * Checks user's sentence and provides feedback.
 */

function parseJSON(text) {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
  return JSON.parse(cleaned)
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()

  // Support both JSON body (POST) and query params (GET)
  let word, sentence
  if (req.method === 'POST' && req.body) {
    word = req.body.word
    sentence = req.body.sentence
  } else {
    word = req.query.word
    sentence = req.query.sentence
  }

  if (!word || !sentence) return res.status(400).json({ error: 'Missing word or sentence' })

  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'GOOGLE_API_KEY not set' })

  const prompt = `Ты — преподаватель немецкого языка. Твой ученик составил предложение со словом "${word}": "${sentence}"

Проверь грамматику и использование слова. Ответь ТОЛЬКО в формате JSON, без маркдауна:
{"status": "correct" или "minor_errors" или "incorrect", "feedback": "Комментарий на русском (2-3 предложения)."}`

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
