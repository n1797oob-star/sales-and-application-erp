import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ROLES, formatDate, formatCurrency } from '../../types';
import { FilterBar } from '../common/FilterBar';
import { ExportButton } from '../common/ExportButton';
import { FileBarChart, Download, FileSpreadsheet, FileText, Printer, CheckCircle, Shield } from 'lucide-react';

export const ReportsCenter = () => {
  const { visits, officeWorks, kraActivities, tasks, orders, users, customers, products, filters, activityLogs, currentUser } = useAppStore();
  const [reportType, setReportType] = useState('executive'); // 'executive' | 'visits' | 'kras' | 'orders' | 'audit'

  const isAdmin = currentUser?.role === ROLES.ADMIN;

  // Generate dataset based on report selection
  const getReportData = () => {
    if (reportType === 'executive') {
      return users.map((u) => {
        const vCount = visits.filter((v) => v.salesEngineerId === u.id).length;
        const oCount = officeWorks.filter((w) => w.salesEngineerId === u.id).length;
        const kCount = kraActivities.filter((k) => k.appEngineerId === u.id).length;
        const pCount = (orders || []).filter((o) => o.salesEngineerId === u.id).length;
        const tCount = tasks.filter((t) => t.assignedToId === u.id && t.status === 'Completed').length;
        return {
          'Employee Name': u.name,
          Role: u.role,
          Department: u.department,
          'Total Visits': vCount,
          'Office Work Entries': oCount,
          'KRAs Completed': kCount,
          'POs Booked': pCount,
          'Tasks Closed': tCount,
        };
      });
    }

    if (reportType === 'visits') {
      return visits.map((v) => {
        const cust = customers.find((c) => c.id === v.customerId);
        const prod = products.find((p) => p.id === v.productId);
        const eng = users.find((u) => u.id === v.salesEngineerId);
        return {
          Date: formatDate(v.date),
          Customer: cust?.name || '',
          Contact: v.contactName,
          Equipment: prod?.modelNumber || '',
          Application: v.application,
          'Sales Engineer': eng?.name || '',
          'Lead Stage': v.leadStage,
          'Estimated Value': formatCurrency(v.leadValue || v.budget),
        };
      });
    }

    if (reportType === 'kras') {
      return kraActivities.map((k) => {
        const cust = customers.find((c) => c.id === k.customerId);
        const prod = products.find((p) => p.id === k.productId);
        const ae = users.find((u) => u.id === k.appEngineerId);
        return {
          Date: formatDate(k.date),
          Category: k.category,
          Customer: cust?.name || '',
          Equipment: prod?.modelNumber || '',
          'App Engineer': ae?.name || '',
          Status: k.status,
          Outcome: k.result,
        };
      });
    }

    if (reportType === 'orders') {
      return (orders || []).map((o) => {
        const cust = customers.find((c) => c.id === o.customerId);
        const prod = products.find((p) => p.id === o.productId);
        const eng = users.find((u) => u.id === o.salesEngineerId);
        return {
          'PO Number': o.poNumber,
          Date: formatDate(o.poDate),
          Customer: cust?.name || '',
          Contact: o.contactPerson || '',
          'Product / Model': prod?.modelNumber || '',
          'Sales Engineer': eng?.name || '',
          'Order Value': formatCurrency(o.orderValue),
          'Delivery Date': formatDate(o.deliveryDate),
          'Payment Terms': o.paymentTerms || '',
          Status: o.status,
        };
      });
    }

    // Audit logs (Admin only)
    if (isAdmin && reportType === 'audit') {
      return activityLogs.map((l) => ({
        Timestamp: new Date(l.timestamp).toLocaleString(),
        User: l.userName,
        Role: l.userRole,
        Action: l.action,
        Entity: l.entityType,
        Details: l.details,
      }));
    }

    return [];
  };

  const reportData = getReportData();

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Reports & Analytical Exports Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Download formatted Excel (.xlsx), PDF executive summaries, and CSV data reports
          </p>
        </div>

        <ExportButton
          filename={`TMI_${reportType.toUpperCase()}_Report`}
          data={reportData}
        />
      </div>

      {/* Global Filter Bar */}
      <FilterBar />

      {/* Report Selector Pills */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-2">
        <button
          onClick={() => setReportType('executive')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition ${
            reportType === 'executive'
              ? 'bg-brand-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Executive Performance Report
        </button>

        <button
          onClick={() => setReportType('visits')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition ${
            reportType === 'visits'
              ? 'bg-brand-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          CRM Visit & Lead History
        </button>

        <button
          onClick={() => setReportType('kras')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition ${
            reportType === 'kras'
              ? 'bg-brand-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          App Engineering KRA Report
        </button>

        <button
          onClick={() => setReportType('orders')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition ${
            reportType === 'orders'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          PO Order Bookings Report
        </button>

        {/* System Audit Log Tab - Restricted Exclusively to Admin */}
        {isAdmin && (
          <button
            onClick={() => setReportType('audit')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
              reportType === 'audit'
                ? 'bg-indigo-700 text-white shadow-md'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>System Audit Log (Admin Only)</span>
          </button>
        )}
      </div>

      {/* Report Preview Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase text-slate-700 tracking-wider">
            Report Data Preview ({reportData.length} Records)
          </h3>
        </div>

        <div className="overflow-x-auto max-h-[500px]">
          {reportData.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No data found for this report preview.</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 sticky top-0 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  {Object.keys(reportData[0]).map((col) => (
                    <th key={col} className="py-2.5 px-4">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    {Object.values(row).map((val, cIdx) => (
                      <td key={cIdx} className="py-2.5 px-4 font-medium text-slate-800">
                        {'' + (val ?? '-')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
