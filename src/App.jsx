import React, { useState, useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { ROLES, normalizeRole } from './types';
import { LoginForm } from './components/auth/LoginForm';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { BottomNav } from './components/common/BottomNav';
import { ManagerDashboard } from './components/dashboard/ManagerDashboard';
import { SalesEngineerDashboard } from './components/dashboard/SalesEngineerDashboard';
import { AppEngineerDashboard } from './components/dashboard/AppEngineerDashboard';
import { UserManagement } from './components/admin/UserManagement';
import { SalesActivityList } from './components/sales/SalesActivityList';
import { VisitReportForm } from './components/sales/VisitReportForm';
import { OfficeWorkForm } from './components/sales/OfficeWorkForm';
import { PoBookingForm } from './components/sales/PoBookingForm';
import { KraTracker } from './components/application/KraTracker';
import { KraForm } from './components/application/KraForm';
import { TaskSystem } from './components/tasks/TaskSystem';
import { LeadWorkflowTracker } from './components/workflow/LeadWorkflowTracker';
import { CustomerMaster } from './components/masters/CustomerMaster';
import { ProductMaster } from './components/masters/ProductMaster';
import { ReportsCenter } from './components/reports/ReportsCenter';

export function App() {
  const { activeTab, currentUser, isAuthenticated, initApp } = useAppStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (initApp) initApp();
  }, [initApp]);

  // Global Modals State
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [isOfficeModalOpen, setIsOfficeModalOpen] = useState(false);
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [isKraModalOpen, setIsKraModalOpen] = useState(false);

  // Render Login Form if Not Authenticated
  if (!isAuthenticated || !currentUser) {
    return <LoginForm />;
  }

  // View Renderer
  const renderView = () => {
    const role = normalizeRole(currentUser?.role);
    switch (activeTab) {
      case 'dashboard':
        if (role === ROLES.SALES_ENGINEER) {
          return (
            <SalesEngineerDashboard
              onOpenVisitModal={() => setIsVisitModalOpen(true)}
              onOpenOfficeModal={() => setIsOfficeModalOpen(true)}
              onOpenPoModal={() => setIsPoModalOpen(true)}
            />
          );
        }
        if (role === ROLES.APPLICATION_ENGINEER) {
          return <AppEngineerDashboard onOpenKraModal={() => setIsKraModalOpen(true)} />;
        }
        return <ManagerDashboard />;

      case 'dashboard_se':
        return (
          <SalesEngineerDashboard
            onOpenVisitModal={() => setIsVisitModalOpen(true)}
            onOpenOfficeModal={() => setIsOfficeModalOpen(true)}
            onOpenPoModal={() => setIsPoModalOpen(true)}
          />
        );

      case 'dashboard_ae':
        return <AppEngineerDashboard onOpenKraModal={() => setIsKraModalOpen(true)} />;

      case 'users':
        return <UserManagement />;

      case 'visits':
      case 'office_work':
      case 'orders':
        return (
          <SalesActivityList
            onOpenVisitModal={() => setIsVisitModalOpen(true)}
            onOpenOfficeModal={() => setIsOfficeModalOpen(true)}
            onOpenPoModal={() => setIsPoModalOpen(true)}
            initialSubTab={activeTab === 'orders' ? 'orders' : activeTab === 'office_work' ? 'office' : 'visits'}
          />
        );

      case 'kras':
        return <KraTracker onOpenKraModal={() => setIsKraModalOpen(true)} />;

      case 'tasks':
        return <TaskSystem />;

      case 'workflow':
        return (
          <LeadWorkflowTracker
            onOpenVisitModal={() => setIsVisitModalOpen(true)}
            onOpenKraModal={() => setIsKraModalOpen(true)}
            onOpenPoModal={() => setIsPoModalOpen(true)}
          />
        );

      case 'customers':
        return <CustomerMaster />;

      case 'products':
        return <ProductMaster />;

      case 'reports':
        return <ReportsCenter />;

      default:
        return <ManagerDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      {/* Navbar */}
      <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

      {/* Main Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 gap-6">
        {/* Sidebar Navigation */}
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">{renderView()}</main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav onOpenSidebar={() => setIsSidebarOpen(true)} />

      {/* Global Action Modals */}
      <VisitReportForm isOpen={isVisitModalOpen} onClose={() => setIsVisitModalOpen(false)} />
      <OfficeWorkForm isOpen={isOfficeModalOpen} onClose={() => setIsOfficeModalOpen(false)} />
      <PoBookingForm isOpen={isPoModalOpen} onClose={() => setIsPoModalOpen(false)} />
      <KraForm isOpen={isKraModalOpen} onClose={() => setIsKraModalOpen(false)} />
    </div>
  );
}

export default App;
