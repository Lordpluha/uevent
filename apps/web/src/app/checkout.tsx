import { SITE_NAME } from '@shared/config/app'
import { CheckoutPage } from '../pages/Checkout'

export function meta() {
  return [{ title: `Checkout — ${SITE_NAME}` }, { name: 'robots', content: 'noindex, nofollow' }]
}

export default CheckoutPage
