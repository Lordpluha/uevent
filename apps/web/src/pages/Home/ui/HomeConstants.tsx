import { Briefcase, Camera, Code2, Globe, Landmark, MonitorPlay, Music2, Search, Ticket, Users } from 'lucide-react';
import { useCountUp } from '@shared/hooks/useCountUp';

export const CATEGORIES = [
  { label: 'Technology', icon: Code2, color: 'text-violet-400' },
  { label: 'Design', icon: MonitorPlay, color: 'text-blue-400' },
  { label: 'Music', icon: Music2, color: 'text-pink-400' },
  { label: 'Business', icon: Briefcase, color: 'text-amber-400' },
  { label: 'Photography', icon: Camera, color: 'text-red-400' },
  { label: 'Networking', icon: Users, color: 'text-green-400' },
  { label: 'Culture', icon: Landmark, color: 'text-orange-400' },
  { label: 'Online', icon: Globe, color: 'text-cyan-400' },
] as const;

export const HOW_ICONS = [Search, Users, Ticket] as const;

export function StatCounter({ value, label, suffix = '' }: { value: number; label: string; suffix?: string }) {
  const { value: displayed, ref } = useCountUp<HTMLSpanElement>(value, { duration: 1600 });
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <span
        ref={ref}
        className="tabular-nums text-4xl font-extrabold tracking-tight text-primary transition-all"
      >
        {displayed.toLocaleString()}{suffix}
      </span>
      <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
