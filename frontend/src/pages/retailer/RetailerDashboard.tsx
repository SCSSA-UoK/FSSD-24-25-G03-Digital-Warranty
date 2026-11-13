import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { retailerApi } from '../../api';
import { RetailerAnalytics } from '../../types';
import { Package, ShoppingCart, ShieldCheck, ShieldAlert, PlusCircle, ArrowRight, CreditCard, Receipt } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const RetailerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<RetailerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await retailerApi.getAnalytics();
        setStats(data);
      } catch (err) {
        console.error('Failed to load retailer analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Products in Catalog',
      value: stats?.totalProducts || 0,
      sub: `${stats?.activeProducts || 0} active for sale`,
      icon: Package,
      color: 'bg-blue-50 text-blue-700',
      to: '/retailer/products',
    },
    {
      title: 'Purchases Registered',
      value: stats?.totalPurchases || 0,
      sub: 'Total customer sales recorded',
      icon: ShoppingCart,
      color: 'bg-emerald-50 text-emerald-700',
      to: '/retailer/purchases',
    },
    {
      title: 'Warranties Issued',
      value: stats?.totalWarranties || 0,
      sub: 'Digital warranty records',
      icon: ShieldCheck,
      color: 'bg-indigo-50 text-indigo-700',
      to: '/retailer/purchases',
    },
    {
      title: 'Warranty Claims',
      value: stats?.totalClaims || 0,
      sub: `${stats?.pendingClaims || 0} requiring your review`,
      icon: ShieldAlert,
      color: 'bg-rose-50 text-rose-700',
      to: '/retailer/claims',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Retailer Business Dashboard</h1>
          <p className="text-sm text-slate-500">Manage catalog products, customer purchases, warranties, and claims</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/retailer/pos"
            className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 text-sm shadow-xs"
          >
            <CreditCard className="w-4 h-4" /> Open POS Terminal
          </Link>
          <Link
            to="/retailer/bills"
            className="px-3.5 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition text-sm flex items-center gap-1.5"
          >
            <Receipt className="w-4 h-4 text-slate-500" /> Invoices
          </Link>
          <Link
            to="/retailer/register-purchase"
            className="px-3.5 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition text-sm flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4 text-slate-500" /> Quick Entry
          </Link>
        </div>
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              to={card.to}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition flex items-start justify-between"
            >
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase">{card.title}</span>
                <div className="text-3xl font-extrabold text-slate-900 mt-1">{card.value}</div>
                <div className="text-xs text-slate-500 mt-1">{card.sub}</div>
              </div>
              <div className={`p-3 rounded-xl ${card.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Action Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-blue-600 to-indigo-800 text-white rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-semibold text-white mb-1">
            <CreditCard className="w-3.5 h-3.5" /> Point of Sale & Checkout
          </div>
          <h3 className="text-xl font-bold">Ring up customer sales & issue instant warranties</h3>
          <p className="text-sm text-indigo-100 max-w-xl">
            Use the POS Billing Terminal to add single or multiple products (with or without warranty), compute taxes, print customer receipts, and automatically issue verifiable digital warranty cards.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
          <Link
            to="/retailer/pos"
            className="px-5 py-2.5 bg-white text-indigo-700 font-semibold rounded-xl hover:bg-indigo-50 transition shadow-md flex items-center gap-2 text-sm"
          >
            Launch POS Terminal <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/retailer/register-purchase"
            className="text-xs text-indigo-100 hover:text-white underline underline-offset-4 py-1"
          >
            or use single purchase form
          </Link>
        </div>
      </div>
    </div>
  );
};

