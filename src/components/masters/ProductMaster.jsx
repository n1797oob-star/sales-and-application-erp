import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ROLES } from '../../types';
import { Package, Plus, Search, X, CheckCircle, Edit2, Trash2 } from 'lucide-react';

export const ProductMaster = () => {
  const { products, addProduct, updateProduct, deleteProduct, currentUser } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);

  const [formData, setFormData] = useState({
    modelNumber: '',
    name: '',
    category: 'Oscilloscopes',
    priceRange: '₹10,000,000 - ₹20,000,000',
    specs: '',
    brochureUrl: '#',
  });

  const filtered = (products || []).filter((p) => {
    if (!p) return false;
    const q = String(searchTerm || '').toLowerCase().trim();
    if (!q) return true;
    const model = String(p.modelNumber || '').toLowerCase();
    const name = String(p.name || '').toLowerCase();
    const cat = String(p.category || '').toLowerCase();
    return model.includes(q) || name.includes(q) || cat.includes(q);
  });

  const resetForm = () => {
    setFormData({
      modelNumber: '',
      name: '',
      category: 'Oscilloscopes',
      priceRange: '₹10,000,000 - ₹20,000,000',
      specs: '',
      brochureUrl: '#',
    });
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!formData.modelNumber || !formData.name) {
      alert('Please fill model number and product name.');
      return;
    }
    addProduct(formData);
    setIsAddModalOpen(false);
    resetForm();
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    updateProduct(editingProduct.id, formData);
    setEditingProduct(null);
    resetForm();
  };

  const handleDeleteConfirm = () => {
    if (!deletingProduct) return;
    deleteProduct(deletingProduct.id);
    setDeletingProduct(null);
  };

  const openEdit = (prod) => {
    setEditingProduct(prod);
    setFormData({
      modelNumber: prod.modelNumber,
      name: prod.name,
      category: prod.category || 'Oscilloscopes',
      priceRange: prod.priceRange || '',
      specs: prod.specs || '',
      brochureUrl: prod.brochureUrl || '#',
    });
  };

  const canDelete = currentUser?.role === ROLES.ADMIN || currentUser?.role === ROLES.MANAGER;

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            TMI Product & Equipment Master
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Test & Measurement Catalog (Oscilloscopes, VNAs, Power Analyzers & AWGs)
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsAddModalOpen(true);
          }}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-1.5 shrink-0 active-ring"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add TMI Product</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-2">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by model number, category or specifications..."
          className="w-full text-xs outline-none bg-transparent"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((prod) => (
          <div key={prod.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block">
                  {prod.modelNumber}
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">{prod.name}</h3>
              </div>
              <div className="flex items-center space-x-1">
                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-full mr-1">
                  {prod.category}
                </span>
                <button
                  onClick={() => openEdit(prod)}
                  className="p-1 text-slate-400 hover:text-brand-600 transition"
                  title="Edit Product"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                {canDelete && (
                  <button
                    onClick={() => setDeletingProduct(prod)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition"
                    title="Delete Product"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="text-xs space-y-2 border-t border-slate-100 pt-2">
              <p className="text-slate-600">
                Price Indicative: <strong className="text-emerald-700">{prod.priceRange}</strong>
              </p>
              <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200/60 line-clamp-3">
                {prod.specs}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Product Modal */}
      {(isAddModalOpen || editingProduct) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">{editingProduct ? 'Edit TMI Product' : 'Add TMI Product'}</h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingProduct(null);
                }}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingProduct ? handleEditSubmit : handleAddSubmit} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Model Code / Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MSO-X 6004A"
                  value={formData.modelNumber}
                  onChange={(e) => setFormData({ ...formData, modelNumber: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 border rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Equipment Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Keysight Infiniium 6GHz 4-Channel Oscilloscope"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 border rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 border rounded-xl outline-none"
                >
                  <option value="Oscilloscopes">Oscilloscopes</option>
                  <option value="Signal Generators">Signal Generators</option>
                  <option value="Spectrum & Network Analyzers">Spectrum & Network Analyzers</option>
                  <option value="Power Analyzers">Power Analyzers</option>
                  <option value="Thermal Cameras & Optical">Thermal Cameras & Optical</option>
                  <option value="DC Power & Loads">DC Power & Loads</option>
                  <option value="Battery Testing Equipment">Battery Testing Equipment</option>
                  <option value="Field & Substation Testers">Field & Substation Testers</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Indicative Price Range</label>
                <input
                  type="text"
                  value={formData.priceRange}
                  onChange={(e) => setFormData({ ...formData, priceRange: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 border rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Technical Specs</label>
                <textarea
                  rows={3}
                  value={formData.specs}
                  onChange={(e) => setFormData({ ...formData, specs: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 border rounded-xl outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-600 rounded-xl shadow-md"
                >
                  {editingProduct ? 'Save Changes' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Product Confirmation Modal */}
      {deletingProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Delete TMI Product</h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete product <strong className="text-slate-900">{deletingProduct.modelNumber}</strong> ({deletingProduct.name})?
            </p>
            <div className="pt-2 flex justify-end space-x-2">
              <button
                onClick={() => setDeletingProduct(null)}
                className="px-4 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg shadow-md"
              >
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
