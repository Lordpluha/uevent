import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

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
import { eventsApi, updateEventSchema, type EventModel, type UpdateEventDto } from '@entities/Event';
import { EventEditTagsField } from './EventEditTagsField';

/* ── Types ────────────────────────────────────────────────────────────── */

interface EventEditProps {
  event: EventModel;
  /** Called after successful save */
  onSuccess?: () => void;
}

/* ── Component ────────────────────────────────────────────────────────── */

export function EventEdit({ event, onSuccess }: EventEditProps) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UpdateEventDto>({
    resolver: zodResolver(updateEventSchema),
    defaultValues: {
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      format: event.format,
      location: event.location ?? '',
      tags: event.tags ?? [],
      imageUrl: event.imageUrl ?? '',
    },
  });

  const selectedFormat = watch('format');

  const onSubmit = async (data: UpdateEventDto) => {
    const dto: UpdateEventDto = {
      ...data,
      location: data.format === 'online' ? undefined : data.location || undefined,
      tags: data.tags?.length ? data.tags : undefined,
      imageUrl: data.imageUrl || undefined,
    };
    await eventsApi.update(event.id, dto);
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
                defaultValue={event.description}
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

        <EventEditTagsField watch={watch} setValue={setValue} />

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
        {isSubmitting ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  );
}
