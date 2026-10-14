import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { filterVisits, filterKras, filterTasks, filterOfficeWorks } from '../../utils/filterUtils';
import { formatCurrency, LEAD_STAGES, TASK_STATUSES } from '../../types';
import { KpiCard } from '../common/KpiCard';
import { ExportButton } from '../common/ExportButton';
import { EmployeeActivityDrawer } from './EmployeeActivityDrawer';
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  CheckCircle,
  MapPin,
  Layers,
  Wrench,
  HelpCircle,
  Calendar,
  DollarSign,
  Trophy,
  Users,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export const ManagerDashboard = () => {
  const {
    users,
    visits,
    officeWorks,
    kraActivities,
    tasks,
    filters,
    setSelectedEmployeeForDrawer,
    selectedEmployeeForDrawer,
  } = useAppStore();

  // Apply active global filters
  const filteredVisits = filterVisits(visits, filters);
  const filteredOfficeWorks = filterOfficeWorks(officeWorks, filters);
  const filteredKras = filterKras(kraActivities, filters);
  const filteredTasks = filterTasks(tasks, filters);

  const todayStr = new Date().toISOString().split('T')[0];

  // KPI Calculations
  const todayTasks = filteredTasks.filter((t) => t.dueDate === todayStr);
  const completedTasks = filteredTasks.filter((t) => t.status === TASK_STATUSES.COMPLETED);
  const pendingTasks = filteredTasks.filter((t) => t.status === TASK_STATUSES.PENDING || t.status === TASK_STATUSES.IN_PROGRESS);
  const overdueTasks = filteredTasks.filter((t) => t.dueDate < todayStr && t.status !== TASK_STATUSES.COMPLETED);

  const totalVisits = filteredVisits.length;
  const totalDemos = filteredKras.filter((k) => k.category === 'Demonstration').length;
  const totalInstallations = filteredKras.filter((k) => k.category === 'Installation').length;
  const openQueries = filteredKras.filter((k) => k.category === 'Query Handling' && k.status !== 'Completed').length;
  const followupsDue = filteredVisits.filter((v) => v.followUpDate === todayStr).length;

  const openLeads = filteredVisits.filter((v) => v.leadStage !== 'Won' && v.leadStage !== 'Lost');
  const pipelineValue = openLeads.reduce((acc, curr) => acc + (curr.leadValue || curr.budget || 0), 0);
  const wonLeads = filteredVisits.filter((v) => v.leadStage === 'Won');
  const lostLeads = filteredVisits.filter((v) => v.leadStage === 'Lost');
  const winRate = filteredVisits.length ? Math.round((wonLeads.length / (wonLeads.length + lostLeads.length || 1)) * 100) : 0;

  // Chart Data Preparation - Lead Stages
  const leadStageCounts = LEAD_STAGES.map((stage) => ({
    stage,
    count: filteredVisits.filter((v) => v.leadStage === stage).length,
    value: filteredVisits.filter((v) => v.leadStage === stage).reduce((a, c) => a + (c.leadValue || c.budget || 0), 0),
  }));

  // Chart Data - Employee Performance
  const empPerformanceData = users
    .filter((u) => u.role === 'Sales Engineer' || u.role === 'Application Engineer')
    .map((emp) => {
      const empV = visits.filter((v) => v.salesEngineerId === emp.id).length;
      const empK = kraActivities.filter((k) => k.appEngineerId === emp.id).length;
      const empT = tasks.filter((t) => t.assignedToId === emp.id && t.status === TASK_STATUSES.COMPLETED).length;
      return {
        name: emp.name.split(' ')[0],
        Visits: empV,
        KRAs: empK,
        TasksDone: empT,
      };
    });

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Manager Overview Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time performance metrics for TMI Sales, Application Engineering & Team KRAs
          </p>
        </div>
        <ExportButton
          filename="Manager_Executive_Summary"
          data={users.map((u) => ({
            Employee: u.name,
            Role: u.role,
            Visits: visits.filter((v) => v.salesEngineerId === u.id).length,
            KRAs: kraActivities.filter((k) => k.appEngineerId === u.id).length,
            TasksAssigned: tasks.filter((t) => t.assignedToId === u.id).length,
          }))}
        />
      </div>

      {/* Top 12 At-A-Glance KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          title="Today's Tasks"
          value={todayTasks.length}
          subtitle="Scheduled for today"
          icon={CheckSquare}
          color="indigo"
        />
        <KpiCard
          title="Completed Tasks"
          value={completedTasks.length}
          subtitle="Closed team tasks"
          icon={CheckCircle}
          color="emerald"
        />
        <KpiCard
          title="Pending Tasks"
          value={pendingTasks.length}
          subtitle="In Progress / Pending"
          icon={Clock}
          color="amber"
        />
        <KpiCard
          title="Overdue Tasks"
          value={overdueTasks.length}
          subtitle="Requires attention"
          icon={AlertTriangle}
          color="rose"
        />

        <KpiCard
          title="Total Visits"
          value={totalVisits}
          subtitle="Customer interactions"
          icon={MapPin}
          color="sky"
        />
        <KpiCard
          title="Total Demos"
          value={totalDemos}
          subtitle="Bench & site demos"
          icon={Layers}
          color="purple"
        />
        <KpiCard
          title="Installations"
          value={totalInstallations}
          subtitle="Commissioned TMI"
          icon={Wrench}
          color="emerald"
        />
        <KpiCard
          title="Open Queries"
          value={openQueries}
          subtitle="Technical support"
          icon={HelpCircle}
          color="amber"
        />

        <KpiCard
          title="Follow-ups Due"
          value={followupsDue}
          subtitle="Scheduled for today"
          icon={Calendar}
          color="indigo"
        />
        <KpiCard
          title="Open Leads"
          value={openLeads.length}
          subtitle="Active pipeline"
          icon={Trophy}
          color="sky"
        />
        <KpiCard
          title="Pipeline Value"
          value={formatCurrency(pipelineValue)}
          subtitle="Total open potential"
          icon={DollarSign}
          color="emerald"
          trend="up"
          trendValue="+12%"
        />
        <KpiCard
          title="Won / Lost"
          value={`${wonLeads.length} / ${lostLeads.length}`}
          subtitle={`Win Rate: ${winRate}%`}
          icon={TrendingUp}
          color="indigo"
        />
      </div>

      {/* Analytics & Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Stage Funnel Bar Chart */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center justify-between">
            <span>Lead Pipeline Funnel & Stage Breakdown</span>
            <span className="text-xs text-slate-400 font-normal">Active Deals</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadStageCounts}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="stage" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(value, name) => [value, name === 'count' ? 'Deals' : 'Value']}
                  contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
                />
                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Employee Performance Chart */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center justify-between">
            <span>Team Activity Comparison (Visits vs KRAs vs Tasks)</span>
            <span className="text-xs text-slate-400 font-normal">By Engineer</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={empPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Visits" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="KRAs" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="TasksDone" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Employee Task Status Table & Clickable Daily Activity Sheet Trigger */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Employee-wise Task Status & Daily Activities</h3>
            <p className="text-xs text-slate-500">
              Click on any employee to view their full daily activity sheet (Visits, Office Work, KRAs & Tasks)
            </p>
          </div>
          <Users className="w-5 h-5 text-brand-600" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Employee Name</th>
                <th className="py-3 px-4">Role & Dept</th>
                <th className="py-3 px-4">Visits</th>
                <th className="py-3 px-4">KRAs Done</th>
                <th className="py-3 px-4">Active Tasks</th>
                <th className="py-3 px-4">Overdue</th>
                <th className="py-3 px-4">Completion %</th>
                <th className="py-3 px-4 text-right">Activity Sheet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((emp) => {
                const empV = visits.filter((v) => v.salesEngineerId === emp.id).length;
                const empK = kraActivities.filter((k) => k.appEngineerId === emp.id).length;
                const empT = tasks.filter((t) => t.assignedToId === emp.id);
                const empDoneT = empT.filter((t) => t.status === TASK_STATUSES.COMPLETED).length;
                const empOverdue = empT.filter((t) => t.dueDate < todayStr && t.status !== TASK_STATUSES.COMPLETED).length;
                const pct = empT.length ? Math.round((empDoneT / empT.length) * 100) : 100;

                return (
                  <tr
                    key={emp.id}
                    onClick={() => setSelectedEmployeeForDrawer(emp)}
                    className="hover:bg-brand-50/50 transition cursor-pointer group"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2.5">
                        <img
                          src={emp.avatar}
                          alt={emp.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                        <span className="font-bold text-slate-900 group-hover:text-brand-600 transition">
                          {emp.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-700">{emp.role}</span>
                      <span className="block text-[10px] text-slate-400">{emp.department}</span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-indigo-600">{empV}</td>
                    <td className="py-3 px-4 font-semibold text-emerald-600">{empK}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{empT.length}</td>
                    <td className="py-3 px-4">
                      {empOverdue > 0 ? (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full font-bold text-[10px]">
                          {empOverdue} Overdue
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${pct === 100 ? 'bg-emerald-500' : 'bg-brand-600'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-700">{pct}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button className="px-3 py-1 bg-slate-100 group-hover:bg-brand-600 group-hover:text-white text-slate-700 text-[11px] font-bold rounded-lg transition flex items-center space-x-1 ml-auto">
                        <span>View Daily Sheet</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side Activity Drawer */}
      <EmployeeActivityDrawer
        employee={selectedEmployeeForDrawer}
        onClose={() => setSelectedEmployeeForDrawer(null)}
      />
    </div>
  );
};
