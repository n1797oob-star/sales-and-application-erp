import React, { useState } from 'react';
import { Upload, X, FileText, CheckCircle, Trash2 } from 'lucide-react';

export const FileUploadModal = ({ isOpen, onClose, onFilesSelected, existingFiles = [] }) => {
  const [files, setFiles] = useState(existingFiles);
  const [dragActive, setDragActive] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const uploadedFiles = Array.from(e.target.files).map((f) => ({
      name: f.name,
      size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
      type: f.type,
      url: URL.createObjectURL(f),
    }));
    const updated = [...files, ...uploadedFiles];
    setFiles(updated);
  };

  const handleRemove = (index) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
  };

  const handleSave = () => {
    onFilesSelected(files);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200">
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Upload className="w-5 h-5 text-brand-600" />
            <h3 className="text-sm font-bold text-slate-800">Attach Documents / Files</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-200 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Dropzone */}
          <div
            className={`border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer ${
              dragActive ? 'border-brand-500 bg-brand-50' : 'border-slate-300 hover:border-brand-400 bg-slate-50/50'
            }`}
          >
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
              id="file-upload-input"
            />
            <label htmlFor="file-upload-input" className="cursor-pointer block">
              <Upload className="w-8 h-8 text-brand-500 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">Click to upload or drag & drop</p>
              <p className="text-[10px] text-slate-400 mt-1">PDF, DOCX, XLSX, PNG, JPG (Max 25MB each)</p>
            </label>
          </div>

          {/* Uploaded File List */}
          {files.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-700 mb-2">Attached Files ({files.length})</p>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {files.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-slate-100 rounded-lg border border-slate-200 text-xs"
                  >
                    <div className="flex items-center space-x-2 overflow-hidden">
                      <FileText className="w-4 h-4 text-brand-600 shrink-0" />
                      <span className="font-medium text-slate-800 truncate">{file.name}</span>
                      <span className="text-[10px] text-slate-400">({file.size})</span>
                    </div>
                    <button
                      onClick={() => handleRemove(idx)}
                      className="p-1 text-slate-400 hover:text-red-600 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md flex items-center space-x-1"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Confirm Attachments</span>
          </button>
        </div>
      </div>
    </div>
  );
};
