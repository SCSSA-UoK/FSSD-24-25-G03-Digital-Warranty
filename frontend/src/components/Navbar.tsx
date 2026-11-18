import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { ThemeToggle } from './ThemeToggle';
import {
  ShieldCheck,
  Bell,
  LogOut,
  CheckCircle2,
  CheckCheck,
  User as UserIcon,
  ChevronRight,
  Clock,
  Inbox
} from 'lucide-react';
import { NotificationItem } from '../types';
import { getNotificationTargetRoute, getNotificationMeta, formatNotificationTime } from '../utils/notificationUtils';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [filterMode, setFilterMode] = useState<'ALL' | 'UNREAD'>('ALL');
  const [markingAll, setMarkingAll] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Click-outside and Escape key listener to close popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showNotifications]);

  const handleNotificationClick = async (n: NotificationItem) => {
    const isUnread = !Boolean(n.isRead === true || n.read === true);
    if (isUnread) {
      await markAsRead(n.id);
    }
    setShowNotifications(false);
    const targetRoute = getNotificationTargetRoute(n, user?.role);
    navigate(targetRoute);
  };

  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAll(true);
      await markAllAsRead();
    } finally {
      setMarkingAll(false);
    }
  };

  const displayedNotifications = filterMode === 'UNREAD'
    ? notifications.filter((n) => !Boolean(n.isRead === true || n.read === true))
    : notifications;

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            Administrator
          </span>
        );
      case 'RETAILER':
        return (
          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            Retailer
          </span>
        );
      case 'CUSTOMER':
        return (
          <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            Customer
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 transition">
          <div className="bg-indigo-600 text-white p-2 rounded-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
            Warran<span className="text-indigo-600 dark:text-indigo-400">Track</span>
          </span>
        </Link>

        {/* Right Nav */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          <ThemeToggle />

          {user ? (
            <>
              {getRoleBadge(user.role)}

              {/* Notifications Popover Container */}
              <div className="relative" ref={popoverRef}>
                <button
                  type="button"
                  onClick={() => setShowNotifications(!showNotifications)}
                  aria-expanded={showNotifications}
                  aria-label="Toggle notifications menu"
                  className={`relative p-2 rounded-full transition cursor-pointer ${
                    showNotifications
                      ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-400 ring-2 ring-indigo-200 dark:ring-indigo-800'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <>
                      {/* Subtle Ping Animation */}
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-400 animate-ping opacity-75" />
                      {/* Count Badge */}
                      <span className="absolute -top-0.5 -right-0.5 bg-rose-600 text-white text-[10px] font-bold px-1.5 min-w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shadow-xs">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    </>
                  )}
                </button>

                {/* Notifications Dropdown Panel */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-[420px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 py-0 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    {/* Header */}
                    <div className="p-4 bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100">Notifications</span>
                        {unreadCount > 0 ? (
                          <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                            {unreadCount} unread
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            All caught up
                          </span>
                        )}
                      </div>

                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllAsRead}
                          disabled={markingAll}
                          className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold px-2 py-1 rounded-md hover:bg-indigo-50 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
                          title="Mark all notifications as read"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>{markingAll ? 'Updating...' : 'Mark all read'}</span>
                        </button>
                      )}
                    </div>

                    {/* Filter Tabs */}
                    <div className="px-4 py-2 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setFilterMode('ALL')}
                        className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                          filterMode === 'ALL'
                            ? 'bg-slate-900 dark:bg-indigo-600 text-white'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        All ({notifications.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterMode('UNREAD')}
                        className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer flex items-center gap-1 ${
                          filterMode === 'UNREAD'
                            ? 'bg-slate-900 dark:bg-indigo-600 text-white'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span>Unread</span>
                        {unreadCount > 0 && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            filterMode === 'UNREAD' ? 'bg-indigo-500 text-white' : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                          }`}>
                            {unreadCount}
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Notification List */}
                    <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                      {displayedNotifications.length === 0 ? (
                        <div className="px-6 py-10 text-center space-y-2">
                          <Inbox className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            {filterMode === 'UNREAD' ? 'No unread notifications' : 'No notifications yet'}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mx-auto">
                            {filterMode === 'UNREAD'
                              ? "You're all caught up! Switch to 'All' to review historical notifications."
                              : 'Real-time alerts for warranty links, claim reviews, and account updates appear here.'}
                          </p>
                        </div>
                      ) : (
                        displayedNotifications.slice(0, 15).map((n) => {
                          const meta = getNotificationMeta(n.type);
                          const isUnread = !Boolean(n.isRead === true || n.read === true);

                          return (
                            <div
                              key={n.id}
                              onClick={() => handleNotificationClick(n)}
                              className={`group px-4 py-3.5 text-xs transition cursor-pointer flex items-start gap-3 relative ${
                                isUnread
                                  ? 'bg-indigo-50/75 dark:bg-indigo-950/40 border-l-4 border-l-indigo-600 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/50'
                                  : 'bg-white dark:bg-slate-900 border-l-4 border-l-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60'
                              }`}
                            >
                              {/* Read/Unread Status Indicator */}
                              <div className="mt-1 shrink-0">
                                {isUnread ? (
                                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 dark:bg-indigo-400 ring-4 ring-indigo-200 dark:ring-indigo-900 block shadow-xs" />
                                ) : (
                                  <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 block" />
                                )}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder} dark:bg-slate-800 dark:border-slate-700`}
                                  >
                                    {meta.category}
                                  </span>
                                  {isUnread && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-indigo-600 text-white">
                                      New
                                    </span>
                                  )}
                                  <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 ml-auto">
                                    <Clock className="w-3 h-3" />
                                    {formatNotificationTime(n.createdAt)}
                                  </span>
                                </div>

                                <p className={`leading-snug line-clamp-2 ${isUnread ? 'font-semibold text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}>
                                  {n.message}
                                </p>
                              </div>

                              {/* Action Buttons: Mark as Read & Context Navigation Arrow */}
                              <div className="flex items-center gap-1 shrink-0 self-center">
                                {isUnread && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsRead(n.id);
                                    }}
                                    title="Mark as read without opening"
                                    className="p-1 rounded-md text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:bg-indigo-200/50 dark:hover:bg-slate-800 transition cursor-pointer"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </button>
                                )}
                                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition" />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">Clicking any alert marks it as read and opens the record</span>
                      <Link
                        to="/notifications"
                        onClick={() => setShowNotifications(false)}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold transition flex items-center gap-1"
                      >
                        <span>View All</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* User details & Profile Link */}
              <Link
                to={user.role === 'CUSTOMER' ? '/customer/profile' : user.role === 'RETAILER' ? '/retailer/profile' : '#'}
                className="flex items-center gap-2.5 text-left p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition group"
                title={user.role === 'CUSTOMER' ? 'View My Customer Profile' : 'View Profile'}
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/60 dark:border-indigo-800 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold text-xs shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition leading-tight">
                    {user.name}
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
                    {user.email}
                  </span>
                </div>
              </Link>

              {/* Logout Button */}
              <button
                onClick={logout}
                className="p-2 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition cursor-pointer"
                title="Log out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white px-3 py-2 rounded-lg transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-sm transition"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
