import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api';
import { Claim, ClaimStatus } from '../../types';
import { FileText, Download } from 'lucide-react';

export const PlatformClaims: React.FC = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [statusFilter, setStatusFilter] = useState<ClaimStatus | ''>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        setLoading(true);
        const res = await adminApi.getAllClaims(statusFilter || undefined);
        setClaims(res.content);
      } catch (err) {
        console.error('Failed to load platform claims', err);
      } finally {
        setLoading(false);
      }
    };
    fetchClaims();
  }, [statusFilter]);

  const getStatusBadge = (status: ClaimStatus) => {
    const styles: Record<ClaimStatus, string> = {
      SUBMITTED: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60',
      UNDER_REVIEW: 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60',
      APPROVED: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60',
      REJECTED: 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60',
      ADDITIONAL_INFO_REQUIRED: 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60',
      CANCELLED: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
      IN_PROGRESS: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60',
      COMPLETED: 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60',
    };
    return (
      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${styles[status]}`}>
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  const exportClaimsToCSV = () => {
    if (claims.length === 0) return;
    const headers = [
      'Claim ID',
      'Product Name',
      'Retailer',
      'Customer Name',
      'Customer Email',
      'Current Status',
      'Resolution Type',
      'Issue Description',
      'Submitted Date',
    ];

    const rows = claims.map((c) => [
      c.id,
      c.productName,
      c.retailerBusinessName || '',
      c.customerName || '',
      c.customerEmail || '',
      c.currentStatus,
      c.resolutionType || 'N/A',
      c.issueDescription,
      new Date(c.createdAt).toLocaleDateString(),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(','))].join(
        '\n'
      );

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `warrantrack_claims_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statusPills: Array<{ label: string; value: ClaimStatus | '' }> = [
    { label: 'All Claims', value: '' },
    { label: 'Submitted', value: 'SUBMITTED' },
    { label: 'Under Review', value: 'UNDER_REVIEW' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Rejected', value: 'REJECTED' },
    { label: 'Cancelled', value: 'CANCELLED' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Platform-Wide Claims Oversight</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Monitor warranty claim processing across all participating retailers</p>
        </div>
        <button
          onClick={exportClaimsToCSV}
          disabled={claims.length === 0}
          className="px-3.5 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition text-sm shadow-xs flex items-center gap-1.5 self-start disabled:opacity-50 cursor-pointer"
        >
          <Download className="w-4 h-4" /> Export Claims CSV
        </button>
      </div>

      {/* Status Filter Pill Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {statusPills.map((pill) => (
          <button
            key={pill.value}
            type="button"
            onClick={() => setStatusFilter(pill.value)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
              statusFilter === pill.value
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {pill.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">Loading claims...</div>
        ) : claims.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            No claims found matching filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Product & Retailer</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Issue Summary</th>
                  <th className="px-6 py-3.5">Current Status</th>
                  <th className="px-6 py-3.5">Submitted Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {claims.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{c.productName}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{c.retailerBusinessName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{c.customerName}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{c.customerEmail}</div>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate text-xs text-slate-600 dark:text-slate-300">
                      {c.issueDescription}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(c.currentStatus)}</td>
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                      {new Date(c.createdAt).toLocaleDateString()}
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
