import React, { useEffect, useState } from 'react';
import { customerLinkingApi, extractErrorMessage } from '../../api';
import { Purchase } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { 
  Link2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ShieldCheck, 
  Package, 
  Calendar, 
  Receipt, 
  Sparkles, 
  Mail, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const ClaimPurchase: React.FC = () => {
  const { user } = useAuth();
  const [pendingPurchases, setPendingPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchPending = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await customerLinkingApi.getPendingPurchases();
      setPendingPurchases(data || []);
    } catch (err) {
      console.error('Failed to load pending purchases', err);
      setError(extractErrorMessage(err, 'Failed to fetch pending purchases.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleClaim = async (purchase: Purchase) => {
    setError(null);
    setMessage(null);
    setClaimingId(purchase.id);
    try {
      await customerLinkingApi.claimPurchase(purchase.id);
      setMessage(`Success! Purchase ${purchase.purchaseReference} (${purchase.productName || 'Item'}) and digital warranty have been linked to your account.`);
      // Refresh list
      await fetchPending();
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to claim purchase. Please try again.'));
    } finally {
      setClaimingId(null);
    }
  };

  const handleSyncAll = async () => {
    setError(null);
    setMessage(null);
    setSyncing(true);
    try {
      const res = await customerLinkingApi.syncAllPurchases();
      const count = typeof res === 'number' ? res : (res as any)?.data || 0;
      if (count > 0) {
        setMessage(`Successfully linked ${count} purchase(s) and digital warranty certificates to your account!`);
      } else {
        setMessage('Your account is completely synchronized. No unlinked purchases found.');
      }
      await fetchPending();
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Synchronization failed.'));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Link2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Claim Purchases & Digital Warranties
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Seamless ownership linking: In-store and online purchases registered with your verified email are automatically linked to your account.
          </p>
        </div>
        <button
          onClick={handleSyncAll}
          disabled={syncing || loading}
          className="px-3.5 py-2 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-2xs disabled:opacity-50 cursor-pointer"
          title="Scan and automatically link all purchases registered to your email"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Synchronizing...' : 'Sync All Purchases'}
        </button>
      </div>

      {/* Verified Email Ownership Banner */}
      {user?.emailVerified ? (
        <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-start gap-3 shadow-2xs">
          <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0 mt-0.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-xs space-y-1">
            <div className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
              <span>Verified Account Ownership Active</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300">
                {user.email}
              </span>
            </div>
            <p className="text-emerald-700 dark:text-emerald-300 leading-relaxed">
              Your email was verified during registration. Purchases recorded by retailers with this email address are automatically claimed without requiring secondary one-time passwords (OTP).
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl flex items-start justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-600 text-white rounded-xl shrink-0 mt-0.5">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="text-xs space-y-1">
              <div className="font-bold text-amber-900 dark:text-amber-200">
                Email Verification Recommended
              </div>
              <p className="text-amber-700 dark:text-amber-300 leading-relaxed">
                Please verify your email address to enable instant automatic purchase linking and unlock all digital warranty certificates.
              </p>
            </div>
          </div>
          <Link
            to="/verify-email"
            state={{ email: user?.email }}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shrink-0 transition"
          >
            Verify Now
          </Link>
        </div>
      )}

      {/* Notifications */}
      {message && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-2xl text-sm flex items-center gap-2.5 animate-in fade-in duration-150">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="font-medium text-xs sm:text-sm">{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-2xl text-sm flex items-start gap-2.5 animate-in fade-in duration-150">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
          <span className="font-medium text-xs sm:text-sm">{error}</span>
        </div>
      )}

      {/* Purchases List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-14 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Checking for purchases registered to your email...
            </p>
          </div>
        ) : pendingPurchases.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <div className="text-base font-bold text-slate-800 dark:text-slate-100">
                All Purchases Up to Date!
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                There are no unclaimed purchases pending for <strong className="text-slate-700 dark:text-slate-300">{user?.email}</strong>. 
                Any new retail sales recorded with your email are automatically synced into your Digital Warranties vault.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Link
                to="/customer/warranties"
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                View Digital Warranties <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={fetchPending}
                className="px-3.5 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Check Again
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="px-6 py-3 bg-slate-50/70 dark:bg-slate-800/50 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
              <span>Unclaimed Retail Purchases ({pendingPurchases.length})</span>
              <span>1-Click Direct Link</span>
            </div>
            {pendingPurchases.map((p) => {
              const hasWarranty = p.hasWarranty !== false;
              const isClaiming = claimingId === p.id;
              return (
                <div 
                  key={p.id} 
                  className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition"
                >
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                        {p.purchaseReference}
                      </span>
                      {hasWarranty ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          Digital Warranty Included
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                          <Receipt className="w-3 h-3 text-slate-400" />
                          Standard Sale
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {p.productName || 'Retail Item'}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {p.productBrand ? `${p.productBrand} ${p.productModel || ''}` : 'Purchase record'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Date: <strong>{p.purchaseDate}</strong>
                      </span>
                      {p.invoiceNumber && (
                        <span className="flex items-center gap-1">
                          <Receipt className="w-3.5 h-3.5 text-slate-400" />
                          Invoice: <strong>{p.invoiceNumber}</strong>
                        </span>
                      )}
                      {p.serialNumber && (
                        <span className="flex items-center gap-1 font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          S/N: {p.serialNumber}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => handleClaim(p)}
                      disabled={isClaiming || syncing}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs disabled:opacity-50 cursor-pointer"
                    >
                      {isClaiming ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Linking...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          Claim Purchase
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};
