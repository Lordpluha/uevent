import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { Camera, ChevronLeft, ImagePlus, Save } from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  Separator,
  Textarea,
  Input,
  buttonVariants,
} from '@shared/components';
import { useOrg } from '@entities/Organization';
import { cn } from '@shared/lib/utils';

export function OrgEditPage() {
  const { id } = useParams();
  const { data: org, isLoading, isError } = useOrg(id ?? '');

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: org?.title ?? '',
    description: org?.description ?? '',
    location: org?.location ?? '',
    website: org?.website ?? '',
    category: org?.category ?? '',
  });

  useEffect(() => {
    if (!org) return;
    setForm({
      title: org.title ?? '',
      description: org.description ?? '',
      location: org.location ?? '',
      website: org.website ?? '',
      category: org.category ?? '',
    });
  }, [org]);

  if (isLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading organization...</p>
      </main>
    );
  }

  if (!org || isError) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-5xl">🏢</p>
        <h1 className="text-xl font-semibold">Organization not found</h1>
        <Link to="/" className="text-sm text-primary hover:underline">
          ← Back to home
        </Link>
      </main>
    );
  }

  const set =
    (field: keyof typeof form) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleFileChange =
    (label: string) => (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        // TODO: upload file
        console.log(`${label} selected:`, file.name);
      }
    };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // TODO: api.patch(`/organizations/${id}`, form)
    alert('Saved!');
  };

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <Link
        to={`/organizations/${id}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to organization
      </Link>

      <h1 className="mb-1 text-2xl font-extrabold tracking-tight">Edit organization</h1>
      <p className="mb-8 text-sm text-muted-foreground">{org.title}</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cover image */}
        <div className="relative h-32 w-full overflow-hidden rounded-xl border border-border/60 bg-muted">
          {org.coverUrl && (
            <img src={org.coverUrl} alt="Cover" className="h-full w-full object-cover" />
          )}
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/40 text-white opacity-0 transition-opacity hover:opacity-100"
          >
            <ImagePlus className="h-5 w-5" />
            <span className="text-xs font-medium">Change cover</span>
          </button>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange('Cover')}
          />
        </div>

        {/* Logo */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-20 w-20 rounded-xl">
              <AvatarImage src={org.avatarUrl} alt={org.title} />
              <AvatarFallback className="rounded-xl text-xl">{org.title[0]}</AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow"
              title="Change logo"
            >
              <Camera className="h-3 w-3" />
            </button>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange('Logo')}
            />
          </div>
          <div>
            <p className="text-sm font-medium">Organization logo</p>
            <p className="text-xs text-muted-foreground">Square image · JPG, PNG · max 2 MB</p>
          </div>
        </div>

        <Separator />

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="title">Organization name</FieldLabel>
            <Input
              id="title"
              value={form.title}
              onChange={set('title')}
              placeholder="My Organization"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="description">Description</FieldLabel>
            <Textarea
              id="description"
              value={form.description}
              onChange={set('description')}
              placeholder="What is your organization about?"
              className="min-h-28"
            />
            <FieldDescription>Max 1000 characters.</FieldDescription>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="category">Category</FieldLabel>
              <Input
                id="category"
                value={form.category}
                onChange={set('category')}
                placeholder="Technology"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="location">Location</FieldLabel>
              <Input
                id="location"
                value={form.location}
                onChange={set('location')}
                placeholder="City, Country"
              />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="website">Website</FieldLabel>
            <Input
              id="website"
              value={form.website}
              onChange={set('website')}
              placeholder="https://your-org.com"
            />
            <FieldDescription>Public URL shown on your organization page.</FieldDescription>
          </Field>
        </FieldGroup>

        <Separator />

        <div className="flex justify-end gap-3">
          <Link to={`/organizations/${id}`} className={cn(buttonVariants({ variant: 'ghost' }))}>
            Cancel
          </Link>
          <Button type="submit" className="gap-1.5">
            <Save className="h-3.5 w-3.5" />
            Save changes
          </Button>
        </div>
      </form>
    </main>
  );
}
