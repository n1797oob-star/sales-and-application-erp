import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { isSupabaseConfigured, setSupabaseCredentials, clearSupabaseCredentials } from '../../lib/supabase';
import { Cloud, CheckCircle, AlertTriangle, RefreshCw, Copy, Check, X, Database, ShieldCheck, Key } from 'lucide-react';

import SQL_SCRIPT from '../../../supabase_setup.sql?raw';

export const CloudSetupModal = ({ isOpen, onClose }) => {
  const { cloudSyncStatus, cloudSyncError, lastCloudSyncTime, triggerManualSync } = useAppStore();

  const [url, setUrl] = useState(
    (typeof window !== 'undefined' ? localStorage.getItem('tmi_supabase_url') : '') ||
    import.meta.env.VITE_SUPABASE_URL ||
    ''
  );
  const [anonKey, setAnonKey] = useState(
    (typeof window !== 'undefined' ? localStorage.getItem('tmi_supabase_anon_key') : '') ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    ''
  );

  const [copied, setCopied] = useState(false);
  const [syncing, setSyncing] = useState(false);

  if (!isOpen) return null;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveCredentials = (e) => {
    e.preventDefault();
    if (!url.trim() || !anonKey.trim()) {
      alert('Please enter both Supabase Project URL and Anon API Key.');
      return;
    }
    setSupabaseCredentials(url.trim(), anonKey.trim());
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      await triggerManualSync();
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in zoom-in-95">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-brand-600 text-white">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Cloud Synchronization & Database Settings</h3>
              <p className="text-[11px] text-slate-300">Multi-device sync for Admin, Managers & Application Engineers</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          {/* Status Alert Banner */}
          {cloudSyncStatus === 'connected' && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-800">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold">Cloud Sync is Active</span>
                  <p className="text-[11px] text-emerald-700">
                    KRAs, Visits, Tasks, and Users automatically sync in real-time across all laptops.
                  </p>
                </div>
              </div>
              <button
                onClick={handleSyncNow}
                disabled={syncing}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center space-x-1 shrink-0 ml-2"
              >
                <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
                <span>{syncing ? 'Syncing...' : 'Sync Now'}</span>
              </button>
            </div>
          )}

          {cloudSyncStatus === 'table_missing' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-2.5 text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Database Table Missing in Supabase</span>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Your Supabase project is connected, but the <code>erp_shared_data</code> table has not been created yet. Run the SQL script below once in your Supabase SQL Editor.
                </p>
              </div>
            </div>
          )}

          {cloudSyncStatus === 'error' && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Sync Error:</span>
                <p className="text-[11px] text-rose-700">{cloudSyncError}</p>
              </div>
            </div>
          )}

          {cloudSyncStatus === 'offline' && (
            <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 flex items-start space-x-2">
              <Cloud className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Running in Local Offline Mode</span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Data is only saving to this browser. Connect your Supabase project below so that KRAs and activities sync to managerial and admin accounts across all laptops.
                </p>
              </div>
            </div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleSaveCredentials} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-900 flex items-center space-x-1.5 text-xs">
              <Key className="w-3.5 h-3.5 text-brand-600" />
              <span>Supabase Cloud Connection Credentials</span>
            </h4>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Project URL</label>
              <input
                type="text"
                placeholder="https://xyzcompany.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Anon / Public API Key</label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-brand-500"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={clearSupabaseCredentials}
                className="text-[11px] text-slate-500 hover:text-rose-600 font-semibold"
              >
                Clear / Reset
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg text-xs shadow-sm transition"
              >
                Save & Connect
              </button>
            </div>
          </form>

          {/* SQL Setup Instructions */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 flex items-center space-x-1.5 text-xs">
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                <span>Supabase SQL Setup Script (1-Click Run)</span>
              </h4>
              <button
                type="button"
                onClick={handleCopySql}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 flex items-center space-x-1 transition shadow-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy SQL Script'}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500">
              Paste this in your <strong>Supabase Dashboard → SQL Editor → New Query → Run</strong> to enable real-time sync for all roles.
            </p>

            <pre className="bg-slate-900 text-slate-200 p-2.5 rounded-lg text-[10px] font-mono overflow-x-auto max-h-36">
              {SQL_SCRIPT}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
