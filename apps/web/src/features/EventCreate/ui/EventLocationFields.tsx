import { useMemo, useState, useCallback } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Button, Field, FieldError, FieldTitle, Input } from '@shared/components';
import { useAppContext } from '@shared/lib';
import type { CreateEventDto } from '@entities/Event';
import { LeafletMapPicker } from './LeafletMapPicker';
import { DEFAULT_CENTER, buildGoogleMapsLink, parseCoordsFromMapsUrl } from './helpers';

interface Props {
  form: UseFormReturn<CreateEventDto>;
}

export function EventLocationFields({ form }: Props) {
  const { t } = useAppContext();
  const { register, watch, setValue, formState: { errors } } = form;
  const [mapPickerVisible, setMapPickerVisible] = useState(false);

  const locationValue = watch('location') ?? '';
  const googleMapsUrlValue = watch('googleMapsUrl') ?? '';

  const normalizedLocation = locationValue.trim();
  const fallbackGoogleMapsUrl = normalizedLocation
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(normalizedLocation)}`
    : '';
  const effectiveGoogleMapsUrl = googleMapsUrlValue.trim() || fallbackGoogleMapsUrl;
  const selectedCoords = useMemo(() => parseCoordsFromMapsUrl(googleMapsUrlValue.trim()), [googleMapsUrlValue]);

  const handleMapSelect = useCallback(
    (coords: { lat: number; lng: number }) => {
      setValue('googleMapsUrl', buildGoogleMapsLink(coords.lat, coords.lng), { shouldValidate: true });
    },
    [setValue],
  );

  return (
    <>
      <Field>
        <FieldTitle>{t.common.location}</FieldTitle>
        <Input
          {...register('location')}
          placeholder={t.eventCreate.locationFields.placeholder}
          aria-invalid={!!errors.location}
        />
        <FieldError errors={errors.location ? [errors.location] : undefined} />
      </Field>

      <Field>
        <FieldTitle>{t.eventCreate.locationFields.mapsLink}</FieldTitle>
        <Input
          {...register('googleMapsUrl')}
          placeholder={t.eventCreate.locationFields.mapsPlaceholder}
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
            {t.eventCreate.locationFields.useCurrentLocation}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setMapPickerVisible((prev) => !prev)}
          >
            {mapPickerVisible ? t.eventCreate.locationFields.hideMap : t.eventCreate.locationFields.chooseOnMap}
          </Button>

          {effectiveGoogleMapsUrl && (
            <a
              href={effectiveGoogleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-primary hover:underline"
            >
              {t.eventCreate.locationFields.openMapTab}
            </a>
          )}
        </div>

        {selectedCoords && (
          <p className="mt-2 text-xs text-muted-foreground">
            {t.eventCreate.locationFields.selectedCoords} {selectedCoords.lat.toFixed(6)}, {selectedCoords.lng.toFixed(6)}
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
  );
}
