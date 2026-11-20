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
  Inbox,
  Menu,
  LayoutDashboard,
} from 'lucide-react';
import { NotificationItem } from '../types';
import { getNotificationTargetRoute, getNotificationMeta, formatNotificationTime } from '../utils/notificationUtils';

interface NavbarProps {
  onToggleMobileNav?: () => void;
  mobileNavOpen?: boolean;
  isDashboardRoute?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobileNav,
  mobileNavOpen,
  isDashboardRoute = false,
}) => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [filterMode, setFilterMode] = useState<'ALL' | 'UNREAD'>('ALL');
  const [markingAll, setMarkingAll] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const getHomeRoute = () => {
    if (!user) return '/';
    if (user.role === 'ADMIN') return '/admin';
    if (user.role === 'RETAILER') return '/retailer';
    return '/customer';
  };

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
          <span className="bg-[#DEE7DC] dark:bg-[#12281B] text-[#1E4D32] dark:text-[#E5C38F] border border-[#CCD8CA] dark:border-[#1F452E] text-xs font-semibold px-2.5 py-0.5 rounded-full tracking-wide">
            Administrator
          </span>
        );
      case 'RETAILER':
        return (
          <span className="bg-[#DDE5E0] dark:bg-[#122421] text-[#1F483D] dark:text-[#A7D9C9] border border-[#CAD8D1] dark:border-[#1B3F35] text-xs font-semibold px-2.5 py-0.5 rounded-full tracking-wide">
            Retailer
          </span>
        );
      case 'CUSTOMER':
        return (
          <span className="bg-[#E2EBE0] dark:bg-[#112719] text-[#1C472A] dark:text-[#B6DFBF] border border-[#CBDAC7] dark:border-[#1D4428] text-xs font-semibold px-2.5 py-0.5 rounded-full tracking-wide">
            Customer
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="bg-[#D3E0D1]/90 dark:bg-[#0E2417]/90 border-b border-[#C0D1BF] dark:border-[#173C27] sticky top-0 z-30 transition-colors backdrop-blur-md">
      <div className="max-w-7xl xl:max-w-[1440px] 2xl:max-w-[1680px] mx-auto px-3 sm:px-6 lg:px-8 2xl:px-10 h-16 flex items-center justify-between">
        {/* Left: Mobile Nav Hamburger + Brand */}
        <div className="flex items-center gap-1 sm:gap-2">
          {user && isDashboardRoute && (
            <button
              type="button"
              onClick={onToggleMobileNav}
              className="lg:hidden p-2 -ml-1 rounded-lg text-[#163B27] dark:text-[#CAD6CC] hover:bg-[#C2D4C0] dark:hover:bg-[#153823] transition cursor-pointer"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileNavOpen}
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <Link to={getHomeRoute()} className="flex items-center gap-2.5 group transition">
            <div className="bg-[#17432A] dark:bg-[#1E5234] text-[#E8F3EA] p-2 rounded-2xl shrink-0 shadow-xs border border-[#27643E]/40 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5 text-[#86E4AE] dark:text-[#86E4AE]" />
            </div>
            <span className="font-serif text-xl sm:text-2xl tracking-tight text-[#0C2114] dark:text-[#EDF2EB] font-bold">
              Warran<span className="text-[#256B40] dark:text-[#86E4AE] italic font-normal">Track</span>
            </span>
          </Link>
        </div>

        {/* Right Nav */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          {user ? (
            <>
              {!isDashboardRoute && (
                <Link
                  to={getHomeRoute()}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#F3F7F2] dark:text-[#0C2114] bg-[#17432A] dark:bg-[#86E4AE] hover:bg-[#123621] dark:hover:bg-[#68D897] rounded-full shadow-xs transition"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Go to Dashboard</span>
                </Link>
              )}

              <div className="hidden md:inline-flex">
                {getRoleBadge(user.role)}
              </div>

              {/* Notifications Popover Container */}
              <div className="relative" ref={popoverRef}>
                <button
                  type="button"
                  onClick={() => setShowNotifications(!showNotifications)}
                  aria-expanded={showNotifications}
                  aria-label="Toggle notifications menu"
                  className={`relative p-2 rounded-full transition cursor-pointer ${
                    showNotifications
                      ? 'bg-[#C2D4C0] dark:bg-[#163C27] text-[#0C2114] dark:text-[#86E4AE] ring-2 ring-[#27643E]/30'
                      : 'text-[#2A523A] hover:text-[#0C2114] dark:text-[#A7C8B4] dark:hover:text-[#F0F6F2] hover:bg-[#C5D7C3] dark:hover:bg-[#153823]'
                  }`}
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <>
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#10B981] animate-ping opacity-75" />
                      <span className="absolute -top-0.5 -right-0.5 bg-[#17432A] text-white text-[10px] font-bold px-1.5 min-w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-[#D3E0D1] dark:ring-[#0E2417] shadow-xs">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    </>
                  )}
                </button>

                {/* Notifications Dropdown Panel */}
                {showNotifications && (
                  <div className="fixed sm:absolute right-2 sm:right-0 left-2 sm:left-auto top-16 sm:top-auto mt-2 sm:w-[420px] max-w-[calc(100vw-1rem)] bg-[#E2ECE1] dark:bg-[#11291B] rounded-3xl shadow-2xl border border-[#BDD0BC] dark:border-[#1E4C32] py-0 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    {/* Header */}
                    <div className="p-4 bg-[#D7E4D6] dark:bg-[#153423] border-b border-[#BDD0BC] dark:border-[#1E4C32] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#0C2114] dark:text-[#F0F6F2]">Notifications</span>
                        {unreadCount > 0 ? (
                          <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-[#C2D7C1] dark:bg-[#1C4830] text-[#133A24] dark:text-[#86E4AE] border border-[#AEC5AD] dark:border-[#27643E]">
                            {unreadCount} unread
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-[#CAD8C9] dark:bg-[#183B27] text-[#345741] dark:text-[#A7C8B4]">
                            All caught up
                          </span>
                        )}
                      </div>

                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllAsRead}
                          disabled={markingAll}
                          className="inline-flex items-center gap-1.5 text-xs text-[#17432A] dark:text-[#86E4AE] hover:text-[#0C2114] dark:hover:text-[#A7E9C4] font-semibold px-2 py-1 rounded-md hover:bg-[#CCD9CB] dark:hover:bg-[#1C4830] transition cursor-pointer disabled:opacity-50"
                          title="Mark all notifications as read"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>{markingAll ? 'Updating...' : 'Mark all read'}</span>
                        </button>
                      )}
                    </div>

                    {/* Filter Tabs */}
                    <div className="px-4 py-2 bg-[#DDE9DC] dark:bg-[#132E1F] border-b border-[#BDD0BC] dark:border-[#1E4C32] flex items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setFilterMode('ALL')}
                        className={`px-3 py-1 rounded-full font-medium transition cursor-pointer ${
                          filterMode === 'ALL'
                            ? 'bg-[#17432A] dark:bg-[#86E4AE] text-white dark:text-[#0C2114] shadow-xs'
                            : 'text-[#2D543C] dark:text-[#A7C8B4] hover:bg-[#CAD9C9] dark:hover:bg-[#183B27]'
                        }`}
                      >
                        All ({notifications.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterMode('UNREAD')}
                        className={`px-3 py-1 rounded-full font-medium transition cursor-pointer flex items-center gap-1 ${
                          filterMode === 'UNREAD'
                            ? 'bg-[#17432A] dark:bg-[#86E4AE] text-white dark:text-[#0C2114] shadow-xs'
                            : 'text-[#2D543C] dark:text-[#A7C8B4] hover:bg-[#CAD9C9] dark:hover:bg-[#183B27]'
                        }`}
                      >
                        <span>Unread</span>
                        {unreadCount > 0 && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            filterMode === 'UNREAD' ? 'bg-[#10B981] text-white' : 'bg-[#C2D7C1] dark:bg-[#1C4830] text-[#133A24] dark:text-[#86E4AE]'
                          }`}>
                            {unreadCount}
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Notification List */}
                    <div className="max-h-[380px] overflow-y-auto divide-y divide-[#CFDCCD] dark:divide-[#183B27]">
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
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}
                                  >
                                    {meta.category}
                                  </span>
                                  {isUnread && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-indigo-600 text-white">
                                      New
                                    </span>
                                  )}
                                  <span className="text-[10px] text-slate-400 dark:text-slate-400 flex items-center gap-1 ml-auto">
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
                    <div className="px-4 py-2.5 bg-[#D7E4D6] dark:bg-[#153423] border-t border-[#BDD0BC] dark:border-[#1E4C32] flex items-center justify-between text-xs">
                      <span className="text-[11px] text-[#476B53] dark:text-[#8EAE9A]">Clicking any alert marks it as read and opens the record</span>
                      <Link
                        to="/notifications"
                        onClick={() => setShowNotifications(false)}
                        className="text-xs text-[#17432A] dark:text-[#86E4AE] hover:text-[#0C2114] dark:hover:text-[#A7E9C4] font-bold transition flex items-center gap-1"
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
                className="flex items-center gap-2.5 text-left p-1.5 rounded-2xl hover:bg-[#C2D4C0] dark:hover:bg-[#153823] transition group"
                title={user.role === 'CUSTOMER' ? 'View My Customer Profile' : 'View Profile'}
              >
                <div className="w-8 h-8 rounded-xl bg-[#C2D7C1] dark:bg-[#1C4830] border border-[#AEC5AD] dark:border-[#27643E] flex items-center justify-center text-[#133A24] dark:text-[#86E4AE] font-bold text-xs shrink-0 group-hover:bg-[#17432A] group-hover:text-[#F3F7F2] transition">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div className="hidden sm:flex flex-col text-left min-w-0">
                  <span className="text-xs font-bold text-[#0C2114] dark:text-[#EDF2EB] group-hover:text-[#17432A] dark:group-hover:text-[#86E4AE] transition leading-tight truncate max-w-[120px] md:max-w-[160px] xl:max-w-[220px]">
                    {user.name}
                  </span>
                  <span className="text-[11px] text-[#476B53] dark:text-[#8EAE9A] leading-tight truncate max-w-[120px] md:max-w-[160px] xl:max-w-[220px]">
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
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                to="/login"
                className="text-xs sm:text-sm font-semibold text-[#1C3D2A] hover:text-[#0C1E14] dark:text-[#CBD9CD] dark:hover:text-white px-3 sm:px-3.5 py-2 rounded-xl hover:bg-[#DEE7DC] dark:hover:bg-[#12271B] transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-xs sm:text-sm font-semibold bg-[#173D26] hover:bg-[#102B1B] dark:bg-[#D5A06D] dark:hover:bg-[#C58E57] text-[#F3F7F2] dark:text-[#07130B] px-4 sm:px-4.5 py-2 rounded-xl shadow-xs hover:shadow-sm transition"
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
