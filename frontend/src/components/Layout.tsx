import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Chatbot } from './Chatbot';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, AlertTriangle } from 'lucide-react';

export const Layout: React.FC = () => {
  const { user } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();

  const isDashboardRoute = Boolean(
    user &&
    (location.pathname.startsWith('/admin') ||
     location.pathname.startsWith('/retailer') ||
     location.pathname.startsWith('/customer') ||
     location.pathname.startsWith('/notifications'))
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#D3E0D1] dark:bg-[#0E2417] text-[#0C2114] dark:text-[#F0F6F2] transition-colors duration-200">
      <Navbar
        onToggleMobileNav={() => setMobileNavOpen((prev) => !prev)}
        mobileNavOpen={mobileNavOpen}
        isDashboardRoute={isDashboardRoute}
      />

      {/* Role / Status Alerts - Only shown on dashboard routes */}
      {isDashboardRoute && user && user.role === 'CUSTOMER' && !user.emailVerified && (
        <div className="bg-amber-500 text-white px-3 sm:px-4 py-2.5 text-xs sm:text-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 max-w-7xl xl:max-w-[1440px] 2xl:max-w-[1680px] mx-auto w-full">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span>
                Your email address is not yet verified. You must verify ownership to access and claim your digital warranties.
              </span>
            </div>
            <Link
              to="/verify-email"
              className="underline font-semibold hover:text-amber-100 shrink-0 self-end sm:self-auto"
            >
              Verify Now
            </Link>
          </div>
        </div>
      )}

      {isDashboardRoute && user && user.role === 'RETAILER' && user.retailerApprovalStatus === 'PENDING' && (
        <div className="bg-[#17432A] text-[#F3F7F2] border-b border-[#245D3B] px-3 sm:px-4 py-2.5 text-xs sm:text-sm shadow-xs">
          <div className="max-w-7xl xl:max-w-[1440px] 2xl:max-w-[1680px] mx-auto w-full flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-[#86E4AE] shrink-0" />
            <span>
              <strong>Application Pending:</strong> Your retailer registration is currently under review by the platform administrator. Product creation and purchase registration will be unlocked once approved.
            </span>
          </div>
        </div>
      )}

      {isDashboardRoute && user && user.role === 'RETAILER' && user.retailerApprovalStatus === 'SUSPENDED' && (
        <div className="bg-red-600 text-white px-3 sm:px-4 py-2.5 text-xs sm:text-sm">
          <div className="max-w-7xl xl:max-w-[1440px] 2xl:max-w-[1680px] mx-auto w-full flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span>
              <strong>Account Suspended:</strong> Your retailer business account has been suspended by the administrator. Operations are restricted.
            </span>
          </div>
        </div>
      )}

      {/* Main Body */}
      {isDashboardRoute ? (
        <div className="flex-1 flex max-w-7xl xl:max-w-[1440px] 2xl:max-w-[1680px] w-full mx-auto min-w-0">
          <Sidebar
            mobileOpen={mobileNavOpen}
            onClose={() => setMobileNavOpen(false)}
          />
          <main className="flex-1 p-3.5 sm:p-6 lg:p-6 xl:p-8 2xl:p-10 overflow-x-hidden min-w-0">
            <Outlet />
          </main>
        </div>
      ) : (
        <main className="flex-1 max-w-7xl xl:max-w-[1440px] 2xl:max-w-[1680px] w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-8 min-w-0">
          <Outlet />
        </main>
      )}
      {user && <Chatbot />}
    </div>
  );
};


