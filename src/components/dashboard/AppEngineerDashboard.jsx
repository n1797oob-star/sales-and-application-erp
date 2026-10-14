import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { KRA_CATEGORIES } from '../../types';
import { Layers, Plus, Wrench, HelpCircle, FileText, CheckCircle, ArrowRight } from 'lucide-react';

export const AppEngineerDashboard = ({ onOpenKraModal }) => {
  const { currentUser, kraActivities, tasks, customers, products, setActiveTab } = useAppStore();

  const myKras = kraActivities.filter((k) => k.appEngineerId === currentUser.id);
  const myTasks = tasks.filter((t) => t.assignedToId === currentUser.id);

  const demos = myKras.filter((k) => k.category === KRA_CATEGORIES.DEMONSTRATION);
  const installations = myKras.filter((k) => k.category === KRA_CATEGORIES.INSTALLATION);
  const queries = myKras.filter((k) => k.category === KRA_CATEGORIES.QUERY_HANDLING);
  const compliance = myKras.filter(
    (k) => k.category === KRA_CATEGORIES.COMPLIANCE_MAKING || k.category === 'Application Marketing'
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white rounded-2xl p-5 sm:p-6 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-1 bg-white/20 text-white rounded-full text-[10px] uppercase font-bold tracking-wider">
            Application Engineer KRA Workspace
          </span>
          <h1 className="text-xl sm:text-2xl font-bold mt-2">Hello, {currentUser.name}!</h1>
          <p className="text-xs text-emerald-100 mt-1">
            Department: {currentUser.department} • {myKras.length} Key Result Area activities recorded
          </p>
        </div>

        <button
          onClick={onOpenKraModal}
          className="px-4 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-1.5 shrink-0 active-ring"
        >
          <Plus className="w-4 h-4" />
          <span>+ Log KRA Activity</span>
        </button>
      </div>

      {/* 4 KRA Category Metric Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Demonstrations</span>
            <span className="text-2xl font-bold text-indigo-600 mt-1 block">{demos.length}</span>
          </div>
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Installations</span>
            <span className="text-2xl font-bold text-emerald-600 mt-1 block">{installations.length}</span>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <Wrench className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Query Handling</span>
            <span className="text-2xl font-bold text-amber-600 mt-1 block">{queries.length}</span>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
            <HelpCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Compliance Making</span>
            <span className="text-2xl font-bold text-purple-600 mt-1 block">{compliance.length}</span>
          </div>
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
            <FileText className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* KRA Activity Stream */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>My Key Result Area (KRA) Activity Stream</span>
          </h3>
          <button
            onClick={() => setActiveTab('kras')}
            className="text-xs font-bold text-emerald-700 hover:underline flex items-center space-x-1"
          >
            <span>Full KRA Matrix</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {myKras.slice(0, 5).map((kra) => {
            const cust = customers.find((c) => c.id === kra.customerId);
            const prod = products.find((p) => p.id === kra.productId);
            return (
              <div key={kra.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-start justify-between">
                  <span className="font-bold text-slate-900">{kra.applicationArea}</span>
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
                </div>
                <p className="text-slate-600 text-[11px] mt-1 font-medium">
                  Client: {cust?.name} • Equipment: {prod?.modelNumber}
                </p>
                <p className="text-slate-500 mt-1 line-clamp-2 bg-white p-2 rounded-lg border border-slate-200">
                  {kra.result}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
