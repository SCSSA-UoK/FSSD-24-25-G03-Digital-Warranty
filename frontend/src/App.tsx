import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

// Public pages
import { Landing } from './pages/public/Landing';
import { PublicVerify } from './pages/public/PublicVerify';

// Auth pages
import { Login } from './pages/auth/Login';
import { RegisterCustomer } from './pages/auth/RegisterCustomer';
import { RegisterRetailer } from './pages/auth/RegisterRetailer';
import { VerifyEmail } from './pages/auth/VerifyEmail';
import { ForgotPassword } from './pages/auth/ForgotPassword';

// Admin pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { RetailerApplications } from './pages/admin/RetailerApplications';
import { CustomerList } from './pages/admin/CustomerList';
import { PlatformClaims } from './pages/admin/PlatformClaims';
import { AuditLogs } from './pages/admin/AuditLogs';

// Retailer pages
import { RetailerDashboard } from './pages/retailer/RetailerDashboard';
import { PosBilling } from './pages/retailer/PosBilling';
import { BillList } from './pages/retailer/BillList';
import { ProductManagement } from './pages/retailer/ProductManagement';
import { PurchaseList } from './pages/retailer/PurchaseList';
import { RetailerClaims } from './pages/retailer/RetailerClaims';
import { RetailerProfile } from './pages/retailer/RetailerProfile';

// Customer pages
import { CustomerDashboard } from './pages/customer/CustomerDashboard';
import { CustomerWarranties } from './pages/customer/CustomerWarranties';
import { FindAndLinkPurchases } from './pages/customer/FindAndLinkPurchases';
import { SubmitClaim } from './pages/customer/SubmitClaim';
import { CustomerClaims } from './pages/customer/CustomerClaims';
import { CustomerProfile } from './pages/customer/CustomerProfile';
import { NotificationsPage } from './pages/customer/NotificationsPage';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
        <BrowserRouter>
          <Routes>
            {/* Public standalone */}
            <Route path="/verify/:qrToken" element={<PublicVerify />} />

            {/* Layout wrapper */}
            <Route element={<Layout />}>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<RegisterCustomer />} />
              <Route path="/register/retailer" element={<RegisterRetailer />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/retailers"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <RetailerApplications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/customers"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <CustomerList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/claims"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <PlatformClaims />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/audit-logs"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AuditLogs />
                  </ProtectedRoute>
                }
              />

              {/* Retailer Routes */}
              <Route
                path="/retailer"
                element={
                  <ProtectedRoute allowedRoles={['RETAILER']}>
                    <RetailerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/retailer/pos"
                element={
                  <ProtectedRoute allowedRoles={['RETAILER']}>
                    <PosBilling />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/retailer/bills"
                element={
                  <ProtectedRoute allowedRoles={['RETAILER']}>
                    <BillList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/retailer/products"
                element={
                  <ProtectedRoute allowedRoles={['RETAILER']}>
                    <ProductManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/retailer/register-purchase"
                element={<Navigate to="/retailer/pos" replace />}
              />
              <Route
                path="/retailer/purchases"
                element={
                  <ProtectedRoute allowedRoles={['RETAILER']}>
                    <PurchaseList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/retailer/claims"
                element={
                  <ProtectedRoute allowedRoles={['RETAILER']}>
                    <RetailerClaims />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/retailer/profile"
                element={
                  <ProtectedRoute allowedRoles={['RETAILER']}>
                    <RetailerProfile />
                  </ProtectedRoute>
                }
              />

              {/* Customer Routes */}
              <Route
                path="/customer"
                element={
                  <ProtectedRoute allowedRoles={['CUSTOMER']}>
                    <CustomerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/warranties"
                element={
                  <ProtectedRoute allowedRoles={['CUSTOMER']}>
                    <CustomerWarranties />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/find-purchases"
                element={
                  <ProtectedRoute allowedRoles={['CUSTOMER']}>
                    <FindAndLinkPurchases />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/claim-purchase"
                element={
                  <ProtectedRoute allowedRoles={['CUSTOMER']}>
                    <FindAndLinkPurchases />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/submit-claim"
                element={
                  <ProtectedRoute allowedRoles={['CUSTOMER']}>
                    <SubmitClaim />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/claims"
                element={
                  <ProtectedRoute allowedRoles={['CUSTOMER']}>
                    <CustomerClaims />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/profile"
                element={
                  <ProtectedRoute allowedRoles={['CUSTOMER']}>
                    <CustomerProfile />
                  </ProtectedRoute>
                }
              />

              {/* Shared Authenticated Routes */}
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <NotificationsPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
