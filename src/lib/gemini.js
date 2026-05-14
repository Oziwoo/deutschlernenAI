const CATEGORIES_RU = {
  art:'Артикли и местоимения', con:'Союзы, предлоги, частицы',
  vb1:'Основные глаголы',     vb2:'Дополнительные глаголы',
  ppl:'Люди и семья',         plc:'Места и здания',
  tim:'Время',                obj:'Предметы и вещи',
  abs:'Абстрактные понятия',  bod:'Тело и здоровье',
  fod:'Еда и напитки',        nat:'Природа и среда',
  tec:'Технологии и медиа',   adj:'Прилагательные',
  adv:'Наречия и числа',
}

const memoryCache = {}

export async function fetchExplanation(wordObj) {
  const { id, word, article, category } = wordObj

  if (memoryCache[id]) return memoryCache[id]

  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY
  if (!apiKey) return 'Ошибка: добавь VITE_GOOGLE_API_KEY в файл .env и перезапусти сервер'

  const articlePart = article ? `с артиклем "${article}"` : ''
  const catName     = CATEGORIES_RU[category] || category
  const isNoun      = !!article

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
        model:       'llama-3.3-70b-versatile',
        messages:    [{ role: 'user', content: prompt }],
        max_tokens:  600,
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