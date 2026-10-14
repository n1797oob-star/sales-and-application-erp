import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { LEAD_STAGES, ROLES, formatCurrency, formatDate } from '../../types';
import { isWithinDatePreset } from '../../utils/filterUtils';
import {
  GitMerge,
  ArrowRight,
  CheckCircle,
  MapPin,
  Layers,
  User,
  Plus,
  ShoppingBag,
  Calendar,
  Filter,
  DollarSign,
  Search,
  RotateCcw,
  Paperclip,
  TrendingUp,
} from 'lucide-react';

export const LeadWorkflowTracker = ({ onOpenVisitModal, onOpenKraModal, onOpenPoModal }) => {
  const { visits, kraActivities, tasks, orders, customers, products, users, currentUser } = useAppStore();

  // Local Pipeline Filters (days, week, month, custom)
  const [datePreset, setDatePreset] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(
    currentUser?.role === ROLES.SALES_ENGINEER ? currentUser.id : 'All'
  );
  const [selectedStage, setSelectedStage] = useState('All');
  const [pipelineSearch, setPipelineSearch] = useState('');
  const [pipelineViewMode, setPipelineViewMode] = useState('board'); // 'board' or 'list'

  const workflowSteps = [
    { name: 'Visit Report', desc: 'CRM Initial Customer Visit', icon: MapPin, color: 'bg-indigo-600' },
    { name: 'Lead Qualified', desc: 'Requirement & Budget Validation', icon: CheckCircle, color: 'bg-sky-600' },
    { name: 'Assign App Eng', desc: 'Demo / Installation Request', icon: User, color: 'bg-amber-600' },
    { name: 'Demo / KRA', desc: 'Bench Setup & Sign-off', icon: Layers, color: 'bg-purple-600' },
    { name: 'Follow-up / Proposal', desc: 'Commercial Offer', icon: GitMerge, color: 'bg-brand-600' },
    { name: 'Won / PO Received', desc: 'Purchase Order Booked', icon: ShoppingBag, color: 'bg-emerald-600' },
  ];

  // Filtered Leads
  const filteredVisits = useMemo(() => {
    return visits.filter((v) => {
      // Role scoping
      if (currentUser?.role === ROLES.SALES_ENGINEER && v.salesEngineerId !== currentUser.id) {
        return false;
      }
      if (selectedEmployeeId !== 'All' && v.salesEngineerId !== selectedEmployeeId) {
        return false;
      }

      // Date preset filtering (days, week, month, custom)
      if (!isWithinDatePreset(v.date, datePreset, startDate, endDate)) {
        return false;
      }

      // Stage filter
      if (selectedStage !== 'All' && v.leadStage !== selectedStage) {
        return false;
      }

      // Search query
      if (pipelineSearch.trim()) {
        const q = pipelineSearch.toLowerCase().trim();
        const cust = customers.find((c) => c.id === v.customerId);
        const prod = products.find((p) => p.id === v.productId);
        const eng = users.find((u) => u.id === v.salesEngineerId);

        const match =
          (v.contactName && v.contactName.toLowerCase().includes(q)) ||
          (v.application && v.application.toLowerCase().includes(q)) ||
          (v.discussion && v.discussion.toLowerCase().includes(q)) ||
          (cust?.name && cust.name.toLowerCase().includes(q)) ||
          (prod?.modelNumber && prod.modelNumber.toLowerCase().includes(q)) ||
          (eng?.name && eng.name.toLowerCase().includes(q));

        if (!match) return false;
      }

      return true;
    });
  }, [
    visits,
    datePreset,
    startDate,
    endDate,
    selectedEmployeeId,
    selectedStage,
    pipelineSearch,
    currentUser,
    customers,
    products,
    users,
  ]);

  // Summary Metrics
  const openLeads = filteredVisits.filter((v) => v.leadStage !== 'Won' && v.leadStage !== 'Lost');
  const openPipelineValue = openLeads.reduce((acc, curr) => acc + (curr.leadValue || curr.budget || 0), 0);
  const wonLeads = filteredVisits.filter((v) => v.leadStage === 'Won');
  const wonRevenue = wonLeads.reduce((acc, curr) => acc + (curr.leadValue || curr.budget || 0), 0);
  const lostLeads = filteredVisits.filter((v) => v.leadStage === 'Lost');
  const winRate = filteredVisits.length
    ? Math.round((wonLeads.length / (wonLeads.length + lostLeads.length || 1)) * 100)
    : 0;

  const resetPipelineFilters = () => {
    setDatePreset('All');
    setStartDate('');
    setEndDate('');
    setSelectedEmployeeId(currentUser?.role === ROLES.SALES_ENGINEER ? currentUser.id : 'All');
    setSelectedStage('All');
    setPipelineSearch('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Lead Pipeline & Lifecycle Workflow
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track lead progression from Visit → Demo/KRA → Proposal → PO Order Booking (Won)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenVisitModal}
            className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-1.5 active-ring"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Visit</span>
          </button>
          <button
            onClick={onOpenKraModal}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-1.5 active-ring"
          >
            <Layers className="w-4 h-4" />
            <span>+ Log Demo KRA</span>
          </button>
          <button
            onClick={onOpenPoModal}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-1.5 active-ring"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>+ Book PO</span>
          </button>
        </div>
      </div>

      {/* Date Filter & Search Control Panel */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Quick Date Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 mr-1 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Timeframe:</span>
            </span>

            {[
              { id: 'All', label: 'All Time' },
              { id: 'Today', label: "Today's Leads" },
              { id: 'This Week', label: 'This Week' },
              { id: 'This Month', label: 'This Month' },
              { id: 'Custom', label: 'Custom Range' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setDatePreset(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  datePreset === p.id
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Search & Reset */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search pipeline leads..."
                value={pipelineSearch}
                onChange={(e) => setPipelineSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:border-brand-500 outline-none"
              />
            </div>

            <button
              onClick={resetPipelineFilters}
              title="Reset Filters"
              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded-lg transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Custom Date Pickers & Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100">
          {datePreset === 'Custom' && (
            <>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white outline-none"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Filter by Stage</label>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white outline-none"
            >
              <option value="All">All Stages</option>
              {LEAD_STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {currentUser?.role !== ROLES.SALES_ENGINEER && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Sales Engineer</label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white outline-none"
              >
                <option value="All">All Sales Engineers</option>
                {users
                  .filter((u) => u.role === ROLES.SALES_ENGINEER || u.role === ROLES.MANAGER)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div className="flex items-end justify-between sm:justify-end space-x-2">
            <span className="text-[11px] text-slate-500 font-semibold self-center">View:</span>
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setPipelineViewMode('board')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                  pipelineViewMode === 'board' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                Kanban
              </button>
              <button
                onClick={() => setPipelineViewMode('list')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                  pipelineViewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                Table List
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold block">Total Pipeline Leads</span>
          <span className="text-2xl font-bold text-brand-600 mt-1 block">{filteredVisits.length}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold block">Open Pipeline Value</span>
          <span className="text-lg sm:text-xl font-bold text-slate-900 mt-1 block truncate">
            {formatCurrency(openPipelineValue)}
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold block">Won PO Orders</span>
          <span className="text-lg sm:text-xl font-bold text-emerald-600 mt-1 block truncate">
            {wonLeads.length} ({formatCurrency(wonRevenue)})
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold block">Win Conversion Rate</span>
          <span className="text-2xl font-bold text-indigo-700 mt-1 block">{winRate}%</span>
        </div>
      </div>

      {/* Visual Workflow Steps Graphic */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-4">
          TMI Lifecycle Stage Progression
        </h3>
        <div className="flex items-center justify-between min-w-[700px] relative">
          {workflowSteps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <React.Fragment key={idx}>
                <div className="flex flex-col items-center text-center z-10 w-28">
                  <div className={`w-10 h-10 rounded-2xl ${step.color} text-white flex items-center justify-center shadow-md mb-2`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 leading-tight">{step.name}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">{step.desc}</span>
                </div>

                {idx < workflowSteps.length - 1 && (
                  <div className="flex-1 h-0.5 bg-slate-200 mx-2 relative -top-3">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-300">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Main Pipeline Display: Kanban Board or List */}
      {pipelineViewMode === 'board' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {LEAD_STAGES.map((stage) => {
            const stageLeads = filteredVisits.filter((v) => v.leadStage === stage);
            const stageVal = stageLeads.reduce((a, c) => a + (c.leadValue || c.budget || 0), 0);

            return (
              <div key={stage} className="bg-slate-100/70 rounded-2xl p-3 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center space-x-1.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        stage === 'Won'
                          ? 'bg-emerald-500'
                          : stage === 'Lost'
                          ? 'bg-rose-500'
                          : stage === 'Demo Needed'
                          ? 'bg-indigo-500'
                          : 'bg-amber-500'
                      }`}
                    />
                    <h4 className="text-xs font-bold text-slate-800">{stage}</h4>
                    <span className="text-[10px] font-bold text-slate-400 px-1.5 py-0.5 bg-white rounded-full">
                      {stageLeads.length}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-600">{formatCurrency(stageVal)}</span>
                </div>

                <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                  {stageLeads.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 text-[11px] italic">No leads in this stage</div>
                  ) : (
                    stageLeads.map((v) => {
                      const cust = customers.find((c) => c.id === v.customerId);
                      const prod = products.find((p) => p.id === v.productId);
                      const eng = users.find((u) => u.id === v.salesEngineerId);
                      const linkedPo = orders.find((o) => o.id === v.linkedPoId);

                      return (
                        <div
                          key={v.id}
                          className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition space-y-2"
                        >
                          <div className="flex items-start justify-between">
                            <span className="font-bold text-slate-900 text-xs line-clamp-1">
                              {cust?.name || 'Customer'}
                            </span>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">{formatDate(v.date)}</span>
                          </div>

                          <div className="text-[11px] text-slate-600 space-y-0.5">
                            <p className="font-semibold text-brand-600 line-clamp-1">{prod?.modelNumber}</p>
                            <p className="line-clamp-1 text-slate-500">{v.application}</p>
                          </div>

                          {/* PO Indicator if Won */}
                          {stage === 'Won' && (
                            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-[10px] text-emerald-800 space-y-0.5">
                              <div className="flex items-center space-x-1 font-bold">
                                <ShoppingBag className="w-3 h-3 text-emerald-600" />
                                <span>PO Booked: {linkedPo?.poNumber || 'Confirmed Order'}</span>
                              </div>
                              {linkedPo?.paymentTerms && (
                                <p className="text-[9px] text-slate-600">Terms: {linkedPo.paymentTerms}</p>
                              )}
                            </div>
                          )}

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                            <span className="text-slate-400 font-medium">{eng?.name?.split(' ')[0]}</span>
                            <span className="font-bold text-emerald-700">
                              {formatCurrency(v.leadValue || v.budget)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table List View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Pipeline Leads & PO Order Status</h3>
            <span className="text-xs text-slate-500 font-semibold">{filteredVisits.length} Records</span>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredVisits.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No pipeline leads found matching the selected timeframe or criteria.
              </div>
            ) : (
              filteredVisits.map((visit) => {
                const cust = customers.find((c) => c.id === visit.customerId);
                const prod = products.find((p) => p.id === visit.productId);
                const se = users.find((u) => u.id === visit.salesEngineerId);
                const linkedKras = kraActivities.filter(
                  (k) => k.customerId === visit.customerId || k.linkedLeadId === visit.id
                );
                const linkedTasks = tasks.filter((t) => t.linkedEntityId === visit.id);
                const linkedPo = orders.find((o) => o.id === visit.linkedPoId);

                return (
                  <div key={visit.id} className="p-4 hover:bg-slate-50/70 transition space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 text-sm">{cust?.name}</span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              visit.leadStage === 'Won'
                                ? 'bg-emerald-100 text-emerald-800'
                                : visit.leadStage === 'Demo Needed'
                                ? 'bg-indigo-100 text-indigo-800'
                                : visit.leadStage === 'Lost'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            Stage: {visit.leadStage}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Application: <strong className="text-brand-600">{visit.application}</strong> • Equipment:{' '}
                          <strong>{prod?.modelNumber}</strong> • Date: {formatDate(visit.date)}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-bold text-emerald-700 block">
                          {formatCurrency(visit.leadValue || visit.budget)}
                        </span>
                        <span className="text-[10px] text-slate-400">Sales Eng: {se?.name}</span>
                      </div>
                    </div>

                    {/* Sub-workflow audit trail badges */}
                    <div className="bg-slate-100/60 p-2.5 rounded-xl flex flex-wrap items-center gap-3 text-xs">
                      <span className="text-slate-500 font-semibold text-[11px]">Workflow Details:</span>

                      {linkedPo && (
                        <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded text-[10px] font-bold flex items-center space-x-1">
                          <ShoppingBag className="w-3 h-3 text-emerald-700" />
                          <span>PO #{linkedPo.poNumber} Booked</span>
                        </span>
                      )}

                      {linkedKras.length > 0 ? (
                        linkedKras.map((k) => (
                          <span key={k.id} className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded text-[10px] font-bold">
                            KRA: {k.category} ({k.status})
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-[10px] italic">No AE KRA linked yet</span>
                      )}

                      {linkedTasks.length > 0 && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-bold">
                          {linkedTasks.length} Active Task(s)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
