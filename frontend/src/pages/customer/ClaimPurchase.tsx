import React, { useEffect, useState } from 'react';
import { customerLinkingApi } from '../../api';
import { Purchase } from '../../types';
import { Link2, ShieldAlert, CheckCircle2, AlertCircle, RefreshCw, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ClaimPurchase: React.FC = () => {
  const [pendingPurchases, setPendingPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchPending = async () => {
    try {
      setLoading(true);
      const data = await customerLinkingApi.getPendingPurchases();
      setPendingPurchases(data);
    } catch (err) {
      console.error('Failed to load pending purchases', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleRequestOtp = async (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setError(null);
    setMessage(null);
    setSubmitting(true);
    try {
      const res: any = await customerLinkingApi.requestLinkingOtp(purchase.id);
      setOtpSent(true);
      const code = res?.data?.data || res?.data;
      if (typeof code === 'string' && /^\d{6}$/.test(code)) {
        setOtp(code);
      }
      setMessage(res?.data?.message || 'A 6-digit verification code has been dispatched.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error requesting OTP.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyAndLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPurchase) return;
    setError(null);
    setMessage(null);
    setSubmitting(true);
    try {
      await customerLinkingApi.verifyAndLink(selectedPurchase.id, otp);
      setMessage('Success! Purchase and digital warranty linked to your account.');
      setTimeout(() => {
        navigate('/customer/warranties');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Claim Unlinked Purchases</h1>
        <p className="text-sm text-slate-500">
          When a retailer registers a sale with your email, verify email ownership using a one-time OTP to link the digital warranty card to your account.
        </p>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Checking for purchases matching your email...</div>
        ) : pendingPurchases.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
            <div className="font-bold text-slate-800">All caught up!</div>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              There are no unclaimed purchases matching your email address at this time.
            </p>
          </div>
        ) : (
          pendingPurchases.map((p) => (
            <div key={p.id} className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-slate-900">
                    Ref: {p.purchaseReference}
                  </span>
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    AWAITING VERIFICATION
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  Recorded Purchase Date: <strong>{p.purchaseDate}</strong>
                </div>
                <div className="text-[11px] text-slate-400">
                  Product details and invoice number remain protected until email ownership is verified.
                </div>
              </div>

              <button
                onClick={() => handleRequestOtp(p)}
                disabled={submitting}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-xs"
              >
                <KeyRound className="w-4 h-4" /> Verify & Link
              </button>
            </div>
          ))
        )}
      </div>

      {/* OTP Modal */}
      {selectedPurchase && otpSent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 text-center space-y-4">
            <div className="bg-indigo-100 text-indigo-700 w-12 h-12 rounded-xl flex items-center justify-center mx-auto">
              <KeyRound className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Enter Purchase OTP</h3>
            <p className="text-xs text-slate-500">
              Enter the 6-digit code sent to your email to prove ownership of purchase reference{' '}
              <strong className="font-mono text-slate-800">{selectedPurchase.purchaseReference}</strong>.
            </p>

            <form onSubmit={handleVerifyAndLink} className="space-y-4">
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full text-center text-3xl font-mono tracking-widest px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[10px] text-slate-400 block">
                Single-use code expires in 5 minutes.
              </span>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPurchase(null);
                    setOtpSent(false);
                    setOtp('');
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || otp.length !== 6}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {submitting ? 'Verifying...' : 'Link Purchase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

