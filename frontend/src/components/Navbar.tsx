import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { ShieldCheck, Bell, LogOut, CheckCircle2, User as UserIcon } from 'lucide-react';
import { IS_MOCK_MODE } from '../api/client';
import { resetMockDb } from '../mock/mockBackend';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Administrator</span>;
      case 'RETAILER':
        return <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Retailer</span>;
      case 'CUSTOMER':
        return <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Customer</span>;
      default:
        return null;
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <Link to="/" className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 transition">
            <div className="bg-indigo-600 text-white p-2 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">
              Warran<span className="text-indigo-600">Track</span>
            </span>
          </Link>
          {IS_MOCK_MODE && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Reset demo database to fresh initial seed data?')) {
                  resetMockDb();
                  window.location.reload();
                }
              }}
              className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold hover:bg-emerald-100 transition shadow-2xs"
              title="Standalone Mode (No backend required). Click to reset demo data."
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Standalone Mode
            </button>
          )}
        </div>

        {/* Right Nav */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              {getRoleBadge(user.role)}

              {/* Notifications Popover */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                      <span className="font-semibold text-sm text-slate-800">Notifications ({unreadCount} unread)</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-slate-400">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.slice(0, 10).map((n) => (
                          <div
                            key={n.id}
                            onClick={() => !n.isRead && markAsRead(n.id)}
                            className={`px-4 py-3 text-xs hover:bg-slate-50 transition cursor-pointer flex gap-3 ${
                              !n.isRead ? 'bg-indigo-50/50' : ''
                            }`}
                          >
                            <div className="flex-1">
                              <p className={`text-slate-800 ${!n.isRead ? 'font-semibold' : ''}`}>
                                {n.message}
                              </p>
                              <span className="text-[10px] text-slate-400 mt-1 block">
                                {new Date(n.createdAt).toLocaleDateString()} at{' '}
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            {!n.isRead && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(n.id);
                                }}
                                title="Mark as read"
                                className="text-indigo-600 hover:text-indigo-800 self-center"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                    <div className="px-4 py-2 border-t border-slate-100 text-center">
                      <Link
                        to="/notifications"
                        onClick={() => setShowNotifications(false)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        View all notifications
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* User details & Profile Link */}
              <Link
                to={user.role === 'CUSTOMER' ? '/customer/profile' : user.role === 'RETAILER' ? '/retailer/profile' : '#'}
                className="flex items-center gap-2.5 text-left p-1.5 rounded-xl hover:bg-slate-100 transition group"
                title={user.role === 'CUSTOMER' ? 'View My Customer Profile' : 'View Profile'}
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200/60 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition leading-tight">
                    {user.name}
                  </span>
                  <span className="text-[11px] text-slate-400 leading-tight">
                    {user.email}
                  </span>
                </div>
              </Link>

              {/* Logout Button */}
              <button
                onClick={logout}
                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                title="Log out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg transition"
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

