import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ROLES, normalizeRole } from '../../types';
import {
  LayoutDashboard,
  MapPin,
  Layers,
  CheckSquare,
  ShieldCheck,
  Menu,
} from 'lucide-react';

export const BottomNav = ({ onOpenSidebar }) => {
  const { activeTab, setActiveTab, currentUser } = useAppStore();
  const role = normalizeRole(currentUser?.role);
  const userEmail = String(currentUser?.email || '').toLowerCase().trim();
  const isAdmin =
    role === ROLES.ADMIN ||
    userEmail === 'admin@tmi-erp.com' ||
    userEmail.includes('admin') ||
    String(currentUser?.role || '').toLowerCase().includes('admin');

  const getDashboardId = () => {
    if (role === ROLES.SALES_ENGINEER) return 'dashboard_se';
    if (role === ROLES.APPLICATION_ENGINEER) return 'dashboard_ae';
    return 'dashboard';
  };

  const getNavs = () => {
    const dashId = getDashboardId();
    if (isAdmin) {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'users', label: 'Users', icon: ShieldCheck },
        { id: 'visits', label: 'Sales', icon: MapPin },
        { id: 'kras', label: 'KRAs', icon: Layers },
      ];
    }
    if (role === ROLES.SALES_ENGINEER) {
      return [
        { id: dashId, label: 'Home', icon: LayoutDashboard },
        { id: 'visits', label: 'Activities', icon: MapPin },
        { id: 'tasks', label: 'Tasks', icon: CheckSquare },
      ];
    }
    if (role === ROLES.APPLICATION_ENGINEER) {
      return [
        { id: dashId, label: 'Home', icon: LayoutDashboard },
        { id: 'kras', label: 'KRAs', icon: Layers },
        { id: 'tasks', label: 'Tasks', icon: CheckSquare },
      ];
    }
    // Manager
    return [
      { id: dashId, label: 'Dashboard', icon: LayoutDashboard },
      { id: 'visits', label: 'Sales', icon: MapPin },
      { id: 'kras', label: 'KRAs', icon: Layers },
      { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    ];
  };

  const navs = getNavs();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 md:hidden shadow-mobile">
      <div className="flex items-center justify-around h-14">
        {navs.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id || (item.id.startsWith('dashboard') && activeTab.startsWith('dashboard'));
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition ${
                isActive ? 'text-brand-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'scale-110 text-brand-600' : ''}`} />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          );
        })}

        <button
          onClick={onOpenSidebar}
          className="flex flex-col items-center justify-center flex-1 h-full py-1 text-center text-slate-500 hover:text-slate-800"
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">More</span>
        </button>
      </div>
    </div>
  );
};
