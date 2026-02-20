import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Bell,
  BellOff,
  Check,
  Clock,
  AlertCircle,
  Info,
  MessageSquare,
  User,
  Settings,
  X,
  Volume2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: 'status' | 'comment' | 'assignment' | 'sla' | 'system';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  ticketId?: string;
  ticketNumber?: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  icon?: React.ElementType;
  metadata?: Record<string, unknown>;
}

interface NotificationPreferences {
  enabled: boolean;
  sound: boolean;
  desktop: boolean;
  email: boolean;
  statusChanges: boolean;
  newComments: boolean;
  assignments: boolean;
  slaAlerts: boolean;
  systemMessages: boolean;
}

interface StatusNotificationsProps {
  userId?: string;
  onNotificationClick?: (notification: Notification) => void;
  className?: string;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  sound: true,
  desktop: true,
  email: true,
  statusChanges: true,
  newComments: true,
  assignments: true,
  slaAlerts: true,
  systemMessages: true,
};

const NOTIFICATION_ICONS: Record<Notification['type'], React.ElementType> = {
  status: AlertCircle,
  comment: MessageSquare,
  assignment: User,
  sla: Clock,
  system: Info,
};

const PRIORITY_COLORS: Record<Notification['priority'], string> = {
  low: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

// Mock notifications for demonstration
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'status',
    priority: 'high',
    title: 'Ticket Status Updated',
    message: 'Ticket #TKT-001 has been moved to "In Progress" by John Doe',
    ticketId: 'TKT-001',
    ticketNumber: 'TKT-001',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    read: false,
    actionUrl: '/tickets/TKT-001',
  },
  {
    id: '2',
    type: 'comment',
    priority: 'medium',
    title: 'New Comment',
    message: 'Jane Smith added a comment to your ticket #TKT-002',
    ticketId: 'TKT-002',
    ticketNumber: 'TKT-002',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    read: false,
    actionUrl: '/tickets/TKT-002',
  },
  {
    id: '3',
    type: 'assignment',
    priority: 'medium',
    title: 'Ticket Assigned',
    message: 'Ticket #TKT-003 has been assigned to you',
    ticketId: 'TKT-003',
    ticketNumber: 'TKT-003',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    read: true,
    actionUrl: '/tickets/TKT-003',
  },
  {
    id: '4',
    type: 'sla',
    priority: 'urgent',
    title: 'SLA Breach Warning',
    message: 'Ticket #TKT-004 will breach SLA in 1 hour',
    ticketId: 'TKT-004',
    ticketNumber: 'TKT-004',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    read: false,
    actionUrl: '/tickets/TKT-004',
  },
  {
    id: '5',
    type: 'system',
    priority: 'low',
    title: 'System Maintenance',
    message: 'Scheduled maintenance on Sunday, 2AM - 4AM EST',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    read: true,
  },
];

