import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { OFFICE_WORK_TYPES } from '../../types';
import { QuickAddCustomerModal } from '../common/QuickAddCustomerModal';
import { X, Briefcase, CheckCircle, Clock, FileText, Building, Plus } from 'lucide-react';

export const OfficeWorkForm = ({ isOpen, onClose }) => {
  const { customers, addOfficeWork, currentUser } = useAppStore();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: OFFICE_WORK_TYPES[0],
    durationHours: 2.0,
    title: '',
    notes: '',
    customerId: '',
  });

  const [isAddCustOpen, setIsAddCustOpen] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.notes) {
      alert('Please enter title and work notes.');
      return;
    }

    addOfficeWork({
      ...formData,
      durationHours: parseFloat(formData.durationHours) || 1.0,
      salesEngineerId: currentUser.id,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-amber-500 text-white">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Log Office / Other Work</h3>
              <p className="text-[11px] text-slate-300">Meetings, Quotations, Tenders, Discussions & Admin</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Row 1: Date & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Work Date *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Activity Category *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none font-semibold text-amber-700"
              >
                {OFFICE_WORK_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Duration & Customer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Duration (Hours) *</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="12"
                required
                value={formData.durationHours}
                onChange={(e) => setFormData({ ...formData, durationHours: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">Related Customer (Optional)</label>
                <button
                  type="button"
                  onClick={() => setIsAddCustOpen(true)}
                  className="text-[11px] text-amber-700 hover:text-amber-900 font-bold hover:underline flex items-center space-x-0.5"
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
                <option value="">None / Internal Task</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subject Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Task Title / Subject *</label>
            <input
              type="text"
              required
              placeholder="e.g. Quotation offer preparation for ISRO 67GHz VNA / Team Strategy Sync"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
            />
          </div>

          {/* Detailed Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Description & Key Deliverables *</label>
            <textarea
              required
              rows={3}
              placeholder="Detail key topics discussed, outcomes achieved, or document versions prepared..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
            />
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
              className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md flex items-center space-x-1.5 active-ring"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Log Office Activity</span>
            </button>
          </div>
        </form>
      </div>

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
    </div>
  );
};
