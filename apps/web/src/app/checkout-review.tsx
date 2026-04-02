import type { Route } from './+types/checkout-review';
import { CheckoutReviewPage } from '@pages/CheckoutReview';
import { SITE_NAME } from '@shared/config/app';

export function meta(_: Route.MetaArgs) {
  return [
    { title: `Checkout review — ${SITE_NAME}` },
    { name: 'description', content: 'Review selected ticket before payment.' },
    { name: 'robots', content: 'noindex, nofollow' },
  ];
}

export default CheckoutReviewPage;
