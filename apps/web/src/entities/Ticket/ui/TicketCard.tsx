import { cva } from 'class-variance-authority';
import { CalendarDays, Clock, MapPin, Video, QrCode } from 'lucide-react';
import { Badge } from '@shared/components';
import { useAppContext } from '@shared/lib';
import { cn } from '@shared/lib/utils';
import type { TicketStatus, TicketType } from '../model/ticket';

export type { TicketStatus, TicketType } from '../model/ticket';

export type TicketCardProps = {
  id: string;
  ticketType: TicketType;
  price: number;
  currency?: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  location: string;
  format: 'online' | 'offline';
  seat?: string;
  status: TicketStatus;
  onSelect?: () => void;
};

/* ── cva definitions ─────────────────────────────────────── */

const panelVariants = cva('flex w-28 shrink-0 flex-col items-center justify-center gap-1.5 p-4', {
  variants: {
    ticketType: {
      free: 'bg-emerald-500/15',
      standard: 'bg-primary/15',
      vip: 'bg-amber-500/15',
    },
  },
  defaultVariants: { ticketType: 'standard' },
});

const panelTextVariants = cva('text-xs font-bold uppercase tracking-widest', {
  variants: {
    ticketType: {
      free: 'text-emerald-400',
      standard: 'text-primary',
      vip: 'text-amber-400',
    },
  },
  defaultVariants: { ticketType: 'standard' },
});

const panelPriceVariants = cva('text-2xl font-black leading-none', {
  variants: {
    ticketType: {
      free: 'text-emerald-400',
      standard: 'text-primary',
      vip: 'text-amber-400',
    },
  },
  defaultVariants: { ticketType: 'standard' },
});



/* ──────────────────────────────────────────────────────────── */

export const TicketCard = ({
  ticketType,
  price,
  currency = '$',
  eventTitle,
  eventDate,
  eventTime,
  location,
  format,
  seat,
  status,
  onSelect,
}: TicketCardProps) => {
  const { t } = useAppContext();
  const TYPE_LABELS: Record<TicketType, string> = {
    free: t.common.free,
    standard: t.common.standard,
    vip: t.common.vip,
  };
  const STATUS_BADGE: Record<TicketStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
    available: { label: t.entityCard.available, variant: 'secondary' },
    limited: { label: t.entityCard.limited, variant: 'default' },
    'sold-out': { label: t.entityCard.soldOut, variant: 'destructive' },
  };
  const statusBadge = STATUS_BADGE[status];
  const isSoldOut = status === 'sold-out';

  return (
    <div
      className={cn(
        'relative flex w-full overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition-shadow',
        isSoldOut ? 'opacity-60' : 'hover:shadow-md',
      )}
    >
      {/* Left panel — price + type */}
      <div className={cn(panelVariants({ ticketType }))}>
        <span className={cn(panelTextVariants({ ticketType }))}>{TYPE_LABELS[ticketType]}</span>
        <span className={cn(panelPriceVariants({ ticketType }))}>{price === 0 ? t.common.free : `${currency}${price}`}</span>
        {seat && (
          <span className="mt-1 rounded bg-black/10 px-1.5 py-0.5 text-[10px] font-semibold text-foreground/60">
            {t.entityCard.seat} {seat}
          </span>
        )}
      </div>

      {/* Perforated divider */}
      <div className="relative w-0 shrink-0">
        <div className="absolute -top-3 left-1/2 h-6 w-6 -translate-x-1/2 rounded-full border border-border/60 bg-background" />
        <div className="absolute inset-0 border-l border-dashed border-border/60" />
        <div className="absolute -bottom-3 left-1/2 h-6 w-6 -translate-x-1/2 rounded-full border border-border/60 bg-background" />
      </div>

      {/* Right panel — event info */}
      <div className="flex flex-1 flex-col justify-between gap-3 p-4 pl-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">{eventTitle}</h3>
          <Badge variant={statusBadge.variant} className="shrink-0 text-[10px]">
            {statusBadge.label}
          </Badge>
        </div>

        <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            {eventDate}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            {eventTime} {t.common.gmt}
          </span>
          <span className="flex items-center gap-1.5">
            {format === 'online' ? (
              <Video className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <MapPin className="h-3.5 w-3.5 shrink-0" />
            )}
            {location}
          </span>
        </div>

        {!isSoldOut && onSelect && (
          <button
            type="button"
            onClick={onSelect}
            className="mt-1 w-full rounded-lg bg-primary py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            {t.entityCard.getTicket}
          </button>
        )}
      </div>

      {/* QR code stub — decorative */}
      <div className="flex items-center pr-4">
        <QrCode className="h-10 w-10 text-border" />
      </div>
    </div>
  );
};
