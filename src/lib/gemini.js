const LANG_NAMES = { en: 'English', pl: 'Polish' }

const memoryCache = {}

async function callGroq(prompt, temperature = 0.7) {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY
  if (!apiKey) throw new Error('VITE_GOOGLE_API_KEY not set')

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

export async function fetchExplanation(wordObj, lang = 'en') {
  const { id, word, article } = wordObj
  const cacheKey = `${id}_${lang}`

  if (memoryCache[cacheKey]) return memoryCache[cacheKey]

  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY
  if (!apiKey) return 'Error: add VITE_GOOGLE_API_KEY to .env and restart server'

  const articlePart = article ? `with article "${article}"` : ''
  const langName = LANG_NAMES[lang] || 'English'

  const prompt = `You are a German language teacher. For the word "${word}" ${articlePart}, give exactly 3 usage examples.

Format each example as:
🔹 German sentence — short ${langName} comment describing what is happening in that situation (do not translate the word "${word}" itself)

Only 3 examples, no additional text. Show different usage contexts.`

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
      return `Groq error: ${data?.error?.message || 'check API key'}`
    }

    const explanation = data.choices?.[0]?.message?.content || 'Explanation unavailable.'

    memoryCache[cacheKey] = explanation
    return explanation

  } catch (err) {
    console.error('fetchExplanation error:', err)
    return 'Could not load explanation. Check your internet connection.'
  }
}

/**
 * Generate a simple German sentence with the given word.
 * Returns { german, translation } or throws on error.
 */
export async function fetchSentence(word, lang = 'en') {
  const cacheKey = `sentence_${word}_${lang}`
  if (memoryCache[cacheKey]) return memoryCache[cacheKey]

  const langName = LANG_NAMES[lang] || 'English'

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
  const langName = LANG_NAMES[lang] || 'English'

  const prompt = `You are a German teacher. The student wrote this sentence using the word "${word}": "${sentence}"
Check grammar and word usage. Reply ONLY with valid JSON, no markdown:
{"status":"correct or minor_errors or incorrect","feedback":"Short comment in ${langName} (2-3 sentences)."}`

  const text = await callGroq(prompt, 0.2)

  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
  return JSON.parse(cleaned)
}
