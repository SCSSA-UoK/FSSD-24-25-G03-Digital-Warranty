import React, { useEffect, useState } from 'react';
import { claimApi } from '../../api';
import { Claim, ClaimStatus, ResolutionType } from '../../types';
import { ShieldAlert, CheckCircle, XCircle, Clock, MessageSquare, Wrench, RefreshCw, Send, CheckCircle2 } from 'lucide-react';

export const RetailerClaims: React.FC = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ClaimStatus | ''>('');
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);

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

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const res = await claimApi.getRetailerClaims(statusFilter || undefined);
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
  }, [statusFilter]);

  const handleStartReview = async (id: string) => {
    try {
      const updated = await claimApi.startReview(id);
      setSelectedClaim(updated);
      fetchClaims();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error starting review.');
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
        decisionReason
      );
      setSelectedClaim(updated);
      setDecisionModal(null);
      setDecisionReason('');
      fetchClaims();
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
      const updated = await claimApi.requestInfo(selectedClaim.id, infoReason);
      setSelectedClaim(updated);
      setInfoModal(false);
      setInfoReason('');
      fetchClaims();
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
      const updated = await claimApi.updateProgress(selectedClaim.id, serviceNote);
      setSelectedClaim(updated);
      setServiceModal(false);
      setServiceNote('');
      fetchClaims();
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
      const updated = await claimApi.completeClaim(selectedClaim.id, completeNotes);
      setSelectedClaim(updated);
      setCompleteModal(false);
      setCompleteNotes('');
      fetchClaims();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error completing claim.');
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
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Warranty Claims & After-Sales Service</h1>
          <p className="text-sm text-slate-500">Review customer claims, make decisions, and update repair progress</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Claims</option>
            <option value="SUBMITTED">Submitted (Pending Review)</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="ADDITIONAL_INFO_REQUIRED">Awaiting Customer Info</option>
            <option value="APPROVED">Approved</option>
            <option value="IN_PROGRESS">In Progress (Servicing)</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <button
            onClick={fetchClaims}
            className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Claims List */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100 max-h-[80vh] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Loading claims...</div>
          ) : claims.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              <ShieldAlert className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              No claims found for this filter.
            </div>
          ) : (
            claims.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedClaim(c)}
                className={`p-4 cursor-pointer hover:bg-slate-50 transition ${
                  selectedClaim?.id === c.id ? 'bg-blue-50/70 border-l-4 border-blue-600' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm text-slate-900">{c.productName}</span>
                  {getStatusBadge(c.currentStatus)}
                </div>
                <div className="text-xs text-slate-600 line-clamp-2">{c.issueDescription}</div>
                <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
                  <span>{c.customerName}</span>
                  <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Column: Detailed View & Action Panel */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
          {selectedClaim ? (
            <>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-2">
                <div>
                  <div className="text-xs text-slate-400 uppercase font-semibold">Claim Detail</div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedClaim.productName}</h2>
                  <div className="text-xs text-slate-500">
                    Customer: {selectedClaim.customerName} ({selectedClaim.customerEmail})
                  </div>
                </div>
                <div>{getStatusBadge(selectedClaim.currentStatus)}</div>
              </div>

              {/* Action Buttons depending on claim state machine */}
              <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                {selectedClaim.currentStatus === 'SUBMITTED' && (
                  <button
                    onClick={() => handleStartReview(selectedClaim.id)}
                    className="px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
                  >
                    Start Review (Move to UNDER_REVIEW)
                  </button>
                )}

                {selectedClaim.currentStatus === 'UNDER_REVIEW' && (
                  <>
                    <button
                      onClick={() => setDecisionModal('APPROVE')}
                      className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition flex items-center gap-1"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Approve Claim
                    </button>
                    <button
                      onClick={() => setDecisionModal('REJECT')}
                      className="px-3.5 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject Claim
                    </button>
                    <button
                      onClick={() => setInfoModal(true)}
                      className="px-3.5 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 transition flex items-center gap-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Request Info
                    </button>
                  </>
                )}

                {(selectedClaim.currentStatus === 'APPROVED' || selectedClaim.currentStatus === 'IN_PROGRESS') && (
                  <>
                    <button
                      onClick={() => setServiceModal(true)}
                      className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition flex items-center gap-1"
                    >
                      <Wrench className="w-3.5 h-3.5" /> Add Service Update
                    </button>
                    <button
                      onClick={() => setCompleteModal(true)}
                      className="px-3.5 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-700 transition flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Complete Claim
                    </button>
                  </>
                )}

                {selectedClaim.currentStatus === 'ADDITIONAL_INFO_REQUIRED' && (
                  <span className="text-xs text-purple-700 font-medium py-1">
                    Waiting for customer to provide additional evidence / reply.
                  </span>
                )}
                {selectedClaim.currentStatus === 'COMPLETED' && (
                  <span className="text-xs text-teal-700 font-medium py-1">
                    This claim is completed and service has concluded.
                  </span>
                )}
                {selectedClaim.currentStatus === 'REJECTED' && (
                  <span className="text-xs text-rose-700 font-medium py-1">
                    Claim rejected: {selectedClaim.decisionReason}
                  </span>
                )}
                {selectedClaim.currentStatus === 'CANCELLED' && (
                  <span className="text-xs text-slate-500 font-medium py-1">
                    Claim was cancelled by customer: {selectedClaim.cancellationReason}
                  </span>
                )}
              </div>

              {/* Issue Description */}
              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">Issue Description</span>
                <p className="mt-1 text-sm text-slate-800 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {selectedClaim.issueDescription}
                </p>
              </div>

              {/* Service Progress Notes */}
              {selectedClaim.serviceNotes && selectedClaim.serviceNotes.length > 0 && (
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold">Service Updates</span>
                  <div className="mt-2 space-y-2">
                    {selectedClaim.serviceNotes.map((sn, i) => (
                      <div key={i} className="text-xs p-3 bg-indigo-50/50 rounded-lg border border-indigo-100">
                        <div className="font-semibold text-indigo-900">{sn.note}</div>
                        <div className="text-[10px] text-indigo-500 mt-1">
                          By {sn.addedBy} at {new Date(sn.addedAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Final Resolution if Completed */}
              {selectedClaim.resolutionNotes && (
                <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl">
                  <span className="text-xs text-teal-800 uppercase font-semibold">Final Resolution Notes</span>
                  <p className="text-sm text-teal-900 mt-1">{selectedClaim.resolutionNotes}</p>
                </div>
              )}

              {/* Auditable Status History Timeline (NFR-010, BR-013) */}
              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">Audited Status Transition History</span>
                <div className="mt-3 relative pl-6 border-l-2 border-slate-200 space-y-4">
                  {selectedClaim.statusHistory?.map((h) => (
                    <div key={h.id} className="relative">
                      <div className="absolute -left-[31px] top-0.5 bg-slate-400 rounded-full w-2.5 h-2.5 border-2 border-white ring-2 ring-slate-200"></div>
                      <div className="text-xs font-bold text-slate-800">{h.newStatus.replace(/_/g, ' ')}</div>
                      <div className="text-xs text-slate-600">{h.note}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        By {h.changedBy} on {new Date(h.changedAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-slate-400 text-sm">
              Select a warranty claim from the list on the left to view details and take action.
            </div>
          )}
        </div>
      </div>

      {/* Decision Modal (Approve or Reject) */}
      {decisionModal && selectedClaim && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              {decisionModal === 'APPROVE' ? 'Approve Warranty Claim' : 'Reject Warranty Claim'}
            </h3>

            <form onSubmit={handleDecisionSubmit} className="space-y-4">
              {decisionModal === 'APPROVE' ? (
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Resolution Type</label>
                  <select
                    value={resolutionType}
                    onChange={(e) => setResolutionType(e.target.value as ResolutionType)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="REPAIR">Repair product</option>
                    <option value="REPLACEMENT">Replace with new product</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                    Rejection Reason <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={decisionReason}
                    onChange={(e) => setDecisionReason(e.target.value)}
                    placeholder="State reason for rejection (e.g., physical damage outside warranty terms)..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    A clear reason is mandatory when rejecting a claim.
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setDecisionModal(null);
                    setDecisionReason('');
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || (decisionModal === 'REJECT' && !decisionReason.trim())}
                  className={`px-4 py-2 text-white rounded-lg text-sm font-semibold disabled:opacity-50 ${
                    decisionModal === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Request Additional Information</h3>
            <p className="text-xs text-slate-500">
              The claim will move to <strong>ADDITIONAL_INFO_REQUIRED</strong>. Once the customer provides the requested information, it automatically returns to UNDER_REVIEW.
            </p>

            <form onSubmit={handleInfoSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                  Required Information / Photos <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={infoReason}
                  onChange={(e) => setInfoReason(e.target.value)}
                  placeholder="e.g. Please provide a clear photo of the back serial label and the error code screen..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setInfoModal(false);
                    setInfoReason('');
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !infoReason.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 disabled:opacity-50"
                >
                  {submitting ? 'Sending...' : 'Send Request to Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Service Update Modal */}
      {serviceModal && selectedClaim && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Add Service Progress Update</h3>

            <form onSubmit={handleServiceSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                  Progress Note <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={serviceNote}
                  onChange={(e) => setServiceNote(e.target.value)}
                  placeholder="e.g. Replacement screen component ordered from manufacturer..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setServiceModal(false);
                    setServiceNote('');
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !serviceNote.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Mark Claim as Completed</h3>

            <form onSubmit={handleCompleteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                  Final Resolution Notes <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={completeNotes}
                  onChange={(e) => setCompleteNotes(e.target.value)}
                  placeholder="e.g. Main display panel replaced and full calibration tested successfully. Unit ready for customer pickup."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCompleteModal(false);
                    setCompleteNotes('');
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !completeNotes.trim()}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 disabled:opacity-50"
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

