import React, { useEffect, useState, useMemo } from 'react';
import { adminApi, extractErrorMessage } from '../../api';
import { AuditLog } from '../../types';
import {
  History,
  Search,
  Filter,
  RefreshCw,
  Shield,
  User,
  Store,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Copy,
  Check,
  AlertCircle,
  Clock,
  Layers,
  KeyRound,
  FileText,
  CreditCard,
  Package,
} from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination state
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('');

  // Dropdown options
  const [availableActions, setAvailableActions] = useState<string[]>([]);
  const [availableEntityTypes, setAvailableEntityTypes] = useState<string[]>([]);

  // Modal inspection state
  const [inspectLog, setInspectLog] = useState<AuditLog | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Fetch filter options once
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [actions, entityTypes] = await Promise.all([
          adminApi.getAuditActions().catch(() => []),
          adminApi.getAuditEntityTypes().catch(() => []),
        ]);
        if (Array.isArray(actions)) setAvailableActions(actions);
        if (Array.isArray(entityTypes)) setAvailableEntityTypes(entityTypes);
      } catch {
        // Non-blocking fallback
      }
    };
    fetchOptions();
  }, []);

  const fetchLogs = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await adminApi.getAuditLogs({
        page,
        size: pageSize,
        search: searchTerm.trim() || undefined,
        action: selectedAction || undefined,
        entityType: selectedEntityType || undefined,
      });

      setLogs(res.content || []);
      setTotalPages(res.totalPages || 0);
      setTotalElements(res.totalElements || 0);
    } catch (err: any) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchLogs();
    }, 250);
    return () => clearTimeout(debounce);
  }, [page, pageSize, searchTerm, selectedAction, selectedEntityType]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Helper formatting relative and absolute timestamps
  const formatTimestamp = (iso: string) => {
    if (!iso) return { formatted: 'N/A', relative: '' };
    try {
      const d = new Date(iso);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      let relative = 'Just now';
      if (diffDays > 0) relative = `${diffDays}d ago`;
      else if (diffHours > 0) relative = `${diffHours}h ago`;
      else if (diffMins > 0) relative = `${diffMins}m ago`;

      return {
        formatted: d.toLocaleString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        relative,
      };
    } catch {
      return { formatted: iso, relative: '' };
    }
  };

  // Action semantic styling
  const getActionBadgeStyle = (action: string) => {
    const act = (action || '').toUpperCase();
    if (act.includes('FAILED') || act.includes('BLOCKED') || act.includes('SUSPEND') || act.includes('DELET') || act.includes('REJECT') || act.includes('CANCEL')) {
      return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800/60';
    }
    if (act.includes('REGISTER') || act.includes('SUCCESS') || act.includes('APPROVED') || act.includes('COMPLETED') || act.includes('ACTIVAT')) {
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60';
    }
    if (act.includes('LOGIN') || act.includes('OTP') || act.includes('AUTH') || act.includes('PASSWORD')) {
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60';
    }
    if (act.includes('BILL') || act.includes('PURCHASE')) {
      return 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800/60';
    }
    if (act.includes('CLAIM') || act.includes('INFO') || act.includes('PROGRESS')) {
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/60';
    }
    return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  };

  // Entity icon
  const getEntityIcon = (entityType: string) => {
    const t = (entityType || '').toLowerCase();
    if (t.includes('user') || t.includes('customer')) return <User className="w-3.5 h-3.5 text-indigo-500" />;
    if (t.includes('retailer')) return <Store className="w-3.5 h-3.5 text-amber-500" />;
    if (t.includes('claim')) return <FileText className="w-3.5 h-3.5 text-purple-500" />;
    if (t.includes('bill')) return <CreditCard className="w-3.5 h-3.5 text-emerald-500" />;
    if (t.includes('product')) return <Package className="w-3.5 h-3.5 text-blue-500" />;
    if (t.includes('purchase')) return <Layers className="w-3.5 h-3.5 text-cyan-500" />;
    return <Shield className="w-3.5 h-3.5 text-slate-400" />;
  };

  // KPI calculations on current view
  const stats = useMemo(() => {
    let authEvents = 0;
    let businessEvents = 0;
    let adminOverrides = 0;

    logs.forEach((l) => {
      const act = (l.action || '').toUpperCase();
      if (act.includes('LOGIN') || act.includes('OTP') || act.includes('REGISTER') || act.includes('PASSWORD') || act.includes('EMAIL')) {
        authEvents++;
      } else if (act.includes('STATUS') || act.includes('SUSPEND') || act.includes('DEACTIVAT')) {
        adminOverrides++;
      } else {
        businessEvents++;
      }
    });

    return { authEvents, businessEvents, adminOverrides };
  }, [logs]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60 shadow-2xs">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                Security & Audit Trail
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Tamper-evident system activity records, authentication tracking & domain event auditing
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchLogs(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition cursor-pointer shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Trail
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Total Logged</span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            {totalElements.toLocaleString()}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">Recorded system events</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Auth & Identity</span>
            <KeyRound className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
            {stats.authEvents}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">In current page view</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Domain Operations</span>
            <FileText className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {stats.businessEvents}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">Claims, bills & linking</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Admin Overrides</span>
            <Shield className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400">
            {stats.adminOverrides}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">Status & security changes</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
              placeholder="Search by actor email, details, action or entity ID..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setPage(0);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedAction}
              onChange={(e) => {
                setSelectedAction(e.target.value);
                setPage(0);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">All Action Types</option>
              {availableActions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>

          {/* Entity Type Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedEntityType}
              onChange={(e) => {
                setSelectedEntityType(e.target.value);
                setPage(0);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">All Entities</option>
              {availableEntityTypes.map((et) => (
                <option key={et} value={et}>
                  {et}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filter Clear Tag */}
        {(searchTerm || selectedAction || selectedEntityType) && (
          <div className="flex items-center gap-2 pt-1 text-xs text-slate-500 dark:text-slate-400">
            <span>Filtered results:</span>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedAction('');
                setSelectedEntityType('');
                setPage(0);
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-rose-600 transition cursor-pointer font-medium text-[11px]"
            >
              <X className="w-3 h-3" /> Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Audit Logs Table / Feed */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 dark:text-slate-400">Retrieving security audit records...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <History className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Audit Records Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              No audit logs matched your search or filter parameters. Try clearing filters or performing actions on the platform.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Actor</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Entity</th>
                  <th className="py-3.5 px-4">Activity Details</th>
                  <th className="py-3.5 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {logs.map((log) => {
                  const ts = formatTimestamp(log.timestamp);
                  const badgeStyle = getActionBadgeStyle(log.action);

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{ts.relative}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                          {ts.formatted}
                        </div>
                      </td>

                      {/* Actor */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 truncate" title={log.actorEmail}>
                          {log.actorEmail || 'System / Anonymous'}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate" title={log.actorId}>
                          ID: {log.actorId ? log.actorId.slice(-8) : 'N/A'}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeStyle}`}
                        >
                          {log.action}
                        </span>
                      </td>

                      {/* Entity */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                          {getEntityIcon(log.entityType)}
                          <span>{log.entityType || 'General'}</span>
                        </div>
                        {log.entityId && (
                          <div className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]" title={log.entityId}>
                            {log.entityId}
                          </div>
                        )}
                      </td>

                      {/* Details */}
                      <td className="py-3.5 px-4 max-w-xs xl:max-w-md">
                        <p className="line-clamp-2 text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                          {log.details || 'No additional details captured'}
                        </p>
                      </td>

                      {/* Inspect Action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setInspectLog(log)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition cursor-pointer"
                        >
                          <Eye className="w-3 h-3" /> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Showing page <span className="font-semibold text-slate-900 dark:text-slate-100">{page + 1}</span> of{' '}
              <span className="font-semibold text-slate-900 dark:text-slate-100">{totalPages}</span> ({totalElements} total records)
            </div>

            <div className="flex items-center gap-2">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(0);
                }}
                className="px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
              >
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
              </select>

              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-750 transition cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setPage((p) => (p + 1 < totalPages ? p + 1 : p))}
                disabled={page + 1 >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-750 transition cursor-pointer"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inspect Log Modal */}
      {inspectLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getActionBadgeStyle(
                    inspectLog.action
                  )}`}
                >
                  {inspectLog.action}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1.5">
                  Audit Record Inspection
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Recorded at {formatTimestamp(inspectLog.timestamp).formatted}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setInspectLog(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Metadata Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-750 space-y-1">
                <span className="text-slate-400 uppercase font-bold text-[10px]">Actor Email</span>
                <div className="font-semibold text-slate-900 dark:text-slate-100 truncate" title={inspectLog.actorEmail}>
                  {inspectLog.actorEmail || 'System'}
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-750 space-y-1">
                <span className="text-slate-400 uppercase font-bold text-[10px]">Actor ID</span>
                <div className="flex items-center justify-between font-mono text-[11px] text-slate-700 dark:text-slate-300">
                  <span className="truncate">{inspectLog.actorId || 'N/A'}</span>
                  {inspectLog.actorId && (
                    <button
                      type="button"
                      onClick={() => handleCopy(inspectLog.actorId, 'actorId')}
                      className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 ml-1 cursor-pointer"
                      title="Copy Actor ID"
                    >
                      {copiedKey === 'actorId' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-750 space-y-1">
                <span className="text-slate-400 uppercase font-bold text-[10px]">Entity Target</span>
                <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                  {getEntityIcon(inspectLog.entityType)}
                  <span>{inspectLog.entityType || 'N/A'}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-750 space-y-1">
                <span className="text-slate-400 uppercase font-bold text-[10px]">Entity ID</span>
                <div className="flex items-center justify-between font-mono text-[11px] text-slate-700 dark:text-slate-300">
                  <span className="truncate">{inspectLog.entityId || 'N/A'}</span>
                  {inspectLog.entityId && (
                    <button
                      type="button"
                      onClick={() => handleCopy(inspectLog.entityId, 'entityId')}
                      className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 ml-1 cursor-pointer"
                      title="Copy Entity ID"
                    >
                      {copiedKey === 'entityId' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Details Box */}
            <div className="space-y-1.5">
              <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                Full Activity Payload / Details
              </span>
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words max-h-60 overflow-y-auto">
                {inspectLog.details || 'No additional details captured'}
              </div>
            </div>

            {/* Log ID Tag */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
              <span className="font-mono">Log ID: {inspectLog.id}</span>
              <button
                type="button"
                onClick={() => handleCopy(inspectLog.id, 'logId')}
                className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                {copiedKey === 'logId' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> Copy Log ID
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
