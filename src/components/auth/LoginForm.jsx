import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Lock, Mail, Eye, EyeOff, LogIn, UserPlus, User } from 'lucide-react';

export const LoginForm = () => {
  // Single consolidated hook call
  const { login, addUser } = useAppStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // ---------- Sign In ----------
  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const res = await login(email.trim(), password.trim());
      if (!res.success) setError(res.error || 'Login failed. Check your credentials.');
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // ---------- Register ----------
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.trim().length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await addUser({
        email: email.trim(),
        password: password.trim(),
        name: name.trim() || email.split('@')[0],
        role: 'SALES_ENGINEER',
      });
      setSuccessMsg('Account created! Check your email to confirm, then sign in.');
      setShowRegister(false);
      setPassword('');
      setName('');
    } catch (err) {
      setError(err.message || 'Registration failed. This email may already be registered.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />

      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 z-10">
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
          {/* Mode Toggle */}
          <div className="flex rounded-xl overflow-hidden border border-slate-200">
            <button
              onClick={() => { setShowRegister(false); setError(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 text-xs font-bold transition ${!showRegister ? 'bg-brand-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setShowRegister(true); setError(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 text-xs font-bold transition ${showRegister ? 'bg-brand-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
            >
              Register
            </button>
          </div>

          {/* Error / Success Messages */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold text-center">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-semibold text-center">
              {successMsg}
            </div>
          )}

          <form onSubmit={showRegister ? handleRegister : handleSignIn} className="space-y-4">
            {/* Name field – register only */}
            {showRegister && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-brand-500 outline-none transition"
                  />
                </div>
              </div>
            )}

            {/* Email */}
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

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder={showRegister ? 'Min 6 characters' : 'Enter your password'}
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
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-lg shadow-brand-500/30 transition flex items-center justify-center space-x-2"
            >
              {showRegister ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              <span>{loading ? 'Please wait...' : showRegister ? 'Create Account' : 'Sign In'}</span>
            </button>
          </form>

          <p className="text-center text-[11px] text-slate-400 pt-1">
            {showRegister
              ? 'After registering, check your email to confirm your account before signing in.'
              : 'Contact your administrator if you need an account.'}
          </p>
        </div>
      </div>
    </div>
  );
};
