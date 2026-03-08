import { Globe } from 'lucide-react';
import { useAppContext, type Locale } from '@shared/lib';

const LOCALES: Locale[] = ['en', 'ua'];
const LOCALE_LABELS: Record<Locale, string> = { en: 'EN', ua: 'UA' };

type Props = {
  /** 'pill' – horizontal rounded buttons (desktop header)
   *  'grid' – 2-column grid (mobile menu) */
  variant?: 'pill' | 'grid';
};

export const LocaleSwitcher = ({ variant = 'pill' }: Props) => {
  const { locale, setLocale } = useAppContext();

  if (variant === 'grid') {
    return (
      <div className="grid grid-cols-2 overflow-hidden rounded-md border border-border text-sm font-medium">
        {LOCALES.map((loc) => (
          <button
            key={loc}
            type="button"
            onClick={() => setLocale(loc)}
            className={`flex items-center justify-center gap-1.5 px-4 py-2 transition-colors ${
              locale === loc
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {LOCALE_LABELS[loc]}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center rounded-full border border-border text-sm font-medium">
      {LOCALES.map((loc, i) => (
        <button
          key={loc}
          type="button"
          onClick={() => setLocale(loc)}
          className={`flex items-center gap-1.5 px-3 py-2 transition-colors ${
            i === 0 ? 'rounded-l-full' : 'rounded-r-full'
          } ${
            locale === loc
              ? 'bg-foreground text-background'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {i === 0 && <Globe className="h-3.5 w-3.5" />}
          {LOCALE_LABELS[loc]}
        </button>
      ))}
    </div>
  );
};
