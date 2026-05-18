/**
 * Vercel Serverless Function: /api/parse-word
 * Takes a word and returns structured data using Gemini
 */

const LANG_NAMES = { en: 'English', pl: 'Polish' }

const CATEGORIES_EN = `art (Articles / Pronouns)
con (Conjunctions / Prepositions / Particles)
vb1 (Core Verbs)
vb2 (Extended Verbs)
ppl (People / Family)
plc (Places / Buildings)
tim (Time)
obj (Objects / Things)
abs (Abstract Concepts)
bod (Body / Health)
fod (Food / Drinks)
nat (Nature / Environment)
tec (Technology / Media)
adj (Adjectives)
adv (Adverbs / Numbers)`

const CATEGORIES_PL = `art (Rodzajniki / Zaimki)
con (Spójniki / Przyimki / Partykuły)
vb1 (Podstawowe czasowniki)
vb2 (Dodatkowe czasowniki)
ppl (Ludzie / Rodzina)
plc (Miejsca / Budynki)
tim (Czas)
obj (Przedmioty / Rzeczy)
abs (Pojęcia abstrakcyjne)
bod (Ciało / Zdrowie)
fod (Jedzenie / Napoje)
nat (Natura / Środowisko)
tec (Technologia / Media)
adj (Przymiotniki)
adv (Przysłówki / Liczby)`

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { word, lang = 'en' } = req.query
  if (!word) return res.status(400).json({ error: 'Missing word' })

  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'GOOGLE_API_KEY not set' })

  const langName = LANG_NAMES[lang] || 'English'
  const categoryList = lang === 'pl' ? CATEGORIES_PL : CATEGORIES_EN

  const prompt = `You are a German language expert. The user wants to add the word "${word}" to their dictionary.
Determine its base form, article (if it's a noun), the most appropriate category from the list below, and a brief ${langName} translation.

Possible categories (choose exactly one key):
${categoryList}

Reply strictly in JSON format, no markdown, no other text:
{
  "word": "Base form of the word (capitalize nouns)",
  "article": "der" | "die" | "das" | null,
  "category": "chosen category key",
  "translation": "brief ${langName} translation"
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
          responseMimeType: 'application/json'
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
