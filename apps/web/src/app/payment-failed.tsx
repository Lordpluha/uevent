import { PaymentFailedPage } from '../pages/PaymentFailed';
import { SITE_NAME } from '@shared/config/app';

export function meta() {
  return [
    { title: `Payment failed — ${SITE_NAME}` },
    { name: 'robots', content: 'noindex, nofollow' },
  ];
}

export default PaymentFailedPage;