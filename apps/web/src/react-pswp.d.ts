declare module 'react-pswp' {
  import type { ComponentType } from 'react';

  export interface PswpItem {
    uid: number;
    src: string;
    msrc?: string;
    w: number;
    h: number;
    title?: string;
  }

  export interface GalleryProps {
    container: PswpItem[];
    onClick?: (index: number) => void;
    wrapperClass?: string;
    itemClass?: string;
    imgClass?: string;
  }

  export interface PhotoSwipeProps {
    container: PswpItem[];
    index: number | null;
    open: boolean;
    onIndexChange?: (index: number) => void;
    onOpenChange?: (open: boolean) => void;
    theme?: {
      foreground?: string;
      background?: string;
    };
  }

  export const Gallery: ComponentType<GalleryProps>;
  export const PhotoSwipe: ComponentType<PhotoSwipeProps>;
}

declare module 'react-pswp/dist/index.css' {
  const content: unknown;
  export default content;
}
