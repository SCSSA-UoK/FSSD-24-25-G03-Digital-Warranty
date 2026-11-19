import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Store, Building2, AlertCircle, CheckCircle2, Eye, EyeOff, Check } from 'lucide-react';
import { extractErrorMessage } from '../../utils/error';

export const RegisterRetailer: React.FC = () => {
  const { registerRetailer } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    registrationNumber: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    description: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Field validation and touched states
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  const validateField = (field: string, value: string, allData?: typeof formData): string => {
    const data = allData || formData;
    switch (field) {
      case 'name': {
        const trimmed = value.trim();
        if (!trimmed) return 'Representative name is required.';
        if (trimmed.length < 2) return 'Name must be at least 2 characters.';
        if (trimmed.length > 100) return 'Name must not exceed 100 characters.';
        return '';
      }
      case 'email': {
        const trimmed = value.trim();
        if (!trimmed) return 'Account email is required.';
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(trimmed)) {
          return 'Please enter a valid email address (e.g. rep@store.com).';
        }
        return '';
      }
      case 'password': {
        if (!value) return 'Account password is required.';
        if (value.length < 8) return 'Password must be at least 8 characters long.';
        if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter (A-Z).';
        if (!/[a-z]/.test(value)) return 'Password must contain at least one lowercase letter (a-z).';
        if (!/[0-9]/.test(value)) return 'Password must contain at least one number (0-9).';
        return '';
      }
      case 'confirmPassword': {
        if (!value) return 'Please confirm your account password.';
        const pwd = data.password;
        if (value !== pwd) return 'Passwords do not match.';
        return '';
      }
      case 'businessName': {
        const trimmed = value.trim();
        if (!trimmed) return 'Business name is required.';
        if (trimmed.length < 2) return 'Business name must be at least 2 characters.';
        return '';
      }
      case 'registrationNumber': {
        const trimmed = value.trim();
        if (!trimmed) return 'Business registration number or tax ID is required.';
        if (trimmed.length < 3) return 'Registration number must be at least 3 characters.';
        return '';
      }
      case 'contactEmail': {
        const trimmed = value.trim();
        if (!trimmed) return 'Public contact email is required.';
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(trimmed)) {
          return 'Please enter a valid contact email address.';
        }
        return '';
      }
      case 'contactPhone': {
        const trimmed = value.trim();
        if (!trimmed) return 'Public contact phone is required.';
        const digits = trimmed.replace(/\D/g, '');
        if (!/^[0-9+()\-.\s]+$/.test(trimmed) || digits.length < 7 || digits.length > 15) {
          return 'Please enter a valid phone number (7 to 15 digits).';
        }
        return '';
      }
      case 'address': {
        const trimmed = value.trim();
        if (!trimmed) return 'Store / business address is required.';
        if (trimmed.length < 5) return 'Address must be at least 5 characters.';
        return '';
      }
      default:
        return '';
    }
  };

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: '', textColor: '', percent: 0 };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd) || pwd.length >= 12) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: 'Weak', color: 'bg-rose-500', textColor: 'text-rose-600 dark:text-rose-400', percent: 25 };
      case 2:
        return { score: 2, label: 'Fair', color: 'bg-amber-500', textColor: 'text-amber-600 dark:text-amber-400', percent: 50 };
      case 3:
        return { score: 3, label: 'Good', color: 'bg-blue-500', textColor: 'text-blue-600 dark:text-blue-400', percent: 75 };
      case 4:
        return { score: 4, label: 'Strong', color: 'bg-emerald-500', textColor: 'text-emerald-600 dark:text-emerald-400', percent: 100 };
      default:
        return { score: 0, label: 'Too short', color: 'bg-rose-400', textColor: 'text-rose-500', percent: 15 };
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);

    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value, updated) }));
    }

    if (name === 'password' && touched.confirmPassword && formData.confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: validateField('confirmPassword', formData.confirmPassword, updated),
      }));
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateField(field, (formData as any)[field] || '', formData);
    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const newErrors: { [key: string]: string } = {
      name: validateField('name', formData.name),
      email: validateField('email', formData.email),
      password: validateField('password', formData.password),
      confirmPassword: validateField('confirmPassword', formData.confirmPassword),
      businessName: validateField('businessName', formData.businessName),
      registrationNumber: validateField('registrationNumber', formData.registrationNumber),
      contactEmail: validateField('contactEmail', formData.contactEmail),
      contactPhone: validateField('contactPhone', formData.contactPhone),
      address: validateField('address', formData.address),
    };

    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
      businessName: true,
      registrationNumber: true,
      contactEmail: true,
      contactPhone: true,
      address: true,
    });

    const hasErrors = Object.values(newErrors).some((err) => Boolean(err));
    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword: _, ...payload } = formData;
      await registerRetailer({
        ...payload,
        name: payload.name.trim(),
        email: payload.email.trim(),
        businessName: payload.businessName.trim(),
        registrationNumber: payload.registrationNumber.trim(),
        contactEmail: payload.contactEmail.trim(),
        contactPhone: payload.contactPhone.trim(),
        address: payload.address.trim(),
        description: payload.description.trim() || undefined,
      });
      setSuccess('Retailer application submitted successfully! Your account registration is under review. Redirecting...');
      setTimeout(() => {
        navigate('/retailer');
      }, 1800);
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Retailer registration failed. Please check the details.'));
      setLoading(false);
    }
  };

  const pwdStrength = getPasswordStrength(formData.password);

  return (
    <div className="w-full max-w-xl mx-auto my-6 sm:my-12 bg-white dark:bg-slate-900 p-5 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
      <div className="text-center space-y-2 mb-6">
        <div className="bg-blue-600 text-white w-12 h-12 rounded-xl flex items-center justify-center mx-auto shadow-md">
          <Store className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Retailer Partner Registration</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Register your business to issue digital warranties and manage service claims</p>
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
        <div className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider pt-2 border-b border-slate-100 dark:border-slate-800 pb-1">
          Account Login Credentials
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
              Representative Name
            </label>
            <input
              type="text"
              name="name"
              disabled={loading || Boolean(success)}
              value={formData.name}
              onChange={handleChange}
              onBlur={() => handleBlur('name')}
              className={`w-full px-3.5 py-2.5 rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 text-sm transition ${
                touched.name && errors.name
                  ? 'border-rose-500 dark:border-rose-500 focus:ring-rose-500'
                  : 'border-slate-300 dark:border-slate-700 focus:ring-blue-500'
              }`}
              placeholder="Jane Smith"
            />
            {touched.name && errors.name && (
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1 font-medium animate-in fade-in">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.name}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
              Account Email
            </label>
            <input
              type="email"
              name="email"
              disabled={loading || Boolean(success)}
              value={formData.email}
              onChange={handleChange}
              onBlur={() => handleBlur('email')}
              className={`w-full px-3.5 py-2.5 rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 text-sm transition ${
                touched.email && errors.email
                  ? 'border-rose-500 dark:border-rose-500 focus:ring-rose-500'
                  : 'border-slate-300 dark:border-slate-700 focus:ring-blue-500'
              }`}
              placeholder="rep@store.com"
            />
            {touched.email && errors.email && (
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1 font-medium animate-in fade-in">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.email}</span>
              </p>
            )}
          </div>
        </div>

        {/* Password & Confirm Password */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">
                Account Password
              </label>
              {formData.password && (
                <span className={`text-[10px] font-bold ${pwdStrength.textColor}`}>
                  {pwdStrength.label}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                disabled={loading || Boolean(success)}
                value={formData.password}
                onChange={handleChange}
                onBlur={() => handleBlur('password')}
                className={`w-full pl-3.5 pr-10 py-2.5 rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 text-sm transition ${
                  touched.password && errors.password
                    ? 'border-rose-500 dark:border-rose-500 focus:ring-rose-500'
                    : 'border-slate-300 dark:border-slate-700 focus:ring-blue-500'
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
            {formData.password && (
              <div className="mt-1.5 space-y-0.5">
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex gap-1">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${pwdStrength.color}`}
                    style={{ width: `${pwdStrength.percent}%` }}
                  />
                </div>
              </div>
            )}
            {touched.password && errors.password && (
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1 font-medium animate-in fade-in">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.password}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                disabled={loading || Boolean(success)}
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={() => handleBlur('confirmPassword')}
                className={`w-full pl-3.5 pr-10 py-2.5 rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 text-sm transition ${
                  touched.confirmPassword && errors.confirmPassword
                    ? 'border-rose-500 dark:border-rose-500 focus:ring-rose-500'
                    : 'border-slate-300 dark:border-slate-700 focus:ring-blue-500'
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
            ) : touched.confirmPassword && formData.confirmPassword && formData.confirmPassword === formData.password ? (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium animate-in fade-in">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>Passwords match</span>
              </p>
            ) : null}
          </div>
        </div>

        <div className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider pt-4 border-b border-slate-100 dark:border-slate-800 pb-1">
          Business & Store Information
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
              Business Name
            </label>
            <input
              type="text"
              name="businessName"
              disabled={loading || Boolean(success)}
              value={formData.businessName}
              onChange={handleChange}
              onBlur={() => handleBlur('businessName')}
              className={`w-full px-3.5 py-2.5 rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 text-sm transition ${
                touched.businessName && errors.businessName
                  ? 'border-rose-500 dark:border-rose-500 focus:ring-rose-500'
                  : 'border-slate-300 dark:border-slate-700 focus:ring-blue-500'
              }`}
              placeholder="Apex Electronics Ltd"
            />
            {touched.businessName && errors.businessName && (
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1 font-medium animate-in fade-in">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.businessName}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
              Business Reg. / Tax ID
            </label>
            <input
              type="text"
              name="registrationNumber"
              disabled={loading || Boolean(success)}
              value={formData.registrationNumber}
              onChange={handleChange}
              onBlur={() => handleBlur('registrationNumber')}
              className={`w-full px-3.5 py-2.5 rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 text-sm transition ${
                touched.registrationNumber && errors.registrationNumber
                  ? 'border-rose-500 dark:border-rose-500 focus:ring-rose-500'
                  : 'border-slate-300 dark:border-slate-700 focus:ring-blue-500'
              }`}
              placeholder="REG-8921734"
            />
            {touched.registrationNumber && errors.registrationNumber && (
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1 font-medium animate-in fade-in">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.registrationNumber}</span>
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
              Public Contact Email
            </label>
            <input
              type="email"
              name="contactEmail"
              disabled={loading || Boolean(success)}
              value={formData.contactEmail}
              onChange={handleChange}
              onBlur={() => handleBlur('contactEmail')}
              className={`w-full px-3.5 py-2.5 rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 text-sm transition ${
                touched.contactEmail && errors.contactEmail
                  ? 'border-rose-500 dark:border-rose-500 focus:ring-rose-500'
                  : 'border-slate-300 dark:border-slate-700 focus:ring-blue-500'
              }`}
              placeholder="support@apex.com"
            />
            {touched.contactEmail && errors.contactEmail && (
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1 font-medium animate-in fade-in">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.contactEmail}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
              Public Contact Phone
            </label>
            <input
              type="tel"
              name="contactPhone"
              disabled={loading || Boolean(success)}
              value={formData.contactPhone}
              onChange={handleChange}
              onBlur={() => handleBlur('contactPhone')}
              className={`w-full px-3.5 py-2.5 rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 text-sm transition ${
                touched.contactPhone && errors.contactPhone
                  ? 'border-rose-500 dark:border-rose-500 focus:ring-rose-500'
                  : 'border-slate-300 dark:border-slate-700 focus:ring-blue-500'
              }`}
              placeholder="+1 555-8888"
            />
            {touched.contactPhone && errors.contactPhone && (
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1 font-medium animate-in fade-in">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.contactPhone}</span>
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
            Store / Business Address
          </label>
          <input
            type="text"
            name="address"
            disabled={loading || Boolean(success)}
            value={formData.address}
            onChange={handleChange}
            onBlur={() => handleBlur('address')}
            className={`w-full px-3.5 py-2.5 rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 text-sm transition ${
              touched.address && errors.address
                ? 'border-rose-500 dark:border-rose-500 focus:ring-rose-500'
                : 'border-slate-300 dark:border-slate-700 focus:ring-blue-500'
            }`}
            placeholder="123 Tech Boulevard, Suite 400"
          />
          {touched.address && errors.address && (
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1 font-medium animate-in fade-in">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.address}</span>
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
            Business Description (Optional)
          </label>
          <textarea
            name="description"
            rows={2}
            disabled={loading || Boolean(success)}
            value={formData.description}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="Consumer electronics and home appliances retailer..."
          />
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-lg border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300">
          Notice: Retailer registrations require verification and approval by the platform administrator before product catalog and purchase registration tools become active.
        </div>

        <button
          type="submit"
          disabled={loading || Boolean(success)}
          className="w-full py-2.5 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : success ? (
            <>
              <Check className="w-4 h-4" /> Application Submitted
            </>
          ) : (
            <>
              <Building2 className="w-4 h-4" /> Submit Application
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-600 dark:text-slate-400">
        Already registered?{' '}
        <Link to="/login" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
};


