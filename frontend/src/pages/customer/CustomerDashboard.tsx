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
  const [syncingPurchases, setSyncingPurchases] = useState(false);

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

  useEffect(() => {
    fetchData();
  }, []);

  const handleSyncPurchases = async () => {
    try {
      setSyncingPurchases(true);
      await customerLinkingApi.syncAllPurchases();
      await fetchData();
    } catch (err) {
      console.error('Failed to link purchases', err);
    } finally {
      setSyncingPurchases(false);
    }
  };

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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Welcome, {user?.name}!</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Your global digital warranty repository across participating retailers</p>
      </div>

      {/* Pending Unclaimed Purchases Alert Banner */}
      {pendingPurchases.length > 0 && (
        <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-lg">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-indigo-900 dark:text-indigo-200">
                You have {pendingPurchases.length} unclaimed purchase{pendingPurchases.length > 1 ? 's' : ''} awaiting linking!
              </div>
              <div className="text-xs text-indigo-700 dark:text-indigo-300">
                A retailer registered a purchase with your email. Link it directly to your verified account with 1 click.
              </div>
            </div>
          </div>
          <button
            onClick={handleSyncPurchases}
            disabled={syncingPurchases}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition self-start sm:self-auto shrink-0 cursor-pointer disabled:opacity-50"
          >
            {syncingPurchases ? 'Linking...' : 'Link to Account'}
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Active Warranties</span>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">{activeWarrantiesCount}</div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">Eligible for service claims</div>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Total Warranties</span>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">{warranties.length}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Multi-retailer records</div>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 rounded-xl">
            <Store className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Warranty Claims</span>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">{claims.length}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Tracked in real-time</div>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Recent Digital Warranties */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Your Active Digital Warranties</h2>
          <Link
            to="/customer/warranties"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1"
          >
            View all warranties <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {warranties.length === 0 ? (
          <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
            No digital warranties linked yet. Any retail purchases made with your email are automatically synced to your account.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {warranties.map((w) => (
              <div
                key={w.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700 transition space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{w.productName}</span>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Retailer: {w.retailerBusinessName}</div>
                    {w.serialNumber && (
                      <div className="text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
                        S/N: {w.serialNumber}
                      </div>
                    )}
                  </div>
                  {w.eligibleForClaim ? (
                    <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      ACTIVE
                    </span>
                  ) : (
                    <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      EXPIRED
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <span>Expires: <strong className="text-slate-700 dark:text-slate-300">{w.expiryDate}</strong></span>
                  <Link
                    to={`/verify/${w.qrToken}`}
                    target="_blank"
                    className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
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

