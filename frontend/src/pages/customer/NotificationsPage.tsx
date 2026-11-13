import React from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { Bell, CheckCircle2 } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500">In-app alerts for warranties, purchases, and claim progress</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-3.5 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Bell className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <div className="font-semibold text-slate-800">No notifications yet</div>
            <p className="text-xs text-slate-400">
              When a purchase is registered or claim updates occur, you will receive alerts here.
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 flex items-start justify-between gap-4 transition ${
                !n.isRead ? 'bg-indigo-50/40' : 'hover:bg-slate-50'
              }`}
            >
              <div className="space-y-1">
                <p className={`text-sm text-slate-800 ${!n.isRead ? 'font-semibold' : ''}`}>
                  {n.message}
                </p>
                <div className="text-[11px] text-slate-400">
                  {new Date(n.createdAt).toLocaleDateString()} at{' '}
                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {!n.isRead && (
                <button
                  onClick={() => markAsRead(n.id)}
                  title="Mark as read"
                  className="text-indigo-600 hover:text-indigo-800 shrink-0 p-1"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

