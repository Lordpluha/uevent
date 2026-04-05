import { index, type RouteConfig, route } from '@react-router/dev/routes'

export default [
  // Ignore Chrome DevTools probe in dev to avoid noisy "No route matches" logs
  route('/.well-known/appspecific/com.chrome.devtools.json', 'app/chrome-devtools-probe.tsx'),

  // SEO
  route('/robots.txt', 'app/robots[.]txt.ts'),

  index('app/home.tsx'),

  // Events
  route('/events', 'app/events.tsx'),
  route('/events/:id', 'app/event.tsx'),

  // Checkout & Payment
  route('/checkout', 'app/checkout.tsx'),
  route('/payment-success', 'app/payment-success.tsx'),
  route('/payment-failed', 'app/payment-failed.tsx'),

  // Organizations
  route('/organizations', 'app/organizations.tsx'),
  route('/organizations/:id', 'app/organization.tsx'),

  // Public profiles
  route('/users/:id', 'app/user.tsx'),

  // Private: own profile
  route('/profile', 'app/profile.tsx'),
  route('/profile/settings', 'app/profile-settings.tsx'),
  route('/profile/organization/:id', 'app/organization-profile.tsx'),

  // Organizer flows
  route('/events/create', 'app/event-create.tsx'),
  route('/events/:id/tickets/create', 'app/ticket-create.tsx'),

  // Purchase flow
  route('/checkout/:eventId/review', 'app/checkout-review.tsx'),
  route('/checkout/:eventId/success', 'app/checkout-success.tsx'),

  // Private: org management
  route('/settings', 'app/settings.tsx'),

  // Dashboard (org account shortcut)
  route('/dashboard', 'app/dashboard.tsx'),

  // Org wallet withdrawal
  route('/withdrawal', 'app/withdrawal.tsx'),

  // Org promo codes
  route('/promo-codes', 'app/promo-codes.tsx'),
] satisfies RouteConfig
