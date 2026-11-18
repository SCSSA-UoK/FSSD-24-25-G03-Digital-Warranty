import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, QrCode, FileText, Store, CheckCircle, ArrowRight } from 'lucide-react';

export const Landing: React.FC = () => {
  return (
    <div className="space-y-16 py-8">
      {/* Hero */}
      <section className="text-center max-w-3xl mx-auto space-y-6 pt-6">
        <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-1.5 rounded-full text-xs font-semibold">
          <ShieldCheck className="w-4 h-4" /> Smart Digital Warranty & After-Sales Platform
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Say goodbye to lost paper receipts and warranty cards.
        </h1>
        <p className="text-lg text-slate-600">
          WarranTrack centralizes your warranties across participating retailers in one unified global account. Verify coverage via secure QR codes, submit claims, and track repairs in real-time.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            to="/register"
            className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 shadow-md transition flex items-center gap-2"
          >
            Create Customer Account <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/register/retailer"
            className="px-6 py-3 bg-white text-slate-700 font-medium rounded-xl border border-slate-300 hover:bg-slate-50 transition flex items-center gap-2"
          >
            <Store className="w-4 h-4" /> Retailer Registration
          </Link>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="bg-indigo-100 text-indigo-700 w-12 h-12 rounded-xl flex items-center justify-center">
            <QrCode className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Instant QR Verification</h3>
          <p className="text-sm text-slate-600">
            Each warranty generates an instant tamper-evident QR verification token. Retailers and service centers can verify warranty status with zero private data leakage.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="bg-emerald-100 text-emerald-700 w-12 h-12 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">One Customer Account</h3>
          <p className="text-sm text-slate-600">
            No need to maintain separate portal logins. Access and manage verified purchases and active warranties from multiple independent retailers through one dashboard.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="bg-blue-100 text-blue-700 w-12 h-12 rounded-xl flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Transparent Claim Lifecycle</h3>
          <p className="text-sm text-slate-600">
            Audited claim workflow with comprehensive history. Submit issues, track retailer review, respond to information requests, and follow service updates through completion.
          </p>
        </div>
      </section>
    </div>
  );
};

