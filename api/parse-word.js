/**
 * Vercel Serverless Function: /api/parse-word
 * Takes a word and returns structured data using Gemini
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { word } = req.query
  if (!word) return res.status(400).json({ error: 'Missing word' })

  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'GOOGLE_API_KEY not set' })

  const prompt = `Ты — эксперт по немецкому языку. Пользователь хочет добавить слово "${word}" в свой словарь.
Определи его базовую форму, артикль (если это существительное), самую подходящую категорию из списка ниже и краткий перевод на русский язык.

Возможные категории (выбери строго один ключ):
art (Артикли / Местоимения)
con (Союзы / Предлоги / Частицы)
vb1 (Основные глаголы)
vb2 (Дополнительные глаголы)
ppl (Люди / Семья)
plc (Места / Здания)
tim (Время)
obj (Предметы / Вещи)
abs (Абстрактные понятия)
bod (Тело / Здоровье)
fod (Еда / Напитки)
nat (Природа / Среда)
tec (Технологии / Медиа)
adj (Прилагательные)
adv (Наречия / Числа)

Ответь строго в формате JSON, без маркдауна, без других слов:
{
  "word": "Базовая форма слова (с заглавной буквы для существительных)",
  "article": "der" | "die" | "das" | null,
  "category": "выбранный ключ категории",
  "translation": "краткий перевод"
}`

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`

    const response = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
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
