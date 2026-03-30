import { Link } from 'react-router';
import { MapPin } from 'lucide-react';
import type { User } from '../model/user';
import { Avatar, AvatarFallback, AvatarImage, Badge } from '@shared/components';
import { useAppContext } from '@shared/lib';
import { cn } from '@shared/lib/utils';

export type UserCardProps = Pick<
  User,
  'id' | 'name' | 'username' | 'avatarUrl' | 'bio' | 'location' | 'interests' | 'eventsAttended'
>;

export const UserCard = ({
  id,
  name,
  username,
  avatarUrl,
  bio,
  location,
  interests,
  eventsAttended,
}: UserCardProps) => {
  const { t } = useAppContext();
  return (
  <Link
    to={`/users/${id}`}
    className={cn(
      'flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-5',
      'transition-shadow hover:shadow-md',
    )}
  >
    <div className="flex items-center gap-3">
      <Avatar className="h-12 w-12">
        <AvatarImage src={avatarUrl} alt={name} />
        <AvatarFallback>{name[0]}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate font-semibold text-foreground">{name}</p>
        <p className="truncate text-xs text-muted-foreground">@{username}</p>
      </div>
    </div>

    {bio && <p className="line-clamp-2 text-sm text-muted-foreground">{bio}</p>}

    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      {location && (
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {location}
        </span>
      )}
      <span>{eventsAttended} {t.entityCard.eventsAttended}</span>
    </div>

    <div className="flex flex-wrap gap-1.5">
      {interests.slice(0, 3).map((tag) => (
        <Badge key={tag} variant="secondary" className="text-xs">
          {tag}
        </Badge>
      ))}
    </div>
  </Link>
  );
};
