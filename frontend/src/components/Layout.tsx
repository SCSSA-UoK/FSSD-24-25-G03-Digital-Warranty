import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, AlertTriangle } from 'lucide-react';

export const Layout: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      {/* Role / Status Alerts */}
      {user && user.role === 'CUSTOMER' && !user.emailVerified && (
        <div className="bg-amber-500 text-white px-4 py-2.5 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>
              Your email address is not yet verified. You must verify ownership to access and claim your digital warranties.
            </span>
            <Link
              to="/verify-email"
              className="ml-auto underline font-semibold hover:text-amber-100"
            >
              Verify Now
            </Link>
          </div>
        </div>
      )}

      {user && user.role === 'RETAILER' && user.retailerApprovalStatus === 'PENDING' && (
        <div className="bg-blue-600 text-white px-4 py-2.5 text-sm flex items-center gap-2">
          <div className="max-w-7xl mx-auto w-full flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>
              <strong>Application Pending:</strong> Your retailer registration is currently under review by the platform administrator. Product creation and purchase registration will be unlocked once approved.
            </span>
          </div>
        </div>
      )}

      {user && user.role === 'RETAILER' && user.retailerApprovalStatus === 'SUSPENDED' && (
        <div className="bg-red-600 text-white px-4 py-2.5 text-sm flex items-center gap-2">
          <div className="max-w-7xl mx-auto w-full flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>
              <strong>Account Suspended:</strong> Your retailer business account has been suspended by the administrator. Operations are restricted.
            </span>
          </div>
        </div>
      )}

      {/* Main Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {user && <Sidebar />}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

