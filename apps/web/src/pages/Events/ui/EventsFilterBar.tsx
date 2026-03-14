import type { RefObject } from 'react';
import { format as formatDate } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { ArrowRight, CalendarDays, MapPin, Search, Tag, X } from 'lucide-react';
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
  locFrom: string;
  onLocFromChange: (v: string) => void;
  locTo: string;
  onLocToChange: (v: string) => void;
  tagsAnchor: RefObject<HTMLDivElement | null>;
  locFromAnchor: RefObject<HTMLDivElement | null>;
  locToAnchor: RefObject<HTMLDivElement | null>;
  tags: string[];
  cities: string[];
}

export function EventsFilterBar({
  query, onQueryChange,
  format, onFormatChange,
  selectedTags, onTagsChange,
  dateRange, onDateRangeChange,
  locFrom, onLocFromChange,
  locTo, onLocToChange,
  tagsAnchor, locFromAnchor, locToAnchor,
  tags,
  cities,
}: Props) {
  return (
    <div className="mb-8 hidden flex-wrap items-center gap-3 sm:flex">
      {/* Format pills */}
      <div className="flex gap-2">
        {FORMAT_OPTIONS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => onFormatChange(f.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              format === f.value
                ? 'bg-primary text-primary-foreground'
                : 'border border-border text-muted-foreground hover:border-primary/60 hover:text-foreground'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Tags combobox */}
      <div className="min-w-40 max-w-72">
        <Combobox value={selectedTags} onValueChange={onTagsChange} multiple>
          <div ref={tagsAnchor} className="w-full">
            <ComboboxTrigger className="flex min-h-9 w-full cursor-pointer flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring">
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

      {/* Date range */}
      <Popover>
        <PopoverTrigger
          className={`flex h-9 items-center gap-2 rounded-md border px-3 text-sm transition-colors ${
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
            <span>Date range</span>
          )}
          {dateRange?.from && (
            <X
              className="ml-1 h-3.5 w-3.5 opacity-60 hover:opacity-100"
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

      {/* Location from → to */}
      <div className="flex h-9 items-center gap-1 rounded-md border border-input bg-background px-2 text-sm">
        <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <Combobox
          value={locFrom || null}
          onValueChange={(v) => onLocFromChange(v ?? '')}
          onInputValueChange={onLocFromChange}
        >
          <div ref={locFromAnchor}>
            <ComboboxInput
              placeholder="From city…"
              showTrigger={false}
              showClear={locFrom !== ''}
              className="h-9 w-28 border-none bg-transparent shadow-none has-[[data-slot=input-group-control]:focus-visible]:border-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-0"
            />
          </div>
          <ComboboxContent anchor={locFromAnchor} align="start">
            <ComboboxList>
              {cities.map((city) => (
                <ComboboxItem key={city} value={city}>{city}</ComboboxItem>
              ))}
              <ComboboxEmpty>No cities found</ComboboxEmpty>
            </ComboboxList>
          </ComboboxContent>
        </Combobox>

        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />

        <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <Combobox
          value={locTo || null}
          onValueChange={(v) => onLocToChange(v ?? '')}
          onInputValueChange={onLocToChange}
        >
          <div ref={locToAnchor}>
            <ComboboxInput
              placeholder="To city…"
              showTrigger={false}
              showClear={locTo !== ''}
              className="h-9 w-28 border-none bg-transparent shadow-none has-[[data-slot=input-group-control]:focus-visible]:border-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-0"
            />
          </div>
          <ComboboxContent anchor={locToAnchor} align="start">
            <ComboboxList>
              {cities.map((city) => (
                <ComboboxItem key={city} value={city}>{city}</ComboboxItem>
              ))}
              <ComboboxEmpty>No cities found</ComboboxEmpty>
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>

      {/* Search */}
      <div className="relative ml-auto w-56">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search events…"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="h-9 w-full rounded-full border border-border bg-card pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
    </div>
  );
}
