import React, { useEffect, useState } from 'react';
import { productApi } from '../../api';
import { Product, WarrantyUnit } from '../../types';
import { Package, Plus, Edit2, Ban, Search, CheckCircle2, Info, AlertTriangle, Layers } from 'lucide-react';

export const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    model: '',
    category: '',
    description: '',
    price: 0,
    stockQuantity: 1,
    hasWarranty: true,
    warrantyDuration: 12,
    warrantyUnit: 'MONTHS' as WarrantyUnit,
    warrantyTerms: 'Standard manufacturer warranty covering parts and labor defects under normal use.',
  });

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
    setFormData({
      name: '',
      brand: '',
      model: '',
      category: '',
      description: '',
      price: 0,
      stockQuantity: 10,
      hasWarranty: true,
      warrantyDuration: 12,
      warrantyUnit: 'MONTHS',
      warrantyTerms: 'Standard manufacturer warranty covering parts and labor defects under normal use.',
    });
    setShowModal(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      brand: p.brand,
      model: p.model,
      category: p.category,
      description: p.description || '',
      price: p.price || 0,
      stockQuantity: p.stockQuantity != null ? p.stockQuantity : 0,
      hasWarranty: p.hasWarranty !== undefined ? p.hasWarranty : true,
      warrantyDuration: p.warrantyDuration || 12,
      warrantyUnit: p.warrantyUnit || 'MONTHS',
      warrantyTerms: p.warrantyTerms || 'Standard manufacturer warranty covering parts and labor defects under normal use.',
    });
    setShowModal(true);
  };

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
          <h1 className="text-2xl font-bold text-slate-900">Product Catalog & Warranty Policies</h1>
          <p className="text-sm text-slate-500">Configure your store's products, warranty periods, and legal terms</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm shadow-xs self-start"
        >
          <Plus className="w-4 h-4" /> Add New Product
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products by name, brand, model..."
          className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading catalog...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            No products found in your catalog. Click "Add New Product" to begin.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase text-slate-400 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Product & Model</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Price</th>
                  <th className="px-6 py-3.5">Inventory</th>
                  <th className="px-6 py-3.5">Warranty Policy</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{p.brand} {p.name}</div>
                      <div className="text-xs text-slate-400 font-mono">Model: {p.model}</div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-700">{p.category}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      ${(p.price || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      {(p.stockQuantity ?? 0) > 5 ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          {p.stockQuantity} in stock
                        </span>
                      ) : (p.stockQuantity ?? 0) > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          {p.stockQuantity} left (Low)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          Out of stock
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {p.hasWarranty !== false ? (
                        <div>
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {p.warrantyDuration} {p.warrantyUnit?.toLowerCase()}
                          </span>
                          <div className="text-xs text-slate-400 max-w-xs truncate mt-0.5">{p.warrantyTerms}</div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          No Warranty (Bill Only)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {p.active ? (
                        <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                          Active
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                          Deactivated
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                          title="Edit Product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {p.active && (
                          <button
                            onClick={() => handleDeactivate(p.id, p.name)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                            title="Deactivate Product"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900">
              {editingProduct ? 'Edit Catalog Product' : 'Add New Product to Catalog'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ultra HD Smart TV 55 Inch"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Brand</label>
                  <input
                    type="text"
                    required
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="e.g. Sony"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                    Model Number / SKU
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="e.g. KD-55X80K"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Product line code shared by all stock units
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g. Televisions"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Unit Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Total physical units in store
                  </span>
                </div>
              </div>

              {/* Model vs Serial Number Explanation Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Model Number vs. Item Serial Number:</span>
                </div>
                <div className="text-[11px] text-slate-600 leading-relaxed space-y-1">
                  <p>
                    &bull; <strong>Model Number:</strong> All <strong>{formData.stockQuantity || 1}</strong> items of this product share the <em>same manufacturer model</em> (e.g. <span className="font-mono font-semibold">{formData.model || 'KD-55X80K'}</span>).
                  </p>
                  <p>
                    &bull; <strong>Serial Number (SN):</strong> Individual item serial numbers (e.g. <span className="font-mono">SN-001</span>, <span className="font-mono">SN-002</span>) are entered individually when each item is sold at the POS counter to create its digital warranty.
                  </p>
                </div>
              </div>

              {/* Warranty Toggle */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-slate-900 block">Warranty Protection</span>
                    <span className="text-xs text-slate-500">Enable if this product includes warranty support and claims</span>
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

                {formData.hasWarranty ? (
                  <>
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                      <div>
                        <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Warranty Duration</label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={formData.warrantyDuration}
                          onChange={(e) => setFormData({ ...formData, warrantyDuration: parseInt(e.target.value) || 1 })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Unit</label>
                        <select
                          value={formData.warrantyUnit}
                          onChange={(e) => setFormData({ ...formData, warrantyUnit: e.target.value as WarrantyUnit })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="DAYS">Days</option>
                          <option value="MONTHS">Months</option>
                          <option value="YEARS">Years</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Warranty Terms & Conditions</label>
                      <textarea
                        required
                        rows={3}
                        value={formData.warrantyTerms}
                        onChange={(e) => setFormData({ ...formData, warrantyTerms: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        Preserved as a historical snapshot for each customer purchase at sale time.
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200 font-medium">
                    ⚠️ <strong>Non-Warranty Product:</strong> When sold via POS or registered, a bill/receipt will be generated with price & payment details, but no warranty card or QR code will be created.
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

