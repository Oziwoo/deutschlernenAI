export function recordStudy(count = 1) {
  const today = new Date().toISOString().slice(0, 10)
  try {
    const h = JSON.parse(localStorage.getItem('studyHistory') || '{}')
    h[today] = (h[today] || 0) + count
    localStorage.setItem('studyHistory', JSON.stringify(h))
  } catch {}
}

export function getWeekHistory() {
  let h = {}
  try { h = JSON.parse(localStorage.getItem('studyHistory') || '{}') } catch {}
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    const date = d.toISOString().slice(0, 10)
    days.push({ date, count: h[date] || 0 })
  }
  return days
}
