import { create } from 'zustand';
import type { Locale } from './i18n';

type Win = Window & { __LOCALE__?: Locale };

type LocaleStore = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const getInitialLocale = (): Locale => {
  if (typeof window === 'undefined') return 'en';
  return (window as Win).__LOCALE__ ?? 'en';
};

export const useLocaleStore = create<LocaleStore>((set) => ({
  locale: getInitialLocale(),
  setLocale: (locale) => {
    localStorage.setItem('locale', locale);
    set({ locale });
  },
}));
