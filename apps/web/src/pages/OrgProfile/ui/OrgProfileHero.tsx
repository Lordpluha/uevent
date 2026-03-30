import { Link } from 'react-router';
import {
  BadgeCheck,
  CalendarDays,
  ChevronLeft,
  Globe,
  MapPin,
} from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
} from '@shared/components';
import { ShareButton } from '@shared/components/ShareButton/ShareButton';
import { useAppContext } from '@shared/lib';
import { AuthModal } from '@features/AuthModal';

interface OrgProfileHeroProps {
  org: {
    id: string;
    title: string;
    avatarUrl?: string;
    coverUrl?: string;
    category: string;
    location?: string;
    website?: string;
    foundedAt: string;
    description?: string;
    verified?: boolean;
  };
  isOwner: boolean;
  isUserViewer: boolean;
  followStatus?: { followed: boolean };
  isFollowPending: boolean;
  onToggleFollow: () => void;
}

export function OrgProfileHero({
  org,
  isOwner,
  isUserViewer,
  followStatus,
  isFollowPending,
  onToggleFollow,
}: OrgProfileHeroProps) {
  const { t } = useAppContext();
  return (
    <>
      {/* ── Hero cover ────────────────────── */}
      <div className="relative h-52 w-full overflow-hidden bg-muted sm:h-64">
        {org.coverUrl ? (
          <img src={org.coverUrl} alt={org.title} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 via-primary/10 to-muted" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/10 to-transparent" />
        <Link
          to="/organizations"
          className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-black/30 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-black/50 sm:left-6"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {t.organizations.title}
        </Link>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-5xl -mt-12 px-4 sm:px-6">
        {/* ── Avatar + name row ──────────────────── */}
        <div className="flex items-end gap-4">
          <Avatar className="h-24 w-24 shrink-0 rounded-full shadow-lg">
            <AvatarImage src={org.avatarUrl} alt={org.title} />
            <AvatarFallback className="rounded-full text-2xl font-bold">
              {org.title[0]}
            </AvatarFallback>
          </Avatar>
          <div className="pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{org.title}</h1>
              {org.verified && <BadgeCheck className="h-6 w-6 shrink-0 text-primary" />}
              <ShareButton title={org.title} />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{org.category}</Badge>
              {org.location && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {org.location}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Meta links ───────────────────── */}
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
          {org.website && (
            <a
              href={org.website}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-primary hover:underline"
            >
              <Globe className="h-3.5 w-3.5" />
              {org.website.replace(/^https?:\/\//, '')}
            </a>
          )}
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            {t.organizations.founded.replace('{{date}}', org.foundedAt)}
          </span>
        </div>

        {/* ── Action buttons ───────────────── */}
        {isOwner && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to={`/events/create?organizationId=${org.id}`}>
              <Button size="sm">{t.common.createEvent}</Button>
            </Link>
            <Link to={`/profile/organization/${org.id}`}>
              <Button size="sm" variant="outline">{t.organizations.dashboard}</Button>
            </Link>
          </div>
        )}
        {!isOwner && (
          <div className="mt-4 flex flex-wrap gap-2">
            {isUserViewer ? (
              <Button
                size="sm"
                variant={followStatus?.followed ? 'outline' : 'default'}
                disabled={isFollowPending}
                onClick={onToggleFollow}
              >
                {followStatus?.followed ? t.organizations.unsubscribe : t.organizations.subscribe}
              </Button>
            ) : (
              <AuthModal
                defaultTab="login"
                variant="pill"
                triggerLabel={t.organizations.subscribe}
                triggerClassName="bg-primary text-primary-foreground hover:bg-primary/90"
              />
            )}
          </div>
        )}

        {/* ── Description ──────────────────── */}
        {org.description && (
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {org.description}
          </p>
        )}
      </div>
    </>
  );
}
