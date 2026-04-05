/* ── Types & helpers for EventCreate ───────────────────────── */

export interface EventCreateProps {
  onSuccess?: (eventId: string) => void
  defaultOrganizationId?: string
  lockOrganization?: boolean
}

export type LatLng = { lat: number; lng: number }

export const DEFAULT_CENTER: LatLng = { lat: 50.4501, lng: 30.5234 }

export function getInitialDateTime() {
  const now = new Date()
  now.setMinutes(0, 0, 0)
  now.setHours(now.getHours() + 1)
  const date = now.toISOString().slice(0, 10)
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  return { date, time }
}

export function buildGoogleMapsLink(lat: number, lng: number) {
  return `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`
}

export function parseCoordsFromMapsUrl(url: string): LatLng | null {
  if (!url) return null
  const byQuery = url.match(/[?&]q=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/i)
  if (byQuery) return { lat: Number(byQuery[1]), lng: Number(byQuery[2]) }
  const byAt = url.match(/@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/i)
  if (byAt) return { lat: Number(byAt[1]), lng: Number(byAt[2]) }
  return null
}
