import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminApi } from '../../api';
import { Retailer, ApprovalStatus } from '../../types';
import { CheckCircle, XCircle, AlertTriangle, ShieldCheck, RefreshCw, Store } from 'lucide-react';

export const RetailerApplications: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStatus = (searchParams.get('status') as ApprovalStatus) || undefined;

  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRetailer, setSelectedRetailer] = useState<Retailer | null>(null);
  const [actionType, setActionType] = useState<ApprovalStatus | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRetailers = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getRetailers(currentStatus);
      setRetailers(res.content);
    } catch (err) {
      console.error('Failed to load retailers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRetailers();
  }, [currentStatus]);

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRetailer || !actionType) return;
    setSubmitting(true);
    try {
      await adminApi.updateRetailerStatus(selectedRetailer.id, actionType, reason);
      setSelectedRetailer(null);
      setActionType(null);
      setReason('');
      fetchRetailers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update retailer status.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: ApprovalStatus) => {
    switch (status) {
      case 'APPROVED':
        return <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs px-2.5 py-0.5 rounded-full font-semibold">Approved</span>;
      case 'PENDING':
        return <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-xs px-2.5 py-0.5 rounded-full font-semibold">Pending Review</span>;
      case 'REJECTED':
        return <span className="bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 text-xs px-2.5 py-0.5 rounded-full font-semibold">Rejected</span>;
      case 'SUSPENDED':
        return <span className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs px-2.5 py-0.5 rounded-full font-semibold">Suspended</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Retailer Partner Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Approve new business applications or manage existing retailer access</p>
        </div>
        <button
          onClick={fetchRetailers}
          className="p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 self-start transition cursor-pointer"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {[
          { label: 'All Retailers', value: '' },
          { label: 'Pending Review', value: 'PENDING' },
          { label: 'Approved', value: 'APPROVED' },
          { label: 'Rejected', value: 'REJECTED' },
          { label: 'Suspended', value: 'SUSPENDED' },
        ].map((tab) => {
          const isActive = (currentStatus || '') === tab.value;
          return (
            <button
              key={tab.label}
              onClick={() => {
                if (tab.value) {
                  setSearchParams({ status: tab.value });
                } else {
                  setSearchParams({});
                }
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">Loading retailer registrations...</div>
        ) : retailers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <Store className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            No retailers found for this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Business Name</th>
                  <th className="px-6 py-3.5">Reg Number</th>
                  <th className="px-6 py-3.5">Contact</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {retailers.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">
                      <div>{r.businessName}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-normal">{r.address}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-300">{r.registrationNumber}</td>
                    <td className="px-6 py-4 text-xs">
                      <div className="text-slate-800 dark:text-slate-200">{r.contactEmail}</div>
                      <div className="text-slate-500 dark:text-slate-400">{r.contactPhone}</div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(r.approvalStatus)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {r.approvalStatus === 'PENDING' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedRetailer(r);
                                setActionType('APPROVED');
                              }}
                              className="px-2.5 py-1 bg-emerald-600 text-white rounded text-xs font-semibold hover:bg-emerald-700 transition cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRetailer(r);
                                setActionType('REJECTED');
                              }}
                              className="px-2.5 py-1 bg-rose-600 text-white rounded text-xs font-semibold hover:bg-rose-700 transition cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {r.approvalStatus === 'APPROVED' && (
                          <button
                            onClick={() => {
                              setSelectedRetailer(r);
                              setActionType('SUSPENDED');
                            }}
                            className="px-2.5 py-1 bg-amber-600 text-white rounded text-xs font-semibold hover:bg-amber-700 transition cursor-pointer"
                          >
                            Suspend
                          </button>
                        )}
                        {r.approvalStatus === 'SUSPENDED' && (
                          <button
                            onClick={() => {
                              setSelectedRetailer(r);
                              setActionType('APPROVED');
                            }}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded text-xs font-semibold hover:bg-emerald-700 transition cursor-pointer"
                          >
                            Reactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Decision / Status Change */}
      {selectedRetailer && actionType && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Confirm Retailer {actionType === 'APPROVED' ? 'Approval' : actionType === 'REJECTED' ? 'Rejection' : 'Suspension'}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Are you sure you want to change the status of <strong className="text-slate-900 dark:text-slate-100">{selectedRetailer.businessName}</strong> to{' '}
              <span className="font-semibold text-slate-900 dark:text-slate-100">{actionType}</span>?
            </p>

            {(actionType === 'REJECTED' || actionType === 'SUSPENDED') && (
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide an explanation that will be recorded in the audit trail..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedRetailer(null);
                  setActionType(null);
                  setReason('');
                }}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusSubmit}
                disabled={submitting || ((actionType === 'REJECTED' || actionType === 'SUSPENDED') && !reason.trim())}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Updating...' : 'Confirm Status Change'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

