import React, { useEffect, useState } from 'react';
import { claimApi } from '../../api';
import { Claim, ClaimStatus } from '../../types';
import { FileText, Clock, Ban, MessageSquare, Wrench, RefreshCw, Send, CheckCircle2, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CustomerClaims: React.FC = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);

  // Modals
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const [replyModal, setReplyModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [additionalEvidence, setAdditionalEvidence] = useState('');

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
    setSubmitting(true);
    try {
      const evidenceList = additionalEvidence.trim() ? [additionalEvidence.trim()] : undefined;
      const updated = await claimApi.replyInfo(selectedClaim.id, replyText, evidenceList);
      setSelectedClaim(updated);
      setReplyModal(false);
      setReplyText('');
      setAdditionalEvidence('');
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Warranty Claims & Service Progress</h1>
          <p className="text-sm text-slate-500">Track retailer review, communication, and repair progress in real time</p>
        </div>
        <Link
          to="/customer/submit-claim"
          className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition text-sm shadow-xs self-start"
        >
          Submit New Claim
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left List */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100 max-h-[80vh] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Loading your claims...</div>
          ) : claims.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              No claims submitted yet.
            </div>
          ) : (
            claims.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedClaim(c)}
                className={`p-4 cursor-pointer hover:bg-slate-50 transition ${
                  selectedClaim?.id === c.id ? 'bg-indigo-50/70 border-l-4 border-indigo-600' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm text-slate-900">{c.productName}</span>
                  {getStatusBadge(c.currentStatus)}
                </div>
                <div className="text-xs text-slate-500">Retailer: {c.retailerBusinessName}</div>
                <div className="text-xs text-slate-600 line-clamp-1 mt-1">{c.issueDescription}</div>
                <div className="text-[11px] text-slate-400 mt-2">
                  Submitted: {new Date(c.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Detail */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
          {selectedClaim ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-2">
                <div>
                  <div className="text-xs text-slate-400 uppercase font-semibold">Claim Details</div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedClaim.productName}</h2>
                  <div className="text-xs text-slate-500">Retailer: {selectedClaim.retailerBusinessName}</div>
                </div>
                <div>{getStatusBadge(selectedClaim.currentStatus)}</div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                {/* Cancel is allowed only when SUBMITTED or UNDER_REVIEW (FR-049, AC-016) */}
                {(selectedClaim.currentStatus === 'SUBMITTED' || selectedClaim.currentStatus === 'UNDER_REVIEW') && (
                  <button
                    onClick={() => setCancelModal(true)}
                    className="px-3.5 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition flex items-center gap-1"
                  >
                    <Ban className="w-3.5 h-3.5" /> Cancel Claim
                  </button>
                )}

                {/* Reply to info request */}
                {selectedClaim.currentStatus === 'ADDITIONAL_INFO_REQUIRED' && (
                  <button
                    onClick={() => setReplyModal(true)}
                    className="px-3.5 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 transition flex items-center gap-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Provide Requested Information
                  </button>
                )}

                {selectedClaim.currentStatus === 'APPROVED' && (
                  <span className="text-xs text-emerald-700 font-semibold py-1">
                    Approved ({selectedClaim.resolutionType}). Service center is scheduling work.
                  </span>
                )}
                {selectedClaim.currentStatus === 'IN_PROGRESS' && (
                  <span className="text-xs text-indigo-700 font-semibold py-1">
                    Repair / replacement in progress. Check service updates below.
                  </span>
                )}
                {selectedClaim.currentStatus === 'COMPLETED' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-teal-700 font-semibold py-1">
                      Service completed!
                    </span>
                    {!selectedClaim.customerRating && (
                      <button
                        onClick={() => setFeedbackModal(true)}
                        className="px-3 py-1 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 transition flex items-center gap-1 shadow-xs"
                      >
                        <Star className="w-3.5 h-3.5 fill-current" /> Rate Service
                      </button>
                    )}
                  </div>
                )}
                {selectedClaim.currentStatus === 'CANCELLED' && (
                  <span className="text-xs text-slate-500 italic py-1">
                    You cancelled this claim: {selectedClaim.cancellationReason}
                  </span>
                )}
              </div>

              {/* Issue Description */}
              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">Reported Issue</span>
                <p className="mt-1 text-sm text-slate-800 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {selectedClaim.issueDescription}
                </p>
              </div>

              {/* Service Updates */}
              {selectedClaim.serviceNotes && selectedClaim.serviceNotes.length > 0 && (
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold">Service Updates</span>
                  <div className="mt-2 space-y-2">
                    {selectedClaim.serviceNotes.map((sn, idx) => (
                      <div key={idx} className="text-xs p-3 bg-indigo-50/50 rounded-lg border border-indigo-100">
                        <div className="font-semibold text-indigo-900">{sn.note}</div>
                        <div className="text-[10px] text-indigo-500 mt-1">
                          {new Date(sn.addedAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Final Resolution Notes */}
              {selectedClaim.resolutionNotes && (
                <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl">
                  <span className="text-xs text-teal-800 uppercase font-semibold">Final Resolution Notes</span>
                  <p className="text-sm text-teal-900 mt-1">{selectedClaim.resolutionNotes}</p>
                </div>
              )}

              {/* Customer Rating & Feedback */}
              {selectedClaim.customerRating && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                  <span className="text-xs text-amber-800 uppercase font-semibold">Your Service Review</span>
                  <div className="flex items-center gap-1 text-amber-500 text-lg">
                    {'★'.repeat(selectedClaim.customerRating)}{'☆'.repeat(5 - selectedClaim.customerRating)}
                    <span className="text-xs font-bold text-amber-900 ml-2">({selectedClaim.customerRating} / 5 stars)</span>
                  </div>
                  {selectedClaim.customerFeedback && (
                    <p className="text-sm text-amber-950 italic mt-1 bg-white/70 p-2.5 rounded-lg border border-amber-100">
                      "{selectedClaim.customerFeedback}"
                    </p>
                  )}
                  {selectedClaim.feedbackSubmittedAt && (
                    <div className="text-[10px] text-amber-600 pt-0.5">
                      Submitted: {new Date(selectedClaim.feedbackSubmittedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              )}

              {/* Chronological History Timeline (FR-041) */}
              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">Chronological Service Progress</span>
                <div className="mt-3 relative pl-6 border-l-2 border-slate-200 space-y-4">
                  {selectedClaim.statusHistory?.map((h) => (
                    <div key={h.id} className="relative">
                      <div className="absolute -left-[31px] top-0.5 bg-slate-400 rounded-full w-2.5 h-2.5 border-2 border-white ring-2 ring-slate-200"></div>
                      <div className="text-xs font-bold text-slate-800">{h.newStatus.replace(/_/g, ' ')}</div>
                      <div className="text-xs text-slate-600">{h.note}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(h.changedAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-slate-400 text-sm">
              Select a claim on the left to track progress and service history.
            </div>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      {cancelModal && selectedClaim && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Cancel Warranty Claim</h3>
            <p className="text-xs text-slate-500">
              You may cancel your claim while it is SUBMITTED or UNDER_REVIEW. A cancellation reason is required.
            </p>

            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                  Cancellation Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Problem resolved on its own, or registered by mistake..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCancelModal(false);
                    setCancelReason('');
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50"
                >
                  Keep Claim
                </button>
                <button
                  type="submit"
                  disabled={submitting || !cancelReason.trim()}
                  className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 disabled:opacity-50"
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Provide Additional Information</h3>
            <p className="text-xs text-slate-500">
              Provide the details requested by the retailer. Your claim will automatically return to{' '}
              <strong>UNDER_REVIEW</strong>.
            </p>

            <form onSubmit={handleReplySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                  Response Details <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Explain the required details..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                  Additional Evidence Link (Optional)
                </label>
                <input
                  type="text"
                  value={additionalEvidence}
                  onChange={(e) => setAdditionalEvidence(e.target.value)}
                  placeholder="Link to photo or document"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setReplyModal(false);
                    setReplyText('');
                    setAdditionalEvidence('');
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !replyText.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Send Information'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feedback & Rating Modal */}
      {feedbackModal && selectedClaim && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Rate After-Sales Service</h3>
            <p className="text-xs text-slate-500">
              Your feedback helps {selectedClaim.retailerBusinessName} and the WarranTrack platform maintain high service standards.
            </p>

            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-2">
                  Star Rating <span className="text-amber-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1 text-2xl transition hover:scale-110 focus:outline-none"
                    >
                      <span className={star <= rating ? 'text-amber-400' : 'text-slate-200'}>
                        ★
                      </span>
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-600 ml-2">
                    {rating === 5 ? 'Excellent' : rating === 4 ? 'Good' : rating === 3 ? 'Average' : rating === 2 ? 'Poor' : 'Terrible'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                  Comments or Feedback (Optional)
                </label>
                <textarea
                  rows={3}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Tell us about the turnaround time, repair quality, or communication..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 disabled:opacity-50"
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

