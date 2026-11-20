import React, { useEffect, useState, useMemo } from 'react';
import { claimApi } from '../../api';
import { Claim, ClaimStatus, ResolutionType } from '../../types';
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  Wrench,
  RefreshCw,
  Send,
  CheckCircle2,
  Search,
  Copy,
  Check,
  User,
  Mail,
  Calendar,
  Package,
  Star,
  AlertTriangle,
  FileText,
  Layers,
  CheckCheck,
  Ban,
  Activity,
  ArrowUpRight,
  X,
  ArrowLeft
} from 'lucide-react';

type TabFilter = 'ALL' | 'NEEDS_ACTION' | 'AWAITING_INFO' | 'IN_SERVICE' | 'COMPLETED' | 'CLOSED';

export const RetailerClaims: React.FC = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabFilter>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Mobile View Switcher (for small screens < lg)
  const [mobileView, setMobileView] = useState<'LIST' | 'DETAIL'>('LIST');

  // Action modals
  const [decisionModal, setDecisionModal] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [resolutionType, setResolutionType] = useState<ResolutionType>('REPAIR');
  const [decisionReason, setDecisionReason] = useState('');

  const [infoModal, setInfoModal] = useState(false);
  const [infoReason, setInfoReason] = useState('');

  const [serviceModal, setServiceModal] = useState(false);
  const [serviceNote, setServiceNote] = useState('');

  const [completeModal, setCompleteModal] = useState(false);
  const [completeNotes, setCompleteNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const fetchClaims = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setIsRefreshing(true);

      const res = await claimApi.getRetailerClaims(undefined, 0, 100);
      const list = res.content || [];
      setClaims(list);

      // Keep selected claim in sync with latest data
      if (selectedClaim) {
        const found = list.find((c) => c.id === selectedClaim.id);
        if (found) {
          const updated = await claimApi.getClaimById(found.id);
          setSelectedClaim(updated);
        }
      } else if (list.length > 0) {
        setSelectedClaim(list[0]);
      }
    } catch (err) {
      console.error('Failed to load claims', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Status transitions
  const handleStartReview = async (id: string) => {
    try {
      setSubmitting(true);
      const updated = await claimApi.startReview(id);
      setSelectedClaim(updated);
      await fetchClaims(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error starting review.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaim || !decisionModal) return;
    setSubmitting(true);
    try {
      const isApproved = decisionModal === 'APPROVE';
      const updated = await claimApi.makeDecision(
        selectedClaim.id,
        isApproved,
        isApproved ? resolutionType : undefined,
        decisionReason.trim() || undefined
      );
      setSelectedClaim(updated);
      setDecisionModal(null);
      setDecisionReason('');
      await fetchClaims(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error recording claim decision.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaim) return;
    setSubmitting(true);
    try {
      const updated = await claimApi.requestInfo(selectedClaim.id, infoReason.trim());
      setSelectedClaim(updated);
      setInfoModal(false);
      setInfoReason('');
      await fetchClaims(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error requesting information.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaim) return;
    setSubmitting(true);
    try {
      const updated = await claimApi.updateProgress(selectedClaim.id, serviceNote.trim());
      setSelectedClaim(updated);
      setServiceModal(false);
      setServiceNote('');
      await fetchClaims(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error updating service progress.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaim) return;
    setSubmitting(true);
    try {
      const updated = await claimApi.completeClaim(selectedClaim.id, completeNotes.trim());
      setSelectedClaim(updated);
      setCompleteModal(false);
      setCompleteNotes('');
      await fetchClaims(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error completing claim.');
    } finally {
      setSubmitting(false);
    }
  };

  // KPI Metrics Calculation
  const stats = useMemo(() => {
    const total = claims.length;
    const needsAction = claims.filter(
      (c) => c.currentStatus === 'SUBMITTED' || c.currentStatus === 'UNDER_REVIEW'
    ).length;
    const awaitingInfo = claims.filter(
      (c) => c.currentStatus === 'ADDITIONAL_INFO_REQUIRED'
    ).length;
    const inService = claims.filter(
      (c) => c.currentStatus === 'APPROVED' || c.currentStatus === 'IN_PROGRESS'
    ).length;
    const completed = claims.filter((c) => c.currentStatus === 'COMPLETED').length;
    const closed = claims.filter(
      (c) => c.currentStatus === 'REJECTED' || c.currentStatus === 'CANCELLED'
    ).length;

    return { total, needsAction, awaitingInfo, inService, completed, closed };
  }, [claims]);

  // Filtered Claims based on activeTab & search query
  const filteredClaims = useMemo(() => {
    return claims.filter((c) => {
      // 6-Card Category Filtering
      if (activeTab === 'NEEDS_ACTION' && c.currentStatus !== 'SUBMITTED' && c.currentStatus !== 'UNDER_REVIEW') {
        return false;
      }
      if (activeTab === 'AWAITING_INFO' && c.currentStatus !== 'ADDITIONAL_INFO_REQUIRED') {
        return false;
      }
      if (activeTab === 'IN_SERVICE' && c.currentStatus !== 'APPROVED' && c.currentStatus !== 'IN_PROGRESS') {
        return false;
      }
      if (activeTab === 'COMPLETED' && c.currentStatus !== 'COMPLETED') {
        return false;
      }
      if (activeTab === 'CLOSED' && c.currentStatus !== 'REJECTED' && c.currentStatus !== 'CANCELLED') {
        return false;
      }

      // Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesProduct = c.productName?.toLowerCase().includes(q);
        const matchesCustomer = c.customerName?.toLowerCase().includes(q);
        const matchesEmail = c.customerEmail?.toLowerCase().includes(q);
        const matchesSerial = c.serialNumber?.toLowerCase().includes(q);
        const matchesId = c.id?.toLowerCase().includes(q);
        const matchesIssue = c.issueDescription?.toLowerCase().includes(q);
        if (!matchesProduct && !matchesCustomer && !matchesEmail && !matchesSerial && !matchesId && !matchesIssue) {
          return false;
        }
      }

      return true;
    });
  }, [claims, activeTab, searchQuery]);

  // Make the 2 detail cards below 100% responsive to shifting/changing above cards
  useEffect(() => {
    if (filteredClaims.length > 0) {
      // If currently selected claim is still present in the filtered view, retain it; otherwise select the 1st claim
      const stillPresent = filteredClaims.find((c) => c.id === selectedClaim?.id);
      if (!stillPresent) {
        setSelectedClaim(filteredClaims[0]);
      }
    } else {
      setSelectedClaim(null);
    }
  }, [activeTab, searchQuery, claims]);

  const handleCardClick = (tab: TabFilter) => {
    setActiveTab(tab);
    setMobileView('LIST');
  };

  const getStatusConfig = (status: ClaimStatus) => {
    switch (status) {
      case 'SUBMITTED':
        return {
          label: 'Submitted',
          badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
          dotClass: 'bg-amber-500',
          icon: Clock,
        };
      case 'UNDER_REVIEW':
        return {
          label: 'Under Review',
          badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
          dotClass: 'bg-blue-500',
          icon: Activity,
        };
      case 'ADDITIONAL_INFO_REQUIRED':
        return {
          label: 'Awaiting Info',
          badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200 dark:border-purple-800/60',
          dotClass: 'bg-purple-500',
          icon: MessageSquare,
        };
      case 'APPROVED':
        return {
          label: 'Approved',
          badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
          dotClass: 'bg-emerald-500',
          icon: CheckCircle2,
        };
      case 'IN_PROGRESS':
        return {
          label: 'In Service',
          badgeClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60',
          dotClass: 'bg-indigo-500',
          icon: Wrench,
        };
      case 'COMPLETED':
        return {
          label: 'Completed',
          badgeClass: 'bg-teal-100 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300 border-teal-200 dark:border-teal-800/60',
          dotClass: 'bg-teal-500',
          icon: CheckCheck,
        };
      case 'REJECTED':
        return {
          label: 'Rejected',
          badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
          dotClass: 'bg-rose-500',
          icon: XCircle,
        };
      case 'CANCELLED':
        return {
          label: 'Cancelled',
          badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
          dotClass: 'bg-slate-400',
          icon: Ban,
        };
      default:
        return {
          label: status,
          badgeClass: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
          dotClass: 'bg-slate-400',
          icon: Clock,
        };
    }
  };

  const renderStatusBadge = (status: ClaimStatus) => {
    const config = getStatusConfig(status);
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.badgeClass}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`}></span>
        {config.label}
      </span>
    );
  };

  const getStageIndex = (status: ClaimStatus) => {
    switch (status) {
      case 'SUBMITTED':
        return 0;
      case 'UNDER_REVIEW':
      case 'ADDITIONAL_INFO_REQUIRED':
        return 1;
      case 'APPROVED':
      case 'IN_PROGRESS':
        return 2;
      case 'COMPLETED':
        return 3;
      default:
        return -1;
    }
  };

  // Card theme styler with pleasant hover & active colors
  const getCardTheme = (tab: TabFilter) => {
    const isActive = activeTab === tab;
    switch (tab) {
      case 'ALL':
        return {
          card: isActive
            ? 'bg-slate-100 dark:bg-slate-800/90 border-slate-400 dark:border-slate-500 text-slate-900 dark:text-slate-100 shadow-sm ring-2 ring-slate-400/25'
            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200/90 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-650 hover:bg-slate-50 dark:hover:bg-slate-800/60 shadow-2xs',
          iconBg: isActive
            ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
          icon: Layers,
          label: 'All Claims',
          count: stats.total,
        };
      case 'NEEDS_ACTION':
        return {
          card: isActive
            ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-400 dark:border-amber-600/80 text-amber-950 dark:text-amber-100 shadow-sm ring-2 ring-amber-500/25'
            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200/90 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700/80 hover:bg-amber-50/40 dark:hover:bg-amber-950/20 shadow-2xs',
          iconBg: isActive
            ? 'bg-amber-500 text-white shadow-xs'
            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
          icon: AlertTriangle,
          label: 'Needs Action',
          count: stats.needsAction,
        };
      case 'AWAITING_INFO':
        return {
          card: isActive
            ? 'bg-purple-50/90 dark:bg-purple-950/40 border-purple-400 dark:border-purple-600/80 text-purple-950 dark:text-purple-100 shadow-sm ring-2 ring-purple-500/25'
            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200/90 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700/80 hover:bg-purple-50/40 dark:hover:bg-purple-950/20 shadow-2xs',
          iconBg: isActive
            ? 'bg-purple-500 text-white shadow-xs'
            : 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400',
          icon: MessageSquare,
          label: 'Awaiting Info',
          count: stats.awaitingInfo,
        };
      case 'IN_SERVICE':
        return {
          card: isActive
            ? 'bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-600/80 text-indigo-950 dark:text-indigo-100 shadow-sm ring-2 ring-indigo-500/25'
            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200/90 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700/80 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 shadow-2xs',
          iconBg: isActive
            ? 'bg-indigo-500 text-white shadow-xs'
            : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400',
          icon: Wrench,
          label: 'In Service',
          count: stats.inService,
        };
      case 'COMPLETED':
        return {
          card: isActive
            ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-600/80 text-emerald-950 dark:text-emerald-100 shadow-sm ring-2 ring-emerald-500/25'
            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200/90 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700/80 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 shadow-2xs',
          iconBg: isActive
            ? 'bg-emerald-500 text-white shadow-xs'
            : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
          icon: CheckCheck,
          label: 'Completed',
          count: stats.completed,
        };
      case 'CLOSED':
        return {
          card: isActive
            ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-400 dark:border-rose-600/80 text-rose-950 dark:text-rose-100 shadow-sm ring-2 ring-rose-500/25'
            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200/90 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-700/80 hover:bg-rose-50/40 dark:hover:bg-rose-950/20 shadow-2xs',
          iconBg: isActive
            ? 'bg-rose-500 text-white shadow-xs'
            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400',
          icon: XCircle,
          label: 'Closed / Rej.',
          count: stats.closed,
        };
    }
  };

  const getEmptyStateMessage = () => {
    switch (activeTab) {
      case 'NEEDS_ACTION':
        return 'No claims currently need action. All submitted RMAs are evaluated or in progress.';
      case 'AWAITING_INFO':
        return 'No claims are waiting on customer evidence or response.';
      case 'IN_SERVICE':
        return 'No claims are currently undergoing hardware repair or replacement.';
      case 'COMPLETED':
        return 'No completed claims yet in this period.';
      case 'CLOSED':
        return 'No rejected or cancelled claims found.';
      default:
        return 'No matching claims found with the current search query.';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/60">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Claims & Service Operations</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Audit RMA requests, make warranty coverage decisions, and log repair milestones in real time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchClaims(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs transition cursor-pointer disabled:opacity-50"
            title="Refresh Claims"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 6 Responsive KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {(['ALL', 'NEEDS_ACTION', 'AWAITING_INFO', 'IN_SERVICE', 'COMPLETED', 'CLOSED'] as TabFilter[]).map((tab) => {
          const theme = getCardTheme(tab);
          const Icon = theme.icon;
          const isSelected = activeTab === tab;

          return (
            <button
              key={tab}
              type="button"
              onClick={() => handleCardClick(tab)}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer relative overflow-hidden group ${theme.card}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider opacity-80 truncate">
                  {theme.label}
                </span>
                <span className={`p-1.5 rounded-lg transition-transform group-hover:scale-105 shrink-0 ${theme.iconBg}`}>
                  <Icon className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-2xl font-bold flex items-center gap-1.5">
                {theme.count}
                {tab === 'NEEDS_ACTION' && stats.needsAction > 0 && !isSelected && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Clean, Non-redundant Search & Filter Bar */}
      <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, email, product, S/N, or Claim ID..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status context & Reset action */}
        <div className="flex items-center justify-between sm:justify-end gap-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            Showing <strong className="text-slate-800 dark:text-slate-200">{filteredClaims.length}</strong> of{' '}
            {claims.length}
          </span>

          {(searchQuery || activeTab !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveTab('ALL');
              }}
              className="px-2.5 py-1 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Mobile Switcher (Visible only below lg) */}
      <div className="flex items-center lg:hidden gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setMobileView('LIST')}
          className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer ${
            mobileView === 'LIST'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Queue List ({filteredClaims.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileView('DETAIL')}
          disabled={!selectedClaim}
          className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer disabled:opacity-40 ${
            mobileView === 'DETAIL'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          {selectedClaim ? 'Selected Details' : 'No Claim Selected'}
        </button>
      </div>

      {/* Main Workspace: Left Claims Queue + Right Action & Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 xl:gap-6 items-start">
        {/* Left Column: Claims Master List (Card 1) */}
        <div
          className={`lg:col-span-5 xl:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col max-h-[82vh] overflow-hidden ${
            mobileView === 'DETAIL' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* List Header */}
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                {getCardTheme(activeTab).label} Queue
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {filteredClaims.length}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              {filteredClaims.length > 0 ? 'Click to inspect' : 'Queue clear'}
            </span>
          </div>

          {/* List Content */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 overflow-y-auto flex-1">
            {loading ? (
              <div className="p-12 text-center text-slate-400 dark:text-slate-500 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
                <div className="text-xs font-medium">Loading claims queue...</div>
              </div>
            ) : filteredClaims.length === 0 ? (
              <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">Queue is empty</div>
                <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                  {getEmptyStateMessage()}
                </p>
                {(searchQuery || activeTab !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setActiveTab('ALL');
                    }}
                    className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
                  >
                    View all claims
                  </button>
                )}
              </div>
            ) : (
              filteredClaims.map((c) => {
                const isSelected = selectedClaim?.id === c.id;
                const isUrgent = c.currentStatus === 'SUBMITTED';

                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedClaim(c);
                      setMobileView('DETAIL');
                    }}
                    className={`p-4 cursor-pointer transition-all duration-150 relative ${
                      isSelected
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-l-4 border-indigo-600 shadow-2xs'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                          {c.productName}
                        </div>
                        {c.serialNumber ? (
                          <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                            S/N: {c.serialNumber}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic block">No S/N provided</span>
                        )}
                      </div>
                      <div className="shrink-0">{renderStatusBadge(c.currentStatus)}</div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 my-1.5 leading-relaxed">
                      {c.issueDescription}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 mt-1 border-t border-slate-100/80 dark:border-slate-800/60">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium truncate max-w-[140px]">
                        <User className="w-3 h-3 shrink-0 text-slate-400" />
                        <span className="truncate">{c.customerName || 'Customer'}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isUrgent && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 animate-pulse">
                            Action
                          </span>
                        )}
                        {c.resolutionType && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                            {c.resolutionType}
                          </span>
                        )}
                        <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Workspace & Action Center (Card 2) */}
        <div
          className={`lg:col-span-7 xl:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden ${
            mobileView === 'LIST' ? 'hidden lg:block' : 'block'
          }`}
        >
          {selectedClaim ? (
            <div>
              {/* Mobile Back Button */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 lg:hidden flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setMobileView('LIST')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Queue ({filteredClaims.length})
                </button>
                <span className="text-xs text-slate-400 font-mono">
                  #{selectedClaim.id.slice(0, 8)}
                </span>
              </div>

              {/* Detailed Header Banner */}
              <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-white to-indigo-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        RMA #{selectedClaim.id.slice(0, 8)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(selectedClaim.id, 'claim-id')}
                        className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-mono transition cursor-pointer"
                        title="Copy Claim UUID"
                      >
                        {copiedId === 'claim-id' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copy ID
                          </>
                        )}
                      </button>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {selectedClaim.productName}
                    </h2>

                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> Filed {new Date(selectedClaim.createdAt).toLocaleString()}
                      </span>
                      {selectedClaim.serialNumber && (
                        <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          S/N: {selectedClaim.serialNumber}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
                    <div>{renderStatusBadge(selectedClaim.currentStatus)}</div>
                    {selectedClaim.resolutionType && (
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Resolution: {selectedClaim.resolutionType}
                      </span>
                    )}
                  </div>
                </div>

                {/* 4-Step Lifecycle Progress Tracker */}
                {selectedClaim.currentStatus !== 'REJECTED' && selectedClaim.currentStatus !== 'CANCELLED' && (
                  <div className="mt-6 pt-5 border-t border-slate-200/70 dark:border-slate-800">
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {[
                        { title: '1. Submitted', desc: 'Claim Registered' },
                        { title: '2. Under Review', desc: 'Evaluating Terms' },
                        { title: '3. In Service', desc: 'Repair / Replacement' },
                        { title: '4. Completed', desc: 'RMA Resolved' },
                      ].map((step, idx) => {
                        const currentStage = getStageIndex(selectedClaim.currentStatus);
                        const isDone = currentStage > idx;
                        const isCurrent = currentStage === idx;

                        return (
                          <div key={idx} className="space-y-1.5">
                            <div className="relative flex items-center justify-center">
                              <div
                                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                                  isDone
                                    ? 'bg-emerald-600 text-white'
                                    : isCurrent
                                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/20'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                {isDone ? <Check className="w-4 h-4" /> : idx + 1}
                              </div>
                            </div>
                            <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight">
                              {step.title}
                            </div>
                            <div className="text-[10px] text-slate-400 hidden sm:block">{step.desc}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic Action Toolbar */}
              <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Operational Controls
                  </span>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Stage 1: Submitted -> Start Review */}
                    {selectedClaim.currentStatus === 'SUBMITTED' && (
                      <button
                        type="button"
                        onClick={() => handleStartReview(selectedClaim.id)}
                        disabled={submitting}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Activity className="w-3.5 h-3.5" /> Start Review & Investigation
                      </button>
                    )}

                    {/* Stage 2: Under Review -> Decision or Info Request */}
                    {selectedClaim.currentStatus === 'UNDER_REVIEW' && (
                      <>
                        <button
                          type="button"
                          onClick={() => setDecisionModal('APPROVE')}
                          disabled={submitting}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Approve Claim
                        </button>
                        <button
                          type="button"
                          onClick={() => setInfoModal(true)}
                          disabled={submitting}
                          className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> Request Info
                        </button>
                        <button
                          type="button"
                          onClick={() => setDecisionModal('REJECT')}
                          disabled={submitting}
                          className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject Claim
                        </button>
                      </>
                    )}

                    {/* Stage 3: Approved or In Progress -> Add Notes or Complete */}
                    {(selectedClaim.currentStatus === 'APPROVED' || selectedClaim.currentStatus === 'IN_PROGRESS') && (
                      <>
                        <button
                          type="button"
                          onClick={() => setServiceModal(true)}
                          disabled={submitting}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Wrench className="w-3.5 h-3.5" /> Log Service Update
                        </button>
                        <button
                          type="button"
                          onClick={() => setCompleteModal(true)}
                          disabled={submitting}
                          className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <CheckCheck className="w-3.5 h-3.5" /> Mark Completed & Resolved
                        </button>
                      </>
                    )}

                    {selectedClaim.currentStatus === 'ADDITIONAL_INFO_REQUIRED' && (
                      <div className="flex items-center gap-1.5 text-xs text-purple-700 dark:text-purple-300 font-semibold bg-purple-50 dark:bg-purple-950/50 px-3 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800/60">
                        <Clock className="w-3.5 h-3.5" /> Awaiting customer response with required evidence.
                      </div>
                    )}

                    {selectedClaim.currentStatus === 'COMPLETED' && (
                      <div className="flex items-center gap-1.5 text-xs text-teal-700 dark:text-teal-300 font-semibold bg-teal-50 dark:bg-teal-950/50 px-3 py-1.5 rounded-lg border border-teal-200 dark:border-teal-800/60">
                        <CheckCheck className="w-4 h-4" /> Service cycle completed & ready for customer.
                      </div>
                    )}

                    {selectedClaim.currentStatus === 'REJECTED' && (
                      <div className="flex items-center gap-1.5 text-xs text-rose-700 dark:text-rose-300 font-semibold bg-rose-50 dark:bg-rose-950/50 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800/60">
                        <XCircle className="w-4 h-4" /> Claim Rejected. Decision finalized.
                      </div>
                    )}

                    {selectedClaim.currentStatus === 'CANCELLED' && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-semibold bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        <Ban className="w-4 h-4" /> Cancelled by customer.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Body Panels */}
              <div className="p-5 sm:p-6 space-y-6">
                {/* 2-Column Info Grid: Customer Details & Warranty Asset */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Customer Card */}
                  <div className="p-4 bg-slate-50/70 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <User className="w-3.5 h-3.5 text-indigo-500" /> Customer Information
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {selectedClaim.customerName || 'Registered Customer'}
                      </div>
                      {selectedClaim.customerEmail && (
                        <a
                          href={`mailto:${selectedClaim.customerEmail}`}
                          className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          <Mail className="w-3 h-3" /> {selectedClaim.customerEmail}
                        </a>
                      )}
                      <div className="text-[11px] font-mono text-slate-400">
                        Cust. ID: {selectedClaim.customerId}
                      </div>
                    </div>
                  </div>

                  {/* Warranty & Product Asset */}
                  <div className="p-4 bg-slate-50/70 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <Package className="w-3.5 h-3.5 text-indigo-500" /> Product & Warranty Coverage
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {selectedClaim.productName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                        <span>Serial Number:</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {selectedClaim.serialNumber || 'N/A'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center justify-between">
                        <span>Warranty Ref:</span>
                        <span className="font-mono">{selectedClaim.warrantyId.slice(0, 12)}...</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Reported Issue */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Customer Problem Description
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">As reported at submission</span>
                  </div>
                  <div className="p-4 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 text-sm text-slate-800 dark:text-slate-200 leading-relaxed shadow-2xs">
                    "{selectedClaim.issueDescription}"
                  </div>
                </div>

                {/* Attached Evidence References */}
                {selectedClaim.evidenceReferences && selectedClaim.evidenceReferences.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Customer Attached Evidence ({selectedClaim.evidenceReferences.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {selectedClaim.evidenceReferences.map((ref, idx) => (
                        <a
                          key={idx}
                          href={ref}
                          target="_blank"
                          rel="noreferrer"
                          className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition group flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">
                              Attachment {idx + 1}
                            </span>
                          </div>
                          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rejection / Cancellation Notice if applicable */}
                {selectedClaim.decisionReason && (
                  <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-2xl space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-rose-800 dark:text-rose-300 uppercase">
                      <XCircle className="w-4 h-4" /> Official Decision / Rejection Note
                    </div>
                    <p className="text-sm text-rose-900 dark:text-rose-200">{selectedClaim.decisionReason}</p>
                    {selectedClaim.decisionBy && (
                      <div className="text-[11px] text-rose-600 dark:text-rose-400">
                        Decided by {selectedClaim.decisionBy} on{' '}
                        {selectedClaim.decisionAt ? new Date(selectedClaim.decisionAt).toLocaleString() : 'N/A'}
                      </div>
                    )}
                  </div>
                )}

                {selectedClaim.cancellationReason && (
                  <div className="p-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-1">
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                      Cancellation Reason Provided by Customer
                    </div>
                    <p className="text-sm text-slate-800 dark:text-slate-200">{selectedClaim.cancellationReason}</p>
                  </div>
                )}

                {/* Final Resolution Notes */}
                {selectedClaim.resolutionNotes && (
                  <div className="p-4 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 rounded-2xl space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-teal-800 dark:text-teal-300 uppercase">
                      <CheckCheck className="w-4 h-4" /> Final Service Resolution Summary
                    </div>
                    <p className="text-sm text-teal-900 dark:text-teal-200">{selectedClaim.resolutionNotes}</p>
                  </div>
                )}

                {/* Customer Satisfaction Feedback (if completed and rated) */}
                {selectedClaim.customerRating && (
                  <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> Customer Service Review
                      </span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= (selectedClaim.customerRating || 0)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-300 dark:text-slate-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {selectedClaim.customerFeedback && (
                      <p className="text-sm text-slate-800 dark:text-slate-200 italic">
                        "{selectedClaim.customerFeedback}"
                      </p>
                    )}
                    {selectedClaim.feedbackSubmittedAt && (
                      <div className="text-[11px] text-amber-700 dark:text-amber-400">
                        Submitted {new Date(selectedClaim.feedbackSubmittedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}

                {/* Service Progress Log */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-indigo-500" /> Service Workshop Notes
                    </span>

                    {(selectedClaim.currentStatus === 'APPROVED' || selectedClaim.currentStatus === 'IN_PROGRESS') && (
                      <button
                        type="button"
                        onClick={() => setServiceModal(true)}
                        className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        + Add Update
                      </button>
                    )}
                  </div>

                  {selectedClaim.serviceNotes && selectedClaim.serviceNotes.length > 0 ? (
                    <div className="space-y-2.5">
                      {selectedClaim.serviceNotes.map((sn, i) => (
                        <div
                          key={i}
                          className="p-3.5 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-xl border border-indigo-100/80 dark:border-indigo-800/40 space-y-1"
                        >
                          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{sn.note}</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-2">
                            <span>Logged by {sn.addedBy}</span>
                            <span>&bull;</span>
                            <span>{new Date(sn.addedAt).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center text-xs text-slate-400">
                      No workshop notes recorded yet.
                    </div>
                  )}
                </div>

                {/* Auditable Status Transition Timeline */}
                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> Audited Lifecycle Timeline
                  </span>

                  <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-700 space-y-4 ml-2">
                    {selectedClaim.statusHistory?.map((h) => (
                      <div key={h.id} className="relative group">
                        <div className="absolute -left-[31px] top-1 bg-white dark:bg-slate-900 border-2 border-indigo-600 rounded-full w-3.5 h-3.5"></div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {h.newStatus.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(h.changedAt).toLocaleString()}
                          </span>
                        </div>
                        {h.note && (
                          <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{h.note}</div>
                        )}
                        <div className="text-[10px] text-slate-400 mt-0.5">Updated by {h.changedBy}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-16 text-center text-slate-400 dark:text-slate-500 space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div className="text-base font-bold text-slate-700 dark:text-slate-300">No Claim Selected</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {getEmptyStateMessage()}
              </p>
              {(searchQuery || activeTab !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveTab('ALL');
                  }}
                  className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
                >
                  View all claims
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Decision Modal (Approve or Reject) */}
      {decisionModal && selectedClaim && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {decisionModal === 'APPROVE' ? 'Approve Warranty Coverage' : 'Reject Warranty Claim'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Product: <strong className="text-slate-700 dark:text-slate-300">{selectedClaim.productName}</strong>
              </p>
            </div>

            <form onSubmit={handleDecisionSubmit} className="space-y-4">
              {decisionModal === 'APPROVE' ? (
                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Select Resolution Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setResolutionType('REPAIR')}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        resolutionType === 'REPAIR'
                          ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
                        <Wrench className="w-3.5 h-3.5" /> REPAIR
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Technician repair and component restoration
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setResolutionType('REPLACEMENT')}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        resolutionType === 'REPLACEMENT'
                          ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
                        <Package className="w-3.5 h-3.5" /> REPLACEMENT
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Brand new replacement unit provision
                      </div>
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Approval Notes / Instructions (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={decisionReason}
                      onChange={(e) => setDecisionReason(e.target.value)}
                      placeholder="e.g. Approved under manufacturer defect policy. Dispatched to service bench."
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Mandatory Rejection Reason <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={decisionReason}
                    onChange={(e) => setDecisionReason(e.target.value)}
                    placeholder="Provide clear technical justification (e.g. Liquid ingress observed, unauthorized disassembly)..."
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />

                  {/* Suggested quick chips */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-semibold">Quick reason:</span>
                    {[
                      'Liquid or physical damage',
                      'Unauthorized modification',
                      'Coverage policy expired',
                      'Normal wear & tear',
                    ].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setDecisionReason(chip)}
                        className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setDecisionModal(null);
                    setDecisionReason('');
                  }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || (decisionModal === 'REJECT' && !decisionReason.trim())}
                  className={`px-4 py-2 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50 ${
                    decisionModal === 'APPROVE'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {submitting ? 'Recording...' : decisionModal === 'APPROVE' ? 'Confirm Approval' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Info Modal */}
      {infoModal && selectedClaim && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Request Information from Customer</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                The claim status will be updated to <strong>AWAITING_INFO</strong>. Once the customer replies with details, it automatically returns to UNDER_REVIEW.
              </p>
            </div>

            <form onSubmit={handleInfoSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Required Information or Photos <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={infoReason}
                  onChange={(e) => setInfoReason(e.target.value)}
                  placeholder="e.g. Please provide a clear photograph of the device serial label and the error code message..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />

                {/* Quick Chips */}
                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  <span className="text-[10px] text-slate-400 font-semibold">Suggested:</span>
                  {[
                    'Photo of serial number label',
                    'Screenshot / Photo of error code',
                    'Video of malfunction',
                    'Original purchase receipt',
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setInfoReason(chip)}
                      className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setInfoModal(false);
                    setInfoReason('');
                  }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !infoReason.trim()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Sending...' : 'Send Request to Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Service Progress Modal */}
      {serviceModal && selectedClaim && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Log Workshop Service Update</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Visible to the customer on their live tracking timeline.
              </p>
            </div>

            <form onSubmit={handleServiceSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Service Progress Note <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={serviceNote}
                  onChange={(e) => setServiceNote(e.target.value)}
                  placeholder="e.g. Diagnostic complete: Main power inverter required. Component dispatched from factory warehouse..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                {/* Quick Chips */}
                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  <span className="text-[10px] text-slate-400 font-semibold">Quick note:</span>
                  {[
                    'Initial diagnostic examination complete',
                    'Replacement components ordered',
                    'Internal hardware repair underway',
                    'Full diagnostic testing in progress',
                    'Device sanitized & ready for collection',
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setServiceNote(chip)}
                      className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setServiceModal(false);
                    setServiceNote('');
                  }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !serviceNote.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Add Progress Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Claim Modal */}
      {completeModal && selectedClaim && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Finalize & Complete Claim</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Concludes active service. The customer will be prompted to leave a quality rating and feedback.
              </p>
            </div>

            <form onSubmit={handleCompleteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Final Resolution Notes <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={completeNotes}
                  onChange={(e) => setCompleteNotes(e.target.value)}
                  placeholder="e.g. Logic board and screen replaced. Bench tests passed with 100% calibration. Unit packed for customer collection."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />

                {/* Quick Chips */}
                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  <span className="text-[10px] text-slate-400 font-semibold">Suggested:</span>
                  {[
                    'Repaired, tested, and ready for customer pickup',
                    'Brand new replacement unit prepared and packaged',
                    'Shipped back to customer via express courier',
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setCompleteNotes(chip)}
                      className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setCompleteModal(false);
                    setCompleteNotes('');
                  }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !completeNotes.trim()}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Completing...' : 'Mark Completed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
