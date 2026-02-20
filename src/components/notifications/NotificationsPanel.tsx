import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Bell,
  CheckCheck,
  Trash2,
  Calendar,
  Ticket,
  Megaphone,
  Gift,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Notification, NotificationGroup } from '@/types/notification';

interface NotificationsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationsPanel({ open, onOpenChange }: NotificationsPanelProps) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearAll,
  } = useNotificationStore();

  // Fetch notifications on mount and when panel opens
  useEffect(() => {
    if (open && user) {
      fetchNotifications(user.id, user.role);
    }
  }, [open, user, fetchNotifications]);


  // Group notifications by time
  const groupedNotifications = useMemo<NotificationGroup[]>(() => {
    const now = new Date();
    const today: Notification[] = [];
    const yesterday: Notification[] = [];
    const thisWeek: Notification[] = [];
    const older: Notification[] = [];

    notifications.forEach((notification) => {
      const createdAt = new Date(notification.createdAt);
      const diffInDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

      if (diffInDays === 0) {
        today.push(notification);
      } else if (diffInDays === 1) {
        yesterday.push(notification);
      } else if (diffInDays <= 7) {
        thisWeek.push(notification);
      } else {
        older.push(notification);
      }
    });

    const groups: NotificationGroup[] = [];
    if (today.length > 0) groups.push({ label: 'Today', notifications: today });
    if (yesterday.length > 0) groups.push({ label: 'Yesterday', notifications: yesterday });
    if (thisWeek.length > 0) groups.push({ label: 'This Week', notifications: thisWeek });
    if (older.length > 0) groups.push({ label: 'Older', notifications: older });

    return groups;
  }, [notifications]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'leave':
        return Calendar;
      case 'ticket':
        return Ticket;
      case 'announcement':
        return Megaphone;
      case 'celebration':
      case 'reminder':
        return Gift;
      case 'approval':
        return CheckCircle;
      case 'rejection':
        return XCircle;
      default:
        return AlertCircle;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'leave':
        return 'text-primary bg-primary/10';
      case 'ticket':
        return 'text-primary bg-primary/10';
      case 'announcement':
        return 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/10';
      case 'celebration':
      case 'reminder':
        return 'text-primary bg-primary/10';
      case 'approval':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/10';
      case 'rejection':
        return 'text-destructive bg-red-100 dark:bg-red-900/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Navigate to appropriate page based on meta data or notification type
    const meta = notification.meta;
    
    // Priority: actionUrl > specific IDs > type-based fallback
    if (meta?.actionUrl) {
      navigate(meta.actionUrl);
    } else if (meta?.leaveId) {
      navigate('/leave');
    } else if (meta?.ticketId || meta?.ticketNumber) {
      // Route to appropriate helpdesk page based on user role
      if (user?.role === 'IT_ADMIN' || user?.role === 'IT_EMPLOYEE') {
        navigate('/itadmin/tickets');
      } else if (user?.role === 'L1_APPROVER' || user?.role === 'L2_APPROVER' || user?.role === 'L3_APPROVER') {
        navigate('/approver');
      } else {
        navigate('/helpdesk');
      }
    } else if (meta?.announcementId) {
      navigate('/dashboard');
    } else {
      // Fallback based on notification type
      switch (notification.type) {
        case 'ticket':
        case 'approval':
        case 'rejection':
          if (user?.role === 'IT_ADMIN' || user?.role === 'IT_EMPLOYEE') {
            navigate('/itadmin/tickets');
          } else if (user?.role === 'L1_APPROVER' || user?.role === 'L2_APPROVER' || user?.role === 'L3_APPROVER') {
            navigate('/approver');
          } else {
            navigate('/helpdesk');
          }
          break;
        case 'leave':
          navigate('/leave');
          break;
        case 'announcement':
          navigate('/dashboard');
          break;
        default:
          // Stay on current page
          break;
      }
    }

    onOpenChange(false);
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    await markAllAsRead(user.id, user.role);
  };

  const handleClearAll = async () => {
    if (!user) return;
    await clearAll(user.id, user.role);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg" aria-label="Notifications panel">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" aria-hidden="true" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="default" className="ml-auto" aria-label={`${unreadCount} new notifications`}>
                {unreadCount} new
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            Stay updated with your latest activities
          </SheetDescription>
        </SheetHeader>

        <div className="flex items-center gap-2 mt-4 mb-2" role="group" aria-label="Notification actions">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            aria-label="Mark all notifications as read"
          >
            <CheckCheck className="h-4 w-4 mr-2" aria-hidden="true" />
            Mark All Read
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleClearAll}
            disabled={notifications.length === 0}
            aria-label="Clear all notifications"
          >
            <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
            Clear All
          </Button>
        </div>

        <Separator className="my-4" />

        <ScrollArea className="h-[calc(100vh-200px)] pr-4" aria-label="Notifications list" role="region">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-4 opacity-50" aria-hidden="true" />
              <h3 className="text-lg font-medium mb-2">No notifications</h3>
              <p className="text-sm text-muted-foreground">
                You're all caught up! Check back later for updates.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedNotifications.map((group) => (
                <div key={group.label}>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                    {group.label}
                  </h3>
                  <div className="space-y-2">
                    {group.notifications.map((notification) => {
                      const Icon = getNotificationIcon(notification.type);
                      const colorClass = getNotificationColor(notification.type);

                      return (
                        <div
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={cn(
                            'p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md',
                            !notification.isRead && 'bg-primary/5 border-primary/20',
                            notification.isRead && 'hover:bg-muted/50'
                          )}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleNotificationClick(notification);
                            }
                          }}
                          aria-label={`${notification.isRead ? 'Read' : 'Unread'} notification: ${notification.title}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn('p-2 rounded-lg flex-shrink-0', colorClass)}>
                              <Icon className="h-4 w-4" aria-hidden="true" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-medium text-sm truncate">
                                  {notification.title}
                                </h4>
                                {!notification.isRead && (
                                  <div 
                                    className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" 
                                    aria-label="Unread"
                                  />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {notification.description}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {formatDistanceToNow(new Date(notification.createdAt), {
                                  addSuffix: true,
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
