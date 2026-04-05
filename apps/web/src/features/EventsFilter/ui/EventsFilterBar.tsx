import type { SortBy, SortOrder } from '@pages/Events/model/useEventsFilters'
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components'
import { useAppContext } from '@shared/lib'
import { Search } from 'lucide-react'
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
  tagsAnchor: RefObject<HTMLDivElement | null>
  locationAnchor: RefObject<HTMLDivElement | null>
  tags: string[]
  cities: string[]
  sortBy: SortBy
  onSortByChange: (v: SortBy) => void
  sortOrder: SortOrder
  onSortOrderChange: (v: SortOrder) => void
}

export function EventsFilterBar({
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
    <div className="mb-8 hidden rounded-xl border border-border/60 bg-card p-4 lg:block">
      <div className="grid grid-cols-5 gap-3">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t.filters.format}</p>
          <FilterFormatField format={format} onFormatChange={onFormatChange} />
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t.filters.tags}</p>
          <FilterTagsField
            selectedTags={selectedTags}
            onTagsChange={onTagsChange}
            tagsAnchor={tagsAnchor}
            tags={tags}
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t.filters.dateRange}
          </p>
          <FilterDateRangeField
            dateRange={dateRange}
            onDateRangeChange={onDateRangeChange}
            numberOfMonths={2}
            placeholder={t.filters.pickDates}
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t.filters.location}</p>
          <FilterLocationField
            location={location}
            onLocationChange={onLocationChange}
            locationAnchor={locationAnchor}
            cities={cities}
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t.filters.search}</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t.filters.searchPlaceholder}
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="h-9 pl-9"
            />
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3 border-t border-border/40 pt-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground shrink-0">
          {t.filters.sortBy}:
        </p>
        <Select value={sortBy} onValueChange={(v) => onSortByChange(v as SortBy)}>
          <SelectTrigger className="h-9 w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">{t.filters.sortDate}</SelectItem>
            <SelectItem value="name">{t.filters.sortName}</SelectItem>
            <SelectItem value="attendees">{t.filters.sortAttendees}</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground shrink-0">
          {t.filters.sortOrder}:
        </p>
        <Select value={sortOrder} onValueChange={(v) => onSortOrderChange(v as SortOrder)}>
          <SelectTrigger className="h-9 w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">{t.filters.sortAsc}</SelectItem>
            <SelectItem value="desc">{t.filters.sortDesc}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
