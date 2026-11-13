import { apiClient } from './client';
import {
  ApiResponse,
  PagedResponse,
  User,
  Retailer,
  Product,
  Purchase,
  Warranty,
  PublicWarranty,
  Claim,
  Bill,
  CreateBillRequest,
  NotificationItem,
  PlatformAnalytics,
  RetailerAnalytics,
  ApprovalStatus,
  ClaimStatus,
  ResolutionType,
} from '../types';

export const authApi = {
  registerCustomer: async (data: any) => {
    const res = await apiClient.post<ApiResponse<any>>('/auth/register/customer', data);
    return res.data;
  },
  registerRetailer: async (data: any) => {
    const res = await apiClient.post<ApiResponse<any>>('/auth/register/retailer', data);
    return res.data;
  },
  login: async (data: any) => {
    const res = await apiClient.post<ApiResponse<any>>('/auth/login', data);
    return res.data;
  },
  verifyEmail: async (email: string, otp: string) => {
    const res = await apiClient.post<ApiResponse<string>>('/auth/verify-email', { email, otp });
    return res.data;
  },
  resendOtp: async (email: string) => {
    const res = await apiClient.post<ApiResponse<string>>(`/auth/resend-otp?email=${encodeURIComponent(email)}`);
    return res.data;
  },
  forgotPassword: async (email: string) => {
    const res = await apiClient.post<ApiResponse<string>>('/auth/forgot-password', { email });
    return res.data;
  },
  resetPassword: async (token: string, newPassword: string) => {
    const res = await apiClient.post<ApiResponse<string>>('/auth/reset-password', { token, newPassword });
    return res.data;
  },
  getMe: async () => {
    const res = await apiClient.get<ApiResponse<User>>('/auth/me');
    return res.data.data;
  },
  updateProfile: async (data: { name: string; phone?: string }) => {
    const res = await apiClient.put<ApiResponse<User>>('/auth/profile', data);
    return res.data.data;
  },
  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    const res = await apiClient.post<ApiResponse<string>>('/auth/change-password', data);
    return res.data;
  },
};

export const adminApi = {
  getDashboard: async () => {
    const res = await apiClient.get<ApiResponse<PlatformAnalytics>>('/admin/dashboard');
    return res.data.data;
  },
  getRetailers: async (status?: ApprovalStatus, page = 0, size = 20) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (status) params.append('status', status);
    const res = await apiClient.get<ApiResponse<PagedResponse<Retailer>>>(`/admin/retailers?${params.toString()}`);
    return res.data.data;
  },
  getRetailerById: async (id: string) => {
    const res = await apiClient.get<ApiResponse<Retailer>>(`/admin/retailers/${id}`);
    return res.data.data;
  },
  updateRetailerStatus: async (id: string, status: ApprovalStatus, reason?: string) => {
    const res = await apiClient.patch<ApiResponse<Retailer>>(`/admin/retailers/${id}/status`, { status, reason });
    return res.data.data;
  },
  getCustomers: async (page = 0, size = 20) => {
    const res = await apiClient.get<ApiResponse<PagedResponse<User>>>(`/admin/customers?page=${page}&size=${size}`);
    return res.data.data;
  },
  getAllClaims: async (status?: ClaimStatus, page = 0, size = 20) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (status) params.append('status', status);
    const res = await apiClient.get<ApiResponse<PagedResponse<Claim>>>(`/admin/claims?${params.toString()}`);
    return res.data.data;
  },
};

export const retailerApi = {
  getProfile: async () => {
    const res = await apiClient.get<ApiResponse<Retailer>>('/retailer/profile');
    return res.data.data;
  },
  updateProfile: async (data: Partial<Retailer>) => {
    const res = await apiClient.put<ApiResponse<Retailer>>('/retailer/profile', data);
    return res.data.data;
  },
  getAnalytics: async () => {
    const res = await apiClient.get<ApiResponse<RetailerAnalytics>>('/analytics/retailer');
    return res.data.data;
  },
};

export const productApi = {
  createProduct: async (data: any) => {
    const res = await apiClient.post<ApiResponse<Product>>('/products', data);
    return res.data.data;
  },
  getProducts: async (activeOnly?: boolean, page = 0, size = 20) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (activeOnly !== undefined) params.append('activeOnly', String(activeOnly));
    const res = await apiClient.get<ApiResponse<PagedResponse<Product>>>(`/products?${params.toString()}`);
    return res.data.data;
  },
  getProductById: async (id: string) => {
    const res = await apiClient.get<ApiResponse<Product>>(`/products/${id}`);
    return res.data.data;
  },
  updateProduct: async (id: string, data: any) => {
    const res = await apiClient.put<ApiResponse<Product>>(`/products/${id}`, data);
    return res.data.data;
  },
  deactivateProduct: async (id: string) => {
    const res = await apiClient.patch<ApiResponse<Product>>(`/products/${id}/deactivate`);
    return res.data.data;
  },
};

export const purchaseApi = {
  registerPurchase: async (data: any) => {
    const res = await apiClient.post<ApiResponse<Purchase>>('/purchases', data);
    return res.data.data;
  },
  getPurchases: async (page = 0, size = 20) => {
    const res = await apiClient.get<ApiResponse<PagedResponse<Purchase>>>(`/purchases?page=${page}&size=${size}`);
    return res.data.data;
  },
  getPurchaseById: async (id: string) => {
    const res = await apiClient.get<ApiResponse<Purchase>>(`/purchases/${id}`);
    return res.data.data;
  },
};

