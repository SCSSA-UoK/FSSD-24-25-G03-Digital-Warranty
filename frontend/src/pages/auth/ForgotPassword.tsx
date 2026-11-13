import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api';
import { KeyRound, CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck, Sparkles, Eye, EyeOff } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState<'REQUEST' | 'RESET'>('REQUEST');
  const [loading, setLoading] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const res = await authApi.forgotPassword(email.trim());
      if (res.data) {
        setDevToken(res.data);
        setToken(res.data);
        setMessage('Reset token generated! Auto-filled below for demonstration.');
      } else {
        setMessage('If an account exists, a password reset token has been sent to your email.');
      }
      setStep('RESET');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error requesting password reset.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);

    try {
      await authApi.resetPassword(token.trim(), newPassword);
      setMessage('Password successfully reset! Redirecting to sign in...');
      setTimeout(() => {
        navigate('/login', { state: { message: 'Password reset successful. Please sign in.' } });
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired password reset token.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
      <div className="bg-indigo-100 text-indigo-700 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
        <KeyRound className="w-6 h-6" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900">Reset Password</h2>
      <p className="text-sm text-slate-500 mt-1 mb-6">
        {step === 'REQUEST'
          ? 'Enter your account email to receive a password reset token'
          : 'Enter your reset token and your new password'}
      </p>

      {/* Dev / Prototype Reset Token Helper */}
      {devToken && step === 'RESET' && (
        <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-left space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Prototype / Demo Reset Token</span>
          </div>
          <p className="text-[11px] text-amber-700">
            SMTP not configured — code generated for testing:
          </p>
          <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-amber-200">
            <code className="text-xs font-mono font-bold text-slate-900 break-all">{devToken}</code>
            <button
              type="button"
              onClick={() => setToken(devToken)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 ml-2 shrink-0 underline"
            >
              Auto-fill
            </button>
          </div>
        </div>
      )}

      {message && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm flex items-center gap-2 text-left">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2 text-left">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {step === 'REQUEST' ? (
        <form onSubmit={handleRequest} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              placeholder="you@example.com"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full py-2.5 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
          >
            {loading ? 'Sending Request...' : 'Generate Reset Token'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleReset} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Reset Token</label>
            <input
              type="text"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
              placeholder="Paste your reset token"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">New Password (Min 6 chars)</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-3.5 pr-10 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none transition p-0.5"
                title={showNewPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-3.5 pr-10 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none transition p-0.5"
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setStep('REQUEST');
                setError(null);
                setMessage(null);
              }}
              className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button
              type="submit"
              disabled={loading || !token.trim() || !newPassword}
              className="flex-1 py-2.5 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500">
        <Link to="/login" className="text-indigo-600 font-semibold hover:underline">
          Return to Sign In
        </Link>
      </div>
    </div>
  );
};
