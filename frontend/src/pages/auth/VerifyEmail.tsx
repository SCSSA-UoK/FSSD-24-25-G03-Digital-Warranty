import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api';
import { CheckCircle2, Mail, AlertCircle, RefreshCw } from 'lucide-react';
import { extractErrorMessage } from '../../utils/error';

export const VerifyEmail: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const emailFromState = (location.state as any)?.email;
  const email = emailFromState || user?.email || '';

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      await authApi.verifyEmail(email, otp);
      setMessage('Email verified successfully! Redirecting...');
      setTimeout(() => {
        navigate('/login', { state: { email, message: 'Email verified successfully. Please sign in.' } });
      }, 1500);
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Invalid or expired OTP. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setError(null);
    setResending(true);
    try {
      const res: any = await authApi.resendOtp(email);
      setMessage(res?.data?.message || 'A fresh verification OTP has been sent to your email.');
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Could not resend OTP. Please wait before retrying.'));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center transition-colors">
      <div className="bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
        <Mail className="w-6 h-6" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Verify Your Email</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">
        Enter the 6-digit verification code sent to <br />
        <span className="font-semibold text-slate-800 dark:text-slate-200">{email || 'your email'}</span>
      </p>

      {message && (
        <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-rose-950/40 border border-red-200 dark:border-rose-800/60 text-red-700 dark:text-rose-300 rounded-lg text-sm flex items-start gap-2 text-left">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-rose-400 mt-0.5" />
          <span className="break-words">{error}</span>
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-4">
        <div>
          <input
            type="text"
            required
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            className="w-full text-center text-3xl font-mono tracking-widest px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="000000"
          />
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            Codes are time-limited (5 minutes) and single-use.
          </span>
        </div>

        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="w-full py-2.5 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            'Verify Email'
          )}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-1 text-xs text-slate-500 dark:text-slate-400">
        <span>Didn't receive the code?</span>
        <button
          onClick={handleResend}
          disabled={resending}
          className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
        >
          {resending && <RefreshCw className="w-3 h-3 animate-spin" />} Resend OTP
        </button>
      </div>
    </div>
  );
};

