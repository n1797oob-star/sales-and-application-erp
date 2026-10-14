import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { filterVisits, filterOfficeWorks, filterOrders } from '../../utils/filterUtils';
import { formatDate, formatCurrency } from '../../types';
import { FilterBar } from '../common/FilterBar';
import { ExportButton } from '../common/ExportButton';
import { PoBookingForm } from './PoBookingForm';
import {
  MapPin,
  Briefcase,
  Plus,
  FileText,
  Calendar,
  User,
  Tag,
  Eye,
  ChevronRight,
  ShoppingBag,
  Paperclip,
  CheckCircle,
  Clock,
} from 'lucide-react';

export const SalesActivityList = ({
  onOpenVisitModal,
  onOpenOfficeModal,
  onOpenPoModal = null,
  initialSubTab = 'visits',
}) => {
  const { visits, officeWorks, orders, customers, products, users, filters, currentUser, activeTab } = useAppStore();

  const [activeSubTab, setActiveSubTab] = useState(
    activeTab === 'orders' ? 'orders' : initialSubTab || 'visits'
  );
  const [selectedItem, setSelectedItem] = useState(null);
  const [isInternalPoOpen, setIsInternalPoOpen] = useState(false);

  useEffect(() => {
    if (activeTab === 'orders') {
      setActiveSubTab('orders');
    }
  }, [activeTab]);

  const filteredV = filterVisits(visits, filters, currentUser, customers, products, users);
  const filteredO = filterOfficeWorks(officeWorks, filters, currentUser, customers, users);
  const filteredP = filterOrders(orders || [], filters, currentUser, customers, products, users);

  const handleOpenPo = () => {
    if (onOpenPoModal) {
      onOpenPoModal();
    } else {
      setIsInternalPoOpen(true);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Header & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Sales Activity, Visits & PO Bookings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Customer visits, office work, and purchase order bookings received today
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={onOpenVisitModal}
            className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-1.5 active-ring"
          >
            <Plus className="w-4 h-4" />
            <span>+ Visit Report</span>
          </button>

          <button
            onClick={onOpenOfficeModal}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-1.5 active-ring"
          >
            <Briefcase className="w-4 h-4" />
            <span>+ Office Work</span>
          </button>

          <button
            onClick={handleOpenPo}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-1.5 active-ring"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>+ PO Booking</span>
          </button>
        </div>
      </div>

      {/* Filter Component */}
      <FilterBar />

      {/* Tab Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 bg-white px-3 pt-2 rounded-xl border gap-2">
        <div className="flex space-x-4 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('visits')}
            className={`py-2 text-xs font-bold border-b-2 flex items-center space-x-1.5 transition whitespace-nowrap ${
              activeSubTab === 'visits'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Visit Reports ({filteredV.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('office')}
            className={`py-2 text-xs font-bold border-b-2 flex items-center space-x-1.5 transition whitespace-nowrap ${
              activeSubTab === 'office'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Office Work ({filteredO.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('orders')}
            className={`py-2 text-xs font-bold border-b-2 flex items-center space-x-1.5 transition whitespace-nowrap ${
              activeSubTab === 'orders'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>PO Order Bookings ({filteredP.length})</span>
          </button>
        </div>

        <div className="pb-2">
          <ExportButton
            filename={
              activeSubTab === 'visits'
                ? 'TMI_Visit_Reports'
                : activeSubTab === 'office'
                ? 'TMI_Office_Work'
                : 'TMI_PO_Order_Bookings'
            }
            data={
              activeSubTab === 'visits'
                ? filteredV.map((v) => ({
                    Date: v.date,
                    Engineer: users.find((u) => u.id === v.salesEngineerId)?.name,
                    Customer: customers.find((c) => c.id === v.customerId)?.name,
                    Contact: v.contactName,
                    Equipment: products.find((p) => p.id === v.productId)?.modelNumber,
                    LeadStage: v.leadStage,
                    Value: v.leadValue || v.budget,
                  }))
                : activeSubTab === 'office'
                ? filteredO.map((o) => ({
                    Date: o.date,
                    Engineer: users.find((u) => u.id === o.salesEngineerId)?.name,
                    Type: o.type,
                    Title: o.title,
                    Hours: o.durationHours,
                  }))
                : filteredP.map((p) => ({
                    PONumber: p.poNumber,
                    Date: p.poDate,
                    Engineer: users.find((u) => u.id === p.salesEngineerId)?.name,
                    Customer: customers.find((c) => c.id === p.customerId)?.name,
                    Contact: p.contactPerson,
                    Product: products.find((pr) => pr.id === p.productId)?.modelNumber,
                    OrderValue: p.orderValue,
                    DeliveryDate: p.deliveryDate,
                    Status: p.status,
                  }))
            }
          />
        </div>
      </div>

      {/* Content List View */}
      {activeSubTab === 'visits' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer & Contact</th>
                  <th className="py-3 px-4">TMI Product / Application</th>
                  <th className="py-3 px-4">Sales Engineer</th>
                  <th className="py-3 px-4">Lead Stage</th>
                  <th className="py-3 px-4">Est. Value</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredV.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No visit reports match current filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredV.map((v) => {
                    const cust = customers.find((c) => c.id === v.customerId);
                    const prod = products.find((p) => p.id === v.productId);
                    const eng = users.find((u) => u.id === v.salesEngineerId);

                    return (
                      <tr
                        key={v.id}
                        onClick={() => setSelectedItem({ type: 'visit', data: v })}
                        className="hover:bg-slate-50 transition cursor-pointer"
                      >
                        <td className="py-3 px-4 font-semibold text-slate-700 whitespace-nowrap">
                          {formatDate(v.date)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{cust?.name}</span>
                          <span className="text-[11px] text-slate-500">Contact: {v.contactName}</span>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <span className="font-bold text-brand-600 block">{prod?.modelNumber}</span>
                          <span className="text-[11px] text-slate-600 line-clamp-1">{v.application}</span>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700">{eng?.name || 'Engineer'}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              v.leadStage === 'Won'
                                ? 'bg-emerald-100 text-emerald-800'
                                : v.leadStage === 'Lost'
                                ? 'bg-rose-100 text-rose-800'
                                : v.leadStage === 'Demo Needed'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {v.leadStage}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                          {formatCurrency(v.leadValue || v.budget)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="p-1 rounded-md text-slate-400 hover:text-slate-600">
                            <ChevronRight className="w-4 h-4 inline" />
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'office' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Work Category</th>
                  <th className="py-3 px-4">Task Title & Notes</th>
                  <th className="py-3 px-4">Sales Engineer</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Related Customer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredO.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No office work entries match current filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredO.map((w) => {
                    const cust = customers.find((c) => c.id === w.customerId);
                    const eng = users.find((u) => u.id === w.salesEngineerId);

                    return (
                      <tr key={w.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 font-semibold text-slate-700 whitespace-nowrap">
                          {formatDate(w.date)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px]">
                            {w.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-sm">
                          <span className="font-bold text-slate-900 block">{w.title}</span>
                          <span className="text-[11px] text-slate-500 line-clamp-2">{w.notes}</span>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700">{eng?.name}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{w.durationHours} hrs</td>
                        <td className="py-3 px-4 text-slate-600 font-medium">{cust?.name || 'Internal'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PO Order Bookings Tab */}
      {activeSubTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">PO Reference</th>
                  <th className="py-3 px-4">PO Date</th>
                  <th className="py-3 px-4">Customer Organization</th>
                  <th className="py-3 px-4">TMI Equipment / Model</th>
                  <th className="py-3 px-4">Sales Engineer</th>
                  <th className="py-3 px-4">Order Value (₹)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredP.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No purchase orders recorded yet. Click <strong>+ PO Booking</strong> to record an order!
                    </td>
                  </tr>
                ) : (
                  filteredP.map((o) => {
                    const cust = customers.find((c) => c.id === o.customerId);
                    const prod = products.find((p) => p.id === o.productId);
                    const eng = users.find((u) => u.id === o.salesEngineerId);

                    return (
                      <tr
                        key={o.id}
                        onClick={() => setSelectedItem({ type: 'order', data: o })}
                        className="hover:bg-slate-50 transition cursor-pointer"
                      >
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block font-mono">{o.poNumber}</span>
                          {o.attachments?.length > 0 && (
                            <span className="text-[10px] text-brand-600 flex items-center space-x-1 mt-0.5">
                              <Paperclip className="w-3 h-3" />
                              <span>{o.attachments.length} attachment(s)</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-700 whitespace-nowrap">
                          {formatDate(o.poDate)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{cust?.name}</span>
                          <span className="text-[11px] text-slate-500">Contact: {o.contactPerson || '-'}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-emerald-700 block">{prod?.modelNumber}</span>
                          <span className="text-[11px] text-slate-500 line-clamp-1">{prod?.name}</span>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700">{eng?.name || 'Engineer'}</td>
                        <td className="py-3 px-4 font-bold text-emerald-700 whitespace-nowrap">
                          {formatCurrency(o.orderValue)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                            {o.status || 'PO Received'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="p-1 rounded-md text-slate-400 hover:text-slate-600">
                            <ChevronRight className="w-4 h-4 inline" />
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {selectedItem.type === 'visit'
                  ? 'Visit Report Details'
                  : selectedItem.type === 'order'
                  ? `Purchase Order: ${selectedItem.data.poNumber}`
                  : 'Office Work Details'}
              </h3>
              <button onClick={() => setSelectedItem(null)} className="p-1 text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            {selectedItem.type === 'order' ? (
              <div className="text-xs space-y-2.5">
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Customer:</span>
                    <strong className="text-slate-900">
                      {customers.find((c) => c.id === selectedItem.data.customerId)?.name}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Order Amount:</span>
                    <strong className="text-emerald-700 text-sm">
                      {formatCurrency(selectedItem.data.orderValue)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Product / Model:</span>
                    <strong className="text-slate-900">
                      {products.find((p) => p.id === selectedItem.data.productId)?.modelNumber}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Delivery Date:</span>
                    <strong className="text-slate-900">
                      {formatDate(selectedItem.data.deliveryDate) || 'Not specified'}
                    </strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 text-[10px] block">Payment Terms:</span>
                    <span className="font-semibold text-slate-800">{selectedItem.data.paymentTerms}</span>
                  </div>
                </div>

                {selectedItem.data.scopeOfSupply && (
                  <div>
                    <span className="font-bold text-slate-500 block mb-1">Scope of Supply / Remarks:</span>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-700">
                      {selectedItem.data.scopeOfSupply}
                    </div>
                  </div>
                )}

                {selectedItem.data.attachments?.length > 0 && (
                  <div>
                    <span className="font-bold text-slate-500 block mb-1">Attached Documents:</span>
                    <div className="space-y-1">
                      {selectedItem.data.attachments.map((att, idx) => (
                        <div key={idx} className="p-2 bg-slate-100 rounded-lg flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-800">{att.name}</span>
                          <span className="text-slate-500">{att.size}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs space-y-2">
                <p>
                  <span className="font-bold text-slate-500">Discussion Notes:</span>
                </p>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700">
                  {selectedItem.data.discussion}
                </div>

                {selectedItem.data.nextAction && (
                  <p className="mt-2">
                    <span className="font-bold text-slate-500">Next Action: </span>
                    <span className="text-brand-600 font-semibold">{selectedItem.data.nextAction}</span>
                  </p>
                )}
              </div>
            )}

            <div className="pt-2 flex justify-end border-t border-slate-100">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Internal PO Booking Modal */}
      <PoBookingForm isOpen={isInternalPoOpen} onClose={() => setIsInternalPoOpen(false)} />
    </div>
  );
};
