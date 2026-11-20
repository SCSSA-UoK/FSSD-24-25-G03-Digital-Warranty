import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { warrantyApi, claimApi } from '../../api';
import { Warranty } from '../../types';
import {
  Send,
  AlertCircle,
  ShieldAlert,
  Upload,
  X,
  Loader2,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { ImagePreviewModal } from '../../components/ImagePreviewModal';

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

export const SubmitClaim: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const preselectedWarrantyId = (location.state as any)?.warrantyId || '';

  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [selectedWarrantyId, setSelectedWarrantyId] = useState<string>(preselectedWarrantyId);
  const [issueDescription, setIssueDescription] = useState('');
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewModalImage, setPreviewModalImage] = useState<{ url: string; title?: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imagesRef = useRef<SelectedImage[]>([]);
  imagesRef.current = images;

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
  }, []);

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

  const processFiles = (fileList: File[]) => {
    setUploadError(null);
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
      setUploadError(errors.join(' '));
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

    setImages((prev) => [...prev, ...newItems]);

    // Upload each valid image file to the Spring Boot backend
    newItems.forEach(async (item) => {
      try {
        const res = await claimApi.uploadEvidence(item.file);
        setImages((prev) =>
          prev.map((img) =>
            img.id === item.id ? { ...img, uploading: false, serverUrl: res.url } : img
          )
        );
      } catch (err: any) {
        const msg = err.response?.data?.message || 'Upload failed. Please retry or remove.';
        setImages((prev) =>
          prev.map((img) =>
            img.id === item.id ? { ...img, uploading: false, error: msg } : img
          )
        );
      }
    });
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((img) => img.id !== id);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWarrantyId || isExpired) return;

    if (images.some((img) => img.uploading)) {
      setError('Please wait for image uploads to complete before submitting.');
      return;
    }

    if (images.some((img) => img.error)) {
      setError('One or more images failed to upload. Please remove failed images before submitting.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const evidenceUrls = images
        .map((img) => img.serverUrl)
        .filter((url): url is string => Boolean(url));

      await claimApi.submitClaim({
        warrantyId: selectedWarrantyId,
        issueDescription,
        evidenceReferences: evidenceUrls,
      });
      navigate('/customer/claims');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error submitting warranty claim.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl lg:max-w-2xl xl:max-w-3xl mx-auto space-y-6">
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
                  {w.productName}{w.serialNumber ? ` [S/N: ${w.serialNumber}]` : ''} ({w.retailerBusinessName}) &bull; Valid until {w.expiryDate}{' '}
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
            {selectedWarranty.serialNumber && (
              <div className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                Unit Serial Number: {selectedWarranty.serialNumber}
              </div>
            )}
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

        {/* Upload Supporting Images */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">
              Upload Supporting Images
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
                processFiles(Array.from(e.dataTransfer.files));
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-4 sm:p-5 transition cursor-pointer ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  processFiles(Array.from(e.target.files));
                  e.target.value = '';
                }
              }}
              className="hidden"
            />

            {images.length === 0 ? (
              /* Upload instructions when no images are selected */
              <div className="flex flex-col items-center justify-center gap-2 py-3 text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold underline">Click to upload</span> or drag and drop images
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Select multiple photos showing the product issue or defect
                  </p>
                </div>
              </div>
            ) : (
              /* Uploaded image previews displayed INSIDE the upload box */
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200 dark:border-slate-700/60">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {images.length} {images.length === 1 ? 'image' : 'images'} selected
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/40 rounded-lg transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add More</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {images.map((img) => (
                    <div
                      key={img.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewModalImage({ url: img.previewUrl, title: img.name });
                      }}
                      className="relative group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-xs flex flex-col cursor-pointer"
                      title="Click to view full image"
                    >
                      <div className="relative h-28 sm:h-32 w-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                        <img
                          src={img.previewUrl}
                          alt={img.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        {/* Uploading Status Overlay */}
                        {img.uploading && (
                          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1 text-white text-xs">
                            <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                            <span className="text-[11px] font-medium">Uploading...</span>
                          </div>
                        )}
                        {/* Error Status Overlay */}
                        {img.error && (
                          <div className="absolute inset-0 bg-rose-950/80 p-2 flex flex-col items-center justify-center text-center text-white text-[11px]">
                            <AlertCircle className="w-5 h-5 text-rose-400 mb-1" />
                            <span className="font-semibold">{img.error}</span>
                          </div>
                        )}
                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(img.id);
                          }}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-slate-900/75 hover:bg-rose-600 text-white flex items-center justify-center shadow-sm transition cursor-pointer z-10"
                          title="Remove image"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="p-2 text-left">
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate" title={img.name}>
                          {img.name}
                        </p>
                        <div className="flex items-center justify-between mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <span>{img.sizeFormatted}</span>
                          {img.serverUrl && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" /> Ready
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add More Tile inside the grid */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="h-full min-h-[140px] sm:min-h-[155px] border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-xl flex flex-col items-center justify-center gap-1.5 p-3 bg-white/50 dark:bg-slate-800/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 text-slate-600 dark:text-slate-300 transition cursor-pointer text-center group"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition">
                      <Plus className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      Add More
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      or drop here
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Validation Error Banner */}
          {uploadError && (
            <div className="mt-2 p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-lg text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{uploadError}</span>
              </div>
              <button
                type="button"
                onClick={() => setUploadError(null)}
                className="text-rose-500 hover:text-rose-700 dark:text-rose-400 font-bold text-sm cursor-pointer"
              >
                &times;
              </button>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting || !selectedWarrantyId || isExpired || images.some((img) => img.uploading)}
          className="w-full py-3 px-4 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
        >
          {submitting ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : images.some((img) => img.uploading) ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Uploading Images...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" /> Submit Claim to Retailer
            </>
          )}
        </button>
      </form>

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
