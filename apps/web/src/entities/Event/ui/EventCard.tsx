import { cva } from 'class-variance-authority';
import { Bookmark, MapPin, Star, Video } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/components';
import { Badge } from '@shared/components';
import { Button } from '@shared/components';
import { Card, CardContent } from '@shared/components';
import { cn } from '@shared/lib/utils';
import type { EventFormat } from '../model/event';
import type { EventAttendee } from '../model/responses';

type Attendee = EventAttendee;

export type EventCardProps = {
  title: string;
  imageUrl?: string;
  date: string;
  time: string;
  format: EventFormat;
  location?: string;
  organizer: string;
  rating: number;
  attendeeCount: number;
  attendees?: Attendee[];
  isBookmarked?: boolean;
  onBookmark?: () => void;
  /** Visual size variant */
  size?: 'default' | 'compact';
};

const FORMAT_LABELS: Record<EventFormat, string> = {
  online: 'Online',
  offline: 'Offline',
};

/* ── cva definitions ─────────────────────────────────────── */

const cardVariants = cva('overflow-hidden border-border/60 transition-shadow hover:shadow-md', {
  variants: {
    size: {
      default: 'w-full',
      compact: 'w-64 shrink-0',
    },
  },
  defaultVariants: { size: 'default' },
});

const coverVariants = cva('relative bg-muted', {
  variants: {
    size: {
      default: 'h-48',
      compact: 'h-36',
    },
  },
  defaultVariants: { size: 'default' },
});

const titleVariants = cva('font-semibold leading-snug tracking-tight text-foreground line-clamp-2', {
  variants: {
    size: {
      default: 'text-base',
      compact: 'text-sm',
    },
  },
  defaultVariants: { size: 'default' },
});

const metaTextVariants = cva('text-muted-foreground', {
  variants: {
    size: {
      default: 'text-sm',
      compact: 'text-xs',
    },
  },
  defaultVariants: { size: 'default' },
});

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
  isBookmarked = false,
  onBookmark,
  size = 'default',
}: EventCardProps) => {
  return (
    <Card className={cn(cardVariants({ size }))}>
      {/* Cover image */}
      <div className={cn(coverVariants({ size }))}>
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">No image</div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onBookmark?.();
          }}
          aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark event'}
          className="absolute right-2 top-2 h-8 w-8 rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60"
        >
          <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-white' : ''}`} />
        </Button>
      </div>

      <CardContent className="space-y-3 p-4">
        {/* Title */}
        <h3 className={cn(titleVariants({ size }))}>{title}</h3>

        {/* Date, time, format */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={cn(metaTextVariants({ size }))}>{date}</span>
          <span className="text-xs text-muted-foreground">{time} GMT</span>
          <span className="text-muted-foreground">·</span>
          <Badge variant="secondary" className="flex items-center gap-1 px-1.5 py-0.5 text-xs font-semibold">
            {format === 'online' ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
            {FORMAT_LABELS[format]}
          </Badge>
        </div>

        {/* Organizer */}
        <p className="truncate text-xs text-muted-foreground">from {organizer}</p>

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
              {attendeeCount.toLocaleString()} attendees
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
            <span className="text-sm font-semibold text-foreground">{rating.toFixed(1)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
