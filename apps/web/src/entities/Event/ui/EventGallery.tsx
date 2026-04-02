import { useMemo } from 'react';
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
  const container = useMemo(() => buildPswpContainer(images), [images]);

  // Always render so PhotoSwipe mounts with open=false — this avoids React 18
  // Strict Mode re-connecting effects while open=true (which crashes inside goTo
  // because items[index].center is not yet computed in the preload window).
  if (container.length === 0) return null;

  return (
    <PhotoSwipe
      container={container}
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
  if (!images || images.length === 0) return null;

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
