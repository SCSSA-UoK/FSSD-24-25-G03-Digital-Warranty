import React from 'react';
import { Bill, BillItem } from '../types';
import { ShieldCheck, CheckCircle2, Receipt, User, Calendar, Banknote } from 'lucide-react';

interface InvoiceReceiptProps {
  bill: Bill;
  receiptId: string;
  receiptRef?: React.RefObject<HTMLDivElement>;
}

interface GroupedInvoiceLine {
  key: string;
  productName: string;
  unitPrice: number;
  totalQuantity: number;
  totalLineAmount: number;
  hasWarranty: boolean;
  warrantyDuration?: number;
  warrantyUnit?: string;
  warrantyExpiryDate?: string;
  units: BillItem[];
}

/**
 * Shared printable and on-screen Invoice & Receipt component.
 * Displays grouped product lines, unit serial numbers, financial settlement
 * (Subtotal, Discount, Tax, Grand Total, Received Amount, and Change / Balance),
 * and individual Digital Warranty Passport QR codes for registered physical units.
 */
export const InvoiceReceipt: React.FC<InvoiceReceiptProps> = ({ bill, receiptId, receiptRef }) => {
  // Group identical product lines for clean invoice summary while preserving every individual unit's serial number
  const groupedLines: GroupedInvoiceLine[] = [];
  const groupIndexByKey = new Map<string, number>();

  for (const item of bill.items) {
    const key = [
      item.productId || '',
      item.productName,
      item.unitPrice.toFixed(2),
      String(item.hasWarranty),
      String(item.warrantyDuration || ''),
      String(item.warrantyUnit || ''),
      String(item.warrantyExpiryDate || ''),
    ].join('|');

    const existingIdx = groupIndexByKey.get(key);
    const qty = Math.max(1, item.quantity || 1);
    const lineTot = item.lineTotal ?? item.unitPrice * qty;

    if (existingIdx !== undefined) {
      const group = groupedLines[existingIdx];
      group.totalQuantity += qty;
      group.totalLineAmount = Math.round((group.totalLineAmount + lineTot) * 100) / 100;
      group.units.push(item);
    } else {
      groupIndexByKey.set(key, groupedLines.length);
      groupedLines.push({
        key,
        productName: item.productName,
        unitPrice: item.unitPrice,
        totalQuantity: qty,
        totalLineAmount: Math.round(lineTot * 100) / 100,
        hasWarranty: item.hasWarranty,
        warrantyDuration: item.warrantyDuration,
        warrantyUnit: item.warrantyUnit,
        warrantyExpiryDate: item.warrantyExpiryDate,
        units: [item],
      });
    }
  }

  // Payment Settlement calculations: Received Amount & Change / Balance
  const receivedAmount =
    bill.receivedAmount !== undefined && bill.receivedAmount !== null
      ? bill.receivedAmount
      : bill.grandTotal;

  const changeAmount =
    bill.changeAmount !== undefined && bill.changeAmount !== null
      ? bill.changeAmount
      : Math.max(0, Math.round((receivedAmount - bill.grandTotal) * 100) / 100);

  const balanceDue = Math.max(0, Math.round((bill.grandTotal - receivedAmount) * 100) / 100);
  const isOverpaidOrExact = receivedAmount >= bill.grandTotal;

  return (
    <div
      ref={receiptRef}
      id={receiptId}
      className="receipt-container p-4 sm:p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-slate-800 dark:text-slate-100 font-sans text-xs sm:text-sm space-y-5 transition-colors print:p-0 print:border-none print:shadow-none print:bg-white print:text-black"
    >
      {/* Top Header & Store Identity */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 mb-1.5">
              <Receipt className="w-3 h-3" />
              <span>Official Tax Invoice & Warranty</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-black tracking-tight text-slate-950 dark:text-white">
              {bill.retailerBusinessName || 'WarranTrack Retail Store'}
            </h1>
            {bill.retailerAddress && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                {bill.retailerAddress}
              </p>
            )}
          </div>

          <div className="sm:text-right space-y-0.5 text-xs text-slate-500 dark:text-slate-400">
            {bill.retailerContactPhone && (
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Tel: </span>
                <span>{bill.retailerContactPhone}</span>
              </div>
            )}
            {bill.retailerContactEmail && (
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Email: </span>
                <span>{bill.retailerContactEmail}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Metadata Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
        {/* Left: Invoice & Date */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Invoice No:</span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100 px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              {bill.invoiceNumber}
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              {new Date(bill.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}{' '}
              &bull;{' '}
              {new Date(bill.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>

        {/* Right: Customer & Payment Method */}
        <div className="space-y-1.5 sm:text-right">
          <div className="flex items-center sm:justify-end gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-500 dark:text-slate-400 font-medium">Customer:</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{bill.customerName || 'Walk-in Customer'}</span>
          </div>
          {bill.customerEmail && (
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {bill.customerEmail}
            </div>
          )}
          {bill.customerPhone && (
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Tel: {bill.customerPhone}
            </div>
          )}
          <div className="flex items-center sm:justify-end gap-1.5 pt-0.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              PAID &bull; {bill.paymentMethod}
            </span>
            {bill.paymentNotes && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[150px]" title={bill.paymentNotes}>
                ({bill.paymentNotes})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-3 sm:px-4 py-2.5 bg-slate-100/80 dark:bg-slate-800/90 font-bold text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
          <span className="col-span-6 sm:col-span-7">Items & Unit Details</span>
          <span className="col-span-2 sm:col-span-1 text-center">Qty</span>
          <span className="col-span-2 text-right">Price</span>
          <span className="col-span-2 text-right">Total</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900/50">
          {groupedLines.map((group) => {
            const serials = group.units
              .map((u, idx) => ({ serial: u.serialNumber, unitNum: idx + 1 }))
              .filter((entry) => entry.serial && entry.serial.trim().length > 0);

            return (
              <div
                key={group.key}
                className="grid grid-cols-12 gap-2 px-3 sm:px-4 py-3 items-start text-xs sm:text-sm hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition"
              >
                <div className="col-span-6 sm:col-span-7 pr-2">
                  <div className="font-bold text-slate-900 dark:text-slate-100 break-words leading-snug">
                    {group.productName}
                  </div>

                  {group.hasWarranty ? (
                    <div className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mt-1 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/60">
                      <ShieldCheck className="w-3 h-3 shrink-0" />
                      <span>
                        Warranty: {group.warrantyDuration} {group.warrantyUnit?.toLowerCase()} (Valid until{' '}
                        {group.warrantyExpiryDate})
                      </span>
                    </div>
                  ) : (
                    <div className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      Standard retail sale (no registered warranty)
                    </div>
                  )}

                  {serials.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {serials.map((s) => (
                        <div
                          key={`${group.key}-${s.unitNum}`}
                          className="text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5 flex-wrap"
                        >
                          {group.totalQuantity > 1 && (
                            <span className="font-semibold text-slate-500 dark:text-slate-400">
                              Unit #{s.unitNum}:
                            </span>
                          )}
                          <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700">
                            S/N: {s.serial}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="col-span-2 sm:col-span-1 text-center font-semibold text-slate-700 dark:text-slate-300">
                  {group.totalQuantity}
                </div>
                <div className="col-span-2 text-right font-medium text-slate-600 dark:text-slate-400">
                  ${group.unitPrice.toFixed(2)}
                </div>
                <div className="col-span-2 text-right font-bold text-slate-900 dark:text-slate-100">
                  ${group.totalLineAmount.toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Financial Settlement Breakdown (Totals, Received Amount & Balance) */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
        {/* Left note/terms */}
        <div className="w-full sm:max-w-xs space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
          <p className="font-semibold text-slate-700 dark:text-slate-300">Payment & Warranty Terms:</p>
          <p>
            Goods sold with warranty are subject to manufacturer terms. Keep this digital or printed invoice
            for warranty coverage, servicing, and claims.
          </p>
        </div>

        {/* Right Financial Box */}
        <div className="w-full sm:max-w-xs md:max-w-sm p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs sm:text-sm">
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Subtotal:</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              ${bill.subtotal.toFixed(2)}
            </span>
          </div>

          {bill.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-medium">
              <span>Discount:</span>
              <span>-${bill.discountAmount.toFixed(2)}</span>
            </div>
          )}

          {bill.taxAmount > 0 && (
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Tax / VAT:</span>
              <span>+${bill.taxAmount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-base font-black text-slate-950 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
            <span>Grand Total:</span>
            <span className="text-emerald-700 dark:text-emerald-400">${bill.grandTotal.toFixed(2)}</span>
          </div>

          {/* Payment Tender: Received Amount & Balance */}
          <div className="pt-2.5 border-t border-dashed border-slate-300 dark:border-slate-600 space-y-1.5">
            <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
              <span className="font-semibold flex items-center gap-1">
                <Banknote className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Received Amount:
              </span>
              <span className="font-mono font-bold text-slate-950 dark:text-white">
                ${receivedAmount.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center font-bold">
              <span className="text-slate-700 dark:text-slate-300">
                {isOverpaidOrExact ? 'Change Returned:' : 'Balance Due:'}
              </span>
              <span
                className={`font-mono px-2 py-0.5 rounded ${
                  isOverpaidOrExact
                    ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800'
                    : 'text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800'
                }`}
              >
                ${(isOverpaidOrExact ? changeAmount : balanceDue).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer & Barcode Simulation */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-center space-y-2">
        {/* Visual Barcode pattern */}
        <div className="flex items-center justify-center gap-1 opacity-70 py-1">
          {[4, 2, 6, 2, 8, 3, 5, 2, 7, 2, 4, 6, 3, 8, 2, 5, 3, 7, 2, 6, 4].map((width, i) => (
            <div
              key={i}
              className="bg-slate-800 dark:bg-slate-300 h-6"
              style={{ width: `${width}px` }}
            />
          ))}
        </div>
        <p className="font-mono text-[10px] tracking-widest text-slate-500 dark:text-slate-400">
          *{bill.invoiceNumber}*
        </p>
        <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
          <p className="font-medium text-slate-700 dark:text-slate-300">Thank you for your business!</p>
          <p>Powered by WarranTrack &bull; Digital Warranty & Invoicing Platform</p>
        </div>
      </div>
    </div>
  );
};
