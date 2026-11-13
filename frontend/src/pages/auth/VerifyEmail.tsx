import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api';
import { CheckCircle2, Mail, AlertCircle, RefreshCw } from 'lucide-react';

export const VerifyEmail: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const emailFromState = (location.state as any)?.email;
  const devOtpFromState = (location.state as any)?.devOtp;
  const email = emailFromState || user?.email || '';

  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(devOtpFromState || null);
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
      await refreshUser();
      setMessage('Email verified successfully! Redirecting...');
      setTimeout(() => {
        navigate(user?.role === 'CUSTOMER' ? '/customer' : '/');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired OTP. Please try again.');
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
      const code = res?.data?.data || res?.data;
      if (typeof code === 'string' && /^\d{6}$/.test(code)) {
        setDevOtp(code);
      }
      setMessage(res?.data?.message || 'A fresh 6-digit OTP has been generated.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not resend OTP. Please wait before retrying.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
      <div className="bg-indigo-100 text-indigo-700 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
        <Mail className="w-6 h-6" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900">Verify Your Email</h2>
      <p className="text-sm text-slate-500 mt-1 mb-6">
        Enter the 6-digit verification code sent to <br />
        <span className="font-semibold text-slate-800">{email || 'your email'}</span>
      </p>

      {message && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {devOtp && (
        <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl text-left">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Prototype / Demo OTP
            </span>
            <button
              type="button"
              onClick={() => setOtp(devOtp)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
            >
              Auto-fill Code
            </button>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xs text-slate-600">Verification Code:</span>
            <span className="font-mono text-2xl font-bold tracking-widest text-slate-900 bg-white px-3 py-0.5 rounded border border-amber-200">
              {devOtp}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Real SMTP is not configured. Use this code or check your backend terminal console.
          </p>
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
            className="w-full text-center text-3xl font-mono tracking-widest px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="000000"
          />
          <span className="text-[11px] text-slate-400 mt-1 block">
            Codes are time-limited (5 minutes) and single-use.
          </span>
        </div>

        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="w-full py-2.5 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            'Verify Email'
          )}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-1 text-xs text-slate-500">
        <span>Didn't receive the code?</span>
        <button
          onClick={handleResend}
          disabled={resending}
          className="text-indigo-600 font-semibold hover:underline flex items-center gap-1"
        >
          {resending && <RefreshCw className="w-3 h-3 animate-spin" />} Resend OTP
        </button>
      </div>
    </div>
  );
};

