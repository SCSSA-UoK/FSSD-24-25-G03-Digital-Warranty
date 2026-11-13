import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api';
import { User } from '../../types';
import { Users, CheckCircle2, XCircle } from 'lucide-react';

export const CustomerList: React.FC = () => {
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const res = await adminApi.getCustomers();
        setCustomers(res.content);
      } catch (err) {
        console.error('Failed to load customers', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Registered Platform Customers</h1>
        <p className="text-sm text-slate-500">View customer accounts utilizing global warranties across retailers</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading customers...</div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            No customer accounts registered yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase text-slate-400 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Customer Name</th>
                  <th className="px-6 py-3.5">Email</th>
                  <th className="px-6 py-3.5">Phone</th>
                  <th className="px-6 py-3.5">Email Verified</th>
                  <th className="px-6 py-3.5">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900">{c.name}</td>
                    <td className="px-6 py-4">{c.email}</td>
                    <td className="px-6 py-4 text-xs font-mono">{c.phone || '—'}</td>
                    <td className="px-6 py-4">
                      {c.emailVerified ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-700 font-medium text-xs">
                          <XCircle className="w-4 h-4 text-amber-600" /> Unverified
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

