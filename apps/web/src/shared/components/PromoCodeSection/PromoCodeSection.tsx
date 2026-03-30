import { useState } from 'react';
import { Tag, Check, X } from 'lucide-react';
import { Button, Input } from '@shared/components/ui';
import { useAppContext } from '@shared/lib';

interface PromoCodeSectionProps {
  onApplyPromo: (code: string, discountPercent: number) => void;
  onRemovePromo: () => void;
  appliedCode?: string;
  appliedDiscount?: number;
}

// Mock promo codes - можно заменить на реальный API запрос если понадобится
const VALID_PROMO_CODES: Record<string, number> = {
  'UEVENT15': 15,
  'UEVENT20': 20,
  'UEVENT10': 10,
  'SUMMER25': 25,
  'EARLY30': 30,
};

export function PromoCodeSection({
  onApplyPromo,
  onRemovePromo,
  appliedCode,
  appliedDiscount,
}: PromoCodeSectionProps) {
  const { t } = useAppContext();
  const [promoInput, setPromoInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) {
      setError(t.promoCode.enterCode);
      return;
    }

    setLoading(true);
    setError('');

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 300));

    const discount = VALID_PROMO_CODES[code];
    if (discount !== undefined) {
      onApplyPromo(code, discount);
      setPromoInput('');
    } else {
      setError(t.promoCode.invalidCode);
    }

    setLoading(false);
  };

  const handleRemove = () => {
    setPromoInput('');
    setError('');
    onRemovePromo();
  };

  // If promo is applied, show success state
  if (appliedCode && appliedDiscount) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900/30 dark:bg-green-950/20">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-200 dark:bg-green-900/40">
              <Check className="h-4 w-4 text-green-700 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-900 dark:text-green-200">
                {t.promoCode.applied.replace('{{code}}', appliedCode)}
              </p>
              <p className="text-xs text-green-700 dark:text-green-300">{t.promoCode.discountValue.replace('{{discount}}', String(appliedDiscount))}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="text-green-700 transition-colors hover:text-green-900 dark:text-green-300 dark:hover:text-green-200"
            aria-label={t.promoCode.remove}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/60 bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Tag className="h-4 w-4 text-muted-foreground" />
        <label htmlFor="promo-input" className="text-sm font-semibold text-foreground">
          {t.promoCode.label}
        </label>
      </div>
      <div className="flex gap-2">
        <Input
          id="promo-input"
          placeholder={t.promoCode.inputPlaceholder}
          value={promoInput}
          onChange={(e) => {
            setPromoInput(e.target.value);
            setError('');
          }}
          onKeyDown={(e) => e.key === 'Enter' && !loading && handleApply()}
          disabled={loading}
          className="text-sm"
        />
        <Button
          size="sm"
          onClick={handleApply}
          disabled={loading || !promoInput.trim()}
          variant="outline"
        >
          {loading ? t.promoCode.checking : t.promoCode.apply}
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      <p className="mt-2 text-xs text-muted-foreground">
        {t.promoCode.examples
          .replace('{{code1}}', 'UEVENT15')
          .replace('{{discount1}}', '15')
          .replace('{{code2}}', 'SUMMER25')
          .replace('{{discount2}}', '25')}
      </p>
    </div>
  );
}
