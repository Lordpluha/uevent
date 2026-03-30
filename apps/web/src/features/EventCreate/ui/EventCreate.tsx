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

import { createEventSchema, type CreateEventDto } from '@entities/Event';
import { useOrgs } from '@entities/Organization';

import type { EventCreateProps } from './helpers';
import { getInitialDateTime } from './helpers';
import { EventLocationFields } from './EventLocationFields';
import { EventTagsField } from './EventTagsField';
import { EventImagesField, type CoverFileEntry } from './EventImagesField';
import { submitCreateEvent } from './submitCreateEvent';

export function EventCreate({ onSuccess, defaultOrganizationId, lockOrganization = false }: EventCreateProps) {
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
    submitCreateEvent({ data, durationHours, coverFiles, onSuccess });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div className="rounded-xl border border-border/60 bg-card p-4 text-sm text-muted-foreground">
        Complete the event basics first, then define venue details and publishing options.
      </div>
      <FieldGroup>
        {/* Title */}
        <Field>
          <FieldTitle>Title</FieldTitle>
          <Input {...register('title')} placeholder="Event title" aria-invalid={!!errors.title} />
          <FieldError errors={errors.title ? [errors.title] : undefined} />
        </Field>

        {/* Description */}
        <Field>
          <FieldTitle>Description</FieldTitle>
          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <RichTextEditor
                defaultValue={field.value}
                onChange={field.onChange}
                placeholder="Describe your event…"
                aria-invalid={!!errors.description}
              />
            )}
          />
          <FieldError errors={errors.description ? [errors.description] : undefined} />
        </Field>

        {/* Date & Time */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field>
            <FieldTitle>Date</FieldTitle>
            <Input {...register('date')} type="date" aria-invalid={!!errors.date} />
            <FieldError errors={errors.date ? [errors.date] : undefined} />
          </Field>
          <Field>
            <FieldTitle>Time</FieldTitle>
            <Input {...register('time')} type="time" aria-invalid={!!errors.time} />
            <FieldError errors={errors.time ? [errors.time] : undefined} />
          </Field>
          <Field>
            <FieldTitle>Duration</FieldTitle>
            <Select value={durationHours} onValueChange={(value) => setDurationHours(value as typeof durationHours)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 hour</SelectItem>
                <SelectItem value="2">2 hours</SelectItem>
                <SelectItem value="3">3 hours</SelectItem>
                <SelectItem value="4">4 hours</SelectItem>
              </SelectContent>
            </Select>
            <FieldDescription>The end time is calculated automatically.</FieldDescription>
          </Field>
        </div>

        {/* Format */}
        <Field>
          <FieldTitle>Format</FieldTitle>
          <Controller
            control={control}
            name="format"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full" aria-invalid={!!errors.format}>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
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
            <FieldTitle>Meeting link</FieldTitle>
            <Input {...register('onlineUrl')} placeholder="https://meet.google.com/..." aria-invalid={!!errors.onlineUrl} />
            <FieldError errors={errors.onlineUrl ? [errors.onlineUrl] : undefined} />
          </Field>
        )}

        {/* Organization */}
        <Field>
          <FieldTitle>Organization</FieldTitle>
          <Controller
            control={control}
            name="organizationId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled={organizationLocked}>
                <SelectTrigger className="w-full" aria-invalid={!!errors.organizationId}>
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizationsLoading && <SelectItem value="__loading" disabled>Loading organizations...</SelectItem>}
                  {organizationsError && <SelectItem value="__error" disabled>Failed to load organizations</SelectItem>}
                  {!organizationsLoading && !organizationsError && organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>{org.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {organizationLocked && (
            <FieldDescription>You are creating this event for your organization account.</FieldDescription>
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
        {isSubmitting ? 'Creating…' : 'Create event'}
      </Button>
    </form>
  );
}
