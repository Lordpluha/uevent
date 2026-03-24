import type { Route } from './+types/checkout-review';
import { CheckoutReviewPage } from '@pages/CheckoutReview';

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'Checkout review — uevent' },
    { name: 'description', content: 'Review selected ticket before payment.' },
  ];
}

export default CheckoutReviewPage;
