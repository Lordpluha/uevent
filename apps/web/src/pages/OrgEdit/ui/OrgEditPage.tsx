import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ChevronLeft, Save } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Button,
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  Separator,
  Textarea,
  Input,
  buttonVariants,
} from '@shared/components';
import { useOrg } from '@entities/Organization';
import { organizationsApi } from '@entities/Organization';
import { cn } from '@shared/lib/utils';
import { OrgEditBranding } from './OrgEditBranding';

export function OrgEditPage() {
  const { id } = useParams();
  const { data: org, isLoading } = useOrg(id ?? '');
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    website: '',
    category: '',
  });

  const saveOrgMutation = useMutation({
    mutationFn: () => {
      if (!id) throw new Error('Organization id is missing');
      return organizationsApi.update(id, {
        title: form.title.trim() || undefined,
        description: form.description.trim() || undefined,
        location: form.location.trim() || undefined,
        website: form.website.trim() || undefined,
        category: form.category.trim() || undefined,
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['organizations'] }),
        queryClient.invalidateQueries({ queryKey: ['events'] }),
      ]);
      toast.success('Organization updated');
    },
    onError: () => {
      toast.error('Failed to update organization');
    },
  });

  // hydrate form when org loads
  useEffect(() => {
    if (org) {
      setForm({
        title: org.title ?? '',
        description: org.description ?? '',
        location: org.location ?? '',
        website: org.website ?? '',
        category: org.category ?? '',
      });
    }
  }, [org]);

  if (isLoading) {
    return <main className="flex min-h-[60vh] items-center justify-center text-center">Загрузка...</main>;
  }
  if (!org) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-5xl">🏢</p>
        <h1 className="text-xl font-semibold">Organization not found</h1>
        <Link to="/" className="text-sm text-primary hover:underline">
          ← Back to home
        </Link>
      </main>
    );
  }

  const set =
    (field: keyof typeof form) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    saveOrgMutation.mutate();
  };

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <Link
        to={`/organizations/${id}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to organization
      </Link>

      <h1 className="mb-1 text-2xl font-extrabold tracking-tight">Edit organization</h1>
      <p className="mb-8 text-sm text-muted-foreground">{org.title}</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <OrgEditBranding
          orgId={id!}
          orgTitle={org.title}
          avatarUrl={org.avatarUrl}
          coverUrl={org.coverUrl}
        />

        <Separator />

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="title">Organization name</FieldLabel>
            <Input
              id="title"
              value={form.title}
              onChange={set('title')}
              placeholder="My Organization"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="description">Description</FieldLabel>
            <Textarea
              id="description"
              value={form.description}
              onChange={set('description')}
              placeholder="What is your organization about?"
              className="min-h-28"
            />
            <FieldDescription>Max 1000 characters.</FieldDescription>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="category">Category</FieldLabel>
              <Input
                id="category"
                value={form.category}
                onChange={set('category')}
                placeholder="Technology"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="location">Location</FieldLabel>
              <Input
                id="location"
                value={form.location}
                onChange={set('location')}
                placeholder="City, Country"
              />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="website">Website</FieldLabel>
            <Input
              id="website"
              value={form.website}
              onChange={set('website')}
              placeholder="https://your-org.com"
            />
            <FieldDescription>Public URL shown on your organization page.</FieldDescription>
          </Field>
        </FieldGroup>

        <Separator />

        <div className="flex justify-end gap-3">
          <Link to={`/organizations/${id}`} className={cn(buttonVariants({ variant: 'ghost' }))}>
            Cancel
          </Link>
          <Button type="submit" className="gap-1.5" disabled={saveOrgMutation.isPending || !id}>
            <Save className="h-3.5 w-3.5" />
            {saveOrgMutation.isPending ? 'Saving...' : 'Save changes'}
          </Button>
        </div>
      </form>
    </main>
  );
}
