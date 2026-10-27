import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, FileSpreadsheet, FileText, Printer } from 'lucide-react';

export const ExportButton = ({ data = [], filename = 'TMI_Export_Report', columns = [] }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Sanitizes text values for standard PDF winansi encoding (replaces rupee symbol, handles null/objects)
  const cleanForPdf = (val) => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') return JSON.stringify(val);
    // Convert Indian Rupee symbol (₹) to 'Rs. ' so standard PDF fonts render cleanly without errors
    return String(val).replace(/₹/g, 'Rs. ');
  };

  const exportExcel = () => {
    try {
      if (!data || !data.length) {
        alert('No data records available to export under current filters.');
        return;
      }
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Report');
      XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
      setIsOpen(false);
    } catch (err) {
      console.error('Excel export error:', err);
      alert('Failed to export Excel file: ' + (err.message || err));
    }
  };

  const exportCSV = () => {
    try {
      if (!data || !data.length) {
        alert('No data records available to export under current filters.');
        return;
      }
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

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('href', url);
      a.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
      a.click();
      window.URL.revokeObjectURL(url);
      setIsOpen(false);
    } catch (err) {
      console.error('CSV export error:', err);
      alert('Failed to export CSV file: ' + (err.message || err));
    }
  };

  const exportPDF = () => {
    try {
      if (!data || !data.length) {
        alert('No data records available to export under current filters.');
        return;
      }

      const head = columns.length ? [columns.map((c) => c.header)] : [Object.keys(data[0])];
      const body = data.map((item) =>
        columns.length
          ? columns.map((c) => (c.accessor ? item[c.accessor] : ''))
          : Object.values(item)
      );

      const cleanHead = head.map((row) => row.map(cleanForPdf));
      const cleanBody = body.map((row) => row.map(cleanForPdf));

      // Choose landscape if table has more than 5 columns for clean readable layout
      const colCount = cleanHead[0]?.length || 0;
      const orientation = colCount > 5 ? 'landscape' : 'portrait';

      const doc = new jsPDF({
        orientation,
        unit: 'mm',
        format: 'a4',
      });

      doc.setFontSize(14);
      doc.text(`TMI ERP - ${filename.replace(/_/g, ' ')}`, 14, 15);
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleString()} • Total Records: ${data.length}`, 14, 21);

      // Support direct function call or instance method
      const autoTableFn = (typeof autoTable === 'function' ? autoTable : autoTable?.default) || doc.autoTable;

      if (typeof autoTableFn === 'function') {
        autoTableFn(doc, {
          startY: 26,
          head: cleanHead,
          body: cleanBody,
          theme: 'striped',
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [248, 250, 252] },
        });
      } else if (typeof doc.autoTable === 'function') {
        doc.autoTable({
          startY: 26,
          head: cleanHead,
          body: cleanBody,
          theme: 'striped',
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [248, 250, 252] },
        });
      } else {
        throw new Error('PDF Table formatting engine could not be attached.');
      }

      doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
      setIsOpen(false);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Failed to generate PDF: ' + (err.message || err));
    }
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
