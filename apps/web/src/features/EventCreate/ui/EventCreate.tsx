import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';

import {
  Button,
  Field,
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
import { MOCK_ORGS } from '@entities/Organization';
import { eventsApi } from '@entities/Event';

/* ── Types ────────────────────────────────────────────────────────────── */

interface EventCreateProps {
  /** Called after successful submit */
  onSuccess?: () => void;
  /** Optional pre-selected organization */
  defaultOrganizationId?: string;
}

/* ── Component ────────────────────────────────────────────────────────── */

export function EventCreate({ onSuccess, defaultOrganizationId }: EventCreateProps) {
  const [tagInput, setTagInput] = useState('');

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<CreateEventDto>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: '',
      description: '',
      date: '',
      time: '',
      format: 'offline',
      location: '',
      organizationId: defaultOrganizationId ?? '',
      tags: [],
      imageUrl: '',
    },
  });

  const selectedFormat = watch('format');
  const tags = watch('tags') ?? [];

  const addTag = (value: string) => {
    const trimmed = value.trim().replace(/,$/, '').trim();
    if (trimmed && !tags.includes(trimmed)) {
      setValue('tags', [...tags, trimmed]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setValue('tags', tags.filter((t) => t !== tag));
  };

  const onSubmit = async (data: CreateEventDto) => {
    // Strip empty optional fields
    const dto: CreateEventDto = {
      ...data,
      location: data.format === 'online' ? undefined : data.location || undefined,
      tags: data.tags?.length ? data.tags : undefined,
      imageUrl: data.imageUrl || undefined,
    };
    await eventsApi.create(dto);
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <FieldGroup>
        {/* Title */}
        <Field>
          <FieldTitle>Title</FieldTitle>
          <Input
            {...register('title')}
            placeholder="Event title"
            aria-invalid={!!errors.title}
          />
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
        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldTitle>Date</FieldTitle>
            <Input
              {...register('date')}
              type="date"
              aria-invalid={!!errors.date}
            />
            <FieldError errors={errors.date ? [errors.date] : undefined} />
          </Field>
          <Field>
            <FieldTitle>Time</FieldTitle>
            <Input
              {...register('time')}
              type="time"
              aria-invalid={!!errors.time}
            />
            <FieldError errors={errors.time ? [errors.time] : undefined} />
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

        {/* Location (offline only) */}
        {selectedFormat === 'offline' && (
          <Field>
            <FieldTitle>Location</FieldTitle>
            <Input
              {...register('location')}
              placeholder="City, venue or address"
              aria-invalid={!!errors.location}
            />
            <FieldError errors={errors.location ? [errors.location] : undefined} />
          </Field>
        )}

        {/* Organization */}
        <Field>
          <FieldTitle>Organization</FieldTitle>
          <Controller
            control={control}
            name="organizationId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full" aria-invalid={!!errors.organizationId}>
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_ORGS.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError errors={errors.organizationId ? [errors.organizationId] : undefined} />
        </Field>

        {/* Tags */}
        <Field>
          <FieldTitle>Tags</FieldTitle>
          <div className="flex flex-col gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  addTag(tagInput);
                }
              }}
              onBlur={() => tagInput && addTag(tagInput)}
              placeholder="Add tag and press Enter…"
            />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-0.5 rounded-full text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={`Remove ${tag}`}
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </Field>

        {/* Cover image URL */}
        <Field>
          <FieldTitle>Cover image URL</FieldTitle>
          <Input
            {...register('imageUrl')}
            placeholder="https://…"
            aria-invalid={!!errors.imageUrl}
          />
          <FieldError errors={errors.imageUrl ? [errors.imageUrl] : undefined} />
        </Field>
      </FieldGroup>

      <Button type="submit" disabled={isSubmitting} className="self-end">
        {isSubmitting ? 'Creating…' : 'Create event'}
      </Button>
    </form>
  );
}
