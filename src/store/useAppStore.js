import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { ROLES } from '../types';

// Helper to map Supabase auth session to store user object
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
    name: session.user.user_metadata?.full_name || '',
    role: profile?.role || ROLES.MANAGER,
    avatar: session.user.user_metadata?.avatar_url || '',
  };
};

export const useAppStore = create((set, get) => ({
  // ---------- Auth state ----------
  isAuthenticated: false,
  currentUser: null,

  // ---------- Collections (populated from Supabase) ----------
  users: [], // kept for compatibility; actual auth is via Supabase
  customers: [],
  products: [],
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
    // Load any existing auth session
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const user = await mapSessionToUser(session);
      set({ currentUser: user, isAuthenticated: true, activeTab: 'dashboard' });
    }

    // Fetch shared data in parallel
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
    return { success: true, user };
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ isAuthenticated: false, currentUser: null, activeTab: 'dashboard' });
  },

  // ---------- User Management (CRUD) ----------
  addUser: async (userData) => {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password || 'password123',
      options: { data: { full_name: userData.name, avatar_url: userData.avatar } },
    });
    if (error) throw error;
    await supabase.from('profiles').insert({ id: data.user.id, role: userData.role || ROLES.MANAGER });
    const newUser = { id: data.user.id, email: userData.email, name: userData.name, role: userData.role, avatar: userData.avatar };
    set((state) => ({ users: [newUser, ...state.users] }));
    return newUser;
  },

  // ---------- Add Activity (Visit / Office / PO) ----------
  addActivity: async (type, payload) => {
    const { currentUser } = get();
    const { data, error } = await supabase.from('activities').insert({
      type,
      data: payload,
      created_by: currentUser.id,
    });
    if (error) throw error;
    set((state) => ({ activities: [data[0], ...state.activities] }));
  },

  // Additional CRUD helpers for customers, products, orders, etc. can be added similarly
}));
