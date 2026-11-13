import React, { useEffect, useState, useRef } from 'react';
import { productApi, billingApi } from '../../api';
import { Product, Bill, WarrantyUnit, PaymentMethod, CreateBillRequest } from '../../types';
import { QRCodeSVG } from 'qrcode.react';
import { 
  CreditCard, 
  Search, 
  Plus, 
  Trash2, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  ShieldAlert, 
  Receipt, 
  ShoppingBag, 
  History,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface CartLineItem {
  id: string; // local key
  productId?: string;
  productName: string;
  brand?: string;
  category?: string;
  serialNumber?: string;
  quantity: number;
  unitPrice: number;
  hasWarranty: boolean;
  warrantyDuration: number;
  warrantyUnit: WarrantyUnit;
  warrantyTerms: string;
}

export const PosBilling: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'WARRANTY' | 'NON_WARRANTY'>('ALL');

  // Customer details
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Cart
  const [cart, setCart] = useState<CartLineItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Custom Item Modal
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customItem, setCustomItem] = useState({
    name: '',
    price: 0,
    hasWarranty: false,
    duration: 12,
    unit: 'MONTHS' as WarrantyUnit,
    terms: 'Standard retail warranty.',
  });

  // Submission & Receipt
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdBill, setCreatedBill] = useState<Bill | null>(null);

  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchActiveProducts();
  }, []);

  const fetchActiveProducts = async () => {
    try {
      setLoadingProducts(true);
      const res = await productApi.getProducts(true);
      setProducts(res.content);
    } catch (err) {
      console.error('Failed to load products for POS', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Add catalog product to cart
  const addToCart = (product: Product) => {
    const availableStock = product.stockQuantity ?? 0;
    if (availableStock <= 0) {
      setError(`Cannot add "${product.name}": Product is currently out of stock (0 available).`);
      return;
    }

    const existingIndex = cart.findIndex((item) => item.productId === product.id);
    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty + 1 > availableStock) {
        setError(`Cannot add more "${product.name}": Only ${availableStock} unit(s) available in inventory.`);
        return;
      }
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      const isWarranty = product.hasWarranty !== false;
      const newLine: CartLineItem = {
        id: 'cart_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        productId: product.id,
        productName: `${product.brand} ${product.name}`,
        brand: product.brand,
        category: product.category,
        serialNumber: '',
        quantity: 1,
        unitPrice: product.price || 0,
        hasWarranty: isWarranty,
        warrantyDuration: product.warrantyDuration || 12,
        warrantyUnit: product.warrantyUnit || 'MONTHS',
        warrantyTerms: product.warrantyTerms || 'Standard manufacturer warranty',
      };
      setCart([...cart, newLine]);
    }
    setError(null);
  };

  // Add custom line item
  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customItem.name.trim()) return;

    const newLine: CartLineItem = {
      id: 'custom_' + Date.now(),
      productName: customItem.name.trim(),
      brand: 'Custom Item',
      category: 'General',
      serialNumber: '',
      quantity: 1,
      unitPrice: customItem.price || 0,
      hasWarranty: customItem.hasWarranty,
      warrantyDuration: customItem.duration,
      warrantyUnit: customItem.unit,
      warrantyTerms: customItem.terms,
    };
    setCart([...cart, newLine]);
    setShowCustomModal(false);
    setCustomItem({
      name: '',
      price: 0,
      hasWarranty: false,
      duration: 12,
      unit: 'MONTHS',
      terms: 'Standard retail warranty.',
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    const item = cart.find((i) => i.id === id);
    if (!item) return;

    if (delta > 0 && item.productId) {
      const product = products.find((p) => p.id === item.productId);
      if (product) {
        const availableStock = product.stockQuantity ?? 0;
        if (item.quantity + delta > availableStock) {
          setError(`Cannot increase quantity for "${item.productName}": Max available stock is ${availableStock} unit(s).`);
          return;
        }
      }
    }

    setCart((prev) =>
      prev
        .map((it) => {
          if (it.id === id) {
            const newQty = it.quantity + delta;
            return newQty > 0 ? { ...it, quantity: newQty } : null;
          }
          return it;
        })
        .filter((it): it is CartLineItem => it !== null)
    );
    setError(null);
  };

  const updateUnitPrice = (id: string, price: number) => {
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, unitPrice: Math.max(0, price) } : item))
    );
  };

  const updateSerialNumber = (id: string, serial: string) => {
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, serialNumber: serial } : item))
    );
  };

  const toggleWarranty = (id: string) => {
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, hasWarranty: !item.hasWarranty } : item))
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountAmount(0);
    setTaxAmount(0);
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setPaymentNotes('');
    setError(null);
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const grandTotal = Math.max(0, subtotal - (discountAmount || 0) + (taxAmount || 0));

  const hasStockViolations = cart.some((item) => {
    if (!item.productId) return false;
    const prod = products.find((p) => p.id === item.productId);
    if (!prod) return false;
    const available = prod.stockQuantity ?? 0;
    return available <= 0 || item.quantity > available;
  });

  // Handle Checkout / Generate Bill
  const handleGenerateBill = async () => {
    if (cart.length === 0) {
      setError('Please add at least one item to the cart.');
      return;
    }

    // Check if any warranty items require email
    const hasWarrantyItems = cart.some((item) => item.hasWarranty);
    if (hasWarrantyItems && customerEmail && !customerEmail.includes('@')) {
      setError('Please enter a valid customer email for warranty registration.');
      return;
    }

    // Verify no cart item is out of stock or exceeds available inventory
    for (const item of cart) {
      if (item.productId) {
        const prod = products.find((p) => p.id === item.productId);
        if (prod) {
          const available = prod.stockQuantity ?? 0;
          if (available <= 0) {
            setError(`Sale blocked: "${item.productName}" is out of stock (0 available). Please remove it from the cart.`);
            return;
          }
          if (item.quantity > available) {
            setError(`Sale blocked: Quantity for "${item.productName}" (${item.quantity}) exceeds available stock (${available}).`);
            return;
          }
        }
      }
    }

    setError(null);
    setSubmitting(true);

    const payload: CreateBillRequest = {
      customerName: customerName.trim() || 'Walk-in Customer',
      customerEmail: customerEmail.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      discountAmount: Number(discountAmount) || 0,
      taxAmount: Number(taxAmount) || 0,
      paymentMethod,
      paymentNotes: paymentNotes.trim() || undefined,
      items: cart.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        brand: item.brand,
        category: item.category,
        serialNumber: item.serialNumber?.trim() || undefined,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        hasWarranty: item.hasWarranty,
        warrantyDuration: item.hasWarranty ? item.warrantyDuration : undefined,
        warrantyUnit: item.hasWarranty ? item.warrantyUnit : undefined,
        warrantyTerms: item.hasWarranty ? item.warrantyTerms : undefined,
      })),
    };

    try {
      const bill = await billingApi.create(payload);
      setCreatedBill(bill);
      clearCart();
      fetchActiveProducts(); // refresh product catalog with updated stock!
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate bill. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase()) ||
      p.model.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filterType === 'WARRANTY') return p.hasWarranty !== false;
    if (filterType === 'NON_WARRANTY') return p.hasWarranty === false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">POS Billing Terminal</h1>
            <p className="text-xs text-slate-500">
              Create instant bills for both warranty and non-warranty products with automatic QR warranty linking.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/retailer/bills"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
          >
            <History className="w-4 h-4" />
            Bills & Invoice History
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Layout: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Product Selection (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              {/* Search input */}
              <div className="relative w-full sm:max-w-xs">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search catalog products..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs w-full sm:w-auto justify-center">
                <button
                  onClick={() => setFilterType('ALL')}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    filterType === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType('WARRANTY')}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    filterType === 'WARRANTY' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Warranty
                </button>
                <button
                  onClick={() => setFilterType('NON_WARRANTY')}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    filterType === 'NON_WARRANTY' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Non-Warranty
                </button>
              </div>

              {/* Custom Item Button */}
              <button
                onClick={() => setShowCustomModal(true)}
                className="w-full sm:w-auto px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Custom Item
              </button>
            </div>

            {/* Product Grid */}
            {loadingProducts ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading catalog products...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No matching products found. Try a different search or click "+ Custom Item".
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[520px] overflow-y-auto pr-1">
                {filteredProducts.map((p) => {
                  const hasW = p.hasWarranty !== false;
                  const isOutOfStock = (p.stockQuantity ?? 0) <= 0;
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        if (isOutOfStock) {
                          setError(`Cannot add "${p.name}": Product is currently out of stock (0 available).`);
                        } else {
                          addToCart(p);
                        }
                      }}
                      className={`p-3 rounded-xl border transition flex flex-col justify-between group ${
                        isOutOfStock
                          ? 'bg-slate-100/90 border-slate-200 opacity-65 cursor-not-allowed'
                          : 'bg-slate-50/70 hover:bg-blue-50/50 border-slate-200 hover:border-blue-300 cursor-pointer'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{p.brand}</span>
                          {isOutOfStock ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                              Out of Stock
                            </span>
                          ) : hasW ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              {p.warrantyDuration} {p.warrantyUnit?.substring(0, 2).toLowerCase()}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                              <ShieldAlert className="w-3 h-3 text-slate-500" />
                              No Warranty
                            </span>
                          )}
                        </div>
                        <h4 className={`text-xs font-bold line-clamp-1 ${isOutOfStock ? 'text-slate-500' : 'text-slate-900 group-hover:text-blue-600'}`}>
                          {p.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{p.model} &bull; {p.category}</p>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                        <div>
                          <span className={`text-sm font-extrabold block ${isOutOfStock ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                            ${(p.price || 0).toFixed(2)}
                          </span>
                          <span className={`text-[10px] font-semibold ${
                            (p.stockQuantity ?? 0) > 5 ? 'text-emerald-600' : (p.stockQuantity ?? 0) > 0 ? 'text-amber-600' : 'text-rose-600 font-bold'
                          }`}>
                            {(p.stockQuantity ?? 0) > 0 ? `${p.stockQuantity} in stock` : 'Out of stock (0)'}
                          </span>
                        </div>
                        {isOutOfStock ? (
                          <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            Unavailable
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-blue-600 group-hover:underline flex items-center gap-0.5">
                            <Plus className="w-3 h-3" /> Add
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Checkout & Cart (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            {/* Customer Information */}
            <div className="space-y-2 pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Customer Details
              </span>
              <div className="space-y-2">
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer Name (e.g. John Doe)"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Email (for QR warranty)"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Phone number"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Current Cart */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Cart Items ({cart.reduce((sum, i) => sum + i.quantity, 0)})
                </span>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-[11px] text-red-600 hover:text-red-800 font-semibold"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                  <ShoppingBag className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                  Cart is empty. Select products from the left or add a custom item.
                </div>
              ) : (
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                  {cart.map((item) => {
                    const linkedProduct = item.productId ? products.find((p) => p.id === item.productId) : null;
                    const availableStock = linkedProduct ? (linkedProduct.stockQuantity ?? 0) : null;
                    const isExceedingStock = availableStock !== null && item.quantity > availableStock;
                    const isZeroStock = availableStock !== null && availableStock <= 0;

                    return (
                      <div
                        key={item.id}
                        className={`p-2.5 rounded-xl space-y-2 border ${
                          isZeroStock || isExceedingStock
                            ? 'bg-rose-50/70 border-rose-200'
                            : 'bg-slate-50 border border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-slate-900 truncate">{item.productName}</h5>
                            {item.hasWarranty ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                Warranty Active ({item.warrantyDuration} {item.warrantyUnit.toLowerCase()})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                                <ShieldAlert className="w-3 h-3 text-slate-400" />
                                No Warranty (Bill Only)
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-slate-400 hover:text-red-600 transition p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Stock warning pill if violating */}
                        {isZeroStock ? (
                          <div className="text-[10px] font-bold text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded border border-rose-300">
                            ⚠️ Item is Out of Stock (0 available in store) &mdash; remove from cart
                          </div>
                        ) : isExceedingStock ? (
                          <div className="text-[10px] font-semibold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded border border-amber-300">
                            ⚠️ Quantity ({item.quantity}) exceeds available stock ({availableStock} units)
                          </div>
                        ) : null}

                        {/* Controls: Price, Qty, Line Total */}
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/50">
                          {/* Qty controls */}
                          <div className="flex items-center border border-slate-300 bg-white rounded-md">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, -1)}
                              className="px-2 py-0.5 text-slate-600 hover:bg-slate-100 font-bold"
                            >
                              -
                            </button>
                            <span className="px-2 font-semibold text-slate-900">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, 1)}
                              className="px-2 py-0.5 text-slate-600 hover:bg-slate-100 font-bold"
                            >
                              +
                            </button>
                          </div>

                          {/* Editable Unit Price */}
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-slate-400">@ $</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateUnitPrice(item.id, parseFloat(e.target.value) || 0)}
                              className="w-16 px-1.5 py-0.5 border border-slate-300 rounded text-right text-xs bg-white"
                            />
                          </div>

                          {/* Line total */}
                          <span className="font-extrabold text-slate-900">
                            ${(item.unitPrice * item.quantity).toFixed(2)}
                          </span>
                        </div>

                        {/* Line Item Warranty & Serial Number */}
                        <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-200/50 text-[11px]">
                          <button
                            type="button"
                            onClick={() => toggleWarranty(item.id)}
                            className={`font-semibold px-2 py-0.5 rounded transition shrink-0 ${
                              item.hasWarranty
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            }`}
                          >
                            {item.hasWarranty ? '✓ Has Warranty' : '✕ No Warranty'}
                          </button>

                          <div className="flex items-center gap-1.5 flex-1 max-w-[210px]">
                            <span className="text-[10px] font-bold text-slate-500 uppercase shrink-0">S/N:</span>
                            <input
                              type="text"
                              placeholder="Scan or enter Serial #"
                              value={item.serialNumber || ''}
                              onChange={(e) => updateSerialNumber(item.id, e.target.value)}
                              className="w-full px-2 py-1 border border-slate-300 rounded text-[11px] bg-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                              title="Unit Serial Number / IMEI / Barcode"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Price Calculations */}
            <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs border border-slate-200">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Discount ($)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  className="w-20 px-2 py-0.5 border border-slate-300 rounded text-right bg-white"
                />
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Tax / VAT ($)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={taxAmount}
                  onChange={(e) => setTaxAmount(parseFloat(e.target.value) || 0)}
                  className="w-20 px-2 py-0.5 border border-slate-300 rounded text-right bg-white"
                />
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-extrabold text-slate-900">
                <span>Grand Total</span>
                <span className="text-blue-600">${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Payment Method
              </span>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                {(['CASH', 'CARD', 'ONLINE', 'UPI', 'OTHER'] as PaymentMethod[]).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-1.5 rounded-lg font-semibold border transition ${
                      paymentMethod === method
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Payment notes / Txn ID (optional)"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Stock Violation Alert */}
            {hasStockViolations && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>Items in cart are out of stock or exceed inventory. Adjust cart to proceed.</span>
              </div>
            )}

            {/* Submit Action */}
            <button
              onClick={handleGenerateBill}
              disabled={submitting || cart.length === 0 || hasStockViolations}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              {submitting ? 'Generating Bill...' : `Complete Sale & Print ($${grandTotal.toFixed(2)})`}
            </button>
          </div>
        </div>
      </div>

      {/* Custom Item Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Add Custom Line Item</h3>
              <button onClick={() => setShowCustomModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomItem} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold uppercase text-slate-700 mb-1">Item Description / Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDMI 2.1 Cable 2m / Screen Protector"
                  value={customItem.name}
                  onChange={(e) => setCustomItem({ ...customItem, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-slate-700 mb-1">Unit Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  value={customItem.price}
                  onChange={(e) => setCustomItem({ ...customItem, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Warranty Toggle */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">Has Warranty?</span>
                    <span className="text-[11px] text-slate-500">Toggle on if this item provides warranty</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customItem.hasWarranty}
                      onChange={(e) => setCustomItem({ ...customItem, hasWarranty: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {customItem.hasWarranty && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Duration</label>
                      <input
                        type="number"
                        min="1"
                        value={customItem.duration}
                        onChange={(e) => setCustomItem({ ...customItem, duration: parseInt(e.target.value) || 1 })}
                        className="w-full px-2 py-1 border border-slate-300 rounded bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Unit</label>
                      <select
                        value={customItem.unit}
                        onChange={(e) => setCustomItem({ ...customItem, unit: e.target.value as WarrantyUnit })}
                        className="w-full px-2 py-1 border border-slate-300 rounded bg-white"
                      >
                        <option value="DAYS">Days</option>
                        <option value="MONTHS">Months</option>
                        <option value="YEARS">Years</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
                >
                  Add to Cart
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Printable Bill / Receipt Modal */}
      {createdBill && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between no-print">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-base">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Sale Completed & Bill Issued!
              </div>
              <button onClick={() => setCreatedBill(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Receipt Paper Container */}
            <div
              ref={receiptRef}
              id="printable-pos-receipt"
              className="p-6 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs text-slate-800 space-y-4"
            >
              {/* Store Header */}
              <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-3">
                <h2 className="text-base font-bold tracking-tight text-slate-900 font-sans">
                  {createdBill.retailerBusinessName || 'WarranTrack Retail Store'}
                </h2>
                {createdBill.retailerAddress && (
                  <p className="text-[11px] text-slate-600">{createdBill.retailerAddress}</p>
                )}
                <div className="text-[10px] text-slate-500">
                  {createdBill.retailerContactPhone && <span>Tel: {createdBill.retailerContactPhone} &bull; </span>}
                  {createdBill.retailerContactEmail && <span>{createdBill.retailerContactEmail}</span>}
                </div>
              </div>

              {/* Invoice Metadata */}
              <div className="flex justify-between text-[11px] border-b border-dashed border-slate-300 pb-2">
                <div>
                  <div><strong>INV #:</strong> {createdBill.invoiceNumber}</div>
                  <div><strong>Customer:</strong> {createdBill.customerName}</div>
                  {createdBill.customerEmail && <div><strong>Email:</strong> {createdBill.customerEmail}</div>}
                </div>
                <div className="text-right">
                  <div>{new Date(createdBill.createdAt).toLocaleDateString()}</div>
                  <div>{new Date(createdBill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  <div><strong>Paid via:</strong> {createdBill.paymentMethod}</div>
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
                {createdBill.items.map((item, idx) => (
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
                  <span>${createdBill.subtotal.toFixed(2)}</span>
                </div>
                {createdBill.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span>-${createdBill.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {createdBill.taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>+${createdBill.taxAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1 border-t border-slate-300">
                  <span>Total Paid:</span>
                  <span>${createdBill.grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Digital Warranty QR Codes Section (Printed on Bill!) */}
              {createdBill.items.some((item) => item.hasWarranty && item.qrToken) && (
                <div className="pt-3 border-t-2 border-dashed border-slate-300 space-y-2">
                  <div className="text-center font-bold text-slate-900 font-sans uppercase text-[11px] tracking-wider">
                    Digital Warranty Passport QR Code
                  </div>
                  <div className="flex flex-col items-center justify-center gap-2 bg-white p-3 rounded-lg border border-slate-200">
                    {createdBill.items
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
                            Scan to verify warranty or claim online (Valid till {item.warrantyExpiryDate})
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
                onClick={() => setCreatedBill(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg text-xs hover:bg-slate-50 transition"
              >
                Close & New Sale
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

      {/* Print CSS to isolate receipt for physical printers */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-pos-receipt, #printable-pos-receipt * {
            visibility: visible;
          }
          #printable-pos-receipt {
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

