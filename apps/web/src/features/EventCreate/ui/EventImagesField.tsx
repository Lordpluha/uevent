import { useRef, useState, type Dispatch, type SetStateAction, type DragEvent, type KeyboardEvent } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { PhotoSwipe } from 'react-pswp';
import 'react-pswp/dist/index.css';

import { Field, FieldDescription, FieldTitle } from '@shared/components';
import { useAppContext } from '@shared/lib';

export type CoverFileEntry = { file: File; preview: string; w: number; h: number };

interface Props {
  coverFiles: CoverFileEntry[];
  setCoverFiles: Dispatch<SetStateAction<CoverFileEntry[]>>;
}

export function EventImagesField({ coverFiles, setCoverFiles }: Props) {
  const { t } = useAppContext();
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

  const handleDrop = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDragging(false);
    addCoverFiles(e.dataTransfer.files);
  };

  const handlePreviewKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setLightboxIndex(index);
      setLightboxOpen(true);
    }
  };

  return (
    <Field>
      <FieldTitle>{t.eventCreate.images.label}</FieldTitle>
      <div className="flex flex-col gap-3">
        {coverFiles.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {coverFiles.map(({ preview }, index) => (
              <div key={preview} className="relative aspect-square overflow-hidden rounded-lg border border-border/60">
                <button
                  type="button"
                  className="h-full w-full cursor-zoom-in"
                  onClick={() => {
                    setLightboxIndex(index);
                    setLightboxOpen(true);
                  }}
                  onKeyDown={(event) => handlePreviewKeyDown(event, index)}
                  aria-label={t.eventCreate.images.imageAlt.replace('{{index}}', String(index + 1))}
                >
                  <img
                    src={preview}
                    alt={t.eventCreate.images.imageAlt.replace('{{index}}', String(index + 1))}
                    className="h-full w-full object-cover transition-opacity hover:opacity-80"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => removeCoverFile(index)}
                  className="absolute right-1 top-1 rounded-full bg-background/80 p-0.5 text-muted-foreground backdrop-blur-sm hover:text-foreground"
                  aria-label={t.eventCreate.images.removeImage}
                >
                  <X className="size-3.5" />
                </button>
                {index === 0 && (
                  <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    {t.eventCreate.images.cover}
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
                <span className="text-xs">{t.eventCreate.images.add}</span>
              </button>
            )}
          </div>
        )}
        {coverFiles.length === 0 && (
          <button
            type="button"
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
              <p className="text-sm font-medium">{t.eventCreate.images.dragDrop}</p>
              <p className="text-xs text-muted-foreground">{t.eventCreate.images.hint}</p>
            </div>
          </button>
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
        <FieldDescription>{t.eventCreate.images.coverHint}</FieldDescription>
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
