import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { formatCurrency, formatDate, formatDateTime } from '../../types';
import { X, MapPin, Briefcase, Layers, CheckSquare, Calendar, Phone, Mail, Clock, CheckCircle } from 'lucide-react';

export const EmployeeActivityDrawer = ({ employee, onClose }) => {
  const { visits, officeWorks, kraActivities, tasks, customers, products, filters } = useAppStore();

  if (!employee) return null;

  // Filter employee specific activities
  const empVisits = visits.filter((v) => v.salesEngineerId === employee.id);
  const empOfficeWork = officeWorks.filter((w) => w.salesEngineerId === employee.id);
  const empKras = kraActivities.filter((k) => k.appEngineerId === employee.id);
  const empTasks = tasks.filter((t) => t.assignedToId === employee.id);

  // Consolidated activity timeline array
  const timeline = [
    ...empVisits.map((v) => ({ type: 'Visit', date: v.date, title: `Visit: ${v.contactName}`, desc: v.discussion, raw: v })),
    ...empOfficeWork.map((w) => ({ type: 'OfficeWork', date: w.date, title: `Office Work: ${w.type}`, desc: w.notes, raw: w })),
    ...empKras.map((k) => ({ type: 'KRA', date: k.date, title: `KRA [${k.category}]: ${k.status}`, desc: k.result, raw: k })),
    ...empTasks.map((t) => ({ type: 'Task', date: t.dueDate, title: `Task: ${t.title}`, desc: t.description, raw: t })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-end">
      <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 sm:p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={employee.avatar}
              alt={employee.name}
              className="w-12 h-12 rounded-full border-2 border-brand-500 object-cover"
            />
            <div>
              <h3 className="text-base font-bold">{employee.name}</h3>
              <p className="text-xs text-brand-300 font-medium">{employee.role} • {employee.department}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Employee Summary Stats */}
        <div className="grid grid-cols-4 gap-2 p-4 bg-slate-50 border-b border-slate-200 text-center text-xs">
          <div className="p-2 bg-white rounded-lg border border-slate-200">
            <span className="block text-[10px] text-slate-500 uppercase font-bold">Visits</span>
            <span className="text-base font-bold text-indigo-600">{empVisits.length}</span>
          </div>
          <div className="p-2 bg-white rounded-lg border border-slate-200">
            <span className="block text-[10px] text-slate-500 uppercase font-bold">Office</span>
            <span className="text-base font-bold text-amber-600">{empOfficeWork.length}</span>
          </div>
          <div className="p-2 bg-white rounded-lg border border-slate-200">
            <span className="block text-[10px] text-slate-500 uppercase font-bold">KRAs</span>
            <span className="text-base font-bold text-emerald-600">{empKras.length}</span>
          </div>
          <div className="p-2 bg-white rounded-lg border border-slate-200">
            <span className="block text-[10px] text-slate-500 uppercase font-bold">Tasks</span>
            <span className="text-base font-bold text-rose-600">{empTasks.length}</span>
          </div>
        </div>

        {/* Timeline Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">
            Daily Activity Log Timeline ({timeline.length} Total Events)
          </h4>

          {timeline.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">No activities recorded for this employee yet.</div>
          ) : (
            <div className="relative border-l-2 border-slate-200 ml-3 space-y-6">
              {timeline.map((item, idx) => {
                const cust = item.raw.customerId ? customers.find((c) => c.id === item.raw.customerId) : null;
                const prod = item.raw.productId ? products.find((p) => p.id === item.raw.productId) : null;

                return (
                  <div key={idx} className="relative pl-6">
                    {/* Icon Badge */}
                    <div
                      className={`absolute -left-3 top-0 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white text-xs ${
                        item.type === 'Visit'
                          ? 'bg-indigo-600'
                          : item.type === 'OfficeWork'
                          ? 'bg-amber-500'
                          : item.type === 'KRA'
                          ? 'bg-emerald-600'
                          : 'bg-rose-500'
                      }`}
                    >
                      {item.type === 'Visit' && <MapPin className="w-3 h-3" />}
                      {item.type === 'OfficeWork' && <Briefcase className="w-3 h-3" />}
                      {item.type === 'KRA' && <Layers className="w-3 h-3" />}
                      {item.type === 'Task' && <CheckSquare className="w-3 h-3" />}
                    </div>

                    <div className="bg-slate-50 hover:bg-slate-100/70 p-3.5 rounded-xl border border-slate-200 transition">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-slate-900">{item.title}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{formatDate(item.date)}</span>
                      </div>

                      {cust && (
                        <p className="text-xs text-brand-600 font-semibold mb-1">
                          Client: {cust.name}
                        </p>
                      )}

                      {prod && (
                        <p className="text-[11px] text-slate-600 mb-1">
                          Equipment: <span className="font-medium">{prod.modelNumber} ({prod.name})</span>
                        </p>
                      )}

                      {item.desc && (
                        <p className="text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-200/60 mt-1 line-clamp-3">
                          {item.desc}
                        </p>
                      )}

                      {item.raw.leadStage && (
                        <span className="inline-block mt-2 px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded text-[10px] font-bold">
                          Stage: {item.raw.leadStage}
                        </span>
                      )}

                      {item.raw.budget && (
                        <span className="inline-block mt-2 ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                          Value: {formatCurrency(item.raw.leadValue || item.raw.budget)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
