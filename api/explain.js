/**
 * Vercel Serverless Function: /api/explain
 * - Checks Supabase for cached explanation
 * - If missing: calls Anthropic API, stores result, returns it
 * - API key stays server-side, never exposed to client
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY   // service role for writes
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
  nat: 'Природа и окружающая среда',
  tec: 'Технологии и медиа',
  adj: 'Прилагательные',
  adv: 'Наречия и числа',
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const { id, word, article, category } = req.query

  if (!word || !id) {
    return res.status(400).json({ error: 'Missing word or id' })
  }

  const wordId = parseInt(id, 10)

  // 1. Check cache in Supabase
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
    console.error('Supabase read error:', err)
    // Continue to generate even if cache check fails
  }

  // 2. Generate with Anthropic
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set' })
  }

  const articlePart   = article ? `с артиклем "${article}"` : ''
  const catName       = CATEGORIES_RU[category] || category
  const isNoun        = !!article

  const prompt = `Ты — опытный преподаватель немецкого языка. Напиши объяснение для немецкого слова.

Слово: "${word}" ${articlePart}
Категория: ${catName}

Правила объяснения:
1. НЕ давай прямого перевода слова
2. Опиши через КОНТЕКСТЫ использования: в каких ситуациях встречается это слово, кто его произносит, в каких жизненных сценариях
3. Приведи 3–4 типичных выражения или устойчивых сочетания с этим словом (на немецком), дай краткий русский комментарий к смыслу каждого сочетания — но не переводи само слово
4. ${isNoun ? 'Обязательно укажи, в каком числе чаще встречается, есть ли важные формы множественного числа или падежей' : 'Укажи основные грамматические формы (если глагол — Präsens, Perfekt; если прилагательное — степени сравнения)'}
5. Если слово многозначное — кратко упомяни основные значения через описание разных контекстов
6. Регистр: разговорный или формальный? Нейтральный?
7. Объём: 180–230 слов
8. Пиши на русском языке, без заголовков, связным текстом`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 600,
        messages:   [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Anthropic error:', data)
      return res.status(500).json({ error: 'AI generation failed', detail: data })
    }

    const explanation = data.content?.[0]?.text || 'Объяснение недоступно.'

    // 3. Store in Supabase cache (non-blocking)
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
