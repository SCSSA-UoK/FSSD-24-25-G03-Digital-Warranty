import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { customerLinkingApi, extractErrorMessage } from '../../api';
import { AltPurchaseItem, FindPurchasesResult, SecondaryEmailRecord } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  Link2,
  Search,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  Sparkles,
  Lock,
  ArrowRight,
  Receipt,
  Calendar,
  Store,
  Trash2,
  PlusCircle,
  ExternalLink,
  ShieldAlert,
  Info
} from 'lucide-react';

export const FindAndLinkPurchases: React.FC = () => {
  const { user } = useAuth();

  // Search & OTP Form State
  const [emailInput, setEmailInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [saveAsSecondary, setSaveAsSecondary] = useState(true);

  // Flow State
  const [step, setStep] = useState<'input' | 'otp' | 'results'>('input');
  const [activeEmail, setActiveEmail] = useState('');
  const [verificationToken, setVerificationToken] = useState<string | null>(null);

  // Results State
  const [searchResult, setSearchResult] = useState<FindPurchasesResult | null>(null);
  const [secondaryEmails, setSecondaryEmails] = useState<SecondaryEmailRecord[]>([]);

  // Loading & Action State
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);
  const [linkingPurchaseId, setLinkingPurchaseId] = useState<string | null>(null);
  const [linkingAll, setLinkingAll] = useState(false);
  const [loadingSecondaryEmails, setLoadingSecondaryEmails] = useState(false);
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);

  // Timers & Counters
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [expiryRemaining, setExpiryRemaining] = useState(0);
  const [otpAttemptsRemaining, setOtpAttemptsRemaining] = useState<number | null>(null);

  // Feedback Messages
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const cooldownIntervalRef = useRef<any>(null);
  const expiryIntervalRef = useRef<any>(null);

  // Fetch secondary emails on initial load
  const loadSecondaryEmails = async () => {
    try {
      setLoadingSecondaryEmails(true);
      const data = await customerLinkingApi.getSecondaryEmails();
      setSecondaryEmails(data || []);
    } catch (err) {
      console.error('Failed to load secondary emails', err);
    } finally {
      setLoadingSecondaryEmails(false);
    }
  };

  useEffect(() => {
    loadSecondaryEmails();
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldownRemaining > 0) {
      cooldownIntervalRef.current = setInterval(() => {
        setCooldownRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(cooldownIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(cooldownIntervalRef.current);
  }, [cooldownRemaining]);

  // OTP expiration countdown timer
  useEffect(() => {
    if (expiryRemaining > 0) {
      expiryIntervalRef.current = setInterval(() => {
        setExpiryRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(expiryIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(expiryIntervalRef.current);
  }, [expiryRemaining]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Step 1: Request OTP
  const handleSendOtp = async (targetEmail?: string) => {
    const emailToUse = (targetEmail || emailInput).trim();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!emailToUse) {
      setErrorMessage('Please enter an alternative email address.');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(emailToUse)) {
      setErrorMessage('Please enter a valid email format (e.g. name@example.com).');
      return;
    }

    if (user?.email && emailToUse.toLowerCase() === user.email.toLowerCase()) {
      setErrorMessage(
        'This is already your primary account email. Purchases recorded under your primary email are automatically linked to your account.'
      );
      return;
    }

    try {
      setSendingOtp(true);
      const res = await customerLinkingApi.sendAltEmailOtp(emailToUse);
      setActiveEmail(emailToUse);
      setStep('otp');
      setOtpInput('');
      setOtpAttemptsRemaining(5);
      setCooldownRemaining(res.cooldownSeconds || 60);
      setExpiryRemaining((res.expiryMinutes || 5) * 60);
      setSuccessMessage(res.message || `A 6-digit verification code was sent to ${emailToUse}.`);
    } catch (err: any) {
      setErrorMessage(extractErrorMessage(err, 'Failed to send verification code. Please try again.'));
    } finally {
      setSendingOtp(false);
    }
  };

  // Step 2: Verify OTP and Find Purchases
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanOtp = otpInput.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    try {
      setVerifyingOtp(true);
      const res = await customerLinkingApi.verifyAltEmailOtp(activeEmail, cleanOtp, saveAsSecondary);
      setVerificationToken(res.verificationToken);
      setSuccessMessage(res.message || 'Email verified successfully!');

      // Reload secondary emails list
      loadSecondaryEmails();

      // Fetch found purchases for this email
      await fetchPurchasesForEmail(activeEmail, res.verificationToken);
      setStep('results');
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Invalid or expired verification code.');
      setErrorMessage(msg);
      // Extract remaining attempts if present in error message
      const match = msg.match(/(\d+)\s+attempt/i);
      if (match) {
        setOtpAttemptsRemaining(parseInt(match[1], 10));
      }
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Fetch purchases for a verified email
  const fetchPurchasesForEmail = async (email: string, token?: string) => {
    try {
      setLoadingResults(true);
      setErrorMessage(null);
      const data = await customerLinkingApi.getFoundPurchases(email, token);
      setSearchResult(data);
    } catch (err: any) {
      setErrorMessage(extractErrorMessage(err, 'Failed to retrieve purchases for this email.'));
    } finally {
      setLoadingResults(false);
    }
  };

  // Direct lookup for already-verified secondary emails (no OTP needed!)
  const handleSelectSavedEmail = async (email: string) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setActiveEmail(email);
    setVerificationToken(null);
    setStep('results');
    await fetchPurchasesForEmail(email);
  };

  // Link single purchase
  const handleLinkPurchase = async (purchase: AltPurchaseItem) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setLinkingPurchaseId(purchase.id);

    try {
      await customerLinkingApi.linkAltPurchase(
        purchase.id,
        activeEmail,
        verificationToken || undefined
      );

      setSuccessMessage(
        `Successfully linked "${purchase.productName || 'Purchase'}" (${purchase.purchaseReference}) to your account!`
      );

      // Refresh results list and secondary email counters
      await fetchPurchasesForEmail(activeEmail, verificationToken || undefined);
      loadSecondaryEmails();
    } catch (err: any) {
      setErrorMessage(extractErrorMessage(err, 'Failed to link purchase. Please try again.'));
    } finally {
      setLinkingPurchaseId(null);
    }
  };

  // Link all eligible purchases
  const handleLinkAll = async () => {
    if (!searchResult || searchResult.availableCount === 0) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    setLinkingAll(true);

    try {
      const count = await customerLinkingApi.linkAllAltPurchases(
        activeEmail,
        verificationToken || undefined
      );

      setSuccessMessage(
        `Successfully linked ${count} purchase(s) and digital warranty certificate(s) to your account!`
      );

      // Refresh results list and secondary email counters
      await fetchPurchasesForEmail(activeEmail, verificationToken || undefined);
      loadSecondaryEmails();
    } catch (err: any) {
      setErrorMessage(extractErrorMessage(err, 'Failed to link purchases.'));
    } finally {
      setLinkingAll(false);
    }
  };

  // Remove secondary email
  const handleRemoveSecondaryEmail = async (email: string) => {
    if (!window.confirm(`Are you sure you want to remove ${email} from your saved secondary emails? Future purchases with this email will no longer be automatically matched.`)) {
      return;
    }

    try {
      setRemovingEmail(email);
      await customerLinkingApi.removeSecondaryEmail(email);
      setSuccessMessage(`Secondary email ${email} has been removed.`);
      await loadSecondaryEmails();
      if (activeEmail.toLowerCase() === email.toLowerCase() && step === 'results') {
        setSearchResult(null);
        setStep('input');
      }
    } catch (err: any) {
      setErrorMessage(extractErrorMessage(err, 'Failed to remove secondary email.'));
    } finally {
      setRemovingEmail(null);
    }
  };

  // Reset to enter a different email
  const handleStartOver = () => {
    setStep('input');
    setEmailInput('');
    setOtpInput('');
    setSearchResult(null);
    setActiveEmail('');
    setVerificationToken(null);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Link2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Find & Link Purchases
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Link in-store or online purchases made with an alternative email address to your WarranTrack wallet with secure OTP verification.
          </p>
        </div>
        <Link
          to="/customer/warranties"
          className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-2xs"
        >
          View My Warranties <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Global Alerts */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-2xl text-sm flex items-start gap-3 shadow-2xs animate-in fade-in duration-150">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
          <span className="font-medium text-xs sm:text-sm leading-relaxed">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-2xl text-sm flex items-start gap-3 shadow-2xs animate-in fade-in duration-150">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
          <span className="font-medium text-xs sm:text-sm leading-relaxed">{errorMessage}</span>
        </div>
      )}

      {/* Primary Account Status Banner */}
      <div className="p-4 bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            Primary Account Email: <strong className="font-mono text-slate-900 dark:text-slate-200">{user?.email}</strong>
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
            Auto-Linked
          </span>
        </div>
        <span className="text-[11px] text-slate-500">
          Purchases with your primary email link automatically without OTP.
        </span>
      </div>

      {/* Section: Saved Secondary Emails */}
      {secondaryEmails.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Verified Secondary Emails ({secondaryEmails.length})
              </h2>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Auto-matching active for future purchases
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {secondaryEmails.map((sec) => {
              const isSelected = activeEmail.toLowerCase() === sec.email.toLowerCase() && step === 'results';
              return (
                <div
                  key={sec.email}
                  className={`p-3.5 rounded-xl border transition flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {sec.email}
                      </span>
                      <span title="Ownership Verified">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                      <span>{sec.linkedPurchasesCount} Linked</span>
                      <span>•</span>
                      <span className={sec.availablePurchasesCount > 0 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}>
                        {sec.availablePurchasesCount} Available
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSelectSavedEmail(sec.email)}
                      disabled={loadingResults}
                      className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      title="View all purchases for this verified email"
                    >
                      <Search className="w-3 h-3" />
                      Find
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveSecondaryEmail(sec.email)}
                      disabled={removingEmail === sec.email}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      title="Remove secondary email"
                    >
                      {removingEmail === sec.email ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Flow: Step 1 & 2 Card */}
      {step !== 'results' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              {step === 'input' ? 'Step 1: Enter Alternative Email' : 'Step 2: Verify One-Time Passcode'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {step === 'input'
                ? 'Enter the email address you gave to the merchant at checkout. We will send a secure 6-digit OTP to verify ownership.'
                : `We sent a 6-digit verification code to ${activeEmail}. Please check your inbox and enter it below.`}
            </p>
          </div>

          {step === 'input' ? (
            /* STEP 1: EMAIL INPUT FORM */
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendOtp();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Alternative Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="e.g. secondary.buyer@gmail.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>A single-use 6-digit OTP will be sent with 5-minute validity.</span>
                </div>

                <button
                  type="submit"
                  disabled={sendingOtp || !emailInput.trim()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-semibold transition flex items-center gap-2 shadow-2xs disabled:opacity-50 cursor-pointer"
                >
                  {sendingOtp ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Sending Code...
                    </>
                  ) : (
                    <>
                      Send Verification Code <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* STEP 2: OTP VERIFICATION FORM */
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-xl flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <Mail className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span className="font-mono font-bold text-indigo-900 dark:text-indigo-200 truncate">
                    {activeEmail}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline text-xs font-semibold shrink-0 cursor-pointer"
                >
                  Change Email
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    6-Digit Verification Code (OTP)
                  </label>
                  <div className="flex items-center gap-3 text-[11px]">
                    {expiryRemaining > 0 ? (
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-mono font-semibold">
                        <Clock className="w-3 h-3" />
                        Expires in {formatTimer(expiryRemaining)}
                      </span>
                    ) : (
                      <span className="text-rose-600 dark:text-rose-400 font-semibold">
                        Code Expired
                      </span>
                    )}
                    {otpAttemptsRemaining !== null && otpAttemptsRemaining < 5 && (
                      <span className="text-slate-500 dark:text-slate-400">
                        ({otpAttemptsRemaining} attempts left)
                      </span>
                    )}
                  </div>
                </div>

                <input
                  type="text"
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  required
                  autoFocus
                  className="w-full text-center tracking-[0.5em] font-mono text-xl py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>

              {/* Save as Secondary Email Option */}
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveAsSecondary}
                  onChange={(e) => setSaveAsSecondary(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 dark:bg-slate-700"
                />
                <div className="text-xs space-y-0.5">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                    Save this email for automatic future purchase matching
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px] leading-relaxed">
                    Any new purchases recorded by retailers with this email address will be automatically linked to your WarranTrack wallet without requiring OTP verification again.
                  </span>
                </div>
              </label>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleSendOtp(activeEmail)}
                  disabled={cooldownRemaining > 0 || sendingOtp}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 self-start cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${sendingOtp ? 'animate-spin' : ''}`} />
                  {cooldownRemaining > 0
                    ? `Resend Code in ${cooldownRemaining}s`
                    : 'Resend Verification Code'}
                </button>

                <div className="flex items-center gap-2 self-end">
                  <button
                    type="button"
                    onClick={() => setStep('input')}
                    className="px-3.5 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={verifyingOtp || otpInput.trim().length !== 6 || expiryRemaining <= 0}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-semibold transition flex items-center gap-2 shadow-2xs disabled:opacity-50 cursor-pointer"
                  >
                    {verifyingOtp ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verify & Find Purchases
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}

      {/* STEP 3: RESULTS SECTION */}
      {step === 'results' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Results Header Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-500 dark:text-slate-400">Purchases found for:</span>
                <span className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                  {activeEmail}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Verified
                </span>
                {searchResult?.isSavedSecondary && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                    Saved Secondary Email
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Original retailer sales records are securely preserved without alteration.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => fetchPurchasesForEmail(activeEmail, verificationToken || undefined)}
                disabled={loadingResults}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Refresh results"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingResults ? 'animate-spin' : ''}`} />
                Refresh
              </button>

              <button
                type="button"
                onClick={handleStartOver}
                className="px-3.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/60 dark:hover:text-indigo-200 transition cursor-pointer"
              >
                Search Another Email
              </button>
            </div>
          </div>

          {/* Metric Cards */}
          {searchResult && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Found</span>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                  {searchResult.totalCount}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Purchases registered</div>
              </div>

              <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 shadow-xs">
                <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  Available to Link
                </span>
                <div className="text-2xl font-black text-emerald-900 dark:text-emerald-100 mt-1">
                  {searchResult.availableCount}
                </div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">Ready to claim</div>
              </div>

              <div className="bg-indigo-50/60 dark:bg-indigo-950/30 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800/60 shadow-xs">
                <span className="text-[10px] font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                  Already Linked
                </span>
                <div className="text-2xl font-black text-indigo-900 dark:text-indigo-100 mt-1">
                  {searchResult.alreadyLinkedCount}
                </div>
                <div className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-0.5">In your account</div>
              </div>

              <div className="bg-slate-100/60 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-500" />
                  Other Accounts
                </span>
                <div className="text-2xl font-black text-slate-700 dark:text-slate-300 mt-1">
                  {searchResult.linkedToOtherCount}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Protected ownership</div>
              </div>
            </div>
          )}

          {/* Batch Action Bar */}
          {searchResult && searchResult.availableCount > 1 && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-600 text-white rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-900 dark:text-emerald-100">
                    {searchResult.availableCount} purchases available to link!
                  </div>
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-300">
                    You can link all eligible purchases and warranties to your wallet in one click.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLinkAll}
                disabled={linkingAll}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-2xs cursor-pointer disabled:opacity-50 shrink-0 self-start sm:self-auto"
              >
                {linkingAll ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Linking All...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Link All Available ({searchResult.availableCount})
                  </>
                )}
              </button>
            </div>
          )}

          {/* Purchases List */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
            {loadingResults ? (
              <div className="p-14 text-center space-y-3">
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Loading purchases registered to {activeEmail}...
                </p>
              </div>
            ) : !searchResult || searchResult.purchases.length === 0 ? (
              <div className="p-12 text-center space-y-4">
                <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
                  <Search className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <div className="text-base font-bold text-slate-800 dark:text-slate-100">
                    No Purchases Found
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                    We could not find any purchases registered to <strong className="text-slate-700 dark:text-slate-300 font-mono">{activeEmail}</strong>.
                    If you recently bought an item, please make sure the store entered this exact email at checkout.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleStartOver}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Try a Different Email
                  </button>
                </div>
              </div>
            ) : (
              searchResult.purchases.map((purchase) => {
                const isAvailable = purchase.linkingStatus === 'AVAILABLE_TO_LINK';
                const isAlreadyLinked = purchase.linkingStatus === 'ALREADY_LINKED';
                const isLinkedToOther = purchase.linkingStatus === 'LINKED_TO_OTHER';
                const isLinking = linkingPurchaseId === purchase.id;

                return (
                  <div
                    key={purchase.id}
                    className={`p-5 sm:p-6 transition flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 ${
                      isAvailable
                        ? 'hover:bg-slate-50/80 dark:hover:bg-slate-800/70'
                        : isAlreadyLinked
                        ? 'bg-slate-50/30 dark:bg-slate-800/20 hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                        : 'bg-slate-50/60 dark:bg-slate-800/30 opacity-80 hover:opacity-100 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="space-y-3 min-w-0 flex-1">
                      {/* Top Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {purchase.purchaseReference}
                        </span>

                        {/* STATUS BADGE */}
                        {isAvailable && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            {purchase.statusLabel}
                          </span>
                        )}

                        {isAlreadyLinked && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
                            <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                            {purchase.statusLabel}
                          </span>
                        )}

                        {isLinkedToOther && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            <Lock className="w-3 h-3 text-amber-600" />
                            {purchase.statusLabel}
                          </span>
                        )}

                        {purchase.hasWarranty ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            Warranty Certificate Attached
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                            <Receipt className="w-3 h-3 text-slate-400" />
                            Standard Sale
                          </span>
                        )}
                      </div>

                      {/* Product & Store Details */}
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                          {purchase.productName || 'Retail Product'}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {purchase.productBrand ? `${purchase.productBrand} ${purchase.productModel || ''}` : 'Item Record'}
                          {purchase.unitPrice !== undefined && purchase.unitPrice > 0 && (
                            <span className="font-semibold text-slate-700 dark:text-slate-300 ml-2">
                              • ${purchase.unitPrice.toFixed(2)}
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Metadata Row */}
                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                        {purchase.retailerBusinessName && (
                          <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                            <Store className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            {purchase.retailerBusinessName}
                          </span>
                        )}

                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          Purchased: <strong>{purchase.purchaseDate}</strong>
                        </span>

                        {purchase.invoiceNumber && (
                          <span className="flex items-center gap-1 font-mono">
                            <Receipt className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            Invoice: <strong>{purchase.invoiceNumber}</strong>
                          </span>
                        )}

                        {purchase.serialNumber && (
                          <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">
                            S/N: {purchase.serialNumber}
                          </span>
                        )}
                      </div>

                      {/* Warranty Summary Box if attached */}
                      {purchase.warranty && (
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-[11px] flex items-center justify-between gap-3 text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>
                              Warranty Coverage: <strong>{purchase.warranty.duration} {purchase.warranty.unit || 'MONTHS'}</strong>
                              {purchase.warranty.expiryDate && (
                                <> (Valid until <strong>{purchase.warranty.expiryDate}</strong>)</>
                              )}
                            </span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            purchase.warranty.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                          }`}>
                            {purchase.warranty.status}
                          </span>
                        </div>
                      )}

                      {/* Informational description note */}
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        {purchase.statusDescription}
                      </p>
                    </div>

                    {/* Action Column */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-2.5 shrink-0 pt-2 lg:pt-0">
                      {isAvailable && (
                        <button
                          type="button"
                          onClick={() => handleLinkPurchase(purchase)}
                          disabled={isLinking || linkingAll}
                          className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50 cursor-pointer"
                        >
                          {isLinking ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              Linking to Account...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              Link to My Account
                            </>
                          )}
                        </button>
                      )}

                      {isAlreadyLinked && (
                        <Link
                          to="/customer/warranties"
                          className="w-full sm:w-auto px-3.5 py-2 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/80 dark:hover:text-indigo-200 transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          View in Wallet <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}

                      {isLinkedToOther && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 font-medium px-3 py-2 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-800">
                          <Lock className="w-3.5 h-3.5" />
                          Claim Unavailable
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
