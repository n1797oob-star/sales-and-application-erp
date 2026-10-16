import { create } from 'zustand';
import { supabase } from '../lib/supabase';

// Map Supabase auth session → store user object
const mapSessionToUser = async (session) => {
  if (!session?.user) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
    role: profile?.role || 'MANAGER',
    avatar: session.user.user_metadata?.avatar_url || '',
  };
};

export const useAppStore = create((set, get) => ({
  // ---------- Auth state ----------
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

  // ---------- UI state ----------
  activeTab: 'dashboard',
  isFilterModalOpen: false,

  // ---------- Bootstrap ----------
  initApp: async () => {
    // 1. Check for existing session (works on any device that has logged in before)
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const user = await mapSessionToUser(session);
      set({ currentUser: user, isAuthenticated: true });
    }

    // 2. Listen to auth changes (login/logout from any tab)
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const user = await mapSessionToUser(session);
        set({ currentUser: user, isAuthenticated: true });
      } else {
        set({ currentUser: null, isAuthenticated: false });
      }
    });

    // 3. Load shared data
    await get().loadSharedData();
  },

  loadSharedData: async () => {
    const [custRes, prodRes, leadRes, actRes] = await Promise.all([
      supabase.from('customers').select('*'),
      supabase.from('products').select('*'),
      supabase.from('leads').select('*'),
      supabase.from('activities').select('*'),
    ]);
    set({
      customers: custRes.data ?? [],
      products: prodRes.data ?? [],
      leads: leadRes.data ?? [],
      activities: actRes.data ?? [],
    });
  },

  // ---------- Auth actions ----------
  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    const user = await mapSessionToUser(data.session);
    set({ currentUser: user, isAuthenticated: true, activeTab: 'dashboard' });
    // Reload shared data after login
    await get().loadSharedData();
    return { success: true, user };
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({
      isAuthenticated: false,
      currentUser: null,
      activeTab: 'dashboard',
      customers: [],
      products: [],
      leads: [],
      activities: [],
    });
  },

  // ---------- User Management ----------
  addUser: async (userData) => {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password || 'password123',
      options: {
        data: {
          full_name: userData.name || userData.email.split('@')[0],
          avatar_url: userData.avatar || '',
        },
      },
    });
    if (error) throw error;
    // Create profile row with role
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        role: userData.role || 'SALES_ENGINEER',
      });
    }
    const newUser = {
      id: data.user?.id,
      email: userData.email,
      name: userData.name || userData.email.split('@')[0],
      role: userData.role || 'SALES_ENGINEER',
      avatar: userData.avatar || '',
    };
    set((state) => ({ users: [newUser, ...state.users] }));
    return newUser;
  },

  // ---------- Add Activity ----------
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

  // ---------- Product CRUD ----------
  addProduct: async (product) => {
    const { data, error } = await supabase.from('products').insert(product).select();
    if (error) throw error;
    if (data?.[0]) set((state) => ({ products: [data[0], ...state.products] }));
    return data?.[0];
  },

  // ---------- Lead CRUD ----------
  addLead: async (lead) => {
    const { data, error } = await supabase.from('leads').insert(lead).select();
    if (error) throw error;
    if (data?.[0]) set((state) => ({ leads: [data[0], ...state.leads] }));
    return data?.[0];
  },

  // ---------- UI helpers ----------
  setActiveTab: (tab) => set({ activeTab: tab }),
  setFilterModalOpen: (open) => set({ isFilterModalOpen: open }),
}));