export const StatusNotifications = React.memo<StatusNotificationsProps>(({

  onNotificationClick,
  className = '',
}) => {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | Notification['type']>('all');
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);

  // Calculate unread count
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    if (selectedFilter === 'all') {
      return notifications;
    }
    return notifications.filter(n => n.type === selectedFilter);
  }, [notifications, selectedFilter]);

  // Request notification permission
  useEffect(() => {
    if (preferences.desktop && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [preferences.desktop]);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Ignore if sound fails to play
      });
    } catch {
      // Ignore sound errors
    }
  }, []);

  // Handle new notification
  const handleNewNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);

    // Show toast
    if (preferences.enabled) {
      const Icon = NOTIFICATION_ICONS[notification.type];
      toast(notification.title, {
        description: notification.message,
        icon: <Icon className="w-4 h-4" />,
        action: notification.actionUrl ? {
          label: 'View',
          onClick: () => onNotificationClick?.(notification),
        } : undefined,
      });

      // Play sound
      if (preferences.sound) {
        playNotificationSound();
      }

      // Show desktop notification
      if (preferences.desktop && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: notification.id,
        });
      }
    }
  }, [preferences, onNotificationClick, playNotificationSound]);

  // Simulate WebSocket connection for real-time updates
  useEffect(() => {
    if (!preferences.enabled) return;

    // Simulate receiving notifications
    const interval = setInterval(() => {
      // Random chance to receive a notification
      if (Math.random() > 0.7) {
        const mockNotification: Notification = {
          id: Date.now().toString(),
          type: ['status', 'comment', 'assignment', 'sla'][Math.floor(Math.random() * 4)] as Notification['type'],
          priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as Notification['priority'],
          title: 'New Update',
          message: 'You have a new notification',
          timestamp: new Date().toISOString(),
          read: false,
        };

        handleNewNotification(mockNotification);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [preferences.enabled, handleNewNotification]);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success('All notifications marked as read');
  }, []);

  // Delete notification
  const deleteNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    toast.success('Notification deleted');
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    toast.success('All notifications cleared');
  }, []);

  // Handle notification click
  const handleNotificationAction = useCallback((notification: Notification) => {
    markAsRead(notification.id);
    onNotificationClick?.(notification);
    setIsNotificationPanelOpen(false);
  }, [markAsRead, onNotificationClick]);

  // Update preferences
  const updatePreferences = useCallback((updates: Partial<NotificationPreferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }));
    toast.success('Notification preferences updated');
  }, []);

  // Get notification icon
  const getNotificationIcon = (notification: Notification) => {
    return notification.icon || NOTIFICATION_ICONS[notification.type];
  };

  return (
    <div className={className}>
      {/* Notification Bell Button */}
      <DropdownMenu open={isNotificationPanelOpen} onOpenChange={setIsNotificationPanelOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            {preferences.enabled ? (
              <Bell className="w-5 h-5" />
            ) : (
              <BellOff className="w-5 h-5" />
            )}
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-96">
          <div className="flex items-center justify-between p-3 border-b">
            <div>
              <h3 className="font-semibold">Notifications</h3>
              <p className="text-xs text-muted-foreground">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsSettingsOpen(true)}
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="p-2 border-b">
            <Tabs value={selectedFilter} onValueChange={(v) => setSelectedFilter(v as 'all' | Notification['type'])}>
              <TabsList className="w-full grid grid-cols-5">
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                <TabsTrigger value="status" className="text-xs">Status</TabsTrigger>
                <TabsTrigger value="comment" className="text-xs">Comments</TabsTrigger>
                <TabsTrigger value="assignment" className="text-xs">Tasks</TabsTrigger>
                <TabsTrigger value="sla" className="text-xs">SLA</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Notifications List */}
          <ScrollArea className="h-[400px]">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Bell className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredNotifications.map((notification) => {
                  const Icon = getNotificationIcon(notification);
                  
                  return (
                    <div
                      key={notification.id}
                      className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-colors ${
                        !notification.read ? 'bg-blue-50 dark:bg-blue-950' : ''
                      }`}
                      onClick={() => handleNotificationAction(notification)}
                    >
                      <div className="flex gap-3">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                          PRIORITY_COLORS[notification.priority]
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className={`text-sm font-medium ${!notification.read ? 'font-semibold' : ''}`}>
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>
                              {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                            </span>
                            {notification.ticketNumber && (
                              <>
                                <span>•</span>
                                <Badge variant="outline" className="text-xs">
                                  {notification.ticketNumber}
                                </Badge>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Footer Actions */}
          {filteredNotifications.length > 0 && (
            <div className="border-t p-2 flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                <Check className="w-4 h-4 mr-2" />
                Mark All Read
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={clearAllNotifications}
              >
                <X className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Notification Settings</DialogTitle>
            <DialogDescription>
              Configure how and when you receive notifications
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Master Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Enable Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Turn all notifications on or off
                </p>
              </div>
              <Switch
                checked={preferences.enabled}
                onCheckedChange={(enabled) => updatePreferences({ enabled })}
              />
            </div>

            <div className="border-t pt-4 space-y-4">
              <h4 className="font-medium">Notification Channels</h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-muted-foreground" />
                    <Label>Sound</Label>
                  </div>
                  <Switch
                    checked={preferences.sound}
                    onCheckedChange={(sound) => updatePreferences({ sound })}
                    disabled={!preferences.enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                    <Label>Desktop Notifications</Label>
                  </div>
                  <Switch
                    checked={preferences.desktop}
                    onCheckedChange={(desktop) => updatePreferences({ desktop })}
                    disabled={!preferences.enabled}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <h4 className="font-medium">Notification Types</h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Status Changes</Label>
                  <Switch
                    checked={preferences.statusChanges}
                    onCheckedChange={(statusChanges) => updatePreferences({ statusChanges })}
                    disabled={!preferences.enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>New Comments</Label>
                  <Switch
                    checked={preferences.newComments}
                    onCheckedChange={(newComments) => updatePreferences({ newComments })}
                    disabled={!preferences.enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Ticket Assignments</Label>
                  <Switch
                    checked={preferences.assignments}
                    onCheckedChange={(assignments) => updatePreferences({ assignments })}
                    disabled={!preferences.enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>SLA Alerts</Label>
                  <Switch
                    checked={preferences.slaAlerts}
                    onCheckedChange={(slaAlerts) => updatePreferences({ slaAlerts })}
                    disabled={!preferences.enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>System Messages</Label>
                  <Switch
                    checked={preferences.systemMessages}
                    onCheckedChange={(systemMessages) => updatePreferences({ systemMessages })}
                    disabled={!preferences.enabled}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setIsSettingsOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

StatusNotifications.displayName = 'StatusNotifications';

export default StatusNotifications;
