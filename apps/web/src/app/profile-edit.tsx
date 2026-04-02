import { useEffect } from 'react';
import { useNavigate } from 'react-router';

export default function ProfileEditRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/profile/settings', { replace: true });
  }, [navigate]);
  return null;
}
