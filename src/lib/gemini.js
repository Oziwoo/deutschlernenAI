const CATEGORIES_RU = {
  art: 'Артикли и местоимения', con: 'Союзы, предлоги, частицы',
  vb1: 'Основные глаголы', vb2: 'Дополнительные глаголы',
  ppl: 'Люди и семья', plc: 'Места и здания',
  tim: 'Время', obj: 'Предметы и вещи',
  abs: 'Абстрактные понятия', bod: 'Тело и здоровье',
  fod: 'Еда и напитки', nat: 'Природа и среда',
  tec: 'Технологии и медиа', adj: 'Прилагательные',
  adv: 'Наречия и числа',
}

const memoryCache = {}

async function callGroq(prompt, temperature = 0.7) {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY
  if (!apiKey) throw new Error('VITE_GOOGLE_API_KEY не задан')

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature,
    }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message || 'Groq error')
  return data.choices?.[0]?.message?.content || ''
}

export async function fetchExplanation(wordObj) {
  const { id, word, article, category } = wordObj

  if (memoryCache[id]) return memoryCache[id]

  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY
  if (!apiKey) return 'Ошибка: добавь VITE_GOOGLE_API_KEY в файл .env и перезапусти сервер'

  const articlePart = article ? `с артиклем "${article}"` : ''
  const catName = CATEGORIES_RU[category] || category
  const isNoun = !!article

  const prompt = `Ты — преподаватель немецкого языка. Для слова "${word}" ${articlePart} дай ровно 3 примера использования.

Формат каждого примера:
🔹 Немецкое предложение — краткий русский комментарий что происходит в этой ситуации (не переводи само слово "${word}")

Только 3 примера, никакого дополнительного текста. Примеры должны показывать разные контексты использования слова.`

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 600,
        temperature: 0.7,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('Groq error:', data)
      return `Ошибка Groq: ${data?.error?.message || 'проверь API ключ'}`
    }

    const explanation = data.choices?.[0]?.message?.content
      || 'Объяснение недоступно.'

    memoryCache[id] = explanation
    return explanation

  } catch (err) {
    console.error('fetchExplanation error:', err)
    return 'Не удалось загрузить объяснение. Проверь подключение к интернету.'
  }
}

/**
 * Generate a simple German sentence with the given word.
 * Returns { german, russian } or throws on error.
 */
export async function fetchSentence(word, lang = 'en') {
  const cacheKey = `sentence_${word}_${lang}`
  if (memoryCache[cacheKey]) return memoryCache[cacheKey]

  const langName = lang === 'pl' ? 'Polish' : 'English'
  const prompt = `You are a German teacher. Create ONE simple German sentence (A1-A2 level, max 8 words) using the word "${word}". Also give its exact ${langName} translation.
Reply ONLY with valid JSON, no markdown, no explanation:
{"german":"German sentence here.","translation":"${langName} translation here."}`

  const text = await callGroq(prompt, 0.7)

  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
  const result = JSON.parse(cleaned)

  memoryCache[cacheKey] = result
  return result
}

/**
 * Check a user's German sentence with AI feedback.
 * Returns { status: 'correct'|'minor_errors'|'incorrect', feedback: string }
 */
export async function checkSentence(word, sentence, lang = 'en') {
  const langName = lang === 'pl' ? 'Polish' : 'English'
  const prompt = `You are a German teacher. The student wrote this sentence using the word "${word}": "${sentence}"
Check grammar and word usage. Reply ONLY with valid JSON, no markdown:
{"status":"correct or minor_errors or incorrect","feedback":"Short comment in ${langName} (2-3 sentences)."}`

  const text = await callGroq(prompt, 0.2)

  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
  return JSON.parse(cleaned)
}

const conjCache = {}

export async function fetchConjugation(wordObj) {
  const { id } = wordObj
  if (conjCache[id]) return conjCache[id]

  try {
    const lsKey = `conj_${id}`
    const cached = localStorage.getItem(lsKey)
    if (cached) {
      conjCache[id] = JSON.parse(cached)
      return conjCache[id]
    }
  } catch {}

  const res = await fetch(`/api/conjugate?id=${wordObj.id}&word=${encodeURIComponent(wordObj.word)}`)
  if (!res.ok) throw new Error('Conjugation fetch failed')
  const { conjugation } = await res.json()

  conjCache[id] = conjugation
  try { localStorage.setItem(`conj_${id}`, JSON.stringify(conjugation)) } catch {}
  return conjugation
}