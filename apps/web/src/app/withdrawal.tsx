import { WithdrawalPage } from '@pages/Withdrawal';
import { SITE_NAME } from '@shared/config/app';

export function meta() {
  return [
    { title: `Request withdrawal — ${SITE_NAME}` },
    { name: 'description', content: 'Request a payout from your organization wallet.' },
    { name: 'robots', content: 'noindex, nofollow' },
  ];
}

export default WithdrawalPage;
