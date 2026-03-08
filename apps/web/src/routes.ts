import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('app/home.tsx'),
  route('/auth/login', 'app/login.tsx'),
  route('/auth/registration', 'app/registration.tsx'),
] satisfies RouteConfig;
