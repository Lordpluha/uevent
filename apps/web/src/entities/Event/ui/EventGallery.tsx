import { useEffect, useState } from 'react';
import { Gallery, PhotoSwipe } from 'react-pswp';
import 'react-pswp/dist/index.css';
import type { GalleryImage } from '../model/eventEntity';

interface PswpItem {
  uid: number;
  src: string;
  msrc?: string;
  w: number;
  h: number;
  title?: string;
}

export function buildPswpContainer(images: GalleryImage[]): PswpItem[] {
  return images.map((img, i) => ({
    uid: i,
    src: img.src,
    msrc: img.msrc,
    w: img.w,
    h: img.h,
    title: img.title,
  }));
}

// ── Controlled lightbox (state owned by parent) ───────────────────────────────
export interface EventLightboxProps {
  images: GalleryImage[];
  index: number | null;
  open: boolean;
  onIndexChange: (i: number) => void;
  onOpenChange: (open: boolean) => void;
}

export function EventLightbox({ images, index, open, onIndexChange, onOpenChange }: EventLightboxProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted || images.length === 0 || !open) return null;

  return (
    <PhotoSwipe
      container={buildPswpContainer(images)}
      index={index ?? 0}
      open={open}
      onIndexChange={onIndexChange}
      onOpenChange={onOpenChange}
    />
  );
}

// ── Thumbnail grid that notifies parent on click ──────────────────────────────
export interface EventGalleryProps {
  images: GalleryImage[];
  onSelect: (index: number) => void;
}

export function EventGallery({ images, onSelect }: EventGalleryProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!images || images.length === 0) return null;

  if (!mounted) {
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {images.map((img) => (
          <div key={img.src} className="h-32 w-full animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <Gallery
      container={buildPswpContainer(images)}
      onClick={onSelect}
      wrapperClass="grid grid-cols-2 gap-2 sm:grid-cols-3"
      itemClass="overflow-hidden rounded-lg"
      imgClass="w-full h-32 object-cover cursor-pointer transition-opacity hover:opacity-80"
    />
  );
}
