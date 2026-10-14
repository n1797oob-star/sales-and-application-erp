import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { LEAD_STAGES, formatCurrency } from '../../types';
import { FileUploadModal } from '../common/FileUploadModal';
import { QuickAddCustomerModal } from '../common/QuickAddCustomerModal';
import { QuickAddProductModal } from '../common/QuickAddProductModal';
import { X, MapPin, Upload, CheckCircle, Plus, Calendar, DollarSign, Tag, Users } from 'lucide-react';

export const VisitReportForm = ({ isOpen, onClose, initialData = null }) => {
  const { customers, products, users, addVisitReport, updateVisitReport, addTask, currentUser } = useAppStore();

  const [formData, setFormData] = useState(
    initialData || {
      date: new Date().toISOString().split('T')[0],
      customerId: customers[0]?.id || '',
      contactName: '',
      application: '',
      productId: products[0]?.id || '',
      budget: '',
      leadValue: '',
      discussion: '',
      leadStage: 'Prospecting',
      followUpDate: '',
      nextAction: '',
      attachments: [],
      assignAppEngineer: false,
      assignedAeId: users.find((u) => u.role === 'Application Engineer')?.id || '',
    }
  );

  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [isAddCustOpen, setIsAddCustOpen] = useState(false);
  const [isAddProdOpen, setIsAddProdOpen] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.contactName || !formData.discussion) {
      alert('Please fill in contact name and discussion notes.');
      return;
    }

    const payload = {
      ...formData,
      budget: parseFloat(formData.budget) || 0,
      leadValue: parseFloat(formData.leadValue) || 0,
      salesEngineerId: currentUser.id,
    };

    let createdVisit;
    if (initialData?.id) {
      updateVisitReport(initialData.id, payload);
    } else {
      createdVisit = addVisitReport(payload);
    }

    // Auto-create task for Application Engineer if requested or stage is Demo Needed
    if (formData.assignAppEngineer && formData.assignedAeId) {
      const selectedProd = products.find((p) => p.id === formData.productId);
      const selectedCust = customers.find((c) => c.id === formData.customerId);

      addTask({
        title: `AE Demo Request: ${selectedProd?.modelNumber || 'TMI Equipment'}`,
        description: `Perform live demonstration for ${selectedCust?.name || 'Customer'}. Application: ${formData.application}. Discussion: ${formData.discussion}`,
        category: 'Demonstration',
        priority: 'High',
        dueDate: formData.followUpDate || new Date().toISOString().split('T')[0],
        assignedToId: formData.assignedAeId,
        linkedEntityType: 'Visit',
        linkedEntityId: createdVisit ? createdVisit.id : initialData?.id,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 my-8">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-brand-600 text-white">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">{initialData ? 'Edit Visit Report' : 'New CRM Customer Visit Report'}</h3>
              <p className="text-[11px] text-slate-300">Log customer interaction, TMI requirements & lead stage</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Row 1: Date & Customer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Visit Date *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">Customer Organization *</label>
                <button
                  type="button"
                  onClick={() => setIsAddCustOpen(true)}
                  className="text-[11px] text-brand-600 hover:text-brand-800 font-bold hover:underline flex items-center space-x-0.5"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add New</span>
                </button>
              </div>
              <select
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 outline-none"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.industry})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Contact Person & Application */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contact Person Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Dr. K. Sriman / Vikram Joshi"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">Target TMI Equipment / Model *</label>
                <button
                  type="button"
                  onClick={() => setIsAddProdOpen(true)}
                  className="text-[11px] text-brand-600 hover:text-brand-800 font-bold hover:underline flex items-center space-x-0.5"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add New</span>
                </button>
              </div>
              <select
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 outline-none"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.modelNumber} - {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Application Details */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Technical Application / Project Scope</label>
            <input
              type="text"
              placeholder="e.g. Satellite X-Band Phase Noise Test / EV Motor Drive 800V SiC Measurement"
              value={formData.application}
              onChange={(e) => setFormData({ ...formData, application: e.target.value })}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 outline-none"
            />
          </div>

          {/* Row 3: Budget, Lead Value & Lead Stage */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Customer Budget (₹)</label>
              <input
                type="number"
                placeholder="e.g. 5000000"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Estimated Lead Value (₹)</label>
              <input
                type="number"
                placeholder="e.g. 4500000"
                value={formData.leadValue}
                onChange={(e) => setFormData({ ...formData, leadValue: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Current Lead Stage *</label>
              <select
                value={formData.leadStage}
                onChange={(e) => {
                  const stage = e.target.value;
                  setFormData({
                    ...formData,
                    leadStage: stage,
                    assignAppEngineer: stage === 'Demo Needed' || formData.assignAppEngineer,
                  });
                }}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 outline-none font-semibold text-brand-700"
              >
                {LEAD_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Detailed Discussion Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Discussion Summary & Technical Notes *</label>
            <textarea
              required
              rows={3}
              placeholder="Detail key customer requirements, pain points, competitor equipment present, and timeline..."
              value={formData.discussion}
              onChange={(e) => setFormData({ ...formData, discussion: e.target.value })}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 outline-none"
            />
          </div>

          {/* Row 4: Follow-up & Next Action */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Next Follow-up Date</label>
              <input
                type="date"
                value={formData.followUpDate}
                onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Next Action Items</label>
              <input
                type="text"
                placeholder="e.g. Send technical offer / Schedule AE demo"
                value={formData.nextAction}
                onChange={(e) => setFormData({ ...formData, nextAction: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 outline-none"
              />
            </div>
          </div>

          {/* Assign Application Engineer Option */}
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 text-xs font-bold text-indigo-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.assignAppEngineer}
                  onChange={(e) => setFormData({ ...formData, assignAppEngineer: e.target.checked })}
                  className="w-4 h-4 text-brand-600 rounded"
                />
                <span>Assign Application Engineer for Demo / Tech Support</span>
              </label>
              {formData.leadStage === 'Demo Needed' && (
                <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded font-bold">
                  Recommended for Demo Needed
                </span>
              )}
            </div>

            {formData.assignAppEngineer && (
              <div className="mt-2 pt-2 border-t border-indigo-200/60">
                <label className="block text-[11px] font-bold text-indigo-900 mb-1">
                  Select Application Specialist:
                </label>
                <select
                  value={formData.assignedAeId}
                  onChange={(e) => setFormData({ ...formData, assignedAeId: e.target.value })}
                  className="w-full text-xs p-2 bg-white border border-indigo-200 rounded-lg outline-none"
                >
                  {users
                    .filter((u) => u.role === 'Application Engineer')
                    .map((ae) => (
                      <option key={ae.id} value={ae.id}>
                        {ae.name} ({ae.department})
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>

          {/* Attachments Section Trigger */}
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center space-x-2 text-xs text-slate-700">
              <Upload className="w-4 h-4 text-brand-600" />
              <span>Attachments ({formData.attachments.length} files attached)</span>
            </div>
            <button
              type="button"
              onClick={() => setIsFileModalOpen(true)}
              className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-100 transition"
            >
              Manage Attachments
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
              className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md flex items-center space-x-1.5 active-ring"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Save Visit Report</span>
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
            contactName: prev.contactName || newCust.contactPerson || '',
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
