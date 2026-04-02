import { ProfileSettingsPage } from '@pages/ProfileSettings';
import { SITE_NAME } from '@shared/config/app';

export function meta() {
  return [
    { title: `Settings — ${SITE_NAME}` },
    { name: 'description', content: 'Manage your profile, preferences, security and notifications.' },
    { name: 'robots', content: 'noindex, nofollow' },
  ];
}

export default ProfileSettingsPage;
