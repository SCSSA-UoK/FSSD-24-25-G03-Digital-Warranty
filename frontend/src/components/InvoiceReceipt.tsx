import React from 'react';
import { Bill, BillItem } from '../types';
import { QRCodeSVG } from 'qrcode.react';

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
 * Shared printable/on-screen Invoice & Receipt component.
 * Displays grouped product line totals alongside every individual unit's serial number
 * and renders a unique QR code card for each registered warranty unit on the same invoice.
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

  // Collect all units with warranty QR codes, tracking per-product unit indices for clear labeling
  const qrUnits = bill.items.filter((item) => item.hasWarranty && item.qrToken);
  const productCounts = new Map<string, number>();
  for (const u of qrUnits) {
    productCounts.set(u.productName, (productCounts.get(u.productName) || 0) + 1);
  }
  const productRunningIdx = new Map<string, number>();

  return (
    <div
      ref={receiptRef}
      id={receiptId}
      className="p-4 sm:p-6 md:p-8 bg-slate-50 dark:bg-slate-800/70 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs sm:text-sm text-slate-800 dark:text-slate-200 space-y-4 sm:space-y-6"
    >
      {/* Store Header */}
      <div className="text-center space-y-1 border-b border-dashed border-slate-300 dark:border-slate-600 pb-3 sm:pb-4">
        <h2 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-sans">
          {bill.retailerBusinessName || 'WarranTrack Retail Store'}
        </h2>
        {bill.retailerAddress && (
          <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300">{bill.retailerAddress}</p>
        )}
        <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
          {bill.retailerContactPhone && <span>Tel: {bill.retailerContactPhone} &bull; </span>}
          {bill.retailerContactEmail && <span>{bill.retailerContactEmail}</span>}
        </div>
      </div>

      {/* Invoice Metadata */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] sm:text-xs border-b border-dashed border-slate-300 dark:border-slate-600 pb-3">
        <div className="space-y-0.5">
          <div>
            <span className="text-slate-500 dark:text-slate-400">INV #:</span>{' '}
            <strong className="text-slate-900 dark:text-slate-100">{bill.invoiceNumber}</strong>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Customer:</span>{' '}
            <strong className="text-slate-900 dark:text-slate-100">{bill.customerName}</strong>
          </div>
          {bill.customerEmail && (
            <div>
              <span className="text-slate-500 dark:text-slate-400">Email:</span> {bill.customerEmail}
            </div>
          )}
        </div>
        <div className="sm:text-right space-y-0.5">
          <div>
            <span className="text-slate-500 dark:text-slate-400">Date:</span>{' '}
            {new Date(bill.createdAt).toLocaleDateString()}{' '}
            {new Date(bill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Paid via:</span>{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-100">{bill.paymentMethod}</span>
          </div>
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

        {groupedLines.map((group) => {
          const serials = group.units
            .map((u, idx) => ({ serial: u.serialNumber, unitNum: idx + 1 }))
            .filter((entry) => entry.serial && entry.serial.trim().length > 0);

          return (
            <div
              key={group.key}
              className="grid grid-cols-12 gap-2 py-2 items-start text-xs sm:text-sm border-b border-slate-200/50 dark:border-slate-700/60 last:border-b-0"
            >
              <div className="col-span-6 sm:col-span-7 pr-1">
                <div className="font-bold text-slate-900 dark:text-slate-100 break-words">{group.productName}</div>
                {group.hasWarranty ? (
                  <div className="text-[10px] sm:text-xs text-emerald-700 dark:text-emerald-400 font-sans font-semibold mt-0.5">
                    [✓ Warranty: {group.warrantyDuration} {group.warrantyUnit?.toLowerCase()} until {group.warrantyExpiryDate}]
                  </div>
                ) : (
                  <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">
                    [Non-Warranty Product]
                  </div>
                )}

                {serials.length > 0 && (
                  <div className="mt-1.5 space-y-0.5">
                    {serials.map((s) => (
                      <div
                        key={`${group.key}-${s.unitNum}`}
                        className="text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1 flex-wrap"
                      >
                        {group.totalQuantity > 1 && (
                          <span className="font-sans font-semibold text-slate-500 dark:text-slate-400">
                            Unit #{s.unitNum}:
                          </span>
                        )}
                        <span className="font-mono font-semibold text-slate-800 dark:text-slate-100">
                          S/N: {s.serial}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="col-span-2 sm:col-span-1 text-center font-medium">{group.totalQuantity}</div>
              <div className="col-span-2 text-right font-medium">${group.unitPrice.toFixed(2)}</div>
              <div className="col-span-2 text-right font-bold text-slate-900 dark:text-slate-100">
                ${group.totalLineAmount.toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Totals */}
      <div className="max-w-xs sm:max-w-sm ml-auto space-y-1 text-right text-xs sm:text-sm">
        <div className="flex justify-between">
          <span className="text-slate-600 dark:text-slate-400">Subtotal:</span>
          <span>${bill.subtotal.toFixed(2)}</span>
        </div>
        {bill.discountAmount > 0 && (
          <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-medium">
            <span>Discount:</span>
            <span>-${bill.discountAmount.toFixed(2)}</span>
          </div>
        )}
        {bill.taxAmount > 0 && (
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Tax:</span>
            <span>+${bill.taxAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 pt-1.5 border-t border-slate-300 dark:border-slate-600">
          <span>Total Paid:</span>
          <span>${bill.grandTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* Digital Warranty Passport QR Codes Section (Unique QR per registered unit) */}
      {qrUnits.length > 0 && (
        <div className="pt-4 border-t-2 border-dashed border-slate-300 dark:border-slate-600 space-y-3">
          <div className="text-center font-bold text-slate-900 dark:text-slate-100 font-sans uppercase text-[11px] sm:text-xs tracking-wider">
            Digital Warranty Passport QR {qrUnits.length > 1 ? `Codes (${qrUnits.length} Units)` : 'Code'}
          </div>
          <div className={qrUnits.length === 1 ? 'flex justify-center' : 'grid grid-cols-1 sm:grid-cols-2 gap-3'}>
            {qrUnits.map((item, idx) => {
              const totalForProduct = productCounts.get(item.productName) || 1;
              const currentUnitIdx = (productRunningIdx.get(item.productName) || 0) + 1;
              productRunningIdx.set(item.productName, currentUnitIdx);

              return (
                <div
                  key={`${item.warrantyId || item.qrToken}-${idx}`}
                  className={`flex flex-col items-center text-center p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5 ${
                    qrUnits.length === 1 ? 'w-full max-w-xs' : ''
                  }`}
                >
                  {totalForProduct > 1 && (
                    <span className="text-[10px] font-sans font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/60">
                      Unit {currentUnitIdx} of {totalForProduct}
                    </span>
                  )}
                  <div className="p-2 bg-white rounded-md border border-slate-100 flex items-center justify-center shrink-0">
                    <QRCodeSVG
                      value={`${window.location.origin}/verify/${item.qrToken}`}
                      size={100}
                      className="block"
                    />
                  </div>
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 font-sans line-clamp-1">
                    {item.productName}
                  </span>
                  {item.serialNumber && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                      S/N: {item.serialNumber}
                    </span>
                  )}
                  <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-sans leading-tight">
                    Scan to verify or claim
                    <br />
                    (Valid till {item.warrantyExpiryDate})
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-dashed border-slate-200 dark:border-slate-700 space-y-0.5">
        <p>Thank you for your business!</p>
        <p>Powered by WarranTrack &bull; Digital Warranty & Billing Platform</p>
      </div>
    </div>
  );
};
