import type { ChangeEvent } from 'react';
import { useRef } from 'react';
import { Camera, ImagePlus } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/components';
import { useAppContext } from '@shared/lib';
import { organizationsApi } from '@entities/Organization';
import type { OrgModel } from './types';

interface Props {
  org: OrgModel;
  invalidate: () => Promise<void>;
}

export function OrgBrandingSection({ org, invalidate }: Props) {
  const { t } = useAppContext();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const uploadLogoMutation = useMutation({
    mutationFn: (file: File) => organizationsApi.uploadLogo(org.id, file),
    onSuccess: async () => { await invalidate(); toast.success(t.orgAccount.branding.logoUpdated); },
    onError: () => toast.error(t.orgAccount.branding.logoFailed),
  });

  const uploadCoverMutation = useMutation({
    mutationFn: (file: File) => organizationsApi.uploadCover(org.id, file),
    onSuccess: async () => { await invalidate(); toast.success(t.orgAccount.branding.coverUpdated); },
    onError: () => toast.error(t.orgAccount.branding.coverFailed),
  });

  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadLogoMutation.mutate(file);
    e.target.value = '';
  };

  const handleCoverChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadCoverMutation.mutate(file);
    e.target.value = '';
  };

  return (
    <section className="mt-5 rounded-xl border border-border/60 bg-card p-5">
      <h2 className="text-base font-semibold">{t.orgAccount.branding.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t.orgAccount.branding.subtitle}</p>

      <div className="mt-4 space-y-4">
        <div className="relative h-36 w-full overflow-hidden rounded-xl border border-border/60 bg-muted">
          {org.coverUrl ? (
            <img src={org.coverUrl} alt={`${org.title} cover`} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-linear-to-br from-primary/20 via-primary/10 to-muted" />
          )}
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/40 text-white opacity-0 transition-opacity hover:opacity-100"
            disabled={uploadCoverMutation.isPending}
          >
            <ImagePlus className="h-5 w-5" />
            <span className="text-xs font-medium">
              {uploadCoverMutation.isPending ? t.orgAccount.branding.uploadingCover : t.orgAccount.branding.changeCover}
            </span>
          </button>
          <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-20 w-20 rounded-xl">
              <AvatarImage src={org.avatarUrl} alt={org.title} />
              <AvatarFallback className="rounded-xl text-xl font-semibold">{org.title[0]}</AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow"
              disabled={uploadLogoMutation.isPending}
              aria-label={t.orgAccount.branding.changeLogoAria}
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
          </div>
          <div>
            <p className="text-sm font-medium">{t.orgAccount.branding.logoLabel}</p>
            <p className="text-xs text-muted-foreground">
              {uploadLogoMutation.isPending ? t.orgAccount.branding.uploadingLogo : t.orgAccount.branding.logoHint}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
