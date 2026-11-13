import React, { useEffect, useState } from 'react';
import { purchaseApi } from '../../api';
import { Purchase } from '../../types';
import { 
  ShoppingCart, 
  QrCode, 
  Search, 
  ExternalLink, 
  Download, 
  Printer, 
  Award, 
  Calendar, 
  CheckCircle2, 
  CreditCard, 
  Receipt, 
  PlusCircle, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  Barcode,
  Mail,
  User,
  Filter,
  X,
  Copy,
  Check,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

export const PurchaseList: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'WARRANTY' | 'BILL_ONLY' | 'LINKED' | 'UNCLAIMED'>('ALL');
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const res = await purchaseApi.getPurchases();
      setPurchases(res.content || []);
    } catch (err) {
      console.error('Failed to load purchases', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 1800);
  };

  const getLinkingBadge = (status: string, hasWarranty?: boolean) => {
    if (hasWarranty === false) {
      return (
        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-[11px] px-2.5 py-0.5 rounded-full font-semibold border border-slate-200">
          Standard Sale (No Warranty)
        </span>
      );
    }
    switch (status) {
      case 'LINKED':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[11px] px-2.5 py-0.5 rounded-full font-semibold border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Linked to Customer
          </span>
        );
      case 'PENDING_VERIFICATION':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[11px] px-2.5 py-0.5 rounded-full font-semibold border border-amber-200">
            <Clock className="w-3 h-3 text-amber-500" /> Pending Claim Verification
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-[11px] px-2.5 py-0.5 rounded-full font-semibold border border-slate-200">
            Unclaimed by Customer
          </span>
        );
    }
  };

  const formatSaleTime = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    } catch {
      return '—';
    }
  };

  // Filter calculations
  const totalCount = purchases.length;
  const warrantyCount = purchases.filter((p) => p.hasWarranty !== false).length;
  const billOnlyCount = purchases.filter((p) => p.hasWarranty === false).length;
  const linkedCount = purchases.filter((p) => p.linkingStatus === 'LINKED').length;
  const unclaimedCount = purchases.filter((p) => p.linkingStatus !== 'LINKED' && p.hasWarranty !== false).length;

  const filtered = purchases.filter((p) => {
    // Tab filter
    if (filterTab === 'WARRANTY' && p.hasWarranty === false) return false;
    if (filterTab === 'BILL_ONLY' && p.hasWarranty !== false) return false;
    if (filterTab === 'LINKED' && p.linkingStatus !== 'LINKED') return false;
    if (filterTab === 'UNCLAIMED' && (p.linkingStatus === 'LINKED' || p.hasWarranty === false)) return false;

    // Search query filter
    const s = search.trim().toLowerCase();
    if (!s) return true;
    return (
      p.purchaseReference.toLowerCase().includes(s) ||
      p.productName.toLowerCase().includes(s) ||
      (p.serialNumber && p.serialNumber.toLowerCase().includes(s)) ||
      (p.customerEmail && p.customerEmail.toLowerCase().includes(s)) ||
      p.invoiceNumber.toLowerCase().includes(s) ||
      (p.productBrand && p.productBrand.toLowerCase().includes(s)) ||
      (p.productModel && p.productModel.toLowerCase().includes(s))
    );
  });

  const exportToCSV = () => {
    if (filtered.length === 0) return;
    const headers = [
      'Purchase Reference',
      'Invoice Number',
      'Serial Number (Unique)',
      'Product Name',
      'Brand & Model',
      'Customer Email',
      'Unit Price',
      'Quantity',
      'Sale Date',
      'Sale Time',
      'Warranty Status',
      'Ownership Status',
      'Warranty Start Date',
      'Warranty Expiry Date',
      'QR Token',
    ];

    const rows = filtered.map((p) => [
      p.purchaseReference,
      p.invoiceNumber,
      p.serialNumber || 'N/A',
      p.productName,
      `${p.productBrand || ''} ${p.productModel || ''}`.trim(),
      p.customerEmail || 'Walk-in Customer',
      p.unitPrice != null ? p.unitPrice.toFixed(2) : '0.00',
      p.quantity || 1,
      p.purchaseDate,
      formatSaleTime(p.createdAt),
      p.hasWarranty === false ? 'Bill Only (No Warranty)' : 'Active Digital Warranty',
      p.linkingStatus,
      p.warranty?.startDate || '',
      p.warranty?.expiryDate || '',
      p.warranty?.qrToken || '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(','))].join(
        '\n'
      );

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `warrantrack_purchases_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Purchases & Issued Warranties</h1>
          <p className="text-sm text-slate-500 mt-1">
            Auditable sales ledger tracking registered customer purchases, unique hardware serial numbers, and digital warranty certificates
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={exportToCSV}
            disabled={filtered.length === 0}
            className="px-3.5 py-2 border border-slate-300 text-slate-700 bg-white font-medium rounded-lg hover:bg-slate-50 transition text-sm shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            title="Export filtered records as CSV"
          >
            <Download className="w-4 h-4 text-slate-500" /> Export CSV
          </button>
          <Link
            to="/retailer/pos"
            className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition text-sm shadow-xs flex items-center gap-2"
          >
            <CreditCard className="w-4 h-4" /> Open POS Terminal
          </Link>
          <Link
            to="/retailer/register-purchase"
            className="px-3.5 py-2 border border-slate-300 text-slate-700 bg-white font-medium rounded-lg hover:bg-slate-50 transition text-sm shadow-xs flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4 text-slate-500" /> Quick Entry
          </Link>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 leading-none">{totalCount}</div>
            <div className="text-xs text-slate-500 font-medium mt-1">Total Purchases</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-emerald-700 leading-none">{warrantyCount}</div>
            <div className="text-xs text-slate-500 font-medium mt-1">Digital Warranties</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-indigo-700 leading-none">{linkedCount}</div>
            <div className="text-xs text-slate-500 font-medium mt-1">Linked Customers</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-amber-700 leading-none">{unclaimedCount}</div>
            <div className="text-xs text-slate-500 font-medium mt-1">Unclaimed Cards</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setFilterTab('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
              filterTab === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All Purchases ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('WARRANTY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap flex items-center gap-1 ${
              filterTab === 'WARRANTY'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Warranties ({warrantyCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('BILL_ONLY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap flex items-center gap-1 ${
              filterTab === 'BILL_ONLY'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" /> Bill Only ({billOnlyCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('LINKED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap flex items-center gap-1 ${
              filterTab === 'LINKED'
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Linked ({linkedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('UNCLAIMED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
              filterTab === 'UNCLAIMED'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Unclaimed ({unclaimedCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reference, serial, product..."
            className="w-full pl-9 pr-8 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Purchases & Warranties Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium">Loading purchases & issued warranties...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-3">
            <ShoppingCart className="w-12 h-12 mx-auto text-slate-300" />
            <div className="text-base font-semibold text-slate-700">No records found</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {search || filterTab !== 'ALL'
                ? 'No purchases match your current search query and filter criteria.'
                : 'No purchases have been registered yet. Open the POS billing terminal or use Quick Entry to record a sale.'}
            </p>
            {(search || filterTab !== 'ALL') && (
              <button
                onClick={() => {
                  setSearch('');
                  setFilterTab('ALL');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 rounded-lg transition"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-auto">
              <thead>
                <tr className="bg-slate-50/90 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/90 select-none">
                  <th className="px-5 py-3.5 w-[16%] min-w-[170px]">Reference & Invoice</th>
                  <th className="px-5 py-3.5 w-[22%] min-w-[210px]">Product & Details</th>
                  <th className="px-5 py-3.5 w-[15%] min-w-[155px]">Serial Number</th>
                  <th className="px-5 py-3.5 w-[14%] min-w-[145px]">Customer</th>
                  <th className="px-5 py-3.5 w-[13%] min-w-[140px]">Sale Date & Time</th>
                  <th className="px-5 py-3.5 w-[12%] min-w-[145px]">Warranty Status</th>
                  <th className="px-5 py-3.5 w-[8%] min-w-[125px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filtered.map((p) => {
                  const hasWarranty = p.hasWarranty !== false;
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/70 transition-colors duration-150 group"
                    >
                      {/* Reference & Invoice */}
                      <td className="px-5 py-4 align-top">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="font-mono font-bold text-xs text-slate-900 tracking-tight cursor-pointer hover:text-indigo-600 transition"
                            onClick={() => copyToClipboard(p.purchaseReference)}
                            title="Click to copy reference"
                          >
                            {p.purchaseReference}
                          </span>
                          {copiedText === p.purchaseReference ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <button
                              onClick={() => copyToClipboard(p.purchaseReference)}
                              className="text-slate-300 hover:text-slate-500 transition opacity-0 group-hover:opacity-100"
                              title="Copy Reference"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                          Inv: {p.invoiceNumber}
                        </div>
                        <div className="mt-1.5">
                          {p.billId ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50/90 px-2 py-0.5 rounded-md border border-indigo-200/60">
                              <Receipt className="w-2.5 h-2.5" /> POS Bill
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                              <PlusCircle className="w-2.5 h-2.5 text-slate-400" /> Single Entry
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Product & Details */}
                      <td className="px-5 py-4 align-top">
                        <div className="font-semibold text-sm text-slate-900 group-hover:text-indigo-900 transition-colors">
                          {p.productName}
                        </div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5">
                          {p.productBrand ? `${p.productBrand} ${p.productModel || ''}` : p.productModel || '—'}
                        </div>
                        {p.unitPrice != null && (
                          <div className="text-xs font-semibold text-emerald-700 mt-1 flex items-center gap-1">
                            ${p.unitPrice.toFixed(2)}
                            {p.quantity ? (
                              <span className="text-slate-400 font-normal">× {p.quantity}</span>
                            ) : null}
                          </div>
                        )}
                      </td>

                      {/* Serial Number */}
                      <td className="px-5 py-4 align-top whitespace-nowrap">
                        {p.serialNumber ? (
                          <div className="flex items-center gap-1.5">
                            <span
                              className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-900 text-white shadow-2xs tracking-wider cursor-pointer hover:bg-slate-800 transition"
                              onClick={() => copyToClipboard(p.serialNumber!)}
                              title="Click to copy unique serial number"
                            >
                              <Barcode className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
                              {p.serialNumber}
                            </span>
                            {copiedText === p.serialNumber && (
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/70 italic">
                            No Serial
                          </span>
                        )}
                      </td>

                      {/* Customer Contact */}
                      <td className="px-5 py-4 align-top">
                        {p.customerEmail ? (
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-800">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[155px]" title={p.customerEmail}>
                              {p.customerEmail}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            <User className="w-3 h-3 text-slate-400" /> Walk-in Buyer
                          </span>
                        )}
                      </td>

                      {/* Sale Date & Time */}
                      <td className="px-5 py-4 align-top whitespace-nowrap">
                        <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{p.purchaseDate}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-1">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{formatSaleTime(p.createdAt)}</span>
                        </div>
                      </td>

                      {/* Warranty Status & Coverage */}
                      <td className="px-5 py-4 align-top space-y-1.5 whitespace-nowrap">
                        {hasWarranty ? (
                          <>
                            <div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" /> Digital Warranty
                              </span>
                            </div>
                            <div>{getLinkingBadge(p.linkingStatus, true)}</div>
                            {p.warranty?.expiryDate && (
                              <div className="text-[10px] text-slate-400 font-medium">
                                Valid till: <span className="text-slate-600 font-semibold">{p.warranty.expiryDate}</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                <ShieldAlert className="w-3 h-3 text-slate-400" /> Bill Only
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 italic">No warranty issued</div>
                          </>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 align-top text-right whitespace-nowrap">
                        {p.warranty?.qrToken ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedPurchase(p)}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 px-2.5 py-1.5 rounded-lg border border-indigo-200/80 transition shadow-2xs"
                              title="View official digital warranty card & QR"
                            >
                              <QrCode className="w-3.5 h-3.5 text-indigo-600" /> View Card
                            </button>
                            <Link
                              to={`/verify/${p.warranty.qrToken}`}
                              target="_blank"
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                              title="Open public verification page in new tab"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        ) : p.billId ? (
                          <Link
                            to="/retailer/bills"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-200 transition"
                            title="View POS invoice receipt"
                          >
                            <Receipt className="w-3.5 h-3.5 text-slate-500" /> Receipt
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Standard Sale</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer Summary Bar */}
        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              Showing <span className="font-semibold text-slate-800">{filtered.length}</span> of{' '}
              <span className="font-semibold text-slate-800">{purchases.length}</span> registered purchase records
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
              <span>Unique Serial Key Verification Active</span>
              <span>•</span>
              <span>Live Blockchain/QR Ready</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick-View Digital Warranty Certificate Modal */}
      {selectedPurchase && selectedPurchase.warranty && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Official Digital Warranty</div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">{selectedPurchase.productName}</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPurchase(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {/* Certificate Details Grid */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/70 text-xs">
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Product Brand / Model:</span>
                <span className="font-semibold text-slate-800">
                  {selectedPurchase.productBrand || '—'} {selectedPurchase.productModel || ''}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Serial Number:</span>
                <span className="font-mono font-bold text-slate-900">
                  {selectedPurchase.serialNumber || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Purchase Reference:</span>
                <span className="font-mono text-slate-800">{selectedPurchase.purchaseReference}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Invoice Number:</span>
                <span className="font-mono text-slate-800">{selectedPurchase.invoiceNumber}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Registered Customer:</span>
                <span className="font-medium text-slate-800 truncate block">
                  {selectedPurchase.customerEmail || 'Walk-in Buyer'}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Sale Date:</span>
                <span className="font-semibold text-slate-800">{selectedPurchase.purchaseDate}</span>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-200/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium">Coverage Period:</span>
                <span className="font-bold text-emerald-700 font-mono text-xs">
                  {selectedPurchase.warranty.startDate} &rarr; {selectedPurchase.warranty.expiryDate}
                </span>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="text-center p-4 bg-slate-50/50 rounded-xl border border-slate-200 space-y-2">
              <div className="inline-block p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                <QRCodeSVG
                  value={`${window.location.origin}/verify/${selectedPurchase.warranty.qrToken}`}
                  size={140}
                  level="H"
                />
              </div>
              <div className="text-[11px] font-medium text-slate-600">
                Scan with smartphone camera to verify authenticity
              </div>
              <div className="text-[10px] font-mono text-slate-400 truncate max-w-xs mx-auto">
                Token: {selectedPurchase.warranty.qrToken}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-2 pt-1">
              <Link
                to={`/verify/${selectedPurchase.warranty.qrToken}`}
                target="_blank"
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-1.5 shadow-xs"
              >
                Verify in New Tab <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setSelectedPurchase(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
