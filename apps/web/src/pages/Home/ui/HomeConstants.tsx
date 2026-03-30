import { Briefcase, Camera, Code2, Globe, Landmark, MonitorPlay, Music2, Search, Ticket, Users } from 'lucide-react';
import type { Dictionary } from '@shared/lib';
import { useCountUp } from '@shared/hooks/useCountUp';

export function getHomeCategories(t: Dictionary) {
  return [
    { label: t.home.categories.items.technology, icon: Code2, color: 'text-violet-400' },
    { label: t.home.categories.items.design, icon: MonitorPlay, color: 'text-blue-400' },
    { label: t.home.categories.items.music, icon: Music2, color: 'text-pink-400' },
    { label: t.home.categories.items.business, icon: Briefcase, color: 'text-amber-400' },
    { label: t.home.categories.items.photography, icon: Camera, color: 'text-red-400' },
    { label: t.home.categories.items.networking, icon: Users, color: 'text-green-400' },
    { label: t.home.categories.items.culture, icon: Landmark, color: 'text-orange-400' },
    { label: t.home.categories.items.online, icon: Globe, color: 'text-cyan-400' },
  ] as const;
}

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
