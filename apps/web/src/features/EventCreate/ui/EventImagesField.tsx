import { useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { PhotoSwipe } from 'react-pswp';
import 'react-pswp/dist/index.css';

import { Field, FieldDescription, FieldTitle } from '@shared/components';

export type CoverFileEntry = { file: File; preview: string; w: number; h: number };

interface Props {
  coverFiles: CoverFileEntry[];
  setCoverFiles: React.Dispatch<React.SetStateAction<CoverFileEntry[]>>;
}

export function EventImagesField({ coverFiles, setCoverFiles }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addCoverFiles = (incoming: FileList | File[]) => {
    const imageFiles = Array.from(incoming).filter((f) => f.type.startsWith('image/'));
    if (!imageFiles.length) return;
    const existing = [...coverFiles];
    const toAdd = imageFiles
      .filter((f) => existing.length + imageFiles.indexOf(f) < 20)
      .filter((f) => !existing.some((e) => e.file.name === f.name && e.file.size === f.size));
    if (!toAdd.length) return;

    const loadEntry = (file: File): Promise<CoverFileEntry> =>
      new Promise((resolve) => {
        const preview = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => resolve({ file, preview, w: img.naturalWidth, h: img.naturalHeight });
        img.onerror = () => resolve({ file, preview, w: 800, h: 600 });
        img.src = preview;
      });

    void Promise.all(toAdd.map(loadEntry)).then((entries) => {
      setCoverFiles((prev) => [...prev, ...entries].slice(0, 20));
    });
  };

  const removeCoverFile = (index: number) => {
    setCoverFiles((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    addCoverFiles(e.dataTransfer.files);
  };

  return (
    <Field>
      <FieldTitle>Images</FieldTitle>
      <div className="flex flex-col gap-3">
        {coverFiles.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {coverFiles.map(({ preview }, index) => (
              <div key={preview} className="relative aspect-square overflow-hidden rounded-lg border border-border/60">
                <img
                  src={preview}
                  alt={`Image ${index + 1}`}
                  className="h-full w-full cursor-zoom-in object-cover transition-opacity hover:opacity-80"
                  onClick={() => { setLightboxIndex(index); setLightboxOpen(true); }}
                />
                <button
                  type="button"
                  onClick={() => removeCoverFile(index)}
                  className="absolute right-1 top-1 rounded-full bg-background/80 p-0.5 text-muted-foreground backdrop-blur-sm hover:text-foreground"
                  aria-label="Remove image"
                >
                  <X className="size-3.5" />
                </button>
                {index === 0 && (
                  <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    Cover
                  </span>
                )}
              </div>
            ))}
            {coverFiles.length < 20 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border/60 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
              >
                <ImagePlus className="size-5" />
                <span className="text-xs">Add</span>
              </button>
            )}
          </div>
        )}
        {coverFiles.length === 0 && (
          <div
            className={`flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
              isDragging ? 'border-primary bg-primary/5' : 'border-border/60 bg-muted/20 hover:border-primary/50 hover:bg-primary/5'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center gap-2 p-6 text-center">
              <ImagePlus className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">Drag & drop photos or click to browse</p>
              <p className="text-xs text-muted-foreground">PNG, JPG, WebP · up to 20 files · 10 MB each</p>
            </div>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => { if (e.target.files) addCoverFiles(e.target.files); e.target.value = ''; }}
        />
      </div>
      {coverFiles.length > 0 && (
        <FieldDescription>First image is used as the cover. Drag images to the drop zone to add more.</FieldDescription>
      )}

      {lightboxOpen && coverFiles.length > 0 && (
        <PhotoSwipe
          container={coverFiles.map(({ preview, w, h }, i) => ({ uid: i, src: preview, w, h }))}
          index={lightboxIndex}
          open={lightboxOpen}
          onIndexChange={setLightboxIndex}
          onOpenChange={setLightboxOpen}
        />
      )}
    </Field>
  );
}
