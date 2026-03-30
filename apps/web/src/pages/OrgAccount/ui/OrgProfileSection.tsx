import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button, Field, FieldLabel, Input, Textarea } from '@shared/components';
import { organizationsApi } from '@entities/Organization';
import type { OrgModel } from './types';

interface Props {
  org: OrgModel;
  invalidate: () => Promise<void>;
}

export function OrgProfileSection({ org, invalidate }: Props) {
  const [profileForm, setProfileForm] = useState({
    title: '',
    slogan: '',
    description: '',
    category: '',
    location: '',
    phone: '',
  });

  useEffect(() => {
    if (!org) return;
    setProfileForm({
      title: org.title ?? '',
      slogan: org.slogan ?? '',
      description: org.description ?? '',
      category: org.category ?? '',
      location: org.location ?? '',
      phone: org.phone ?? '',
    });
  }, [org]);

  const saveProfileMutation = useMutation({
    mutationFn: () => organizationsApi.updateMyProfile({
      title: profileForm.title,
      slogan: profileForm.slogan,
      description: profileForm.description,
      category: profileForm.category,
      location: profileForm.location,
      phone: profileForm.phone,
    }),
    onSuccess: async () => { await invalidate(); toast.success('Organization profile updated'); },
    onError: () => toast.error('Failed to update organization profile'),
  });

  return (
    <section className="mt-5 rounded-xl border border-border/60 bg-card p-5">
      <h2 className="text-base font-semibold">Organization profile</h2>
      <form
        className="mt-4 space-y-4"
        onSubmit={(e) => { e.preventDefault(); saveProfileMutation.mutate(); }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="org-name">Organization name</FieldLabel>
            <Input id="org-name" value={profileForm.title} onChange={(e) => setProfileForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Organization name" />
          </Field>
          <Field>
            <FieldLabel htmlFor="org-slogan">Slogan</FieldLabel>
            <Input id="org-slogan" value={profileForm.slogan} onChange={(e) => setProfileForm((prev) => ({ ...prev, slogan: e.target.value }))} placeholder="Short slogan" />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="org-description">Description</FieldLabel>
          <Textarea id="org-description" value={profileForm.description} onChange={(e) => setProfileForm((prev) => ({ ...prev, description: e.target.value }))} className="min-h-24" placeholder="Tell attendees about your organization" />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="org-category">Category</FieldLabel>
            <Input id="org-category" value={profileForm.category} onChange={(e) => setProfileForm((prev) => ({ ...prev, category: e.target.value }))} placeholder="Technology" />
          </Field>
          <Field>
            <FieldLabel htmlFor="org-location">City</FieldLabel>
            <Input id="org-location" value={profileForm.location} onChange={(e) => setProfileForm((prev) => ({ ...prev, location: e.target.value }))} placeholder="Kyiv" />
          </Field>
          <Field>
            <FieldLabel htmlFor="org-phone">Phone</FieldLabel>
            <Input id="org-phone" value={profileForm.phone} onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))} placeholder="+380..." />
          </Field>
        </div>

        <Button type="submit" disabled={saveProfileMutation.isPending}>
          {saveProfileMutation.isPending ? 'Saving...' : 'Save profile'}
        </Button>
      </form>
    </section>
  );
}
