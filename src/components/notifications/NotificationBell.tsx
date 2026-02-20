import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NotificationsPanel } from './NotificationsPanel';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const { unreadCount, fetchUnreadCount } = useNotificationStore();

  // Fetch unread count on mount and periodically
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (user) {
      fetchUnreadCount(user.employeeId, user.role);

      // Poll every 30 seconds for new notifications
      interval = setInterval(() => {
        fetchUnreadCount(user.employeeId, user.role);
      }, 30000);
    }

    // Cleanup function always runs, even if user becomes null
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [user, fetchUnreadCount]);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen(true)}
        aria-label={unreadCount > 0 ? `Notifications: ${unreadCount} unread` : 'Notifications'}
        aria-live="polite"
        aria-atomic="true"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            aria-label={`${unreadCount} unread notifications`}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      <NotificationsPanel open={open} onOpenChange={setOpen} />
    </>
  );
}
