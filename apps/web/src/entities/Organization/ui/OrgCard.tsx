import { Link } from 'react-router';
import { BadgeCheck, CalendarDays, Users } from 'lucide-react';
import type { Organization } from '../model/organization';
import { Avatar, AvatarFallback, AvatarImage, Badge } from '@shared/components';
import { cn } from '@shared/lib/utils';

export type OrgCardProps = Pick<
  Organization,
  'id' | 'title' | 'href' | 'avatarUrl' | 'description' | 'category' | 'membersCount' | 'eventsCount' | 'verified'
>;

export const OrgCard = ({
  id,
  title,
  href,
  avatarUrl,
  description,
  category,
  membersCount,
  eventsCount,
  verified,
}: OrgCardProps) => (
  <Link
    to={href ?? `/organizations/${id}`}
    className={cn(
      'flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-5',
      'transition-shadow hover:shadow-md',
    )}
  >
    <div className="flex items-center gap-3">
      <Avatar className="h-12 w-12 rounded-lg">
        <AvatarImage src={avatarUrl} alt={title} />
        <AvatarFallback className="rounded-lg">{title[0]}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate font-semibold text-foreground">{title}</p>
          {verified && <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />}
        </div>
        <Badge variant="secondary" className="mt-0.5 text-xs">
          {category}
        </Badge>
      </div>
    </div>

    {description && <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p>}

    <div className="flex items-center gap-4 text-xs text-muted-foreground">
      <span className="flex items-center gap-1">
        <Users className="h-3 w-3" />
        {membersCount.toLocaleString()} members
      </span>
      <span className="flex items-center gap-1">
        <CalendarDays className="h-3 w-3" />
        {eventsCount} events
      </span>
    </div>
  </Link>
);
