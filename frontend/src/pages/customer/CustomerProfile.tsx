import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authApi, warrantyApi, claimApi } from '../../api';
import { ThemeSettingsCard } from '../../components/ThemeToggle';
import { 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  KeyRound, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Save, 
  Clock, 
  ShieldAlert, 
  FileText,
  UserCheck,
  Eye,
  EyeOff,
  PauseCircle,
  RotateCcw
} from 'lucide-react';

export const CustomerProfile: React.FC = () => {
  const { user, refreshUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Deactivate Account State
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState('');
  const [deactivating, setDeactivating] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  // Edit Profile Form State
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password Change Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Quick stats
  const [warrantyCount, setWarrantyCount] = useState<number | null>(null);
  const [claimsCount, setClaimsCount] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [wRes, cRes] = await Promise.allSettled([
          warrantyApi.getCustomerWarranties(0, 1),
          claimApi.getCustomerClaims(0, 1),
        ]);
        if (wRes.status === 'fulfilled') {
          setWarrantyCount(wRes.value.totalElements);
        }
        if (cRes.status === 'fulfilled') {
          setClaimsCount(cRes.value.totalElements);
        }
      } catch (err) {
        console.error('Failed to load profile stats', err);
      }
    };
    fetchStats();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    if (!name.trim()) {
      setProfileError('Name cannot be empty.');
      return;
    }

    try {
      setProfileSaving(true);
      await authApi.updateProfile({ name: name.trim(), phone: phone.trim() });
      await refreshUser();
      setProfileSuccess('Profile updated successfully.');
      setTimeout(() => setProfileSuccess(null), 4000);
    } catch (err: any) {
      setProfileError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    try {
      setPasswordSaving(true);
      await authApi.changePassword({ currentPassword, newPassword });
      setPasswordSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(null), 4000);
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleDeactivateAccount = async () => {
    try {
      setDeactivating(true);
      setDeactivateError(null);
      await authApi.deactivateAccount(deactivateReason.trim() || undefined);
      logout();
      window.location.href = '/login?deactivated=true';
    } catch (err: any) {
      setDeactivateError(err.response?.data?.message || 'Failed to deactivate account.');
      setDeactivating(false);
    }
  };

  const getInitials = (fullName?: string) => {
    if (!fullName) return 'U';
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  return (
    <div className="max-w-4xl xl:max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Customer Profile & Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your personal details, verified contact information, and account security
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 px-6 py-8 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-xl font-bold text-white shadow-inner">
                {getInitials(user?.name)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-white">{user?.name}</h2>
                  <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                    <UserCheck className="w-3 h-3" /> Verified Customer
                  </span>
                  {user?.accountStatus === 'SUSPENDED' ? (
                    <span className="inline-flex items-center gap-1 bg-rose-500/20 text-rose-300 border border-rose-400/30 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                      <ShieldAlert className="w-3 h-3" /> Suspended
                    </span>
                  ) : user?.accountStatus === 'INACTIVE' || user?.accountStatus === 'DEACTIVATED' ? (
                    <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                      <PauseCircle className="w-3 h-3" /> Inactive
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active Account
                    </span>
                  )}
                </div>
                <div className="text-indigo-200 text-xs mt-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-300" />
                  <span>{user?.email}</span>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-3 self-start sm:self-center">
              <div className="bg-white/10 backdrop-blur-md border border-white/15 px-4 py-2 rounded-xl text-center">
                <div className="text-lg font-bold text-white leading-none">
                  {warrantyCount !== null ? warrantyCount : '—'}
                </div>
                <div className="text-[10px] text-indigo-200 font-medium uppercase tracking-wider mt-1">
                  Warranties
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/15 px-4 py-2 rounded-xl text-center">
                <div className="text-lg font-bold text-white leading-none">
                  {claimsCount !== null ? claimsCount : '—'}
                </div>
                <div className="text-[10px] text-indigo-200 font-medium uppercase tracking-wider mt-1">
                  Claims
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Status Banner */}
        <div className="px-6 py-3 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Email Verified
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-slate-500 dark:text-slate-400">Account Access: <strong className="text-slate-800 dark:text-slate-200 font-semibold">{user?.accountStatus || 'ACTIVE'}</strong></span>
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
            Account ID: {user?.id}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Details Section */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Personal Information</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Update your name and primary contact details</p>
            </div>
          </div>

          {profileSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full pl-9 pr-24 py-2 border border-slate-200 dark:border-slate-700/60 rounded-lg text-sm bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <span className="absolute right-2.5 top-2 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  Verified
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Your email is linked to your digital warranty claims and cannot be changed.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  placeholder="+1 (555) 000-0000"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Used for SMS updates on warranty claim servicing.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={profileSaving}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {profileSaving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Security & Password Section */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Security & Password</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Update your account login password</p>
            </div>
          </div>

          {passwordSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full pl-9 pr-10 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  placeholder="••••••••"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none transition p-0.5"
                  title={showCurrentPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-9 pr-10 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  placeholder="At least 6 characters"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none transition p-0.5"
                  title={showNewPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-9 pr-10 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  placeholder="Re-type new password"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none transition p-0.5"
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={passwordSaving}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 active:bg-slate-950 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {passwordSaving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Theme Switching Preferences Card */}
      <ThemeSettingsCard />

      {/* Account Access & Deactivation Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 shrink-0">
              <PauseCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Account Access & Deactivation</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl">
                Need to pause your account? You can deactivate your account access anytime. All ({warrantyCount ?? 0}) warranty records and ({claimsCount ?? 0}) claim histories are permanently preserved in the system. You can effortlessly reactivate your account whenever you return simply by logging in.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDeactivateModalOpen(true)}
            className="px-4 py-2 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs font-semibold transition shrink-0 cursor-pointer"
          >
            Deactivate My Account
          </button>
        </div>
      </div>

      {/* Deactivate Confirmation Modal */}
      {deactivateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Deactivate Your Account?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Confirm customer account deactivation</p>
              </div>
            </div>

            {deactivateError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-lg text-xs">
                {deactivateError}
              </div>
            )}

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs space-y-2 text-slate-700 dark:text-slate-300">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Warranty Guarantee:</strong> All ({warrantyCount ?? 0}) registered warranties and ({claimsCount ?? 0}) claim records remain safely preserved in MongoDB.
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                You will be logged out of this session. You can restore access anytime by logging in with your email and password and confirming reactivation.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reason for deactivating (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Let us know why you are taking a break..."
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeactivateModalOpen(false)}
                disabled={deactivating}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
              >
                Keep Account Active
              </button>
              <button
                type="button"
                onClick={handleDeactivateAccount}
                disabled={deactivating}
                className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {deactivating && (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                Confirm & Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

