import type { ChangeEvent, FormEvent } from 'react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { Building2, ChevronLeft, Save } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Button,
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
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
import { useAppContext } from '@shared/lib';
import { OrgEditBranding } from './OrgEditBranding';
import type { Organization } from '@entities/Organization';

export function OrgEditPage() {
  const { t } = useAppContext();
  const { id } = useParams();
  const { data: org, isLoading } = useOrg(id ?? '');

  if (isLoading) {
    return <main className="flex min-h-[60vh] items-center justify-center text-center">{t.orgEdit.loading}</main>;
  }
  if (!org) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-4">
        <Empty className="max-w-md border border-border/60">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Building2 className="size-4" />
            </EmptyMedia>
            <EmptyTitle className="text-base">{t.orgEdit.notFound}</EmptyTitle>
          </EmptyHeader>
          <EmptyContent>
            <Link to="/" className="text-sm text-primary hover:underline">
              {t.common.backToHome}
            </Link>
          </EmptyContent>
        </Empty>
      </main>
    );
  }

  return (
    <OrgEditForm org={org} id={id} />
  );
}

function OrgEditForm({ org, id }: { org: Organization; id?: string }) {
  const { t } = useAppContext();
  const queryClient = useQueryClient();
  const orgId = id ?? org.id;
  const [form, setForm] = useState({
    title: org.title ?? '',
    description: org.description ?? '',
    location: org.location ?? '',
    website: org.website ?? '',
    category: org.category ?? '',
  });

  const saveOrgMutation = useMutation({
    mutationFn: () => {
      if (!orgId) throw new Error('Organization id is missing');
      return organizationsApi.update(orgId, {
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
      toast.success(t.orgEdit.updated);
    },
    onError: () => {
      toast.error(t.orgEdit.updateFailed);
    },
  });

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
        {t.orgEdit.backToOrg}
      </Link>

      <h1 className="mb-1 text-2xl font-extrabold tracking-tight">{t.orgEdit.title}</h1>
      <p className="mb-8 text-sm text-muted-foreground">{org.title}</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <OrgEditBranding
          orgId={orgId}
          orgTitle={org.title}
          avatarUrl={org.avatarUrl}
          coverUrl={org.coverUrl}
        />

        <Separator />

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="title">{t.orgEdit.name}</FieldLabel>
            <Input
              id="title"
              value={form.title}
              onChange={set('title')}
              placeholder={t.orgEdit.namePlaceholder}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="description">{t.orgEdit.description}</FieldLabel>
            <Textarea
              id="description"
              value={form.description}
              onChange={set('description')}
              placeholder={t.orgEdit.descriptionPlaceholder}
              className="min-h-28"
            />
            <FieldDescription>{t.orgEdit.maxChars.replace('{{n}}', '1000')}</FieldDescription>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="category">{t.orgEdit.category}</FieldLabel>
              <Input
                id="category"
                value={form.category}
                onChange={set('category')}
                placeholder={t.orgEdit.categoryPlaceholder}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="location">{t.orgEdit.location}</FieldLabel>
              <Input
                id="location"
                value={form.location}
                onChange={set('location')}
                placeholder={t.orgEdit.locationPlaceholder}
              />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="website">{t.orgEdit.website}</FieldLabel>
            <Input
              id="website"
              value={form.website}
              onChange={set('website')}
              placeholder={t.orgEdit.websitePlaceholder}
            />
            <FieldDescription>{t.orgEdit.websiteHint}</FieldDescription>
          </Field>
        </FieldGroup>

        <Separator />

        <div className="flex justify-end gap-3">
          <Link to={`/organizations/${orgId}`} className={cn(buttonVariants({ variant: 'ghost' }))}>
            {t.common.cancel}
          </Link>
          <Button type="submit" className="gap-1.5" disabled={saveOrgMutation.isPending || !orgId}>
            <Save className="h-3.5 w-3.5" />
            {saveOrgMutation.isPending ? t.common.saving : t.common.saveChanges}
          </Button>
        </div>
      </form>
    </main>
  );
}
