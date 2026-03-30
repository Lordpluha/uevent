import { useState } from 'react';
import { X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Field, FieldDescription, FieldTitle } from '@shared/components';
import { useAppContext } from '@shared/lib';
import { tagsApi } from '@shared/api';

interface Props {
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
}

export function EventTagsField({ tags, onAddTag, onRemoveTag }: Props) {
  const { t } = useAppContext();
  const [tagInput, setTagInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { data: tagsResult } = useQuery({ queryKey: ['tags'], queryFn: () => tagsApi.getAll({ limit: 100 }) });
  const allTags = tagsResult?.data ?? [];

  const addTag = (value: string) => {
    const trimmed = value.trim().replace(/,$/, '').trim();
    if (trimmed && !tags.includes(trimmed)) {
      onAddTag(trimmed);
    }
    setTagInput('');
  };

  return (
    <Field>
      <FieldTitle>{t.common.tags}</FieldTitle>
      <div className="flex flex-col gap-2">
        <div className="relative">
          <div
            className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-input bg-input/20 px-2 py-1"
            onClick={(e) => {
              const input = e.currentTarget.querySelector('input');
              input?.focus();
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
                  onClick={() => onRemoveTag(tag)}
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
                setTagInput(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setShowSuggestions(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  addTag(tagInput);
                  setShowSuggestions(false);
                } else if (e.key === 'Escape') {
                  setShowSuggestions(false);
                } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
                  onRemoveTag(tags[tags.length - 1]);
                }
              }}
              className="h-7 min-w-36 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              placeholder={tags.length ? t.eventCreate.tags.addMore : t.eventCreate.tags.searchOrCreate}
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
                    {t.eventCreate.tags.createTag.replace('{{name}}', trimmed)}
                  </button>
                )}
              </div>
            );
          })()}
        </div>
      </div>
      <FieldDescription>{t.eventCreate.tags.hint}</FieldDescription>
    </Field>
  );
}
