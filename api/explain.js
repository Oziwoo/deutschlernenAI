/**
 * Vercel Serverless Function: /api/explain
 * Uses Google Gemini API (free tier available)
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const CATEGORIES_RU = {
  art: 'Артикли и местоимения',
  con: 'Союзы, предлоги, частицы',
  vb1: 'Основные глаголы',
  vb2: 'Дополнительные глаголы',
  ppl: 'Люди и семья',
  plc: 'Места и здания',
  tim: 'Время',
  obj: 'Предметы и вещи',
  abs: 'Абстрактные понятия',
  bod: 'Тело и здоровье',
  fod: 'Еда и напитки',
  nat: 'Природа и среда',
  tec: 'Технологии и медиа',
  adj: 'Прилагательные',
  adv: 'Наречия и числа',
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { id, word, article, category } = req.query
  if (!word || !id) return res.status(400).json({ error: 'Missing params' })

  const wordId = parseInt(id, 10)

  // 1. Check Supabase cache
  try {
    const { data: cached } = await supabase
      .from('word_explanations')
      .select('explanation')
      .eq('word_id', wordId)
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

  const articlePart = article ? `с артиклем "${article}"` : ''
  const catName     = CATEGORIES_RU[category] || category
  const isNoun      = !!article

  const prompt = `Ты — опытный преподаватель немецкого языка. Напиши объяснение для немецкого слова.

Слово: "${word}" ${articlePart}
Категория: ${catName}

Правила:
1. НЕ давай прямого перевода слова
2. Опиши через КОНТЕКСТЫ: в каких ситуациях встречается, кто произносит, жизненные сценарии
3. Приведи 3–4 типичных выражения с этим словом (на немецком), дай краткий русский комментарий к смыслу каждого — но не переводи само слово
4. ${isNoun ? 'Укажи множественное число и важные падежные формы' : 'Укажи основные грамматические формы (если глагол — Präsens и Perfekt)'}
5. Если слово многозначное — упомяни через описание разных контекстов
6. Регистр: разговорный или формальный?
7. Объём: 180–230 слов. Пиши на русском, без заголовков, связным текстом.`

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

    const explanation = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Объяснение недоступно.'

    // 3. Save to Supabase cache
    supabase
      .from('word_explanations')
      .upsert({ word_id: wordId, explanation }, { onConflict: 'word_id' })
      .then(({ error }) => { if (error) console.error('Cache write error:', error) })

    return res.status(200).json({ explanation, cached: false })

  } catch (err) {
    console.error('Handler error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}