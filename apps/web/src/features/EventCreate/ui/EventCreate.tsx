import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ImagePlus, X } from 'lucide-react';
import type { CircleMarker, LeafletMouseEvent, Map as LeafletMap } from 'leaflet';
import { PhotoSwipe } from 'react-pswp';
import { toast } from 'sonner';
import 'react-pswp/dist/index.css';
import 'leaflet/dist/leaflet.css';

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
import { api, tagsApi } from '@shared/api';
import { eventsApi } from '@entities/Event';

/* ── Types ────────────────────────────────────────────────────────────── */

interface EventCreateProps {
  /** Called after successful submit */
  onSuccess?: (eventId: string) => void;
  /** Optional pre-selected organization */
  defaultOrganizationId?: string;
  /** Prevent changing organization when creator is signed in as organization */
  lockOrganization?: boolean;
}

type LatLng = { lat: number; lng: number };

const DEFAULT_CENTER: LatLng = { lat: 50.4501, lng: 30.5234 };

function getInitialDateTime() {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  now.setHours(now.getHours() + 1);

  const date = now.toISOString().slice(0, 10);
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return { date, time };
}

function buildGoogleMapsLink(lat: number, lng: number) {
  return `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
}

function parseCoordsFromMapsUrl(url: string): LatLng | null {
  if (!url) return null;

  const byQuery = url.match(/[?&]q=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/i);
  if (byQuery) {
    return { lat: Number(byQuery[1]), lng: Number(byQuery[2]) };
  }

  const byAt = url.match(/@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/i);
  if (byAt) {
    return { lat: Number(byAt[1]), lng: Number(byAt[2]) };
  }

  return null;
}

function LeafletMapPicker({
  initialCenter,
  selected,
  onSelect,
}: {
  initialCenter: LatLng;
  selected: LatLng | null;
  onSelect: (coords: LatLng) => void;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let map: LeafletMap | undefined;
    let marker: CircleMarker | undefined;
    let disposed = false;

    void (async () => {
      const L = await import('leaflet');
      if (disposed || !rootRef.current) return;

      const mapInstance = L.map(rootRef.current, { zoomControl: true }).setView(
        [selected?.lat ?? initialCenter.lat, selected?.lng ?? initialCenter.lng],
        13,
      );
      map = mapInstance;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(mapInstance);

      if (selected) {
        marker = L.circleMarker([selected.lat, selected.lng], {
          radius: 8,
          color: '#2563eb',
          weight: 2,
          fillColor: '#3b82f6',
          fillOpacity: 0.7,
        }).addTo(mapInstance);
      }

      mapInstance.on('click', (e: LeafletMouseEvent) => {
        const coords: LatLng = { lat: e.latlng.lat, lng: e.latlng.lng };

        if (marker) {
          marker.setLatLng([coords.lat, coords.lng]);
        } else {
          marker = L.circleMarker([coords.lat, coords.lng], {
            radius: 8,
            color: '#2563eb',
            weight: 2,
            fillColor: '#3b82f6',
            fillOpacity: 0.7,
          }).addTo(mapInstance);
        }

        onSelect(coords);
      });
    })();

    return () => {
      disposed = true;
      if (map) map.remove();
    };
  }, [initialCenter.lat, initialCenter.lng, onSelect, selected]);

  return <div ref={rootRef} className="h-64 w-full" />;
}

/* ── Component ────────────────────────────────────────────────────────── */


export function EventCreate({ onSuccess, defaultOrganizationId, lockOrganization = false }: EventCreateProps) {
  const [tagInput, setTagInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [durationHours, setDurationHours] = useState<'1' | '2' | '3' | '4'>('2');
  const [mapPickerVisible, setMapPickerVisible] = useState(false);
  const [coverFiles, setCoverFiles] = useState<Array<{ file: File; preview: string; w: number; h: number }>>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: organizationsResult, isLoading: organizationsLoading, isError: organizationsError } = useOrgs({ page: 1, limit: 100 });
  const organizations = organizationsResult?.data ?? [];
  const { data: tagsResult } = useQuery({ queryKey: ['tags'], queryFn: () => tagsApi.getAll({ limit: 100 }) });
  const allTags = tagsResult?.data ?? [];
  const startsAt = getInitialDateTime();
  const organizationLocked = Boolean(lockOrganization && defaultOrganizationId);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateEventDto>({
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

  const selectedFormat = watch('format');
  const locationValue = watch('location') ?? '';
  const googleMapsUrlValue = watch('googleMapsUrl') ?? '';
  const tags = watch('tags') ?? [];

  const normalizedLocation = locationValue.trim();
  const fallbackGoogleMapsUrl = normalizedLocation
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(normalizedLocation)}`
    : '';
  const effectiveGoogleMapsUrl = googleMapsUrlValue.trim() || fallbackGoogleMapsUrl;
  const selectedCoords = useMemo(() => parseCoordsFromMapsUrl(googleMapsUrlValue.trim()), [googleMapsUrlValue]);

  const handleMapSelect = useCallback(
    (coords: LatLng) => {
      setValue('googleMapsUrl', buildGoogleMapsLink(coords.lat, coords.lng), { shouldValidate: true });
    },
    [setValue],
  );

  const addCoverFiles = (incoming: FileList | File[]) => {
    const imageFiles = Array.from(incoming).filter((f) => f.type.startsWith('image/'));
    if (!imageFiles.length) return;
    const existing = [...coverFiles];
    const toAdd = imageFiles
      .filter((f) => existing.length + imageFiles.indexOf(f) < 20)
      .filter((f) => !existing.some((e) => e.file.name === f.name && e.file.size === f.size));
    if (!toAdd.length) return;

    const loadEntry = (file: File): Promise<{ file: File; preview: string; w: number; h: number }> =>
      new Promise((resolve) => {
        const preview = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => resolve({ file, preview, w: img.naturalWidth, h: img.naturalHeight });
        img.onerror = () => resolve({ file, preview, w: 800, h: 600 });
        img.src = preview;
      });

    void Promise.all(toAdd.map(loadEntry)).then((entries) => {
      setCoverFiles((prev) => [...prev, ...entries].slice(0, 20));
    });
  };

  const removeCoverFile = (index: number) => {
    setCoverFiles((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    addCoverFiles(e.dataTransfer.files);
  };

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
      });

      if (coverFiles.length > 0 && created.data?.id) {
        await eventsApi.uploadImages(created.data.id, coverFiles.map((e) => e.file));
      }

      onSuccess?.(created.data.id);
    } catch {
      toast.error('Failed to create event');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div className="rounded-xl border border-border/60 bg-card p-4 text-sm text-muted-foreground">
        Complete the event basics first, then define venue details and publishing options.
      </div>

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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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

        {/* Location (offline only) */}
        {selectedFormat === 'offline' && (
          <>
            <Field>
              <FieldTitle>Location</FieldTitle>
              <Input
                {...register('location')}
                placeholder="City, venue or address"
                aria-invalid={!!errors.location}
              />
              <FieldError errors={errors.location ? [errors.location] : undefined} />
            </Field>

            <Field>
              <FieldTitle>Google Maps link</FieldTitle>
              <Input
                {...register('googleMapsUrl')}
                placeholder="https://maps.google.com/..."
                aria-invalid={!!errors.googleMapsUrl}
              />
              <FieldError errors={errors.googleMapsUrl ? [errors.googleMapsUrl] : undefined} />

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!normalizedLocation}
                  onClick={() => {
                    if (!normalizedLocation) return;
                    setValue('googleMapsUrl', fallbackGoogleMapsUrl, { shouldValidate: true });
                  }}
                >
                  Use current location in Google Maps
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMapPickerVisible((prev) => !prev)}
                >
                  {mapPickerVisible ? 'Hide map picker' : 'Choose on map'}
                </Button>

                {effectiveGoogleMapsUrl && (
                  <a
                    href={effectiveGoogleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    Open map in new tab
                  </a>
                )}
              </div>

              {selectedCoords && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Selected coordinates: {selectedCoords.lat.toFixed(6)}, {selectedCoords.lng.toFixed(6)}
                </p>
              )}

              {mapPickerVisible && (
                <div className="mt-3 overflow-hidden rounded-lg border border-border/60">
                  <LeafletMapPicker
                    initialCenter={DEFAULT_CENTER}
                    selected={selectedCoords}
                    onSelect={handleMapSelect}
                  />
                </div>
              )}
            </Field>
          </>
        )}

        {selectedFormat === 'online' && (
          <Field>
            <FieldTitle>Meeting link</FieldTitle>
            <Input
              {...register('onlineUrl')}
              placeholder="https://meet.google.com/..."
              aria-invalid={!!errors.onlineUrl}
            />
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
                    <SelectItem key={org.id} value={org.id}>
                      {org.title}
                    </SelectItem>
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
        <Field>
          <FieldTitle>Tags</FieldTitle>
          <div className="flex flex-col gap-2">
            <div className="relative">
              <div
                className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-input bg-input/20 px-2 py-1"
                onClick={(e) => {
                  const input = e.currentTarget.querySelector('input')
                  input?.focus()
                }}
              >
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
                <input
                  value={tagInput}
                  onChange={(e) => {
                    setTagInput(e.target.value)
                    setShowSuggestions(true)
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setShowSuggestions(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault()
                      addTag(tagInput)
                      setShowSuggestions(false)
                    } else if (e.key === 'Escape') {
                      setShowSuggestions(false)
                    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
                      removeTag(tags[tags.length - 1])
                    }
                  }}
                  className="h-7 min-w-36 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  placeholder={tags.length ? 'Add more tags…' : 'Search or create tags…'}
                />
              </div>
              {showSuggestions && (() => {
                const trimmed = tagInput.trim();
                const filtered = allTags.filter(
                  (t) => t.name.toLowerCase().includes(trimmed.toLowerCase()) && !tags.includes(t.name),
                );
                const canCreate = trimmed.length > 0 && !allTags.some((t) => t.name.toLowerCase() === trimmed.toLowerCase()) && !tags.includes(trimmed);
                if (!filtered.length && !canCreate) return null;
                return (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 overflow-hidden rounded-md border border-border bg-popover shadow-md">
                    {filtered.slice(0, 8).map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); addTag(tag.name); setShowSuggestions(false); }}
                        className="w-full px-3 py-1.5 text-left text-sm hover:bg-accent"
                      >
                        {tag.name}
                      </button>
                    ))}
                    {canCreate && (
                      <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); addTag(trimmed); setShowSuggestions(false); }}
                        className="w-full px-3 py-1.5 text-left text-sm text-primary hover:bg-accent"
                      >
                        Create "{trimmed}"
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
          <FieldDescription>Select existing tags or type a new one to create it.</FieldDescription>
        </Field>

        {/* Cover images */}
        <Field>
          <FieldTitle>Images</FieldTitle>
          <div className="flex flex-col gap-3">
            {coverFiles.length > 0 && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {coverFiles.map(({ preview }, index) => (
                  <div key={preview} className="relative aspect-square overflow-hidden rounded-lg border border-border/60">
                    <img
                      src={preview}
                      alt={`Image ${index + 1}`}
                      className="h-full w-full cursor-zoom-in object-cover transition-opacity hover:opacity-80"
                      onClick={() => { setLightboxIndex(index); setLightboxOpen(true); }}
                    />
                    <button
                      type="button"
                      onClick={() => removeCoverFile(index)}
                      className="absolute right-1 top-1 rounded-full bg-background/80 p-0.5 text-muted-foreground backdrop-blur-sm hover:text-foreground"
                      aria-label="Remove image"
                    >
                      <X className="size-3.5" />
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                        Cover
                      </span>
                    )}
                  </div>
                ))}
                {coverFiles.length < 20 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border/60 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                  >
                    <ImagePlus className="size-5" />
                    <span className="text-xs">Add</span>
                  </button>
                )}
              </div>
            )}
            {coverFiles.length === 0 && (
              <div
                className={`flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
                  isDragging ? 'border-primary bg-primary/5' : 'border-border/60 bg-muted/20 hover:border-primary/50 hover:bg-primary/5'
                }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center gap-2 p-6 text-center">
                  <ImagePlus className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Drag & drop photos or click to browse</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG, WebP · up to 20 files · 10 MB each</p>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => { if (e.target.files) addCoverFiles(e.target.files); e.target.value = ''; }}
            />
          </div>
          {coverFiles.length > 0 && (
            <FieldDescription>First image is used as the cover. Drag images to the drop zone to add more.</FieldDescription>
          )}
        </Field>
      </FieldGroup>

      {lightboxOpen && coverFiles.length > 0 && (
        <PhotoSwipe
          container={coverFiles.map(({ preview, w, h }, i) => ({ uid: i, src: preview, w, h }))}
          index={lightboxIndex}
          open={lightboxOpen}
          onIndexChange={setLightboxIndex}
          onOpenChange={setLightboxOpen}
        />
      )}

      <Button type="submit" disabled={isSubmitting} className="self-end">
        {isSubmitting ? 'Creating…' : 'Create event'}
      </Button>
    </form>
  );
}
