import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { KRA_CATEGORIES, KRA_CATEGORY_LIST } from '../../types';
import { FileUploadModal } from '../common/FileUploadModal';
import { QuickAddCustomerModal } from '../common/QuickAddCustomerModal';
import { QuickAddProductModal } from '../common/QuickAddProductModal';
import { X, Layers, CheckCircle, Upload, Wrench, HelpCircle, FileText, ShieldCheck, Plus } from 'lucide-react';

export const KraForm = ({ isOpen, onClose }) => {
  const { customers, products, users, visits, addKraActivity, currentUser } = useAppStore();

  const [formData, setFormData] = useState({
    category: KRA_CATEGORIES.DEMONSTRATION,
    date: new Date().toISOString().split('T')[0],
    customerId: customers[0]?.id || '',
    productId: products[0]?.id || '',
    applicationArea: '',
    status: 'In Progress',
    result: '',
    followUpDate: '',
    attachments: [],
    linkedLeadId: '',
  });

  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [isAddCustOpen, setIsAddCustOpen] = useState(false);
  const [isAddProdOpen, setIsAddProdOpen] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.applicationArea || !formData.result) {
      alert('Please enter application area and result/outcome summary.');
      return;
    }

    addKraActivity({
      ...formData,
      appEngineerId: currentUser.id,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 my-8">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-emerald-600 text-white">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Log Key Result Area (KRA) Activity</h3>
              <p className="text-[11px] text-slate-300">Demonstration, Installation, Technical Support & Compliance Making</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Category Pills */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Select KRA Category *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {KRA_CATEGORY_LIST.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setFormData({ ...formData, category: cat })}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 transition ${
                    formData.category === cat
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat === 'Demonstration' && <Layers className="w-4 h-4" />}
                  {cat === 'Installation' && <Wrench className="w-4 h-4" />}
                  {cat === 'Query Handling' && <HelpCircle className="w-4 h-4" />}
                  {(cat === 'Compliance Making' || cat === 'Application Marketing') && <ShieldCheck className="w-4 h-4" />}
                  <span className="text-[11px] text-center">{cat}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date Executed *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Activity Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none font-semibold text-emerald-700"
              >
                <option value="Requested">Requested / Scheduled</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Customer & Product Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">Customer Organization *</label>
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
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.industry})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">TMI Product / Model *</label>
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
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.modelNumber} - {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Application Area / Technical Subject */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Application Area / Subject Scope *</label>
            <input
              type="text"
              required
              placeholder="e.g. 67GHz VNA Bench Noise Figure Calibration / EV Inverter High Speed SiC Testing"
              value={formData.applicationArea}
              onChange={(e) => setFormData({ ...formData, applicationArea: e.target.value })}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
            />
          </div>

          {/* Technical Result & Outcome */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Technical Outcome, Results & Sign-off Summary *</label>
            <textarea
              required
              rows={3}
              placeholder="Detail benchmark results, measurement accuracy achieved, customer feedback or sign-off status..."
              value={formData.result}
              onChange={(e) => setFormData({ ...formData, result: e.target.value })}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
            />
          </div>

          {/* Follow up date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Next Follow-up Date (Optional)</label>
            <input
              type="date"
              value={formData.followUpDate}
              onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
            />
          </div>

          {/* Attachments Section Trigger */}
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center space-x-2 text-xs text-slate-700">
              <Upload className="w-4 h-4 text-emerald-600" />
              <span>Sign-off Attachments ({formData.attachments.length} files)</span>
            </div>
            <button
              type="button"
              onClick={() => setIsFileModalOpen(true)}
              className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-100 transition"
            >
              Upload Certificate / Report
            </button>
          </div>

          {/* Submit Actions */}
          <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md flex items-center space-x-1.5 active-ring"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Save KRA Activity</span>
            </button>
          </div>
        </form>
      </div>

      <FileUploadModal
        isOpen={isFileModalOpen}
        onClose={() => setIsFileModalOpen(false)}
        existingFiles={formData.attachments}
        onFilesSelected={(files) => setFormData({ ...formData, attachments: files })}
      />

      <QuickAddCustomerModal
        isOpen={isAddCustOpen}
        onClose={() => setIsAddCustOpen(false)}
        onCustomerAdded={(newCust) =>
          setFormData((prev) => ({
            ...prev,
            customerId: newCust.id,
          }))
        }
      />

      <QuickAddProductModal
        isOpen={isAddProdOpen}
        onClose={() => setIsAddProdOpen(false)}
        onProductAdded={(newProd) =>
          setFormData((prev) => ({
            ...prev,
            productId: newProd.id,
          }))
        }
      />
    </div>
  );
};
