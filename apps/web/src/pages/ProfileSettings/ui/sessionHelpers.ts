interface SessionLabels {
  unknown: string
  justNow: string
  minutesAgo: string
  hoursAgo: string
  daysAgo: string
}

export function parseUserAgent(ua: string | null, unknownLabel: string): { browser: string; os: string; isMobile: boolean } {
  if (!ua) return { browser: unknownLabel, os: unknownLabel, isMobile: false }
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua)
  let browser = unknownLabel
  if (ua.includes('Firefox')) browser = 'Firefox'
  else if (ua.includes('Edg/')) browser = 'Edge'
  else if (ua.includes('Chrome')) browser = 'Chrome'
  else if (ua.includes('Safari')) browser = 'Safari'
  let os = unknownLabel
  if (ua.includes('Windows')) os = 'Windows'
  else if (ua.includes('Mac OS')) os = 'macOS'
  else if (ua.includes('Linux')) os = 'Linux'
  else if (ua.includes('Android')) os = 'Android'
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'
  return { browser, os, isMobile }
}

export function formatSessionDate(dateStr: string, labels: SessionLabels): string {
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return labels.unknown
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return labels.justNow
  if (diffMin < 60) return labels.minutesAgo.replace('{{count}}', String(diffMin))
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return labels.hoursAgo.replace('{{count}}', String(diffHr))
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return labels.daysAgo.replace('{{count}}', String(diffDay))
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
