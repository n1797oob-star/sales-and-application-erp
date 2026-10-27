import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { INDUSTRY_SEGMENTS, ROLES } from '../../types';
import { Building2, Plus, Search, Phone, Mail, MapPin, X, CheckCircle, Edit2, Trash2 } from 'lucide-react';

export const CustomerMaster = () => {
  const { customers, addCustomer, updateCustomer, deleteCustomer, currentUser } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deletingCustomer, setDeletingCustomer] = useState(null);

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

  const filtered = (customers || []).filter((c) => {
    if (!c) return false;
    const q = String(searchTerm || '').toLowerCase().trim();
    if (!q) return true;
    const name = String(c.name || '').toLowerCase();
    const industry = String(c.industry || '').toLowerCase();
    const contact = String(c.contactPerson || '').toLowerCase();
    return name.includes(q) || industry.includes(q) || contact.includes(q);
  });

  const resetForm = () => {
    setFormData({
      name: '',
      industry: INDUSTRY_SEGMENTS[0],
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      accountTier: 'Key Account',
      taxId: '',
    });
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.contactPerson) {
      alert('Please fill in organization name and contact person.');
      return;
    }
    addCustomer(formData);
    setIsAddModalOpen(false);
    resetForm();
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingCustomer) return;
    updateCustomer(editingCustomer.id, formData);
    setEditingCustomer(null);
    resetForm();
  };

  const handleDeleteConfirm = () => {
    if (!deletingCustomer) return;
    deleteCustomer(deletingCustomer.id);
    setDeletingCustomer(null);
  };

  const openEdit = (cust) => {
    setEditingCustomer(cust);
    setFormData({
      name: cust.name,
      industry: cust.industry || INDUSTRY_SEGMENTS[0],
      contactPerson: cust.contactPerson || '',
      email: cust.email || '',
      phone: cust.phone || '',
      address: cust.address || '',
      accountTier: cust.accountTier || 'Key Account',
      taxId: cust.taxId || '',
    });
  };

  const canDelete = currentUser?.role === ROLES.ADMIN || currentUser?.role === ROLES.MANAGER;

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Customer Master Registry
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage client organizations across Aerospace, Automotive, Defense & R&D
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
          <span>+ Add Customer</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-2">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by customer name, industry or contact..."
          className="w-full text-xs outline-none bg-transparent"
        />
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((cust) => (
          <div key={cust.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{cust.name}</h3>
                <span className="inline-block mt-0.5 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded">
                  {cust.industry}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full mr-1">
                  {cust.accountTier}
                </span>
                <button
                  onClick={() => openEdit(cust)}
                  className="p-1 text-slate-400 hover:text-brand-600 transition"
                  title="Edit Customer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                {canDelete && (
                  <button
                    onClick={() => setDeletingCustomer(cust)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition"
                    title="Delete Customer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="text-xs space-y-1.5 text-slate-600 border-t border-slate-100 pt-2">
              <p className="font-semibold text-slate-800">Contact: {cust.contactPerson}</p>
              <div className="flex items-center space-x-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{cust.email}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{cust.phone}</span>
              </div>
              <div className="flex items-start space-x-1.5 pt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span className="line-clamp-2 text-[11px]">{cust.address}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Customer Modal */}
      {(isAddModalOpen || editingCustomer) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">{editingCustomer ? 'Edit Customer Organization' : 'Add Customer Master'}</h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingCustomer(null);
                }}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingCustomer ? handleEditSubmit : handleAddSubmit} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Organization Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 border rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Industry Segment *</label>
                <select
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 border rounded-xl outline-none"
                >
                  {INDUSTRY_SEGMENTS.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Person *</label>
                  <input
                    type="text"
                    required
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border rounded-xl outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 border rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Address</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 border rounded-xl outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingCustomer(null);
                  }}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-600 rounded-xl shadow-md"
                >
                  {editingCustomer ? 'Save Changes' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Customer Confirmation Modal */}
      {deletingCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Delete Customer Record</h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete <strong className="text-slate-900">{deletingCustomer.name}</strong>?
            </p>
            <div className="pt-2 flex justify-end space-x-2">
              <button
                onClick={() => setDeletingCustomer(null)}
                className="px-4 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg shadow-md"
              >
                Delete Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
