import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Button,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldTitle,
  Input,
  RichTextEditor,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components';
import { useAppContext } from '@shared/lib';

import { createEventSchema, type CreateEventDto } from '@entities/Event';
import { useOrgs } from '@entities/Organization';

import type { EventCreateProps } from './helpers';
import { getInitialDateTime } from './helpers';
import { EventLocationFields } from './EventLocationFields';
import { EventTagsField } from './EventTagsField';
import { EventImagesField, type CoverFileEntry } from './EventImagesField';
import { submitCreateEvent } from './submitCreateEvent';

export function EventCreate({ onSuccess, defaultOrganizationId, lockOrganization = false }: EventCreateProps) {
  const { t } = useAppContext();
  const [durationHours, setDurationHours] = useState<'1' | '2' | '3' | '4'>('2');
  const [coverFiles, setCoverFiles] = useState<CoverFileEntry[]>([]);
  const { data: organizationsResult, isLoading: organizationsLoading, isError: organizationsError } = useOrgs({ page: 1, limit: 100 });
  const organizations = organizationsResult?.data ?? [];
  const startsAt = getInitialDateTime();
  const organizationLocked = Boolean(lockOrganization && defaultOrganizationId);

  const form = useForm<CreateEventDto>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: '',
      description: '',
      date: startsAt.date,
      time: startsAt.time,
      format: 'offline',
      location: '',
      googleMapsUrl: '',
      onlineUrl: '',
      organizationId: defaultOrganizationId ?? '',
      tags: [],
      imageUrl: '',
    },
  });

  const { register, control, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = form;
  const selectedFormat = watch('format');
  const tags = watch('tags') ?? [];

  const onSubmit = (data: CreateEventDto) =>
    submitCreateEvent({ data, durationHours, coverFiles, onSuccess, errorMessage: t.eventCreate.createFailed });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div className="rounded-xl border border-border/60 bg-card p-4 text-sm text-muted-foreground">
        {t.eventCreate.hint}
      </div>
      <FieldGroup>
        {/* Title */}
        <Field>
          <FieldTitle>{t.eventCreate.titleLabel}</FieldTitle>
          <Input {...register('title')} placeholder={t.eventCreate.titlePlaceholder} aria-invalid={!!errors.title} />
          <FieldError errors={errors.title ? [errors.title] : undefined} />
        </Field>

        {/* Description */}
        <Field>
          <FieldTitle>{t.common.description}</FieldTitle>
          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <RichTextEditor
                defaultValue={field.value}
                onChange={field.onChange}
                placeholder={t.eventCreate.descriptionPlaceholder}
                aria-invalid={!!errors.description}
              />
            )}
          />
          <FieldError errors={errors.description ? [errors.description] : undefined} />
        </Field>

        {/* Date & Time */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field>
            <FieldTitle>{t.common.date}</FieldTitle>
            <Input {...register('date')} type="date" aria-invalid={!!errors.date} />
            <FieldError errors={errors.date ? [errors.date] : undefined} />
          </Field>
          <Field>
            <FieldTitle>{t.common.time}</FieldTitle>
            <Input {...register('time')} type="time" aria-invalid={!!errors.time} />
            <FieldError errors={errors.time ? [errors.time] : undefined} />
          </Field>
          <Field>
            <FieldTitle>{t.eventCreate.duration}</FieldTitle>
            <Select value={durationHours} onValueChange={(value) => setDurationHours(value as typeof durationHours)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t.eventCreate.durationPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">{t.eventCreate.duration1h}</SelectItem>
                <SelectItem value="2">{t.eventCreate.duration2h}</SelectItem>
                <SelectItem value="3">{t.eventCreate.duration3h}</SelectItem>
                <SelectItem value="4">{t.eventCreate.duration4h}</SelectItem>
              </SelectContent>
            </Select>
            <FieldDescription>{t.eventCreate.durationHint}</FieldDescription>
          </Field>
        </div>

        {/* Format */}
        <Field>
          <FieldTitle>{t.common.format}</FieldTitle>
          <Controller
            control={control}
            name="format"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full" aria-invalid={!!errors.format}>
                  <SelectValue placeholder={t.eventCreate.formatPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="offline">{t.common.offline}</SelectItem>
                  <SelectItem value="online">{t.common.online}</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          <FieldError errors={errors.format ? [errors.format] : undefined} />
        </Field>

        {/* Location (offline) */}
        {selectedFormat === 'offline' && <EventLocationFields form={form} />}

        {/* Online URL */}
        {selectedFormat === 'online' && (
          <Field>
            <FieldTitle>{t.eventCreate.meetingLink}</FieldTitle>
            <Input {...register('onlineUrl')} placeholder={t.eventCreate.meetingLinkPlaceholder} aria-invalid={!!errors.onlineUrl} />
            <FieldError errors={errors.onlineUrl ? [errors.onlineUrl] : undefined} />
          </Field>
        )}

        {/* Organization */}
        <Field>
          <FieldTitle>{t.eventCreate.organization}</FieldTitle>
          <Controller
            control={control}
            name="organizationId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled={organizationLocked}>
                <SelectTrigger className="w-full" aria-invalid={!!errors.organizationId}>
                  <SelectValue placeholder={t.eventCreate.orgPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {organizationsLoading && <SelectItem value="__loading" disabled>{t.eventCreate.orgLoading}</SelectItem>}
                  {organizationsError && <SelectItem value="__error" disabled>{t.eventCreate.orgFailed}</SelectItem>}
                  {!organizationsLoading && !organizationsError && organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>{org.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {organizationLocked && (
            <FieldDescription>{t.eventCreate.orgHint}</FieldDescription>
          )}
          <FieldError errors={errors.organizationId ? [errors.organizationId] : undefined} />
        </Field>

        {/* Tags */}
        <EventTagsField
          tags={tags}
          onAddTag={(tag) => setValue('tags', [...tags, tag])}
          onRemoveTag={(tag) => setValue('tags', tags.filter((t) => t !== tag))}
        />

        {/* Images */}
        <EventImagesField coverFiles={coverFiles} setCoverFiles={setCoverFiles} />
      </FieldGroup>

      <Button type="submit" disabled={isSubmitting} className="self-end">
        {isSubmitting ? t.common.creating : t.eventCreate.create}
      </Button>
    </form>
  );
}
