import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ROLES } from '../../types';
import { AVATAR_PRESETS } from '../../store/seedData';
import {
  Bell,
  Search,
  User,
  Shield,
  Menu,
  LogOut,
  RotateCcw,
  Upload,
  X,
  Camera,
  Lock,
  Sparkles,
  Key,
} from 'lucide-react';

export const Navbar = ({ onToggleSidebar }) => {
  const {
    currentUser,
    notifications,
    markNotificationAsRead,
    clearAllNotifications,
    filters,
    setFilter,
    resetToSeedData,
    logout,
    updateUser,
    changePassword,
    initializeFreshProductionSystem,
  } = useAppStore();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetPasswordInput, setResetPasswordInput] = useState('');
  const [resetError, setResetError] = useState('');

  // Avatar Modal State
  const [selectedGender, setSelectedGender] = useState(currentUser?.gender || 'Male');
  const [selectedAvatar, setSelectedAvatar] = useState(currentUser?.avatar || AVATAR_PRESETS.Male[0]);

  // Password Modal State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const userNotifications = notifications.filter(
    (n) => n.targetUserId === currentUser?.id || currentUser?.role === ROLES.ADMIN || currentUser?.role === ROLES.MANAGER
  );
  const unreadCount = userNotifications.filter((n) => !n.read).length;

  const handleCustomFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAvatar = () => {
    if (currentUser) {
      updateUser(currentUser.id, {
        avatar: selectedAvatar,
        gender: selectedGender,
      });
    }
    setIsAvatarModalOpen(false);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    const res = changePassword(currentUser.id, oldPassword, newPassword);
    if (!res.success) {
      setPasswordError(res.error);
    } else {
      setPasswordSuccess('Password successfully updated!');
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordSuccess('');
      }, 1500);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 md:hidden focus:outline-none"
              aria-label="Toggle Navigation"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
                TMI
              </div>
              <div className="hidden sm:block">
                <span className="text-lg font-bold text-slate-900 tracking-tight block leading-tight">
                  TMI Management ERP
                </span>
                <span className="text-xs text-brand-600 font-semibold tracking-wider uppercase block">
                  Sales & App Engineering
                </span>
              </div>
            </div>
          </div>

          {/* Middle: Global Search */}
          <div className="flex-1 max-w-xs md:max-w-md mx-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={filters.searchQuery || ''}
                onChange={(e) => setFilter('searchQuery', e.target.value)}
                placeholder="Search leads, customers, products, tasks..."
                className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm bg-slate-100 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-brand-500 rounded-lg outline-none transition"
              />
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Logged in User Role Badge */}
            <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-xs font-semibold text-brand-700">
              <Shield className="w-3.5 h-3.5 text-brand-600" />
              <span>Role: <strong>{currentUser?.role}</strong></span>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 relative focus:outline-none"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bell className="w-4 h-4 text-brand-600" />
                      <h4 className="text-xs font-bold text-slate-800">Notifications</h4>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={clearAllNotifications}
                        className="text-[11px] text-brand-600 font-medium hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {userNotifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">No notifications</div>
                    ) : (
                      userNotifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => markNotificationAsRead(notif.id)}
                          className={`p-3 text-xs transition cursor-pointer hover:bg-slate-50 ${
                            !notif.read ? 'bg-brand-50/40 font-medium' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <span className="text-slate-900 font-semibold">{notif.title}</span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-slate-600 mt-0.5 text-[11px] line-clamp-2">{notif.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile & User Menu */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="hidden sm:flex items-center space-x-2 pl-2 border-l border-slate-200 hover:opacity-80 transition focus:outline-none"
              >
                <img
                  src={currentUser?.avatar}
                  alt={currentUser?.name}
                  className="w-8 h-8 rounded-full border border-slate-300 object-cover"
                />
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-800 line-clamp-1">{currentUser?.name}</div>
                  <div className="text-[10px] text-slate-500 line-clamp-1">{currentUser?.department}</div>
                </div>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{currentUser?.name}</p>
                    <p className="text-[10px] text-slate-500">{currentUser?.email}</p>
                  </div>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setSelectedGender(currentUser?.gender || 'Male');
                      setSelectedAvatar(currentUser?.avatar || AVATAR_PRESETS.Male[0]);
                      setIsAvatarModalOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 text-xs flex items-center space-x-2 text-slate-700 hover:bg-slate-50 font-semibold transition"
                  >
                    <Camera className="w-4 h-4 text-brand-600" />
                    <span>Change Profile Photo</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setIsPasswordModalOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 text-xs flex items-center space-x-2 text-slate-700 hover:bg-slate-50 font-semibold transition"
                  >
                    <Key className="w-4 h-4 text-indigo-600" />
                    <span>Change Password</span>
                  </button>

                  {currentUser?.role === ROLES.ADMIN && (
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setResetPasswordInput('');
                        setResetError('');
                        setIsResetModalOpen(true);
                      }}
                      className="w-full text-left px-3 py-2 text-xs flex items-center space-x-2 text-emerald-700 hover:bg-emerald-50 font-semibold transition border-t border-slate-100"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>Start Fresh Production ERP</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 text-xs flex items-center space-x-2 text-rose-600 hover:bg-rose-50 font-semibold transition border-t border-slate-100"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Sign out */}
            <button
              onClick={logout}
              className="sm:hidden p-2 text-slate-500 hover:text-rose-600"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Change Profile Photo Modal */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Change Profile Photo</h3>
              <button onClick={() => setIsAvatarModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex justify-center my-2">
              <img
                src={selectedAvatar}
                alt="Selected Avatar"
                className="w-20 h-20 rounded-full border-4 border-brand-500 shadow-md object-cover"
              />
            </div>

            <div className="flex items-center justify-center space-x-4 text-xs">
              <span className="font-bold text-slate-600">Gender:</span>
              <label className="flex items-center space-x-1 font-semibold cursor-pointer">
                <input
                  type="radio"
                  name="myGender"
                  value="Male"
                  checked={selectedGender === 'Male'}
                  onChange={() => {
                    setSelectedGender('Male');
                    setSelectedAvatar(AVATAR_PRESETS.Male[0]);
                  }}
                />
                <span>Male Standard</span>
              </label>
              <label className="flex items-center space-x-1 font-semibold cursor-pointer">
                <input
                  type="radio"
                  name="myGender"
                  value="Female"
                  checked={selectedGender === 'Female'}
                  onChange={() => {
                    setSelectedGender('Female');
                    setSelectedAvatar(AVATAR_PRESETS.Female[0]);
                  }}
                />
                <span>Female Standard</span>
              </label>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {(AVATAR_PRESETS[selectedGender] || AVATAR_PRESETS.Male).map((imgUrl, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedAvatar(imgUrl)}
                  className={`p-1 rounded-xl border-2 cursor-pointer transition ${
                    selectedAvatar === imgUrl ? 'border-brand-600 bg-brand-50' : 'border-transparent hover:border-slate-200'
                  }`}
                >
                  <img src={imgUrl} alt={`Preset ${idx}`} className="w-12 h-12 rounded-full object-cover" />
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Custom image file:</span>
              <label className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer flex items-center space-x-1">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload</span>
                <input type="file" accept="image/*" onChange={handleCustomFileUpload} className="hidden" />
              </label>
            </div>

            <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
              <button
                onClick={() => setIsAvatarModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAvatar}
                className="px-4 py-1.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md"
              >
                Save Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                <Key className="w-4 h-4 text-brand-600" />
                <span>Change Account Password</span>
              </h3>
              <button onClick={() => setIsPasswordModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {passwordError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold text-center">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-semibold text-center">
                {passwordSuccess}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border rounded-xl outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border rounded-xl outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border rounded-xl outline-none focus:bg-white"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Secure System Reset Modal - Requires Admin Password */}
      {isResetModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-red-700">⚠️ Start Fresh Production ERP</h3>
              <button onClick={() => setIsResetModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-1">
              <p className="font-bold">This action will permanently delete:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>All visits, office work, KRA activities</li>
                <li>All tasks and notifications</li>
                <li>All customers and products</li>
                <li>All users except the Primary Admin</li>
              </ul>
              <p className="font-bold mt-2">This cannot be undone.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Enter your Admin password to confirm:</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  placeholder="Enter your current password"
                  value={resetPasswordInput}
                  onChange={(e) => { setResetPasswordInput(e.target.value); setResetError(''); }}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-red-500 outline-none transition"
                />
              </div>
              {resetError && (
                <p className="text-xs text-red-600 font-semibold mt-1">{resetError}</p>
              )}
            </div>

            <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100">
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!resetPasswordInput.trim()) {
                    setResetError('Password is required.');
                    return;
                  }
                  if (resetPasswordInput !== currentUser?.password) {
                    setResetError('Incorrect password. Please try again.');
                    return;
                  }
                  initializeFreshProductionSystem();
                  setIsResetModalOpen(false);
                  setResetPasswordInput('');
                  setResetError('');
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md"
              >
                Confirm & Reset System
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
