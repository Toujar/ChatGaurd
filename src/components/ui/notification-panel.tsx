import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Check, MessageSquare, AlertTriangle, Shield, CheckCheck } from 'lucide-react';
import { useNotificationStore, useUIStore } from '@/store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { Notification } from '@/types';

const notificationIcons: Record<Notification['type'], typeof Bell> = {
  message: MessageSquare,
  mention: MessageSquare,
  protection_alert: Shield,
  policy_violation: AlertTriangle,
  approval_request: Bell,
  system: Bell,
  risk_alert: AlertTriangle,
};

const notificationColors: Record<Notification['type'], string> = {
  message: 'text-primary',
  mention: 'text-primary',
  protection_alert: 'text-warning',
  policy_violation: 'text-destructive',
  approval_request: 'text-info',
  system: 'text-muted-foreground',
  risk_alert: 'text-warning',
};

export function NotificationPanel() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore();
  const { notificationPanelOpen, setNotificationPanelOpen } = useUIStore();

  return (
    <AnimatePresence>
      {notificationPanelOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setNotificationPanelOpen(false)}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 h-screen w-full max-w-md border-l border-border bg-card/95 backdrop-blur-xl shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border/50 px-4 py-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    <CheckCheck className="mr-1 h-3 w-3" />
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setNotificationPanelOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <ScrollArea className="h-[calc(100vh-80px)]">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-sm font-medium">No notifications</h3>
                  <p className="text-xs text-muted-foreground">
                    You're all caught up!
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {notifications.map((notification) => {
                    const Icon = notificationIcons[notification.type];
                    const color = notificationColors[notification.type];
                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          'relative flex gap-3 p-4 transition-colors hover:bg-muted/50',
                          !notification.read && 'bg-primary/5'
                        )}
                      >
                        <div className={cn('mt-1', color)}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium leading-tight">
                              {notification.title}
                            </p>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatRelativeTime(notification.created_at)}
                            </span>
                          </div>
                          {notification.content && (
                            <p className="text-sm text-muted-foreground">
                              {notification.content}
                            </p>
                          )}
                        </div>
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:text-foreground"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
