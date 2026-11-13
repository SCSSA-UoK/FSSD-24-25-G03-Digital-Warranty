import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { warrantyApi, claimApi, customerLinkingApi } from '../../api';
import { Warranty, Claim, Purchase } from '../../types';
import { ShieldCheck, FileText, Link2, PlusCircle, ArrowRight, Clock, Store } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [pendingPurchases, setPendingPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [wRes, cRes, pRes] = await Promise.all([
          warrantyApi.getCustomerWarranties(0, 5),
          claimApi.getCustomerClaims(0, 5),
          customerLinkingApi.getPendingPurchases(),
        ]);
        setWarranties(wRes.content);
        setClaims(cRes.content);
        setPendingPurchases(pRes);
      } catch (err) {
        console.error('Failed to load customer dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const activeWarrantiesCount = warranties.filter((w) => w.eligibleForClaim).length;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome, {user?.name}!</h1>
        <p className="text-sm text-slate-500">Your global digital warranty repository across participating retailers</p>
      </div>

      {/* Pending Unclaimed Purchases Alert Banner */}
      {pendingPurchases.length > 0 && (
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-lg">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-indigo-900">
                You have {pendingPurchases.length} unclaimed purchase{pendingPurchases.length > 1 ? 's' : ''} awaiting linking!
              </div>
              <div className="text-xs text-indigo-700">
                A retailer registered a purchase with your email. Verify via one-time OTP to add it to your account.
              </div>
            </div>
          </div>
          <Link
            to="/customer/claim-purchase"
            className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition self-start sm:self-auto shrink-0"
          >
            Claim Purchases Now
          </Link>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Active Warranties</span>
            <div className="text-3xl font-extrabold text-slate-900 mt-1">{activeWarrantiesCount}</div>
            <div className="text-xs text-emerald-600 mt-1 font-medium">Eligible for service claims</div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Warranties</span>
            <div className="text-3xl font-extrabold text-slate-900 mt-1">{warranties.length}</div>
            <div className="text-xs text-slate-500 mt-1">Multi-retailer records</div>
          </div>
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
            <Store className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Warranty Claims</span>
            <div className="text-3xl font-extrabold text-slate-900 mt-1">{claims.length}</div>
            <div className="text-xs text-slate-500 mt-1">Tracked in real-time</div>
          </div>
          <div className="p-3 bg-rose-50 text-rose-700 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Recent Digital Warranties */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Your Active Digital Warranties</h2>
          <Link
            to="/customer/warranties"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            View all warranties <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {warranties.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            No digital warranties linked yet. If you recently made a purchase, click "Claim New Purchase" to link it.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {warranties.map((w) => (
              <div
                key={w.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 transition space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-bold text-slate-900 text-sm">{w.productName}</span>
                    <div className="text-xs text-slate-500">Retailer: {w.retailerBusinessName}</div>
                  </div>
                  {w.eligibleForClaim ? (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      ACTIVE
                    </span>
                  ) : (
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      EXPIRED
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200/60">
                  <span>Expires: <strong>{w.expiryDate}</strong></span>
                  <Link
                    to={`/verify/${w.qrToken}`}
                    target="_blank"
                    className="text-indigo-600 font-semibold hover:underline"
                  >
                    View QR Token &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

