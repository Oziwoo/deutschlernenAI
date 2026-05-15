/**
 * Vercel Serverless Function: /api/check-sentence
 * Checks user's sentence and provides feedback.
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { word, sentence } = req.body || req.query
  if (!word || !sentence) return res.status(400).json({ error: 'Missing word or sentence' })

  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'GOOGLE_API_KEY not set' })

  const prompt = `Ты — преподаватель немецкого языка. Твой ученик должен был составить предложение со словом "${word}".
Он написал следующее: "${sentence}"

Твоя задача:
1. Проверить предложение на грамматические и лексические ошибки.
2. Проверить, использовано ли заданное слово корректно.
3. Оценить предложение (correct - полностью верно, minor_errors - есть небольшие ошибки, incorrect - неверно или не имеет смысла).
4. Дать краткий совет или исправление на русском языке.

Ответь строго в формате JSON, без маркдауна и других слов:
{
  "status": "correct" | "minor_errors" | "incorrect",
  "feedback": "Твой комментарий, исправление и совет на русском языке (до 3-4 предложений)."
}`

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`

    const response = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json"
        }
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Gemini error:', data)
      return res.status(500).json({ error: 'Gemini check failed' })
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
