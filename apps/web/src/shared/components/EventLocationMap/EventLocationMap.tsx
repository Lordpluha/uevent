import { useAppContext } from '@shared/lib'
import { MapPin } from 'lucide-react'
import type { SVGProps } from 'react'

interface EventLocationMapProps {
  location: string
  eventTitle: string
}

export function EventLocationMap({ location, eventTitle }: EventLocationMapProps) {
  const { t } = useAppContext()

  if (!location || location === 'Online') {
    return (
      <div className="flex min-h-75 flex-col items-center justify-center rounded-xl border border-border/60 bg-card p-6 text-center">
        <VideoIcon title={t.events.details.onlineEvent} className="mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">{t.events.details.onlineEvent}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t.events.details.noPhysicalLocation}</p>
      </div>
    )
  }

  const googleMapsUrl = `https://maps.google.com/maps?q=${encodeURIComponent(location)}&t=m&z=15`
  // Using a simple approach with iFrame from OpenStreetMap
  const iframeUrl = `https://maps.google.com/maps?q=${encodeURIComponent(location)}&t=m&z=15&output=embed`

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
        <MapPin className="h-4 w-4" />
        {t.events.details.mapTitle}
      </h3>
      <div className="mb-3 text-sm text-muted-foreground">{location}</div>
      <div className="overflow-hidden rounded-lg border border-border/40">
        <iframe
          width="100%"
          height="300"
          title={t.eventLocationMap.mapFor.replace('{{title}}', eventTitle)}
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src={iframeUrl}
        />
      </div>
      <div className="mt-3">
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline"
        >
          {t.events.details.openGoogleMaps} →
        </a>
      </div>
    </div>
  )
}

function VideoIcon({ title, ...props }: SVGProps<SVGSVGElement> & { title: string }) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <title>{title}</title>
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  )
}
