import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import {
  Bell,
  CheckCircle2,
  CheckCheck,
  Search,
  ExternalLink,
  Clock,
  Inbox,
  Filter
} from 'lucide-react';
import { NotificationItem } from '../../types';
import { getNotificationTargetRoute, getNotificationMeta, formatNotificationTime } from '../../utils/notificationUtils';

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();
  const [filterMode, setFilterMode] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [markingAll, setMarkingAll] = useState(false);
  const navigate = useNavigate();

  const handleNotificationClick = async (n: NotificationItem) => {
    const isUnread = !Boolean(n.isRead === true || n.read === true);
    if (isUnread) {
      await markAsRead(n.id);
    }
    const targetRoute = getNotificationTargetRoute(n, user?.role);
    navigate(targetRoute);
  };

  const handleMarkAll = async () => {
    try {
      setMarkingAll(true);
      await markAllAsRead();
    } finally {
      setMarkingAll(false);
    }
  };

  const readCount = notifications.filter((n) => Boolean(n.isRead === true || n.read === true)).length;

  const filteredNotifications = notifications.filter((n) => {
    const isItemRead = Boolean(n.isRead === true || n.read === true);
    if (filterMode === 'UNREAD' && isItemRead) return false;
    if (filterMode === 'READ' && !isItemRead) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        n.message.toLowerCase().includes(q) ||
        (n.type && n.type.toLowerCase().includes(q)) ||
        (n.entityType && n.entityType.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Notification Center</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time activity alerts and historical audit trail for warranty claims, digital cards, and account access
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAll}
            disabled={markingAll}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer self-start sm:self-center disabled:opacity-50"
          >
            <CheckCheck className="w-4 h-4" />
            <span>{markingAll ? 'Marking All Read...' : 'Mark All as Read'}</span>
          </button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Notifications</span>
            <Bell className="w-5 h-5 text-slate-400 dark:text-slate-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">{notifications.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Unread Alerts</span>
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-indigo-100 dark:ring-indigo-900/50" />
          </div>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">{unreadCount}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Historical / Read</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-700 dark:text-slate-200 mt-2">{readCount}</p>
        </div>
      </div>

      {/* Toolbar: Filters & Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setFilterMode('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              filterMode === 'ALL'
                ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Activity ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('UNREAD')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              filterMode === 'UNREAD'
                ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span>Unread</span>
            {unreadCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                filterMode === 'UNREAD' ? 'bg-indigo-500 text-white' : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
              }`}>
                {unreadCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('READ')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              filterMode === 'READ'
                ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Read History ({readCount})
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search alerts by message or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 dark:text-slate-500 text-sm">
            Loading notifications...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400 space-y-2">
            <Inbox className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <div className="font-semibold text-slate-800 dark:text-slate-100 text-base">No notifications found</div>
            <p className="text-xs text-slate-400 dark:text-slate-400 max-w-sm mx-auto">
              {searchTerm
                ? 'Try adjusting your search keywords or clear the filter.'
                : filterMode === 'UNREAD'
                ? 'You have zero unread alerts. Switch to "All Activity" to view your historical logs.'
                : 'When a warranty is registered, a claim status changes, or an admin updates your profile, notifications will show here.'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((n) => {
            const meta = getNotificationMeta(n.type);
            const isUnread = !Boolean(n.isRead === true || n.read === true);

            return (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`p-4 rounded-xl border transition cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group ${
                  isUnread
                    ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60 shadow-xs hover:bg-indigo-100/70 dark:hover:bg-indigo-900/40'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                {/* Left Side: Status dot, Tag, and Message */}
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1 shrink-0">
                    {isUnread ? (
                      <span className="w-3 h-3 rounded-full bg-indigo-600 ring-4 ring-indigo-200 dark:ring-indigo-900/60 block shadow-xs" />
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700 block" />
                    )}
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}
                      >
                        {meta.category}
                      </span>
                      {isUnread && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-indigo-600 text-white">
                          New
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(n.createdAt).toLocaleDateString()} at{' '}
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {' • '}
                        <span className="text-slate-500 dark:text-slate-400 font-medium">{formatNotificationTime(n.createdAt)}</span>
                      </span>
                    </div>

                    <p className={`text-sm ${isUnread ? 'font-semibold text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'}`}>
                      {n.message}
                    </p>
                  </div>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {isUnread && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(n.id);
                      }}
                      title="Mark as read"
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-slate-700 border border-indigo-200 dark:border-indigo-800/60 transition cursor-pointer flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Mark Read</span>
                    </button>
                  )}

                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                    <span>Open Record</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
