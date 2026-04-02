import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRouteLoaderData,
} from 'react-router'

import type { Route } from './+types/root'
import type { PropsWithChildren } from 'react'
import { useCallback, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NuqsAdapter } from 'nuqs/adapters/react-router/v7'

import '@app/styles/global.css'
import { Header } from '@widgets/Header'
import { Footer } from '@widgets/Footer'
import { NotFound } from '@widgets/NotFound'
import { ErrorBoundary as ErrorBoundaryWidget } from '@widgets/Error'
import { TooltipProvider } from '@shared/components'
import { JsonLd } from '@shared/components'
import { Toaster } from 'sonner'
import { AppContext, type AppContextValue, fetchLocale } from '@shared/lib'
import { AuthProvider } from '@shared/lib/auth-context'
import type { Dictionary, Locale } from '@shared/lib'
import { GoogleAuthHandler } from '@features/GoogleAuth'
import { GOOGLE_FONTS_URL, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@shared/config/app'

export const links: Route.LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: GOOGLE_FONTS_URL,
  },
]

function parseCookie(header: string, key: string): string | undefined {
  const match = new RegExp(`(?:^|;\\s*)${key}=([^;]*)`).exec(header)
  return match ? decodeURIComponent(match[1]) : undefined
}

export async function loader({ request }: Route.LoaderArgs) {
  const cookieHeader = request.headers.get('Cookie') ?? ''
  const localeCookie = parseCookie(cookieHeader, 'locale')
  const themeCookie = parseCookie(cookieHeader, 'theme')
  const initialLocale: Locale = localeCookie === 'ua' ? 'ua' : 'en'
  const initialTheme = themeCookie === 'light' ? 'light' : 'dark'

  // SSR: read locale bundle directly from the public directory on disk.
  // Dynamic imports are used so node:fs stays out of the client bundle.
  const { readFileSync } = await import('node:fs')
  const { join } = await import('node:path')
  const localeFile = join(process.cwd(), 'public', 'locales', `${initialLocale}.json`)
  const initialDict: Dictionary = JSON.parse(readFileSync(localeFile, 'utf-8'))

  return { initialLocale, initialTheme, initialDict }
}

// Fallback blocking script: covers first-visit (no cookie) and client-side navigations
const initScript = `(function(){
  var t=localStorage.getItem('theme');
  var light=t==='light'||(t!=='dark'&&window.matchMedia('(prefers-color-scheme:light)').matches);
  if(light)document.documentElement.classList.add('light');
  window.__THEME__=light?'light':'dark';
  var l=localStorage.getItem('locale')||navigator.language||'en';
  window.__LOCALE__=(l==='ua'||l.startsWith('uk'))?'ua':'en';
})();`

export function Layout({ children }: PropsWithChildren) {
  // Read server-provided theme to set <html> class before hydration (no flash)
  const data = useRouteLoaderData<typeof loader>('root')
  const htmlClass = data?.initialTheme === 'light' ? 'light' : ''

  return (
    <html lang="en" className={htmlClass} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        {/* Fallback blocking script for first-visit (no cookie yet) */}
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: intentional blocking init script */}
        <script dangerouslySetInnerHTML={{ __html: initScript }} />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/events?search={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
}

const queryClient = new QueryClient()

type Win = Window & { __THEME__?: string }

export default function App() {
  const { initialLocale, initialTheme, initialDict } = useLoaderData<typeof loader>()

  const [locale, setLocaleState] = useState<Locale>(initialLocale)
  const [t, setT] = useState<Dictionary>(initialDict)
  const [isLightTheme, setIsLightTheme] = useState(
    () => initialTheme === 'light' || (typeof window !== 'undefined' && (window as Win).__THEME__ === 'light'),
  )

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    localStorage.setItem('locale', next)
    // biome-ignore lint: intentional cookie-based locale for SSR
    document.cookie = `locale=${next}; path=/; max-age=31536000`
    // Fetch updated dictionary from public assets (no page reload needed)
    fetchLocale(next).then(setT).catch(console.error)
  }, [])

  const applyTheme = useCallback((isLight: boolean) => {
    setIsLightTheme(isLight)
    document.documentElement.classList.toggle('light', isLight)
    localStorage.setItem('theme', isLight ? 'light' : 'dark')
    // biome-ignore lint: intentional cookie-based theme for SSR
    document.cookie = `theme=${isLight ? 'light' : 'dark'}; path=/; max-age=31536000`
  }, [])

  const ctx: AppContextValue = { locale, setLocale, isLightTheme, applyTheme, t }

  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>
        <AuthProvider>
          <GoogleAuthHandler />
          <AppContext.Provider value={ctx}>
          <TooltipProvider>
            <JsonLd schema={websiteJsonLd} />
            <Header />
            <Outlet />
            <Toaster />
            <Footer />
          </TooltipProvider>
          </AppContext.Provider>
        </AuthProvider>
      </NuqsAdapter>
    </QueryClientProvider>
  )
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFound />
  }

  const isHttpError = isRouteErrorResponse(error)
  const status = isHttpError ? error.status : null
  const message = isHttpError
    ? error.statusText || 'Something went wrong'
    : error instanceof Error
      ? error.message
      : 'An unexpected error occurred.'
  const stack = !isHttpError && error instanceof Error && import.meta.env.DEV ? error.stack : undefined

  return <ErrorBoundaryWidget status={status} message={message} stack={stack} />
}
