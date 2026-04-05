import { SITE_NAME } from '@shared/config/app'
import { PaymentFailedPage } from '../pages/PaymentFailed'

export function meta() {
  return [{ title: `Payment failed — ${SITE_NAME}` }, { name: 'robots', content: 'noindex, nofollow' }]
}

export default PaymentFailedPage
