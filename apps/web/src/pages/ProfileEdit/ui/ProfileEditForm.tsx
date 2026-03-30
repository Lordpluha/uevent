import type { ChangeEvent, FormEvent } from 'react';
import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Camera, Save } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
  buttonVariants,
} from '@shared/components';
import { cn } from '@shared/lib/utils';
import { usersApi } from '@entities/User';

interface Props {
  user: { name: string; username: string; bio?: string; location?: string; website?: string; avatarUrl?: string };
}

export function ProfileEditForm({ user }: Props) {
  const queryClient = useQueryClient();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '',
    username: '',
    bio: '',
    location: '',
    website: '',
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name,
        username: user.username,
        bio: user.bio ?? '',
        location: user.location ?? '',
        website: user.website ?? '',
      });
    }
  }, [user]);

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['me'] }),
      queryClient.invalidateQueries({ queryKey: ['users'] }),
    ]);
  };

  const uploadAvatarMutation = useMutation({
    mutationFn: (file: File) => usersApi.uploadAvatar(file),
    onSuccess: async () => { await invalidate(); toast.success('Profile photo updated'); },
    onError: () => toast.error('Failed to upload profile photo'),
  });

  const saveProfileMutation = useMutation({
    mutationFn: () => usersApi.updateMe({
      name: form.name.trim() || undefined,
      username: form.username.trim() || undefined,
      bio: form.bio.trim() || undefined,
      location: form.location.trim() || undefined,
      website: form.website.trim() || undefined,
    }),
    onSuccess: async () => { await invalidate(); toast.success('Profile updated'); },
    onError: () => toast.error('Failed to save profile'),
  });

  const set = (field: keyof typeof form) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadAvatarMutation.mutate(file);
    e.target.value = '';
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    saveProfileMutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user?.avatarUrl} alt={user?.name} />
            <AvatarFallback className="text-xl">{user?.name?.[0] ?? '?'}</AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow"
            title="Change photo"
          >
            <Camera className="h-3 w-3" />
          </button>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
        <div>
          <p className="text-sm font-medium">Profile photo</p>
          <p className="text-xs text-muted-foreground">JPG, PNG or GIF · max 2 MB</p>
        </div>
      </div>

      <Separator />

      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="name">Full name</FieldLabel>
            <Input id="name" value={form.name} onChange={set('name')} placeholder="Your name" />
          </Field>
          <Field>
            <FieldLabel htmlFor="username">Username</FieldLabel>
            <Input id="username" value={form.username} onChange={set('username')} placeholder="username" />
            <FieldDescription>Used in your public profile URL.</FieldDescription>
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="bio">Bio</FieldLabel>
          <Textarea id="bio" value={form.bio} onChange={set('bio')} placeholder="Tell something about yourself" className="min-h-24" />
          <FieldDescription>Max 300 characters.</FieldDescription>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="location">Location</FieldLabel>
            <Input id="location" value={form.location} onChange={set('location')} placeholder="City, Country" />
          </Field>
          <Field>
            <FieldLabel htmlFor="website">Website</FieldLabel>
            <Input id="website" value={form.website} onChange={set('website')} placeholder="https://your.site" />
          </Field>
        </div>
      </FieldGroup>

      <div className="flex justify-end gap-3">
        <Link to="/profile" className={cn(buttonVariants({ variant: 'ghost' }))}>Cancel</Link>
        <Button type="submit" className="gap-1.5" disabled={saveProfileMutation.isPending}>
          <Save className="h-3.5 w-3.5" />
          {saveProfileMutation.isPending ? 'Saving...' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}
