export type Locale = 'en' | 'ua';

/**
 * Explicit Dictionary type matching the structure of public/locales/*.json.
 * This is the single source of truth for translation keys — update here
 * whenever you add a new key to the JSON files.
 */
export type Dictionary = {
  header: {
    nav: { events: string; organizations: string; tickets: string };
    actions: {
      dark: string;
      light: string;
      darkTheme: string;
      lightTheme: string;
      searchEvents: string;
      startGroup: string;
      login: string;
    };
    search: {
      placeholder: string;
      empty: string;
      groups: { events: string; organizations: string };
    };
    menu: { open: string; close: string };
  };
  auth: {
    tabs: {
      user: string;
      organization: string;
    };
    login: {
      title: string;
      subtitle: string;
      email: string;
      emailPlaceholder: string;
      password: string;
      passwordPlaceholder: string;
      submit: string;
      noAccount: string;
      switchToRegister: string;
      continueWithGoogle: string;
      orDivider: string;
    };
    orgLogin: {
      title: string;
      subtitle: string;
      email: string;
      emailPlaceholder: string;
      password: string;
      passwordPlaceholder: string;
      submit: string;
      noAccount: string;
      switchToRegister: string;
      orDivider: string;
    };
    orgRegister: {
      title: string;
      subtitle: string;
      orgName: string;
      orgNamePlaceholder: string;
      email: string;
      emailPlaceholder: string;
      password: string;
      passwordPlaceholder: string;
      confirmPassword: string;
      confirmPasswordPlaceholder: string;
      submit: string;
      hasAccount: string;
      switchToLogin: string;
      orDivider: string;
    };
    register: {
      title: string;
      subtitle: string;
      name: string;
      namePlaceholder: string;
      email: string;
      emailPlaceholder: string;
      password: string;
      passwordPlaceholder: string;
      confirmPassword: string;
      confirmPasswordPlaceholder: string;
      submit: string;
      hasAccount: string;
      switchToLogin: string;
      continueWithGoogle: string;
      orDivider: string;
    };
  };
  footer: {
    description: string;
    createGroup: string;
    sections: {
      account: { title: string; links: string[] };
      discover: { title: string; links: string[] };
      about: { title: string; links: string[] };
      organizers: { title: string; links: string[] };
    };
    copyright: string;
    privacyPolicy: string;
    termsOfUse: string;
  };
  home: {
    hero: {
      headline: string;
      subheadline: string;
      cta: string;
      ctaHost: string;
    };
    stats: {
      events: string;
      cities: string;
      attendees: string;
    };
    trending: {
      title: string;
      browseAll: string;
    };
    categories: {
      title: string;
    };
    hostCta: {
      title: string;
      subtitle: string;
      cta: string;
    };
  };
};

export const resolveLocale = (locale: string | null | undefined): Locale => {
  if (!locale) return 'en';
  const normalized = locale.toLowerCase();
  if (normalized === 'ua' || normalized.startsWith('uk')) return 'ua';
  return 'en';
};

/**
 * Client-side: fetch a locale bundle from the public static assets.
 * Call this when the user switches language at runtime.
 */
export async function fetchLocale(locale: Locale): Promise<Dictionary> {
  const res = await fetch(`/locales/${locale}.json`);
  if (!res.ok) throw new Error(`Failed to load locale "${locale}": ${res.status}`);
  return res.json() as Promise<Dictionary>;
}
