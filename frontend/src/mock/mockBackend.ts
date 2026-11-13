import type {
  User,
  Retailer,
  Product,
  Purchase,
  Warranty,
  PublicWarranty,
  Claim,
  Bill,
  PlatformAnalytics,
  RetailerAnalytics,
  PagedResponse,
  ApprovalStatus,
  ClaimStatus,
  CreateBillRequest,
  WarrantyUnit,
} from '../types/index.ts';
import { INITIAL_MOCK_DATA, type MockDatabase } from './mockData.ts';

const STORAGE_KEY = 'warrantrack_mock_db_v1';

// Load or initialize mock database from LocalStorage
export const getDb = (): MockDatabase => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveDb(INITIAL_MOCK_DATA);
      return INITIAL_MOCK_DATA;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse mock database, resetting to initial seed.', err);
    saveDb(INITIAL_MOCK_DATA);
    return INITIAL_MOCK_DATA;
  }
};

export const saveDb = (db: MockDatabase) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (err) {
    console.error('Failed to save to localStorage', err);
  }
};

export const resetMockDb = (): MockDatabase => {
  saveDb(INITIAL_MOCK_DATA);
  return INITIAL_MOCK_DATA;
};

// Helper: Pagination
const paginate = <T>(items: T[], page = 0, size = 20): PagedResponse<T> => {
  const totalElements = items.length;
  const totalPages = Math.ceil(totalElements / size) || 1;
  const start = page * size;
  const content = items.slice(start, start + size);
  return {
    content,
    page,
    size,
    totalElements,
    totalPages,
    last: page >= totalPages - 1,
  };
};

// Helper: Current logged-in user
const getCurrentUser = (authHeader?: string): User | null => {
  const db = getDb();
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    // In mock mode, tokens are formatted as mock-token-<userId> or user email
    const matchedUser = db.users.find(
      (u) => `mock-token-${u.id}` === token || u.email === token || u.id === token
    );
    if (matchedUser) return matchedUser;
  }
  // Fallback to localStorage 'user'
  try {
    const saved = localStorage.getItem('user');
    if (saved) {
      const parsed = JSON.parse(saved);
      const found = db.users.find((u) => u.id === parsed.id || u.email === parsed.email);
      if (found) return found;
    }
  } catch {
    // ignore
  }
  return null;
};

// Calculate warranty expiry
const computeExpiryDate = (startDateStr: string, duration: number, unit: WarrantyUnit): string => {
  const d = new Date(startDateStr);
  if (unit === 'DAYS') {
    d.setDate(d.getDate() + duration);
  } else if (unit === 'YEARS') {
    d.setFullYear(d.getFullYear() + duration);
  } else {
    // MONTHS
    d.setMonth(d.getMonth() + duration);
  }
  return d.toISOString().split('T')[0];
};

export interface MockResponse {
  status: number;
  data: any;
}

