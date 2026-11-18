import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api';
import { ShieldCheck, LogIn, AlertCircle, Eye, EyeOff, RotateCcw, PauseCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { extractErrorMessage } from '../../utils/error';

export const Login: React.FC = () => {
  const { login, setAuthSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInactive, setIsInactive] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [reactivateSuccess, setReactivateSuccess] = useState<string | null>(null);

  const wasDeactivated = new URLSearchParams(location.search).get('deactivated') === 'true';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsInactive(false);
    setLoading(true);

    try {
      const user = await login({ email, password });
      const from = (location.state as any)?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else if (user.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else if (user.role === 'RETAILER') {
        navigate('/retailer', { replace: true });
      } else {
        navigate('/customer', { replace: true });
      }
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Invalid email or password.');
      if (msg.includes('ACCOUNT_INACTIVE') || msg.toLowerCase().includes('inactive')) {
        setIsInactive(true);
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReactivate = async () => {
    try {
      setReactivating(true);
      setError(null);
      const res = await authApi.reactivateAccount({ email, password });
      const user = setAuthSession(res.data);
      setReactivateSuccess('Account reactivated successfully! Redirecting to your dashboard...');
      setTimeout(() => {
        if (user.role === 'ADMIN') {
          navigate('/admin', { replace: true });
        } else if (user.role === 'RETAILER') {
          navigate('/retailer', { replace: true });
        } else {
          navigate('/customer', { replace: true });
        }
      }, 900);
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to reactivate account. Please verify credentials.'));
      setReactivating(false);
    }
  };

  const isSuspended = error?.toLowerCase().includes('suspended');

  return (
    <div className="max-w-md mx-auto my-12 bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
      <div className="text-center space-y-2 mb-6">
        <div className="bg-indigo-600 text-white w-12 h-12 rounded-xl flex items-center justify-center mx-auto shadow-md">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Sign in to WarranTrack</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Access your warranties, products, and claims</p>
      </div>

      {wasDeactivated && (
        <div className="mb-4 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 rounded-xl text-xs flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <span>
            Your account was successfully deactivated. All your warranty cards and claim records remain safely preserved. You can sign in and reactivate anytime.
          </span>
        </div>
      )}

      {reactivateSuccess && (
        <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{reactivateSuccess}</span>
        </div>
      )}

      {error && !isInactive && (
        <div className={`mb-4 p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${isSuspended
          ? 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300'
          : 'bg-red-50 dark:bg-rose-950/40 border border-red-200 dark:border-rose-800/60 text-red-700 dark:text-rose-300'
          }`}>
          {isSuspended ? (
            <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-rose-400 shrink-0 mt-0.5" />
          )}
          <span className="break-words font-medium">{error}</span>
        </div>
      )}

      {/* Inactive Account Reactivation Offer */}
      {isInactive && (
        <div className="mb-5 p-4 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl space-y-3">
          <div className="flex items-start gap-2.5">
            <PauseCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-950 dark:text-amber-200">Your Account is Currently Inactive</h4>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
                Your account was previously deactivated, but all your registered warranty cards and claim histories are 100% safely preserved in our system.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleReactivate}
            disabled={reactivating}
            className="w-full py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {reactivating ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <RotateCcw className="w-3.5 h-3.5" />
            )}
            Reactivate My Account & Sign In
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">Password</label>
            <Link to="/forgot-password" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-3.5 pr-10 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none transition p-0.5"
              title={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              <LogIn className="w-4 h-4" /> Sign In
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center space-y-2 text-xs text-slate-600 dark:text-slate-400">
        <div>
          Don't have an account yet?{' '}
          <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
            Register as Customer
          </Link>
        </div>
        <div>
          Are you a retail merchant?{' '}
          <Link to="/register-retailer" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
            Register Retailer Account
          </Link>
        </div>
      </div>
    </div>
  );
};
