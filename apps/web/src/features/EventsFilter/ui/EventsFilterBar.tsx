import type { RefObject } from 'react';
import type { DateRange } from 'react-day-picker';
import { Search } from 'lucide-react';
import { Input } from '@shared/components';
import { useAppContext } from '@shared/lib';
import type { Format } from '../model/types';
import {
  FilterFormatField,
  FilterTagsField,
  FilterDateRangeField,
  FilterLocationField,
} from './FilterFields';

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
  const { t } = useAppContext();
  return (
    <div className="mb-8 hidden rounded-xl border border-border/60 bg-card p-4 lg:block">
      <div className="grid grid-cols-5 gap-3">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t.filters.format}</p>
          <FilterFormatField format={format} onFormatChange={onFormatChange} />
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t.filters.tags}</p>
          <FilterTagsField selectedTags={selectedTags} onTagsChange={onTagsChange} tagsAnchor={tagsAnchor} tags={tags} />
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t.filters.dateRange}</p>
          <FilterDateRangeField dateRange={dateRange} onDateRangeChange={onDateRangeChange} numberOfMonths={2} placeholder={t.filters.pickDates} />
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t.filters.location}</p>
          <FilterLocationField location={location} onLocationChange={onLocationChange} locationAnchor={locationAnchor} cities={cities} />
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
    </div>
  );
}
