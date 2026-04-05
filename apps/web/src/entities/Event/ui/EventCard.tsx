import { Avatar, AvatarFallback, AvatarImage, Badge, Card, CardContent } from '@shared/components'
import { useAppContext } from '@shared/lib'
import { cn } from '@shared/lib/utils'
import { cva } from 'class-variance-authority'
import { MapPin, Star, Video } from 'lucide-react'
import type { EventFormat } from '../model/event'
import type { EventAttendee } from '../model/eventEntity'

type Attendee = EventAttendee

export type EventCardProps = {
  title: string
  imageUrl?: string
  date: string
  time: string
  format: EventFormat
  location?: string
  organizer: string
  rating: number
  attendeeCount: number
  attendees?: Attendee[]
  /** Visual size variant */
  size?: 'default' | 'compact'
}

/* ── cva definitions ─────────────────────────────────────── */

const cardVariants = cva('overflow-hidden border-border/60 transition-shadow hover:shadow-md', {
  variants: {
    size: {
      default: 'w-full',
      compact: 'w-64 shrink-0',
    },
  },
  defaultVariants: { size: 'default' },
})

const coverVariants = cva('relative bg-muted', {
  variants: {
    size: {
      default: 'h-48',
      compact: 'h-36',
    },
  },
  defaultVariants: { size: 'default' },
})

const titleVariants = cva('font-semibold leading-snug tracking-tight text-foreground line-clamp-2', {
  variants: {
    size: {
      default: 'text-base',
      compact: 'text-sm',
    },
  },
  defaultVariants: { size: 'default' },
})

const metaTextVariants = cva('text-muted-foreground', {
  variants: {
    size: {
      default: 'text-sm',
      compact: 'text-xs',
    },
  },
  defaultVariants: { size: 'default' },
})

/* ──────────────────────────────────────────────────────────── */

export const EventCard = ({
  title,
  imageUrl,
  date,
  time,
  format,
  location: _location,
  organizer,
  rating,
  attendeeCount,
  attendees = [],
  size = 'default',
}: EventCardProps) => {
  const { t } = useAppContext()
  return (
    <Card className={cn(cardVariants({ size }))}>
      {/* Cover image */}
      <div className={cn(coverVariants({ size }))}>
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
            {t.common.noImage}
          </div>
        )}
      </div>

      <CardContent className="space-y-3 p-4">
        {/* Title */}
        <h3 className={cn(titleVariants({ size }))}>{title}</h3>

        {/* Date, time, format */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={cn(metaTextVariants({ size }))}>{date}</span>
          <span className="text-xs text-muted-foreground">
            {time} {t.common.gmt}
          </span>
          <span className="text-muted-foreground">·</span>
          <Badge variant="secondary" className="flex items-center gap-1 px-1.5 py-0.5 text-xs font-semibold">
            {format === 'online' ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
            {format === 'online' ? t.common.online : t.common.offline}
          </Badge>
        </div>

        {/* Organizer */}
        <p className="truncate text-xs text-muted-foreground">
          {t.entityCard.from} {organizer}
        </p>

        {/* Attendees + rating */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {attendees.slice(0, 3).map((a) => (
              <Avatar key={a.id} className="-ml-1 h-6 w-6 border-2 border-background first:ml-0">
                <AvatarImage src={a.avatarUrl} alt={a.name} />
                <AvatarFallback className="text-[10px]">{a.name[0]}</AvatarFallback>
              </Avatar>
            ))}
            <span className="ml-2 text-sm font-semibold text-foreground">
              {attendeeCount.toLocaleString()} {t.entityCard.attendees}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
            <span className="text-sm font-semibold text-foreground">{rating.toFixed(1)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function EventCardSkeleton({ size = 'default' }: { size?: 'default' | 'compact' }) {
  return (
    <Card className={cn(cardVariants({ size }))}>
      <div className={cn(coverVariants({ size }), 'animate-pulse bg-border/30')} />
      <CardContent className="space-y-3 p-4">
        <div className="h-5 w-4/5 animate-pulse rounded bg-border/30" />
        <div className="h-4 w-3/5 animate-pulse rounded bg-border/25" />
        <div className="h-3 w-2/5 animate-pulse rounded bg-border/20" />

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1">
            <div className="h-6 w-6 animate-pulse rounded-full bg-border/30" />
            <div className="h-6 w-6 animate-pulse rounded-full bg-border/25" />
            <div className="h-6 w-6 animate-pulse rounded-full bg-border/20" />
            <div className="ml-2 h-4 w-20 animate-pulse rounded bg-border/25" />
          </div>
          <div className="h-4 w-10 animate-pulse rounded bg-border/25" />
        </div>
      </CardContent>
    </Card>
  )
}
