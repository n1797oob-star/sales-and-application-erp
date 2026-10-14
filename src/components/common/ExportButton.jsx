import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Download, FileSpreadsheet, FileText, Printer } from 'lucide-react';

export const ExportButton = ({ data, filename = 'TMI_Export_Report', columns = [] }) => {
  const [isOpen, setIsOpen] = useState(false);

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
    setIsOpen(false);
  };

  const exportCSV = () => {
    if (!data.length) return;
    const keys = Object.keys(data[0]);
    const csvRows = [];
    csvRows.push(keys.join(','));

    for (const row of data) {
      const values = keys.map((key) => {
        const val = row[key];
        const escaped = ('' + (val ?? '')).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    a.click();
    setIsOpen(false);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`TMI ERP - ${filename.replace(/_/g, ' ')}`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

    if (data.length > 0) {
      const head = columns.length ? [columns.map((c) => c.header)] : [Object.keys(data[0])];
      const body = data.map((item) =>
        columns.length
          ? columns.map((c) => (c.accessor ? item[c.accessor] : ''))
          : Object.values(item)
      );

      doc.autoTable({
        startY: 28,
        head: head,
        body: body,
        theme: 'striped',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [79, 70, 229] },
      });
    }

    doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1.5 transition"
      >
        <Download className="w-4 h-4 text-brand-600" />
        <span>Export Report</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
          <button
            onClick={exportExcel}
            className="w-full text-left px-3 py-2 text-xs flex items-center space-x-2 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel (.xlsx)</span>
          </button>
          <button
            onClick={exportPDF}
            className="w-full text-left px-3 py-2 text-xs flex items-center space-x-2 text-slate-700 hover:bg-rose-50 hover:text-rose-700 transition"
          >
            <FileText className="w-4 h-4 text-rose-600" />
            <span>PDF Summary</span>
          </button>
          <button
            onClick={exportCSV}
            className="w-full text-left px-3 py-2 text-xs flex items-center space-x-2 text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition"
          >
            <Printer className="w-4 h-4 text-sky-600" />
            <span>CSV Export</span>
          </button>
        </div>
      )}
    </div>
  );
};
