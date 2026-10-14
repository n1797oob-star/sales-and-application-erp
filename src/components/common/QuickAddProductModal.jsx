import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { X, Package, Check } from 'lucide-react';

export const QuickAddProductModal = ({ isOpen, onClose, onProductAdded }) => {
  const { addProduct } = useAppStore();

  const [formData, setFormData] = useState({
    modelNumber: '',
    name: '',
    category: 'Oscilloscopes',
    priceRange: '',
    specs: '',
  });

  const [error, setError] = useState('');

  if (!isOpen) return null;

  const categories = [
    'Oscilloscopes',
    'Signal Generators',
    'Spectrum & Network Analyzers',
    'Power Analyzers',
    'DC Power & Loads',
    'Battery Testing Equipment',
    'Thermal Cameras & Optical',
    'Field & Substation Testers',
    'Compliance & EMC Analyzers',
    'General Test Equipment',
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.modelNumber.trim() || !formData.name.trim()) {
      setError('Model Number and Product Name are required.');
      return;
    }

    const created = addProduct({
      ...formData,
      modelNumber: formData.modelNumber.trim(),
      name: formData.name.trim(),
      priceRange: formData.priceRange.trim() || '₹500,000 - ₹1,500,000',
      specs: formData.specs.trim() || 'Standard TMI high-precision measurement specifications.',
      brochureUrl: '#',
    });

    if (onProductAdded) {
      onProductAdded(created);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95">
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-emerald-600 text-white">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Quick Add TMI Product / Model</h3>
              <p className="text-[10px] text-slate-300">Creates new product in master & selects immediately</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          {error && (
            <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-[11px] font-semibold">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Model Number *</label>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. MSO-X 6004A"
                value={formData.modelNumber}
                onChange={(e) => {
                  setFormData({ ...formData, modelNumber: e.target.value });
                  setError('');
                }}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Product Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Product / Equipment Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Keysight Infiniium 6 GHz 4-Channel Oscilloscope"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                setError('');
              }}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Estimated Price Range</label>
            <input
              type="text"
              placeholder="e.g. ₹25,000,000 - ₹35,000,000"
              value={formData.priceRange}
              onChange={(e) => setFormData({ ...formData, priceRange: e.target.value })}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Key Technical Specifications</label>
            <textarea
              rows={2}
              placeholder="Key bandwidth, frequency range, channel count or application..."
              value={formData.specs}
              onChange={(e) => setFormData({ ...formData, specs: e.target.value })}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition flex items-center space-x-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save & Select Product</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
