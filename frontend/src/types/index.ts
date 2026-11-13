export type Role = 'ADMIN' | 'RETAILER' | 'CUSTOMER';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export type WarrantyUnit = 'DAYS' | 'MONTHS' | 'YEARS';
export type LinkingStatus = 'UNCLAIMED' | 'PENDING_VERIFICATION' | 'LINKED';
export type WarrantyStatus = 'ACTIVE' | 'EXPIRED';
export type ClaimStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'ADDITIONAL_INFO_REQUIRED'
  | 'CANCELLED'
  | 'IN_PROGRESS'
  | 'COMPLETED';
export type ResolutionType = 'REPAIR' | 'REPLACEMENT';
export type NotificationType =
  | 'PURCHASE_LINKED'
  | 'CLAIM_SUBMITTED'
  | 'CLAIM_STATUS_CHANGED'
  | 'RETAILER_APPROVED'
  | 'RETAILER_SUSPENDED'
  | 'ADDITIONAL_INFO_REQUESTED'
  | 'ADDITIONAL_INFO_PROVIDED';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  emailVerified: boolean;
  accountStatus: AccountStatus;
  retailerId?: string;
  retailerApprovalStatus?: ApprovalStatus;
  createdAt?: string;
}

export interface Retailer {
  id: string;
  userId: string;
  businessName: string;
  registrationNumber: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  description?: string;
  approvalStatus: ApprovalStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  suspensionReason?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  retailerId: string;
  name: string;
  brand: string;
  model: string;
  category: string;
  description?: string;
  warrantyDuration: number;
  warrantyUnit: WarrantyUnit;
  warrantyTerms: string;
  hasWarranty?: boolean;
  price?: number;
  stockQuantity?: number;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Purchase {
  id: string;
  retailerId: string;
  productId: string;
  productName: string;
  productBrand?: string;
  productModel?: string;
  customerId?: string;
  customerEmail?: string;
  purchaseDate: string;
  serialNumber?: string;
  invoiceNumber: string;
  purchaseReference: string;
  linkingStatus: LinkingStatus;
  hasWarranty?: boolean;
  unitPrice?: number;
  quantity?: number;
  billId?: string;
  paymentMethod?: string;
  createdAt: string;
  warranty?: Warranty;
}

export interface Warranty {
  id: string;
  purchaseId: string;
  retailerId: string;
  retailerBusinessName?: string;
  customerId?: string;
  productId: string;
  productName: string;
  productBrand?: string;
  productModel?: string;
  startDate: string;
  expiryDate: string;
  status: WarrantyStatus;
  termsSnapshot: string;
  warrantyDurationSnapshot: number;
  warrantyUnitSnapshot: WarrantyUnit;
  qrToken: string;
  eligibleForClaim: boolean;
  createdAt: string;
}

export interface PublicWarranty {
  verificationStatus: string;
  productName: string;
  productBrand: string;
  productModel: string;
  retailerBusinessName: string;
  startDate: string;
  expiryDate: string;
  status: WarrantyStatus;
  currentlyValid: boolean;
  termsSummary: string;
}

export interface ServiceNote {
  note: string;
  addedBy: string;
  addedAt: string;
}

export interface ClaimStatusHistory {
  id: string;
  claimId: string;
  previousStatus?: ClaimStatus;
  newStatus: ClaimStatus;
  changedBy: string;
  changedAt: string;
  note?: string;
}

export interface Claim {
  id: string;
  warrantyId: string;
  purchaseId: string;
  retailerId: string;
  retailerBusinessName?: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  productName: string;
  issueDescription: string;
  evidenceReferences?: string[];
  currentStatus: ClaimStatus;
  decisionReason?: string;
  decisionBy?: string;
  decisionAt?: string;
  resolutionType?: ResolutionType;
  resolutionNotes?: string;
  cancellationReason?: string;
  customerRating?: number;
  customerFeedback?: string;
  feedbackSubmittedAt?: string;
  serviceNotes?: ServiceNote[];
  statusHistory?: ClaimStatusHistory[];
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  relatedEntityId?: string;
  entityType?: string;
  isRead: boolean;
  createdAt: string;
}

export interface PlatformAnalytics {
  totalRetailers: number;
  approvedRetailers: number;
  pendingRetailers: number;
  suspendedRetailers: number;
  totalCustomers: number;
  totalProducts: number;
  totalPurchases: number;
  totalWarranties: number;
  totalClaims: number;
  claimsByStatus: Record<string, number>;
  monthlyCustomerRegistrations?: Record<string, number>;
}

export interface RetailerAnalytics {
  totalProducts: number;
  activeProducts: number;
  totalPurchases: number;
  totalWarranties: number;
  totalClaims: number;
  pendingClaims: number;
  claimsByStatus: Record<string, number>;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export type PaymentMethod = 'CASH' | 'CARD' | 'ONLINE' | 'UPI' | 'OTHER';

export interface BillItem {
  productId?: string;
  productName: string;
  brand?: string;
  category?: string;
  serialNumber?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  hasWarranty: boolean;
  warrantyDuration?: number;
  warrantyUnit?: WarrantyUnit;
  warrantyTerms?: string;
  purchaseId?: string;
  warrantyId?: string;
  qrToken?: string;
  warrantyExpiryDate?: string;
}

export interface Bill {
  id: string;
  invoiceNumber: string;
  retailerId: string;
  retailerBusinessName?: string;
  retailerContactEmail?: string;
  retailerContactPhone?: string;
  retailerAddress?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  items: BillItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  paymentNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BillItemRequest {
  productId?: string;
  productName: string;
  brand?: string;
  category?: string;
  serialNumber?: string;
  quantity: number;
  unitPrice: number;
  hasWarranty?: boolean;
  warrantyDuration?: number;
  warrantyUnit?: WarrantyUnit;
  warrantyTerms?: string;
}

export interface CreateBillRequest {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  items: BillItemRequest[];
  discountAmount?: number;
  taxAmount?: number;
  paymentMethod?: PaymentMethod;
  paymentNotes?: string;
}

