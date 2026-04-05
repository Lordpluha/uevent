import {
  Calendar,
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@shared/components'
import { useAppContext } from '@shared/lib'
import { format as formatDate } from 'date-fns'
import { CalendarDays, MapPin, Tag, X } from 'lucide-react'
import type { RefObject } from 'react'
import type { DateRange } from 'react-day-picker'
import { FORMAT_OPTIONS, type Format } from '../model/types'

export function FilterFormatField({ format, onFormatChange }: { format: Format; onFormatChange: (v: Format) => void }) {
  const { t } = useAppContext()
  const FORMAT_LABELS: Record<string, string> = {
    all: t.filters.all,
    online: t.common.online,
    offline: t.common.offline,
  }
  return (
    <div className="flex gap-1.5">
      {FORMAT_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onFormatChange(option.value)}
          className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            format === option.value
              ? 'bg-primary text-primary-foreground'
              : 'border border-border text-muted-foreground hover:border-primary/60 hover:text-foreground'
          }`}
        >
          {FORMAT_LABELS[option.value]}
        </button>
      ))}
    </div>
  )
}

interface FilterTagsFieldProps {
  selectedTags: string[]
  onTagsChange: (v: string[]) => void
  tagsAnchor: RefObject<HTMLDivElement | null>
  tags: string[]
}

export function FilterTagsField({ selectedTags, onTagsChange, tagsAnchor, tags }: FilterTagsFieldProps) {
  const { t } = useAppContext()
  return (
    <Combobox value={selectedTags} onValueChange={onTagsChange} multiple>
      <div ref={tagsAnchor} className="w-full">
        <ComboboxTrigger className="flex min-h-9 w-full cursor-pointer items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring">
          <span className="flex flex-1 flex-wrap items-center gap-1.5">
            {selectedTags.length === 0 ? (
              <span className="flex items-center gap-2 text-muted-foreground">
                <Tag className="h-3.5 w-3.5 shrink-0" />
                {t.filters.filterByTags}
              </span>
            ) : (
              <>
                <Tag className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded-sm bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary"
                  >
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer opacity-60 hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation()
                        onTagsChange(selectedTags.filter((t) => t !== tag))
                      }}
                    />
                  </span>
                ))}
              </>
            )}
          </span>
        </ComboboxTrigger>
      </div>
      <ComboboxContent anchor={tagsAnchor} align="start">
        <ComboboxInput placeholder={t.filters.searchTags} showTrigger={false} />
        <ComboboxList>
          {tags.map((tag) => (
            <ComboboxItem key={tag} value={tag}>
              {tag}
            </ComboboxItem>
          ))}
          <ComboboxEmpty>{t.filters.noTags}</ComboboxEmpty>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

interface FilterDateRangeFieldProps {
  dateRange: DateRange | undefined
  onDateRangeChange: (v: DateRange | undefined) => void
  numberOfMonths?: number
  placeholder?: string
}

export function FilterDateRangeField({
  dateRange,
  onDateRangeChange,
  numberOfMonths = 1,
  placeholder = 'Pick a date range',
}: FilterDateRangeFieldProps) {
  const { t } = useAppContext()
  const displayPlaceholder = placeholder === 'Pick a date range' ? t.filters.pickDateRange : placeholder
  return (
    <Popover>
      <PopoverTrigger
        className={`flex h-9 w-full items-center gap-2 rounded-md border px-3 text-sm transition-colors ${
          dateRange?.from
            ? 'border-primary/60 text-foreground'
            : 'border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        }`}
      >
        <CalendarDays className="h-4 w-4 shrink-0" />
        {dateRange?.from ? (
          <span>
            {formatDate(dateRange.from, 'MMM d')}
            {dateRange.to ? ` – ${formatDate(dateRange.to, 'MMM d')}` : ''}
          </span>
        ) : (
          <span>{displayPlaceholder}</span>
        )}
        {dateRange?.from && (
          <X
            className="ml-auto h-3.5 w-3.5 opacity-60 hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation()
              onDateRangeChange(undefined)
            }}
          />
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={dateRange}
          onSelect={onDateRangeChange}
          numberOfMonths={numberOfMonths}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

interface FilterLocationFieldProps {
  location: string
  onLocationChange: (v: string) => void
  locationAnchor: RefObject<HTMLDivElement | null>
  cities: string[]
}

export function FilterLocationField({ location, onLocationChange, locationAnchor, cities }: FilterLocationFieldProps) {
  const { t } = useAppContext()
  return (
    <div className="flex items-center gap-2 rounded-md border border-input bg-background px-2 text-sm">
      <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <Combobox
        value={location || null}
        onValueChange={(v) => onLocationChange(v ?? '')}
        onInputValueChange={onLocationChange}
      >
        <div ref={locationAnchor} className="flex-1">
          <ComboboxInput
            placeholder={t.filters.locationPlaceholder}
            showTrigger={false}
            showClear={location !== ''}
            className="h-9 w-full border-none bg-transparent shadow-none has-[[data-slot=input-group-control]:focus-visible]:border-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-0"
          />
        </div>
        <ComboboxContent anchor={locationAnchor} align="start">
          <ComboboxList>
            {cities.map((city) => (
              <ComboboxItem key={city} value={city}>
                {city}
              </ComboboxItem>
            ))}
            <ComboboxEmpty>{t.filters.noLocations}</ComboboxEmpty>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  )
}
