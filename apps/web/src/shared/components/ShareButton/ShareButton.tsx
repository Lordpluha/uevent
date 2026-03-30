import { Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@shared/components';
import { useAppContext } from '@shared/lib';

interface ShareButtonProps {
  url?: string;
  title?: string;
  text?: string;
  variant?: 'circle' | 'default';
  className?: string;
}

export function ShareButton({ url, title, text, variant = 'circle', className }: ShareButtonProps) {
  const { t } = useAppContext();
  const shareUrl = url ?? (typeof window !== 'undefined' ? window.location.href : '');

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
        return;
      } catch (err) {
        if ((err as DOMException)?.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(t.common.linkCopied);
    } catch {
      toast.error(t.common.copyFailed);
    }
  };

  if (variant === 'circle') {
    return (
      <button
        type="button"
        aria-label={t.common.share}
        onClick={handleShare}
        className={`flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-accent ${className ?? ''}`}
      >
        <Share2 className="h-4 w-4" />
      </button>
    );
  }

  return (
    <Button variant="outline" size="sm" className={`gap-1.5 ${className ?? ''}`} onClick={handleShare}>
      <Share2 className="h-4 w-4" />
      {t.common.share}
    </Button>
  );
}
