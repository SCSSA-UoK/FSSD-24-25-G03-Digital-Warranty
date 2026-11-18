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
      SUBMITTED: 'bg-amber-100 text-amber-800',
      UNDER_REVIEW: 'bg-blue-100 text-blue-800',
      APPROVED: 'bg-emerald-100 text-emerald-800',
      REJECTED: 'bg-rose-100 text-rose-800',
      ADDITIONAL_INFO_REQUIRED: 'bg-purple-100 text-purple-800',
      CANCELLED: 'bg-slate-100 text-slate-800',
      IN_PROGRESS: 'bg-indigo-100 text-indigo-800',
      COMPLETED: 'bg-teal-100 text-teal-800',
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
          <h1 className="text-2xl font-bold text-slate-900">Platform-Wide Claims Oversight</h1>
          <p className="text-sm text-slate-500">Monitor warranty claim processing across all participating retailers</p>
        </div>
        <button
          onClick={exportClaimsToCSV}
          disabled={claims.length === 0}
          className="px-3.5 py-2 border border-slate-300 text-slate-700 bg-white font-medium rounded-lg hover:bg-slate-50 transition text-sm shadow-xs flex items-center gap-1.5 self-start disabled:opacity-50"
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
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
              statusFilter === pill.value
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {pill.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading claims...</div>
        ) : claims.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            No claims found matching filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase text-slate-400 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Product & Retailer</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Issue Summary</th>
                  <th className="px-6 py-3.5">Current Status</th>
                  <th className="px-6 py-3.5">Submitted Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {claims.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{c.productName}</div>
                      <div className="text-xs text-slate-400">{c.retailerBusinessName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{c.customerName}</div>
                      <div className="text-xs text-slate-400">{c.customerEmail}</div>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate text-xs text-slate-600">
                      {c.issueDescription}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(c.currentStatus)}</td>
                    <td className="px-6 py-4 text-xs text-slate-400">
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
