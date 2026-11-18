import React, { useEffect, useState, useRef } from 'react';
import { productApi, billingApi } from '../../api';
import { Product, Bill, WarrantyUnit, PaymentMethod, CreateBillRequest } from '../../types';
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
import { CustomerLookupInput } from '../../components/CustomerLookupInput';
import { InvoiceReceipt } from '../../components/InvoiceReceipt';

interface CartLineItem {
  id: string; // local key
  productId?: string;
  productName: string;
  brand?: string;
  category?: string;
  serialNumbers: string[];
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
      const existing = updated[existingIndex];
      updated[existingIndex] = {
        ...existing,
        quantity: existing.quantity + 1,
        serialNumbers: [...existing.serialNumbers, ''],
      };
      setCart(updated);
    } else {
      const isWarranty = product.hasWarranty !== false;
      const newLine: CartLineItem = {
        id: 'cart_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        productId: product.id,
        productName: `${product.brand} ${product.name}`,
        brand: product.brand,
        category: product.category,
        serialNumbers: [''],
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
      serialNumbers: [''],
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
            if (newQty <= 0) return null;
            const nextSerials = [...it.serialNumbers];
            while (nextSerials.length < newQty) {
              nextSerials.push('');
            }
            return {
              ...it,
              quantity: newQty,
              serialNumbers: nextSerials.slice(0, newQty),
            };
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

  const updateSerialNumberAt = (id: string, unitIndex: number, serial: string) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextSerials = [...item.serialNumbers];
        while (nextSerials.length < item.quantity) {
          nextSerials.push('');
        }
        nextSerials[unitIndex] = serial;
        return { ...item, serialNumbers: nextSerials };
      })
    );
    setError(null);
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

  // Track duplicate serial numbers across the entire cart (case-insensitive)
  const serialOccurrences = new Map<string, number>();
  cart.forEach((item) => {
    item.serialNumbers.slice(0, item.quantity).forEach((sn) => {
      const normalized = sn.trim().toLowerCase();
      if (normalized) {
        serialOccurrences.set(normalized, (serialOccurrences.get(normalized) || 0) + 1);
      }
    });
  });

  const duplicateSerialsInCart = new Set<string>(
    Array.from(serialOccurrences.entries())
      .filter(([, count]) => count > 1)
      .map(([sn]) => sn)
  );

  const hasDuplicateSerials = duplicateSerialsInCart.size > 0;

  const hasIncompleteSerials = cart.some((item) => {
    const slots = item.serialNumbers.slice(0, item.quantity);
    const filledCount = slots.filter((s) => s.trim().length > 0).length;
    if (item.hasWarranty) {
      return filledCount !== item.quantity;
    }
    return filledCount > 0 && filledCount !== item.quantity;
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

    // Validate manually entered serial numbers: count matches quantity & zero duplicates
    const seenSerials = new Set<string>();
    for (const item of cart) {
      const trimmedSerials = item.serialNumbers.slice(0, item.quantity).map((s) => s.trim());
      const filledSerials = trimmedSerials.filter((s) => s.length > 0);

      if (item.hasWarranty && filledSerials.length !== item.quantity) {
        setError(
          `Please manually enter all ${item.quantity} serial number(s) for "${item.productName}" (${filledSerials.length} of ${item.quantity} entered).`
        );
        return;
      }

      if (!item.hasWarranty && filledSerials.length > 0 && filledSerials.length !== item.quantity) {
        setError(
          `Serial number count for "${item.productName}" (${filledSerials.length}) must match quantity (${item.quantity}), or leave all blank.`
        );
        return;
      }

      for (const sn of filledSerials) {
        const key = sn.toLowerCase();
        if (seenSerials.has(key)) {
          setError(`Duplicate serial number "${sn}" found in cart. Every physical unit must have a unique serial number.`);
          return;
        }
        seenSerials.add(key);
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
      items: cart.map((item) => {
        const cleanedSerials = item.serialNumbers.slice(0, item.quantity).map((s) => s.trim());
        const hasAnySerial = cleanedSerials.some((s) => s.length > 0);
        return {
          productId: item.productId,
          productName: item.productName,
          brand: item.brand,
          category: item.category,
          serialNumber: item.quantity === 1 && cleanedSerials[0] ? cleanedSerials[0] : undefined,
          serialNumbers: hasAnySerial ? cleanedSerials : undefined,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          hasWarranty: item.hasWarranty,
          warrantyDuration: item.hasWarranty ? item.warrantyDuration : undefined,
          warrantyUnit: item.hasWarranty ? item.warrantyUnit : undefined,
          warrantyTerms: item.hasWarranty ? item.warrantyTerms : undefined,
        };
      }),
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">POS Billing Terminal</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Create instant bills for both warranty and non-warranty products with automatic QR warranty linking.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/retailer/bills"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-lg transition"
          >
            <History className="w-4 h-4" />
            Bills & Invoice History
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-rose-950/40 border border-red-200 dark:border-rose-800/60 text-red-700 dark:text-rose-300 rounded-xl text-sm flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600 dark:text-rose-400" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 dark:text-rose-400 hover:text-red-700 dark:hover:text-rose-200 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Layout: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Product Selection (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              {/* Search input */}
              <div className="relative w-full sm:max-w-xs">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search catalog products..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs w-full sm:w-auto justify-center">
                <button
                  onClick={() => setFilterType('ALL')}
                  className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                    filterType === 'ALL' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType('WARRANTY')}
                  className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                    filterType === 'WARRANTY' ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Warranty
                </button>
                <button
                  onClick={() => setFilterType('NON_WARRANTY')}
                  className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                    filterType === 'NON_WARRANTY' ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Non-Warranty
                </button>
              </div>

              {/* Custom Item Button */}
              <button
                onClick={() => setShowCustomModal(true)}
                className="w-full sm:w-auto px-3 py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Custom Item
              </button>
            </div>

            {/* Product Grid */}
            {loadingProducts ? (
              <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">Loading catalog products...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
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
                          ? 'bg-slate-100/90 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-65 cursor-not-allowed'
                          : 'bg-slate-50/70 dark:bg-slate-800/60 hover:bg-blue-50/50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500/60 cursor-pointer'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{p.brand}</span>
                          {isOutOfStock ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200/70 dark:border-rose-800/60">
                              Out of Stock
                            </span>
                          ) : hasW ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60">
                              <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              {p.warrantyDuration} {p.warrantyUnit?.substring(0, 2).toLowerCase()}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              <ShieldAlert className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                              No Warranty
                            </span>
                          )}
                        </div>
                        <h4 className={`text-xs font-bold line-clamp-1 ${isOutOfStock ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>
                          {p.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{p.model} &bull; {p.category}</p>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                        <div>
                          <span className={`text-sm font-extrabold block ${isOutOfStock ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-900 dark:text-slate-100'}`}>
                            ${(p.price || 0).toFixed(2)}
                          </span>
                          <span className={`text-[10px] font-semibold ${
                            (p.stockQuantity ?? 0) > 5 ? 'text-emerald-600 dark:text-emerald-400' : (p.stockQuantity ?? 0) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400 font-bold'
                          }`}>
                            {(p.stockQuantity ?? 0) > 0 ? `${p.stockQuantity} in stock` : 'Out of stock (0)'}
                          </span>
                        </div>
                        {isOutOfStock ? (
                          <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800/60">
                            Unavailable
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 group-hover:underline flex items-center gap-0.5">
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
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            {/* Customer Information with Auto-Lookup & Fill */}
            <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CustomerLookupInput
                customerName={customerName}
                customerEmail={customerEmail}
                customerPhone={customerPhone}
                onCustomerNameChange={setCustomerName}
                onCustomerEmailChange={setCustomerEmail}
                onCustomerPhoneChange={setCustomerPhone}
              />
            </div>

            {/* Current Cart */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Cart Items ({cart.reduce((sum, i) => sum + i.quantity, 0)})
                </span>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-[11px] text-red-600 dark:text-rose-400 hover:text-red-800 dark:hover:text-rose-300 font-semibold cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 text-xs">
                  <ShoppingBag className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-1" />
                  Cart is empty. Select products from the left or add a custom item.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
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
                            ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{item.productName}</h5>
                            {item.hasWarranty ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                                <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                Warranty Active ({item.warrantyDuration} {item.warrantyUnit.toLowerCase()})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                <ShieldAlert className="w-3 h-3 text-slate-400" />
                                No Warranty (Bill Only)
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-slate-400 hover:text-red-600 dark:hover:text-rose-400 transition p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Stock warning pill if violating */}
                        {isZeroStock ? (
                          <div className="text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-100/70 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-300 dark:border-rose-800">
                            ⚠️ Item is Out of Stock (0 available in store) &mdash; remove from cart
                          </div>
                        ) : isExceedingStock ? (
                          <div className="text-[10px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800">
                            ⚠️ Quantity ({item.quantity}) exceeds available stock ({availableStock} units)
                          </div>
                        ) : null}

                        {/* Controls: Price, Qty, Line Total */}
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/50 dark:border-slate-700/60">
                          {/* Qty controls */}
                          <div className="flex items-center border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md overflow-hidden">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, -1)}
                              className="px-2 py-0.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold cursor-pointer"
                            >
                              -
                            </button>
                            <span className="px-2 font-semibold text-slate-900 dark:text-slate-100">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, 1)}
                              className="px-2 py-0.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold cursor-pointer"
                            >
                              +
                            </button>
                          </div>

                          {/* Editable Unit Price */}
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">@ $</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateUnitPrice(item.id, parseFloat(e.target.value) || 0)}
                              className="w-16 px-1.5 py-0.5 border border-slate-300 dark:border-slate-600 rounded text-right text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                            />
                          </div>

                          {/* Line total */}
                          <span className="font-extrabold text-slate-900 dark:text-slate-100">
                            ${(item.unitPrice * item.quantity).toFixed(2)}
                          </span>
                        </div>

                        {/* Line Item Warranty Toggle & Per-Unit Manual Serial Number Inputs */}
                        <div className="space-y-2 pt-1.5 border-t border-slate-200/50 dark:border-slate-700/60 text-[11px]">
                          <div className="flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => toggleWarranty(item.id)}
                              className={`font-semibold px-2 py-0.5 rounded transition shrink-0 cursor-pointer ${
                                item.hasWarranty
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60 hover:bg-emerald-200 dark:hover:bg-emerald-900/60'
                                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                              }`}
                            >
                              {item.hasWarranty ? '✓ Has Warranty' : '✕ No Warranty'}
                            </button>

                            {(() => {
                              const filled = item.serialNumbers
                                .slice(0, item.quantity)
                                .filter((s) => s.trim().length > 0).length;
                              const isComplete = filled === item.quantity;
                              return (
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    isComplete
                                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                                      : item.hasWarranty
                                      ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
                                      : 'text-slate-500 dark:text-slate-400'
                                  }`}
                                >
                                  S/N: {filled}/{item.quantity} {item.hasWarranty ? 'Required' : 'Optional'}
                                </span>
                              );
                            })()}
                          </div>

                          {/* Separate manual serial number field for EVERY physical unit */}
                          <div className="space-y-1.5">
                            {Array.from({ length: item.quantity }).map((_, unitIdx) => {
                              const val = item.serialNumbers[unitIdx] || '';
                              const trimmed = val.trim();
                              const isDup = trimmed.length > 0 && duplicateSerialsInCart.has(trimmed.toLowerCase());
                              const isMissingRequired = item.hasWarranty && trimmed.length === 0;

                              return (
                                <div key={`${item.id}-unit-${unitIdx}`} className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase shrink-0 w-14">
                                    Unit #{unitIdx + 1}:
                                  </span>
                                  <div className="flex-1 relative">
                                    <input
                                      type="text"
                                      required={item.hasWarranty}
                                      placeholder={
                                        item.hasWarranty
                                          ? `Enter actual S/N for unit #${unitIdx + 1} *`
                                          : `Optional S/N for unit #${unitIdx + 1}`
                                      }
                                      value={val}
                                      onChange={(e) => updateSerialNumberAt(item.id, unitIdx, e.target.value)}
                                      className={`w-full px-2 py-1 border rounded text-[11px] bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono focus:outline-none focus:ring-1 ${
                                        isDup
                                          ? 'border-rose-500 dark:border-rose-500 focus:ring-rose-500'
                                          : isMissingRequired
                                          ? 'border-amber-300 dark:border-amber-700/80 focus:ring-blue-500'
                                          : 'border-slate-300 dark:border-slate-600 focus:ring-blue-500'
                                      }`}
                                      title={`Physical Serial Number / IMEI for Unit #${unitIdx + 1}`}
                                    />
                                  </div>
                                  {isDup && (
                                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 shrink-0">
                                      Duplicate
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Price Calculations */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 text-xs border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>Discount ($)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  className="w-20 px-2 py-0.5 border border-slate-300 dark:border-slate-600 rounded text-right bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>Tax / VAT ($)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={taxAmount}
                  onChange={(e) => setTaxAmount(parseFloat(e.target.value) || 0)}
                  className="w-20 px-2 py-0.5 border border-slate-300 dark:border-slate-600 rounded text-right bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-sm font-extrabold text-slate-900 dark:text-slate-100">
                <span>Grand Total</span>
                <span className="text-blue-600 dark:text-blue-400">${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Payment Method
              </span>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                {(['CASH', 'CARD', 'ONLINE', 'UPI', 'OTHER'] as PaymentMethod[]).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-1.5 rounded-lg font-semibold border transition cursor-pointer ${
                      paymentMethod === method
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
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
                className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Stock & Serial Validation Alerts */}
            {hasStockViolations && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 rounded-lg text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>Items in cart are out of stock or exceed inventory. Adjust cart to proceed.</span>
              </div>
            )}

            {hasDuplicateSerials && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 rounded-lg text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>Duplicate serial numbers detected in cart. Each physical unit must have a unique serial number.</span>
              </div>
            )}

            {!hasDuplicateSerials && cart.length > 0 && hasIncompleteSerials && (
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 rounded-lg text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>Enter all required unit serial numbers manually before completing the sale.</span>
              </div>
            )}

            {/* Submit Action */}
            <button
              onClick={handleGenerateBill}
              disabled={submitting || cart.length === 0 || hasStockViolations || hasDuplicateSerials || hasIncompleteSerials}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <CreditCard className="w-5 h-5" />
              {submitting ? 'Generating Bill...' : `Complete Sale & Print ($${grandTotal.toFixed(2)})`}
            </button>
          </div>
        </div>
      </div>

      {/* Custom Item Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Add Custom Line Item</h3>
              <button onClick={() => setShowCustomModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomItem} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">Item Description / Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDMI 2.1 Cable 2m / Screen Protector"
                  value={customItem.name}
                  onChange={(e) => setCustomItem({ ...customItem, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">Unit Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  value={customItem.price}
                  onChange={(e) => setCustomItem({ ...customItem, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Warranty Toggle */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 block">Has Warranty?</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Toggle on if this item provides warranty</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customItem.hasWarranty}
                      onChange={(e) => setCustomItem({ ...customItem, hasWarranty: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 dark:after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {customItem.hasWarranty && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Duration</label>
                      <input
                        type="number"
                        min="1"
                        value={customItem.duration}
                        onChange={(e) => setCustomItem({ ...customItem, duration: parseInt(e.target.value) || 1 })}
                        className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Unit</label>
                      <select
                        value={customItem.unit}
                        onChange={(e) => setCustomItem({ ...customItem, unit: e.target.value as WarrantyUnit })}
                        className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
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
                  className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 cursor-pointer"
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
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 no-print shrink-0">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm sm:text-base">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Sale Completed & Bill Issued!</span>
              </div>
              <button onClick={() => setCreatedBill(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Printable Receipt Paper Container */}
            <div className="flex-1 overflow-y-auto pr-1 py-1">
              <InvoiceReceipt
                bill={createdBill}
                receiptId="printable-pos-receipt"
                receiptRef={receiptRef}
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 no-print shrink-0">
              <button
                type="button"
                onClick={() => setCreatedBill(null)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Close & New Sale
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

      {/* Print CSS to isolate receipt for physical printers */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-pos-receipt, #printable-pos-receipt * {
            visibility: visible;
            color: #0f172a !important;
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

