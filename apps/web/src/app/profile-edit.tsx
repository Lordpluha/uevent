import { Navigate } from 'react-router';

export default function ProfileEditRedirect() {
  return <Navigate to="/profile/settings" replace />;
}
