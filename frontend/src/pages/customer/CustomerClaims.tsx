import React, { useEffect, useRef, useState, useMemo } from 'react';
import { claimApi } from '../../api';
import { Claim, ClaimStatus } from '../../types';
import {
  FileText,
  Clock,
  Ban,
  MessageSquare,
  Wrench,
  RefreshCw,
  Send,
  CheckCircle2,
  Star,
  Search,
  Copy,
  Check,
  User,
  Store,
  Calendar,
  Package,
  AlertTriangle,
  Layers,
  CheckCheck,
  Activity,
  ArrowUpRight,
  X,
  ArrowLeft,
  Upload,
  Loader2,
  Plus,
  AlertCircle,
  ZoomIn,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ImagePreviewModal } from '../../components/ImagePreviewModal';
import { getAccessibleImageUrl } from '../../utils/imageUrl';

interface SelectedImage {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  sizeFormatted: string;
  uploading: boolean;
  serverUrl?: string;
  error?: string;
}

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png'];
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB per file

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

type CustomerTabFilter = 'ALL' | 'IN_REVIEW' | 'ACTION_REQUIRED' | 'IN_SERVICE' | 'COMPLETED';

export const CustomerClaims: React.FC = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<CustomerTabFilter>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Mobile View Switcher (for small screens < lg)
  const [mobileView, setMobileView] = useState<'LIST' | 'DETAIL'>('LIST');

  // Cancel Modal
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Reply Modal & Image Upload State
  const [replyModal, setReplyModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyImages, setReplyImages] = useState<SelectedImage[]>([]);
  const [replyUploadError, setReplyUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const replyFileInputRef = useRef<HTMLInputElement | null>(null);
  const replyImagesRef = useRef<SelectedImage[]>([]);
  replyImagesRef.current = replyImages;

  // Feedback Modal
  const [feedbackModal, setFeedbackModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');

  // Full-screen Image Preview Lightbox Modal
  const [previewModalImage, setPreviewModalImage] = useState<{ url: string; title?: string } | null>(null);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      replyImagesRef.current.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
  }, []);

  const closeReplyModal = () => {
    setReplyModal(false);
    setReplyText('');
    setReplyUploadError(null);
    replyImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setReplyImages([]);
  };

  const processReplyFiles = (fileList: File[]) => {
    setReplyUploadError(null);
    if (!fileList || fileList.length === 0) return;

    const validFiles: File[] = [];
    const errors: string[] = [];

    fileList.forEach((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const isExtAllowed = ALLOWED_EXTENSIONS.includes(ext);
      const isMimeAllowed = ALLOWED_MIME_TYPES.includes(file.type);

      if (!isExtAllowed || (!isMimeAllowed && file.type)) {
        errors.push(`"${file.name}" is not supported. Only JPG, JPEG, and PNG are allowed.`);
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        errors.push(`"${file.name}" exceeds the 5 MB maximum limit (${formatFileSize(file.size)}).`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      setReplyUploadError(errors.join(' '));
    }

    if (validFiles.length === 0) return;

    const newItems: SelectedImage[] = validFiles.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      name: file.name,
      sizeFormatted: formatFileSize(file.size),
      uploading: true,
    }));

    setReplyImages((prev) => [...prev, ...newItems]);

    // Upload each image file to the backend
    newItems.forEach(async (item) => {
      try {
        const res = await claimApi.uploadEvidence(item.file);
        setReplyImages((prev) =>
          prev.map((img) =>
            img.id === item.id ? { ...img, uploading: false, serverUrl: res.url } : img
          )
        );
      } catch (err: any) {
        const msg = err.response?.data?.message || 'Upload failed. Please retry or remove.';
        setReplyImages((prev) =>
          prev.map((img) =>
            img.id === item.id ? { ...img, uploading: false, error: msg } : img
          )
        );
      }
    });
  };

  const handleRemoveReplyImage = (id: string) => {
    setReplyImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((img) => img.id !== id);
    });
  };

  const fetchClaims = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setIsRefreshing(true);

      const res = await claimApi.getCustomerClaims();
      const list = res.content || [];
      setClaims(list);

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
      console.error('Failed to load customer claims', err);
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

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaim) return;
    setSubmitting(true);
    try {
      const updated = await claimApi.cancelClaim(selectedClaim.id, cancelReason.trim());
      setSelectedClaim(updated);
      setCancelModal(false);
      setCancelReason('');
      await fetchClaims(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error cancelling claim.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaim) return;

    if (replyImages.some((img) => img.uploading)) {
      alert('Please wait for image uploads to complete before submitting.');
      return;
    }

    if (replyImages.some((img) => img.error)) {
      alert('One or more images failed to upload. Please remove failed images before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const evidenceUrls = replyImages
        .map((img) => img.serverUrl)
        .filter((url): url is string => Boolean(url));

      const updated = await claimApi.replyInfo(
        selectedClaim.id,
        replyText.trim() || undefined,
        evidenceUrls.length > 0 ? evidenceUrls : undefined
      );

      setSelectedClaim(updated);
      closeReplyModal();
      await fetchClaims(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error sending reply.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaim) return;
    setSubmitting(true);
    try {
      const updated = await claimApi.submitFeedback(
        selectedClaim.id,
        rating,
        feedbackText.trim() || undefined
      );
      setSelectedClaim(updated);
      setFeedbackModal(false);
      setFeedbackText('');
      setRating(5);
      await fetchClaims(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error submitting feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  // KPI Metrics Calculation
  const stats = useMemo(() => {
    const total = claims.length;
    const inReview = claims.filter(
      (c) => c.currentStatus === 'SUBMITTED' || c.currentStatus === 'UNDER_REVIEW'
    ).length;
    const actionRequired = claims.filter(
      (c) => c.currentStatus === 'ADDITIONAL_INFO_REQUIRED'
    ).length;
    const inService = claims.filter(
      (c) => c.currentStatus === 'APPROVED' || c.currentStatus === 'IN_PROGRESS'
    ).length;
    const completed = claims.filter((c) => c.currentStatus === 'COMPLETED').length;

    return { total, inReview, actionRequired, inService, completed };
  }, [claims]);

  // Filtered Claims
  const filteredClaims = useMemo(() => {
    return claims.filter((c) => {
      if (activeTab === 'IN_REVIEW' && c.currentStatus !== 'SUBMITTED' && c.currentStatus !== 'UNDER_REVIEW') {
        return false;
      }
      if (activeTab === 'ACTION_REQUIRED' && c.currentStatus !== 'ADDITIONAL_INFO_REQUIRED') {
        return false;
      }
      if (activeTab === 'IN_SERVICE' && c.currentStatus !== 'APPROVED' && c.currentStatus !== 'IN_PROGRESS') {
        return false;
      }
      if (activeTab === 'COMPLETED' && c.currentStatus !== 'COMPLETED') {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesProduct = c.productName?.toLowerCase().includes(q);
        const matchesRetailer = c.retailerBusinessName?.toLowerCase().includes(q);
        const matchesSerial = c.serialNumber?.toLowerCase().includes(q);
        const matchesId = c.id?.toLowerCase().includes(q);
        const matchesIssue = c.issueDescription?.toLowerCase().includes(q);
        if (!matchesProduct && !matchesRetailer && !matchesSerial && !matchesId && !matchesIssue) {
          return false;
        }
      }

      return true;
    });
  }, [claims, activeTab, searchQuery]);

  // Keep selectedClaim in sync with activeTab and filter
  useEffect(() => {
    if (filteredClaims.length > 0) {
      const stillPresent = filteredClaims.find((c) => c.id === selectedClaim?.id);
      if (!stillPresent) {
        setSelectedClaim(filteredClaims[0]);
      }
    } else {
      setSelectedClaim(null);
    }
  }, [activeTab, searchQuery, claims]);

  const handleCardClick = (tab: CustomerTabFilter) => {
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
        };
      case 'UNDER_REVIEW':
        return {
          label: 'Under Review',
          badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
          dotClass: 'bg-blue-500',
        };
      case 'ADDITIONAL_INFO_REQUIRED':
        return {
          label: 'Action Required',
          badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200 dark:border-purple-800/60',
          dotClass: 'bg-purple-500',
        };
      case 'APPROVED':
        return {
          label: 'Approved',
          badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
          dotClass: 'bg-emerald-500',
        };
      case 'IN_PROGRESS':
        return {
          label: 'In Service',
          badgeClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60',
          dotClass: 'bg-indigo-500',
        };
      case 'COMPLETED':
        return {
          label: 'Completed',
          badgeClass: 'bg-teal-100 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300 border-teal-200 dark:border-teal-800/60',
          dotClass: 'bg-teal-500',
        };
      case 'REJECTED':
        return {
          label: 'Rejected',
          badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
          dotClass: 'bg-rose-500',
        };
      case 'CANCELLED':
        return {
          label: 'Cancelled',
          badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
          dotClass: 'bg-slate-400',
        };
      default:
        return {
          label: status,
          badgeClass: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
          dotClass: 'bg-slate-400',
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

  // Card themes
  const getCardTheme = (tab: CustomerTabFilter) => {
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
          label: 'Total Claims',
          count: stats.total,
        };
      case 'IN_REVIEW':
        return {
          card: isActive
            ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-400 dark:border-blue-600/80 text-blue-950 dark:text-blue-100 shadow-sm ring-2 ring-blue-500/25'
            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200/90 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700/80 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 shadow-2xs',
          iconBg: isActive
            ? 'bg-blue-500 text-white shadow-xs'
            : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400',
          icon: Activity,
          label: 'Under Review',
          count: stats.inReview,
        };
      case 'ACTION_REQUIRED':
        return {
          card: isActive
            ? 'bg-purple-50/90 dark:bg-purple-950/40 border-purple-400 dark:border-purple-600/80 text-purple-950 dark:text-purple-100 shadow-sm ring-2 ring-purple-500/25'
            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200/90 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700/80 hover:bg-purple-50/40 dark:hover:bg-purple-950/20 shadow-2xs',
          iconBg: isActive
            ? 'bg-purple-500 text-white shadow-xs'
            : 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400',
          icon: MessageSquare,
          label: 'Action Needed',
          count: stats.actionRequired,
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
          label: 'In Repair',
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
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/60">
              <FileText className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">My Claims & Service Tracking</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Monitor real-time retailer reviews, workshop repair notes, and after-sales service progress.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchClaims(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs transition cursor-pointer disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            to="/customer/submit-claim"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" /> Submit New Claim
          </Link>
        </div>
      </div>

      {/* 5 Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {(['ALL', 'IN_REVIEW', 'ACTION_REQUIRED', 'IN_SERVICE', 'COMPLETED'] as CustomerTabFilter[]).map((tab) => {
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
                {tab === 'ACTION_REQUIRED' && stats.actionRequired > 0 && !isSelected && (
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Clean, Non-redundant Search Bar */}
      <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product, retailer, S/N, or issue description..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
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

      {/* Mobile Switcher */}
      <div className="flex items-center lg:hidden gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setMobileView('LIST')}
          className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer ${
            mobileView === 'LIST'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Claims List ({filteredClaims.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileView('DETAIL')}
          disabled={!selectedClaim}
          className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer disabled:opacity-40 ${
            mobileView === 'DETAIL'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          {selectedClaim ? 'Claim Details' : 'No Claim Selected'}
        </button>
      </div>

      {/* Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 xl:gap-6 items-start">
        {/* Left List */}
        <div
          className={`lg:col-span-5 xl:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col max-h-[82vh] overflow-hidden ${
            mobileView === 'DETAIL' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              {getCardTheme(activeTab).label} Queue ({filteredClaims.length})
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 overflow-y-auto flex-1">
            {loading ? (
              <div className="p-12 text-center text-slate-400 dark:text-slate-500 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
                <div className="text-xs font-medium">Loading your claims...</div>
              </div>
            ) : filteredClaims.length === 0 ? (
              <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
                <FileText className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">No claims found</div>
                <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                  You have no warranty claims matching this filter category.
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
                const needsInfo = c.currentStatus === 'ADDITIONAL_INFO_REQUIRED';

                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedClaim(c);
                      setMobileView('DETAIL');
                    }}
                    className={`p-4 cursor-pointer transition-all duration-150 ${
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
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <Store className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{c.retailerBusinessName}</span>
                        </div>
                      </div>
                      <div className="shrink-0">{renderStatusBadge(c.currentStatus)}</div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 my-1.5 leading-relaxed">
                      {c.issueDescription}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 mt-1 border-t border-slate-100/80 dark:border-slate-800/60">
                      <span>Submitted: {new Date(c.createdAt).toLocaleDateString()}</span>
                      {needsInfo && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 animate-pulse">
                          Reply Needed
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Detail Workspace */}
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

              {/* Header */}
              <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-white to-indigo-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        Claim #{selectedClaim.id.slice(0, 8)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(selectedClaim.id, 'cust-claim-id')}
                        className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-indigo-600 font-mono transition cursor-pointer"
                        title="Copy Claim ID"
                      >
                        {copiedId === 'cust-claim-id' ? (
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
                        <Store className="w-3.5 h-3.5 text-indigo-500" /> {selectedClaim.retailerBusinessName}
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

                {/* 4-Step Progress Tracker */}
                {selectedClaim.currentStatus !== 'REJECTED' && selectedClaim.currentStatus !== 'CANCELLED' && (
                  <div className="mt-6 pt-5 border-t border-slate-200/70 dark:border-slate-800">
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {[
                        { title: '1. Submitted', desc: 'Received' },
                        { title: '2. In Review', desc: 'Evaluating' },
                        { title: '3. In Service', desc: 'Repairing' },
                        { title: '4. Ready', desc: 'Completed' },
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

              {/* Action Banner */}
              <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {selectedClaim.currentStatus === 'ADDITIONAL_INFO_REQUIRED' ? (
                    <div className="flex items-center justify-between w-full gap-3 flex-wrap sm:flex-nowrap">
                      <div className="flex items-center gap-2 text-xs font-semibold text-purple-800 dark:text-purple-300">
                        <MessageSquare className="w-4 h-4 text-purple-600 shrink-0" />
                        <span>The retailer needs additional information or photos from you.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setReplyModal(true)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer shrink-0"
                      >
                        Provide Requested Information
                      </button>
                    </div>
                  ) : (selectedClaim.currentStatus === 'SUBMITTED' || selectedClaim.currentStatus === 'UNDER_REVIEW') ? (
                    <div className="flex items-center justify-between w-full gap-3">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Your claim is currently under retailer assessment.
                      </span>
                      <button
                        type="button"
                        onClick={() => setCancelModal(true)}
                        className="px-3.5 py-1.5 border border-rose-300 dark:border-rose-800/60 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl text-xs font-semibold transition cursor-pointer"
                      >
                        Cancel Claim
                      </button>
                    </div>
                  ) : selectedClaim.currentStatus === 'COMPLETED' ? (
                    <div className="flex items-center justify-between w-full gap-3 flex-wrap sm:flex-nowrap">
                      <span className="text-xs font-semibold text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 shrink-0" /> Service completed! Your unit is ready.
                      </span>
                      {!selectedClaim.customerRating && (
                        <button
                          type="button"
                          onClick={() => setFeedbackModal(true)}
                          className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1 shrink-0"
                        >
                          <Star className="w-3.5 h-3.5 fill-current" /> Rate Service Experience
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Status: {selectedClaim.currentStatus.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
              </div>

              {/* Body Details */}
              <div className="p-5 sm:p-6 space-y-6">
                {/* Reported Problem */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Reported Problem Description
                  </span>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                    "{selectedClaim.issueDescription}"
                  </div>
                </div>

                {/* Supporting Images / Evidence References */}
                {selectedClaim.evidenceReferences && selectedClaim.evidenceReferences.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Supporting Images / Evidence ({selectedClaim.evidenceReferences.length})
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {selectedClaim.evidenceReferences.map((ref, idx) => (
                        <div
                          key={idx}
                          onClick={() =>
                            setPreviewModalImage({
                              url: ref,
                              title: `Supporting Evidence #${idx + 1} (${ref.split('/').pop() || 'image'})`,
                            })
                          }
                          className="group relative block rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 aspect-video hover:opacity-95 transition shadow-2xs cursor-pointer"
                          title="Click to view full image"
                        >
                          <img
                            src={getAccessibleImageUrl(ref)}
                            alt={`Evidence ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            onError={(e) => {
                              const target = e.target as HTMLElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                          <div
                            style={{ display: 'none' }}
                            className="w-full h-full flex-col items-center justify-center p-2 text-center text-slate-400 bg-slate-100 dark:bg-slate-800"
                          >
                            <FileText className="w-5 h-5 text-slate-400 mb-1" />
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-full">
                              {ref.split('/').pop() || `Attachment ${idx + 1}`}
                            </span>
                          </div>
                          <div className="p-1.5 text-[10px] text-slate-600 dark:text-slate-300 truncate bg-white/90 dark:bg-slate-900/90 absolute bottom-0 inset-x-0 flex items-center justify-between">
                            <span className="truncate">{ref.split('/').pop() || `Attachment ${idx + 1}`}</span>
                            <ZoomIn className="w-3 h-3 shrink-0 ml-1 opacity-70 group-hover:opacity-100 text-indigo-600 dark:text-indigo-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Final Resolution Notes if completed */}
                {selectedClaim.resolutionNotes && (
                  <div className="p-4 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 rounded-2xl space-y-1">
                    <span className="text-xs font-bold text-teal-800 dark:text-teal-300 uppercase">
                      Official Service Resolution Notes
                    </span>
                    <p className="text-sm text-teal-900 dark:text-teal-200">{selectedClaim.resolutionNotes}</p>
                  </div>
                )}

                {/* Customer Review if rated */}
                {selectedClaim.customerRating && (
                  <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                        Your Submitted Rating
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
                  </div>
                )}

                {/* Service Updates from Technician */}
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-indigo-500" /> Service Workshop Updates
                  </span>

                  {selectedClaim.serviceNotes && selectedClaim.serviceNotes.length > 0 ? (
                    <div className="space-y-2.5">
                      {selectedClaim.serviceNotes.map((sn, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-xl border border-indigo-100/80 dark:border-indigo-800/40 space-y-1"
                        >
                          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{sn.note}</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                            <span>{new Date(sn.addedAt).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center text-xs text-slate-400">
                      No service updates logged yet. Check back soon.
                    </div>
                  )}
                </div>

                {/* Audit Lifecycle History */}
                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> Tracking Milestones
                  </span>

                  <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-700 space-y-4 ml-2">
                    {selectedClaim.statusHistory?.map((h) => (
                      <div key={h.id} className="relative">
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
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-16 text-center text-slate-400 dark:text-slate-500 space-y-3">
              <FileText className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
              <div className="text-base font-bold text-slate-700 dark:text-slate-300">No Claim Selected</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Select a claim on the left to track progress and service history.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      {cancelModal && selectedClaim && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Cancel Warranty Claim</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              You may cancel your claim while it is under initial review. Please state a reason.
            </p>

            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Cancellation Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Issue resolved on its own, or registered by mistake..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCancelModal(false);
                    setCancelReason('');
                  }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Keep Claim
                </button>
                <button
                  type="submit"
                  disabled={submitting || !cancelReason.trim()}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reply Modal with Drag & Drop Image Uploads */}
      {replyModal && selectedClaim && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Provide Requested Information</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Provide the details requested by the retailer. Your claim will automatically return to <strong>UNDER_REVIEW</strong>.
            </p>

            <form onSubmit={handleReplySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Response Details (Optional)
                </label>
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Explain the required details..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Upload Supporting Images */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Upload Supporting Images (Optional)
                  </label>
                  <span className="text-[11px] text-slate-400">JPG, PNG (Max 5 MB each)</span>
                </div>

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      processReplyFiles(Array.from(e.dataTransfer.files));
                    }
                  }}
                  className={`border-2 border-dashed rounded-xl transition-all ${
                    isDragging
                      ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/20'
                      : 'border-slate-300 dark:border-slate-700 hover:border-purple-400 bg-slate-50/50 dark:bg-slate-800/40'
                  }`}
                >
                  <input
                    ref={replyFileInputRef}
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        processReplyFiles(Array.from(e.target.files));
                      }
                      e.target.value = '';
                    }}
                    className="hidden"
                  />

                  {replyImages.length === 0 ? (
                    <div
                      onClick={() => replyFileInputRef.current?.click()}
                      className="p-6 text-center cursor-pointer flex flex-col items-center justify-center gap-2"
                    >
                      <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline">
                          Click to upload
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400"> or drag and drop</span>
                      </div>
                      <p className="text-[11px] text-slate-400">Supports JPG, JPEG, and PNG</p>
                    </div>
                  ) : (
                    <div className="p-3 space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {replyImages.map((img) => (
                          <div
                            key={img.id}
                            className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xs"
                          >
                            <div
                              onClick={() => setPreviewModalImage({ url: img.previewUrl, title: img.name })}
                              className="aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-800 relative cursor-pointer"
                              title="Click to view full image"
                            >
                              <img
                                src={img.previewUrl}
                                alt={img.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                              {img.uploading && (
                                <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveReplyImage(img.id);
                                }}
                                className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/70 text-white hover:bg-rose-600 transition cursor-pointer z-10"
                                title="Remove image"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="p-2">
                              <div className="text-[11px] font-medium text-slate-700 dark:text-slate-200 truncate">
                                {img.name}
                              </div>
                              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                                <span>{img.sizeFormatted}</span>
                                {img.serverUrl && (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                                    <CheckCircle2 className="w-2.5 h-2.5" /> Ready
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Add More Tile */}
                        <div
                          onClick={() => replyFileInputRef.current?.click()}
                          className="min-h-[100px] border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-500 rounded-xl flex flex-col items-center justify-center gap-1 p-2 bg-white/50 dark:bg-slate-800/50 hover:bg-purple-50/50 text-slate-600 dark:text-slate-300 transition cursor-pointer text-center group"
                        >
                          <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition">
                            <Plus className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                            Add More
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {replyUploadError && (
                  <div className="mt-2 p-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-lg text-xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
                      <span>{replyUploadError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReplyUploadError(null)}
                      className="text-rose-500 hover:text-rose-700 font-bold text-xs cursor-pointer"
                    >
                      &times;
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={closeReplyModal}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || replyImages.some((img) => img.uploading)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...
                    </>
                  ) : replyImages.some((img) => img.uploading) ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading Images...
                    </>
                  ) : (
                    'Send Information'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {feedbackModal && selectedClaim && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Rate After-Sales Service</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your rating helps {selectedClaim.retailerBusinessName} and WarranTrack maintain high service standards.
            </p>

            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Star Rating <span className="text-amber-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1 text-2xl transition hover:scale-110 focus:outline-none cursor-pointer"
                    >
                      <span className={star <= rating ? 'text-amber-400' : 'text-slate-200 dark:text-slate-700'}>
                        ★
                      </span>
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 ml-2">
                    {rating === 5 ? 'Excellent' : rating === 4 ? 'Good' : rating === 3 ? 'Average' : rating === 2 ? 'Poor' : 'Terrible'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Comments or Feedback (Optional)
                </label>
                <textarea
                  rows={3}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Tell us about the turnaround time, repair quality, or communication..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setFeedbackModal(false);
                    setFeedbackText('');
                    setRating(5);
                  }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Rating'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Full-screen Zoomable/Pannable Image Preview Modal */}
      <ImagePreviewModal
        isOpen={Boolean(previewModalImage)}
        onClose={() => setPreviewModalImage(null)}
        imageUrl={previewModalImage?.url || ''}
        title={previewModalImage?.title}
      />
    </div>
  );
};
