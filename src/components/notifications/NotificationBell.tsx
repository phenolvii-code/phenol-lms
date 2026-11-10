'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  StudentNotification,
  fetchMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/lib/data/notifications';
import { Bell, CheckCheck, BookOpen, Clock, ChevronRight } from 'lucide-react';

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className = '' }: NotificationBellProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<StudentNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    const list = await fetchMyNotifications();
    setNotifications(list);
  };

  useEffect(() => {
    loadNotifications();

    // Auto-refresh every 45 seconds to catch new lecture drops
    const interval = setInterval(loadNotifications, 45000);

    // Click outside listener
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleItemClick = async (notif: StudentNotification) => {
    if (!notif.is_read) {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
      await markNotificationAsRead(notif.id);
    }
    setIsOpen(false);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    setIsLoading(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await markAllNotificationsAsRead();
    setIsLoading(false);
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const now = new Date();
      const past = new Date(isoString);
      const diffMs = now.getTime() - past.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    } catch {
      return '';
    }
  };

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) loadNotifications();
        }}
        className="relative p-2 rounded-full text-charcoal-100 hover:text-charcoal-900 hover:bg-ivory-300/50 transition-colors focus:outline-none focus:ring-1 focus:ring-burgundy-500"
        aria-label="Course Notifications"
        title="Notifications"
      >
        <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-burgundy-600 text-[10px] font-bold font-mono text-white shadow-sm ring-2 ring-ivory-100 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 sm:right-auto sm:left-auto mt-2 w-80 sm:w-96 bg-ivory-100 border border-hairline rounded-2xl shadow-editorial z-50 overflow-hidden font-sans animate-fade-in text-charcoal-900">
          {/* Header */}
          <div className="p-3.5 sm:p-4 border-b border-hairline bg-ivory-200/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-display uppercase tracking-wider">
                Notifications / الإشعارات
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-burgundy-50 text-burgundy-700 border border-burgundy-200">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={isLoading}
                className="text-[11px] text-charcoal-100 hover:text-burgundy-600 font-medium flex items-center gap-1 transition-colors"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-hairline">
            {notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Bell className="w-8 h-8 text-charcoal-50/40 mx-auto" />
                <p className="text-xs text-charcoal-100 font-sans">
                  No notifications yet.
                </p>
                <p className="text-[11px] text-charcoal-50 font-formula">
                  New lectures published in your courses will appear here.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className={`p-3.5 sm:p-4 flex items-start gap-3 cursor-pointer transition-colors ${
                    notif.is_read
                      ? 'bg-ivory-100/60 hover:bg-ivory-200/60 opacity-80'
                      : 'bg-white hover:bg-ivory-50'
                  }`}
                >
                  {/* Left Icon or Unread Dot */}
                  <div className="relative mt-0.5 shrink-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        notif.is_read
                          ? 'bg-ivory-300 text-charcoal-100'
                          : 'bg-burgundy-50 text-burgundy-700 border border-burgundy-200'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                    </div>
                    {!notif.is_read && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-burgundy-600 ring-2 ring-white" />
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <h4
                        className={`text-xs truncate ${
                          notif.is_read
                            ? 'font-medium text-charcoal-900'
                            : 'font-bold text-burgundy-950 font-display'
                        }`}
                      >
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-charcoal-50 font-mono shrink-0 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{formatRelativeTime(notif.created_at)}</span>
                      </span>
                    </div>

                    <p className="text-[11px] text-charcoal-100 line-clamp-2 leading-relaxed font-sans">
                      {notif.message}
                    </p>
                  </div>

                  <ChevronRight className="w-3.5 h-3.5 text-charcoal-50 shrink-0 mt-2" />
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
