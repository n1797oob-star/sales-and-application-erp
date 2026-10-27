import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ROLES, normalizeRole } from '../../types';
import {
  LayoutDashboard,
  MapPin,
  Layers,
  CheckSquare,
  GitMerge,
  Users,
  Package,
  FileBarChart,
  X,
  Building2,
  ShieldCheck,
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { activeTab, setActiveTab, currentUser } = useAppStore();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Manager Dashboard',
      icon: LayoutDashboard,
      roles: [ROLES.ADMIN, ROLES.MANAGER],
    },
    {
      id: 'dashboard_se',
      label: 'Sales Workspace',
      icon: LayoutDashboard,
      roles: [ROLES.SALES_ENGINEER],
    },
    {
      id: 'dashboard_ae',
      label: 'App Eng Workspace',
      icon: LayoutDashboard,
      roles: [ROLES.APPLICATION_ENGINEER],
    },
    {
      id: 'users',
      label: 'User Management',
      icon: ShieldCheck,
      roles: [ROLES.ADMIN],
    },
    {
      id: 'visits',
      label: 'Sales Activities',
      icon: MapPin,
      roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.SALES_ENGINEER],
    },
    {
      id: 'kras',
      label: 'KRA Tracker',
      icon: Layers,
      roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.APPLICATION_ENGINEER],
    },
    {
      id: 'tasks',
      label: 'Task System',
      icon: CheckSquare,
      roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.SALES_ENGINEER, ROLES.APPLICATION_ENGINEER],
    },
    {
      id: 'workflow',
      label: 'Lead Pipeline Workflow',
      icon: GitMerge,
      roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.SALES_ENGINEER, ROLES.APPLICATION_ENGINEER],
    },
    {
      id: 'customers',
      label: 'Customer Master',
      icon: Building2,
      roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.SALES_ENGINEER, ROLES.APPLICATION_ENGINEER],
    },
    {
      id: 'products',
      label: 'TMI Product Master',
      icon: Package,
      roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.SALES_ENGINEER, ROLES.APPLICATION_ENGINEER],
    },
    {
      id: 'reports',
      label: 'Reports & Exports',
      icon: FileBarChart,
      roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.SALES_ENGINEER, ROLES.APPLICATION_ENGINEER],
    },
  ];

  const userRole = normalizeRole(currentUser?.role);
  const isAdmin = userRole === ROLES.ADMIN || String(currentUser?.email || '').toLowerCase().includes('admin');

  let visibleItems = navItems.filter((item) => {
    // Admin has access to all management modules (KRA, visits, tasks, users, masters, reports)
    if (isAdmin) {
      return item.id !== 'dashboard_se' && item.id !== 'dashboard_ae';
    }
    return item.roles.some((r) => normalizeRole(r) === userRole);
  });

  // Bulletproof fallback so navigation NEVER goes blank
  if (!visibleItems || visibleItems.length === 0) {
    visibleItems = navItems.filter(
      (item) => item.id !== 'dashboard_se' && item.id !== 'dashboard_ae'
    );
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-64 bg-slate-900 text-white z-50 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:z-0 flex flex-col justify-between ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 bg-slate-950 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center font-bold text-white text-sm">
                TMI
              </div>
              <span className="font-bold text-sm tracking-wide text-slate-100">Navigation</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-white md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Info Bar */}
          <div className="p-4 border-b border-slate-800 bg-slate-900/50">
            <div className="flex items-center space-x-3">
              <img
                src={currentUser?.avatar}
                alt={currentUser?.name}
                className="w-9 h-9 rounded-full border border-slate-700 object-cover"
              />
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-200 truncate">{currentUser?.name}</p>
                <p className="text-[10px] text-brand-400 font-medium truncate">{currentUser?.role}</p>
              </div>
            </div>
          </div>

          {/* Nav List */}
          <nav className="px-2 py-4 space-y-1">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const salesActivityTabs = ['visits', 'office_work', 'orders'];
              const isActive =
                activeTab === item.id ||
                (item.id === 'visits' && salesActivityTabs.includes(activeTab));
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 text-[11px] text-slate-500 text-center">
          TMI ERP v1.0 • Mobile-First
        </div>
      </aside>
    </>
  );
};
