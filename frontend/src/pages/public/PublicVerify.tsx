import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { warrantyApi } from '../../api';
import { PublicWarranty } from '../../types';
import { ShieldCheck, ShieldAlert, CheckCircle2, Clock, Calendar, Store, Package } from 'lucide-react';

export const PublicVerify: React.FC = () => {
  const { qrToken } = useParams<{ qrToken: string }>();
  const [warranty, setWarranty] = useState<PublicWarranty | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verify = async () => {
      if (!qrToken) return;
      try {
        setLoading(true);
        const data = await warrantyApi.verifyPublicWarranty(qrToken);
        setWarranty(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Invalid or unrecognized warranty verification token.');
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [qrToken]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !warranty) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl border border-red-200 shadow-sm text-center space-y-4">
        <div className="bg-red-100 text-red-600 w-14 h-14 rounded-full mx-auto flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Verification Failed</h2>
        <p className="text-sm text-slate-600">{error}</p>
        <Link
          to="/"
          className="inline-block mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto my-12 bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
      {/* Header Banner */}
      <div
        className={`p-6 text-white text-center flex flex-col items-center gap-2 ${warranty.currentlyValid ? 'bg-emerald-600' : 'bg-amber-600'
          }`}
      >
        {warranty.currentlyValid ? (
          <CheckCircle2 className="w-12 h-12" />
        ) : (
          <Clock className="w-12 h-12" />
        )}
        <h2 className="text-2xl font-bold">
          {warranty.currentlyValid ? 'Valid Warranty Verified' : 'Warranty Expired'}
        </h2>
        <p className="text-xs text-white/90">
          Official digital record from WarranTrack Platform
        </p>
      </div>

      {/* Non-sensitive Public Details */}
      <div className="p-6 space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-2.5 bg-slate-100 rounded-lg text-slate-600">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase font-semibold">Product</div>
            <div className="font-bold text-slate-800">
              {warranty.productBrand} {warranty.productName}
            </div>
            <div className="text-xs text-slate-500">Model: {warranty.productModel}</div>
          </div>
        </div>

        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-2.5 bg-slate-100 rounded-lg text-slate-600">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase font-semibold">Authorized Retailer</div>
            <div className="font-semibold text-slate-800">{warranty.retailerBusinessName}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="text-xs text-slate-400 uppercase font-semibold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Start Date
            </div>
            <div className="font-medium text-slate-800 mt-1">{warranty.startDate}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase font-semibold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Expiry Date (Inclusive)
            </div>
            <div
              className={`font-semibold mt-1 ${warranty.currentlyValid ? 'text-emerald-700' : 'text-red-600'
                }`}
            >
              {warranty.expiryDate}
            </div>
          </div>
        </div>

        {warranty.termsSummary && (
          <div>
            <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Coverage Terms</div>
            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
              {warranty.termsSummary}
            </p>
          </div>
        )}

        <div className="text-[11px] text-slate-400 text-center pt-2">
          Privacy Protection: Customer contact details and internal IDs are withheld in accordance with privacy requirements.
        </div>
      </div>
    </div>
  );
};

