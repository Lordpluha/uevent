import type { UpdateEventDto } from '@entities/Event'
import { Field, FieldTitle, Input } from '@shared/components'
import { X } from 'lucide-react'
import { useState } from 'react'
import type { UseFormSetValue, UseFormWatch } from 'react-hook-form'

interface EventEditTagsFieldProps {
  watch: UseFormWatch<UpdateEventDto>
  setValue: UseFormSetValue<UpdateEventDto>
}

export function EventEditTagsField({ watch, setValue }: EventEditTagsFieldProps) {
  const [tagInput, setTagInput] = useState('')
  const tags = watch('tags') ?? []

  const addTag = (value: string) => {
    const trimmed = value.trim().replace(/,$/, '').trim()
    if (trimmed && !tags.includes(trimmed)) {
      setValue('tags', [...tags, trimmed])
    }
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    setValue(
      'tags',
      tags.filter((t) => t !== tag),
    )
  }

  return (
    <Field>
      <FieldTitle>Tags</FieldTitle>
      <div className="flex flex-col gap-2">
        <Input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault()
              addTag(tagInput)
            }
          }}
          onBlur={() => tagInput && addTag(tagInput)}
          placeholder="Add tag and press Enter…"
        />
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-0.5 rounded-full text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={`Remove ${tag}`}
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </Field>
  )
}
