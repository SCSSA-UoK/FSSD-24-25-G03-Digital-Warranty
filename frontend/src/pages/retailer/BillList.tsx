import React, { useEffect, useState } from 'react';
import { billingApi } from '../../api';
import { Bill } from '../../types';
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
import { InvoiceReceipt } from '../../components/InvoiceReceipt';

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

  const filteredBills = bills.filter((b) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      b.invoiceNumber.toLowerCase().includes(q) ||
      (b.customerName && b.customerName.toLowerCase().includes(q)) ||
      (b.customerEmail && b.customerEmail.toLowerCase().includes(q)) ||
      b.items.some(
        (i) =>
          (i.serialNumber && i.serialNumber.toLowerCase().includes(q)) ||
          i.productName.toLowerCase().includes(q)
      )
    );
  });

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
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition self-start sm:self-auto"
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
          placeholder="Search by invoice #, customer, product, or serial #..."
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
                  const totalUnits = bill.items.reduce((sum, i) => sum + Math.max(1, i.quantity || 1), 0);
                  const warrantyUnits = bill.items
                    .filter((i) => i.hasWarranty)
                    .reduce((sum, i) => sum + Math.max(1, i.quantity || 1), 0);
                  const serialNumbers = bill.items
                    .map((i) => i.serialNumber)
                    .filter((sn): sn is string => Boolean(sn && sn.trim()));
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
                          {totalUnits} {totalUnits === 1 ? 'unit' : 'units'}
                        </span>
                        {serialNumbers.length > 0 && (
                          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate max-w-[180px] mt-0.5" title={serialNumbers.join(', ')}>
                            S/N: {serialNumbers.slice(0, 2).join(', ')}{serialNumbers.length > 2 ? ` +${serialNumbers.length - 2}` : ''}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {warrantyUnits > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            {warrantyUnits} Warranty {warrantyUnits === 1 ? 'unit' : 'units'}
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
              <InvoiceReceipt bill={selectedBill} receiptId="printable-bill-receipt" />
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

