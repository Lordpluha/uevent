import { createContext, useContext } from 'react'
import type { Dictionary, Locale } from './i18n'

export type AppContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  isLightTheme: boolean
  applyTheme: (isLight: boolean) => void
  /** The active locale's translation dictionary, loaded from public/locales/ */
  t: Dictionary
}

// Minimal placeholder so the context always has *something* typed correctly.
// Real values are provided by App in root.tsx via the SSR loader.
const PLACEHOLDER_T = {} as Dictionary

export const AppContext = createContext<AppContextValue>({
  locale: 'en',
  setLocale: () => {},
  isLightTheme: false,
  applyTheme: () => {},
  t: PLACEHOLDER_T,
})

export const useAppContext = () => useContext(AppContext)
