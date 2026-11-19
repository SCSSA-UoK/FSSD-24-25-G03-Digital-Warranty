import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, UserPlus, AlertCircle, CheckCircle2, Eye, EyeOff, Check } from 'lucide-react';
import { extractErrorMessage } from '../../utils/error';

export const RegisterCustomer: React.FC = () => {
  const { registerCustomer } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Field-specific validation errors and touched tracking
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  const validateField = (field: string, value: string, allValues?: { password?: string }): string => {
    switch (field) {
      case 'name': {
        const trimmed = value.trim();
        if (!trimmed) return 'Full name is required.';
        if (trimmed.length < 2) return 'Full name must be at least 2 characters.';
        if (trimmed.length > 100) return 'Full name must not exceed 100 characters.';
        if (!/^[a-zA-Z\s\-'.]+$/.test(trimmed)) {
          return 'Full name can only contain letters, spaces, hyphens, and apostrophes.';
        }
        return '';
      }
      case 'email': {
        const trimmed = value.trim();
        if (!trimmed) return 'Email address is required.';
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(trimmed)) {
          return 'Please enter a valid email address (e.g. name@example.com).';
        }
        return '';
      }
      case 'phone': {
        const trimmed = value.trim();
        if (!trimmed) return 'Phone number is required.';
        const digits = trimmed.replace(/\D/g, '');
        if (!/^[0-9+()\-.\s]+$/.test(trimmed) || digits.length < 7 || digits.length > 15) {
          return 'Please enter a valid phone number (7 to 15 digits).';
        }
        return '';
      }
      case 'password': {
        if (!value) return 'Password is required.';
        if (value.length < 8) return 'Password must be at least 8 characters long.';
        if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter (A-Z).';
        if (!/[a-z]/.test(value)) return 'Password must contain at least one lowercase letter (a-z).';
        if (!/[0-9]/.test(value)) return 'Password must contain at least one number (0-9).';
        return '';
      }
      case 'confirmPassword': {
        if (!value) return 'Please confirm your password.';
        const pwd = allValues?.password !== undefined ? allValues.password : password;
        if (value !== pwd) return 'Passwords do not match.';
        return '';
      }
      default:
        return '';
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    let val = '';
    if (field === 'name') val = name;
    if (field === 'email') val = email;
    if (field === 'phone') val = phone;
    if (field === 'password') val = password;
    if (field === 'confirmPassword') val = confirmPassword;
    const err = validateField(field, val, { password });
    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (touched.password) {
      setErrors((prev) => ({ ...prev, password: validateField('password', val) }));
    }
    if (touched.confirmPassword && confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: validateField('confirmPassword', confirmPassword, { password: val }),
      }));
    }
  };

  const handleConfirmPasswordChange = (val: string) => {
    setConfirmPassword(val);
    if (touched.confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: validateField('confirmPassword', val, { password }),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const newErrors: { [key: string]: string } = {
      name: validateField('name', name),
      email: validateField('email', email),
      phone: validateField('phone', phone),
      password: validateField('password', password),
      confirmPassword: validateField('confirmPassword', confirmPassword, { password }),
    };

    setTouched({
      name: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
    });

    const hasErrors = Object.values(newErrors).some((err) => Boolean(err));
    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      await registerCustomer({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      });
      setSuccess('Registration completed successfully! Redirecting to email verification...');
      setTimeout(() => {
        navigate('/verify-email', { state: { email: email.trim() } });
      }, 1600);
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Registration failed. Please check your details.'));
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto my-6 sm:my-12 bg-white dark:bg-slate-900 p-5 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
      <div className="text-center space-y-2 mb-6">
        <div className="bg-emerald-600 text-white w-12 h-12 rounded-xl flex items-center justify-center mx-auto shadow-md">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Create Customer Account</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Access all your digital warranties across retailers</p>
      </div>

      {success && (
        <div className="mb-4 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 rounded-xl text-sm flex items-start gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
          <span className="font-medium leading-relaxed">{success}</span>
        </div>
      )}

      {error && !success && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-rose-950/40 border border-red-200 dark:border-rose-800/60 text-red-700 dark:text-rose-300 rounded-lg text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-rose-400" />
          <span className="break-words">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
            Full Name
          </label>
          <input
            type="text"
            disabled={loading || Boolean(success)}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (touched.name) {
                setErrors((prev) => ({ ...prev, name: validateField('name', e.target.value) }));
              }
            }}
            onBlur={() => handleBlur('name')}
            className={`w-full px-3.5 py-2.5 rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 text-sm transition ${
              touched.name && errors.name
                ? 'border-rose-500 dark:border-rose-500 focus:ring-rose-500'
                : 'border-slate-300 dark:border-slate-700 focus:ring-emerald-500'
            }`}
            placeholder="John Doe"
          />
          {touched.name && errors.name && (
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1 font-medium animate-in fade-in">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.name}</span>
            </p>
          )}
        </div>

        {/* Email Address */}
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
            Email Address
          </label>
          <input
            type="email"
            disabled={loading || Boolean(success)}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (touched.email) {
                setErrors((prev) => ({ ...prev, email: validateField('email', e.target.value) }));
              }
            }}
            onBlur={() => handleBlur('email')}
            className={`w-full px-3.5 py-2.5 rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 text-sm transition ${
              touched.email && errors.email
                ? 'border-rose-500 dark:border-rose-500 focus:ring-rose-500'
                : 'border-slate-300 dark:border-slate-700 focus:ring-emerald-500'
            }`}
            placeholder="john@example.com"
          />
          {touched.email && errors.email ? (
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1 font-medium animate-in fade-in">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.email}</span>
            </p>
          ) : (
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
              Used to match your purchases entered by retailers.
            </span>
          )}
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            disabled={loading || Boolean(success)}
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (touched.phone) {
                setErrors((prev) => ({ ...prev, phone: validateField('phone', e.target.value) }));
              }
            }}
            onBlur={() => handleBlur('phone')}
            className={`w-full px-3.5 py-2.5 rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 text-sm transition ${
              touched.phone && errors.phone
                ? 'border-rose-500 dark:border-rose-500 focus:ring-rose-500'
                : 'border-slate-300 dark:border-slate-700 focus:ring-emerald-500'
            }`}
            placeholder="+1 555-0123"
          />
          {touched.phone && errors.phone && (
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1 font-medium animate-in fade-in">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.phone}</span>
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              disabled={loading || Boolean(success)}
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              onBlur={() => handleBlur('password')}
              className={`w-full pl-3.5 pr-10 py-2.5 rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 text-sm transition ${
                touched.password && errors.password
                  ? 'border-rose-500 dark:border-rose-500 focus:ring-rose-500'
                  : 'border-slate-300 dark:border-slate-700 focus:ring-emerald-500'
              }`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none transition p-0.5 cursor-pointer"
              title={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {touched.password && errors.password && (
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1 font-medium animate-in fade-in">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.password}</span>
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
            Confirm Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              disabled={loading || Boolean(success)}
              value={confirmPassword}
              onChange={(e) => handleConfirmPasswordChange(e.target.value)}
              onBlur={() => handleBlur('confirmPassword')}
              className={`w-full pl-3.5 pr-10 py-2.5 rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 text-sm transition ${
                touched.confirmPassword && errors.confirmPassword
                  ? 'border-rose-500 dark:border-rose-500 focus:ring-rose-500'
                  : 'border-slate-300 dark:border-slate-700 focus:ring-emerald-500'
              }`}
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
          {touched.confirmPassword && errors.confirmPassword ? (
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1 font-medium animate-in fade-in">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.confirmPassword}</span>
            </p>
          ) : touched.confirmPassword && confirmPassword && confirmPassword === password ? (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium animate-in fade-in">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>Passwords match</span>
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={loading || Boolean(success)}
          className="w-full py-2.5 px-4 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : success ? (
            <>
              <Check className="w-4 h-4" /> Account Created
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" /> Create Account
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center space-y-2 text-xs text-slate-600 dark:text-slate-400">
        <div>
          Already have an account?{' '}
          <Link to="/login" className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline">
            Sign In
          </Link>
        </div>
        <div>
          Want to register a business instead?{' '}
          <Link to="/register/retailer" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
            Retailer Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};


