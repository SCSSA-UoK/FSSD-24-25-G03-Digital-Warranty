import React, { useEffect, useState } from 'react';
import { productApi, purchaseApi } from '../../api';
import { Product, Purchase } from '../../types';
import { QRCodeSVG } from 'qrcode.react';
import { ShoppingCart, CheckCircle2, AlertCircle, QrCode, Plus, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PurchaseRegistration: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [formData, setFormData] = useState({
    productId: '',
    customerEmail: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    invoiceNumber: '',
    serialNumber: '',
    purchaseReference: '',
    hasWarranty: true,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdPurchase, setCreatedPurchase] = useState<Purchase | null>(null);

  useEffect(() => {
    const fetchActiveProducts = async () => {
      try {
        setLoadingProducts(true);
        const res = await productApi.getProducts(true);
        setProducts(res.content);
        if (res.content.length > 0) {
          const first = res.content[0];
          setFormData((prev) => ({
            ...prev,
            productId: first.id,
            hasWarranty: first.hasWarranty !== false,
          }));
        }
      } catch (err) {
        console.error('Failed to load products', err);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchActiveProducts();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    setCreatedPurchase(null);

    try {
      const data = await purchaseApi.registerPurchase(formData);
      setCreatedPurchase(data);
      // Reset form
      setFormData((prev) => ({
        ...prev,
        customerEmail: '',
        invoiceNumber: '',
        serialNumber: '',
        purchaseReference: '',
      }));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register purchase.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedProduct = products.find((p) => p.id === formData.productId);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Register Customer Purchase</h1>
          <p className="text-sm text-slate-500">
            Quick single product entry. Automatically generates a verifiable digital warranty record.
          </p>
        </div>
        <Link
          to="/retailer/pos"
          className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 text-sm shadow-xs self-start"
        >
          <CreditCard className="w-4 h-4" /> Open POS Terminal
        </Link>
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
        <div className="flex items-center gap-2.5 text-indigo-900">
          <CreditCard className="w-5 h-5 text-indigo-600 shrink-0" />
          <span>Billing a customer at the counter for multiple items or non-warranty products?</span>
        </div>
        <Link
          to="/retailer/pos"
          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shrink-0 text-center transition shadow-xs"
        >
          Switch to POS Terminal &rarr;
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Receipt Card with QR Token */}
      {createdPurchase && (
        <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-sm space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-lg">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            {createdPurchase.warranty ? 'Purchase & Digital Warranty Created!' : 'Purchase Registered (Bill Only - No Warranty)'}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700 bg-white p-4 rounded-xl border border-emerald-100">
            <div>
              <span className="text-slate-400 uppercase font-semibold">Purchase Reference:</span>
              <div className="font-mono text-sm font-bold text-slate-900">{createdPurchase.purchaseReference}</div>
            </div>
            <div>
              <span className="text-slate-400 uppercase font-semibold">Invoice Number:</span>
              <div className="font-mono text-sm font-semibold">{createdPurchase.invoiceNumber}</div>
            </div>
            <div>
              <span className="text-slate-400 uppercase font-semibold">Product:</span>
              <div className="font-semibold text-slate-900">{createdPurchase.productName}</div>
            </div>
            <div>
              <span className="text-slate-400 uppercase font-semibold">Customer Email:</span>
              <div className="font-semibold">{createdPurchase.customerEmail}</div>
            </div>
            {createdPurchase.warranty && (
              <>
                <div>
                  <span className="text-slate-400 uppercase font-semibold">Warranty Period:</span>
                  <div className="font-semibold text-emerald-700">
                    {createdPurchase.warranty.startDate} to {createdPurchase.warranty.expiryDate} (inclusive)
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-semibold">Ownership Status:</span>
                  <div className="font-semibold capitalize text-indigo-700">
                    {createdPurchase.linkingStatus.toLowerCase().replace(/_/g, ' ')}
                  </div>
                </div>
              </>
            )}
          </div>

          {createdPurchase.warranty && (
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-emerald-100">
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                <QRCodeSVG
                  value={`${window.location.origin}/verify/${createdPurchase.warranty.qrToken}`}
                  size={96}
                />
              </div>
              <div className="text-xs space-y-1 text-center sm:text-left">
                <div className="font-semibold text-slate-800 flex items-center gap-1 justify-center sm:justify-start">
                  <QrCode className="w-4 h-4 text-emerald-600" /> Digital Warranty QR Code
                </div>
                <p className="text-slate-500">
                  Customers can scan or visit this link to verify warranty validity anytime.
                </p>
                <Link
                  to={`/verify/${createdPurchase.warranty.qrToken}`}
                  target="_blank"
                  className="inline-block text-indigo-600 font-semibold hover:underline"
                >
                  Open Public Verification Page &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
            Select Product <span className="text-rose-500">*</span>
          </label>
          {loadingProducts ? (
            <div className="text-xs text-slate-400">Loading catalog...</div>
          ) : products.length === 0 ? (
            <div className="p-3 bg-amber-50 rounded-lg text-xs text-amber-800 border border-amber-200">
              No active products found in catalog. Please{' '}
              <Link to="/retailer/products" className="font-semibold underline">
                add products
              </Link>{' '}
              first.
            </div>
          ) : (
            <select
              name="productId"
              required
              value={formData.productId}
              onChange={(e) => {
                const prod = products.find((p) => p.id === e.target.value);
                setFormData({
                  ...formData,
                  productId: e.target.value,
                  hasWarranty: prod ? prod.hasWarranty !== false : true,
                });
              }}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.brand} {p.name} ({p.model}) &bull; Stock: {p.stockQuantity ?? 0} {(p.stockQuantity ?? 0) <= 0 ? ' [OUT OF STOCK]' : ''} {p.hasWarranty !== false ? `— ${p.warrantyDuration} ${p.warrantyUnit?.toLowerCase()} warranty` : '— No Warranty'}
                </option>
              ))}
            </select>
          )}

          {selectedProduct && (selectedProduct.stockQuantity ?? 0) <= 0 && (
            <div className="mt-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>
                <strong>Out of Stock:</strong> 0 units available in inventory. Please replenish stock in Products & Policies before completing purchase.
              </span>
            </div>
          )}
        </div>

        {/* Warranty Option Toggle */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-slate-900 block">Issue Warranty for this Sale?</span>
              <span className="text-xs text-slate-500">
                {formData.hasWarranty 
                  ? 'Digital warranty card, expiry tracking, and QR verification will be created.' 
                  : 'Bill/sale only. No warranty record or QR code will be generated.'}
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.hasWarranty}
                onChange={(e) => setFormData({ ...formData, hasWarranty: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {selectedProduct && formData.hasWarranty && (
            <div className="pt-2 border-t border-slate-200 flex justify-between text-xs text-slate-600">
              <span>
                Policy: <strong>{selectedProduct.warrantyDuration} {selectedProduct.warrantyUnit?.toLowerCase()}</strong>
              </span>
              <span>Terms will be snapshotted at registration</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
              Customer Email <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              name="customerEmail"
              required
              value={formData.customerEmail}
              onChange={handleChange}
              placeholder="customer@example.com"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Used for secure account ownership verification.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
              Purchase Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              name="purchaseDate"
              required
              value={formData.purchaseDate}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
              Store Invoice / Receipt Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="invoiceNumber"
              required
              value={formData.invoiceNumber}
              onChange={handleChange}
              placeholder="INV-2024-90412"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
              Serial Number (Optional)
            </label>
            <input
              type="text"
              name="serialNumber"
              value={formData.serialNumber}
              onChange={handleChange}
              placeholder="SN-99881122"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Enforces uniqueness per retailer & product if provided.
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
            Custom Purchase Reference (Optional)
          </label>
          <input
            type="text"
            name="purchaseReference"
            value={formData.purchaseReference}
            onChange={handleChange}
            placeholder="Leave blank to auto-generate (e.g. PUR-2024-123456)"
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
          />
          <span className="text-[11px] text-slate-400 mt-1 block">
            Retry-safe: submitting an existing reference returns the registered record without duplicate creation.
          </span>
        </div>

        <button
          type="submit"
          disabled={submitting || products.length === 0 || (selectedProduct?.stockQuantity !== undefined && (selectedProduct.stockQuantity ?? 0) <= 0)}
          className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              <ShoppingCart className="w-5 h-5" /> Confirm Purchase & Issue Digital Warranty
            </>
          )}
        </button>
      </form>
    </div>
  );
};

