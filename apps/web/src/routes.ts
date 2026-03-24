import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('app/home.tsx'),

  // Events
  route('/events', 'app/events.tsx'),
  route('/events/:id', 'app/event.tsx'),

  // Organizations
  route('/organizations', 'app/organizations.tsx'),
  route('/organizations/:id', 'app/organization.tsx'),

  // Public profiles
  route('/users/:id', 'app/user.tsx'),

  // Private: own profile
  route('/profile', 'app/profile.tsx'),
  route('/profile/edit', 'app/profile-edit.tsx'),

  // Private: org management
  route('/organizations/:id/edit', 'app/organization-edit.tsx'),
] satisfies RouteConfig;
