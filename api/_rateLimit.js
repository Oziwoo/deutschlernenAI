const requests = new Map()

export function checkRateLimit(req, res, max = 20, windowMs = 60_000) {
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
    || req.socket?.remoteAddress
    || 'unknown'

  const now = Date.now()
  const windowStart = now - windowMs
  const prev = (requests.get(ip) || []).filter(t => t > windowStart)

  if (prev.length >= max) {
    res.status(429).json({ error: 'Too many requests. Please wait a minute.' })
    return false
  }

  requests.set(ip, [...prev, now])
  return true
}
