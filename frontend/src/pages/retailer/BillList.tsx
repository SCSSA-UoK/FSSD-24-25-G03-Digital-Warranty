import React, { useEffect, useState } from 'react';
import { billingApi } from '../../api';
import { Bill } from '../../types';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Receipt, 
  Search, 
  Printer, 
  ShieldCheck, 
  ShieldAlert, 
  Calendar, 
  CreditCard, 
  X, 
  Plus 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const BillList: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const res = await billingApi.getAll(0, 50);
      setBills(res.content);
    } catch (err) {
      console.error('Failed to load bills', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredBills = bills.filter((b) =>
    b.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
    (b.customerName && b.customerName.toLowerCase().includes(search.toLowerCase())) ||
    (b.customerEmail && b.customerEmail.toLowerCase().includes(search.toLowerCase()))
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Invoices & Billing History</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            View past retail transactions, reprint receipts, and track warranty generations.
          </p>
        </div>
        <Link
          to="/retailer/pos"
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Open POS Terminal
        </Link>
      </div>

      {/* Search Filter */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 dark:text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by invoice number, customer name, email..."
          className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">Loading invoices...</div>
        ) : filteredBills.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-2">
            <Receipt className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
            <p>No invoices found. Go to the POS terminal to create your first sale!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Invoice #</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Items</th>
                  <th className="px-6 py-3.5">Warranty Status</th>
                  <th className="px-6 py-3.5">Grand Total</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredBills.map((bill) => {
                  const warrantyItems = bill.items.filter((i) => i.hasWarranty);
                  return (
                    <tr key={bill.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                        {bill.invoiceNumber}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{bill.customerName || 'Walk-in'}</div>
                        {bill.customerEmail && (
                          <div className="text-xs text-slate-500 dark:text-slate-400">{bill.customerEmail}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {bill.items.length} {bill.items.length === 1 ? 'item' : 'items'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {warrantyItems.length > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            {warrantyItems.length} Warranty {warrantyItems.length === 1 ? 'item' : 'items'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                            Bill Only
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-extrabold text-slate-900 dark:text-slate-100">
                          ${bill.grandTotal.toFixed(2)}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{bill.paymentMethod}</div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                        {new Date(bill.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedBill(bill)}
                          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Receipt
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reprint Receipt Modal */}
      {selectedBill && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 no-print shrink-0">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">Invoice Details & Receipt</h3>
              <button onClick={() => setSelectedBill(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Receipt Paper */}
            <div className="flex-1 overflow-y-auto pr-1 py-1">
              <div
                id="printable-bill-receipt"
                className="p-4 sm:p-6 md:p-8 bg-slate-50 dark:bg-slate-800/70 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs sm:text-sm text-slate-800 dark:text-slate-200 space-y-4 sm:space-y-6"
              >
                {/* Store Header */}
                <div className="text-center space-y-1 border-b border-dashed border-slate-300 dark:border-slate-600 pb-3 sm:pb-4">
                  <h2 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-sans">
                    {selectedBill.retailerBusinessName || 'WarranTrack Retail Store'}
                  </h2>
                  {selectedBill.retailerAddress && (
                    <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300">{selectedBill.retailerAddress}</p>
                  )}
                  <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                    {selectedBill.retailerContactPhone && <span>Tel: {selectedBill.retailerContactPhone} &bull; </span>}
                    {selectedBill.retailerContactEmail && <span>{selectedBill.retailerContactEmail}</span>}
                  </div>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] sm:text-xs border-b border-dashed border-slate-300 dark:border-slate-600 pb-3">
                  <div className="space-y-0.5">
                    <div><span className="text-slate-500 dark:text-slate-400">INV #:</span> <strong className="text-slate-900 dark:text-slate-100">{selectedBill.invoiceNumber}</strong></div>
                    <div><span className="text-slate-500 dark:text-slate-400">Customer:</span> <strong className="text-slate-900 dark:text-slate-100">{selectedBill.customerName}</strong></div>
                    {selectedBill.customerEmail && <div><span className="text-slate-500 dark:text-slate-400">Email:</span> {selectedBill.customerEmail}</div>}
                  </div>
                  <div className="sm:text-right space-y-0.5">
                    <div><span className="text-slate-500 dark:text-slate-400">Date:</span> {new Date(selectedBill.createdAt).toLocaleDateString()} {new Date(selectedBill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <div><span className="text-slate-500 dark:text-slate-400">Paid via:</span> <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedBill.paymentMethod}</span></div>
                  </div>
                </div>

                {/* Line Items */}
                <div className="space-y-1.5 border-b border-dashed border-slate-300 dark:border-slate-600 pb-3 sm:pb-4">
                  <div className="grid grid-cols-12 gap-2 font-bold text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 uppercase pb-1.5 border-b border-slate-200 dark:border-slate-700">
                    <span className="col-span-6 sm:col-span-7">Item</span>
                    <span className="col-span-2 sm:col-span-1 text-center">Qty</span>
                    <span className="col-span-2 text-right">Price</span>
                    <span className="col-span-2 text-right">Total</span>
                  </div>
                  {selectedBill.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 py-1.5 items-start text-xs sm:text-sm border-b border-slate-200/50 dark:border-slate-700/60 last:border-b-0">
                      <div className="col-span-6 sm:col-span-7 pr-1">
                        <div className="font-bold text-slate-900 dark:text-slate-100 break-words">{item.productName}</div>
                        {item.hasWarranty ? (
                          <div className="text-[10px] sm:text-xs text-emerald-700 dark:text-emerald-400 font-sans font-semibold mt-0.5">
                            [✓ Warranty: {item.warrantyDuration} {item.warrantyUnit?.toLowerCase()} until {item.warrantyExpiryDate}]
                          </div>
                        ) : (
                          <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">
                            [Non-Warranty Product]
                          </div>
                        )}
                        {item.serialNumber && (
                          <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">S/N: {item.serialNumber}</div>
                        )}
                      </div>
                      <div className="col-span-2 sm:col-span-1 text-center font-medium">{item.quantity}</div>
                      <div className="col-span-2 text-right font-medium">${item.unitPrice.toFixed(2)}</div>
                      <div className="col-span-2 text-right font-bold text-slate-900 dark:text-slate-100">${item.lineTotal.toFixed(2)}</div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="max-w-xs sm:max-w-sm ml-auto space-y-1 text-right text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Subtotal:</span>
                    <span>${selectedBill.subtotal.toFixed(2)}</span>
                  </div>
                  {selectedBill.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-medium">
                      <span>Discount:</span>
                      <span>-${selectedBill.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedBill.taxAmount > 0 && (
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Tax:</span>
                      <span>+${selectedBill.taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 pt-1.5 border-t border-slate-300 dark:border-slate-600">
                    <span>Total Paid:</span>
                    <span>${selectedBill.grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* QR Code for Warranties */}
                {selectedBill.items.some((item) => item.hasWarranty && item.qrToken) && (
                  <div className="pt-4 border-t-2 border-dashed border-slate-300 dark:border-slate-600 space-y-3">
                    <div className="text-center font-bold text-slate-900 dark:text-slate-100 font-sans uppercase text-[11px] sm:text-xs tracking-wider">
                      Digital Warranty QR Code
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedBill.items
                        .filter((item) => item.hasWarranty && item.qrToken)
                        .map((item, idx) => (
                          <div key={idx} className="flex flex-col items-center text-center p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
                            <div className="p-1.5 bg-white rounded-md">
                              <QRCodeSVG
                                value={`${window.location.origin}/verify/${item.qrToken}`}
                                size={100}
                              />
                            </div>
                            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 font-sans line-clamp-1">
                              {item.productName}
                            </span>
                            <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-sans leading-tight">
                              Scan to verify or claim<br/>
                              (Valid till {item.warrantyExpiryDate})
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="text-center text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-dashed border-slate-200 dark:border-slate-700 space-y-0.5">
                  <p>Thank you for your business!</p>
                  <p>Powered by WarranTrack &bull; Digital Warranty & Billing Platform</p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 no-print shrink-0">
              <button
                type="button"
                onClick={() => setSelectedBill(null)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-bill-receipt, #printable-bill-receipt * {
            visibility: visible;
            color: #0f172a !important;
          }
          #printable-bill-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none;
            background: white !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

