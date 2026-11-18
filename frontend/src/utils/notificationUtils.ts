import { NotificationItem, Role } from '../types';

/**
 * Computes contextual navigation route based on notification metadata and user role.
 */
export const getNotificationTargetRoute = (
  notification: NotificationItem,
  role?: Role | string
): string => {
  const { type, entityType } = notification;

  // Claim-related alerts
  if (
    type === 'CLAIM_SUBMITTED' ||
    type === 'CLAIM_STATUS_CHANGED' ||
    type === 'ADDITIONAL_INFO_REQUESTED' ||
    type === 'ADDITIONAL_INFO_PROVIDED' ||
    entityType === 'Claim'
  ) {
    if (role === 'RETAILER') return '/retailer/claims';
    if (role === 'ADMIN') return '/admin/claims';
    return '/customer/claims';
  }

  // Warranty or Purchase registration
  if (
    type === 'PURCHASE_LINKED' ||
    entityType === 'Purchase' ||
    entityType === 'Warranty'
  ) {
    if (role === 'RETAILER') return '/retailer/purchases';
    return '/customer/warranties';
  }

  // Retailer application approvals & status
  if (type === 'RETAILER_APPROVED' || type === 'RETAILER_SUSPENDED') {
    if (role === 'ADMIN') return '/admin/retailers';
    if (role === 'RETAILER') return '/retailer/profile';
  }

  // Customer account status changes (active, inactive, suspended)
  if (
    type === 'CUSTOMER_ACCOUNT_SUSPENDED' ||
    type === 'CUSTOMER_ACCOUNT_DEACTIVATED' ||
    type === 'CUSTOMER_ACCOUNT_ACTIVATED'
  ) {
    if (role === 'ADMIN') return '/admin/customers';
    if (role === 'CUSTOMER') return '/customer/profile';
  }

  // Fallbacks
  if (role === 'ADMIN') return '/admin';
  if (role === 'RETAILER') return '/retailer';
  if (role === 'CUSTOMER') return '/customer';
  return '/notifications';
};

export interface NotificationMeta {
  category: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

/**
 * Returns UI categorization and badge color coding for each notification type.
 */
export const getNotificationMeta = (type?: string): NotificationMeta => {
  switch (type) {
    case 'CLAIM_SUBMITTED':
    case 'CLAIM_STATUS_CHANGED':
    case 'ADDITIONAL_INFO_REQUESTED':
    case 'ADDITIONAL_INFO_PROVIDED':
      return {
        category: 'Warranty Claim',
        badgeBg: 'bg-purple-50 dark:bg-purple-950/60',
        badgeText: 'text-purple-700 dark:text-purple-300',
        badgeBorder: 'border-purple-200 dark:border-purple-800/60',
      };
    case 'PURCHASE_LINKED':
      return {
        category: 'Digital Warranty',
        badgeBg: 'bg-blue-50 dark:bg-blue-950/60',
        badgeText: 'text-blue-700 dark:text-blue-300',
        badgeBorder: 'border-blue-200 dark:border-blue-800/60',
      };
    case 'RETAILER_APPROVED':
    case 'RETAILER_SUSPENDED':
      return {
        category: 'Retailer Account',
        badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60',
        badgeText: 'text-emerald-700 dark:text-emerald-300',
        badgeBorder: 'border-emerald-200 dark:border-emerald-800/60',
      };
    case 'CUSTOMER_ACCOUNT_SUSPENDED':
    case 'CUSTOMER_ACCOUNT_DEACTIVATED':
    case 'CUSTOMER_ACCOUNT_ACTIVATED':
      return {
        category: 'Account Access',
        badgeBg: 'bg-amber-50 dark:bg-amber-950/60',
        badgeText: 'text-amber-700 dark:text-amber-300',
        badgeBorder: 'border-amber-200 dark:border-amber-800/60',
      };
    default:
      return {
        category: 'System Alert',
        badgeBg: 'bg-slate-100 dark:bg-slate-800',
        badgeText: 'text-slate-600 dark:text-slate-300',
        badgeBorder: 'border-slate-200 dark:border-slate-700',
      };
  }
};

/**
 * Formats notification creation date into human-friendly relative or timestamp format.
 */
export const formatNotificationTime = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
};
