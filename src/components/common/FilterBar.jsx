import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { LEAD_STAGES, KRA_CATEGORY_LIST, TASK_PRIORITIES, TASK_STATUSES } from '../../types';
import { Filter, X, RotateCcw, Calendar, User, Building, Package, Tag, Layers, CheckCircle } from 'lucide-react';

export const FilterBar = () => {
  const { filters, setFilter, resetFilters, users, customers, products } = useAppStore();
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  // Count active non-default filters
  const activeFilterCount = Object.entries(filters).filter(([key, val]) => {
    if (key === 'searchQuery') return false;
    if (key === 'datePreset') return val !== 'All';
    return val !== '' && val !== 'All';
  }).length;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm mb-4">
      {/* Top Header Bar for Mobile & Desktop toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600">
            <Filter className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-800">Filter System</span>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-brand-600 text-white">
              {activeFilterCount} Active
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-slate-100 rounded-md transition flex items-center space-x-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}

          <button
            onClick={() => setIsOpenMobile(!isOpenMobile)}
            className="md:hidden px-3 py-1 bg-brand-50 text-brand-700 font-semibold text-xs rounded-lg flex items-center space-x-1"
          >
            <span>{isOpenMobile ? 'Hide Filters' : 'Filter Options'}</span>
          </button>
        </div>
      </div>

      {/* Filter Grid Controls */}
      <div
        className={`${
          isOpenMobile ? 'block' : 'hidden'
        } md:grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-3 pt-3 border-t border-slate-100 transition`}
      >
        {/* Date Preset */}
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center space-x-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>Date Range</span>
          </label>
          <select
            value={filters.datePreset}
            onChange={(e) => setFilter('datePreset', e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus:bg-white focus:border-brand-500 outline-none"
          >
            <option value="All">All Dates</option>
            <option value="Today">Today</option>
            <option value="Yesterday">Yesterday</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
            <option value="This Quarter">This Quarter</option>
            <option value="Custom">Custom Range</option>
          </select>
        </div>

        {/* Custom Start & End Date */}
        {filters.datePreset === 'Custom' && (
          <>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilter('startDate', e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus:bg-white outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilter('endDate', e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus:bg-white outline-none"
              />
            </div>
          </>
        )}

        {/* Employee */}
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center space-x-1">
            <User className="w-3 h-3 text-slate-400" />
            <span>Employee</span>
          </label>
          <select
            value={filters.employeeId}
            onChange={(e) => setFilter('employeeId', e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus:bg-white focus:border-brand-500 outline-none"
          >
            <option value="All">All Employees</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>
        </div>

        {/* Customer */}
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center space-x-1">
            <Building className="w-3 h-3 text-slate-400" />
            <span>Customer</span>
          </label>
          <select
            value={filters.customerId}
            onChange={(e) => setFilter('customerId', e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus:bg-white focus:border-brand-500 outline-none"
          >
            <option value="All">All Customers</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Product */}
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center space-x-1">
            <Package className="w-3 h-3 text-slate-400" />
            <span>Product</span>
          </label>
          <select
            value={filters.productId}
            onChange={(e) => setFilter('productId', e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus:bg-white focus:border-brand-500 outline-none"
          >
            <option value="All">All Products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.modelNumber} - {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Lead Stage */}
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center space-x-1">
            <Tag className="w-3 h-3 text-slate-400" />
            <span>Lead Stage</span>
          </label>
          <select
            value={filters.leadStage}
            onChange={(e) => setFilter('leadStage', e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus:bg-white focus:border-brand-500 outline-none"
          >
            <option value="All">All Stages</option>
            {LEAD_STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center space-x-1">
            <CheckCircle className="w-3 h-3 text-slate-400" />
            <span>Status</span>
          </label>
          <select
            value={filters.status}
            onChange={(e) => setFilter('status', e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus:bg-white focus:border-brand-500 outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>
    </div>
  );
};
