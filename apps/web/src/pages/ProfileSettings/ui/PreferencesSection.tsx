import type { FormEvent } from 'react';
import { useState } from 'react';
import { Check, Clock, Save, Tag, X } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Badge,
  Button,
  Field,
  FieldDescription,
  FieldLabel,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@shared/components';
import { usersApi } from '@entities/User';
import { tagsApi } from '@shared/api';
import type { UserProfile } from './types';

let TZ_LIST: string[] = [];
try {
  TZ_LIST = Intl.supportedValuesOf('timeZone');
} catch {
  TZ_LIST = [
    'UTC', 'America/New_York', 'America/Chicago', 'America/Denver',
    'America/Los_Angeles', 'Europe/London', 'Europe/Paris',
    'Europe/Berlin', 'Europe/Kyiv', 'Asia/Tokyo', 'Asia/Shanghai',
    'Asia/Kolkata', 'Australia/Sydney',
  ];
}

interface PreferencesSectionProps {
  user: UserProfile;
  invalidateUser: () => Promise<void>;
}

export function PreferencesSection({ user, invalidateUser }: PreferencesSectionProps) {
  const [timezone, setTimezone] = useState(user.timezone ?? '');
  const [selectedTags, setSelectedTags] = useState<string[]>(user.interests ?? []);

  const { data: tagsResult } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagsApi.getAll({ limit: 100 }),
  });
  const allTags = tagsResult?.data ?? [];

  const preferencesMutation = useMutation({
    mutationFn: () =>
      usersApi.updateMe({
        timezone: timezone || undefined,
        interests: selectedTags,
      }),
    onSuccess: async () => { await invalidateUser(); toast.success('Preferences saved'); },
    onError: () => toast.error('Failed to save preferences'),
  });

  const toggleTag = (name: string) => {
    setSelectedTags((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name],
    );
  };

  const handlePreferencesSubmit = (e: FormEvent) => {
    e.preventDefault();
    preferencesMutation.mutate();
  };

  return (
    <form onSubmit={handlePreferencesSubmit} className="space-y-6">
      {/* Timezone */}
      <Field>
        <FieldLabel htmlFor="timezone">
          <Clock className="inline h-3.5 w-3.5" /> Timezone
        </FieldLabel>
        <Select value={timezone} onValueChange={(v) => setTimezone(v ?? '')}>
          <SelectTrigger id="timezone" className="w-full" size="default">
            <SelectValue placeholder="Select your timezone…" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            <SelectGroup>
              <SelectLabel>Timezones</SelectLabel>
              {TZ_LIST.map((tz) => (
                <SelectItem key={tz} value={tz}>{tz}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <FieldDescription>Used to display event times in your local time.</FieldDescription>
      </Field>

      {/* Favorite tags */}
      <Field>
        <FieldLabel>
          <Tag className="inline h-3.5 w-3.5" /> Favorite topics
        </FieldLabel>
        <FieldDescription className="mb-3">
          Select topics you're interested in to get better event recommendations.
        </FieldDescription>
        <div className="flex flex-wrap gap-2">
          {allTags.length === 0 && (
            <p className="text-xs text-muted-foreground">No tags available.</p>
          )}
          {allTags.map((tag) => {
            const selected = selectedTags.includes(tag.name);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.name)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                  selected
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                    : 'border-border/60 bg-card text-muted-foreground hover:border-primary/50 hover:bg-accent'
                }`}
                aria-pressed={selected}
              >
                {selected ? <Check className="h-3 w-3" /> : null}
                {tag.name}
              </button>
            );
          })}
        </div>
        {selectedTags.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Selected:</span>
            {selectedTags.map((t) => (
              <Badge
                key={t}
                variant="secondary"
                className="gap-1 pr-1 cursor-pointer"
                onClick={() => toggleTag(t)}
              >
                {t}
                <X className="h-3 w-3" />
              </Badge>
            ))}
          </div>
        )}
      </Field>

      <div className="flex justify-end">
        <Button type="submit" className="gap-1.5" disabled={preferencesMutation.isPending}>
          <Save className="h-3.5 w-3.5" />
          {preferencesMutation.isPending ? 'Saving…' : 'Save preferences'}
        </Button>
      </div>
    </form>
  );
}
