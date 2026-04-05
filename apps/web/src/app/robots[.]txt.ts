import { SITE_URL } from '@shared/config/app'

export function loader() {
  const content = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /profile',
    'Disallow: /checkout',
    '',
    `Sitemap: ${SITE_URL}/sitemap.xml`,
  ].join('\n')

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
