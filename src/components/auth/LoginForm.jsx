import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Lock, Mail, Eye, EyeOff, LogIn, Cloud, CloudOff } from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';
import { CloudSetupModal } from '../common/CloudSetupModal';

export const LoginForm = () => {
  const { login } = useAppStore();
  const [cloudOpen, setCloudOpen] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const res = await login(email.trim(), password.trim());
      if (res && !res.success) {
        setError(res.error || 'Invalid email or password. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />

      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-br from-brand-700 to-indigo-900 text-white p-6 sm:p-8 text-center relative">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-bold text-2xl mx-auto shadow-lg">
            TMI
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mt-3 tracking-tight">TMI Management ERP</h2>
          <p className="text-xs text-brand-200 mt-1">Sales &amp; Application Engineering</p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-brand-500 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-brand-500 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-lg shadow-brand-500/30 transition flex items-center justify-center space-x-2 active-ring"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
            </button>
          </form>

          <p className="text-center text-[11px] text-slate-400 pt-2">
            Contact your administrator if you don't have an account.
          </p>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span
              className={`flex items-center space-x-1 text-[11px] font-semibold ${
                isSupabaseConfigured ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {isSupabaseConfigured ? <Cloud className="w-3.5 h-3.5" /> : <CloudOff className="w-3.5 h-3.5" />}
              <span>{isSupabaseConfigured ? 'Connected to cloud' : 'This PC is not connected to cloud'}</span>
            </span>
            <button
              type="button"
              onClick={() => setCloudOpen(true)}
              className="text-[11px] font-bold text-brand-600 hover:text-brand-800 underline"
            >
              {isSupabaseConfigured ? 'Cloud Settings' : 'Connect to Cloud'}
            </button>
          </div>
        </div>
      </div>
      <CloudSetupModal isOpen={cloudOpen} onClose={() => setCloudOpen(false)} />
    </div>
  );
};
