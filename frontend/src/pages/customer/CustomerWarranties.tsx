import React, { useEffect, useState } from 'react';
import { warrantyApi } from '../../api';
import { Warranty } from '../../types';
import { QRCodeSVG } from 'qrcode.react';
import { ShieldCheck, QrCode, Search, Send, ExternalLink, Printer, Award, Calendar, Store, CheckCircle2, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const CustomerWarranties: React.FC = () => {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [qrModalWarranty, setQrModalWarranty] = useState<Warranty | null>(null);
  const [certModalWarranty, setCertModalWarranty] = useState<Warranty | null>(null);
  const navigate = useNavigate();

  const fetchWarranties = async () => {
    try {
      setLoading(true);
      const res = await warrantyApi.getCustomerWarranties();
      setWarranties(res.content);
    } catch (err) {
      console.error('Failed to load warranties', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarranties();
  }, []);

  const getWarrantyProgress = (startDateStr: string, expiryDateStr: string) => {
    const start = new Date(startDateStr).getTime();
    const expiry = new Date(expiryDateStr).getTime();
    const now = new Date().getTime();

    const totalDuration = expiry - start;
    if (totalDuration <= 0) {
      return { daysRemaining: 0, percentRemaining: 0, isExpired: true, isExpiringSoon: false };
    }

    const remainingTime = expiry - now;
    const daysRemaining = Math.max(0, Math.ceil(remainingTime / (1000 * 60 * 60 * 24)));
    const percentRemaining = Math.max(0, Math.min(100, Math.round((remainingTime / totalDuration) * 100)));

    const isExpired = remainingTime <= 0;
    const isExpiringSoon = !isExpired && daysRemaining <= 30;

    return { daysRemaining, percentRemaining, isExpired, isExpiringSoon };
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  const filtered = warranties.filter(
    (w) =>
      w.productName.toLowerCase().includes(search.toLowerCase()) ||
      (w.retailerBusinessName && w.retailerBusinessName.toLowerCase().includes(search.toLowerCase())) ||
      (w.productBrand && w.productBrand.toLowerCase().includes(search.toLowerCase())) ||
      (w.serialNumber && w.serialNumber.toLowerCase().includes(search.toLowerCase())) ||
      (w.invoiceNumber && w.invoiceNumber.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">My Digital Warranty Cards</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Unified warranty cards across all participating retailers in your single global account
          </p>
        </div>
        <button
          onClick={fetchWarranties}
          disabled={loading}
          className="px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition text-sm shadow-xs self-start flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md print:hidden">
        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 dark:text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by product name, brand, serial #, retailer..."
          className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Grid of Warranty Cards */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 dark:text-slate-500 print:hidden">Loading your warranties...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-500 dark:text-slate-400 space-y-3 print:hidden">
          <ShieldCheck className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
          <h3 className="font-bold text-slate-800 dark:text-slate-100">No warranties found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            You don't have any digital warranties matching your filter. Purchases made with your verified email address are automatically linked to your account.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 xl:gap-6 print:hidden">
          {filtered.map((w) => {
            const prog = getWarrantyProgress(w.startDate, w.expiryDate);
            return (
              <div
                key={w.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition overflow-hidden flex flex-col justify-between"
              >
                {/* Card Header */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/80 dark:to-slate-900">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {w.retailerBusinessName}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">{w.productName}</h3>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {w.productBrand} {w.productModel ? `(${w.productModel})` : ''}
                    </div>
                    {w.serialNumber && (
                      <div className="mt-1.5 inline-flex items-center gap-1.5 font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                        S/N: {w.serialNumber}
                      </div>
                    )}
                  </div>
                  {prog.isExpired ? (
                    <span className="bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 text-xs px-2.5 py-0.5 rounded-full font-bold">
                      EXPIRED
                    </span>
                  ) : prog.isExpiringSoon ? (
                    <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-xs px-2.5 py-0.5 rounded-full font-bold animate-pulse">
                      EXPIRING SOON
                    </span>
                  ) : (
                    <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs px-2.5 py-0.5 rounded-full font-bold">
                      ACTIVE
                    </span>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-4 text-xs text-slate-600 dark:text-slate-300">
                  {/* Visual Expiry Countdown Progress Bar */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold">
                      <span className={prog.isExpired ? 'text-rose-600 dark:text-rose-400' : prog.isExpiringSoon ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}>
                        {prog.isExpired ? 'Coverage Ended' : `${prog.daysRemaining} days remaining`}
                      </span>
                      <span className="text-slate-400 dark:text-slate-500">{prog.percentRemaining}% coverage</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          prog.isExpired ? 'bg-rose-500' : prog.isExpiringSoon ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${prog.percentRemaining}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60">
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block font-semibold">Start Date</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{w.startDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block font-semibold">Expiry Date (Inclusive)</span>
                      <span className={`font-semibold ${w.eligibleForClaim ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {w.expiryDate}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 dark:text-slate-500 font-semibold block mb-0.5">Coverage Policy Snapshot</span>
                    <p className="line-clamp-2 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700 text-[11px]">
                      {w.termsSnapshot}
                    </p>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQrModalWarranty(w)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                    >
                      <QrCode className="w-4 h-4" /> QR Code
                    </button>
                    <span className="text-slate-300 dark:text-slate-600">&bull;</span>
                    <button
                      onClick={() => setCertModalWarranty(w)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" /> Certificate
                    </button>
                  </div>

                  {w.eligibleForClaim ? (
                    <button
                      onClick={() => navigate('/customer/submit-claim', { state: { warrantyId: w.id } })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" /> Submit Claim
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">Expired &bull; claims closed</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QR Modal */}
      {qrModalWarranty && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 print:hidden">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Digital Warranty QR</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {qrModalWarranty.productName} &bull; {qrModalWarranty.retailerBusinessName}
            </p>
            {qrModalWarranty.serialNumber && (
              <div className="inline-flex items-center font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                S/N: {qrModalWarranty.serialNumber}
              </div>
            )}

            <div className="p-4 bg-white rounded-xl inline-block border border-slate-200 dark:border-slate-700 shadow-xs">
              <QRCodeSVG
                value={`${window.location.origin}/verify/${qrModalWarranty.qrToken}`}
                size={180}
              />
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400">
              Expiry Date:{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">{qrModalWarranty.expiryDate}</span>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Link
                to={`/verify/${qrModalWarranty.qrToken}`}
                target="_blank"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-1"
              >
                Open Verification Page <ExternalLink className="w-3 h-3" />
              </Link>
              <button
                type="button"
                onClick={() => setQrModalWarranty(null)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Digital Warranty Certificate Modal */}
      {certModalWarranty && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-4 sm:p-8 shadow-2xl border-2 sm:border-4 border-slate-900 dark:border-slate-700 space-y-4 sm:space-y-6 relative print:bg-white print:text-slate-900 print:p-0 print:border-none print:shadow-none print:max-w-full my-auto max-h-[92vh] overflow-y-auto">
            {/* Action Bar (Hidden on print) */}
            <div className="flex flex-wrap justify-between items-center gap-2 pb-3 sm:pb-4 border-b border-slate-200 dark:border-slate-800 print:hidden">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Official Digital Certificate Preview
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handlePrintCertificate}
                  className="px-3.5 sm:px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Print / PDF
                </button>
                <button
                  type="button"
                  onClick={() => setCertModalWarranty(null)}
                  className="px-3 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Certificate Document */}
            <div className="p-4 sm:p-8 bg-gradient-to-b from-amber-50/40 via-white to-amber-50/20 dark:from-slate-800/80 dark:via-slate-900 dark:to-slate-800/80 border-4 sm:border-8 border-double border-amber-600/30 dark:border-amber-500/40 rounded-xl space-y-4 sm:space-y-6 text-center print:bg-white print:border-amber-600/30">
              <div className="flex items-center justify-center gap-2 text-amber-700 dark:text-amber-400 print:text-amber-700">
                <Award className="w-7 h-7 sm:w-8 sm:h-8 shrink-0" />
                <span className="text-base sm:text-xl font-serif font-bold uppercase tracking-widest text-slate-900 dark:text-slate-100 print:text-slate-900">
                  WarranTrack Digital Certificate
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 tracking-wide uppercase print:text-slate-500">
                Official Tamper-Evident Warranty Coverage Proof
              </p>

              <div className="py-2 border-y border-amber-200/60 dark:border-amber-700/40 space-y-1 print:border-amber-200/60">
                <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold print:text-slate-500">Registered Product</div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 print:text-slate-900">{certModalWarranty.productName}</h2>
                <div className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 print:text-slate-600">
                  {certModalWarranty.productBrand} {certModalWarranty.productModel ? `(${certModalWarranty.productModel})` : ''}
                </div>
                {certModalWarranty.serialNumber && (
                  <div className="pt-1">
                    <span className="inline-block font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 print:bg-slate-100 print:text-slate-900">
                      Serial Number: {certModalWarranty.serialNumber}
                    </span>
                  </div>
                )}
              </div>

              {/* Certificate Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-left text-xs bg-white dark:bg-slate-800/70 p-3 sm:p-4 rounded-xl border border-amber-200/50 dark:border-slate-700 shadow-xs print:bg-white print:border-amber-200/50">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 uppercase font-semibold block flex items-center gap-1 print:text-slate-400">
                    <Store className="w-3.5 h-3.5 text-slate-400" /> Issuing Retailer:
                  </span>
                  <div className="font-bold text-slate-800 dark:text-slate-100 text-sm mt-0.5 print:text-slate-800">{certModalWarranty.retailerBusinessName}</div>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 uppercase font-semibold block flex items-center gap-1 print:text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Coverage Dates:
                  </span>
                  <div className="font-bold text-emerald-700 dark:text-emerald-400 text-sm mt-0.5 print:text-emerald-700">
                    {certModalWarranty.startDate} &rarr; {certModalWarranty.expiryDate}
                  </div>
                </div>
              </div>

              {/* Policy Snapshot */}
              <div className="text-left text-xs bg-slate-50 dark:bg-slate-800/70 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700 print:bg-slate-50 print:border-slate-200">
                <span className="text-slate-500 dark:text-slate-400 uppercase font-bold text-[11px] block mb-1 print:text-slate-500">
                  Snapshotted Policy Terms
                </span>
                <p className="text-slate-700 dark:text-slate-300 italic text-[11px] leading-relaxed print:text-slate-700">
                  "{certModalWarranty.termsSnapshot}"
                </p>
              </div>

              {/* QR Verification Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-amber-200/60 dark:border-amber-700/40 print:border-amber-200/60">
                <div className="text-left text-xs space-y-1">
                  <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold print:text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" /> Cryptographically Validated
                  </div>
                  <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400 break-all max-w-xs print:text-slate-400">
                    Verification ID: {certModalWarranty.qrToken}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 print:text-slate-500">
                    Scan code or visit warrantrack.com/verify to validate authenticity.
                  </div>
                </div>

                <div className="p-2 bg-white rounded-lg border border-slate-300 dark:border-slate-600 shadow-xs shrink-0">
                  <QRCodeSVG
                    value={`${window.location.origin}/verify/${certModalWarranty.qrToken}`}
                    size={100}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
