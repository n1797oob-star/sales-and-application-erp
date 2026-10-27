import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ROLES } from '../../types';
import { AVATAR_PRESETS } from '../../store/seedData';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Shield,
  Image,
  Upload,
  CheckCircle,
  X,
  UserCheck,
  Sparkles,
  RotateCcw,
  Lock,
  RefreshCw,
} from 'lucide-react';

export const UserManagement = () => {
  const {
    users,
    addUser,
    updateUser,
    deleteUser,
    currentUser,
    initializeFreshProductionSystem,
    resetToSeedData,
    verifyAdminPassword,
  } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetPasswordInput, setResetPasswordInput] = useState('');
  const [resetError, setResetError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: 'password123',
    gender: 'Male',
    role: ROLES.SALES_ENGINEER,
    avatar: AVATAR_PRESETS.Male[0],
    phone: '',
    department: 'Sales & App Engineering',
    territory: 'Pan-India',
    status: 'Active',
  });

  const filteredUsers = (users || []).filter((u) => {
    if (!u) return false;
    const q = String(searchTerm || '').toLowerCase().trim();
    if (!q) return true;
    const name = String(u.name || '').toLowerCase();
    const email = String(u.email || '').toLowerCase();
    const role = String(u.role || '').toLowerCase();
    const dept = String(u.department || '').toLowerCase();
    return name.includes(q) || email.includes(q) || role.includes(q) || dept.includes(q);
  });

  const handleGenderChange = (newGender) => {
    const defaultAvatar = AVATAR_PRESETS[newGender] ? AVATAR_PRESETS[newGender][0] : AVATAR_PRESETS.Male[0];
    setFormData((prev) => ({
      ...prev,
      gender: newGender,
      avatar: defaultAvatar,
    }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.email?.trim()) {
      alert('Please fill in name and email address.');
      return;
    }
    if (formData.password && formData.password.trim().length < 6) {
      alert('Password must be at least 6 characters long for Supabase Authentication.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await addUser(formData);
      alert(`User "${formData.name}" successfully added and created!`);
      setSearchTerm('');
      setIsAddModalOpen(false);
      resetForm();
    } catch (err) {
      alert('Error creating user: ' + (err.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingUser) return;
    updateUser(editingUser.id, formData);
    setEditingUser(null);
    resetForm();
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);
    try {
      const res = await deleteUser(deletingUser.id);
      if (res && res.error) {
        alert(res.error);
      }
      setDeletingUser(null);
    } catch (err) {
      alert('Error deleting user: ' + (err.message || err));
    } finally {
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: 'password123',
      gender: 'Male',
      role: ROLES.SALES_ENGINEER,
      avatar: AVATAR_PRESETS.Male[0],
      phone: '',
      department: 'Sales & App Engineering',
      territory: 'Pan-India',
      status: 'Active',
    });
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: user.password || 'password123',
      gender: user.gender || 'Male',
      role: user.role,
      avatar: user.avatar || AVATAR_PRESETS.Male[0],
      phone: user.phone || '',
      department: user.department || '',
      territory: user.territory || '',
      status: user.status || 'Active',
    });
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Shield className="w-6 h-6 text-brand-600" />
            <span>Admin User Management & Profile Photos</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage employees, male & female standard avatar photos, role permissions, and active accounts
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => {
              if (window.confirm('Restore system to default sample demo data? This will restore sample visits, KRAs, tasks, and users.')) {
                resetToSeedData();
              }
            }}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition flex items-center space-x-1.5"
            title="Restore sample demonstration dataset"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
            <span>Restore Demo Data</span>
          </button>

          <button
            onClick={() => {
              setResetPasswordInput('');
              setResetError('');
              setIsResetModalOpen(true);
            }}
            className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl border border-red-200 transition flex items-center space-x-1.5"
            title="Start Fresh Production ERP - Clears all demo records"
          >
            <Sparkles className="w-3.5 h-3.5 text-red-600" />
            <span>Start Fresh Production ERP</span>
          </button>

          <button
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-1.5 active-ring"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New User</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-2">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search users by name, email, role or department..."
          className="w-full text-xs outline-none bg-transparent"
        />
      </div>

      {/* Users Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Profile Photo & Name</th>
                <th className="py-3 px-4">Email Address</th>
                <th className="py-3 px-4">Gender</th>
                <th className="py-3 px-4">Role Permission</th>
                <th className="py-3 px-4">Department & Territory</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-brand-500 shadow-sm shrink-0"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block">{u.name}</span>
                        {currentUser?.id === u.id && (
                          <span className="text-[10px] text-brand-600 font-semibold">(Your Account)</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-700">{u.email}</td>
                  <td className="py-3 px-4 font-semibold text-slate-600">{u.gender || 'Male'}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        u.role === ROLES.ADMIN
                          ? 'bg-indigo-100 text-indigo-800'
                          : u.role === ROLES.MANAGER
                          ? 'bg-emerald-100 text-emerald-800'
                          : u.role === ROLES.SALES_ENGINEER
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-slate-800 block">{u.department}</span>
                    <span className="text-[10px] text-slate-400">{u.territory}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{u.phone || '-'}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.status === 'Inactive' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {u.status || 'Active'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => openEdit(u)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-brand-50 text-slate-600 hover:text-brand-600 transition"
                        title="Edit User & Change Photo"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {currentUser?.id !== u.id && (
                        <button
                          onClick={() => setDeletingUser(u)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {(isAddModalOpen || editingUser) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 my-6">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">{editingUser ? `Edit User: ${editingUser.name}` : 'Add New System User'}</h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingUser(null);
                }}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingUser ? handleEditSubmit : handleAddSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Profile Photo Selector Section */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                    <Image className="w-4 h-4 text-brand-600" />
                    <span>Select Standard Profile Photo</span>
                  </label>
                  <img
                    src={formData.avatar}
                    alt="Selected Preview"
                    className="w-10 h-10 rounded-full border-2 border-brand-600 object-cover shadow-sm"
                  />
                </div>

                {/* Male vs Female Presets */}
                <div>
                  <div className="flex items-center space-x-3 mb-2 text-xs">
                    <span className="font-bold text-slate-600">Gender:</span>
                    <label className="flex items-center space-x-1 font-semibold cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value="Male"
                        checked={formData.gender === 'Male'}
                        onChange={() => handleGenderChange('Male')}
                        className="text-brand-600"
                      />
                      <span>Male</span>
                    </label>
                    <label className="flex items-center space-x-1 font-semibold cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value="Female"
                        checked={formData.gender === 'Female'}
                        onChange={() => handleGenderChange('Female')}
                        className="text-brand-600"
                      />
                      <span>Female</span>
                    </label>
                  </div>

                  {/* Avatar Preset Grid */}
                  <div className="grid grid-cols-4 gap-2">
                    {(AVATAR_PRESETS[formData.gender] || AVATAR_PRESETS.Male).map((imgUrl, idx) => (
                      <div
                        key={idx}
                        onClick={() => setFormData({ ...formData, avatar: imgUrl })}
                        className={`p-1 rounded-xl border-2 cursor-pointer transition flex items-center justify-center ${
                          formData.avatar === imgUrl ? 'border-brand-600 bg-brand-50' : 'border-transparent hover:border-slate-300'
                        }`}
                      >
                        <img src={imgUrl} alt={`Avatar ${idx}`} className="w-12 h-12 rounded-full object-cover" />
                      </div>
                    ))}
                  </div>

                  {/* File Upload Option */}
                  <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Or upload custom photo:</span>
                    <label className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-lg cursor-pointer flex items-center space-x-1">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload File</span>
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

              {/* User Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border rounded-xl outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="rahul@tmi-erp.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border rounded-xl outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Role Permission *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border rounded-xl outline-none font-bold text-brand-700"
                  >
                    {Object.values(ROLES).map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password <span className="text-[10px] text-slate-400 font-normal">(min. 6 characters)</span>
                  </label>
                  <input
                    type="text"
                    required
                    minLength={6}
                    placeholder="Min. 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border rounded-xl outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Aerospace Sales"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Territory</label>
                  <input
                    type="text"
                    placeholder="e.g. South Region"
                    value={formData.territory}
                    onChange={(e) => setFormData({ ...formData, territory: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border rounded-xl outline-none font-bold"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingUser(null);
                  }}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 rounded-xl shadow-md"
                >
                  {isSubmitting ? 'Creating User in Supabase...' : editingUser ? 'Save User & Photo' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {deletingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Delete User Account</h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete <strong className="text-slate-900">{deletingUser.name}</strong> ({deletingUser.email})?
            </p>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                onClick={() => setDeletingUser(null)}
                disabled={isDeleting}
                className="px-4 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-md flex items-center space-x-1"
              >
                {isDeleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{isDeleting ? 'Deleting User...' : 'Delete User'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Start Fresh Production ERP Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-red-700 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-red-600" />
                <span>Start Fresh Production ERP</span>
              </h3>
              <button onClick={() => setIsResetModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-1">
              <p className="font-bold">This action will permanently delete:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>All visits, office work, and KRA activities</li>
                <li>All tasks and notifications</li>
                <li>All customers and products</li>
                <li>All users except the Primary Admin</li>
              </ul>
              <p className="font-bold mt-2 text-red-900">This action cannot be undone.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Enter your Admin password to confirm:</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  placeholder="Enter your current password"
                  value={resetPasswordInput}
                  onChange={(e) => {
                    setResetPasswordInput(e.target.value);
                    setResetError('');
                  }}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-red-500 outline-none transition"
                />
              </div>
              {resetError && <p className="text-xs text-red-600 font-semibold mt-1">{resetError}</p>}
            </div>

            <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100">
              <button
                onClick={() => setIsResetModalOpen(false)}
                disabled={isResetting}
                className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                disabled={isResetting}
                onClick={async () => {
                  if (!resetPasswordInput.trim()) {
                    setResetError('Password is required.');
                    return;
                  }
                  setIsResetting(true);
                  try {
                    const verified = await verifyAdminPassword(resetPasswordInput);
                    if (!verified) {
                      setResetError('Incorrect admin password. Please try again.');
                      return;
                    }
                    await initializeFreshProductionSystem();
                    setIsResetModalOpen(false);
                    setResetPasswordInput('');
                    setResetError('');
                    alert('Production ERP initialized successfully. All demo records have been cleared.');
                  } catch (err) {
                    setResetError('Reset failed: ' + (err.message || err));
                  } finally {
                    setIsResetting(false);
                  }
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-xl shadow-md flex items-center space-x-1"
              >
                {isResetting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{isResetting ? 'Resetting System...' : 'Confirm & Reset System'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
