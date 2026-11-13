import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { warrantyApi, claimApi } from '../../api';
import { Warranty } from '../../types';
import { Send, AlertCircle, ShieldAlert, CheckCircle2, Upload } from 'lucide-react';

export const SubmitClaim: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const preselectedWarrantyId = (location.state as any)?.warrantyId || '';

  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [selectedWarrantyId, setSelectedWarrantyId] = useState<string>(preselectedWarrantyId);
  const [issueDescription, setIssueDescription] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [evidenceList, setEvidenceList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWarranties = async () => {
      try {
        setLoading(true);
        const res = await warrantyApi.getCustomerWarranties();
        setWarranties(res.content);
        if (!selectedWarrantyId && res.content.length > 0) {
          setSelectedWarrantyId(res.content[0].id);
        }
      } catch (err) {
        console.error('Failed to load customer warranties', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWarranties();
  }, []);

  const selectedWarranty = warranties.find((w) => w.id === selectedWarrantyId);
  const isExpired = selectedWarranty && !selectedWarranty.eligibleForClaim;

  const handleAddEvidence = () => {
    if (evidenceUrl.trim()) {
      setEvidenceList([...evidenceList, evidenceUrl.trim()]);
      setEvidenceUrl('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    try {
      const res = await claimApi.uploadEvidence(file);
      setEvidenceList([...evidenceList, res.url]);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error uploading evidence image.');
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWarrantyId || isExpired) return;
    setError(null);
    setSubmitting(true);

    try {
      await claimApi.submitClaim({
        warrantyId: selectedWarrantyId,
        issueDescription,
        evidenceReferences: evidenceList,
      });
      navigate('/customer/claims');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error submitting warranty claim.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Submit Warranty Service Claim</h1>
        <p className="text-sm text-slate-500">
          Request repairs or service from the responsible retailer under your verified digital warranty
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Expired Warranty Block Warning (FR-048, 13.2, AC-015) */}
      {isExpired && selectedWarranty && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <div className="font-bold">Claim Submission Blocked: Warranty Expired</div>
            <div className="text-xs mt-1">
              The coverage period for <strong>{selectedWarranty.productName}</strong> expired on{' '}
              <strong>{selectedWarranty.expiryDate}</strong> (inclusive). New claims cannot be accepted after the expiry date.
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
            Select Active Warranty <span className="text-rose-500">*</span>
          </label>
          {loading ? (
            <div className="text-xs text-slate-400">Loading warranties...</div>
          ) : warranties.length === 0 ? (
            <div className="p-3 bg-amber-50 rounded-lg text-xs text-amber-800 border border-amber-200">
              No digital warranties found. Please claim a purchase first.
            </div>
          ) : (
            <select
              value={selectedWarrantyId}
              onChange={(e) => setSelectedWarrantyId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
            >
              {warranties.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.productName} ({w.retailerBusinessName}) &bull; Valid until {w.expiryDate}{' '}
                  {!w.eligibleForClaim ? '(EXPIRED)' : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {selectedWarranty && (
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1">
            <div className="flex justify-between font-semibold">
              <span>Retailer: {selectedWarranty.retailerBusinessName}</span>
              <span className={selectedWarranty.eligibleForClaim ? 'text-emerald-700' : 'text-rose-600'}>
                {selectedWarranty.eligibleForClaim ? 'Eligible for Claims' : 'Expired'}
              </span>
            </div>
            <div>Terms: {selectedWarranty.termsSnapshot}</div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
            Issue Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={4}
            value={issueDescription}
            onChange={(e) => setIssueDescription(e.target.value)}
            placeholder="Describe the defect, malfunction, or issue you are experiencing..."
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
            Supporting Evidence / Image Links (Optional)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              placeholder="e.g. photo URL or defect reference"
              className="flex-1 px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
            <button
              type="button"
              onClick={handleAddEvidence}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
            >
              Add Link
            </button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <label className="cursor-pointer px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-emerald-200 transition">
              <Upload className="w-3.5 h-3.5" />
              {uploadingFile ? 'Uploading photo...' : 'Upload Image File'}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploadingFile}
                className="hidden"
              />
            </label>
            <span className="text-xs text-slate-400">or paste an external URL</span>
          </div>
          {evidenceList.length > 0 && (
            <ul className="mt-2 space-y-1">
              {evidenceList.map((ref, idx) => (
                <li key={idx} className="text-xs bg-slate-50 p-2 rounded border border-slate-100 flex justify-between">
                  <span className="truncate">{ref}</span>
                  <button
                    type="button"
                    onClick={() => setEvidenceList(evidenceList.filter((_, i) => i !== idx))}
                    className="text-rose-500 hover:text-rose-700 font-bold ml-2"
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting || !selectedWarrantyId || isExpired}
          className="w-full py-3 px-4 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
        >
          {submitting ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              <Send className="w-4 h-4" /> Submit Claim to Retailer
            </>
          )}
        </button>
      </form>
    </div>
  );
};

