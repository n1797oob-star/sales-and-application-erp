import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { filterKras } from '../../utils/filterUtils';
import { KRA_CATEGORIES, KRA_CATEGORY_LIST, formatDate } from '../../types';
import { FilterBar } from '../common/FilterBar';
import { ExportButton } from '../common/ExportButton';
import { Layers, Plus, Wrench, HelpCircle, FileText, CheckCircle, Clock, FileDown } from 'lucide-react';

export const KraTracker = ({ onOpenKraModal }) => {
  const { kraActivities, customers, products, users, filters, currentUser } = useAppStore();
  const [activeTab, setActiveTab] = useState('All');

  const filteredK = filterKras(kraActivities, filters, currentUser);
  const displayedKras = activeTab === 'All' ? filteredK : filteredK.filter((k) => k.category === activeTab);

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Application Engineer KRA Tracking Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Key Result Area tracking for Demos, Installations, Technical Queries & Compliance Making
          </p>
        </div>

        <button
          onClick={onOpenKraModal}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-1.5 shrink-0 active-ring"
        >
          <Plus className="w-4 h-4" />
          <span>+ Log KRA Activity</span>
        </button>
      </div>

      {/* Filters */}
      <FilterBar />

      {/* Category Pills & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 bg-white p-3 rounded-xl border gap-3">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveTab('All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'All'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All KRAs ({filteredK.length})
          </button>

          {KRA_CATEGORY_LIST.map((cat) => {
            const count = filteredK.filter((k) => k.category === cat).length;
            const isActive = activeTab === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20' : 'bg-slate-200'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <ExportButton
          filename="TMI_KRA_Performance_Report"
          data={displayedKras.map((k) => ({
            Date: k.date,
            Category: k.category,
            Engineer: users.find((u) => u.id === k.appEngineerId)?.name,
            Customer: customers.find((c) => c.id === k.customerId)?.name,
            Product: products.find((p) => p.id === k.productId)?.modelNumber,
            Status: k.status,
            Outcome: k.result,
          }))}
        />
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">KRA Category</th>
                <th className="py-3 px-4">Customer Organization</th>
                <th className="py-3 px-4">TMI Product / Model</th>
                <th className="py-3 px-4">App Specialist</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 max-w-xs">Outcome & Result Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedKras.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No KRA activities logged under this category or filter.
                  </td>
                </tr>
              ) : (
                displayedKras.map((kra) => {
                  const cust = customers.find((c) => c.id === kra.customerId);
                  const prod = products.find((p) => p.id === kra.productId);
                  const ae = users.find((u) => u.id === kra.appEngineerId);

                  return (
                    <tr key={kra.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-semibold text-slate-700 whitespace-nowrap">
                        {formatDate(kra.date)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            kra.category === 'Demonstration'
                              ? 'bg-indigo-100 text-indigo-800'
                              : kra.category === 'Installation'
                              ? 'bg-emerald-100 text-emerald-800'
                              : kra.category === 'Query Handling'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {kra.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{cust?.name}</td>
                      <td className="py-3 px-4 font-bold text-emerald-700">{prod?.modelNumber}</td>
                      <td className="py-3 px-4 font-medium text-slate-700">{ae?.name}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            kra.status === 'Completed'
                              ? 'bg-emerald-100 text-emerald-700'
                              : kra.status === 'In Progress'
                              ? 'bg-sky-100 text-sky-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {kra.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-md">
                        <span className="font-semibold text-slate-800 block">{kra.applicationArea}</span>
                        <span className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{kra.result}</span>
                        {kra.attachments.length > 0 && (
                          <div className="mt-1 flex items-center space-x-1 text-[10px] text-emerald-700 font-bold">
                            <FileDown className="w-3 h-3" />
                            <span>{kra.attachments.length} Sign-off document(s) attached</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
