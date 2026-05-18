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
export async function fetchSentence(word) {
  const cacheKey = `sentence_${word}`
  if (memoryCache[cacheKey]) return memoryCache[cacheKey]

  const prompt = `You are a German teacher. Create ONE simple German sentence (A1-A2 level, max 8 words) using the word "${word}". Also give its exact Russian translation.
Reply ONLY with valid JSON, no markdown, no explanation:
{"german":"German sentence here.","russian":"Russian translation here."}`

  const text = await callGroq(prompt, 0.7)

  // Strip markdown fences if present
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
  const result = JSON.parse(cleaned)

  memoryCache[cacheKey] = result
  return result
}

/**
 * Evaluate a voice answer: compare what the user said to the target German word.
 * Returns { status: 'correct'|'close'|'incorrect', feedback: string }
 */
export async function checkVoiceAnswer(targetWord, spokenWord) {
  const target = targetWord.toLowerCase().trim()
  const spoken = spokenWord.toLowerCase().trim()

  if (target === spoken) return { status: 'correct', feedback: 'Отлично! Слово произнесено правильно.' }

  const cacheKey = `voice_${target}_${spoken}`
  if (memoryCache[cacheKey]) return memoryCache[cacheKey]

  const prompt = `Ты — преподаватель немецкого языка. Ученик должен был произнести слово "${targetWord}". Распознаватель речи зафиксировал: "${spokenWord}".

Оцени ответ одним из статусов:
- correct — слово правильное (незначительная опечатка распознавания — всё равно correct)
- close — почти правильно (похожее слово, 1-2 буквы или форма слова другая)
- incorrect — совершенно другое слово

Дай 1 короткое предложение фидбека на русском языке.

ТОЛЬКО JSON без markdown: {"status":"correct|close|incorrect","feedback":"..."}`

  try {
    const text = await callGroq(prompt, 0.1)
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
    const result = JSON.parse(cleaned)
    memoryCache[cacheKey] = result
    return result
  } catch {
    return {
      status: 'incorrect',
      feedback: `Вы сказали «${spokenWord}», а нужно «${targetWord}». Попробуйте ещё раз!`,
    }
  }
}

/**
 * Check a user's German sentence with AI feedback.
 * Returns { status: 'correct'|'minor_errors'|'incorrect', feedback: string }
 */
export async function checkSentence(word, sentence) {
  const prompt = `You are a German teacher. The student wrote this sentence using the word "${word}": "${sentence}"
Check grammar and word usage. Reply ONLY with valid JSON, no markdown:
{"status":"correct or minor_errors or incorrect","feedback":"Short comment in Russian (2-3 sentences)."}`

  const text = await callGroq(prompt, 0.2)

  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
  return JSON.parse(cleaned)
}