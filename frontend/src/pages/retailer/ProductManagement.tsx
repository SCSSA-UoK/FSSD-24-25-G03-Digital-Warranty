import React, { useEffect, useState } from 'react';
import { productApi } from '../../api';
import { Product, WarrantyUnit } from '../../types';
import { Package, Plus, Edit2, Ban, Search, CheckCircle2, Info, AlertTriangle, Layers, X } from 'lucide-react';

export const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const defaultFormData = {
    name: '',
    brand: '',
    model: '',
    category: '',
    description: '',
    price: 0,
    stockQuantity: 10,
    hasWarranty: true,
    warrantyDuration: 12,
    warrantyUnit: 'MONTHS' as WarrantyUnit,
    warrantyTerms: 'Standard manufacturer warranty covering parts and labor defects under normal use.',
  };

  const [formData, setFormData] = useState(defaultFormData);
  const [initialFormData, setInitialFormData] = useState(defaultFormData);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await productApi.getProducts();
      setProducts(res.content);
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData(defaultFormData);
    setInitialFormData(defaultFormData);
    setShowDiscardConfirm(false);
    setShowModal(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    const editData = {
      name: p.name || '',
      brand: p.brand || '',
      model: p.model || '',
      category: p.category || '',
      description: p.description || '',
      price: p.price || 0,
      stockQuantity: p.stockQuantity != null ? p.stockQuantity : 0,
      hasWarranty: p.hasWarranty !== undefined ? p.hasWarranty : true,
      warrantyDuration: p.warrantyDuration || 12,
      warrantyUnit: (p.warrantyUnit as WarrantyUnit) || 'MONTHS',
      warrantyTerms: p.warrantyTerms || 'Standard manufacturer warranty covering parts and labor defects under normal use.',
    };
    setFormData(editData);
    setInitialFormData(editData);
    setShowDiscardConfirm(false);
    setShowModal(true);
  };

  const hasUnsavedChanges = () => {
    return (
      formData.name.trim() !== initialFormData.name.trim() ||
      formData.brand.trim() !== initialFormData.brand.trim() ||
      formData.model.trim() !== initialFormData.model.trim() ||
      formData.category.trim() !== initialFormData.category.trim() ||
      formData.description.trim() !== initialFormData.description.trim() ||
      formData.price !== initialFormData.price ||
      formData.stockQuantity !== initialFormData.stockQuantity ||
      formData.hasWarranty !== initialFormData.hasWarranty ||
      formData.warrantyDuration !== initialFormData.warrantyDuration ||
      formData.warrantyUnit !== initialFormData.warrantyUnit ||
      formData.warrantyTerms.trim() !== initialFormData.warrantyTerms.trim()
    );
  };

  const handleCloseAttempt = () => {
    if (hasUnsavedChanges()) {
      setShowDiscardConfirm(true);
    } else {
      forceCloseModal();
    }
  };

  const forceCloseModal = () => {
    setShowDiscardConfirm(false);
    setShowModal(false);
    setEditingProduct(null);
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showModal]);

  // Handle Escape key to close modal safely
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showModal) {
        if (showDiscardConfirm) {
          setShowDiscardConfirm(false);
        } else {
          handleCloseAttempt();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal, showDiscardConfirm, formData, initialFormData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await productApi.updateProduct(editingProduct.id, formData);
      } else {
        await productApi.createProduct(formData);
      }
      setShowModal(false);
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error saving product.');
    }
  };

  const handleDeactivate = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to deactivate "${name}"? Historical purchases and warranties will remain intact.`)) {
      return;
    }
    try {
      await productApi.deactivateProduct(id);
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error deactivating product.');
    }
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase()) ||
      p.model.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Product Catalog & Warranty Policies</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Configure your store's products, warranty periods, and legal terms</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm shadow-xs self-start cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add New Product
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 dark:text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products by name, brand, model..."
          className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">Loading catalog...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <Package className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            No products found in your catalog. Click "Add New Product" to begin.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-auto lg:table-fixed text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 select-none">
                <tr>
                  <th scope="col" className="px-5 py-3.5 w-[28%] min-w-[220px]">Product & Model</th>
                  <th scope="col" className="px-5 py-3.5 w-[13%] min-w-[110px] whitespace-nowrap">Category</th>
                  <th scope="col" className="px-5 py-3.5 w-[12%] min-w-[100px] whitespace-nowrap">Price</th>
                  <th scope="col" className="px-5 py-3.5 w-[14%] min-w-[130px] whitespace-nowrap">Inventory</th>
                  <th scope="col" className="px-5 py-3.5 w-[18%] min-w-[160px]">Warranty Policy</th>
                  <th scope="col" className="px-5 py-3.5 w-[9%] min-w-[95px] whitespace-nowrap">Status</th>
                  <th scope="col" className="px-5 py-3.5 w-[6%] min-w-[80px] text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors duration-150"
                  >
                    {/* Product & Model */}
                    <td className="px-5 py-3.5 align-middle">
                      <div className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-snug">
                        {p.brand ? `${p.brand} ` : ''}{p.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-sans">Model:</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">{p.model}</span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-5 py-3.5 align-middle whitespace-nowrap">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {p.category}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="px-5 py-3.5 align-middle whitespace-nowrap">
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                        ${(p.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>

                    {/* Inventory */}
                    <td className="px-5 py-3.5 align-middle whitespace-nowrap">
                      {(p.stockQuantity ?? 0) > 5 ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          {p.stockQuantity} in stock
                        </span>
                      ) : (p.stockQuantity ?? 0) > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          {p.stockQuantity} left (Low)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          Out of stock
                        </span>
                      )}
                    </td>

                    {/* Warranty Policy */}
                    <td className="px-5 py-3.5 align-middle">
                      {p.hasWarranty !== false ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60 shrink-0">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            {p.warrantyDuration} {p.warrantyUnit?.toLowerCase()}
                          </span>
                          {p.warrantyTerms && (
                            <p
                              className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]"
                              title={p.warrantyTerms}
                            >
                              {p.warrantyTerms}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                            No Warranty
                          </span>
                          <p
                            className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[200px]"
                            title="Bill & receipt only, no digital warranty issued"
                          >
                            Bill & receipt only
                          </p>
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5 align-middle whitespace-nowrap">
                      {p.active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                          Deactivated
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 align-middle text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(p)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition cursor-pointer border border-transparent hover:border-blue-200 dark:hover:border-blue-800/60"
                          title="Edit Product"
                          aria-label="Edit product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {p.active ? (
                          <button
                            onClick={() => handleDeactivate(p.id, p.name)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer border border-transparent hover:border-rose-200 dark:hover:border-rose-800/60"
                            title="Deactivate Product"
                            aria-label="Deactivate product"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        ) : (
                          <div className="w-8 h-8" aria-hidden="true" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseAttempt();
            }
          }}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {editingProduct ? 'Edit Catalog Product' : 'Add New Product to Catalog'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {editingProduct ? 'Update product specifications and warranty' : 'Define new product inventory and warranty coverage'}
                  </p>
                </div>
              </div>

              {/* Close (×) Button */}
              <button
                type="button"
                onClick={handleCloseAttempt}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                aria-label="Close dialog"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body & Form */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Ultra HD Smart TV 55 Inch"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">Brand</label>
                    <input
                      type="text"
                      required
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="e.g. Sony"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                      Model Number / SKU
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      placeholder="e.g. KD-55X80K"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                      Product line code shared by all stock units
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">Category</label>
                    <input
                      type="text"
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g. Televisions"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">Unit Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                      Quantity (Stock)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      required
                      value={formData.stockQuantity}
                      onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                      Total physical units in store
                    </span>
                  </div>
                </div>

                {/* Model vs Serial Number Explanation Box */}
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                    <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Model Number vs. Item Serial Number:</span>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed space-y-1">
                    <p>
                      &bull; <strong className="text-slate-900 dark:text-slate-100">Model Number:</strong> All <strong className="text-slate-900 dark:text-slate-100">{formData.stockQuantity || 1}</strong> items of this product share the <em>same manufacturer model</em> (e.g. <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{formData.model || 'KD-55X80K'}</span>).
                    </p>
                    <p>
                      &bull; <strong className="text-slate-900 dark:text-slate-100">Serial Number (SN):</strong> Individual item serial numbers (e.g. <span className="font-mono">SN-001</span>, <span className="font-mono">SN-002</span>) are entered individually when each item is sold at the POS counter to create its digital warranty.
                    </p>
                  </div>
                </div>

                {/* Warranty Toggle */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100 block">Warranty Protection</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">Enable if this product includes warranty support and claims</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.hasWarranty}
                        onChange={(e) => setFormData({ ...formData, hasWarranty: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 dark:after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {formData.hasWarranty ? (
                    <>
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">Warranty Duration</label>
                          <input
                            type="number"
                            required
                            min={1}
                            value={formData.warrantyDuration}
                            onChange={(e) => setFormData({ ...formData, warrantyDuration: parseInt(e.target.value) || 1 })}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">Unit</label>
                          <select
                            value={formData.warrantyUnit}
                            onChange={(e) => setFormData({ ...formData, warrantyUnit: e.target.value as WarrantyUnit })}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="DAYS">Days</option>
                            <option value="MONTHS">Months</option>
                            <option value="YEARS">Years</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">Warranty Terms & Conditions</label>
                        <textarea
                          required
                          rows={3}
                          value={formData.warrantyTerms}
                          onChange={(e) => setFormData({ ...formData, warrantyTerms: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                        />
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                          Preserved as a historical snapshot for each customer purchase at sale time.
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800/60 font-medium">
                      ⚠️ <strong>Non-Warranty Product:</strong> When sold via POS or registered, a bill/receipt will be generated with price & payment details, but no warranty card or QR code will be created.
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/80 shrink-0">
                <button
                  type="button"
                  onClick={handleCloseAttempt}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Unsaved Changes */}
      {showDiscardConfirm && (
        <div
          className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-60 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDiscardConfirm(false);
            }
          }}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Discard Unsaved Changes?
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  You have entered data in the product form. If you close now, your changes will not be saved.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDiscardConfirm(false)}
                className="px-3.5 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={forceCloseModal}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs"
              >
                Discard & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

