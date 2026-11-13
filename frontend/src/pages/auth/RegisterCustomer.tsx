import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, UserPlus, AlertCircle, Eye, EyeOff } from 'lucide-react';

export const RegisterCustomer: React.FC = () => {
  const { registerCustomer } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res: any = await registerCustomer({ name, email, phone, password });
      navigate('/verify-email', { state: { email, devOtp: res?.data?.devOtp } });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
      <div className="text-center space-y-2 mb-6">
        <div className="bg-emerald-600 text-white w-12 h-12 rounded-xl flex items-center justify-center mx-auto shadow-md">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Create Customer Account</h2>
        <p className="text-sm text-slate-500">Access all your digital warranties across retailers</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Full Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Email Address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            placeholder="john@example.com"
          />
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Used to match your purchases entered by retailers.
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Phone Number</label>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            placeholder="+1 555-0123"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-3.5 pr-10 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none transition p-0.5"
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
          className="w-full py-2.5 px-4 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              <UserPlus className="w-4 h-4" /> Create Account
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-slate-100 text-center space-y-2 text-xs text-slate-600">
        <div>
          Already have an account?{' '}
          <Link to="/login" className="text-emerald-700 font-semibold hover:underline">
            Sign In
          </Link>
        </div>
        <div>
          Want to register a business instead?{' '}
          <Link to="/register/retailer" className="text-indigo-600 font-semibold hover:underline">
            Retailer Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};

