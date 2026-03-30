import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components';
import { useAppContext, type Locale } from '@shared/lib';

export const LocaleSwitcher = () => {
  const { locale, setLocale, t } = useAppContext();
  const locales: { value: Locale; label: string; flag: string }[] = [
    { value: 'en', label: t.localeSwitcher.english, flag: '🇬🇧' },
    { value: 'ua', label: t.localeSwitcher.ukrainian, flag: '🇺🇦' },
  ];
  const current = locales.find((l) => l.value === locale);

  return (
    <Select value={locale} onValueChange={(value) => setLocale(value as Locale)}>
      <SelectTrigger
        aria-label={t.localeSwitcher.selectLanguage}
        className="!h-auto rounded-full border-border bg-transparent px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
      >
        <span>{current?.flag}</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {locales.map(({ value, label, flag }) => (
          <SelectItem key={value} value={value}>
            <span>{flag}</span>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
