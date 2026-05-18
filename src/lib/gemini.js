const LANG_NAMES = { en: 'English', pl: 'Polish' }

const memoryCache = {}

async function callGroq(prompt, temperature = 0.7, maxTokens = 300) {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY
  if (!apiKey) throw new Error('VITE_GOOGLE_API_KEY is not set')

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature,
    }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message || 'Groq error')
  return data.choices?.[0]?.message?.content || ''
}

/**
 * Fetch 3 contextual examples for a German word.
 * Output language follows `lang`.
 */
export async function fetchExplanation(wordObj, lang = 'en') {
  const { id, word, article, category } = wordObj
  const langName = LANG_NAMES[lang] || 'English'
  const cacheKey = `expl_${id}_${lang}`

  if (memoryCache[cacheKey]) return memoryCache[cacheKey]

  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY
  if (!apiKey) return lang === 'pl'
    ? 'Błąd: dodaj VITE_GOOGLE_API_KEY do pliku .env i zrestartuj serwer.'
    : 'Error: add VITE_GOOGLE_API_KEY to your .env file and restart the server.'

  const articlePart     = article ? `with article "${article}"` : ''
  const isNoun          = !!article
  const isPreposition   = category === 'con'
  const grammarNote     = isNoun
    ? 'State the plural form and key case forms.'
    : isPreposition
      ? 'State which cases (Dativ, Akkusativ, Genitiv) this word governs and how the meaning changes.'
      : 'State the key grammatical forms (for verbs: Präsens and Perfekt).'

  const prompt = `You are an experienced German language teacher.

Word: "${word}" ${articlePart}

Give exactly 3 usage examples sorted by difficulty (A1, A2, B1).
Format each example as:
🔹 German sentence — brief ${langName} comment about the situation (do NOT translate the word "${word}" directly)

Grammar note: ${grammarNote}
Add a short ${langName} grammar remark before the examples.

Only 3 examples and the grammar remark. No other text. Write entirely in ${langName}.`

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
      return lang === 'pl'
        ? `Błąd Groq: ${data?.error?.message || 'sprawdź klucz API'}`
        : `Groq error: ${data?.error?.message || 'check your API key'}`
    }

    const explanation = data.choices?.[0]?.message?.content
      || (lang === 'pl' ? 'Wyjaśnienie niedostępne.' : 'Explanation unavailable.')

    memoryCache[cacheKey] = explanation
    return explanation

  } catch (err) {
    console.error('fetchExplanation error:', err)
    return lang === 'pl'
      ? 'Nie udało się załadować wyjaśnienia. Sprawdź połączenie z internetem.'
      : 'Could not load explanation. Check your internet connection.'
  }
}

/**
 * Generate a simple German sentence with the given word.
 * Returns { german, translation } — translation is in the selected language.
 */
export async function fetchSentence(word, lang = 'en') {
  const langName = LANG_NAMES[lang] || 'English'
  const cacheKey = `sentence_${word}_${lang}`
  if (memoryCache[cacheKey]) return memoryCache[cacheKey]

  const prompt = `You are a German teacher. Create ONE simple German sentence (A1-A2 level, max 8 words) using the word "${word}". Also give its exact ${langName} translation.
Reply ONLY with valid JSON, no markdown, no explanation:
{"german":"German sentence here.","translation":"${langName} translation here."}`

  const text    = await callGroq(prompt, 0.7)
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
  const result  = JSON.parse(cleaned)

  memoryCache[cacheKey] = result
  return result
}

/**
 * Evaluate a voice answer: compare what the user said to the target German word.
 * Returns { status: 'correct'|'close'|'incorrect', feedback: string }
 * Feedback is in the selected language.
 */
export async function checkVoiceAnswer(targetWord, spokenWord, lang = 'en') {
  const langName = LANG_NAMES[lang] || 'English'
  const target   = targetWord.toLowerCase().trim()
  const spoken   = spokenWord.toLowerCase().trim()

  if (target === spoken) return {
    status:   'correct',
    feedback: lang === 'pl' ? 'Świetnie! Słowo wymówione poprawnie.' : 'Excellent! The word was spoken correctly.',
  }

  const cacheKey = `voice_${lang}_${target}_${spoken}`
  if (memoryCache[cacheKey]) return memoryCache[cacheKey]

  const prompt = `You are a German language teacher. The student was supposed to say the word "${targetWord}". The speech recogniser captured: "${spokenWord}".

Evaluate the answer with one of:
- correct — the word is correct (minor recognition artefact — still mark correct)
- close — almost correct (1-2 letters or a related word form)
- incorrect — a completely different word

Give 1 short feedback sentence in ${langName}.

ONLY JSON, no markdown: {"status":"correct|close|incorrect","feedback":"..."}`

  try {
    const text    = await callGroq(prompt, 0.1)
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
    const result  = JSON.parse(cleaned)
    memoryCache[cacheKey] = result
    return result
  } catch {
    return {
      status:   'incorrect',
      feedback: lang === 'pl'
        ? `Powiedziałeś «${spokenWord}», a powinno być «${targetWord}». Spróbuj ponownie!`
        : `You said «${spokenWord}», but it should be «${targetWord}». Try again!`,
    }
  }
}

/**
 * Check a user's German sentence with AI feedback.
 * Returns { status: 'correct'|'minor_errors'|'incorrect', feedback: string }
 * Feedback is in the selected language.
 */
export async function checkSentence(word, sentence, lang = 'en') {
  const langName = LANG_NAMES[lang] || 'English'
  const prompt   = `You are a German teacher. The student wrote this sentence using the word "${word}": "${sentence}"
Check grammar and word usage. Reply ONLY with valid JSON, no markdown:
{"status":"correct or minor_errors or incorrect","feedback":"Short comment in ${langName} (2-3 sentences)."}`

  const text    = await callGroq(prompt, 0.2)
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
  return JSON.parse(cleaned)
}
