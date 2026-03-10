import type { RefObject } from 'react';
import { format as formatDate } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { CalendarDays, MapPin, Search, SlidersHorizontal, Tag, X } from 'lucide-react';
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
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@shared/components';
import {
  FORMAT_OPTIONS,
  ALL_TAGS,
  ALL_CITIES,
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
  activeFilterCount: number;
  onClearAll: () => void;
  resultCount: number;
  tagsAnchor: RefObject<HTMLDivElement | null>;
  locFromAnchor: RefObject<HTMLDivElement | null>;
  locToAnchor: RefObject<HTMLDivElement | null>;
}

export function EventsMobileFilters({
  query, onQueryChange,
  format, onFormatChange,
  selectedTags, onTagsChange,
  dateRange, onDateRangeChange,
  locFrom, onLocFromChange,
  locTo, onLocToChange,
  activeFilterCount, onClearAll,
  resultCount,
  tagsAnchor, locFromAnchor, locToAnchor,
}: Props) {
  return (
    <div className="mb-6 flex items-center gap-3 sm:hidden">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search events…"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="h-10 w-full rounded-full border border-border bg-card pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Filters sheet trigger */}
      <Sheet>
        <SheetTrigger
          render={
            <button
              type="button"
              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-background shadow-sm transition-colors hover:bg-accent"
            />
          }
        >
          <SlidersHorizontal className="h-4 w-4 text-foreground" />
          {activeFilterCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </SheetTrigger>

        <SheetContent side="bottom" showCloseButton={false} className="max-h-[85vh] rounded-t-2xl px-0 pb-0">
          <div className="mx-auto mb-2 mt-3 h-1.5 w-12 shrink-0 rounded-full bg-muted" />
          <SheetHeader className="flex flex-row items-center justify-between px-4 pb-2 pt-0">
            <SheetTitle>Filters</SheetTitle>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                Clear all
              </button>
            )}
          </SheetHeader>

          <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-8">
            {/* Format */}
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Format</p>
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
            </div>

            {/* Tags */}
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Tags</p>
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
                    {ALL_TAGS.map((tag) => (
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
                    <span>Pick a date range</span>
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
                    numberOfMonths={1}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Location */}
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Location</p>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 rounded-md border border-input bg-background px-2 text-sm">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <Combobox
                    value={locFrom || null}
                    onValueChange={(v) => onLocFromChange(v ?? '')}
                    onInputValueChange={onLocFromChange}
                  >
                    <div ref={locFromAnchor} className="flex-1">
                      <ComboboxInput
                        placeholder="From city…"
                        showTrigger={false}
                        showClear={locFrom !== ''}
                        className="h-9 w-full border-none bg-transparent shadow-none has-[[data-slot=input-group-control]:focus-visible]:border-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-0"
                      />
                    </div>
                    <ComboboxContent anchor={locFromAnchor} align="start">
                      <ComboboxList>
                        {ALL_CITIES.map((city) => (
                          <ComboboxItem key={city} value={city}>{city}</ComboboxItem>
                        ))}
                        <ComboboxEmpty>No cities found</ComboboxEmpty>
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </div>

                <div className="flex items-center gap-2 rounded-md border border-input bg-background px-2 text-sm">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <Combobox
                    value={locTo || null}
                    onValueChange={(v) => onLocToChange(v ?? '')}
                    onInputValueChange={onLocToChange}
                  >
                    <div ref={locToAnchor} className="flex-1">
                      <ComboboxInput
                        placeholder="To city…"
                        showTrigger={false}
                        showClear={locTo !== ''}
                        className="h-9 w-full border-none bg-transparent shadow-none has-[[data-slot=input-group-control]:focus-visible]:border-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-0"
                      />
                    </div>
                    <ComboboxContent anchor={locToAnchor} align="start">
                      <ComboboxList>
                        {ALL_CITIES.map((city) => (
                          <ComboboxItem key={city} value={city}>{city}</ComboboxItem>
                        ))}
                        <ComboboxEmpty>No cities found</ComboboxEmpty>
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </div>
              </div>
            </div>

            {/* Apply button */}
            <SheetClose
              render={
                <button
                  type="button"
                  className="mt-2 h-10 w-full rounded-full bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                />
              }
            >
              Show {resultCount} result{resultCount !== 1 ? 's' : ''}
            </SheetClose>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
