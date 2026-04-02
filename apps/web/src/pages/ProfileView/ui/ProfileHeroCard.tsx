import { Link } from 'react-router';
import {
  CalendarDays,
  Clock,
  Globe,
  MapPin,
  Pencil,
  Settings,
} from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
} from '@shared/components';
import { ShareButton } from '@shared/components/ShareButton/ShareButton';
import { useAppContext } from '@shared/lib';
import { useProfileViewData } from './useProfileViewData';

export function ProfileHeroCard() {
  const { t } = useAppContext();
  const { user } = useProfileViewData();

  if (!user) {
    return null;
  }

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="relative mb-8 overflow-hidden rounded-2xl border border-border/60 bg-card">
      <div
        className="h-28 w-full bg-linear-to-br from-primary/30 via-primary/10 to-transparent"
        aria-hidden
      />
      <div className="px-6 pb-6">
        <div className="-mt-14 mb-4 flex items-end justify-between">
          <Avatar className="h-24 w-24 shrink-0 border-4 border-card ring-2 ring-primary/20 shadow-md">
            <AvatarImage src={user.avatarUrl} alt={user.name} />
            <AvatarFallback className="text-2xl font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-2 pb-1">
            <Link to="/profile/settings">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Pencil className="h-3.5 w-3.5" />
                {t.profile.editProfile}
              </Button>
            </Link>
            <Link to="/profile/settings">
              <Button variant="ghost" size="icon" className="h-8 w-8" title={t.profile.settings}>
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
            <ShareButton title={t.profile.shareTitle.replace('{{name}}', user.name)} />
          </div>
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight">{user.name}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">@{user.username}</p>
        {user.bio && <p className="mt-2 max-w-lg text-sm text-foreground/80">{user.bio}</p>}

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          {user.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {user.location}
            </span>
          )}
          {user.website && (
            <a
              href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <Globe className="h-3.5 w-3.5 shrink-0" />
              {user.website.replace(/^https?:\/\//, '')}
            </a>
          )}
          {user.timezone && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              {user.timezone}
            </span>
          )}
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            {t.profile.joined.replace('{{date}}', user.joinedAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
