import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { TASK_PRIORITIES } from '../../types';
import { X, CheckSquare, Calendar, User, AlertCircle, FileText } from 'lucide-react';

export const CreateTaskModal = ({ isOpen, onClose }) => {
  const { users, customers, products, addTask, currentUser } = useAppStore();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'General',
    priority: TASK_PRIORITIES.MEDIUM,
    dueDate: new Date().toISOString().split('T')[0],
    assignedToId: users[2]?.id || users[0]?.id, // Default sales engineer
    linkedEntityType: 'Customer',
    linkedEntityId: customers[0]?.id || '',
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title) {
      alert('Please enter a task title.');
      return;
    }

    addTask({
      ...formData,
      assignedById: currentUser.id,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-brand-600 text-white">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Assign / Create Task</h3>
              <p className="text-[11px] text-slate-300">Assign task, set priority matrix & target due date</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Task Title / Action Item *</label>
            <input
              type="text"
              required
              placeholder="e.g. Perform 67GHz VNA Demo at ISRO Payload Lab"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
            />
          </div>

          {/* Row 1: Assignee & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Assign To Employee *</label>
              <select
                value={formData.assignedToId}
                onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none font-semibold text-brand-700"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Priority Matrix *</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className={`w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none font-bold ${
                  formData.priority === 'Urgent'
                    ? 'text-rose-600'
                    : formData.priority === 'High'
                    ? 'text-amber-600'
                    : 'text-slate-700'
                }`}
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
                <option value="Urgent">Urgent / Critical</option>
              </select>
            </div>
          </div>

          {/* Row 2: Category & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Task Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
              >
                <option value="Demonstration">Demonstration</option>
                <option value="Installation">Installation</option>
                <option value="Quotation">Quotation Preparation</option>
                <option value="Tender">Tender Submission</option>
                <option value="Follow-up">Customer Follow-up</option>
                <option value="Query Handling">Query Handling</option>
                <option value="General">General Task</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Due Date *</label>
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Description & Instructions</label>
            <textarea
              rows={3}
              placeholder="Detailed instructions for the assigned engineer..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
            />
          </div>

          {/* Submit */}
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
              className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md active-ring"
            >
              Assign Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
