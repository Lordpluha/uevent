import type { ChangeEvent } from 'react';
import { useRef } from 'react';
import { Camera, ImagePlus } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@shared/components';
import { organizationsApi } from '@entities/Organization';
import { useAppContext } from '@shared/lib';

interface OrgEditBrandingProps {
  orgId: string;
  orgTitle: string;
  avatarUrl?: string;
  coverUrl?: string;
}

export function OrgEditBranding({ orgId, orgTitle, avatarUrl, coverUrl }: OrgEditBrandingProps) {
  const { t } = useAppContext();
  const queryClient = useQueryClient();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const uploadLogoMutation = useMutation({
    mutationFn: (file: File) => organizationsApi.uploadLogo(orgId, file),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['organizations', orgId] });
      toast.success(t.orgEdit.logoUpdated);
    },
    onError: () => toast.error(t.orgEdit.logoFailed),
  });

  const uploadCoverMutation = useMutation({
    mutationFn: (file: File) => organizationsApi.uploadCover(orgId, file),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['organizations', orgId] });
      toast.success(t.orgEdit.coverUpdated);
    },
    onError: () => toast.error(t.orgEdit.coverFailed),
  });

  const handleFileChange = (label: 'Logo' | 'Cover') => (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (label === 'Logo') uploadLogoMutation.mutate(file);
      else uploadCoverMutation.mutate(file);
    }
    e.target.value = '';
  };

  return (
    <>
      {/* Cover image */}
      <div className="relative h-32 w-full overflow-hidden rounded-xl border border-border/60 bg-muted">
        {coverUrl && (
          <img src={coverUrl} alt={t.orgEdit.coverAlt} className="h-full w-full object-cover" />
        )}
        <button
          type="button"
          onClick={() => coverInputRef.current?.click()}
          className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/40 text-white opacity-0 transition-opacity hover:opacity-100"
        >
          <ImagePlus className="h-5 w-5" />
          <span className="text-xs font-medium">{t.orgEdit.changeCover}</span>
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
            <AvatarImage src={avatarUrl} alt={orgTitle} />
            <AvatarFallback className="rounded-xl text-xl">{orgTitle[0]}</AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => logoInputRef.current?.click()}
            className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow"
            title={t.orgEdit.changeLogo}
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
            <p className="text-sm font-medium">{t.orgEdit.logoLabel}</p>
          <p className="text-xs text-muted-foreground">{t.orgEdit.logoHint}</p>
        </div>
      </div>
    </>
  );
}