// Router for all API requests
export const handleMockRoute = (
  method: string,
  url: string,
  data: any,
  headers: Record<string, any> = {}
): MockResponse => {
  const db = getDb();
  const normalizedMethod = method.toUpperCase();
  const authHeader = headers.Authorization || headers.authorization;
  const currentUser = getCurrentUser(authHeader);

  // Clean URL path and search params
  const [pathname, queryString] = url.split('?');
  const path = pathname.replace(/^https?:\/\/[^/]+/, '').replace(/^\/api/, '');
  const searchParams = new URLSearchParams(queryString || '');

  // -------------------------------------------------------------
  // 1. AUTH API
  // -------------------------------------------------------------
  if (normalizedMethod === 'POST' && path === '/auth/login') {
    const { email } = data || {};
    const lowerEmail = (email || '').trim().toLowerCase();

    // Check existing or demo matching
    let user = db.users.find((u) => u.email.toLowerCase() === lowerEmail);

    if (!user) {
      // Auto-provision demo account if none exists for quick exploration
      const isRetailer = lowerEmail.includes('retailer') || lowerEmail.includes('store') || lowerEmail.includes('techhub');
      const isAdmin = lowerEmail.includes('admin');
      const newId = `usr-auto-${Date.now()}`;

      user = {
        id: newId,
        name: isRetailer ? 'Demo Retailer Partner' : isAdmin ? 'Platform Administrator' : 'Demo Customer',
        email: lowerEmail,
        role: isAdmin ? 'ADMIN' : isRetailer ? 'RETAILER' : 'CUSTOMER',
        emailVerified: true,
        accountStatus: 'ACTIVE',
        retailerId: isRetailer ? 'ret-1' : undefined,
        retailerApprovalStatus: isRetailer ? 'APPROVED' : undefined,
        createdAt: new Date().toISOString(),
      };
      db.users.push(user);
      saveDb(db);
    }

    const token = `mock-token-${user.id}`;
    return {
      status: 200,
      data: {
        success: true,
        message: 'Login successful',
        data: {
          token,
          userId: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
          retailerId: user.retailerId,
          retailerApprovalStatus: user.retailerApprovalStatus,
        },
        timestamp: new Date().toISOString(),
      },
    };
  }

  if (normalizedMethod === 'POST' && path === '/auth/register/customer') {
    const { name, email, phone } = data || {};
    const lowerEmail = (email || '').trim().toLowerCase();

    let user = db.users.find((u) => u.email.toLowerCase() === lowerEmail);
    if (!user) {
      user = {
        id: `usr-cust-${Date.now()}`,
        name: name || 'Valued Customer',
        email: lowerEmail,
        phone: phone || '',
        role: 'CUSTOMER',
        emailVerified: true,
        accountStatus: 'ACTIVE',
        createdAt: new Date().toISOString(),
      };
      db.users.push(user);
      saveDb(db);
    }

    const token = `mock-token-${user.id}`;
    return {
      status: 200,
      data: {
        success: true,
        message: 'Customer registered successfully. Check your verification OTP.',
        data: {
          token,
          userId: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
          devOtp: '123456',
        },
        timestamp: new Date().toISOString(),
      },
    };
  }

  if (normalizedMethod === 'POST' && path === '/auth/register/retailer') {
    const { name, email, businessName, registrationNumber, contactEmail, contactPhone, address, description } = data || {};
    const lowerEmail = (email || '').trim().toLowerCase();

    const retId = `ret-${Date.now()}`;
    const newRetailer: Retailer = {
      id: retId,
      userId: `usr-ret-${Date.now()}`,
      businessName: businessName || 'Retail Business',
      registrationNumber: registrationNumber || `REG-${Math.floor(100000 + Math.random() * 900000)}`,
      contactEmail: contactEmail || lowerEmail,
      contactPhone: contactPhone || '+1 800-555-0100',
      address: address || '123 Commerce Blvd',
      description: description || '',
      approvalStatus: 'APPROVED', // Default to approved so the user can immediately use retailer features!
      approvedBy: 'Platform System',
      approvedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const user: User = {
      id: newRetailer.userId,
      name: name || businessName || 'Store Manager',
      email: lowerEmail,
      role: 'RETAILER',
      emailVerified: true,
      accountStatus: 'ACTIVE',
      retailerId: retId,
      retailerApprovalStatus: 'APPROVED',
      createdAt: new Date().toISOString(),
    };

    db.retailers.push(newRetailer);
    db.users.push(user);
    saveDb(db);

    const token = `mock-token-${user.id}`;
    return {
      status: 200,
      data: {
        success: true,
        message: 'Retailer registered successfully.',
        data: {
          token,
          userId: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
          retailerId: retId,
          retailerApprovalStatus: 'APPROVED',
        },
        timestamp: new Date().toISOString(),
      },
    };
  }

  if (normalizedMethod === 'POST' && path === '/auth/verify-email') {
    if (currentUser) {
      currentUser.emailVerified = true;
      saveDb(db);
    }
    return {
      status: 200,
      data: {
        success: true,
        message: 'Email verified successfully.',
        data: 'Email verified',
        timestamp: new Date().toISOString(),
      },
    };
  }

  if (normalizedMethod === 'POST' && path === '/auth/resend-otp') {
    return {
      status: 200,
      data: {
        success: true,
        message: 'A fresh 6-digit verification code has been dispatched.',
        data: '123456',
        timestamp: new Date().toISOString(),
      },
    };
  }

  if (normalizedMethod === 'POST' && path === '/auth/forgot-password') {
    return {
      status: 200,
      data: {
        success: true,
        message: 'Password reset token generated.',
        data: 'RESET-TOKEN-123456',
        timestamp: new Date().toISOString(),
      },
    };
  }

  if (normalizedMethod === 'POST' && path === '/auth/reset-password') {
    return {
      status: 200,
      data: {
        success: true,
        message: 'Password has been updated successfully.',
        data: 'Password updated',
        timestamp: new Date().toISOString(),
      },
    };
  }

  if (normalizedMethod === 'GET' && path === '/auth/me') {
    if (!currentUser) {
      // Default to customer-1 if none
      const fallback = db.users[3] || db.users[0];
      return {
        status: 200,
        data: {
          success: true,
          message: 'User found',
          data: fallback,
          timestamp: new Date().toISOString(),
        },
      };
    }
    return {
      status: 200,
      data: {
        success: true,
        message: 'Current user profile retrieved',
        data: currentUser,
        timestamp: new Date().toISOString(),
      },
    };
  }

  if (normalizedMethod === 'PUT' && path === '/auth/profile') {
    if (currentUser) {
      currentUser.name = data.name || currentUser.name;
      if (data.phone !== undefined) currentUser.phone = data.phone;
      saveDb(db);
      return {
        status: 200,
        data: {
          success: true,
          message: 'Profile updated',
          data: currentUser,
          timestamp: new Date().toISOString(),
        },
      };
    }
    return {
      status: 401,
      data: { success: false, message: 'Unauthorized' },
    };
  }

  if (normalizedMethod === 'POST' && path === '/auth/change-password') {
    return {
      status: 200,
      data: {
        success: true,
        message: 'Password changed successfully',
        data: 'OK',
        timestamp: new Date().toISOString(),
      },
    };
  }

  // -------------------------------------------------------------
  // 2. ADMIN API
  // -------------------------------------------------------------
  if (normalizedMethod === 'GET' && path === '/admin/dashboard') {
    const claimsByStatus: Record<string, number> = {
      SUBMITTED: 0,
      UNDER_REVIEW: 0,
      APPROVED: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      REJECTED: 0,
      CANCELLED: 0,
      ADDITIONAL_INFO_REQUIRED: 0,
    };

    db.claims.forEach((c) => {
      claimsByStatus[c.currentStatus] = (claimsByStatus[c.currentStatus] || 0) + 1;
    });

    const approvedRetailers = db.retailers.filter((r) => r.approvalStatus === 'APPROVED').length;
    const pendingRetailers = db.retailers.filter((r) => r.approvalStatus === 'PENDING').length;
    const suspendedRetailers = db.retailers.filter((r) => r.approvalStatus === 'SUSPENDED').length;
    const totalCustomers = db.users.filter((u) => u.role === 'CUSTOMER').length;

    // Monthly registrations distribution
    const monthlyCustomerRegistrations: Record<string, number> = {
      'Jan 2026': Math.max(1, Math.round(totalCustomers * 0.15)),
      'Feb 2026': Math.max(1, Math.round(totalCustomers * 0.22)),
      'Mar 2026': Math.max(2, Math.round(totalCustomers * 0.35)),
      'Apr 2026': Math.max(2, Math.round(totalCustomers * 0.5)),
      'May 2026': Math.max(3, Math.round(totalCustomers * 0.75)),
      'Jun 2026': totalCustomers,
    };

    const analytics: PlatformAnalytics = {
      totalRetailers: db.retailers.length,
      approvedRetailers,
      pendingRetailers,
      suspendedRetailers,
      totalCustomers,
      totalProducts: db.products.length,
      totalPurchases: db.purchases.length,
      totalWarranties: db.warranties.length,
      totalClaims: db.claims.length,
      claimsByStatus,
      monthlyCustomerRegistrations,
    };

    return {
      status: 200,
      data: {
        success: true,
        message: 'Admin statistics loaded',
        data: analytics,
        timestamp: new Date().toISOString(),
      },
    };
  }

  if (normalizedMethod === 'GET' && path === '/admin/retailers') {
    const status = searchParams.get('status') as ApprovalStatus | null;
    const page = parseInt(searchParams.get('page') || '0', 10);
    const size = parseInt(searchParams.get('size') || '20', 10);

    let list = db.retailers;
    if (status) {
      list = list.filter((r) => r.approvalStatus === status);
    }
    return {
      status: 200,
      data: {
        success: true,
        message: 'Retailers list loaded',
        data: paginate(list, page, size),
        timestamp: new Date().toISOString(),
      },
    };
  }

  const adminRetailerStatusMatch = path.match(/^\/admin\/retailers\/([^/]+)\/status$/);
  if (normalizedMethod === 'PATCH' && adminRetailerStatusMatch) {
    const retId = adminRetailerStatusMatch[1];
    const { status, reason } = data || {};
    const ret = db.retailers.find((r) => r.id === retId);
    if (!ret) {
      return { status: 404, data: { success: false, message: 'Retailer not found' } };
    }
    ret.approvalStatus = status;
    if (status === 'APPROVED') {
      ret.approvedBy = currentUser?.name || 'Administrator';
      ret.approvedAt = new Date().toISOString();
    } else if (status === 'REJECTED') {
      ret.rejectionReason = reason;
    } else if (status === 'SUSPENDED') {
      ret.suspensionReason = reason;
    }

    // Sync user record
    const associatedUser = db.users.find((u) => u.retailerId === retId || u.id === ret.userId);
    if (associatedUser) {
      associatedUser.retailerApprovalStatus = status;
    }

    saveDb(db);
    return {
      status: 200,
      data: {
        success: true,
        message: `Retailer status updated to ${status}`,
        data: ret,
        timestamp: new Date().toISOString(),
      },
    };
  }

  const adminRetailerGetMatch = path.match(/^\/admin\/retailers\/([^/]+)$/);
  if (normalizedMethod === 'GET' && adminRetailerGetMatch) {
    const retId = adminRetailerGetMatch[1];
    const ret = db.retailers.find((r) => r.id === retId);
    if (!ret) return { status: 404, data: { success: false, message: 'Retailer not found' } };
    return {
      status: 200,
      data: { success: true, message: 'Retailer details', data: ret, timestamp: new Date().toISOString() },
    };
  }

  if (normalizedMethod === 'GET' && path === '/admin/customers') {
    const page = parseInt(searchParams.get('page') || '0', 10);
    const size = parseInt(searchParams.get('size') || '20', 10);
    const customers = db.users.filter((u) => u.role === 'CUSTOMER');
    return {
      status: 200,
      data: {
        success: true,
        message: 'Customer list retrieved',
        data: paginate(customers, page, size),
        timestamp: new Date().toISOString(),
      },
    };
  }

  if (normalizedMethod === 'GET' && path === '/admin/claims') {
    const status = searchParams.get('status') as ClaimStatus | null;
    const page = parseInt(searchParams.get('page') || '0', 10);
    const size = parseInt(searchParams.get('size') || '20', 10);
    let list = db.claims;
    if (status) {
      list = list.filter((c) => c.currentStatus === status);
    }
    return {
      status: 200,
      data: {
        success: true,
        message: 'All claims retrieved',
        data: paginate(list, page, size),
        timestamp: new Date().toISOString(),
      },
    };
  }

  // -------------------------------------------------------------
  // 3. RETAILER API
  // -------------------------------------------------------------
  if (normalizedMethod === 'GET' && path === '/retailer/profile') {
    const retailerId = currentUser?.retailerId || 'ret-1';
    let ret = db.retailers.find((r) => r.id === retailerId);
    if (!ret) {
      ret = db.retailers[0];
    }
    return {
      status: 200,
      data: {
        success: true,
        message: 'Retailer profile loaded',
        data: ret,
        timestamp: new Date().toISOString(),
      },
    };
  }

  if (normalizedMethod === 'PUT' && path === '/retailer/profile') {
    const retailerId = currentUser?.retailerId || 'ret-1';
    let ret = db.retailers.find((r) => r.id === retailerId);
    if (!ret) {
      ret = db.retailers[0];
    }
    if (ret) {
      Object.assign(ret, data);
      ret.updatedAt = new Date().toISOString();
      saveDb(db);
    }
    return {
      status: 200,
      data: {
        success: true,
        message: 'Retailer profile updated',
        data: ret,
        timestamp: new Date().toISOString(),
      },
    };
  }

  if (normalizedMethod === 'GET' && path === '/analytics/retailer') {
    const retailerId = currentUser?.retailerId || 'ret-1';
    const myProducts = db.products.filter((p) => p.retailerId === retailerId);
    const myPurchases = db.purchases.filter((p) => p.retailerId === retailerId);
    const myWarranties = db.warranties.filter((w) => w.retailerId === retailerId);
    const myClaims = db.claims.filter((c) => c.retailerId === retailerId);

    const claimsByStatus: Record<string, number> = {};
    myClaims.forEach((c) => {
      claimsByStatus[c.currentStatus] = (claimsByStatus[c.currentStatus] || 0) + 1;
    });

    const pendingClaims = (claimsByStatus['SUBMITTED'] || 0) + (claimsByStatus['UNDER_REVIEW'] || 0);

    const stats: RetailerAnalytics = {
      totalProducts: myProducts.length,
      activeProducts: myProducts.filter((p) => p.active).length,
      totalPurchases: myPurchases.length,
      totalWarranties: myWarranties.length,
      totalClaims: myClaims.length,
      pendingClaims,
      claimsByStatus,
    };

    return {
      status: 200,
      data: {
        success: true,
        message: 'Retailer analytics loaded',
        data: stats,
        timestamp: new Date().toISOString(),
      },
    };
  }

  // -------------------------------------------------------------
  // 4. PRODUCTS API
  // -------------------------------------------------------------
  if (normalizedMethod === 'GET' && path === '/products') {
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const page = parseInt(searchParams.get('page') || '0', 10);
    const size = parseInt(searchParams.get('size') || '50', 10);

    let list = db.products;
    if (activeOnly) {
      list = list.filter((p) => p.active);
    }
    return {
      status: 200,
      data: {
        success: true,
        message: 'Products catalog loaded',
        data: paginate(list, page, size),
        timestamp: new Date().toISOString(),
      },
    };
  }

  if (normalizedMethod === 'POST' && path === '/products') {
    const retailerId = currentUser?.retailerId || 'ret-1';
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      retailerId,
      name: data.name,
      brand: data.brand,
      model: data.model,
      category: data.category,
      description: data.description || '',
      price: Number(data.price) || 0,
      stockQuantity: Number(data.stockQuantity) || 0,
      hasWarranty: data.hasWarranty !== false,
      warrantyDuration: Number(data.warrantyDuration) || 12,
      warrantyUnit: data.warrantyUnit || 'MONTHS',
      warrantyTerms: data.warrantyTerms || 'Standard manufacturer warranty.',
      active: true,
      createdAt: new Date().toISOString(),
    };
    db.products.unshift(newProduct);
    saveDb(db);
    return {
      status: 200,
      data: {
        success: true,
        message: 'Product created successfully',
        data: newProduct,
        timestamp: new Date().toISOString(),
      },
    };
  }

  const productMatch = path.match(/^\/products\/([^/]+)$/);
  if (normalizedMethod === 'GET' && productMatch) {
    const prod = db.products.find((p) => p.id === productMatch[1]);
    if (!prod) return { status: 404, data: { success: false, message: 'Product not found' } };
    return {
      status: 200,
      data: { success: true, message: 'Product retrieved', data: prod, timestamp: new Date().toISOString() },
    };
  }

  if (normalizedMethod === 'PUT' && productMatch) {
    const prod = db.products.find((p) => p.id === productMatch[1]);
    if (!prod) return { status: 404, data: { success: false, message: 'Product not found' } };
    Object.assign(prod, data);
    prod.updatedAt = new Date().toISOString();
    saveDb(db);
    return {
      status: 200,
      data: { success: true, message: 'Product updated', data: prod, timestamp: new Date().toISOString() },
    };
  }

  const productDeactivateMatch = path.match(/^\/products\/([^/]+)\/deactivate$/);
  if (normalizedMethod === 'PATCH' && productDeactivateMatch) {
    const prod = db.products.find((p) => p.id === productDeactivateMatch[1]);
    if (!prod) return { status: 404, data: { success: false, message: 'Product not found' } };
    prod.active = false;
    prod.updatedAt = new Date().toISOString();
    saveDb(db);
    return {
      status: 200,
      data: { success: true, message: 'Product deactivated', data: prod, timestamp: new Date().toISOString() },
    };
  }

  // -------------------------------------------------------------
  // 5. PURCHASES & SINGLE ENTRY REGISTRATION
  // -------------------------------------------------------------
  if (normalizedMethod === 'GET' && path === '/purchases') {
    const page = parseInt(searchParams.get('page') || '0', 10);
    const size = parseInt(searchParams.get('size') || '50', 10);

    // Attach warranty to each purchase if available
    const enriched = db.purchases.map((p) => {
      const w = db.warranties.find((war) => war.purchaseId === p.id);
      return { ...p, warranty: w };
    });

    return {
      status: 200,
      data: {
        success: true,
        message: 'Purchases list loaded',
        data: paginate(enriched, page, size),
        timestamp: new Date().toISOString(),
      },
    };
  }

  if (normalizedMethod === 'POST' && path === '/purchases') {
    const retailerId = currentUser?.retailerId || 'ret-1';
    const retailer = db.retailers.find((r) => r.id === retailerId) || db.retailers[0];
    const product = db.products.find((p) => p.id === data.productId);

    if (product && product.stockQuantity !== undefined && product.stockQuantity > 0) {
      product.stockQuantity -= 1;
    }

    const purchId = `purch-${Date.now()}`;
    const purchaseRef = data.purchaseReference?.trim() || `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const invoiceNum = data.invoiceNumber?.trim() || `INV-${Date.now().toString().slice(-6)}`;
    const custEmail = (data.customerEmail || '').trim().toLowerCase();

    // Check if customer email exists in users
    const matchedCustomer = db.users.find((u) => u.email.toLowerCase() === custEmail);
    const hasWarranty = data.hasWarranty !== false && product?.hasWarranty !== false;

    let warranty: Warranty | undefined = undefined;

    if (hasWarranty) {
      const warrId = `warr-${Date.now()}`;
      const startDate = data.purchaseDate || new Date().toISOString().split('T')[0];
      const duration = product?.warrantyDuration || 12;
      const unit = product?.warrantyUnit || 'MONTHS';
      const expiryDate = computeExpiryDate(startDate, duration, unit);
      const qrToken = `QR-WARR-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

      warranty = {
        id: warrId,
        purchaseId: purchId,
        retailerId,
        retailerBusinessName: retailer.businessName,
        customerId: matchedCustomer ? matchedCustomer.id : undefined,
        productId: product?.id || 'custom',
        productName: product ? `${product.brand} ${product.name}` : data.productName || 'Product',
        productBrand: product?.brand || '',
        productModel: product?.model || '',
        startDate,
        expiryDate,
        status: 'ACTIVE',
        termsSnapshot: product?.warrantyTerms || 'Standard manufacturer warranty.',
        warrantyDurationSnapshot: duration,
        warrantyUnitSnapshot: unit,
        qrToken,
        eligibleForClaim: true,
        createdAt: new Date().toISOString(),
      };
      db.warranties.unshift(warranty);
    }

    const newPurchase: Purchase = {
      id: purchId,
      retailerId,
      productId: product?.id || 'custom',
      productName: product ? `${product.brand} ${product.name}` : data.productName || 'Product',
      productBrand: product?.brand || '',
      productModel: product?.model || '',
      customerId: matchedCustomer ? matchedCustomer.id : undefined,
      customerEmail: custEmail,
      purchaseDate: data.purchaseDate || new Date().toISOString().split('T')[0],
      serialNumber: data.serialNumber || undefined,
      invoiceNumber: invoiceNum,
      purchaseReference: purchaseRef,
      linkingStatus: matchedCustomer ? 'LINKED' : 'UNCLAIMED',
      hasWarranty,
      unitPrice: product?.price || 0,
      quantity: 1,
      createdAt: new Date().toISOString(),
      warranty,
    };

    db.purchases.unshift(newPurchase);

    // If customer was matched, trigger a notification
    if (matchedCustomer) {
      db.notifications.unshift({
        id: `notif-${Date.now()}`,
        userId: matchedCustomer.id,
        type: 'PURCHASE_LINKED',
        message: `New purchase registered: ${newPurchase.productName}. Your digital warranty card is active.`,
        relatedEntityId: purchId,
        entityType: 'PURCHASE',
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    saveDb(db);

    return {
      status: 200,
      data: {
        success: true,
        message: 'Purchase registered successfully',
        data: newPurchase,
        timestamp: new Date().toISOString(),
      },
    };
  }

  const purchaseMatch = path.match(/^\/purchases\/([^/]+)$/);
  if (normalizedMethod === 'GET' && purchaseMatch) {
    const p = db.purchases.find((item) => item.id === purchaseMatch[1]);
    if (!p) return { status: 404, data: { success: false, message: 'Purchase not found' } };
    const w = db.warranties.find((war) => war.purchaseId === p.id);
    return {
      status: 200,
      data: { success: true, message: 'Purchase details', data: { ...p, warranty: w }, timestamp: new Date().toISOString() },
    };
  }

  // -------------------------------------------------------------
  // 6. WARRANTIES & PUBLIC VERIFICATION
  // -------------------------------------------------------------
  if (normalizedMethod === 'GET' && path === '/customer/warranties') {
    const page = parseInt(searchParams.get('page') || '0', 10);
    const size = parseInt(searchParams.get('size') || '20', 10);

    const custId = currentUser?.id;
    const custEmail = currentUser?.email.toLowerCase();

    // Match by customerId OR customerEmail from purchases
    const customerPurchases = db.purchases.filter(
      (p) => (custId && p.customerId === custId) || (custEmail && p.customerEmail?.toLowerCase() === custEmail)
    );
    const purchaseIds = new Set(customerPurchases.map((p) => p.id));

    const list = db.warranties.filter(
      (w) => (custId && w.customerId === custId) || purchaseIds.has(w.purchaseId)
    );

    return {
      status: 200,
      data: {
        success: true,
        message: 'Customer warranties loaded',
        data: paginate(list, page, size),
        timestamp: new Date().toISOString(),
      },
    };
  }

  const warrantyMatch = path.match(/^\/customer\/warranties\/([^/]+)$/);
  if (normalizedMethod === 'GET' && warrantyMatch) {
    const w = db.warranties.find((item) => item.id === warrantyMatch[1]);
    if (!w) return { status: 404, data: { success: false, message: 'Warranty not found' } };
    return {
      status: 200,
      data: { success: true, message: 'Warranty details', data: w, timestamp: new Date().toISOString() },
    };
  }

  const publicVerifyMatch = path.match(/^\/public\/warranties\/verify\/([^/]+)$/);
  if (normalizedMethod === 'GET' && publicVerifyMatch) {
    const token = publicVerifyMatch[1];
    const w = db.warranties.find((item) => item.qrToken === token);
    if (!w) {
      return {
        status: 404,
        data: { success: false, message: 'Invalid or unrecognized warranty verification token.' },
      };
    }
    const isCurrentlyValid = w.status === 'ACTIVE' && new Date(w.expiryDate) >= new Date();
    const publicWarranty: PublicWarranty = {
      verificationStatus: isCurrentlyValid ? 'VALID' : 'EXPIRED',
      productName: w.productName,
      productBrand: w.productBrand || '',
      productModel: w.productModel || '',
      retailerBusinessName: w.retailerBusinessName || 'Authorized Retailer',
      startDate: w.startDate,
      expiryDate: w.expiryDate,
      status: isCurrentlyValid ? 'ACTIVE' : 'EXPIRED',
      currentlyValid: isCurrentlyValid,
      termsSummary: w.termsSnapshot,
    };
    return {
      status: 200,
      data: {
        success: true,
        message: 'Warranty verified successfully',
        data: publicWarranty,
        timestamp: new Date().toISOString(),
      },
    };
  }

  // -------------------------------------------------------------
  // 7. CUSTOMER LINKING
  // -------------------------------------------------------------
  if (normalizedMethod === 'GET' && path === '/customer/purchases/pending') {
    const custEmail = (currentUser?.email || 'customer@example.com').toLowerCase();
    const pending = db.purchases.filter(
      (p) =>
        p.customerEmail?.toLowerCase() === custEmail &&
        p.linkingStatus !== 'LINKED' &&
        p.hasWarranty !== false
    );
    return {
      status: 200,
      data: {
        success: true,
        message: 'Pending purchases retrieved',
        data: pending,
        timestamp: new Date().toISOString(),
      },
    };
  }

  const otpRequestMatch = path.match(/^\/customer\/purchases\/([^/]+)\/request-otp$/);
  if (normalizedMethod === 'POST' && otpRequestMatch) {
    return {
      status: 200,
      data: {
        success: true,
        message: '6-digit OTP code dispatched to your email address: 123456',
        data: '123456',
        timestamp: new Date().toISOString(),
      },
    };
  }

  const verifyLinkMatch = path.match(/^\/customer\/purchases\/([^/]+)\/verify-link$/);
  if (normalizedMethod === 'POST' && verifyLinkMatch) {
    const purchId = verifyLinkMatch[1];
    const purch = db.purchases.find((p) => p.id === purchId);
    if (!purch) return { status: 404, data: { success: false, message: 'Purchase not found' } };

    purch.linkingStatus = 'LINKED';
    purch.customerId = currentUser?.id || 'usr-customer-1';

    // Also link the warranty
    const w = db.warranties.find((war) => war.purchaseId === purch.id);
    if (w) {
      w.customerId = currentUser?.id || 'usr-customer-1';
    }

    saveDb(db);
    return {
      status: 200,
      data: {
        success: true,
        message: 'Purchase and warranty linked successfully!',
        data: purch,
        timestamp: new Date().toISOString(),
      },
    };
  }

  // -------------------------------------------------------------
  // 8. CLAIMS API
  // -------------------------------------------------------------
  if (normalizedMethod === 'POST' && path === '/claims') {
    const { warrantyId, issueDescription, evidenceReferences } = data || {};
    const w = db.warranties.find((war) => war.id === warrantyId);
    if (!w) {
      return { status: 404, data: { success: false, message: 'Warranty record not found' } };
    }
    if (!w.eligibleForClaim) {
      return { status: 400, data: { success: false, message: 'This warranty coverage period has expired.' } };
    }

    const claimId = `claim-${Date.now()}`;
    const newClaim: Claim = {
      id: claimId,
      warrantyId: w.id,
      purchaseId: w.purchaseId,
      retailerId: w.retailerId,
      retailerBusinessName: w.retailerBusinessName,
      customerId: currentUser?.id || w.customerId || 'usr-customer-1',
      customerName: currentUser?.name || 'Alex Johnson',
      customerEmail: currentUser?.email || 'customer@example.com',
      productName: w.productName,
      issueDescription: issueDescription || '',
      evidenceReferences: evidenceReferences || [],
      currentStatus: 'SUBMITTED',
      serviceNotes: [],
      statusHistory: [
        {
          id: `sh-${Date.now()}`,
          claimId,
          newStatus: 'SUBMITTED',
          changedBy: currentUser?.name || 'Customer',
          changedAt: new Date().toISOString(),
          note: 'Customer submitted warranty service claim.',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.claims.unshift(newClaim);

    // Notify retailer
    const retailerUser = db.users.find((u) => u.retailerId === w.retailerId);
    if (retailerUser) {
      db.notifications.unshift({
        id: `notif-${Date.now()}`,
        userId: retailerUser.id,
        type: 'CLAIM_SUBMITTED',
        message: `New warranty claim submitted for ${w.productName} by ${newClaim.customerName}.`,
        relatedEntityId: claimId,
        entityType: 'CLAIM',
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    saveDb(db);

    return {
      status: 200,
      data: {
        success: true,
        message: 'Claim submitted successfully',
        data: newClaim,
        timestamp: new Date().toISOString(),
      },
    };
  }

  if (normalizedMethod === 'GET' && path === '/claims/customer') {
    const page = parseInt(searchParams.get('page') || '0', 10);
    const size = parseInt(searchParams.get('size') || '20', 10);

    const custId = currentUser?.id || 'usr-customer-1';
    const list = db.claims.filter(
      (c) => c.customerId === custId || c.customerEmail?.toLowerCase() === currentUser?.email.toLowerCase()
    );

    return {
      status: 200,
      data: {
        success: true,
        message: 'Customer claims retrieved',
        data: paginate(list, page, size),
        timestamp: new Date().toISOString(),
      },
    };
  }

  if (normalizedMethod === 'GET' && path === '/claims/retailer') {
    const status = searchParams.get('status') as ClaimStatus | null;
    const page = parseInt(searchParams.get('page') || '0', 10);
    const size = parseInt(searchParams.get('size') || '20', 10);

    const retId = currentUser?.retailerId || 'ret-1';
    let list = db.claims.filter((c) => c.retailerId === retId);
    if (status) {
      list = list.filter((c) => c.currentStatus === status);
    }

    return {
      status: 200,
      data: {
        success: true,
        message: 'Retailer claims retrieved',
        data: paginate(list, page, size),
        timestamp: new Date().toISOString(),
      },
    };
  }

  const claimMatch = path.match(/^\/claims\/([^/]+)$/);
  if (normalizedMethod === 'GET' && claimMatch) {
    const c = db.claims.find((item) => item.id === claimMatch[1]);
    if (!c) return { status: 404, data: { success: false, message: 'Claim not found' } };
    return {
      status: 200,
      data: { success: true, message: 'Claim details', data: c, timestamp: new Date().toISOString() },
    };
  }

  const claimReviewMatch = path.match(/^\/claims\/([^/]+)\/review$/);
  if (normalizedMethod === 'PATCH' && claimReviewMatch) {
    const c = db.claims.find((item) => item.id === claimReviewMatch[1]);
    if (!c) return { status: 404, data: { success: false, message: 'Claim not found' } };
    const prev = c.currentStatus;
    c.currentStatus = 'UNDER_REVIEW';
    c.updatedAt = new Date().toISOString();
    c.statusHistory = c.statusHistory || [];
    c.statusHistory.unshift({
      id: `sh-${Date.now()}`,
      claimId: c.id,
      previousStatus: prev,
      newStatus: 'UNDER_REVIEW',
      changedBy: currentUser?.name || 'Retailer',
      changedAt: new Date().toISOString(),
      note: 'Retailer commenced diagnostic review.',
    });
    saveDb(db);
    return { status: 200, data: { success: true, message: 'Claim status updated', data: c } };
  }

  const claimDecisionMatch = path.match(/^\/claims\/([^/]+)\/decision$/);
  if (normalizedMethod === 'PATCH' && claimDecisionMatch) {
    const c = db.claims.find((item) => item.id === claimDecisionMatch[1]);
    if (!c) return { status: 404, data: { success: false, message: 'Claim not found' } };
    const { approved, resolutionType, reason } = data || {};
    const prev = c.currentStatus;
    c.currentStatus = approved ? 'APPROVED' : 'REJECTED';
    c.decisionBy = currentUser?.name || 'Retailer Service Team';
    c.decisionAt = new Date().toISOString();
    c.decisionReason = reason;
    if (approved) {
      c.resolutionType = resolutionType || 'REPAIR';
    }
    c.updatedAt = new Date().toISOString();
    c.statusHistory = c.statusHistory || [];
    c.statusHistory.unshift({
      id: `sh-${Date.now()}`,
      claimId: c.id,
      previousStatus: prev,
      newStatus: c.currentStatus,
      changedBy: currentUser?.name || 'Retailer',
      changedAt: new Date().toISOString(),
      note: approved
        ? `Claim approved for ${resolutionType || 'REPAIR'}.`
        : `Claim rejected: ${reason || 'Terms not met'}`,
    });
    saveDb(db);
    return { status: 200, data: { success: true, message: 'Decision recorded', data: c } };
  }

  const claimRequestInfoMatch = path.match(/^\/claims\/([^/]+)\/request-info$/);
  if (normalizedMethod === 'POST' && claimRequestInfoMatch) {
    const c = db.claims.find((item) => item.id === claimRequestInfoMatch[1]);
    if (!c) return { status: 404, data: { success: false, message: 'Claim not found' } };
    const prev = c.currentStatus;
    c.currentStatus = 'ADDITIONAL_INFO_REQUIRED';
    c.updatedAt = new Date().toISOString();
    c.statusHistory = c.statusHistory || [];
    c.statusHistory.unshift({
      id: `sh-${Date.now()}`,
      claimId: c.id,
      previousStatus: prev,
      newStatus: 'ADDITIONAL_INFO_REQUIRED',
      changedBy: currentUser?.name || 'Retailer',
      changedAt: new Date().toISOString(),
      note: `Requested customer information: ${data.reason}`,
    });
    saveDb(db);
    return { status: 200, data: { success: true, message: 'Info requested', data: c } };
  }

  const claimProvideInfoMatch = path.match(/^\/claims\/([^/]+)\/provide-info$/);
  if (normalizedMethod === 'POST' && claimProvideInfoMatch) {
    const c = db.claims.find((item) => item.id === claimProvideInfoMatch[1]);
    if (!c) return { status: 404, data: { success: false, message: 'Claim not found' } };
    const prev = c.currentStatus;
    c.currentStatus = 'UNDER_REVIEW';
    if (data.additionalEvidence && Array.isArray(data.additionalEvidence)) {
      c.evidenceReferences = [...(c.evidenceReferences || []), ...data.additionalEvidence];
    }
    c.updatedAt = new Date().toISOString();
    c.statusHistory = c.statusHistory || [];
    c.statusHistory.unshift({
      id: `sh-${Date.now()}`,
      claimId: c.id,
      previousStatus: prev,
      newStatus: 'UNDER_REVIEW',
      changedBy: currentUser?.name || 'Customer',
      changedAt: new Date().toISOString(),
      note: `Customer replied: ${data.response}`,
    });
    saveDb(db);
    return { status: 200, data: { success: true, message: 'Information submitted', data: c } };
  }

  const claimCancelMatch = path.match(/^\/claims\/([^/]+)\/cancel$/);
  if (normalizedMethod === 'PATCH' && claimCancelMatch) {
    const c = db.claims.find((item) => item.id === claimCancelMatch[1]);
    if (!c) return { status: 404, data: { success: false, message: 'Claim not found' } };
    const prev = c.currentStatus;
    c.currentStatus = 'CANCELLED';
    c.cancellationReason = data.reason;
    c.updatedAt = new Date().toISOString();
    c.statusHistory = c.statusHistory || [];
    c.statusHistory.unshift({
      id: `sh-${Date.now()}`,
      claimId: c.id,
      previousStatus: prev,
      newStatus: 'CANCELLED',
      changedBy: currentUser?.name || 'Customer',
      changedAt: new Date().toISOString(),
      note: `Customer cancelled claim: ${data.reason}`,
    });
    saveDb(db);
    return { status: 200, data: { success: true, message: 'Claim cancelled', data: c } };
  }

  const claimServiceProgressMatch = path.match(/^\/claims\/([^/]+)\/service-progress$/);
  if (normalizedMethod === 'POST' && claimServiceProgressMatch) {
    const c = db.claims.find((item) => item.id === claimServiceProgressMatch[1]);
    if (!c) return { status: 404, data: { success: false, message: 'Claim not found' } };
    c.serviceNotes = c.serviceNotes || [];
    c.serviceNotes.unshift({
      note: data.note,
      addedBy: currentUser?.name || 'Service Center',
      addedAt: new Date().toISOString(),
    });
    if (c.currentStatus === 'APPROVED') {
      const prev = c.currentStatus;
      c.currentStatus = 'IN_PROGRESS';
      c.statusHistory = c.statusHistory || [];
      c.statusHistory.unshift({
        id: `sh-${Date.now()}`,
        claimId: c.id,
        previousStatus: prev,
        newStatus: 'IN_PROGRESS',
        changedBy: currentUser?.name || 'Retailer',
        changedAt: new Date().toISOString(),
        note: `Hardware servicing in progress: ${data.note}`,
      });
    }
    c.updatedAt = new Date().toISOString();
    saveDb(db);
    return { status: 200, data: { success: true, message: 'Progress recorded', data: c } };
  }

  const claimCompleteMatch = path.match(/^\/claims\/([^/]+)\/complete$/);
  if (normalizedMethod === 'PATCH' && claimCompleteMatch) {
    const c = db.claims.find((item) => item.id === claimCompleteMatch[1]);
    if (!c) return { status: 404, data: { success: false, message: 'Claim not found' } };
    const prev = c.currentStatus;
    c.currentStatus = 'COMPLETED';
    c.resolutionNotes = data.resolutionNotes;
    c.updatedAt = new Date().toISOString();
    c.statusHistory = c.statusHistory || [];
    c.statusHistory.unshift({
      id: `sh-${Date.now()}`,
      claimId: c.id,
      previousStatus: prev,
      newStatus: 'COMPLETED',
      changedBy: currentUser?.name || 'Retailer',
      changedAt: new Date().toISOString(),
      note: `Service completed: ${data.resolutionNotes}`,
    });
    saveDb(db);
    return { status: 200, data: { success: true, message: 'Claim completed', data: c } };
  }

  const claimFeedbackMatch = path.match(/^\/claims\/([^/]+)\/feedback$/);
  if (normalizedMethod === 'POST' && claimFeedbackMatch) {
    const c = db.claims.find((item) => item.id === claimFeedbackMatch[1]);
    if (!c) return { status: 404, data: { success: false, message: 'Claim not found' } };
    c.customerRating = Number(data.rating) || 5;
    c.customerFeedback = data.feedback || '';
    c.feedbackSubmittedAt = new Date().toISOString();
    c.updatedAt = new Date().toISOString();
    saveDb(db);
    return { status: 200, data: { success: true, message: 'Feedback recorded', data: c } };
  }

  if (normalizedMethod === 'POST' && path === '/claims/upload-evidence') {
    return {
      status: 200,
      data: {
        success: true,
        message: 'Evidence uploaded successfully',
        data: {
          url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80',
          filename: 'defect-photo-evidence.jpg',
        },
        timestamp: new Date().toISOString(),
      },
    };
  }

  // -------------------------------------------------------------
  // 9. NOTIFICATIONS
  // -------------------------------------------------------------
  if (normalizedMethod === 'GET' && path === '/notifications') {
    const page = parseInt(searchParams.get('page') || '0', 10);
    const size = parseInt(searchParams.get('size') || '20', 10);
    const userId = currentUser?.id || 'usr-customer-1';
    const userNotifs = db.notifications.filter((n) => n.userId === userId);
    return {
      status: 200,
      data: {
        success: true,
        message: 'Notifications loaded',
        data: paginate(userNotifs, page, size),
        timestamp: new Date().toISOString(),
      },
    };
  }

  if (normalizedMethod === 'GET' && path === '/notifications/unread-count') {
    const userId = currentUser?.id || 'usr-customer-1';
    const unread = db.notifications.filter((n) => n.userId === userId && !n.isRead).length;
    return {
      status: 200,
      data: {
        success: true,
        message: 'Unread count',
        data: { unreadCount: unread },
        timestamp: new Date().toISOString(),
      },
    };
  }

  const notifReadMatch = path.match(/^\/notifications\/([^/]+)\/read$/);
  if (normalizedMethod === 'PATCH' && notifReadMatch) {
    const notif = db.notifications.find((n) => n.id === notifReadMatch[1]);
    if (notif) notif.isRead = true;
    saveDb(db);
    return { status: 200, data: { success: true, message: 'Marked as read', data: 'OK' } };
  }

  if (normalizedMethod === 'PATCH' && path === '/notifications/read-all') {
    const userId = currentUser?.id || 'usr-customer-1';
    db.notifications.forEach((n) => {
      if (n.userId === userId) n.isRead = true;
    });
    saveDb(db);
    return { status: 200, data: { success: true, message: 'All marked as read', data: 'OK' } };
  }

  // -------------------------------------------------------------
  // 10. POS BILLING API
  // -------------------------------------------------------------
  if (normalizedMethod === 'POST' && path === '/bills') {
    const billReq: CreateBillRequest = data;
    const retailerId = currentUser?.retailerId || 'ret-1';
    const retailer = db.retailers.find((r) => r.id === retailerId) || db.retailers[0];
    const invoiceNum = `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const billId = `bill-${Date.now()}`;
    const custEmail = (billReq.customerEmail || '').trim().toLowerCase();
    const matchedCustomer = db.users.find((u) => u.email.toLowerCase() === custEmail);

    let calculatedSubtotal = 0;

    const generatedItems = billReq.items.map((item, idx) => {
      const lineTotal = item.unitPrice * item.quantity;
      calculatedSubtotal += lineTotal;

      // Decrement catalog stock if productId provided
      if (item.productId) {
        const prod = db.products.find((p) => p.id === item.productId);
        if (prod && prod.stockQuantity !== undefined) {
          prod.stockQuantity = Math.max(0, prod.stockQuantity - item.quantity);
        }
      }

      let purchaseId: string | undefined = undefined;
      let warrantyId: string | undefined = undefined;
      let qrToken: string | undefined = undefined;
      let warrantyExpiryDate: string | undefined = undefined;

      // If warranty enabled on line item, create purchase and warranty records!
      if (item.hasWarranty) {
        purchaseId = `purch-${Date.now()}-${idx}`;
        warrantyId = `warr-${Date.now()}-${idx}`;
        qrToken = `QR-WARR-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        const duration = item.warrantyDuration || 12;
        const unit = item.warrantyUnit || 'MONTHS';
        const startDate = new Date().toISOString().split('T')[0];
        warrantyExpiryDate = computeExpiryDate(startDate, duration, unit);

        const newWarranty: Warranty = {
          id: warrantyId,
          purchaseId,
          retailerId,
          retailerBusinessName: retailer.businessName,
          customerId: matchedCustomer ? matchedCustomer.id : undefined,
          productId: item.productId || 'custom',
          productName: item.productName,
          productBrand: item.brand,
          productModel: '',
          startDate,
          expiryDate: warrantyExpiryDate,
          status: 'ACTIVE',
          termsSnapshot: item.warrantyTerms || 'Standard retail warranty.',
          warrantyDurationSnapshot: duration,
          warrantyUnitSnapshot: unit,
          qrToken,
          eligibleForClaim: true,
          createdAt: new Date().toISOString(),
        };

        const newPurchase: Purchase = {
          id: purchaseId,
          retailerId,
          productId: item.productId || 'custom',
          productName: item.productName,
          productBrand: item.brand,
          customerId: matchedCustomer ? matchedCustomer.id : undefined,
          customerEmail: custEmail || undefined,
          purchaseDate: startDate,
          serialNumber: item.serialNumber,
          invoiceNumber: invoiceNum,
          purchaseReference: `REF-POS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          linkingStatus: matchedCustomer ? 'LINKED' : 'UNCLAIMED',
          hasWarranty: true,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          billId,
          paymentMethod: billReq.paymentMethod || 'CASH',
          createdAt: new Date().toISOString(),
          warranty: newWarranty,
        };

        db.warranties.unshift(newWarranty);
        db.purchases.unshift(newPurchase);
      } else {
        // Also register standard sale purchase for record
        const nonWarrantyPurchase: Purchase = {
          id: `purch-${Date.now()}-${idx}`,
          retailerId,
          productId: item.productId || 'custom',
          productName: item.productName,
          productBrand: item.brand,
          customerId: matchedCustomer ? matchedCustomer.id : undefined,
          customerEmail: custEmail || undefined,
          purchaseDate: new Date().toISOString().split('T')[0],
          serialNumber: item.serialNumber,
          invoiceNumber: invoiceNum,
          purchaseReference: `REF-POS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          linkingStatus: 'UNCLAIMED',
          hasWarranty: false,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          billId,
          paymentMethod: billReq.paymentMethod || 'CASH',
          createdAt: new Date().toISOString(),
        };
        db.purchases.unshift(nonWarrantyPurchase);
      }

      return {
        productId: item.productId,
        productName: item.productName,
        brand: item.brand,
        category: item.category,
        serialNumber: item.serialNumber,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal,
        hasWarranty: !!item.hasWarranty,
        warrantyDuration: item.warrantyDuration,
        warrantyUnit: item.warrantyUnit,
        warrantyTerms: item.warrantyTerms,
        purchaseId,
        warrantyId,
        qrToken,
        warrantyExpiryDate,
      };
    });

    const discountAmount = billReq.discountAmount || 0;
    const taxAmount = billReq.taxAmount || 0;
    const grandTotal = Math.max(0, calculatedSubtotal - discountAmount + taxAmount);

    const newBill: Bill = {
      id: billId,
      invoiceNumber: invoiceNum,
      retailerId,
      retailerBusinessName: retailer.businessName,
      retailerContactEmail: retailer.contactEmail,
      retailerContactPhone: retailer.contactPhone,
      retailerAddress: retailer.address,
      customerName: billReq.customerName || 'Walk-in Customer',
      customerEmail: billReq.customerEmail,
      customerPhone: billReq.customerPhone,
      items: generatedItems,
      subtotal: calculatedSubtotal,
      discountAmount,
      taxAmount,
      grandTotal,
      paymentMethod: billReq.paymentMethod || 'CASH',
      paymentNotes: billReq.paymentNotes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.bills.unshift(newBill);
    saveDb(db);

    return {
      status: 200,
      data: {
        success: true,
        message: 'Bill and digital warranties created successfully!',
        data: newBill,
        timestamp: new Date().toISOString(),
      },
    };
  }

  if (normalizedMethod === 'GET' && path === '/bills') {
    const page = parseInt(searchParams.get('page') || '0', 10);
    const size = parseInt(searchParams.get('size') || '50', 10);
    const retailerId = currentUser?.retailerId || 'ret-1';
    const list = db.bills.filter((b) => b.retailerId === retailerId || !b.retailerId);
    return {
      status: 200,
      data: {
        success: true,
        message: 'Bills loaded',
        data: paginate(list, page, size),
        timestamp: new Date().toISOString(),
      },
    };
  }

  const billMatch = path.match(/^\/bills\/([^/]+)$/);
  if (normalizedMethod === 'GET' && billMatch) {
    const bill = db.bills.find((b) => b.id === billMatch[1]);
    if (!bill) return { status: 404, data: { success: false, message: 'Bill not found' } };
    return {
      status: 200,
      data: { success: true, message: 'Bill details', data: bill, timestamp: new Date().toISOString() },
    };
  }

  const billInvoiceMatch = path.match(/^\/bills\/invoice\/([^/]+)$/);
  if (normalizedMethod === 'GET' && billInvoiceMatch) {
    const bill = db.bills.find((b) => b.invoiceNumber === billInvoiceMatch[1]);
    if (!bill) return { status: 404, data: { success: false, message: 'Bill not found' } };
    return {
      status: 200,
      data: { success: true, message: 'Bill details', data: bill, timestamp: new Date().toISOString() },
    };
  }

  // Fallback for unhandled endpoints
  console.warn(`[Mock Backend] Unhandled route: ${normalizedMethod} ${path}`);
  return {
    status: 404,
    data: {
      success: false,
      message: `Mock endpoint not found for ${normalizedMethod} ${path}`,
      timestamp: new Date().toISOString(),
    },
  };
};
