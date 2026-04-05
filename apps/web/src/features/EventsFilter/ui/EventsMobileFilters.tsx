import type { SortBy, SortOrder } from '@pages/Events/model/useEventsFilters'
import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@shared/components'
import { useAppContext } from '@shared/lib'
import { Search, SlidersHorizontal } from 'lucide-react'
import type { RefObject } from 'react'
import type { DateRange } from 'react-day-picker'
import type { Format } from '../model/types'
import { FilterDateRangeField, FilterFormatField, FilterLocationField, FilterTagsField } from './FilterFields'

interface Props {
  query: string
  onQueryChange: (v: string) => void
  format: Format
  onFormatChange: (v: Format) => void
  selectedTags: string[]
  onTagsChange: (v: string[]) => void
  dateRange: DateRange | undefined
  onDateRangeChange: (v: DateRange | undefined) => void
  location: string
  onLocationChange: (v: string) => void
  activeFilterCount: number
  onClearAll: () => void
  resultCount: number
  tagsAnchor: RefObject<HTMLDivElement | null>
  locationAnchor: RefObject<HTMLDivElement | null>
  tags: string[]
  cities: string[]
  sortBy: SortBy
  onSortByChange: (v: SortBy) => void
  sortOrder: SortOrder
  onSortOrderChange: (v: SortOrder) => void
}

export function EventsMobileFilters({
  query,
  onQueryChange,
  format,
  onFormatChange,
  selectedTags,
  onTagsChange,
  dateRange,
  onDateRangeChange,
  location,
  onLocationChange,
  activeFilterCount,
  onClearAll,
  resultCount,
  tagsAnchor,
  locationAnchor,
  tags,
  cities,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
}: Props) {
  const { t } = useAppContext()
  return (
    <div className="mb-6 flex items-center gap-3 lg:hidden">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder={t.filters.searchPlaceholder}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="h-10 w-full pl-9"
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
            <SheetTitle>{t.filters.filtersTitle}</SheetTitle>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                {t.filters.clearAll}
              </button>
            )}
          </SheetHeader>

          <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-8">
            {/* Format */}
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t.filters.format}
              </p>
              <FilterFormatField format={format} onFormatChange={onFormatChange} />
            </div>

            {/* Tags */}
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t.filters.tags}</p>
              <FilterTagsField
                selectedTags={selectedTags}
                onTagsChange={onTagsChange}
                tagsAnchor={tagsAnchor}
                tags={tags}
              />
            </div>

            {/* Date range */}
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t.filters.dateRange}
              </p>
              <FilterDateRangeField dateRange={dateRange} onDateRangeChange={onDateRangeChange} />
            </div>

            {/* Location */}
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t.filters.location}
              </p>
              <FilterLocationField
                location={location}
                onLocationChange={onLocationChange}
                locationAnchor={locationAnchor}
                cities={cities}
              />
            </div>

            {/* Sort */}
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t.filters.sortBy}
              </p>
              <Select value={sortBy} onValueChange={(v) => onSortByChange(v as SortBy)}>
                <SelectTrigger className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">{t.filters.sortDate}</SelectItem>
                  <SelectItem value="name">{t.filters.sortName}</SelectItem>
                  <SelectItem value="attendees">{t.filters.sortAttendees}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t.filters.sortOrder}
              </p>
              <Select value={sortOrder} onValueChange={(v) => onSortOrderChange(v as SortOrder)}>
                <SelectTrigger className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">{t.filters.sortAsc}</SelectItem>
                  <SelectItem value="desc">{t.filters.sortDesc}</SelectItem>
                </SelectContent>
              </Select>
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
              {t.filters.showResults.replace('{{count}}', String(resultCount))}
            </SheetClose>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
