import { useState } from 'react';
import { Link, Navigate } from 'react-router';
import {
  Bell,
  ChevronLeft,
  Globe,
  Monitor,
  Shield,
  User,
} from 'lucide-react';
import { Separator, Skeleton } from '@shared/components';
import { useAppContext } from '@shared/lib';
import { ProfileSection } from './ProfileSection';
import { PreferencesSection } from './PreferencesSection';
import { SecuritySection } from './SecuritySection';
import { NotificationsSection } from './NotificationsSection';
import { SessionsSection } from './SessionsSection';
import { useProfileSettingsData } from './useProfileSettingsData';

const NAV_ITEMS = [
  { id: 'profile', icon: User },
  { id: 'preferences', icon: Globe },
  { id: 'security', icon: Shield },
  { id: 'notifications', icon: Bell },
  { id: 'sessions', icon: Monitor },
] as const;

type SectionId = (typeof NAV_ITEMS)[number]['id'];

function SettingsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-20 w-20 rounded-full" />
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

export function ProfileSettingsPage() {
  const { t } = useAppContext();
  const { isAuthenticated, isReady, isLoading } = useProfileSettingsData();
  const [activeSection, setActiveSection] = useState<SectionId>('profile');

  const scrollTo = (id: SectionId) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveSection(id);
  };

  const navLabels: Record<SectionId, string> = {
    profile: t.profileSettings.tabs.profile,
    preferences: t.profileSettings.tabs.preferences,
    security: t.profileSettings.tabs.security,
    notifications: t.profileSettings.tabs.notifications,
    sessions: t.profileSettings.tabs.sessions,
  };

  if (!isReady || isLoading) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <Skeleton className="mb-6 h-6 w-24" />
        <Skeleton className="mb-8 h-8 w-48" />
        <SettingsSkeleton />
      </main>
    );
  }

  if (!isAuthenticated) return <Navigate to="/" replace />;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      {/* Page header */}
      <Link
        to="/profile"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        {t.common.backToProfile}
      </Link>
      <h1 className="mb-1 text-2xl font-extrabold tracking-tight">{t.profileSettings.title}</h1>
      <p className="mb-8 text-sm text-muted-foreground">{t.profileSettings.subtitle}</p>

      <div className="flex flex-col gap-8 sm:flex-row sm:items-start">
        {/* Sticky sidebar nav */}
        <nav className="sm:sticky sm:top-20 sm:w-44 sm:shrink-0" aria-label={t.profileSettings.title}>
          <ul className="space-y-1">
            {NAV_ITEMS.map(({ id, icon: Icon }) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => scrollTo(id)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                    activeSection === id
                      ? 'bg-accent text-accent-foreground font-medium'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {navLabels[id]}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Main content */}
        <div className="flex-1 space-y-10 min-w-0">
          <section id="profile" aria-labelledby="section-profile">
            <div className="mb-5 flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <h2 id="section-profile" className="text-base font-semibold">{t.profileSettings.tabs.profile}</h2>
            </div>
            <ProfileSection />
          </section>

          <Separator />

          <section id="preferences" aria-labelledby="section-preferences">
            <div className="mb-5 flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <h2 id="section-preferences" className="text-base font-semibold">{t.profileSettings.tabs.preferences}</h2>
            </div>
            <PreferencesSection />
          </section>

          <Separator />

          <section id="security" aria-labelledby="section-security">
            <div className="mb-5 flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <h2 id="section-security" className="text-base font-semibold">{t.profileSettings.tabs.security}</h2>
            </div>
            <SecuritySection />
          </section>

          <Separator />

          <section id="notifications" aria-labelledby="section-notifications">
            <div className="mb-5 flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <h2 id="section-notifications" className="text-base font-semibold">{t.profileSettings.tabs.notifications}</h2>
            </div>
            <NotificationsSection />
          </section>

          <Separator />

          <section id="sessions" aria-labelledby="section-sessions">
            <div className="mb-5 flex items-center gap-2">
              <Monitor className="h-4 w-4 text-muted-foreground" />
              <h2 id="section-sessions" className="text-base font-semibold">{t.profileSettings.activeSessions}</h2>
            </div>
            <SessionsSection />
          </section>
        </div>
      </div>
    </main>
  );
}
