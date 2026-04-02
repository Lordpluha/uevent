import { PaymentSuccessPage } from '../pages/PaymentSuccess';
import { SITE_NAME } from '@shared/config/app';

export function meta() {
  return [
    { title: `Payment — ${SITE_NAME}` },
    { name: 'robots', content: 'noindex, nofollow' },
  ];
}

export default PaymentSuccessPage;