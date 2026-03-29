import type { RefObject } from 'react';
import { format as formatDate } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { CalendarDays, MapPin, Search, Tag, X } from 'lucide-react';
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
  Input,
} from '@shared/components';
import {
  FORMAT_OPTIONS,
  type Format,
} from '../model/useEventsFilters';

interface Props {
  query: string;
  onQueryChange: (v: string) => void;
  format: Format;
  onFormatChange: (v: Format) => void;
  selectedTags: string[];
  onTagsChange: (v: string[]) => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (v: DateRange | undefined) => void;
  location: string;
  onLocationChange: (v: string) => void;
  tagsAnchor: RefObject<HTMLDivElement | null>;
  locationAnchor: RefObject<HTMLDivElement | null>;
  tags: string[];
  cities: string[];
}

export function EventsFilterBar({
  query, onQueryChange,
  format, onFormatChange,
  selectedTags, onTagsChange,
  dateRange, onDateRangeChange,
  location, onLocationChange,
  tagsAnchor, locationAnchor,
  tags,
  cities,
}: Props) {
  return (
    <div className="mb-8 hidden rounded-xl border border-border/60 bg-card p-4 sm:block">
      <div className="grid grid-cols-5 gap-3">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Format</p>
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
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Tags</p>
          <Combobox value={selectedTags} onValueChange={onTagsChange} multiple>
            <div ref={tagsAnchor} className="w-full">
              <ComboboxTrigger className="flex min-h-9 w-full cursor-pointer items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                <span className="flex flex-1 flex-wrap items-center gap-1.5">
                  {selectedTags.length === 0 ? (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Tag className="h-3.5 w-3.5 shrink-0" />
                      Filter by tags…
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
                              e.stopPropagation();
                              onTagsChange(selectedTags.filter((t) => t !== tag));
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
              <ComboboxInput placeholder="Search tags…" showTrigger={false} />
              <ComboboxList>
                {tags.map((tag) => (
                  <ComboboxItem key={tag} value={tag}>
                    {tag}
                  </ComboboxItem>
                ))}
                <ComboboxEmpty>No tags found</ComboboxEmpty>
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Date range</p>
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
                <span>Pick dates</span>
              )}
              {dateRange?.from && (
                <X
                  className="ml-auto h-3.5 w-3.5 opacity-60 hover:opacity-100"
                  onClick={(e) => { e.stopPropagation(); onDateRangeChange(undefined); }}
                />
              )}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={onDateRangeChange}
                numberOfMonths={2}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Location</p>
          <div className="flex h-9 items-center gap-1 rounded-md border border-input bg-background px-2 text-sm">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <Combobox
              value={location || null}
              onValueChange={(v) => onLocationChange(v ?? '')}
              onInputValueChange={onLocationChange}
            >
              <div ref={locationAnchor} className="w-full">
                <ComboboxInput
                  placeholder="Location…"
                  showTrigger={false}
                  showClear={location !== ''}
                  className="h-9 w-full border-none bg-transparent shadow-none has-[[data-slot=input-group-control]:focus-visible]:border-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-0"
                />
              </div>
              <ComboboxContent anchor={locationAnchor} align="start">
                <ComboboxList>
                  {cities.map((city) => (
                    <ComboboxItem key={city} value={city}>{city}</ComboboxItem>
                  ))}
                  <ComboboxEmpty>No locations found</ComboboxEmpty>
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Search</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search events…"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="h-9 pl-9"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
