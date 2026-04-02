import { PromoCodesPage } from '@pages/PromoCodes';
import { SITE_NAME } from '@shared/config/app';

export function meta() {
  return [
    { title: `Promo codes — ${SITE_NAME}` },
    { name: 'description', content: 'Create and manage discount promo codes for your organization.' },
    { name: 'robots', content: 'noindex, nofollow' },
  ];
}

export default PromoCodesPage;
