/** Canonical public URL of the web application. Used for OG/canonicals/JSON-LD. */
export const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://uevent.app';

export const SITE_NAME = import.meta.env.VITE_SITE_NAME ?? 'UEVENT';

export const SITE_DESCRIPTION =
  import.meta.env.VITE_SITE_DESCRIPTION ??
  'Discover, create, and attend events with UEVENT — your all-in-one event management platform.';

/** Google Fonts stylesheet URL for the primary typeface. */
export const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap';

/** OpenStreetMap tile layer URL for Leaflet maps. */
export const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

/** OSM tile attribution string. */
export const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** Keyboard shortcut key for the sidebar toggle (combined with Ctrl/Cmd). */
export const SIDEBAR_SHORTCUT_KEY = import.meta.env.VITE_SIDEBAR_SHORTCUT_KEY ?? 'b';
