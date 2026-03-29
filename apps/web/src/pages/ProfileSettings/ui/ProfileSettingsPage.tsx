import type { ChangeEvent, FormEvent } from 'react';
import { useRef, useState, useEffect, useId } from 'react';
import { Link, Navigate } from 'react-router';
import {
  Bell,
  Camera,
  ChevronLeft,
  Eye,
  EyeOff,
  Globe,
  MapPin,
  Monitor,
  Save,
  Shield,
  ShieldCheck,
  Smartphone,
  Tag,
  Trash2,
  User,
  Clock,
  Check,
  X,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldTitle,
  Input,
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  Separator,
  Switch,
  Textarea,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@shared/components';
import { usersApi, useMe } from '@entities/User';
import { tagsApi, sessionsApi } from '@shared/api';
import { authApi } from '@shared/api/auth.api';
import type { UserSessionInfo } from '@shared/api';
import { useAuth } from '@shared/lib/auth-context';

// ── Timezone helpers ────────────────────────────────────────────
let TZ_LIST: string[] = [];
try {
  TZ_LIST = Intl.supportedValuesOf('timeZone');
} catch {
  TZ_LIST = [
    'UTC', 'America/New_York', 'America/Chicago', 'America/Denver',
    'America/Los_Angeles', 'Europe/London', 'Europe/Paris',
    'Europe/Berlin', 'Europe/Kyiv', 'Asia/Tokyo', 'Asia/Shanghai',
    'Asia/Kolkata', 'Australia/Sydney',
  ];
}

// ── Section nav ─────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'preferences', label: 'Preferences', icon: Globe },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'sessions', label: 'Sessions', icon: Monitor },
] as const;

function parseUserAgent(ua: string | null): { browser: string; os: string; isMobile: boolean } {
  if (!ua) return { browser: 'Unknown', os: 'Unknown', isMobile: false };
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
  let browser = 'Unknown';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  return { browser, os, isMobile };
}

function formatSessionDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

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
  const { isAuthenticated, isReady } = useAuth();
  const { data: user, isLoading } = useMe();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<SectionId>('profile');
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const formId = useId();

  // ── Profile form ──────────────────────────────────────────────
  const [profile, setProfile] = useState({
    name: '', username: '', bio: '', location: '', website: '',
  });

  // ── Preferences ───────────────────────────────────────────────
  const [timezone, setTimezone] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // ── Security ──────────────────────────────────────────────────
  const [twoFa, setTwoFa] = useState(false);
  const [isEnableTwoFaDialogOpen, setIsEnableTwoFaDialogOpen] = useState(false);
  const [isDisableTwoFaDialogOpen, setIsDisableTwoFaDialogOpen] = useState(false);
  const [twoFaSetupData, setTwoFaSetupData] = useState<{ secret: string; qrCodeDataUrl: string } | null>(null);
  const [twoFaCode, setTwoFaCode] = useState('');
  const [disableTwoFaCode, setDisableTwoFaCode] = useState('');
  const [passwordForm, setPasswordForm] = useState({ next: '', confirm: '' });
  const [showPass, setShowPass] = useState({ next: false, confirm: false });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  // ── Notifications ─────────────────────────────────────────────
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(false);
  const [paymentEmailEnabled, setPaymentEmailEnabled] = useState(true);
  const [subscriptionNotificationsEnabled, setSubscriptionNotificationsEnabled] = useState(true);
  const [loginNotificationsEnabled, setLoginNotificationsEnabled] = useState(true);
  const [browserPushPermission, setBrowserPushPermission] = useState<NotificationPermission | 'unsupported'>('default');

  // ── Tags query ────────────────────────────────────────────────
  const { data: tagsResult } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagsApi.getAll({ limit: 100 }),
  });
  const allTags = tagsResult?.data ?? [];

  // ── Sessions query ────────────────────────────────────────────
  const { data: sessions = [], refetch: refetchSessions } = useQuery({
    queryKey: ['user-sessions'],
    queryFn: () => sessionsApi.getAll(),
  });

  // Hydrate state from user data
  useEffect(() => {
    if (!user) return;
    setProfile({
      name: user.name ?? '',
      username: user.username ?? '',
      bio: user.bio ?? '',
      location: user.location ?? '',
      website: user.website ?? '',
    });
    setTimezone(user.timezone ?? '');
    setSelectedTags(user.interests ?? []);
    setTwoFa(user.twoFa ?? false);
    setNotificationsEnabled(user.notificationsEnabled ?? true);
    setPushNotificationsEnabled(user.pushNotificationsEnabled ?? false);
    setPaymentEmailEnabled(user.paymentEmailEnabled ?? true);
    setSubscriptionNotificationsEnabled(user.subscriptionNotificationsEnabled ?? true);
    setLoginNotificationsEnabled(user.loginNotificationsEnabled ?? true);
  }, [user]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) {
      setBrowserPushPermission('unsupported');
      return;
    }
    setBrowserPushPermission(Notification.permission);
  }, []);

  // ── Mutations ─────────────────────────────────────────────────
  const invalidateUser = async () => {
    await queryClient.invalidateQueries({ queryKey: ['me'] });
    await queryClient.invalidateQueries({ queryKey: ['users'] });
  };

  const profileMutation = useMutation({
    mutationFn: () =>
      usersApi.updateMe({
        name: profile.name.trim() || undefined,
        username: profile.username.trim() || undefined,
        bio: profile.bio.trim() || undefined,
        location: profile.location.trim() || undefined,
        website: profile.website.trim() || undefined,
      }),
    onSuccess: async () => { await invalidateUser(); toast.success('Profile updated'); },
    onError: () => toast.error('Failed to update profile'),
  });

  const preferencesMutation = useMutation({
    mutationFn: () =>
      usersApi.updateMe({
        timezone: timezone || undefined,
        interests: selectedTags,
      }),
    onSuccess: async () => { await invalidateUser(); toast.success('Preferences saved'); },
    onError: () => toast.error('Failed to save preferences'),
  });

  const twoFaSetupMutation = useMutation({
    mutationFn: () => authApi.setup2fa(),
    onSuccess: (data) => {
      setTwoFaSetupData(data);
      setTwoFaCode('');
      setIsEnableTwoFaDialogOpen(true);
    },
    onError: () => toast.error('Failed to start 2FA setup'),
  });

  const twoFaConfirmMutation = useMutation({
    mutationFn: (code: string) => authApi.confirm2fa(code),
    onSuccess: async () => {
      await invalidateUser();
      setTwoFa(true);
      setIsEnableTwoFaDialogOpen(false);
      setTwoFaSetupData(null);
      setTwoFaCode('');
      toast.success('2FA enabled');
    },
    onError: () => { toast.error('Invalid verification code'); setTwoFaCode(''); },
  });

  const twoFaDisableMutation = useMutation({
    mutationFn: (code: string) => authApi.disable2fa(code),
    onSuccess: async () => {
      await invalidateUser();
      setTwoFa(false);
      setIsDisableTwoFaDialogOpen(false);
      setDisableTwoFaCode('');
      toast.success('2FA disabled');
    },
    onError: () => { toast.error('Invalid verification code'); setDisableTwoFaCode(''); },
  });

  const passwordMutation = useMutation({
    mutationFn: (password: string) => usersApi.updateMe({ password }),
    onSuccess: () => {
      setPasswordForm({ next: '', confirm: '' });
      toast.success('Password updated');
    },
    onError: () => toast.error('Failed to update password'),
  });

  const notificationsMutation = useMutation({
    mutationFn: (enabled: boolean) => usersApi.updateMe({ notificationsEnabled: enabled }),
    onSuccess: async () => { await invalidateUser(); },
    onError: () => toast.error('Failed to update notification settings'),
  });

  const pushNotificationsMutation = useMutation({
    mutationFn: (enabled: boolean) => usersApi.updateMe({ pushNotificationsEnabled: enabled }),
    onSuccess: async () => { await invalidateUser(); },
    onError: () => toast.error('Failed to update push notification settings'),
  });

  const paymentEmailMutation = useMutation({
    mutationFn: (enabled: boolean) => usersApi.updateMe({ paymentEmailEnabled: enabled }),
    onSuccess: async () => { await invalidateUser(); },
    onError: () => toast.error('Failed to update payment email settings'),
  });

  const subscriptionNotificationsMutation = useMutation({
    mutationFn: (enabled: boolean) => usersApi.updateMe({ subscriptionNotificationsEnabled: enabled }),
    onSuccess: async () => { await invalidateUser(); },
    onError: () => toast.error('Failed to update subscription notification settings'),
  });

  const loginNotificationsMutation = useMutation({
    mutationFn: (enabled: boolean) => usersApi.updateMe({ loginNotificationsEnabled: enabled }),
    onSuccess: async () => { await invalidateUser(); },
    onError: () => toast.error('Failed to update login notification settings'),
  });

  const revokeSessionMutation = useMutation({
    mutationFn: (sessionId: string) => sessionsApi.revoke(sessionId),
    onSuccess: async () => {
      await refetchSessions();
      toast.success('Session revoked');
    },
    onError: () => toast.error('Failed to revoke session'),
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: (file: File) => usersApi.uploadAvatar(file),
    onSuccess: async () => {
      await invalidateUser();
      toast.success('Profile photo updated');
    },
    onError: () => toast.error('Failed to upload profile photo'),
  });

  // ── Handlers ──────────────────────────────────────────────────
  const setProfileField =
    (field: keyof typeof profile) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setProfile((prev) => ({ ...prev, [field]: e.target.value }));

  const handleProfileSubmit = (e: FormEvent) => {
    e.preventDefault();
    profileMutation.mutate();
  };

  const handlePreferencesSubmit = (e: FormEvent) => {
    e.preventDefault();
    preferencesMutation.mutate();
  };

  const handlePasswordSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (passwordForm.next.length < 8) errs.next = 'Minimum 8 characters.';
    if (passwordForm.next !== passwordForm.confirm) errs.confirm = 'Passwords do not match.';
    setPasswordErrors(errs);
    if (Object.keys(errs).length === 0) passwordMutation.mutate(passwordForm.next);
  };

  const toggleTag = (name: string) => {
    setSelectedTags((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name],
    );
  };

  const handleTwoFaChange = (enabled: boolean) => {
    if (!enabled) {
      setDisableTwoFaCode('');
      setIsDisableTwoFaDialogOpen(true);
      return;
    }

    twoFaSetupMutation.mutate();
  };

  const confirmEnableTwoFa = () => {
    if (twoFaCode.length !== 6) return;
    twoFaConfirmMutation.mutate(twoFaCode);
  };

  const confirmDisableTwoFa = () => {
    if (disableTwoFaCode.length !== 6) return;
    twoFaDisableMutation.mutate(disableTwoFaCode);
  };

  const handleNotificationsChange = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    notificationsMutation.mutate(enabled);
  };

  const handlePaymentEmailChange = (enabled: boolean) => {
    setPaymentEmailEnabled(enabled);
    paymentEmailMutation.mutate(enabled);
  };

  const handleSubscriptionNotificationsChange = (enabled: boolean) => {
    setSubscriptionNotificationsEnabled(enabled);
    subscriptionNotificationsMutation.mutate(enabled);
  };

  const handleLoginNotificationsChange = (enabled: boolean) => {
    setLoginNotificationsEnabled(enabled);
    loginNotificationsMutation.mutate(enabled);
  };

  const handlePushNotificationsChange = async (enabled: boolean) => {
    if (!enabled) {
      setPushNotificationsEnabled(false);
      pushNotificationsMutation.mutate(false);
      return;
    }

    if (typeof window === 'undefined' || !('Notification' in window)) {
      setBrowserPushPermission('unsupported');
      toast.error('Push notifications are not supported in this browser');
      return;
    }

    let permission: NotificationPermission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    setBrowserPushPermission(permission);

    if (permission !== 'granted') {
      setPushNotificationsEnabled(false);
      pushNotificationsMutation.mutate(false);
      toast.error('Push notifications permission was not granted');
      return;
    }

    setPushNotificationsEnabled(true);
    pushNotificationsMutation.mutate(true);
    toast.success('Push notifications enabled');
  };

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadAvatarMutation.mutate(file);
    }
    e.target.value = '';
  };

  const scrollTo = (id: SectionId) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveSection(id);
  };

  if (!isReady) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <Skeleton className="mb-6 h-6 w-24" />
        <Skeleton className="mb-8 h-8 w-48" />
        <SettingsSkeleton />
      </main>
    );
  }

  if (!isAuthenticated) return <Navigate to="/" replace />;

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <Skeleton className="mb-6 h-6 w-24" />
        <Skeleton className="mb-8 h-8 w-48" />
        <SettingsSkeleton />
      </main>
    );
  }

  const initials = (user?.name ?? '?')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <AlertDialog open={isEnableTwoFaDialogOpen} onOpenChange={(o) => { if (!o) { setIsEnableTwoFaDialogOpen(false); setTwoFaSetupData(null); setTwoFaCode(''); } }}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Set up two-factor authentication</AlertDialogTitle>
            <AlertDialogDescription>
              Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.), then enter the 6-digit code to verify.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {twoFaSetupData && (
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="rounded-xl border border-border bg-white p-3">
                <img src={twoFaSetupData.qrCodeDataUrl} alt="2FA QR Code" className="h-48 w-48" />
              </div>
              <div className="w-full rounded-lg bg-muted/50 p-3 text-center">
                <p className="mb-1 text-xs text-muted-foreground">Or enter this key manually:</p>
                <code className="text-xs font-mono break-all select-all">{twoFaSetupData.secret}</code>
              </div>
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm font-medium">Verification code</p>
                <InputOTP maxLength={6} value={twoFaCode} onChange={setTwoFaCode}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={twoFaConfirmMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmEnableTwoFa} disabled={twoFaConfirmMutation.isPending || twoFaCode.length !== 6}>
              {twoFaConfirmMutation.isPending ? 'Verifying...' : 'Enable 2FA'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDisableTwoFaDialogOpen} onOpenChange={(o) => { if (!o) { setIsDisableTwoFaDialogOpen(false); setDisableTwoFaCode(''); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable two-factor authentication?</AlertDialogTitle>
            <AlertDialogDescription>
              Enter your current 2FA code to confirm disabling two-factor authentication.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col items-center gap-2 py-2">
            <InputOTP maxLength={6} value={disableTwoFaCode} onChange={setDisableTwoFaCode}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={twoFaDisableMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDisableTwoFa} disabled={twoFaDisableMutation.isPending || disableTwoFaCode.length !== 6}>
              {twoFaDisableMutation.isPending ? 'Disabling...' : 'Disable 2FA'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Page header ───────────────────────────────────────── */}
      <Link
        to="/profile"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to profile
      </Link>
      <h1 className="mb-1 text-2xl font-extrabold tracking-tight">Settings</h1>
      <p className="mb-8 text-sm text-muted-foreground">Manage your account preferences, security, and notifications.</p>

      <div className="flex flex-col gap-8 sm:flex-row sm:items-start">
        {/* ── Sticky sidebar nav ─────────────────────────────── */}
        <nav className="sm:sticky sm:top-20 sm:w-44 sm:shrink-0" aria-label="Settings navigation">
          <ul className="space-y-1">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
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
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* ── Main content ───────────────────────────────────── */}
        <div className="flex-1 space-y-10 min-w-0">

          {/* ── Profile section ─────────────────────────────── */}
          <section id="profile" aria-labelledby="section-profile">
            <div className="mb-5 flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <h2 id="section-profile" className="text-base font-semibold">Profile</h2>
            </div>

            <form id={`${formId}-profile`} onSubmit={handleProfileSubmit} className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={user?.avatarUrl} alt={user?.name} />
                    <AvatarFallback className="text-xl font-bold">{initials}</AvatarFallback>
                  </Avatar>
                  <Tooltip>
                    <TooltipTrigger render={
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
                        aria-label="Change avatar"
                      />
                    }>
                      <Camera className="h-3.5 w-3.5" />
                    </TooltipTrigger>
                    <TooltipContent>Change photo</TooltipContent>
                  </Tooltip>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    aria-label="Upload avatar"
                    onChange={handleAvatarChange}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium">Profile photo</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG or WebP · max 2 MB</p>
                </div>
              </div>

              <Separator />

              <FieldGroup>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="name">Full name</FieldLabel>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={setProfileField('name')}
                      placeholder="Your name"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="username">Username</FieldLabel>
                    <Input
                      id="username"
                      value={profile.username}
                      onChange={setProfileField('username')}
                      placeholder="username"
                    />
                    <FieldDescription>Shown in your public profile URL.</FieldDescription>
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="bio">Bio</FieldLabel>
                  <Textarea
                    id="bio"
                    value={profile.bio}
                    onChange={setProfileField('bio')}
                    placeholder="Tell something about yourself…"
                    className="min-h-24 resize-y"
                    maxLength={300}
                  />
                  <FieldDescription>{profile.bio.length}/300 characters</FieldDescription>
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="location">
                      <MapPin className="inline h-3.5 w-3.5" /> Location
                    </FieldLabel>
                    <Input
                      id="location"
                      value={profile.location}
                      onChange={setProfileField('location')}
                      placeholder="City, Country"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="website">
                      <Globe className="inline h-3.5 w-3.5" /> Website
                    </FieldLabel>
                    <Input
                      id="website"
                      value={profile.website}
                      onChange={setProfileField('website')}
                      placeholder="https://your.site"
                    />
                  </Field>
                </div>
              </FieldGroup>

              <div className="flex justify-end gap-3">
                <Button
                  type="submit"
                  className="gap-1.5"
                  disabled={profileMutation.isPending}
                >
                  <Save className="h-3.5 w-3.5" />
                  {profileMutation.isPending ? 'Saving…' : 'Save profile'}
                </Button>
              </div>
            </form>
          </section>

          <Separator />

          {/* ── Preferences section ─────────────────────────── */}
          <section id="preferences" aria-labelledby="section-preferences">
            <div className="mb-5 flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <h2 id="section-preferences" className="text-base font-semibold">Preferences</h2>
            </div>

            <form onSubmit={handlePreferencesSubmit} className="space-y-6">
              {/* Timezone */}
              <Field>
                <FieldLabel htmlFor="timezone">
                  <Clock className="inline h-3.5 w-3.5" /> Timezone
                </FieldLabel>
                <Select value={timezone} onValueChange={(v) => setTimezone(v ?? '')}>
                  <SelectTrigger id="timezone" className="w-full" size="default">
                    <SelectValue placeholder="Select your timezone…" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectGroup>
                      <SelectLabel>Timezones</SelectLabel>
                      {TZ_LIST.map((tz) => (
                        <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldDescription>Used to display event times in your local time.</FieldDescription>
              </Field>

              {/* Favorite tags */}
              <Field>
                <FieldLabel>
                  <Tag className="inline h-3.5 w-3.5" /> Favorite topics
                </FieldLabel>
                <FieldDescription className="mb-3">
                  Select topics you're interested in to get better event recommendations.
                </FieldDescription>
                <div className="flex flex-wrap gap-2">
                  {allTags.length === 0 && (
                    <p className="text-xs text-muted-foreground">No tags available.</p>
                  )}
                  {allTags.map((tag) => {
                    const selected = selectedTags.includes(tag.name);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.name)}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                          selected
                            ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                            : 'border-border/60 bg-card text-muted-foreground hover:border-primary/50 hover:bg-accent'
                        }`}
                        aria-pressed={selected}
                      >
                        {selected ? <Check className="h-3 w-3" /> : null}
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
                {selectedTags.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground">Selected:</span>
                    {selectedTags.map((t) => (
                      <Badge
                        key={t}
                        variant="secondary"
                        className="gap-1 pr-1 cursor-pointer"
                        onClick={() => toggleTag(t)}
                      >
                        {t}
                        <X className="h-3 w-3" />
                      </Badge>
                    ))}
                  </div>
                )}
              </Field>

              <div className="flex justify-end">
                <Button type="submit" className="gap-1.5" disabled={preferencesMutation.isPending}>
                  <Save className="h-3.5 w-3.5" />
                  {preferencesMutation.isPending ? 'Saving…' : 'Save preferences'}
                </Button>
              </div>
            </form>
          </section>

          <Separator />

          {/* ── Security section ────────────────────────────── */}
          <section id="security" aria-labelledby="section-security">
            <div className="mb-5 flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <h2 id="section-security" className="text-base font-semibold">Security</h2>
            </div>

            {/* 2FA toggle */}
            <div className="mb-6 rounded-xl border border-border/60 bg-card p-5">
              <Field orientation="horizontal" className="items-center justify-between">
                <div>
                  <FieldTitle className="gap-1.5">
                    {twoFa ? (
                      <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Shield className="h-4 w-4 text-muted-foreground" />
                    )}
                    Two-factor authentication
                  </FieldTitle>
                  <FieldDescription className="mt-0.5">
                    {twoFa
                      ? 'Enabled — your account is protected.'
                      : 'Add a second layer of security to your account.'}
                  </FieldDescription>
                </div>
                <Switch
                  checked={twoFa}
                  onCheckedChange={handleTwoFaChange}
                  disabled={twoFaSetupMutation.isPending || twoFaConfirmMutation.isPending || twoFaDisableMutation.isPending}
                  aria-label="Toggle 2FA"
                />
              </Field>
            </div>

            {/* Change password */}
            <p className="mb-4 text-sm font-medium">Change password</p>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <FieldGroup>
                <Field data-invalid={!!passwordErrors.next || undefined}>
                  <FieldLabel htmlFor="new-password">New password</FieldLabel>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPass.next ? 'text' : 'password'}
                      value={passwordForm.next}
                      onChange={(e) => setPasswordForm((p) => ({ ...p, next: e.target.value }))}
                      placeholder="At least 8 characters"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((p) => ({ ...p, next: !p.next }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label="Toggle password visibility"
                    >
                      {showPass.next ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <FieldError errors={passwordErrors.next ? [{ message: passwordErrors.next }] : []} />
                </Field>

                <FieldSeparator />

                <Field data-invalid={!!passwordErrors.confirm || undefined}>
                  <FieldLabel htmlFor="confirm-password">Confirm new password</FieldLabel>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showPass.confirm ? 'text' : 'password'}
                      value={passwordForm.confirm}
                      onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))}
                      placeholder="Repeat new password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((p) => ({ ...p, confirm: !p.confirm }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label="Toggle password visibility"
                    >
                      {showPass.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <FieldError errors={passwordErrors.confirm ? [{ message: passwordErrors.confirm }] : []} />
                </Field>
              </FieldGroup>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="outline"
                  className="gap-1.5"
                  disabled={passwordMutation.isPending}
                >
                  <Save className="h-3.5 w-3.5" />
                  {passwordMutation.isPending ? 'Updating…' : 'Update password'}
                </Button>
              </div>
            </form>
          </section>

          <Separator />

          {/* ── Notifications section ───────────────────────── */}
          <section id="notifications" aria-labelledby="section-notifications">
            <div className="mb-5 flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <h2 id="section-notifications" className="text-base font-semibold">Notifications</h2>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-border/60 bg-card p-5">
                <Field orientation="horizontal" className="items-center justify-between">
                  <div>
                    <FieldTitle>Email notifications</FieldTitle>
                    <FieldDescription className="mt-0.5">
                      Receive updates about events, tickets, and account activity.
                    </FieldDescription>
                  </div>
                  <Switch
                    checked={notificationsEnabled}
                    onCheckedChange={handleNotificationsChange}
                    disabled={notificationsMutation.isPending}
                    aria-label="Toggle email notifications"
                  />
                </Field>
              </div>

              <div className="rounded-xl border border-border/60 bg-card p-5">
                <Field orientation="horizontal" className="items-center justify-between">
                  <div>
                    <FieldTitle>Browser push notifications</FieldTitle>
                    <FieldDescription className="mt-0.5">
                      Permission status: {browserPushPermission === 'unsupported' ? 'unsupported' : browserPushPermission}
                    </FieldDescription>
                  </div>
                  <Switch
                    checked={pushNotificationsEnabled}
                    onCheckedChange={handlePushNotificationsChange}
                    disabled={pushNotificationsMutation.isPending || browserPushPermission === 'unsupported'}
                    aria-label="Toggle browser push notifications"
                  />
                </Field>
              </div>

              <div className="rounded-xl border border-border/60 bg-card p-5">
                <Field orientation="horizontal" className="items-center justify-between">
                  <div>
                    <FieldTitle>Payment confirmation emails</FieldTitle>
                    <FieldDescription className="mt-0.5">
                      Receive email confirmations after successful payments.
                    </FieldDescription>
                  </div>
                  <Switch
                    checked={paymentEmailEnabled}
                    onCheckedChange={handlePaymentEmailChange}
                    disabled={paymentEmailMutation.isPending}
                    aria-label="Toggle payment confirmation emails"
                  />
                </Field>
              </div>

              <div className="rounded-xl border border-border/60 bg-card p-5">
                <Field orientation="horizontal" className="items-center justify-between">
                  <div>
                    <FieldTitle>Subscription notifications</FieldTitle>
                    <FieldDescription className="mt-0.5">
                      Get notified about updates from organizations you follow.
                    </FieldDescription>
                  </div>
                  <Switch
                    checked={subscriptionNotificationsEnabled}
                    onCheckedChange={handleSubscriptionNotificationsChange}
                    disabled={subscriptionNotificationsMutation.isPending}
                    aria-label="Toggle subscription notifications"
                  />
                </Field>
              </div>

              <div className="rounded-xl border border-border/60 bg-card p-5">
                <Field orientation="horizontal" className="items-center justify-between">
                  <div>
                    <FieldTitle>Login notifications</FieldTitle>
                    <FieldDescription className="mt-0.5">
                      Get an email when a new login is detected on your account.
                    </FieldDescription>
                  </div>
                  <Switch
                    checked={loginNotificationsEnabled}
                    onCheckedChange={handleLoginNotificationsChange}
                    disabled={loginNotificationsMutation.isPending}
                    aria-label="Toggle login notifications"
                  />
                </Field>
              </div>
            </div>
          </section>

          <Separator />

          {/* ── Sessions section ─────────────────────────────── */}
          <section id="sessions" aria-labelledby="section-sessions">
            <div className="mb-5 flex items-center gap-2">
              <Monitor className="h-4 w-4 text-muted-foreground" />
              <h2 id="section-sessions" className="text-base font-semibold">Active Sessions</h2>
            </div>

            <p className="mb-4 text-sm text-muted-foreground">
              Devices that are currently logged into your account. You can revoke any session you don&apos;t recognize.
            </p>

            <div className="space-y-3">
              {sessions.map((session) => {
                const parsed = parseUserAgent(session.user_agent);
                const DeviceIcon = parsed.isMobile ? Smartphone : Monitor;
                return (
                  <div key={session.id} className="rounded-xl border border-border/60 bg-card p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <DeviceIcon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            {parsed.browser} on {parsed.os}
                          </p>
                          {session.ip_address && (
                            <p className="text-xs text-muted-foreground">
                              IP: {session.ip_address}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Last active: {formatSessionDate(session.last_active_at)}
                            {' · '}
                            Created: {formatSessionDate(session.created_at)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-destructive hover:text-destructive"
                        onClick={() => revokeSessionMutation.mutate(session.id)}
                        disabled={revokeSessionMutation.isPending}
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        Revoke
                      </Button>
                    </div>
                  </div>
                );
              })}
              {sessions.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">No active sessions found.</p>
              )}
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}
