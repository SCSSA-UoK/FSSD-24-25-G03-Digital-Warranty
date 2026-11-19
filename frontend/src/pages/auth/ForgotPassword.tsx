import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api';
import {
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  Mail,
  Clock,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { extractErrorMessage } from '../../utils/error';

type ResetStep = 'REQUEST' | 'VERIFY_OTP' | 'SET_PASSWORD' | 'SUCCESS';

export const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState<ResetStep>('REQUEST');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Timer states
  const [expiresIn, setExpiresIn] = useState<number>(300); // 5 minutes (300 seconds)
  const [resendCooldown, setResendCooldown] = useState<number>(60); // 60s cooldown

  // Expiration countdown for OTP (5 minutes)
  useEffect(() => {
    if (step !== 'VERIFY_OTP') return;
    if (expiresIn <= 0) return;

    const timer = setInterval(() => {
      setExpiresIn((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [step, expiresIn]);

  // Resend cooldown countdown (60s)
  useEffect(() => {
    if (step !== 'VERIFY_OTP') return;
    if (resendCooldown <= 0) return;

    const cooldownTimer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(cooldownTimer);
  }, [step, resendCooldown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Step 1: Request 6-digit OTP to Primary Email
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your primary account email address.');
      return;
    }

    setLoading(true);

    try {
      const res = await authApi.forgotPassword(trimmedEmail);
      setMessage(
        res.message ||
          `A 6-digit password reset verification code has been sent to your primary registered email address: ${trimmedEmail}.`
      );
      setStep('VERIFY_OTP');
      setExpiresIn(300);
      setResendCooldown(60);
      setOtp('');
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to request password reset code.'));
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resending) return;

    setError(null);
    setMessage(null);
    setResending(true);

    try {
      const res = await authApi.forgotPassword(email.trim());
      setMessage(
        res.message ||
          `A new 6-digit verification code has been sent to your primary registered email: ${email.trim()}.`
      );
      setExpiresIn(300);
      setResendCooldown(60);
      setOtp('');
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to resend code. Please try again.'));
    } finally {
      setResending(false);
    }
  };

  // Step 2: Verify 6-digit OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const cleanOtp = otp.trim();
    if (!/^\d{6}$/.test(cleanOtp)) {
      setError('Please enter a valid 6-digit numeric verification code.');
      return;
    }

    if (expiresIn <= 0) {
      setError('This verification code has expired. Please request a new code.');
      return;
    }

    setLoading(true);

    try {
      const res = await authApi.verifyResetOtp(email.trim(), cleanOtp);
      const token = res.data?.resetToken;
      if (!token) {
        throw new Error('Reset authorization token missing from response.');
      }
      setResetToken(token);
      setMessage('Code verified successfully! You may now set your new password.');
      setStep('SET_PASSWORD');
    } catch (err: any) {
      setError(
        extractErrorMessage(
          err,
          'Invalid or expired verification code. Please check and try again.'
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password (only allowed after OTP verification)
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    if (!resetToken) {
      setError('Missing OTP verification session. Please verify your OTP code again.');
      setStep('VERIFY_OTP');
      return;
    }

    setLoading(true);

    try {
      await authApi.resetPassword(resetToken, newPassword);
      setStep('SUCCESS');
      setMessage('Password successfully reset! Redirecting to sign in...');
      setTimeout(() => {
        navigate('/login', {
          state: { message: 'Password reset successful. Please sign in with your new password.' },
        });
      }, 2500);
    } catch (err: any) {
      setError(
        extractErrorMessage(
          err,
          'Password reset session has expired or is invalid. Please request a new verification code.'
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto my-6 sm:my-12 bg-white dark:bg-slate-900 p-5 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center transition-colors">
      {/* Icon */}
      <div className="bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
        {step === 'SUCCESS' ? (
          <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        ) : step === 'SET_PASSWORD' ? (
          <Lock className="w-6 h-6" />
        ) : (
          <KeyRound className="w-6 h-6" />
        )}
      </div>

      {/* Header */}
      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
        {step === 'REQUEST' && 'Reset Password'}
        {step === 'VERIFY_OTP' && 'Verify Reset Code'}
        {step === 'SET_PASSWORD' && 'Create New Password'}
        {step === 'SUCCESS' && 'Password Reset Complete'}
      </h2>

      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-5">
        {step === 'REQUEST' &&
          'Enter your primary registered account email address to receive a secure 6-digit verification code.'}
        {step === 'VERIFY_OTP' && (
          <span>
            Enter the 6-digit code sent to your primary email:{' '}
            <strong className="text-slate-900 dark:text-slate-100 font-medium">{email}</strong>
          </span>
        )}
        {step === 'SET_PASSWORD' &&
          'Verification confirmed. Choose a strong new password for your account.'}
        {step === 'SUCCESS' &&
          'Your password has been securely updated. You can now log in with your new password.'}
      </p>

      {/* Step Progress Pills */}
      {step !== 'SUCCESS' && (
        <div className="flex items-center justify-center gap-2 mb-6">
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition ${
              step === 'REQUEST'
                ? 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
            }`}
          >
            <span>1</span>
            <span>Email</span>
          </div>
          <div className="w-3 h-0.5 bg-slate-200 dark:bg-slate-700"></div>
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition ${
              step === 'VERIFY_OTP'
                ? 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                : step === 'SET_PASSWORD'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <span>2</span>
            <span>Verify OTP</span>
          </div>
          <div className="w-3 h-0.5 bg-slate-200 dark:bg-slate-700"></div>
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition ${
              step === 'SET_PASSWORD'
                ? 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <span>3</span>
            <span>Password</span>
          </div>
        </div>
      )}

      {/* Success Message Banner */}
      {message && (
        <div className="mb-4 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs sm:text-sm flex items-start gap-2.5 text-left animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
          <span className="break-words leading-relaxed">{message}</span>
        </div>
      )}

      {/* Error Message Banner */}
      {error && (
        <div className="mb-4 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 rounded-xl text-xs sm:text-sm flex items-start gap-2.5 text-left animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
          <span className="break-words leading-relaxed">{error}</span>
        </div>
      )}

      {/* STEP 1: Request OTP */}
      {step === 'REQUEST' && (
        <form onSubmit={handleRequestOtp} className="space-y-4 text-left">
          {/* Security Notice: Primary Email Only */}
          <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Primary Email Required:</strong> Password reset verification codes are sent{' '}
              <strong>only to your primary registered account email address</strong>. Secondary,
              alternative, or purchase-linked emails cannot receive reset codes.
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
              Primary Registered Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="primary@example.com"
                autoFocus
              />
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400 dark:text-slate-500" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium rounded-xl transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Sending Verification Code...</span>
              </div>
            ) : (
              <>
                <Mail className="w-4 h-4" /> Send 6-Digit Reset Code
              </>
            )}
          </button>
        </form>
      )}

      {/* STEP 2: Verify 6-digit OTP */}
      {step === 'VERIFY_OTP' && (
        <form onSubmit={handleVerifyOtp} className="space-y-4 text-left">
          {/* Target Email Info Box */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Primary Email:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 truncate block">
                {email}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setStep('REQUEST');
                setError(null);
                setMessage(null);
              }}
              className="px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-lg transition shrink-0 cursor-pointer"
            >
              Change Email
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
              6-Digit Verification Code
            </label>
            <input
              type="text"
              required
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full px-3.5 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-2xl font-mono font-bold tracking-[0.35em] text-center"
              placeholder="••••••"
              autoFocus
            />
          </div>

          {/* Timers & Resend Controls */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span>
                Expires in:{' '}
                <strong
                  className={`font-mono font-semibold ${
                    expiresIn < 60
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {formatTime(expiresIn)}
                </strong>
              </span>
            </div>

            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendCooldown > 0 || resending}
              className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 disabled:text-slate-400 dark:disabled:text-slate-600 transition cursor-pointer disabled:cursor-not-allowed"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
              <span>
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
              </span>
            </button>
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                setStep('REQUEST');
                setError(null);
                setMessage(null);
              }}
              className="px-4 py-2.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button
              type="submit"
              disabled={loading || otp.trim().length !== 6 || expiresIn <= 0}
              className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium rounded-xl transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Verifying Code...</span>
                </div>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Verify Code
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* STEP 3: Set New Password */}
      {step === 'SET_PASSWORD' && (
        <form onSubmit={handleResetPassword} className="space-y-4 text-left">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>OTP verified for primary account <strong>{email}</strong>. Please enter your new password.</span>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
              New Password (Min 6 chars)
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="••••••••"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none transition p-0.5 cursor-pointer"
                title={showNewPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none transition p-0.5 cursor-pointer"
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                setStep('VERIFY_OTP');
                setError(null);
                setMessage(null);
              }}
              className="px-4 py-2.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button
              type="submit"
              disabled={loading || !newPassword || newPassword.length < 6 || !confirmPassword}
              className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium rounded-xl transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Updating Password...</span>
                </div>
              ) : (
                <>
                  <Lock className="w-4 h-4" /> Reset Password
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* STEP 4: Success */}
      {step === 'SUCCESS' && (
        <div className="space-y-4 pt-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            You will be redirected to the sign-in page shortly.
          </p>
          <Link
            to="/login"
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 shadow-xs cursor-pointer block text-sm"
          >
            Sign In With New Password
          </Link>
        </div>
      )}

      {/* Footer Link */}
      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
        <Link
          to="/login"
          className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3 h-3" /> Return to Sign In
        </Link>
      </div>
    </div>
  );
};
