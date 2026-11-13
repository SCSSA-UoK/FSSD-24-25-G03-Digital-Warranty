import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, LogIn, AlertCircle, Eye, EyeOff, Sparkles, User, Store, Shield } from 'lucide-react';
import { resetMockDb } from '../../mock/mockBackend';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performLogin = async (userEmail: string, userPass: string) => {
    setError(null);
    setLoading(true);

    try {
      const user = await login({ email: userEmail, password: userPass });
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
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performLogin(email, password);
  };

  const handleQuickLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    await performLogin(demoEmail, 'password123');
  };

  return (
    <div className="max-w-md mx-auto my-8 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
      <div className="text-center space-y-2">
        <div className="bg-indigo-600 text-white w-12 h-12 rounded-xl flex items-center justify-center mx-auto shadow-md">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Sign in to WarranTrack</h2>
        <p className="text-sm text-slate-500">Access your warranties, products, and claims</p>
      </div>

      {/* 1-Click Demo Accounts Quick Selector */}
      <div className="bg-gradient-to-br from-indigo-50/80 to-slate-50 border border-indigo-100 rounded-xl p-3.5 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> 1-Click Demo Login (No Backend Needed)
          </span>
          <button
            type="button"
            onClick={() => {
              resetMockDb();
              alert('Demo database reset to initial fresh seed!');
            }}
            className="text-[10px] font-semibold text-slate-500 hover:text-indigo-600 underline"
            title="Reset sample data"
          >
            Reset Data
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => handleQuickLogin('admin@warrantrack.com')}
            className="p-2 rounded-lg bg-white border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 text-slate-800 transition flex flex-col items-center text-center shadow-2xs group"
          >
            <Shield className="w-4 h-4 text-purple-600 mb-0.5 group-hover:scale-110 transition" />
            <span className="font-bold text-[11px] text-purple-900">Admin</span>
            <span className="text-[9px] text-slate-400">Platform</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('retailer@techhub.com')}
            className="p-2 rounded-lg bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-slate-800 transition flex flex-col items-center text-center shadow-2xs group"
          >
            <Store className="w-4 h-4 text-blue-600 mb-0.5 group-hover:scale-110 transition" />
            <span className="font-bold text-[11px] text-blue-900">Retailer</span>
            <span className="text-[9px] text-slate-400">Apex Store</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('customer@example.com')}
            className="p-2 rounded-lg bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-slate-800 transition flex flex-col items-center text-center shadow-2xs group"
          >
            <User className="w-4 h-4 text-emerald-600 mb-0.5 group-hover:scale-110 transition" />
            <span className="font-bold text-[11px] text-emerald-900">Customer</span>
            <span className="text-[9px] text-slate-400">Alex J.</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold uppercase text-slate-700">Password</label>
            <Link to="/forgot-password" className="text-xs text-indigo-600 hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-3.5 pr-10 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
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
          className="w-full py-2.5 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
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

      <div className="pt-4 border-t border-slate-100 text-center space-y-2 text-xs text-slate-600">
        <div>
          Don't have an account yet?{' '}
          <Link to="/register" className="text-indigo-600 font-semibold hover:underline">
            Register as Customer
          </Link>
        </div>
        <div>
          Are you a business?{' '}
          <Link to="/register/retailer" className="text-indigo-600 font-semibold hover:underline">
            Register as Retailer
          </Link>
        </div>
      </div>
    </div>
  );
};
