import React, { useEffect, useState } from 'react';
import { adminApi, extractErrorMessage } from '../../api';
import { User, AccountStatus } from '../../types';
import {
  Users,
  CheckCircle2,
  XCircle,
  Search,
  ShieldAlert,
  ShieldCheck,
  PauseCircle,
  AlertTriangle,
  RotateCcw,
  Ban,
  FileCheck2,
  Shield,
  Clock,
  Info
} from 'lucide-react';

export const CustomerList: React.FC = () => {
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | AccountStatus>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Status Action Modal State
  const [targetCustomer, setTargetCustomer] = useState<User | null>(null);
  const [actionType, setActionType] = useState<'ACTIVATE' | 'INACTIVATE' | 'SUSPEND' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const filter = statusFilter === 'ALL' ? undefined : statusFilter;
      const res = await adminApi.getCustomers(filter, searchTerm.trim() || undefined);
      setCustomers(res.content);
    } catch (err: any) {
      console.error('Failed to load customers', err);
      setErrorMsg(extractErrorMessage(err, 'Failed to load customer accounts'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers();
  };

  const openActionModal = (customer: User, type: 'ACTIVATE' | 'INACTIVATE' | 'SUSPEND') => {
    setTargetCustomer(customer);
    setActionType(type);
    setActionReason('');
    setErrorMsg(null);
  };

  const closeActionModal = () => {
    setTargetCustomer(null);
    setActionType(null);
    setActionReason('');
    setActionLoading(false);
  };

  const handleStatusUpdate = async () => {
    if (!targetCustomer || !actionType) return;

    let newStatus: AccountStatus = 'ACTIVE';
    if (actionType === 'SUSPEND') newStatus = 'SUSPENDED';
    else if (actionType === 'INACTIVATE') newStatus = 'INACTIVE';
    else newStatus = 'ACTIVE';

    if (newStatus === 'SUSPENDED' && !actionReason.trim()) {
      setErrorMsg('A valid reason is required when suspending a customer account.');
      return;
    }

    try {
      setActionLoading(true);
      setErrorMsg(null);
      await adminApi.updateCustomerStatus(
        targetCustomer.id,
        newStatus,
        actionReason.trim() || (actionType === 'ACTIVATE' ? 'Restored by Super Admin' : 'Inactivated by Super Admin')
      );
      setSuccessMsg(
        `Customer "${targetCustomer.name}" account status successfully updated to ${newStatus}. All warranty and claim records remain safely preserved.`
      );
      closeActionModal();
      await fetchCustomers();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      console.error('Failed to update customer status', err);
      setErrorMsg(extractErrorMessage(err, 'Failed to update customer status'));
      setActionLoading(false);
    }
  };

  // Status Metrics
  const activeCount = customers.filter((c) => c.accountStatus === 'ACTIVE').length;
  const inactiveCount = customers.filter((c) => c.accountStatus === 'INACTIVE' || c.accountStatus === 'DEACTIVATED').length;
  const suspendedCount = customers.filter((c) => c.accountStatus === 'SUSPENDED').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Customer Account Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Control customer access status (Active, Inactive, Suspended) with guaranteed preservation of all warranty and claim histories.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-xl text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Preservation Guarantee Banner */}
      <div className="bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl p-4 flex items-start gap-3 text-xs text-blue-900 dark:text-blue-300">
        <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-semibold text-blue-950 dark:text-blue-200">Data Preservation Protocol:</span> Deactivating or suspending a customer account restricts authentication and authorization while keeping all existing digital warranty cards, purchase proof documents, and warranty claim histories permanently intact in MongoDB.
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Listed</span>
            <Users className="w-5 h-5 text-slate-400 dark:text-slate-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">{customers.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Active Access</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{activeCount}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">Inactive</span>
            <PauseCircle className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">{inactiveCount}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">Suspended</span>
            <ShieldAlert className="w-5 h-5 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2">{suspendedCount}</p>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {(['ALL', 'ACTIVE', 'INACTIVE', 'SUSPENDED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${statusFilter === status
                ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
            >
              {status === 'ALL' ? 'All Customers' : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:w-80">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search name, email, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-900 dark:focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg transition cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500">Loading customers...</div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            No customer accounts found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs uppercase text-slate-400 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Email & Phone</th>
                  <th className="px-6 py-3.5">Preserved Records</th>
                  <th className="px-6 py-3.5">Status Indicator</th>
                  <th className="px-6 py-3.5 text-right">Access Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {customers.map((c) => {
                  const isSuspended = c.accountStatus === 'SUSPENDED';
                  const isInactive = c.accountStatus === 'INACTIVE' || c.accountStatus === 'DEACTIVATED';
                  const isActive = c.accountStatus === 'ACTIVE' || !c.accountStatus;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                      {/* Customer Name & Joined */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{c.name}</div>
                        <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          Joined {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                        </div>
                      </td>

                      {/* Contact & Verification */}
                      <td className="px-6 py-4">
                        <div className="text-slate-800 dark:text-slate-200">{c.email}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-mono text-slate-400 dark:text-slate-500">{c.phone || '—'}</span>
                          {c.emailVerified ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                              <XCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Unverified
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Preserved Data Counters */}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                            <FileCheck2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            {c.warrantiesCount ?? 0} Warranties
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                            <Shield className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                            {c.claimsCount ?? 0} Claims
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Guaranteed preserved</div>
                      </td>

                      {/* Status Indicator */}
                      <td className="px-6 py-4">
                        {isActive && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              Active
                            </span>
                          </div>
                        )}
                        {isInactive && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                              <PauseCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                              Inactive
                            </span>
                            {c.statusReason && (
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 max-w-[180px] truncate" title={c.statusReason}>
                                Reason: {c.statusReason}
                              </div>
                            )}
                          </div>
                        )}
                        {isSuspended && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
                              <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                              Suspended
                            </span>
                            {c.statusReason && (
                              <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium max-w-[180px] truncate" title={c.statusReason}>
                                {c.statusReason}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isActive && (
                            <>
                              <button
                                onClick={() => openActionModal(c, 'INACTIVATE')}
                                className="px-2.5 py-1 rounded-md text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800/60 transition cursor-pointer"
                                title="Deactivate customer account access"
                              >
                                Deactivate
                              </button>
                              <button
                                onClick={() => openActionModal(c, 'SUSPEND')}
                                className="px-2.5 py-1 rounded-md text-xs font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800/60 transition cursor-pointer"
                                title="Suspend customer account immediately"
                              >
                                Suspend
                              </button>
                            </>
                          )}

                          {isInactive && (
                            <>
                              <button
                                onClick={() => openActionModal(c, 'ACTIVATE')}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800/60 transition cursor-pointer"
                                title="Reactivate customer account access"
                              >
                                <RotateCcw className="w-3 h-3" /> Reactivate
                              </button>
                              <button
                                onClick={() => openActionModal(c, 'SUSPEND')}
                                className="px-2.5 py-1 rounded-md text-xs font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800/60 transition cursor-pointer"
                              >
                                Suspend
                              </button>
                            </>
                          )}

                          {isSuspended && (
                            <button
                              onClick={() => openActionModal(c, 'ACTIVATE')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800/60 transition cursor-pointer"
                              title="Lift suspension and restore active status"
                            >
                              <RotateCcw className="w-3 h-3" /> Lift Suspension
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Dialog / Action Modal */}
      {targetCustomer && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center gap-3">
              {actionType === 'SUSPEND' && (
                <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
              )}
              {actionType === 'INACTIVATE' && (
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <PauseCircle className="w-5 h-5" />
                </div>
              )}
              {actionType === 'ACTIVATE' && (
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-5 h-5" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {actionType === 'SUSPEND' && 'Suspend Customer Account'}
                  {actionType === 'INACTIVATE' && 'Deactivate Customer Account'}
                  {actionType === 'ACTIVATE' && 'Reactivate Customer Account'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Target customer: {targetCustomer.name} ({targetCustomer.email})</p>
              </div>
            </div>

            {/* Modal Context / Warning */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs space-y-2">
              <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Warranty & Claim Preservation:</strong> All ({targetCustomer.warrantiesCount ?? 0}) registered warranties and ({targetCustomer.claimsCount ?? 0}) claims remain completely saved in the database.
                </span>
              </div>
              {actionType === 'SUSPEND' && (
                <p className="text-rose-700 dark:text-rose-300 font-medium">
                  <strong>Security Restriction:</strong> The customer will be immediately blocked from signing in, and any ongoing sessions with active tokens will be rejected with 403 Forbidden.
                </p>
              )}
              {actionType === 'INACTIVATE' && (
                <p className="text-amber-800 dark:text-amber-300">
                  The customer will not be able to log in until reactivated. They will receive a reactivation prompt if they attempt to sign in.
                </p>
              )}
              {actionType === 'ACTIVATE' && (
                <p className="text-emerald-800 dark:text-emerald-300">
                  Customer access will be fully restored. They will be able to log in and manage warranties and claims immediately.
                </p>
              )}
            </div>

            {/* Reason Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {actionType === 'SUSPEND' ? 'Mandatory Suspension Reason *' : 'Reason / Note (Optional)'}
              </label>
              <textarea
                rows={3}
                placeholder={
                  actionType === 'SUSPEND'
                    ? 'e.g. Terms of service violation, fraudulent claim activity, duplicate account...'
                    : 'Add optional administrative note...'
                }
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="w-full text-xs p-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeActionModal}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStatusUpdate}
                disabled={actionLoading}
                className={`px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer ${actionType === 'SUSPEND'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : actionType === 'INACTIVATE'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
              >
                {actionLoading && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {actionType === 'SUSPEND' && 'Confirm Suspension'}
                {actionType === 'INACTIVATE' && 'Confirm Deactivation'}
                {actionType === 'ACTIVATE' && 'Confirm Reactivation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
