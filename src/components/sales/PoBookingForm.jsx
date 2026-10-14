import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { PO_STATUSES, formatCurrency } from '../../types';
import { QuickAddCustomerModal } from '../common/QuickAddCustomerModal';
import { QuickAddProductModal } from '../common/QuickAddProductModal';
import { FileUploadModal } from '../common/FileUploadModal';
import { X, ShoppingBag, Plus, Upload, CheckCircle, Calendar, DollarSign, Building, Package, FileText } from 'lucide-react';

export const PoBookingForm = ({ isOpen, onClose, initialData = null }) => {
  const { customers, products, visits, users, addOrder, updateOrder, currentUser } = useAppStore();

  const [formData, setFormData] = useState(
    initialData || {
      poNumber: '',
      poDate: new Date().toISOString().split('T')[0],
      customerId: customers[0]?.id || '',
      productId: products[0]?.id || '',
      contactPerson: '',
      orderValue: '',
      deliveryDate: '',
      paymentTerms: '30% Advance, 70% on Dispatch',
      scopeOfSupply: '',
      status: 'PO Received',
      linkedLeadId: '',
      attachments: [],
    }
  );

  const [isAddCustOpen, setIsAddCustOpen] = useState(false);
  const [isAddProdOpen, setIsAddProdOpen] = useState(false);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Filter visits for customer if customer selected
  const availableVisits = visits.filter(
    (v) => !formData.customerId || v.customerId === formData.customerId
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.poNumber.trim()) {
      setError('Purchase Order Number / Reference is required.');
      return;
    }
    if (!formData.customerId) {
      setError('Please select or add a Customer Organization.');
      return;
    }
    if (!formData.productId) {
      setError('Please select or add a TMI Product / Model.');
      return;
    }
    if (!formData.orderValue || parseFloat(formData.orderValue) <= 0) {
      setError('Please enter a valid PO Order Value.');
      return;
    }

    const payload = {
      ...formData,
      poNumber: formData.poNumber.trim(),
      orderValue: parseFloat(formData.orderValue) || 0,
      salesEngineerId: currentUser?.id,
    };

    if (initialData?.id) {
      updateOrder(initialData.id, payload);
    } else {
      addOrder(payload);
    }

    onClose();
  };

  const handleCustomerAdded = (newCust) => {
    setFormData((prev) => ({
      ...prev,
      customerId: newCust.id,
      contactPerson: prev.contactPerson || newCust.contactPerson || '',
    }));
  };

  const handleProductAdded = (newProd) => {
    setFormData((prev) => ({
      ...prev,
      productId: newProd.id,
    }));
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 my-8 animate-in zoom-in-95">
          {/* Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-emerald-800 to-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-emerald-500 text-white shadow-md">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold">
                  {initialData ? 'Edit Purchase Order' : 'PO Order Booking (Won Lead)'}
                </h3>
                <p className="text-[11px] text-emerald-200">
                  Log purchase order received today • Automatically updates Lead Pipeline as Won
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
                {error}
              </div>
            )}

            {/* Row 1: PO Number & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  PO Number / Reference *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PO/ISRO/2026/042 or BEL-PO-991"
                  value={formData.poNumber}
                  onChange={(e) => {
                    setFormData({ ...formData, poNumber: e.target.value });
                    setError('');
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  PO Booking Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.poDate}
                  onChange={(e) => setFormData({ ...formData, poDate: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none font-medium"
                />
              </div>
            </div>

            {/* Row 2: Customer Organization & Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">Customer Organization *</label>
                  <button
                    type="button"
                    onClick={() => setIsAddCustOpen(true)}
                    className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold hover:underline flex items-center space-x-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add New</span>
                  </button>
                </div>
                <select
                  value={formData.customerId}
                  onChange={(e) => {
                    const sel = customers.find((c) => c.id === e.target.value);
                    setFormData({
                      ...formData,
                      customerId: e.target.value,
                      contactPerson: sel?.contactPerson || formData.contactPerson,
                    });
                    setError('');
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none"
                >
                  <option value="">-- Select Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.industry})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Contact Person / Officer
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. K. Sriman / Purchase Officer"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
                />
              </div>
            </div>

            {/* Row 3: Product / Model & Order Value */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">TMI Product / Model *</label>
                  <button
                    type="button"
                    onClick={() => setIsAddProdOpen(true)}
                    className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold hover:underline flex items-center space-x-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add New</span>
                  </button>
                </div>
                <select
                  value={formData.productId}
                  onChange={(e) => {
                    setFormData({ ...formData, productId: e.target.value });
                    setError('');
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none font-semibold text-emerald-800"
                >
                  <option value="">-- Select Product / Model --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.modelNumber} - {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  PO Order Value (₹ INR) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="1000"
                  placeholder="e.g. 60000000"
                  value={formData.orderValue}
                  onChange={(e) => {
                    setFormData({ ...formData, orderValue: e.target.value });
                    setError('');
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none font-bold text-slate-900"
                />
                {formData.orderValue > 0 && (
                  <span className="text-[10px] text-emerald-700 font-bold mt-0.5 block">
                    {formatCurrency(formData.orderValue)}
                  </span>
                )}
              </div>
            </div>

            {/* Row 4: Delivery Date & Payment Terms */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Expected Delivery / Execution Date
                </label>
                <input
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Terms</label>
                <input
                  type="text"
                  placeholder="e.g. 30% Advance, 70% against delivery / Net 30"
                  value={formData.paymentTerms}
                  onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
                />
              </div>
            </div>

            {/* Row 5: Link to Existing Lead / Visit (Optional) */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Link to Existing CRM Visit / Pipeline Lead (Optional)
              </label>
              <select
                value={formData.linkedLeadId}
                onChange={(e) => setFormData({ ...formData, linkedLeadId: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
              >
                <option value="">Create as Fresh Won PO Order in Pipeline</option>
                {availableVisits.map((v) => {
                  const cust = customers.find((c) => c.id === v.customerId);
                  const prod = products.find((p) => p.id === v.productId);
                  return (
                    <option key={v.id} value={v.id}>
                      {v.date} • {cust?.name} • {prod?.modelNumber} • Stage: {v.leadStage} (Value: {formatCurrency(v.leadValue || v.budget)})
                    </option>
                  );
                })}
              </select>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Linking an existing lead updates its status to 'Won' with this PO value.
              </p>
            </div>

            {/* Scope of Supply & Remarks */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Scope of Supply / Order Details / Remarks
              </label>
              <textarea
                rows={2}
                placeholder="List equipment details, warranty terms, accessories, or delivery milestones..."
                value={formData.scopeOfSupply}
                onChange={(e) => setFormData({ ...formData, scopeOfSupply: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
              />
            </div>

            {/* File Attachments */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-700 block">Attach PO Copy / Documentation</span>
                  <span className="text-[10px] text-slate-400">PDF, scanned copy, contract document</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFileModalOpen(true)}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg flex items-center space-x-1 shadow-sm transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Attach Document</span>
                </button>
              </div>

              {formData.attachments?.length > 0 && (
                <div className="mt-2 space-y-1">
                  {formData.attachments.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-1.5 bg-white border border-slate-200 rounded-lg text-[11px]">
                      <span className="font-semibold text-slate-800 truncate">{file.name}</span>
                      <span className="text-slate-400 text-[10px]">{file.size}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Booked by: <strong>{currentUser?.name}</strong>
              </span>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center space-x-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Book Purchase Order</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Quick Add Modals */}
      <QuickAddCustomerModal
        isOpen={isAddCustOpen}
        onClose={() => setIsAddCustOpen(false)}
        onCustomerAdded={handleCustomerAdded}
      />
      <QuickAddProductModal
        isOpen={isAddProdOpen}
        onClose={() => setIsAddProdOpen(false)}
        onProductAdded={handleProductAdded}
      />
      <FileUploadModal
        isOpen={isFileModalOpen}
        onClose={() => setIsFileModalOpen(false)}
        onUploadComplete={(newFiles) =>
          setFormData({ ...formData, attachments: [...formData.attachments, ...newFiles] })
        }
      />
    </>
  );
};
