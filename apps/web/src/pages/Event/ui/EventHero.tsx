import type { EventModel } from '@entities/Event'
import { Badge } from '@shared/components'
import { useAppContext } from '@shared/lib'
import { Images, MapPin, Video } from 'lucide-react'

interface Props {
  event: EventModel
  hasGallery: boolean
  onOpenGallery: (index: number) => void
}

export function EventHero({ event, hasGallery, onOpenGallery }: Props) {
  const { t } = useAppContext()
  return (
    <button
      type="button"
      className={`relative mb-8 h-64 w-full overflow-hidden rounded-2xl bg-muted text-left sm:h-80 ${
        hasGallery ? 'cursor-pointer' : 'cursor-default'
      }`}
      onClick={hasGallery ? () => onOpenGallery(0) : undefined}
      disabled={!hasGallery}
      aria-label={hasGallery ? t.events.openGallery : undefined}
    >
      {event.imageUrl ? (
        <img
          src={event.imageUrl}
          alt={event.title}
          className={`h-full w-full object-cover transition-opacity ${hasGallery ? 'hover:opacity-90' : ''}`}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">{t.common.noImage}</div>
      )}
      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
      <div className="absolute bottom-4 left-4">
        <Badge variant="secondary" className="flex items-center gap-1.5 backdrop-blur-sm">
          {event.format === 'online' ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
          {event.format === 'online' ? t.common.online : t.common.offline}
        </Badge>
      </div>
      {hasGallery && (
        <div className="absolute bottom-4 right-4">
          <Badge variant="secondary" className="flex items-center gap-1.5 backdrop-blur-sm">
            <Images className="h-3 w-3" />
            {event.gallery?.length ?? 0} {t.events.photos}
          </Badge>
        </div>
      )}
    </button>
  )
}
