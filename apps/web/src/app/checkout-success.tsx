import type { Route } from './+types/checkout-success';
import { CheckoutSuccessPage } from '@pages/CheckoutSuccess';
import { SITE_NAME } from '@shared/config/app';

export function meta(_: Route.MetaArgs) {
  return [
    { title: `Payment success — ${SITE_NAME}` },
    { name: 'description', content: 'Order has been created successfully.' },
    { name: 'robots', content: 'noindex, nofollow' },
  ];
}

export default CheckoutSuccessPage;
