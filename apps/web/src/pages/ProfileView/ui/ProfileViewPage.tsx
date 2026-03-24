import type { ChangeEvent } from 'react';
import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { CalendarDays, Camera, Edit, Globe, Lock, MapPin, Shield, ShieldCheck, Ticket, Users } from 'lucide-react';
import { EventCard, useEvents } from '@entities/Event';
import { useMe } from '@entities/User';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Field,
  FieldDescription,
  FieldTitle,
  Separator,
  Switch,
  buttonVariants,
} from '@shared/components';
import { cn } from '@shared/lib/utils';

export function ProfileViewPage() {
  const { data: user, isLoading, isError } = useMe();
  const { data: myEvents = [] } = useEvents({ page: 1, limit: 4 });

  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // TODO: upload avatar file
      console.log('Avatar file selected:', file.name);
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading profile...</p>
      </main>
    );
  }

  if (!user || isError) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-5xl">👤</p>
        <h1 className="text-xl font-semibold">Profile unavailable</h1>
        <Link to="/" className="text-sm text-primary hover:underline">
          ← Back to home
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        {/* Avatar with upload overlay */}
        <div className="relative shrink-0">
          <Avatar className="h-28 w-28 border-4 border-background ring-2 ring-primary/20">
            <AvatarImage src={user.avatarUrl} alt={user.name} />
            <AvatarFallback className="text-3xl">{user.name[0]}</AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-opacity hover:opacity-90"
            title="Change photo"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
            <h1 className="text-2xl font-extrabold tracking-tight">{user.name}</h1>
            <Link
              to="/profile/edit"
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
            >
              <Edit className="h-3.5 w-3.5" />
              Edit profile
            </Link>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">@{user.username}</p>
          {user.bio && (
            <p className="mt-2 max-w-md text-sm text-muted-foreground">{user.bio}</p>
          )}

          <div className="mt-3 flex flex-wrap justify-center gap-3 text-xs text-muted-foreground sm:justify-start">
            {user.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {user.location}
              </span>
            )}
            {user.website && (
              <a
                href={user.website}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <Globe className="h-3.5 w-3.5" />
                {user.website.replace(/^https?:\/\//, '')}
              </a>
            )}
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              Joined {user.joinedAt}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Events attended', value: user.eventsAttended, icon: CalendarDays },
          { label: 'Tickets', value: user.ticketsCount, icon: Ticket },
          { label: 'Followers', value: user.followers, icon: Users },
          { label: 'Following', value: user.following, icon: Users },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-1 rounded-xl border border-border/60 bg-card py-4"
          >
            <Icon className="mb-1 h-4 w-4 text-muted-foreground" />
            <span className="text-2xl font-extrabold text-primary">{value.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* Interests */}
      <section className="mb-8">
        <h2 className="mb-3 text-base font-semibold">Interests</h2>
        <div className="flex flex-wrap gap-2">
          {user.interests.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      </section>

      <Separator className="mb-8" />

      {/* Security & Account settings */}
      <section className="mb-8">
        <h2 className="mb-1 text-base font-semibold">Security &amp; Account</h2>
        <p className="mb-5 text-xs text-muted-foreground">
          Manage your account security settings.
        </p>

        <div className="space-y-3 rounded-xl border border-border/60 bg-card p-5">
          {/* 2FA */}
          <Field orientation="horizontal" className="items-center justify-between py-1">
            <div>
              <FieldTitle className="gap-1.5">
                {twoFaEnabled ? (
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                ) : (
                  <Shield className="h-4 w-4 text-muted-foreground" />
                )}
                Two-factor authentication
              </FieldTitle>
              <FieldDescription className="mt-0.5">
                {twoFaEnabled
                  ? 'Your account is protected by 2FA.'
                  : 'Add an extra layer of security to your account.'}
              </FieldDescription>
            </div>
            <Switch
              checked={twoFaEnabled}
              onCheckedChange={setTwoFaEnabled}
              aria-label="Toggle 2FA"
            />
          </Field>

          <Separator />

          {/* Email notifications */}
          <Field orientation="horizontal" className="items-center justify-between py-1">
            <div>
              <FieldTitle>Email notifications</FieldTitle>
              <FieldDescription className="mt-0.5">
                Receive emails about your tickets and upcoming events.
              </FieldDescription>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
              aria-label="Toggle email notifications"
            />
          </Field>

          <Separator />

          {/* Change password */}
          <Field orientation="horizontal" className="items-center justify-between py-1">
            <div>
              <FieldTitle className="gap-1.5">
                <Lock className="h-4 w-4 text-muted-foreground" />
                Password
              </FieldTitle>
              <FieldDescription className="mt-0.5">
                Change your login password.
              </FieldDescription>
            </div>
            <Link
              to="/profile/edit#password"
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
            >
              Change password
            </Link>
          </Field>
        </div>
      </section>

      <Separator className="mb-8" />

      {/* My events */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">My events</h2>
          <Link to="/events" className="text-xs text-primary hover:underline">
            Browse more
          </Link>
        </div>
        <div className="flex flex-wrap gap-4">
          {myEvents.map((event) => (
            <Link key={event.id} to={`/events/${event.id}`} className="shrink-0">
              <EventCard {...event} size="compact" />
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
