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
import { useAppContext } from '@shared/lib';
import type { UserProfile } from './types';

interface ProfileSectionProps {
  user: UserProfile;
  invalidateUser: () => Promise<void>;
}

export function ProfileSection({ user, invalidateUser }: ProfileSectionProps) {
  const { t } = useAppContext();
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
    onSuccess: async () => { await invalidateUser(); toast.success(t.profileSettings.profileSection.profileUpdated); },
    onError: () => toast.error(t.profileSettings.profileSection.updateFailed),
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: (file: File) => usersApi.uploadAvatar(file),
    onSuccess: async () => {
      await invalidateUser();
      toast.success(t.profileSettings.profileSection.photoUpdated);
    },
    onError: () => toast.error(t.profileSettings.profileSection.photoFailed),
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
                aria-label={t.profileSettings.profileSection.changeAvatar}
              />
            }>
              <Camera className="h-3.5 w-3.5" />
            </TooltipTrigger>
            <TooltipContent>{t.profileSettings.profileSection.changePhoto}</TooltipContent>
          </Tooltip>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            aria-label={t.profileSettings.profileSection.uploadAvatar}
            onChange={handleAvatarChange}
          />
        </div>
        <div>
          <p className="text-sm font-medium">{t.profileSettings.profileSection.profilePhoto}</p>
          <p className="text-xs text-muted-foreground">{t.profileSettings.profileSection.photoHint}</p>
        </div>
      </div>

      <Separator />

      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="name">{t.profileSettings.profileSection.fullName}</FieldLabel>
            <Input
              id="name"
              value={profile.name}
              onChange={setProfileField('name')}
              placeholder={t.profileSettings.profileSection.fullNamePlaceholder}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="username">{t.profileSettings.profileSection.username}</FieldLabel>
            <Input
              id="username"
              value={profile.username}
              onChange={setProfileField('username')}
              placeholder={t.profileSettings.profileSection.usernamePlaceholder}
            />
            <FieldDescription>{t.profileSettings.profileSection.usernameHint}</FieldDescription>
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="bio">{t.profileSettings.profileSection.bio}</FieldLabel>
          <Textarea
            id="bio"
            value={profile.bio}
            onChange={setProfileField('bio')}
            placeholder={t.profileSettings.profileSection.bioPlaceholder}
            className="min-h-24 resize-y"
            maxLength={300}
          />
          <FieldDescription>{profile.bio.length}/300 {t.profileSettings.profileSection.characters}</FieldDescription>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="location">
              <MapPin className="inline h-3.5 w-3.5" /> {t.profileSettings.profileSection.location}
            </FieldLabel>
            <Input
              id="location"
              value={profile.location}
              onChange={setProfileField('location')}
              placeholder={t.profileSettings.profileSection.locationPlaceholder}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="website">
              <Globe className="inline h-3.5 w-3.5" /> {t.profileSettings.profileSection.website}
            </FieldLabel>
            <Input
              id="website"
              value={profile.website}
              onChange={setProfileField('website')}
              placeholder={t.profileSettings.profileSection.websitePlaceholder}
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
          {profileMutation.isPending ? t.common.saving : t.profileSettings.profileSection.saveProfile}
        </Button>
      </div>
    </form>
  );
}
