import { create } from 'zustand';
import { supabase } from '../lib/supabase';

// Map Supabase session → user object for the store
const mapSessionToUser = async (session) => {
  if (!session?.user) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
  return {
    id: session.user.id,
    email: session.user.email,
    name: profile?.name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
    role: profile?.role || 'MANAGER',
    avatar: profile?.avatar || session.user.user_metadata?.avatar_url || '',
    phone: profile?.phone || '',
    department: profile?.department || '',
    territory: profile?.territory || '',
    gender: profile?.gender || 'Male',
    status: profile?.status || 'Active',
  };
};

export const useAppStore = create((set, get) => ({
  // ---------- Auth ----------
  isAuthenticated: false,
  currentUser: null,

  // ---------- Collections ----------
  users: [],
  customers: [],
  products: [],
  leads: [],
  activities: [],
  visits: [],
  officeWorks: [],
  kraActivities: [],
  tasks: [],
  orders: [],
  notifications: [],
  activityLogs: [],

  // ---------- UI ----------
  activeTab: 'dashboard',
  isFilterModalOpen: false,

  // ---------- Bootstrap ----------
  initApp: async () => {
    // Restore session from localStorage (works on any device that has logged in)
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const user = await mapSessionToUser(session);
      set({ currentUser: user, isAuthenticated: true });
    }

    // Keep auth in sync (handles token refresh, logout from other tabs, etc.)
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const user = await mapSessionToUser(session);
        set({ currentUser: user, isAuthenticated: true });
      } else {
        set({ currentUser: null, isAuthenticated: false });
      }
    });

    // Load shared data
    await get().loadSharedData();
  },

  loadSharedData: async () => {
    const [custRes, prodRes, leadRes, actRes, profilesRes] = await Promise.all([
      supabase.from('customers').select('*'),
      supabase.from('products').select('*'),
      supabase.from('leads').select('*'),
      supabase.from('activities').select('*'),
      supabase.from('profiles').select('*'),
    ]);
    set({
      customers: custRes.data ?? [],
      products: prodRes.data ?? [],
      leads: leadRes.data ?? [],
      activities: actRes.data ?? [],
      users: profilesRes.data ?? [],
    });
  },

  // ---------- Auth actions ----------
  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    const user = await mapSessionToUser(data.session);
    set({ currentUser: user, isAuthenticated: true, activeTab: 'dashboard' });
    await get().loadSharedData();
    return { success: true, user };
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({
      isAuthenticated: false,
      currentUser: null,
      activeTab: 'dashboard',
      users: [],
      customers: [],
      products: [],
      leads: [],
      activities: [],
    });
  },

  // ---------- User Management (Admin only) ----------
  // Admin creates users via Supabase Auth + profiles table
  addUser: async (userData) => {
    // Create Supabase Auth account
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password || 'password123',
      options: {
        data: {
          full_name: userData.name,
          avatar_url: userData.avatar || '',
        },
      },
    });
    if (error) throw error;

    const userId = data.user?.id;
    if (!userId) throw new Error('User creation failed');

    // Save full profile info to profiles table
    const profileData = {
      id: userId,
      name: userData.name,
      email: userData.email,
      role: userData.role || 'SALES_ENGINEER',
      avatar: userData.avatar || '',
      gender: userData.gender || 'Male',
      phone: userData.phone || '',
      department: userData.department || 'Sales & App Engineering',
      territory: userData.territory || 'Pan-India',
      status: userData.status || 'Active',
    };
    const { error: profileError } = await supabase.from('profiles').upsert(profileData);
    if (profileError) throw profileError;

    set((state) => ({ users: [profileData, ...state.users] }));
    return profileData;
  },

  updateUser: async (id, updates) => {
    const profileUpdates = {
      name: updates.name,
      role: updates.role,
      avatar: updates.avatar,
      gender: updates.gender,
      phone: updates.phone,
      department: updates.department,
      territory: updates.territory,
      status: updates.status,
    };
    const { error } = await supabase.from('profiles').update(profileUpdates).eq('id', id);
    if (error) throw error;
    set((state) => ({
      users: state.users.map((u) => (u.id === id ? { ...u, ...profileUpdates } : u)),
    }));
  },

  deleteUser: async (id) => {
    // Delete profile row (Auth user deletion requires service key - skip for now)
    await supabase.from('profiles').delete().eq('id', id);
    set((state) => ({ users: state.users.filter((u) => u.id !== id) }));
  },

  // ---------- Activity ----------
  addActivity: async (type, payload) => {
    const { currentUser } = get();
    const { data, error } = await supabase
      .from('activities')
      .insert({ type, data: payload, created_by: currentUser?.id })
      .select();
    if (error) throw error;
    if (data?.[0]) {
      set((state) => ({ activities: [data[0], ...state.activities] }));
    }
  },

  // ---------- Customer CRUD ----------
  addCustomer: async (customer) => {
    const { data, error } = await supabase.from('customers').insert(customer).select();
    if (error) throw error;
    if (data?.[0]) set((state) => ({ customers: [data[0], ...state.customers] }));
    return data?.[0];
  },

  updateCustomer: async (id, updates) => {
    const { error } = await supabase.from('customers').update(updates).eq('id', id);
    if (error) throw error;
    set((state) => ({
      customers: state.customers.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  },

  deleteCustomer: async (id) => {
    await supabase.from('customers').delete().eq('id', id);
    set((state) => ({ customers: state.customers.filter((c) => c.id !== id) }));
  },

  // ---------- Product CRUD ----------
  addProduct: async (product) => {
    const { data, error } = await supabase.from('products').insert(product).select();
    if (error) throw error;
    if (data?.[0]) set((state) => ({ products: [data[0], ...state.products] }));
    return data?.[0];
  },

  updateProduct: async (id, updates) => {
    const { error } = await supabase.from('products').update(updates).eq('id', id);
    if (error) throw error;
    set((state) => ({
      products: state.products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
  },

  deleteProduct: async (id) => {
    await supabase.from('products').delete().eq('id', id);
    set((state) => ({ products: state.products.filter((p) => p.id !== id) }));
  },

  // ---------- Lead CRUD ----------
  addLead: async (lead) => {
    const { data, error } = await supabase.from('leads').insert(lead).select();
    if (error) throw error;
    if (data?.[0]) set((state) => ({ leads: [data[0], ...state.leads] }));
    return data?.[0];
  },

  updateLead: async (id, updates) => {
    const { error } = await supabase.from('leads').update(updates).eq('id', id);
    if (error) throw error;
    set((state) => ({
      leads: state.leads.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    }));
  },

  // ---------- UI helpers ----------
  setActiveTab: (tab) => set({ activeTab: tab }),
  setFilterModalOpen: (open) => set({ isFilterModalOpen: open }),
}));
