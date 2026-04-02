import { toast } from 'sonner';
import { api, tagsApi } from '@shared/api';
import { eventsApi } from '@entities/Event';
import type { CreateEventDto } from '@entities/Event';
import type { CoverFileEntry } from './EventImagesField';

interface SubmitEventOptions {
  data: CreateEventDto;
  durationHours: string;
  coverFiles: CoverFileEntry[];
  onSuccess?: (eventId: string) => void;
  errorMessage?: string;
}

export async function submitCreateEvent({ data, durationHours, coverFiles, onSuccess, errorMessage }: SubmitEventOptions) {
  try {
    const start = new Date(`${data.date}T${data.time}`);
    const end = new Date(start.getTime() + Number(durationHours) * 60 * 60 * 1000);

    const tagNames = data.tags ?? [];
    let tagIds: string[] | undefined;
    if (tagNames.length > 0) {
      const resolvedTags = await tagsApi.findOrCreate(tagNames);
      tagIds = resolvedTags.map((t) => t.id);
    }

    const created = await api.post<{ id: string }>('/events', {
      name: data.title,
      description: data.description,
      time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      datetime_start: start,
      datetime_end: end,
      location: data.format === 'offline' ? (data.location || undefined) : undefined,
      location_map_url: data.format === 'offline' ? (data.googleMapsUrl || undefined) : undefined,
      online_link: data.format === 'online' ? (data.onlineUrl || undefined) : undefined,
      organization_id: data.organizationId,
      tags: tagIds,
      attendees_public: data.attendeesPublic ?? false,
      notify_new_attendees: data.notifyNewAttendees ?? false,
      redirect_url: data.redirectUrl || undefined,
      publish_at: data.publishAt ? new Date(data.publishAt) : undefined,
    });

    if (coverFiles.length > 0 && created.data?.id) {
      await eventsApi.uploadImages(created.data.id, coverFiles.map((e) => e.file));
    }

    onSuccess?.(created.data.id);
  } catch {
    if (errorMessage) toast.error(errorMessage);
  }
}
