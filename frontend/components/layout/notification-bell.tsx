'use client';

import * as React from 'react';
import { Bell } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { notificationsService } from '@/services/notifications.service';
import type { Notification } from '@/types';

const POLL_INTERVAL_MS = 20_000;

export function NotificationBell() {
  const { accessToken, status } = useAuth();
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (status !== 'authenticated' || !accessToken) return;
    let cancelled = false;

    const poll = () => {
      notificationsService
        .unreadCount(accessToken)
        .then((count) => !cancelled && setUnreadCount(count))
        .catch(() => {});
    };

    poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [accessToken, status]);

  const handleOpenChange = async (next: boolean) => {
    setOpen(next);
    if (next && accessToken) {
      const list = await notificationsService.listMine(accessToken);
      setNotifications(list.slice(0, 8));
    }
  };

  const markAllRead = async () => {
    if (!accessToken) return;
    await notificationsService.markAllRead(accessToken);
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
  };

  if (status !== 'authenticated') return null;

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs font-medium text-primary hover:underline">
              Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">No notifications yet.</p>
        ) : (
          notifications.map((n) => (
            <DropdownMenuItem key={n.id} asChild className={n.readAt ? 'opacity-60' : ''}>
              <Link href={n.actionUrl ?? '#'} className="flex flex-col items-start gap-0.5 whitespace-normal">
                <span className="text-sm font-medium">{n.title}</span>
                <span className="text-xs text-muted-foreground">{n.message}</span>
              </Link>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
