import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { formatCurrency, formatDate } from '../../types';
import { MapPin, Briefcase, Plus, Trophy, DollarSign, Calendar, ArrowRight, ShoppingBag } from 'lucide-react';

export const SalesEngineerDashboard = ({ onOpenVisitModal, onOpenOfficeModal, onOpenPoModal }) => {
  const { currentUser, visits, officeWorks, orders, tasks, customers, products, setActiveTab } = useAppStore();

  const myVisits = visits.filter((v) => v.salesEngineerId === currentUser?.id);
  const myOfficeWork = officeWorks.filter((w) => w.salesEngineerId === currentUser?.id);
  const myOrders = (orders || []).filter((o) => o.salesEngineerId === currentUser?.id);
  const myTasks = tasks.filter((t) => t.assignedToId === currentUser?.id);

  const openLeads = myVisits.filter((v) => v.leadStage !== 'Won' && v.leadStage !== 'Lost');
  const pipelineVal = openLeads.reduce((a, c) => a + (c.leadValue || c.budget || 0), 0);
  const wonVal = myVisits
    .filter((v) => v.leadStage === 'Won')
    .reduce((a, c) => a + (c.leadValue || c.budget || 0), 0);
  const totalPoVal = myOrders.reduce((a, c) => a + (c.orderValue || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-brand-700 to-indigo-800 text-white rounded-2xl p-5 sm:p-6 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-1 bg-white/20 text-white rounded-full text-[10px] uppercase font-bold tracking-wider">
            Sales Engineer Portal
          </span>
          <h1 className="text-xl sm:text-2xl font-bold mt-2">Welcome back, {currentUser?.name}!</h1>
          <p className="text-xs text-brand-100 mt-1">
            Territory: {currentUser?.territory} • {myVisits.length} Visits • {myOrders.length} PO Orders Booked
          </p>
        </div>

        {/* Quick Action FABs */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={onOpenVisitModal}
            className="px-3.5 py-2.5 bg-white text-brand-700 hover:bg-brand-50 text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-1.5 active-ring"
          >
            <Plus className="w-4 h-4" />
            <span>+ Log Visit Report</span>
          </button>

          <button
            onClick={onOpenOfficeModal}
            className="px-3.5 py-2.5 bg-brand-900/60 hover:bg-brand-900 text-white text-xs font-bold rounded-xl border border-white/20 transition flex items-center space-x-1.5 active-ring"
          >
            <Briefcase className="w-4 h-4" />
            <span>+ Office Work</span>
          </button>

          <button
            onClick={onOpenPoModal}
            className="px-3.5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-1.5 active-ring"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>+ Book PO</span>
          </button>
        </div>
      </div>

      {/* Sales Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold block">Total Visits</span>
          <span className="text-2xl font-bold text-indigo-600 mt-1 block">{myVisits.length}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold block">Active Leads</span>
          <span className="text-2xl font-bold text-sky-600 mt-1 block">{openLeads.length}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold block">My Pipeline Value</span>
          <span className="text-lg sm:text-xl font-bold text-emerald-600 mt-1 block truncate">
            {formatCurrency(pipelineVal)}
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold block">POs Booked</span>
          <span className="text-lg sm:text-xl font-bold text-indigo-700 mt-1 block truncate">
            {myOrders.length} ({formatCurrency(totalPoVal || wonVal)})
          </span>
        </div>
      </div>

      {/* Recent Visits & Office Work List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Visit Reports */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-indigo-600" />
              <span>Recent Visit Reports</span>
            </h3>
            <button
              onClick={() => setActiveTab('visits')}
              className="text-xs font-bold text-brand-600 hover:underline flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {myVisits.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No visits logged yet.</p>
            ) : (
              myVisits.slice(0, 4).map((v) => {
                const cust = customers.find((c) => c.id === v.customerId);
                return (
                  <div key={v.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-bold text-slate-900">{cust?.name || 'Customer'}</span>
                        <p className="text-slate-600 text-[11px] mt-0.5 font-medium">Contact: {v.contactName}</p>
                      </div>
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded text-[10px] font-bold">
                        {v.leadStage}
                      </span>
                    </div>
                    <p className="text-slate-500 mt-1 line-clamp-1 italic">{v.discussion}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent PO Bookings */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              <span>Recent PO Bookings</span>
            </h3>
            <button
              onClick={() => setActiveTab('orders')}
              className="text-xs font-bold text-emerald-700 hover:underline flex items-center space-x-1"
            >
              <span>View All POs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {myOrders.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200">
                <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">No Purchase Orders logged yet</p>
                <button
                  onClick={onOpenPoModal}
                  className="mt-2 text-xs font-bold text-emerald-700 hover:underline inline-block"
                >
                  + Book First PO
                </button>
              </div>
            ) : (
              myOrders.slice(0, 4).map((o) => {
                const cust = customers.find((c) => c.id === o.customerId);
                const prod = products.find((p) => p.id === o.productId);
                return (
                  <div key={o.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-bold text-slate-900 block font-mono">{o.poNumber}</span>
                        <p className="text-slate-600 text-[11px] font-medium">{cust?.name}</p>
                        <p className="text-slate-500 text-[10px]">{prod?.modelNumber}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-emerald-700 block">
                          {formatCurrency(o.orderValue)}
                        </span>
                        <span className="text-[10px] text-slate-400">{formatDate(o.poDate)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
