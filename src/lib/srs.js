/**
 * Spaced Repetition System — SM-2 simplified
 * Ratings: 1 = "Не знаю", 2 = "Сложно", 3 = "Знаю", 4 = "Легко"
 */

export const RATING = { AGAIN: 1, HARD: 2, GOOD: 3, EASY: 4 }

export const STATUS = {
  NEW:      'new',
  LEARNING: 'learning',
  REVIEW:   'review',
  MASTERED: 'mastered',
}

/**
 * Calculate next review based on SM-2 algorithm
 * @param {object} card - current progress record
 * @param {number} rating - 1-4
 * @returns {object} - updated card fields
 */
export function calculateNext(card, rating) {
  let { interval = 1, ease = 2.5, review_count = 0 } = card

  review_count += 1

  if (rating === RATING.AGAIN) {
    interval = 1
    ease = Math.max(1.3, ease - 0.2)
    const status = STATUS.LEARNING
    return { interval, ease, review_count, status, next_review: addDays(interval) }
  }

  if (rating === RATING.HARD) {
    interval = Math.max(1, Math.round(interval * 1.2))
    ease = Math.max(1.3, ease - 0.15)
  } else if (rating === RATING.GOOD) {
    interval = review_count === 1 ? 1 : review_count === 2 ? 4 : Math.round(interval * ease)
    ease = ease + 0.0 // stable
  } else if (rating === RATING.EASY) {
    interval = review_count === 1 ? 4 : Math.round(interval * ease * 1.3)
    ease = ease + 0.15
  }

  interval = Math.min(interval, 365)

  const status = interval >= 21 ? STATUS.MASTERED : interval >= 4 ? STATUS.REVIEW : STATUS.LEARNING

  return { interval, ease, review_count, status, next_review: addDays(interval) }
}

function addDays(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

/**
 * Sort words for a study session:
 * 1. Overdue reviews first
 * 2. Learning cards
 * 3. New cards (up to dailyNewLimit)
 */
export function buildStudyQueue(words, progressMap, dailyNewLimit = 20) {
  const now = new Date()

  const overdue  = []
  const learning = []
  const newCards = []

  for (const word of words) {
    const p = progressMap[word.id]

    if (!p || p.status === STATUS.NEW) {
      newCards.push(word)
    } else if (p.status === STATUS.MASTERED) {
      // skip unless overdue
      if (p.next_review && new Date(p.next_review) <= now) {
        overdue.push(word)
      }
    } else if (p.next_review && new Date(p.next_review) <= now) {
      overdue.push(word)
    } else {
      learning.push(word)
    }
  }

  // Shuffle each group
  shuffle(overdue)
  shuffle(learning)
  shuffle(newCards)

  return [
    ...overdue,
    ...learning,
    ...newCards.slice(0, dailyNewLimit),
  ]
}

export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function getStats(progressMap, words = []) {
  const values = Object.values(progressMap)
  const totalWords = words.length > 0 ? words.length : 1000
  return {
    total:    totalWords,
    new:      totalWords - values.length,
    learning: values.filter(p => p.status === STATUS.LEARNING).length,
    review:   values.filter(p => p.status === STATUS.REVIEW).length,
    mastered: values.filter(p => p.status === STATUS.MASTERED).length,
    dueToday: values.filter(p =>
      p.next_review && new Date(p.next_review) <= new Date()
    ).length,
  }
}
