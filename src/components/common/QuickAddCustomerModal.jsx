import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { INDUSTRY_SEGMENTS } from '../../types';
import { X, Building2, Check, Plus } from 'lucide-react';

export const QuickAddCustomerModal = ({ isOpen, onClose, onCustomerAdded }) => {
  const { addCustomer } = useAppStore();

  const [formData, setFormData] = useState({
    name: '',
    industry: INDUSTRY_SEGMENTS[0],
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    accountTier: 'Key Account',
    taxId: '',
  });

  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Customer Organization Name is required.');
      return;
    }

    const created = addCustomer({
      ...formData,
      name: formData.name.trim(),
      contactPerson: formData.contactPerson.trim() || 'Purchasing / Technical Lead',
    });

    if (onCustomerAdded) {
      onCustomerAdded(created);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95">
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-brand-600 text-white">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Quick Add Customer Organization</h3>
              <p className="text-[10px] text-slate-300">Creates new customer in master & selects immediately</p>
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

          <div>
            <label className="block font-bold text-slate-700 mb-1">Customer / Organization Name *</label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. ISRO Satellite Centre / Tata Motors EV"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                setError('');
              }}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 outline-none font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Industry Segment *</label>
              <select
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
              >
                {INDUSTRY_SEGMENTS.map((seg) => (
                  <option key={seg} value={seg}>
                    {seg}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Primary Contact Person</label>
              <input
                type="text"
                placeholder="e.g. Dr. K. Sriman"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="contact@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
              <input
                type="tel"
                placeholder="+91 98765 00000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Location / Address</label>
            <input
              type="text"
              placeholder="City, State / Campus"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
              className="px-4 py-1.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md transition flex items-center space-x-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save & Select Customer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
