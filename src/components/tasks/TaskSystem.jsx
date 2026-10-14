import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { filterTasks } from '../../utils/filterUtils';
import { TASK_STATUSES, TASK_PRIORITIES, formatDate } from '../../types';
import { FilterBar } from '../common/FilterBar';
import { ExportButton } from '../common/ExportButton';
import { CreateTaskModal } from './CreateTaskModal';
import { FileUploadModal } from '../common/FileUploadModal';
import {
  CheckSquare,
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  User,
  Tag,
  Paperclip,
  CheckCircle,
} from 'lucide-react';

export const TaskSystem = () => {
  const { tasks, users, currentUser, updateTaskStatus, filters } = useAppStore();

  const [activeTab, setActiveTab] = useState('Today');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTaskForComplete, setSelectedTaskForComplete] = useState(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [completionFiles, setCompletionFiles] = useState([]);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);

  const filtered = filterTasks(tasks, filters, currentUser);
  const todayStr = new Date().toISOString().split('T')[0];

  const displayedTasks = filtered.filter((t) => {
    if (activeTab === 'Today') return t.dueDate === todayStr && t.status !== TASK_STATUSES.COMPLETED;
    if (activeTab === 'Upcoming') return t.dueDate > todayStr && t.status !== TASK_STATUSES.COMPLETED;
    if (activeTab === 'Overdue') return t.dueDate < todayStr && t.status !== TASK_STATUSES.COMPLETED;
    if (activeTab === 'Completed') return t.status === TASK_STATUSES.COMPLETED;
    return true;
  });

  const handleCompleteSubmit = () => {
    if (!selectedTaskForComplete) return;
    updateTaskStatus(selectedTaskForComplete.id, TASK_STATUSES.COMPLETED, completionNotes, completionFiles);
    setSelectedTaskForComplete(null);
    setCompletionNotes('');
    setCompletionFiles([]);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Task Management System
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor, assign and complete tasks across Sales & Application Engineering teams
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-1.5 shrink-0 active-ring"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create / Assign Task</span>
        </button>
      </div>

      {/* Filter System */}
      <FilterBar />

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 bg-white p-3 rounded-xl border gap-3">
        <div className="flex flex-wrap gap-1.5">
          {['Today', 'Upcoming', 'Overdue', 'Completed', 'All'].map((tab) => {
            const count = filtered.filter((t) => {
              if (tab === 'Today') return t.dueDate === todayStr && t.status !== TASK_STATUSES.COMPLETED;
              if (tab === 'Upcoming') return t.dueDate > todayStr && t.status !== TASK_STATUSES.COMPLETED;
              if (tab === 'Overdue') return t.dueDate < todayStr && t.status !== TASK_STATUSES.COMPLETED;
              if (tab === 'Completed') return t.status === TASK_STATUSES.COMPLETED;
              return true;
            }).length;

            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{tab}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20' : 'bg-slate-200'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <ExportButton
          filename="TMI_Tasks_Export"
          data={displayedTasks.map((t) => ({
            Title: t.title,
            Priority: t.priority,
            Category: t.category,
            Status: t.status,
            DueDate: t.dueDate,
            Assignee: users.find((u) => u.id === t.assignedToId)?.name,
          }))}
        />
      </div>

      {/* Task Cards & List Grid */}
      <div className="space-y-3">
        {displayedTasks.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
            No tasks found under "{activeTab}" filter.
          </div>
        ) : (
          displayedTasks.map((task) => {
            const assignee = users.find((u) => u.id === task.assignedToId);
            const assigner = users.find((u) => u.id === task.assignedById);
            const isOverdue = task.dueDate < todayStr && task.status !== TASK_STATUSES.COMPLETED;

            return (
              <div
                key={task.id}
                className={`bg-white p-4 rounded-2xl border transition shadow-sm hover:shadow-md ${
                  isOverdue ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-start space-x-3">
                    {/* Status Checkbox Button */}
                    <button
                      onClick={() => {
                        if (task.status === TASK_STATUSES.COMPLETED) {
                          updateTaskStatus(task.id, TASK_STATUSES.PENDING);
                        } else {
                          setSelectedTaskForComplete(task);
                        }
                      }}
                      className={`p-2 rounded-xl transition mt-0.5 ${
                        task.status === TASK_STATUSES.COMPLETED
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-slate-100 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600'
                      }`}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>

                    <div>
                      <div className="flex items-center space-x-2">
                        <h4
                          className={`text-sm font-bold ${
                            task.status === TASK_STATUSES.COMPLETED ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {task.title}
                        </h4>

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            task.priority === 'Urgent'
                              ? 'bg-rose-100 text-rose-700'
                              : task.priority === 'High'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {task.priority}
                        </span>

                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-semibold">
                          {task.category}
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">{task.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-500">
                        <span className="flex items-center space-x-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>Assigned to: <strong className="text-slate-700">{assignee?.name}</strong></span>
                        </span>

                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span className={isOverdue ? 'text-rose-600 font-bold' : ''}>
                            Due: {formatDate(task.dueDate)} {isOverdue && '(OVERDUE)'}
                          </span>
                        </span>

                        {task.completionNotes && (
                          <span className="text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded">
                            Notes: {task.completionNotes}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                    {task.status !== TASK_STATUSES.COMPLETED && (
                      <button
                        onClick={() => setSelectedTaskForComplete(task)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center space-x-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Mark Complete</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Task Creation Modal */}
      <CreateTaskModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />

      {/* Completion Modal */}
      {selectedTaskForComplete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Complete Task: {selectedTaskForComplete.title}</h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Completion Notes / Key Outcomes</label>
              <textarea
                rows={3}
                placeholder="Enter completion remarks or sign-off notes..."
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-xs text-slate-700">Completion Proof ({completionFiles.length} files)</span>
              <button
                type="button"
                onClick={() => setIsFileModalOpen(true)}
                className="px-3 py-1 bg-white border text-xs font-bold rounded-lg"
              >
                Attach File
              </button>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                onClick={() => setSelectedTaskForComplete(null)}
                className="px-4 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteSubmit}
                className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-md"
              >
                Confirm Completion
              </button>
            </div>
          </div>
        </div>
      )}

      <FileUploadModal
        isOpen={isFileModalOpen}
        onClose={() => setIsFileModalOpen(false)}
        existingFiles={completionFiles}
        onFilesSelected={(files) => setCompletionFiles(files)}
      />
    </div>
  );
};
