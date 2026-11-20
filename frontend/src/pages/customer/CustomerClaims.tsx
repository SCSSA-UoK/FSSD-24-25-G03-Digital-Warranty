import React, { useEffect, useRef, useState } from 'react';
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
  Upload,
  X,
  Loader2,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

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

export const CustomerClaims: React.FC = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);

  // Modals
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const [replyModal, setReplyModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyImages, setReplyImages] = useState<SelectedImage[]>([]);
  const [replyUploadError, setReplyUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const replyFileInputRef = useRef<HTMLInputElement | null>(null);
  const replyImagesRef = useRef<SelectedImage[]>([]);
  replyImagesRef.current = replyImages;

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
        errors.push(`"${file.name}" is not a supported format. Only JPG, JPEG, and PNG are allowed.`);
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        errors.push(`"${file.name}" exceeds the 5 MB maximum size limit (${formatFileSize(file.size)}).`);
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

    // Securely upload each image file to the Spring Boot backend
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

  const [feedbackModal, setFeedbackModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const res = await claimApi.getCustomerClaims();
      setClaims(res.content);
      if (selectedClaim) {
        const updated = await claimApi.getClaimById(selectedClaim.id);
        setSelectedClaim(updated);
      }
    } catch (err) {
      console.error('Failed to load claims', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaim) return;
    setSubmitting(true);
    try {
      const updated = await claimApi.cancelClaim(selectedClaim.id, cancelReason);
      setSelectedClaim(updated);
      setCancelModal(false);
      setCancelReason('');
      fetchClaims();
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
      fetchClaims();
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
      const updated = await claimApi.submitFeedback(selectedClaim.id, rating, feedbackText.trim() || undefined);
      setSelectedClaim(updated);
      setFeedbackModal(false);
      setFeedbackText('');
      setRating(5);
      fetchClaims();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error submitting feedback.');
    } finally {
      setSubmitting(false);
    }
  };

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">My Warranty Claims & Service Progress</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Track retailer review, communication, and repair progress in real time</p>
        </div>
        <Link
          to="/customer/submit-claim"
          className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition text-sm shadow-xs self-start"
        >
          Submit New Claim
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 xl:gap-6">
        {/* Left List */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800 max-h-72 lg:max-h-[80vh] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">Loading your claims...</div>
          ) : claims.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
              <FileText className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              No claims submitted yet.
            </div>
          ) : (
            claims.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedClaim(c)}
                className={`p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition ${
                  selectedClaim?.id === c.id ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-l-4 border-indigo-600' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">{c.productName}</span>
                  {getStatusBadge(c.currentStatus)}
                </div>
                {c.serialNumber && (
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">S/N: {c.serialNumber}</div>
                )}
                <div className="text-xs text-slate-500 dark:text-slate-400">Retailer: {c.retailerBusinessName}</div>
                <div className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 mt-1">{c.issueDescription}</div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
                  Submitted: {new Date(c.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Detail */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 xl:p-6 space-y-6">
          {selectedClaim ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-2">
                <div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 uppercase font-semibold">Claim Details</div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{selectedClaim.productName}</h2>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap">
                    <span>Retailer: {selectedClaim.retailerBusinessName}</span>
                    {selectedClaim.serialNumber && (
                      <span className="font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        S/N: {selectedClaim.serialNumber}
                      </span>
                    )}
                  </div>
                </div>
                <div>{getStatusBadge(selectedClaim.currentStatus)}</div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                {/* Cancellation is permitted only when claim is in initial review stages */}
                {(selectedClaim.currentStatus === 'SUBMITTED' || selectedClaim.currentStatus === 'UNDER_REVIEW') && (
                  <button
                    onClick={() => setCancelModal(true)}
                    className="px-3.5 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition flex items-center gap-1 cursor-pointer"
                  >
                    <Ban className="w-3.5 h-3.5" /> Cancel Claim
                  </button>
                )}

                {/* Reply to info request */}
                {selectedClaim.currentStatus === 'ADDITIONAL_INFO_REQUIRED' && (
                  <button
                    onClick={() => setReplyModal(true)}
                    className="px-3.5 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 transition flex items-center gap-1 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Provide Requested Information
                  </button>
                )}

                {selectedClaim.currentStatus === 'APPROVED' && (
                  <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold py-1">
                    Approved ({selectedClaim.resolutionType}). Service center is scheduling work.
                  </span>
                )}
                {selectedClaim.currentStatus === 'IN_PROGRESS' && (
                  <span className="text-xs text-indigo-700 dark:text-indigo-400 font-semibold py-1">
                    Repair / replacement in progress. Check service updates below.
                  </span>
                )}
                {selectedClaim.currentStatus === 'COMPLETED' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-teal-700 dark:text-teal-400 font-semibold py-1">
                      Service completed!
                    </span>
                    {!selectedClaim.customerRating && (
                      <button
                        onClick={() => setFeedbackModal(true)}
                        className="px-3 py-1 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 transition flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <Star className="w-3.5 h-3.5 fill-current" /> Rate Service
                      </button>
                    )}
                  </div>
                )}
                {selectedClaim.currentStatus === 'CANCELLED' && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 italic py-1">
                    You cancelled this claim: {selectedClaim.cancellationReason}
                  </span>
                )}
              </div>

              {/* Issue Description */}
              <div>
                <span className="text-xs text-slate-400 dark:text-slate-500 uppercase font-semibold">Reported Issue</span>
                <p className="mt-1 text-sm text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                  {selectedClaim.issueDescription}
                </p>
              </div>

              {/* Supporting Images / Evidence References */}
              {selectedClaim.evidenceReferences && selectedClaim.evidenceReferences.length > 0 && (
                <div>
                  <span className="text-xs text-slate-400 dark:text-slate-500 uppercase font-semibold">Supporting Images / Evidence</span>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {selectedClaim.evidenceReferences.map((ref, idx) => (
                      <a
                        key={idx}
                        href={ref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative block rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 aspect-video hover:opacity-90 transition shadow-xs"
                      >
                        <img
                          src={ref}
                          alt={`Evidence ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div className="p-1.5 text-[10px] text-slate-600 dark:text-slate-300 truncate bg-white/90 dark:bg-slate-900/90 absolute bottom-0 inset-x-0">
                          {ref.split('/').pop() || `Attachment ${idx + 1}`}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Service Updates */}
              {selectedClaim.serviceNotes && selectedClaim.serviceNotes.length > 0 && (
                <div>
                  <span className="text-xs text-slate-400 dark:text-slate-500 uppercase font-semibold">Service Updates</span>
                  <div className="mt-2 space-y-2">
                    {selectedClaim.serviceNotes.map((sn, idx) => (
                      <div key={idx} className="text-xs p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-lg border border-indigo-100 dark:border-indigo-800/50">
                        <div className="font-semibold text-indigo-900 dark:text-indigo-200">{sn.note}</div>
                        <div className="text-[10px] text-indigo-500 dark:text-indigo-400 mt-1">
                          {new Date(sn.addedAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Final Resolution Notes */}
              {selectedClaim.resolutionNotes && (
                <div className="p-4 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-xl">
                  <span className="text-xs text-teal-800 dark:text-teal-300 uppercase font-semibold">Final Resolution Notes</span>
                  <p className="text-sm text-teal-900 dark:text-teal-200 mt-1">{selectedClaim.resolutionNotes}</p>
                </div>
              )}

              {/* Customer Rating & Feedback */}
              {selectedClaim.customerRating && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl space-y-1">
                  <span className="text-xs text-amber-800 dark:text-amber-300 uppercase font-semibold">Your Service Review</span>
                  <div className="flex items-center gap-1 text-amber-500 text-lg">
                    {'★'.repeat(selectedClaim.customerRating)}{'☆'.repeat(5 - selectedClaim.customerRating)}
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-200 ml-2">({selectedClaim.customerRating} / 5 stars)</span>
                  </div>
                  {selectedClaim.customerFeedback && (
                    <p className="text-sm text-amber-950 dark:text-amber-200 italic mt-1 bg-white/70 dark:bg-slate-800/70 p-2.5 rounded-lg border border-amber-100 dark:border-amber-800">
                      "{selectedClaim.customerFeedback}"
                    </p>
                  )}
                  {selectedClaim.feedbackSubmittedAt && (
                    <div className="text-[10px] text-amber-600 dark:text-amber-400 pt-0.5">
                      Submitted: {new Date(selectedClaim.feedbackSubmittedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              )}

              {/* Claim Status Audit Trail */}
              <div>
                <span className="text-xs text-slate-400 dark:text-slate-500 uppercase font-semibold">Chronological Service Progress</span>
                <div className="mt-3 relative pl-6 border-l-2 border-slate-200 dark:border-slate-700 space-y-4">
                  {selectedClaim.statusHistory?.map((h) => (
                    <div key={h.id} className="relative">
                      <div className="absolute -left-[31px] top-0.5 bg-slate-400 rounded-full w-2.5 h-2.5 border-2 border-white dark:border-slate-900 ring-2 ring-slate-200 dark:ring-slate-700"></div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{h.newStatus.replace(/_/g, ' ')}</div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">{h.note}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                        {new Date(h.changedAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-slate-400 dark:text-slate-500 text-sm">
              Select a claim on the left to track progress and service history.
            </div>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      {cancelModal && selectedClaim && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Cancel Warranty Claim</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              You may cancel your claim while it is SUBMITTED or UNDER_REVIEW. A cancellation reason is required.
            </p>

            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Cancellation Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Problem resolved on its own, or registered by mistake..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCancelModal(false);
                    setCancelReason('');
                  }}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Keep Claim
                </button>
                <button
                  type="submit"
                  disabled={submitting || !cancelReason.trim()}
                  className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {replyModal && selectedClaim && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Provide Additional Information</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Provide the details requested by the retailer. Your claim will automatically return to{' '}
              <strong className="text-slate-800 dark:text-slate-200">UNDER_REVIEW</strong>.
            </p>

            <form onSubmit={handleReplySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Response Details (Optional)
                </label>
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Explain the required details (optional)..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Upload Supporting Images (Optional) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">
                    Upload Supporting Images (Optional)
                  </label>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    JPG, JPEG, PNG (Max 5 MB each)
                  </span>
                </div>

                {/* Drag & Drop / Click Upload Container */}
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
                  onClick={() => replyFileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 transition cursor-pointer ${
                    isDragging
                      ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/20'
                      : 'border-slate-300 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-500 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800'
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
                        e.target.value = '';
                      }
                    }}
                    className="hidden"
                  />

                  {replyImages.length === 0 ? (
                    /* Empty State: Upload Instructions */
                    <div className="flex flex-col items-center justify-center gap-2 py-3 text-center">
                      <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 flex items-center justify-center">
                        <Upload className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          <span className="text-purple-600 dark:text-purple-400 font-semibold underline">Click to upload</span> or drag and drop images
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Select multiple photos showing additional evidence
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Image previews INSIDE the dashed upload area */
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200 dark:border-slate-700/60">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {replyImages.length} {replyImages.length === 1 ? 'image' : 'images'} selected
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            replyFileInputRef.current?.click();
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-100/50 dark:hover:bg-purple-950/40 rounded-lg transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add More</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {replyImages.map((img) => (
                          <div
                            key={img.id}
                            onClick={(e) => e.stopPropagation()}
                            className="relative group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-xs flex flex-col cursor-default"
                          >
                            <div className="relative h-24 sm:h-28 w-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                              <img
                                src={img.previewUrl}
                                alt={img.name}
                                className="w-full h-full object-cover"
                              />
                              {img.uploading && (
                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1 text-white text-xs">
                                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                                  <span className="text-[10px] font-medium">Uploading...</span>
                                </div>
                              )}
                              {img.error && (
                                <div className="absolute inset-0 bg-rose-950/80 p-2 flex flex-col items-center justify-center text-center text-white text-[11px]">
                                  <AlertCircle className="w-4 h-4 text-rose-400 mb-1" />
                                  <span className="font-semibold text-[10px]">{img.error}</span>
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveReplyImage(img.id);
                                }}
                                className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-slate-900/75 hover:bg-rose-600 text-white flex items-center justify-center shadow-sm transition cursor-pointer z-10"
                                title="Remove image"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="p-1.5 text-left">
                              <p className="text-[11px] font-medium text-slate-800 dark:text-slate-200 truncate" title={img.name}>
                                {img.name}
                              </p>
                              <div className="flex items-center justify-between mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                                <span>{img.sizeFormatted}</span>
                                {img.serverUrl && (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5">
                                    <CheckCircle2 className="w-2.5 h-2.5" /> Ready
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Add More Tile */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            replyFileInputRef.current?.click();
                          }}
                          className="h-full min-h-[120px] sm:min-h-[135px] border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-500 rounded-xl flex flex-col items-center justify-center gap-1 p-2 bg-white/50 dark:bg-slate-800/50 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 text-slate-600 dark:text-slate-300 transition cursor-pointer text-center group"
                        >
                          <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition">
                            <Plus className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                            Add More
                          </span>
                          <span className="text-[9px] text-slate-400 dark:text-slate-500">
                            or drop here
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* File Validation Error Banner */}
                {replyUploadError && (
                  <div className="mt-2 p-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-lg text-xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
                      <span>{replyUploadError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReplyUploadError(null)}
                      className="text-rose-500 hover:text-rose-700 dark:text-rose-400 font-bold text-xs cursor-pointer"
                    >
                      &times;
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeReplyModal}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || replyImages.some((img) => img.uploading)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-xs"
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

      {/* Feedback & Rating Modal */}
      {feedbackModal && selectedClaim && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Rate After-Sales Service</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your feedback helps {selectedClaim.retailerBusinessName} and the WarranTrack platform maintain high service standards.
            </p>

            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-2">
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
                <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Comments or Feedback (Optional)
                </label>
                <textarea
                  rows={3}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Tell us about the turnaround time, repair quality, or communication..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Submitting...' : 'Submit Rating'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

