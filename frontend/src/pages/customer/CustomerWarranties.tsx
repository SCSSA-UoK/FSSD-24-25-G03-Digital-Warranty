import React, { useEffect, useState } from 'react';
import { warrantyApi } from '../../api';
import { Warranty } from '../../types';
import { QRCodeSVG } from 'qrcode.react';
import { ShieldCheck, QrCode, Search, Send, ExternalLink, Printer, Award, Calendar, Store, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const CustomerWarranties: React.FC = () => {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [qrModalWarranty, setQrModalWarranty] = useState<Warranty | null>(null);
  const [certModalWarranty, setCertModalWarranty] = useState<Warranty | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
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
      (w.productBrand && w.productBrand.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Digital Warranty Cards</h1>
          <p className="text-sm text-slate-500">
            Unified warranty cards across all participating retailers in your single global account
          </p>
        </div>
        <Link
          to="/customer/claim-purchase"
          className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition text-sm shadow-xs self-start"
        >
          Claim Unlinked Purchase
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md print:hidden">
        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by product name, brand, retailer..."
          className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Grid of Warranty Cards */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 print:hidden">Loading your warranties...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 space-y-3 print:hidden">
          <ShieldCheck className="w-12 h-12 mx-auto text-slate-300" />
          <h3 className="font-bold text-slate-800">No warranties found</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            You don't have any digital warranties matching your filter. If you bought an item recently, claim your purchase to add the warranty card.
          </p>
          <Link
            to="/customer/claim-purchase"
            className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700"
          >
            Claim Pending Purchase
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:hidden">
          {filtered.map((w) => {
            const prog = getWarrantyProgress(w.startDate, w.expiryDate);
            return (
              <div
                key={w.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition overflow-hidden flex flex-col justify-between"
              >
                {/* Card Header */}
                <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-slate-50 to-white">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {w.retailerBusinessName}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-0.5">{w.productName}</h3>
                    <div className="text-xs text-slate-500">
                      {w.productBrand} {w.productModel ? `(${w.productModel})` : ''}
                    </div>
                  </div>
                  {prog.isExpired ? (
                    <span className="bg-rose-100 text-rose-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                      EXPIRED
                    </span>
                  ) : prog.isExpiringSoon ? (
                    <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-bold animate-pulse">
                      EXPIRING SOON
                    </span>
                  ) : (
                    <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                      ACTIVE
                    </span>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-4 text-xs text-slate-600">
                  {/* Visual Expiry Countdown Progress Bar */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold">
                      <span className={prog.isExpired ? 'text-rose-600' : prog.isExpiringSoon ? 'text-amber-600' : 'text-emerald-700'}>
                        {prog.isExpired ? 'Coverage Ended' : `${prog.daysRemaining} days remaining`}
                      </span>
                      <span className="text-slate-400">{prog.percentRemaining}% coverage</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          prog.isExpired ? 'bg-rose-500' : prog.isExpiringSoon ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${prog.percentRemaining}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 block font-semibold">Start Date</span>
                      <span className="font-medium text-slate-800">{w.startDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">Expiry Date (Inclusive)</span>
                      <span className={`font-semibold ${w.eligibleForClaim ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {w.expiryDate}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 font-semibold block mb-0.5">Coverage Policy Snapshot</span>
                    <p className="line-clamp-2 text-slate-600 bg-white p-2.5 rounded-lg border border-slate-100 text-[11px]">
                      {w.termsSnapshot}
                    </p>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQrModalWarranty(w)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-indigo-600 transition"
                    >
                      <QrCode className="w-4 h-4" /> QR Code
                    </button>
                    <span className="text-slate-300">&bull;</span>
                    <button
                      onClick={() => setCertModalWarranty(w)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                    >
                      <Printer className="w-3.5 h-3.5" /> Certificate
                    </button>
                  </div>

                  {w.eligibleForClaim ? (
                    <button
                      onClick={() => navigate('/customer/submit-claim', { state: { warrantyId: w.id } })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition"
                    >
                      <Send className="w-3.5 h-3.5" /> Submit Claim
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">Expired &bull; claims closed</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QR Modal */}
      {qrModalWarranty && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 print:hidden">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 text-center space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Digital Warranty QR</h3>
            <p className="text-xs text-slate-500">
              {qrModalWarranty.productName} &bull; {qrModalWarranty.retailerBusinessName}
            </p>

            <div className="p-4 bg-slate-50 rounded-xl inline-block border border-slate-200">
              <QRCodeSVG
                value={`${window.location.origin}/verify/${qrModalWarranty.qrToken}`}
                size={180}
              />
            </div>

            <div className="text-xs text-slate-500">
              Expiry Date:{' '}
              <span className="font-semibold text-slate-800">{qrModalWarranty.expiryDate}</span>
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
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Digital Warranty Certificate Modal */}
      {certModalWarranty && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl border-4 border-slate-900 space-y-6 relative print:p-0 print:border-none print:shadow-none print:max-w-full">
            {/* Action Bar (Hidden on print) */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 print:hidden">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Official Digital Certificate Preview
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handlePrintCertificate}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 flex items-center gap-1.5 shadow-xs transition"
                >
                  <Printer className="w-4 h-4" /> Print / Save as PDF
                </button>
                <button
                  type="button"
                  onClick={() => setCertModalWarranty(null)}
                  className="px-3 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Certificate Document */}
            <div className="p-8 bg-gradient-to-b from-amber-50/40 via-white to-amber-50/20 border-8 border-double border-amber-600/30 rounded-xl space-y-6 text-center">
              <div className="flex items-center justify-center gap-2 text-amber-700">
                <Award className="w-8 h-8" />
                <span className="text-xl font-serif font-bold uppercase tracking-widest text-slate-900">
                  WarranTrack Digital Certificate
                </span>
              </div>
              <p className="text-xs text-slate-500 tracking-wide uppercase">
                Official Tamper-Evident Warranty Coverage Proof
              </p>

              <div className="py-2 border-y border-amber-200/60 space-y-1">
                <div className="text-xs text-slate-500 uppercase font-semibold">Registered Product</div>
                <h2 className="text-2xl font-bold text-slate-900">{certModalWarranty.productName}</h2>
                <div className="text-sm font-medium text-slate-600">
                  {certModalWarranty.productBrand} {certModalWarranty.productModel ? `(${certModalWarranty.productModel})` : ''}
                </div>
              </div>

              {/* Certificate Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-left text-xs bg-white p-4 rounded-xl border border-amber-200/50 shadow-xs">
                <div>
                  <span className="text-slate-400 uppercase font-semibold block flex items-center gap-1">
                    <Store className="w-3.5 h-3.5 text-slate-400" /> Issuing Retailer:
                  </span>
                  <div className="font-bold text-slate-800 text-sm mt-0.5">{certModalWarranty.retailerBusinessName}</div>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-semibold block flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Coverage Dates:
                  </span>
                  <div className="font-bold text-emerald-700 text-sm mt-0.5">
                    {certModalWarranty.startDate} &rarr; {certModalWarranty.expiryDate}
                  </div>
                </div>
              </div>

              {/* Policy Snapshot */}
              <div className="text-left text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-slate-500 uppercase font-bold text-[11px] block mb-1">
                  Snapshotted Policy Terms
                </span>
                <p className="text-slate-700 italic text-[11px] leading-relaxed">
                  "{certModalWarranty.termsSnapshot}"
                </p>
              </div>

              {/* QR Verification Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-amber-200/60">
                <div className="text-left text-xs space-y-1">
                  <div className="flex items-center gap-1 text-emerald-700 font-bold">
                    <CheckCircle2 className="w-4 h-4" /> Cryptographically Validated
                  </div>
                  <div className="font-mono text-[10px] text-slate-400 break-all max-w-xs">
                    Verification ID: {certModalWarranty.qrToken}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Scan code or visit warrantrack.com/verify to validate authenticity.
                  </div>
                </div>

                <div className="p-2 bg-white rounded-lg border border-slate-300 shadow-xs">
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
