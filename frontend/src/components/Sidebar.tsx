import React from 'react';
import { NavLink } from 'react-router-dom';
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
  Bell,
  CreditCard,
  Receipt,
  User,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
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

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 min-h-[calc(100vh-4rem)] flex flex-col p-4 shrink-0 transition-colors">
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
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{link.label}</span>
              {link.to === '/notifications' && unreadCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-xs">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>
    </aside>
  );
};

