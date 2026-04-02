import { Bell, ExternalLink } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@shared/components';
import { useAppContext } from '@shared/lib';
import { useMarkNotificationRead, useMyNotifications } from '@entities/Notification';

type NotificationsBellProps = {
  enabled: boolean;
};

function formatNotificationDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString();
}

export function NotificationsBell({ enabled }: NotificationsBellProps) {
  const { t } = useAppContext();
  const navigate = useNavigate();
  const { data: notifications = [], isLoading } = useMyNotifications(enabled, 20);
  const markReadMutation = useMarkNotificationRead();

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-card text-muted-foreground transition-colors hover:text-foreground"
        aria-label={t.notificationsBell.title}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-w-[90vw]">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>{t.notificationsBell.title}</span>
          <Badge variant="secondary">{unreadCount} {t.notificationsBell.unread}</Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
          <DropdownMenuItem disabled>{t.common.loading}</DropdownMenuItem>
        ) : notifications.length === 0 ? (
          <DropdownMenuItem disabled>{t.notificationsBell.noNotifications}</DropdownMenuItem>
        ) : (
          notifications.map((item) => (
            <DropdownMenuItem
              key={item.id}
              onClick={() => {
                if (!item.read && !markReadMutation.isPending) {
                  markReadMutation.mutate(item.id);
                }
                if (item.link) {
                  navigate(item.link);
                }
              }}
              className={`items-start ${item.link ? 'cursor-pointer' : ''}`}
            >
              <div className="flex w-full flex-col gap-1">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-foreground">{item.title}</span>
                  <div className="flex shrink-0 items-center gap-1">
                    {item.link && <ExternalLink className="h-3 w-3 text-muted-foreground" />}
                    {!item.read && <span className="mt-0.5 h-2 w-2 rounded-full bg-primary" />}
                  </div>
                </div>
                <p className="line-clamp-2 text-xs text-muted-foreground">{item.content}</p>
                <span className="text-[11px] text-muted-foreground">{formatNotificationDate(item.createdAt)}</span>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
