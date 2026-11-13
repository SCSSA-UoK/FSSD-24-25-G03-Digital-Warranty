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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Invoices & Billing History</h1>
          <p className="text-xs text-slate-500">
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
        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by invoice number, customer name, email..."
          className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading invoices...</div>
        ) : filteredBills.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Receipt className="w-10 h-10 mx-auto text-slate-300" />
            <p>No invoices found. Go to the POS terminal to create your first sale!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase text-slate-400 font-semibold border-b border-slate-200">
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
              <tbody className="divide-y divide-slate-100">
                {filteredBills.map((bill) => {
                  const warrantyItems = bill.items.filter((i) => i.hasWarranty);
                  return (
                    <tr key={bill.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">
                        {bill.invoiceNumber}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{bill.customerName || 'Walk-in'}</div>
                        {bill.customerEmail && (
                          <div className="text-xs text-slate-400">{bill.customerEmail}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-700">
                          {bill.items.length} {bill.items.length === 1 ? 'item' : 'items'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {warrantyItems.length > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            {warrantyItems.length} Warranty {warrantyItems.length === 1 ? 'item' : 'items'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                            Bill Only
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-extrabold text-slate-900">
                          ${bill.grandTotal.toFixed(2)}
                        </div>
                        <div className="text-[11px] text-slate-400">{bill.paymentMethod}</div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(bill.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedBill(bill)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition inline-flex items-center gap-1.5"
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between no-print">
              <h3 className="font-bold text-slate-900 text-base">Invoice Details & Receipt</h3>
              <button onClick={() => setSelectedBill(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt paper */}
            <div
              id="printable-bill-receipt"
              className="p-6 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs text-slate-800 space-y-4"
            >
              {/* Store Header */}
              <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-3">
                <h2 className="text-base font-bold tracking-tight text-slate-900 font-sans">
                  {selectedBill.retailerBusinessName || 'WarranTrack Retail Store'}
                </h2>
                {selectedBill.retailerAddress && (
                  <p className="text-[11px] text-slate-600">{selectedBill.retailerAddress}</p>
                )}
                <div className="text-[10px] text-slate-500">
                  {selectedBill.retailerContactPhone && <span>Tel: {selectedBill.retailerContactPhone} &bull; </span>}
                  {selectedBill.retailerContactEmail && <span>{selectedBill.retailerContactEmail}</span>}
                </div>
              </div>

              {/* Metadata */}
              <div className="flex justify-between text-[11px] border-b border-dashed border-slate-300 pb-2">
                <div>
                  <div><strong>INV #:</strong> {selectedBill.invoiceNumber}</div>
                  <div><strong>Customer:</strong> {selectedBill.customerName}</div>
                  {selectedBill.customerEmail && <div><strong>Email:</strong> {selectedBill.customerEmail}</div>}
                </div>
                <div className="text-right">
                  <div>{new Date(selectedBill.createdAt).toLocaleDateString()}</div>
                  <div>{new Date(selectedBill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  <div><strong>Paid via:</strong> {selectedBill.paymentMethod}</div>
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3">
                <div className="grid grid-cols-12 font-bold text-[11px] text-slate-500 uppercase pb-1 border-b border-slate-200">
                  <span className="col-span-6">Item</span>
                  <span className="col-span-2 text-center">Qty</span>
                  <span className="col-span-2 text-right">Price</span>
                  <span className="col-span-2 text-right">Total</span>
                </div>
                {selectedBill.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 py-1 items-center">
                    <div className="col-span-6 pr-1">
                      <div className="font-bold text-slate-900 truncate">{item.productName}</div>
                      {item.hasWarranty ? (
                        <div className="text-[10px] text-emerald-700 font-sans font-semibold">
                          [✓ Warranty: {item.warrantyDuration} {item.warrantyUnit?.toLowerCase()} until {item.warrantyExpiryDate}]
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-500 font-sans">
                          [Non-Warranty Product]
                        </div>
                      )}
                      {item.serialNumber && (
                        <div className="text-[9px] text-slate-500">S/N: {item.serialNumber}</div>
                      )}
                    </div>
                    <div className="col-span-2 text-center">{item.quantity}</div>
                    <div className="col-span-2 text-right">${item.unitPrice.toFixed(2)}</div>
                    <div className="col-span-2 text-right font-bold">${item.lineTotal.toFixed(2)}</div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-1 text-right text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${selectedBill.subtotal.toFixed(2)}</span>
                </div>
                {selectedBill.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span>-${selectedBill.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {selectedBill.taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>+${selectedBill.taxAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1 border-t border-slate-300">
                  <span>Total Paid:</span>
                  <span>${selectedBill.grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* QR Code for Warranties */}
              {selectedBill.items.some((item) => item.hasWarranty && item.qrToken) && (
                <div className="pt-3 border-t-2 border-dashed border-slate-300 space-y-2">
                  <div className="text-center font-bold text-slate-900 font-sans uppercase text-[11px] tracking-wider">
                    Digital Warranty QR Code
                  </div>
                  <div className="flex flex-col items-center justify-center gap-2 bg-white p-3 rounded-lg border border-slate-200">
                    {selectedBill.items
                      .filter((item) => item.hasWarranty && item.qrToken)
                      .map((item, idx) => (
                        <div key={idx} className="flex flex-col items-center text-center space-y-1">
                          <QRCodeSVG
                            value={`${window.location.origin}/verify/${item.qrToken}`}
                            size={100}
                          />
                          <span className="text-[10px] font-bold text-slate-800 font-sans">
                            {item.productName}
                          </span>
                          <span className="text-[9px] text-slate-500 font-sans">
                            Valid till {item.warrantyExpiryDate}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="text-center text-[10px] text-slate-400 pt-2 border-t border-dashed border-slate-200 space-y-0.5">
                <p>Thank you for your business!</p>
                <p>Powered by WarranTrack &bull; Digital Warranty & Billing Platform</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 no-print">
              <button
                type="button"
                onClick={() => setSelectedBill(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg text-xs hover:bg-slate-50 transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md transition"
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

