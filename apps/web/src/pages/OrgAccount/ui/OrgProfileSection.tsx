import { organizationsApi } from '@entities/Organization'
import { Button, Field, FieldLabel, Input, Textarea } from '@shared/components'
import { useAppContext } from '@shared/lib'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { useRequiredOrgAccountData } from './useOrgAccountData'

export function OrgProfileSection() {
  const { t } = useAppContext()
  const { org, isLoading, invalidateOrgQueries } = useRequiredOrgAccountData()
  const [profileForm, setProfileForm] = useState({
    title: org?.title ?? '',
    slogan: org?.slogan ?? '',
    description: org?.description ?? '',
    category: org?.category ?? '',
    location: org?.location ?? '',
    phone: org?.phone ?? '',
  })

  const saveProfileMutation = useMutation({
    mutationFn: () =>
      organizationsApi.updateMyProfile({
        title: profileForm.title,
        slogan: profileForm.slogan,
        description: profileForm.description,
        category: profileForm.category,
        location: profileForm.location,
        phone: profileForm.phone,
      }),
    onSuccess: async () => {
      await invalidateOrgQueries()
      toast.success(t.orgAccount.profile.updated)
    },
    onError: () => toast.error(t.orgAccount.profile.updateFailed),
  })

  if (isLoading || !org)
    return <section className="mt-5 h-40 animate-pulse rounded-xl border border-border/60 bg-muted" />

  return (
    <section className="mt-5 rounded-xl border border-border/60 bg-card p-5">
      <h2 className="text-base font-semibold">{t.orgAccount.profile.title}</h2>
      <form
        className="mt-4 space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          saveProfileMutation.mutate()
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="org-name">{t.orgAccount.profile.name}</FieldLabel>
            <Input
              id="org-name"
              value={profileForm.title}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder={t.orgAccount.profile.name}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="org-slogan">{t.orgAccount.profile.slogan}</FieldLabel>
            <Input
              id="org-slogan"
              value={profileForm.slogan}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, slogan: e.target.value }))}
              placeholder={t.orgAccount.profile.sloganPlaceholder}
            />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="org-description">{t.common.description}</FieldLabel>
          <Textarea
            id="org-description"
            value={profileForm.description}
            onChange={(e) => setProfileForm((prev) => ({ ...prev, description: e.target.value }))}
            className="min-h-24"
            placeholder={t.orgAccount.profile.descriptionPlaceholder}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="org-category">{t.common.category}</FieldLabel>
            <Input
              id="org-category"
              value={profileForm.category}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, category: e.target.value }))}
              placeholder={t.orgAccount.profile.categoryPlaceholder}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="org-location">{t.orgAccount.profile.city}</FieldLabel>
            <Input
              id="org-location"
              value={profileForm.location}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, location: e.target.value }))}
              placeholder={t.orgAccount.profile.cityPlaceholder}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="org-phone">{t.common.phone}</FieldLabel>
            <Input
              id="org-phone"
              value={profileForm.phone}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder={t.orgAccount.profile.phonePlaceholder}
            />
          </Field>
        </div>

        <Button type="submit" disabled={saveProfileMutation.isPending}>
          {saveProfileMutation.isPending ? t.common.saving : t.orgAccount.profile.saveProfile}
        </Button>
      </form>
    </section>
  )
}
