import React, { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import {
  LayoutDashboard,
  Store,
  Users,
  FileText,
  Package,
  ShoppingCart,
  ShieldAlert,
  Building2,
  ShieldCheck,
  Send,
  Link2,
  Bell,
  CreditCard,
  Receipt,
  User,
  X,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onClose }) => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();

  // Close mobile drawer whenever location changes
  useEffect(() => {
    if (mobileOpen && onClose) {
      onClose();
    }
  }, [location.pathname]);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen && onClose) {
        onClose();
      }
    };
    if (mobileOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [mobileOpen, onClose]);

  if (!user) return null;

  const adminLinks = [
    { to: '/admin', label: 'Platform Dashboard', icon: LayoutDashboard },
    { to: '/admin/retailers', label: 'Retailer Approvals', icon: Store },
    { to: '/admin/customers', label: 'Registered Customers', icon: Users },
    { to: '/admin/claims', label: 'Platform Claims', icon: FileText },
    { to: '/notifications', label: 'Notifications', icon: Bell },
  ];

  const retailerLinks = [
    { to: '/retailer', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/retailer/pos', label: 'POS Billing Terminal', icon: CreditCard },
    { to: '/retailer/bills', label: 'Invoices & Receipts', icon: Receipt },
    { to: '/retailer/products', label: 'Products & Policies', icon: Package },
    { to: '/retailer/purchases', label: 'Purchases & Warranties', icon: ShoppingCart },
    { to: '/retailer/claims', label: 'Claims & Service', icon: ShieldAlert },
    { to: '/retailer/profile', label: 'Business Profile', icon: Building2 },
    { to: '/notifications', label: 'Notifications', icon: Bell },
  ];

  const customerLinks = [
    { to: '/customer', label: 'My Dashboard', icon: LayoutDashboard },
    { to: '/customer/warranties', label: 'Digital Warranties', icon: ShieldCheck },
    { to: '/customer/find-purchases', label: 'Find & Link Purchases', icon: Link2 },
    { to: '/customer/submit-claim', label: 'Submit Claim', icon: Send },
    { to: '/customer/claims', label: 'My Claims & Tracking', icon: FileText },
    { to: '/notifications', label: 'Notifications', icon: Bell },
    { to: '/customer/profile', label: 'My Profile', icon: User },
  ];

  const links =
    user.role === 'ADMIN'
      ? adminLinks
      : user.role === 'RETAILER'
      ? retailerLinks
      : customerLinks;

  const renderNavItems = () => (
    <div className="space-y-1">
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-3 py-2">
        {user.role} Navigation
      </div>
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/admin' || link.to === '/retailer' || link.to === '/customer'}
            onClick={() => {
              if (onClose) onClose();
            }}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:text-slate-100'
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="flex-1 truncate">{link.label}</span>
            {link.to === '/notifications' && unreadCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-xs">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </NavLink>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar (>= 1024px) */}
      <aside className="hidden lg:flex w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 min-h-[calc(100vh-4rem)] flex-col p-4 shrink-0 transition-colors">
        {renderNavItems()}
      </aside>

      {/* Mobile Slide-Over Drawer (< 1024px) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs transition-opacity duration-200"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <div className="relative w-72 max-w-[85vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-full flex flex-col p-4 shadow-2xl z-10 transition-transform duration-300 ease-in-out">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                    WarranTrack
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                    {user.role?.toLowerCase()} Portal
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Quick Info */}
            <div className="p-2.5 mb-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                {user.name}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {user.email}
              </div>
            </div>

            {/* Scrollable Navigation Items */}
            <div className="flex-1 overflow-y-auto pr-1">
              {renderNavItems()}
            </div>

            {/* Drawer Footer with Logout */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-2">
              <button
                type="button"
                onClick={() => {
                  if (onClose) onClose();
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};