export const warrantyApi = {
  getCustomerWarranties: async (page = 0, size = 20) => {
    const res = await apiClient.get<ApiResponse<PagedResponse<Warranty>>>(`/customer/warranties?page=${page}&size=${size}`);
    return res.data.data;
  },
  getWarrantyById: async (id: string) => {
    const res = await apiClient.get<ApiResponse<Warranty>>(`/customer/warranties/${id}`);
    return res.data.data;
  },
  verifyPublicWarranty: async (qrToken: string) => {
    const res = await apiClient.get<ApiResponse<PublicWarranty>>(`/public/warranties/verify/${qrToken}`);
    return res.data.data;
  },
};

export const customerLinkingApi = {
  getPendingPurchases: async () => {
    const res = await apiClient.get<ApiResponse<Purchase[]>>('/customer/purchases/pending');
    return res.data.data;
  },
  requestLinkingOtp: async (purchaseId: string) => {
    const res = await apiClient.post<ApiResponse<string>>(`/customer/purchases/${purchaseId}/request-otp`);
    return res.data;
  },
  verifyAndLink: async (purchaseId: string, otp: string) => {
    const res = await apiClient.post<ApiResponse<Purchase>>(`/customer/purchases/${purchaseId}/verify-link`, { otp });
    return res.data.data;
  },
};

export const claimApi = {
  submitClaim: async (data: { warrantyId: string; issueDescription: string; evidenceReferences?: string[] }) => {
    const res = await apiClient.post<ApiResponse<Claim>>('/claims', data);
    return res.data.data;
  },
  getCustomerClaims: async (page = 0, size = 20) => {
    const res = await apiClient.get<ApiResponse<PagedResponse<Claim>>>(`/claims/customer?page=${page}&size=${size}`);
    return res.data.data;
  },
  getRetailerClaims: async (status?: ClaimStatus, page = 0, size = 20) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (status) params.append('status', status);
    const res = await apiClient.get<ApiResponse<PagedResponse<Claim>>>(`/claims/retailer?${params.toString()}`);
    return res.data.data;
  },
  getClaimById: async (id: string) => {
    const res = await apiClient.get<ApiResponse<Claim>>(`/claims/${id}`);
    return res.data.data;
  },
  startReview: async (id: string) => {
    const res = await apiClient.patch<ApiResponse<Claim>>(`/claims/${id}/review`);
    return res.data.data;
  },
  makeDecision: async (id: string, approved: boolean, resolutionType?: ResolutionType, reason?: string) => {
    const res = await apiClient.patch<ApiResponse<Claim>>(`/claims/${id}/decision`, { approved, resolutionType, reason });
    return res.data.data;
  },
  requestInfo: async (id: string, reason: string) => {
    const res = await apiClient.post<ApiResponse<Claim>>(`/claims/${id}/request-info`, { reason });
    return res.data.data;
  },
  replyInfo: async (id: string, response: string, additionalEvidence?: string[]) => {
    const res = await apiClient.post<ApiResponse<Claim>>(`/claims/${id}/provide-info`, { response, additionalEvidence });
    return res.data.data;
  },
  cancelClaim: async (id: string, reason: string) => {
    const res = await apiClient.patch<ApiResponse<Claim>>(`/claims/${id}/cancel`, { reason });
    return res.data.data;
  },
  updateProgress: async (id: string, note: string) => {
    const res = await apiClient.post<ApiResponse<Claim>>(`/claims/${id}/service-progress`, { note });
    return res.data.data;
  },
  completeClaim: async (id: string, resolutionNotes: string) => {
    const res = await apiClient.patch<ApiResponse<Claim>>(`/claims/${id}/complete`, { resolutionNotes });
    return res.data.data;
  },
  submitFeedback: async (id: string, rating: number, feedback?: string) => {
    const res = await apiClient.post<ApiResponse<Claim>>(`/claims/${id}/feedback`, { rating, feedback });
    return res.data.data;
  },
  uploadEvidence: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<ApiResponse<{ url: string; filename: string }>>('/claims/upload-evidence', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },
};

export const notificationApi = {
  getMyNotifications: async (page = 0, size = 20) => {
    const res = await apiClient.get<ApiResponse<PagedResponse<NotificationItem>>>(`/notifications?page=${page}&size=${size}`);
    return res.data.data;
  },
  getUnreadCount: async () => {
    const res = await apiClient.get<ApiResponse<{ unreadCount: number }>>('/notifications/unread-count');
    return res.data.data.unreadCount;
  },
  markAsRead: async (id: string) => {
    const res = await apiClient.patch<ApiResponse<string>>(`/notifications/${id}/read`);
    return res.data;
  },
  markAllAsRead: async () => {
    const res = await apiClient.patch<ApiResponse<string>>('/notifications/read-all');
    return res.data;
  },
};

export const billingApi = {
  create: async (data: CreateBillRequest) => {
    const res = await apiClient.post<ApiResponse<Bill>>('/bills', data);
    return res.data.data;
  },
  getAll: async (page = 0, size = 20) => {
    const res = await apiClient.get<ApiResponse<PagedResponse<Bill>>>(`/bills?page=${page}&size=${size}`);
    return res.data.data;
  },
  getById: async (id: string) => {
    const res = await apiClient.get<ApiResponse<Bill>>(`/bills/${id}`);
    return res.data.data;
  },
  getByInvoiceNumber: async (invoiceNumber: string) => {
    const res = await apiClient.get<ApiResponse<Bill>>(`/bills/invoice/${invoiceNumber}`);
    return res.data.data;
  },
};

