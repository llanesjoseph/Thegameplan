'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, X, Check, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Notification, NotificationType } from '@/types/video-critique';
import {
  subscribeToUserNotifications,
  subscribeToUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/lib/data/notifications';

interface NotificationCenterProps {
  userId: string;
}

export default function NotificationCenter({ userId }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null);

  // Subscribe to notifications and unread count
  useEffect(() => {
    if (!userId) return;

    // Subscribe to notifications
    const unsubscribeNotifications = subscribeToUserNotifications(
      userId,
      (updatedNotifications) => {
        setNotifications(updatedNotifications);
        setLoading(false);
      }
    );

    // Subscribe to unread count
    const unsubscribeCount = subscribeToUnreadCount(userId, (count) => {
      setUnreadCount(count);
    });

    setLoading(true);

    return () => {
      unsubscribeNotifications();
      unsubscribeCount();
    };
  }, [userId]);

  // Handle marking a notification as read
  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    setMarkingAsRead(notificationId);
    try {
      await markNotificationAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    } finally {
      setMarkingAsRead(null);
    }
  }, []);

  // Handle marking all notifications as read
  const handleMarkAllAsRead = useCallback(async () => {
    setLoading(true);
    try {
      await markAllNotificationsAsRead(userId);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Get notification icon based on type
  const getNotificationIcon = (type: NotificationType) => {
    const icons = {
      new_submission: '📹',
      submission_claimed: '✋',
      review_published: '✅',
      sla_breach: '⚠️',
      comment_added: '💬',
      needs_resubmission: '🔄',
      followup_requested: '📝',
    };
    return icons[type] || '📢';
  };

  // Get notification color based on type
  const getNotificationColor = (type: NotificationType) => {
    const colors = {
      new_submission: 'bg-blue-50 border-blue-200',
      submission_claimed: 'bg-green-50 border-green-200',
      review_published: 'bg-purple-50 border-purple-200',
      sla_breach: 'bg-red-50 border-red-200',
      comment_added: 'bg-gray-50 border-gray-200',
      needs_resubmission: 'bg-orange-50 border-orange-200',
      followup_requested: 'bg-yellow-50 border-yellow-200',
    };
    return colors[type] || 'bg-gray-50 border-gray-200';
  };

  // Format notification date
  const formatDate = (date: any) => {
    if (!date) return '';

    const notificationDate = date instanceof Date
      ? date
      : date.toDate?.() || new Date(date);

    return formatDistanceToNow(notificationDate, { addSuffix: true });
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative p-2"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-0" align="end">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={loading}
            >
              Mark all as read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                        getNotificationColor(notification.type)
                      } border`}
                    >
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {formatDate(notification.createdAt)}
                        </span>
                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                              disabled={markingAsRead === notification.id}
                              className="h-6 px-2"
                            >
                              {markingAsRead === notification.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                          <Link href={notification.link}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2"
                              onClick={() => {
                                setIsOpen(false);
                                if (!notification.read) {
                                  handleMarkAsRead(notification.id);
                                }
                              }}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-3 border-t">
            <Link href="/dashboard/notifications">
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setIsOpen(false)}
              >
                View all notifications
              </Button>
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}