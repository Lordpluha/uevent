import type { ChangeEvent, FormEvent } from 'react';
import { useRef, useState } from 'react';
import { Camera, Globe, MapPin, Save } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  Input,
  Separator,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@shared/components';
import { usersApi } from '@entities/User';
import type { UserProfile } from './types';

interface ProfileSectionProps {
  user: UserProfile;
  invalidateUser: () => Promise<void>;
}

export function ProfileSection({ user, invalidateUser }: ProfileSectionProps) {
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState({
    name: user.name ?? '',
    username: user.username ?? '',
    bio: user.bio ?? '',
    location: user.location ?? '',
    website: user.website ?? '',
  });

  const profileMutation = useMutation({
    mutationFn: () =>
      usersApi.updateMe({
        name: profile.name.trim() || undefined,
        username: profile.username.trim() || undefined,
        bio: profile.bio.trim() || undefined,
        location: profile.location.trim() || undefined,
        website: profile.website.trim() || undefined,
      }),
    onSuccess: async () => { await invalidateUser(); toast.success('Profile updated'); },
    onError: () => toast.error('Failed to update profile'),
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: (file: File) => usersApi.uploadAvatar(file),
    onSuccess: async () => {
      await invalidateUser();
      toast.success('Profile photo updated');
    },
    onError: () => toast.error('Failed to upload profile photo'),
  });

  const setProfileField =
    (field: keyof typeof profile) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setProfile((prev) => ({ ...prev, [field]: e.target.value }));

  const handleProfileSubmit = (e: FormEvent) => {
    e.preventDefault();
    profileMutation.mutate();
  };

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadAvatarMutation.mutate(file);
    e.target.value = '';
  };

  const initials = (user.name ?? '?')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <form onSubmit={handleProfileSubmit} className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.avatarUrl} alt={user.name} />
            <AvatarFallback className="text-xl font-bold">{initials}</AvatarFallback>
          </Avatar>
          <Tooltip>
            <TooltipTrigger render={
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
                aria-label="Change avatar"
              />
            }>
              <Camera className="h-3.5 w-3.5" />
            </TooltipTrigger>
            <TooltipContent>Change photo</TooltipContent>
          </Tooltip>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            aria-label="Upload avatar"
            onChange={handleAvatarChange}
          />
        </div>
        <div>
          <p className="text-sm font-medium">Profile photo</p>
          <p className="text-xs text-muted-foreground">JPG, PNG or WebP · max 2 MB</p>
        </div>
      </div>

      <Separator />

      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="name">Full name</FieldLabel>
            <Input
              id="name"
              value={profile.name}
              onChange={setProfileField('name')}
              placeholder="Your name"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="username">Username</FieldLabel>
            <Input
              id="username"
              value={profile.username}
              onChange={setProfileField('username')}
              placeholder="username"
            />
            <FieldDescription>Shown in your public profile URL.</FieldDescription>
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="bio">Bio</FieldLabel>
          <Textarea
            id="bio"
            value={profile.bio}
            onChange={setProfileField('bio')}
            placeholder="Tell something about yourself…"
            className="min-h-24 resize-y"
            maxLength={300}
          />
          <FieldDescription>{profile.bio.length}/300 characters</FieldDescription>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="location">
              <MapPin className="inline h-3.5 w-3.5" /> Location
            </FieldLabel>
            <Input
              id="location"
              value={profile.location}
              onChange={setProfileField('location')}
              placeholder="City, Country"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="website">
              <Globe className="inline h-3.5 w-3.5" /> Website
            </FieldLabel>
            <Input
              id="website"
              value={profile.website}
              onChange={setProfileField('website')}
              placeholder="https://your.site"
            />
          </Field>
        </div>
      </FieldGroup>

      <div className="flex justify-end gap-3">
        <Button
          type="submit"
          className="gap-1.5"
          disabled={profileMutation.isPending}
        >
          <Save className="h-3.5 w-3.5" />
          {profileMutation.isPending ? 'Saving…' : 'Save profile'}
        </Button>
      </div>
    </form>
  );
}
