import { useState } from 'react';
import { Monitor, Smartphone, Trash2 } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
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
  Badge,
  Button,
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@shared/components';
import { sessionsApi } from '@shared/api';
import type { UserSessionInfo } from '@shared/api';
import { useAuth } from '@shared/lib/auth-context';
import { useAppContext } from '@shared/lib';
import { parseUserAgent, formatSessionDate } from './sessionHelpers';

interface SessionsSectionProps {
  twoFa: boolean;
}

export function SessionsSection({ twoFa }: SessionsSectionProps) {
  const { t } = useAppContext();
  const { isAuthenticated, logout: authLogout } = useAuth();
  const [revokeSessionId, setRevokeSessionId] = useState<string | null>(null);
  const [revokeSessionCode, setRevokeSessionCode] = useState('');
  const [confirmRevokeCurrentId, setConfirmRevokeCurrentId] = useState<string | null>(null);

  const { data: sessions = [], refetch: refetchSessions } = useQuery({
    queryKey: ['user-sessions'],
    queryFn: () => sessionsApi.getAll(),
    enabled: isAuthenticated,
  });

  const revokeSessionMutation = useMutation({
    mutationFn: ({ sessionId, code }: { sessionId: string; code?: string }) => sessionsApi.revoke(sessionId, code),
    onSuccess: async (_data, variables) => {
      const wasCurrentSession = sessions.find((s: UserSessionInfo) => s.id === variables.sessionId)?.is_current;
      if (wasCurrentSession) {
        authLogout();
        window.location.href = '/';
        return;
      }
      await refetchSessions();
      setRevokeSessionId(null);
      setRevokeSessionCode('');
      setConfirmRevokeCurrentId(null);
      toast.success(t.profileSettings.sessions.revoked);
    },
    onError: () => { toast.error(t.profileSettings.sessions.revokeFailed); setRevokeSessionCode(''); },
  });

  return (
    <>
      {/* Revoke session 2FA confirmation */}
      <AlertDialog open={!!revokeSessionId} onOpenChange={(o) => { if (!o) { setRevokeSessionId(null); setRevokeSessionCode(''); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.profileSettings.sessions.confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.profileSettings.sessions.confirmDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col items-center gap-2 py-2">
            <InputOTP maxLength={6} value={revokeSessionCode} onChange={setRevokeSessionCode}>
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
            <AlertDialogCancel disabled={revokeSessionMutation.isPending}>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (revokeSessionId) revokeSessionMutation.mutate({ sessionId: revokeSessionId, code: revokeSessionCode }); }}
              disabled={revokeSessionMutation.isPending || revokeSessionCode.length !== 6}
            >
              {revokeSessionMutation.isPending ? t.profileSettings.sessions.revoking : t.profileSettings.sessions.revokeSession}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke current session confirmation */}
      <AlertDialog open={!!confirmRevokeCurrentId} onOpenChange={(o) => { if (!o) setConfirmRevokeCurrentId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.profileSettings.sessions.revokeCurrentTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.profileSettings.sessions.revokeCurrentDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revokeSessionMutation.isPending}>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (confirmRevokeCurrentId) revokeSessionMutation.mutate({ sessionId: confirmRevokeCurrentId }); }}
              disabled={revokeSessionMutation.isPending}
            >
              {revokeSessionMutation.isPending ? t.profileSettings.sessions.revoking : t.profileSettings.sessions.logoutRevoke}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <p className="mb-4 text-sm text-muted-foreground">
        {t.profileSettings.sessions.description}
      </p>

      <div className="space-y-3">
        {sessions.map((session: UserSessionInfo) => {
          const parsed = parseUserAgent(session.user_agent, t.profileSettings.sessions.unknown);
          const DeviceIcon = parsed.isMobile ? Smartphone : Monitor;
          return (
            <div key={session.id} className={`rounded-xl border p-5 ${session.is_current ? 'border-primary/40 bg-primary/5' : 'border-border/60 bg-card'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <DeviceIcon className={`mt-0.5 h-5 w-5 shrink-0 ${session.is_current ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div className="space-y-1">
                    <p className="flex items-center gap-2 text-sm font-medium">
                      {t.profileSettings.sessions.browserOn.replace('{{browser}}', parsed.browser).replace('{{os}}', parsed.os)}
                      {session.is_current && (
                        <Badge variant="outline" className="border-primary/40 text-primary text-[10px] px-1.5 py-0">
                          {t.profileSettings.sessions.current}
                        </Badge>
                      )}
                    </p>
                    {session.ip_address && (
                      <p className="text-xs text-muted-foreground">
                        {t.profileSettings.sessions.ip} {session.ip_address}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {t.profileSettings.sessions.lastActive} {formatSessionDate(session.last_active_at, t.profileSettings.sessions)}
                      {' · '}
                      {t.profileSettings.sessions.created} {formatSessionDate(session.created_at, t.profileSettings.sessions)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-destructive hover:text-destructive"
                  onClick={() => {
                    if (twoFa) {
                      setRevokeSessionId(session.id);
                      setRevokeSessionCode('');
                    } else if (session.is_current) {
                      setConfirmRevokeCurrentId(session.id);
                    } else {
                      revokeSessionMutation.mutate({ sessionId: session.id });
                    }
                  }}
                  disabled={revokeSessionMutation.isPending}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  {t.profileSettings.sessions.revoke}
                </Button>
              </div>
            </div>
          );
        })}
        {sessions.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">{t.profileSettings.sessions.noSessions}</p>
        )}
      </div>
    </>
  );
}
