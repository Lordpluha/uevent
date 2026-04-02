import { CheckoutPage } from '../pages/Checkout';
import { SITE_NAME } from '@shared/config/app';

export function meta() {
  return [
    { title: `Checkout — ${SITE_NAME}` },
    { name: 'robots', content: 'noindex, nofollow' },
  ];
}

export default CheckoutPage;