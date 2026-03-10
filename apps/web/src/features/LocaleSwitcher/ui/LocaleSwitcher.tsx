import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components';
import { useAppContext, type Locale } from '@shared/lib';

const LOCALES: { value: Locale; label: string; flag: string }[] = [
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'ua', label: 'Українська', flag: '🇺🇦' },
];

export const LocaleSwitcher = () => {
  const { locale, setLocale } = useAppContext();
  const current = LOCALES.find((l) => l.value === locale);

  return (
    <Select value={locale} onValueChange={(value) => setLocale(value as Locale)}>
      <SelectTrigger
        aria-label="Select language"
        className="!h-auto rounded-full border-border bg-transparent px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
      >
        <span>{current?.flag}</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {LOCALES.map(({ value, label, flag }) => (
          <SelectItem key={value} value={value}>
            <span>{flag}</span>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
