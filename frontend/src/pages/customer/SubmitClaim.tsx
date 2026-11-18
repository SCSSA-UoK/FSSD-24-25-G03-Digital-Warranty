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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Submit Warranty Service Claim</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Request repairs or service from the responsible retailer under your verified digital warranty
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-rose-950/40 border border-red-200 dark:border-rose-800 text-red-700 dark:text-rose-300 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600 dark:text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Expired Warranty Guard Warning */}
      {isExpired && selectedWarranty && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-xl text-sm flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
          <div>
            <div className="font-bold">Claim Submission Blocked: Warranty Expired</div>
            <div className="text-xs mt-1">
              The coverage period for <strong>{selectedWarranty.productName}</strong> expired on{' '}
              <strong>{selectedWarranty.expiryDate}</strong> (inclusive). New claims cannot be accepted after the expiry date.
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
            Select Active Warranty <span className="text-rose-500">*</span>
          </label>
          {loading ? (
            <div className="text-xs text-slate-400 dark:text-slate-500">Loading warranties...</div>
          ) : warranties.length === 0 ? (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-lg text-xs text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
              No digital warranties found. Please claim a purchase first.
            </div>
          ) : (
            <select
              value={selectedWarrantyId}
              onChange={(e) => setSelectedWarrantyId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
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
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <div className="flex justify-between font-semibold">
              <span>Retailer: {selectedWarranty.retailerBusinessName}</span>
              <span className={selectedWarranty.eligibleForClaim ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                {selectedWarranty.eligibleForClaim ? 'Eligible for Claims' : 'Expired'}
              </span>
            </div>
            <div>Terms: {selectedWarranty.termsSnapshot}</div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
            Issue Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={4}
            value={issueDescription}
            onChange={(e) => setIssueDescription(e.target.value)}
            placeholder="Describe the defect, malfunction, or issue you are experiencing..."
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
            Supporting Evidence / Image Links (Optional)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              placeholder="e.g. photo URL or defect reference"
              className="flex-1 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
            <button
              type="button"
              onClick={handleAddEvidence}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Add Link
            </button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <label className="cursor-pointer px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800 transition">
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
            <span className="text-xs text-slate-400 dark:text-slate-500">or paste an external URL</span>
          </div>
          {evidenceList.length > 0 && (
            <ul className="mt-2 space-y-1">
              {evidenceList.map((ref, idx) => (
                <li key={idx} className="text-xs bg-slate-50 dark:bg-slate-800/60 p-2 rounded border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex justify-between">
                  <span className="truncate">{ref}</span>
                  <button
                    type="button"
                    onClick={() => setEvidenceList(evidenceList.filter((_, i) => i !== idx))}
                    className="text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 font-bold ml-2 cursor-pointer"
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
          className="w-full py-3 px-4 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
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

