import type { Route } from './+types/checkout-success';
import { CheckoutSuccessPage } from '@pages/CheckoutSuccess';

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'Payment success — uevent' },
    { name: 'description', content: 'Order has been created successfully.' },
  ];
}

export default CheckoutSuccessPage;
