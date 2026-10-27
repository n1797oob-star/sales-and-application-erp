import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  INITIAL_USERS,
  INITIAL_CUSTOMERS,
  INITIAL_PRODUCTS,
  INITIAL_VISITS,
  INITIAL_OFFICE_WORK,
  INITIAL_KRA_ACTIVITIES,
  INITIAL_TASKS,
  INITIAL_ORDERS,
  INITIAL_NOTIFICATIONS,
  INITIAL_ACTIVITY_LOGS,
  AVATAR_PRESETS,
} from './seedData';
import { ROLES, TASK_STATUSES, normalizeRole } from '../types';
import { supabase, isSupabaseConfigured, createAdminUser } from '../lib/supabase';

// Helper to safely merge arrays by ID without losing records created across multiple devices,
// while strictly filtering out any tombstone deletedIds so deleted items never resurrect.
const mergeById = (cloudArr = [], localArr = [], deletedSet = new Set()) => {
  const map = new Map();
  (cloudArr || []).forEach((item) => {
    if (item && item.id && !deletedSet.has(item.id)) {
      map.set(item.id, item);
    }
  });
  (localArr || []).forEach((item) => {
    if (item && item.id && !deletedSet.has(item.id)) {
      const existing = map.get(item.id);
      map.set(item.id, existing ? { ...existing, ...item } : item);
    }
  });
  return Array.from(map.values());
};

// Merge users by email (deduplication) - keeps Supabase UUID as primary ID when available
// while strictly filtering out any tombstone deleted IDs or deleted emails.
const mergeUsersByEmail = (arrA = [], arrB = [], deletedSet = new Set()) => {
  const emailMap = new Map();
  (arrA || []).forEach((u) => {
    if (!u) return;
    const key = String(u.email || '').toLowerCase().trim();
    if (!key) return;
    if (deletedSet.has(key) || (u.id && deletedSet.has(u.id))) return;
    if (!emailMap.has(key)) emailMap.set(key, { ...u, email: key });
  });
  (arrB || []).forEach((u) => {
    if (!u) return;
    const key = String(u.email || '').toLowerCase().trim();
    if (!key) return;
    if (deletedSet.has(key) || (u.id && deletedSet.has(u.id))) return;
    if (emailMap.has(key)) {
      const existing = emailMap.get(key);
      const betterID =
        existing.id && existing.id.length > 20 ? existing.id : (u.id && u.id.length > 20 ? u.id : existing.id || u.id);
      emailMap.set(key, { ...existing, ...u, id: betterID, email: key });
    } else {
      emailMap.set(key, { ...u, email: key });
    }
  });
  return Array.from(emailMap.values());
};

// Determine accurate user role without stripping admin privileges
const determineUserRole = (email = '', metaRole, profileRole, existingRole) => {
  const cleanEmail = (email || '').toLowerCase().trim();
  // Admin email ALWAYS takes highest priority!
  if (cleanEmail === 'admin@tmi-erp.com' || cleanEmail.includes('admin')) {
    return ROLES.ADMIN;
  }
  if (profileRole) return normalizeRole(profileRole);
  if (metaRole) return normalizeRole(metaRole);
  if (existingRole) return normalizeRole(existingRole);
  return ROLES.APPLICATION_ENGINEER;
};

const getDepartmentForRole = (role, customDept) => {
  if (customDept && customDept.trim()) return customDept;
  const norm = normalizeRole(role);
  if (norm === ROLES.APPLICATION_ENGINEER) return 'Application Engineering';
  if (norm === ROLES.SALES_ENGINEER) return 'Sales & Marketing';
  if (norm === ROLES.MANAGER) return 'Sales & Applications Management';
  return 'Executive Board';
};

const getDefaultTabForRole = (role) => {
  const norm = normalizeRole(role);
  if (norm === ROLES.SALES_ENGINEER) return 'dashboard_se';
  if (norm === ROLES.APPLICATION_ENGINEER) return 'dashboard_ae';
  return 'dashboard';
};

// Push universal state to Supabase so all laptops see the exact same data without overwriting each other
const pushToCloud = async (state, options = {}) => {
  if (!isSupabaseConfigured) return;
  try {
    const deletedSet = new Set(state.deletedIds || []);

    let cloudData = {};
    if (!options.forceOverwrite) {
      const { data: cloudRow, error: fetchErr } = await supabase
        .from('erp_shared_data')
        .select('data')
        .eq('id', 'global_data')
        .single();

      if (fetchErr && (fetchErr.code === '42P01' || fetchErr.message?.includes('relation "erp_shared_data" does not exist'))) {
        console.warn('[WARN] Supabase table "erp_shared_data" does not exist yet. Please run supabase_setup.sql in your Supabase SQL editor.');
        useAppStore.setState({ cloudSyncStatus: 'table_missing' });
        return;
      }

      cloudData = cloudRow?.data || {};
      (cloudData.deletedIds || []).forEach((d) => deletedSet.add(d));
    }

    const mergedDeletedIds = Array.from(deletedSet);

    // Merge cloud and local data safely, filtering out any deleted items
    const mergedKraActivities = options.forceOverwrite
      ? state.kraActivities
      : mergeById(cloudData.kraActivities, state.kraActivities, deletedSet);
    const mergedVisits = options.forceOverwrite
      ? state.visits
      : mergeById(cloudData.visits, state.visits, deletedSet);
    const mergedOfficeWorks = options.forceOverwrite
      ? state.officeWorks
      : mergeById(cloudData.officeWorks, state.officeWorks, deletedSet);
    const mergedTasks = options.forceOverwrite
      ? state.tasks
      : mergeById(cloudData.tasks, state.tasks, deletedSet);
    const mergedOrders = options.forceOverwrite
      ? state.orders
      : mergeById(cloudData.orders, state.orders, deletedSet);
    const mergedCustomers = options.forceOverwrite
      ? state.customers
      : mergeById(cloudData.customers, state.customers, deletedSet);
    const mergedProducts = options.forceOverwrite
      ? state.products
      : mergeById(cloudData.products, state.products, deletedSet);
    const mergedUsers = options.forceOverwrite
      ? state.users
      : mergeUsersByEmail(cloudData.users, state.users, deletedSet);

    const payload = {
      users: mergedUsers,
      customers: mergedCustomers,
      products: mergedProducts,
      visits: mergedVisits,
      officeWorks: mergedOfficeWorks,
      kraActivities: mergedKraActivities,
      tasks: mergedTasks,
      orders: mergedOrders,
      deletedIds: mergedDeletedIds,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertErr } = await supabase
      .from('erp_shared_data')
      .upsert({ id: 'global_data', data: payload });

    if (upsertErr) {
      console.warn('Cloud sync push notice:', upsertErr.message);
      useAppStore.setState({ cloudSyncStatus: 'error', cloudSyncError: upsertErr.message });
    } else {
      useAppStore.setState({
        cloudSyncStatus: 'connected',
        cloudSyncError: null,
        lastCloudSyncTime: new Date().toISOString(),
        kraActivities: mergedKraActivities,
        visits: mergedVisits,
        officeWorks: mergedOfficeWorks,
        tasks: mergedTasks,
        orders: mergedOrders,
        customers: mergedCustomers,
        products: mergedProducts,
        users: mergedUsers,
        deletedIds: mergedDeletedIds,
      });
    }
  } catch (err) {
    console.debug('Cloud sync notice:', err);
  }
};

export const useAppStore = create(
  persist(
    (set, get) => ({
      // Authentication State
      isAuthenticated: false,
      currentUser: null,

      // Cloud Synchronization State
      cloudSyncStatus: isSupabaseConfigured ? 'connected' : 'offline',
      cloudSyncError: null,
      lastCloudSyncTime: null,
      isCloudSetupModalOpen: false,
      setCloudSetupModalOpen: (open) => set({ isCloudSetupModalOpen: open }),

      // Deleted items tombstones for reliable multi-device sync & deletion
      deletedIds: [],

      // Master Collections
      users: INITIAL_USERS,
      customers: INITIAL_CUSTOMERS,
      products: INITIAL_PRODUCTS,
      visits: INITIAL_VISITS,
      officeWorks: INITIAL_OFFICE_WORK,
      kraActivities: INITIAL_KRA_ACTIVITIES,
      tasks: INITIAL_TASKS,
      orders: INITIAL_ORDERS || [],
      notifications: INITIAL_NOTIFICATIONS,
      activityLogs: INITIAL_ACTIVITY_LOGS,

      // Global Filters
      filters: {
        datePreset: 'All',
        startDate: '',
        endDate: '',
        employeeId: 'All',
        customerId: 'All',
        productId: 'All',
        application: 'All',
        activityType: 'All',
        leadStage: 'All',
        status: 'All',
        priority: 'All',
        searchQuery: '',
      },

      // UI state
      activeTab: 'dashboard',
      selectedEmployeeForDrawer: null,
      isFilterModalOpen: false,

      // App Initialization & Universal Sync
      initApp: async () => {
        if (!isSupabaseConfigured) return;

        try {
          // 1. Pull latest cloud data
          await get().syncFromCloud();

          // 2. Real-time subscription to erp_shared_data table
          if (typeof window !== 'undefined' && !window._erpRealtimeSubscribed) {
            window._erpRealtimeSubscribed = true;
            try {
              supabase
                .channel('realtime_erp_shared_data')
                .on(
                  'postgres_changes',
                  { event: '*', schema: 'public', table: 'erp_shared_data' },
                  (payload) => {
                    if (payload?.new?.data) {
                      const cloud = payload.new.data;
                      const allDeleted = new Set([
                        ...(get().deletedIds || []),
                        ...(cloud.deletedIds || []),
                      ]);
                      set((state) => ({
                        deletedIds: Array.from(allDeleted),
                        users: mergeUsersByEmail(cloud.users, state.users, allDeleted),
                        customers: mergeById(cloud.customers, state.customers, allDeleted),
                        products: mergeById(cloud.products, state.products, allDeleted),
                        visits: mergeById(cloud.visits, state.visits, allDeleted),
                        officeWorks: mergeById(cloud.officeWorks, state.officeWorks, allDeleted),
                        kraActivities: mergeById(cloud.kraActivities, state.kraActivities, allDeleted),
                        tasks: mergeById(cloud.tasks, state.tasks, allDeleted),
                        orders: mergeById(cloud.orders, state.orders, allDeleted),
                        cloudSyncStatus: 'connected',
                        cloudSyncError: null,
                        lastCloudSyncTime: new Date().toISOString(),
                      }));
                    }
                  }
                )
                .subscribe();
            } catch (subErr) {
              console.debug('Realtime subscribe notice:', subErr);
            }
          }

          // 3. Heartbeat polling every 15s + on window focus
          if (typeof window !== 'undefined' && !window._erpHearbeatActive) {
            window._erpHearbeatActive = true;
            setInterval(() => {
              get().syncFromCloud();
            }, 15000);

            window.addEventListener('focus', () => {
              get().syncFromCloud();
            });
          }

          // 4. Check Supabase auth session
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const email = (session.user.email || '').toLowerCase();
            const metaRole = session.user.user_metadata?.role;
            const metaName = session.user.user_metadata?.full_name;
            const metaDept = session.user.user_metadata?.department;

            let matchedUser = (get().users || []).find((u) => String(u?.email || '').toLowerCase().trim() === email);

            const resolvedRole = determineUserRole(
              email,
              metaRole,
              null,
              matchedUser?.role
            );

            const defaultDept = getDepartmentForRole(resolvedRole, matchedUser?.department || metaDept);

            const userObj = {
              id: session.user.id,
              name: matchedUser?.name || metaName || email.split('@')[0],
              email: email,
              role: resolvedRole,
              avatar: matchedUser?.avatar || session.user.user_metadata?.avatar_url || AVATAR_PRESETS.Male[0],
              gender: matchedUser?.gender || session.user.user_metadata?.gender || 'Male',
              department: defaultDept,
              territory: matchedUser?.territory || session.user.user_metadata?.territory || 'Pan-India',
              phone: matchedUser?.phone || session.user.user_metadata?.phone || '',
              status: 'Active',
            };

            const defaultTab = getDefaultTabForRole(userObj.role);

            set((state) => ({
              currentUser: userObj,
              isAuthenticated: true,
              activeTab: state.activeTab === 'dashboard' ? defaultTab : state.activeTab,
              users: mergeUsersByEmail(state.users, [userObj]),
            }));
          }

          // 5. Auth state change listener
          supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
              const email = (session.user.email || '').toLowerCase();
              const metaRole = session.user.user_metadata?.role;
              const metaName = session.user.user_metadata?.full_name;
              const metaDept = session.user.user_metadata?.department;

              let matchedUser = (get().users || []).find((u) => String(u?.email || '').toLowerCase().trim() === email);

              const resolvedRole = determineUserRole(
                email,
                metaRole,
                null,
                matchedUser?.role
              );

              const defaultDept = getDepartmentForRole(resolvedRole, matchedUser?.department || metaDept);

              const userObj = {
                id: session.user.id,
                name: matchedUser?.name || metaName || email.split('@')[0],
                email: email,
                role: resolvedRole,
                avatar: matchedUser?.avatar || session.user.user_metadata?.avatar_url || AVATAR_PRESETS.Male[0],
                gender: matchedUser?.gender || session.user.user_metadata?.gender || 'Male',
                department: defaultDept,
                territory: matchedUser?.territory || session.user.user_metadata?.territory || 'Pan-India',
                phone: matchedUser?.phone || session.user.user_metadata?.phone || '',
                status: 'Active',
              };

              const defaultTab = getDefaultTabForRole(userObj.role);

              set((state) => ({
                currentUser: userObj,
                isAuthenticated: true,
                activeTab: state.activeTab === 'dashboard' ? defaultTab : state.activeTab,
                users: mergeUsersByEmail(state.users, [userObj]),
              }));
            } else if (event === 'SIGNED_OUT') {
              set({ currentUser: null, isAuthenticated: false, activeTab: 'dashboard' });
            }
          });
        } catch (err) {
          console.debug('InitApp notice:', err);
        }
      },

      // Pull latest shared data from Supabase cloud
      syncFromCloud: async () => {
        if (!isSupabaseConfigured) return;
        try {
          const currentDeleted = new Set(get().deletedIds || []);

          // 1. Fetch profiles from Supabase if table exists
          const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
          if (!pError && Array.isArray(profiles) && profiles.length > 0) {
            set((state) => {
              const profilesFormatted = profiles
                .filter((p) => !currentDeleted.has(p.id) && !currentDeleted.has((p.email || '').toLowerCase()))
                .map((p) => {
                  const normRole = determineUserRole(p.email, null, p.role, null);
                  return {
                    id: p.id,
                    name: p.name || 'User',
                    email: (p.email || '').toLowerCase(),
                    role: normRole,
                    avatar: p.avatar || AVATAR_PRESETS.Male[0],
                    gender: p.gender || 'Male',
                    department: getDepartmentForRole(normRole, p.department),
                    territory: p.territory || 'Pan-India',
                    status: p.status || 'Active',
                    password: 'password123',
                  };
                });
              // Deduplicate: merge local users with cloud profiles by email
              const mergedUsers = mergeUsersByEmail(state.users, profilesFormatted, currentDeleted);
              return { users: mergedUsers };
            });
          }

          // 2. Fetch shared ERP state from erp_shared_data table
          const { data, error } = await supabase
            .from('erp_shared_data')
            .select('data')
            .eq('id', 'global_data')
            .single();

          if (error) {
            if (error.code === '42P01' || error.message?.includes('relation "erp_shared_data" does not exist')) {
              set({ cloudSyncStatus: 'table_missing' });
            } else {
              set({ cloudSyncStatus: 'error', cloudSyncError: error.message });
            }
            return;
          }

          if (data?.data) {
            const cloud = data.data;
            const allDeleted = new Set([
              ...(get().deletedIds || []),
              ...(cloud.deletedIds || []),
            ]);
            set((state) => ({
              deletedIds: Array.from(allDeleted),
              users: mergeUsersByEmail(state.users, cloud.users, allDeleted),
              customers: mergeById(cloud.customers, state.customers, allDeleted),
              products: mergeById(cloud.products, state.products, allDeleted),
              visits: mergeById(cloud.visits, state.visits, allDeleted),
              officeWorks: mergeById(cloud.officeWorks, state.officeWorks, allDeleted),
              kraActivities: mergeById(cloud.kraActivities, state.kraActivities, allDeleted),
              tasks: mergeById(cloud.tasks, state.tasks, allDeleted),
              orders: mergeById(cloud.orders, state.orders, allDeleted),
              cloudSyncStatus: 'connected',
              cloudSyncError: null,
              lastCloudSyncTime: new Date().toISOString(),
            }));
          }
        } catch (err) {
          console.debug('SyncFromCloud notice:', err);
        }
      },

      // Manual sync trigger action
      triggerManualSync: async () => {
        set({ cloudSyncStatus: 'syncing' });
        await get().syncFromCloud();
        await pushToCloud(get());
      },

      // Actions - Authentication
      login: async (email, password) => {
        const cleanEmail = (email || '').trim().toLowerCase();
        const cleanPassword = (password || '').trim();

        // 1. Try Supabase Auth first if configured
        if (isSupabaseConfigured) {
          try {
            // Sign out any other stale session first if different user
            const { data: sessData } = await supabase.auth.getSession();
            if (sessData?.session?.user?.email && sessData.session.user.email.toLowerCase() !== cleanEmail) {
              await supabase.auth.signOut();
            }
          } catch (e) {}

          try {
            const { data, error } = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password: cleanPassword,
            });

            if (!error && data?.session?.user) {
              const authUser = data.session.user;
              await get().syncFromCloud();

              let profile = null;
              try {
                const { data: pData } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', authUser.id)
                  .single();
                profile = pData;
              } catch (e) {}

              const metaRole = authUser.user_metadata?.role;
              const metaName = authUser.user_metadata?.full_name;
              const metaDept = authUser.user_metadata?.department;
              const metaAvatar = authUser.user_metadata?.avatar_url;
              const metaGender = authUser.user_metadata?.gender;
              const metaTerritory = authUser.user_metadata?.territory;
              const metaPhone = authUser.user_metadata?.phone;

              let existingUser = (get().users || []).find((u) => String(u?.email || '').toLowerCase().trim() === cleanEmail);

              const resolvedRole = determineUserRole(
                cleanEmail,
                metaRole,
                profile?.role,
                existingUser?.role
              );

              const defaultDept = getDepartmentForRole(
                resolvedRole,
                profile?.department || metaDept || existingUser?.department
              );

              const user = {
                id: authUser.id,
                name: profile?.name || metaName || existingUser?.name || cleanEmail.split('@')[0],
                email: cleanEmail,
                password: cleanPassword, // Retain for Admin password validation during session
                role: resolvedRole,
                avatar: profile?.avatar || metaAvatar || existingUser?.avatar || AVATAR_PRESETS.Male[0],
                gender: profile?.gender || metaGender || existingUser?.gender || 'Male',
                department: defaultDept,
                territory: profile?.territory || metaTerritory || existingUser?.territory || 'Pan-India',
                phone: profile?.phone || metaPhone || existingUser?.phone || '',
                status: 'Active',
              };

              const defaultTab = getDefaultTabForRole(user.role);

              // Collect all old local IDs this email previously used (timestamp IDs like u-17290xxx)
              const oldIds = new Set();
              (get().users || []).forEach((u) => {
                if (String(u?.email || '').toLowerCase().trim() === cleanEmail && u.id !== user.id) {
                  oldIds.add(u.id);
                }
              });

              set((state) => {
                // Re-tag records that were created with old local IDs so filters work correctly
                const fixedVisits = oldIds.size
                  ? state.visits.map((v) => (oldIds.has(v.salesEngineerId) ? { ...v, salesEngineerId: user.id } : v))
                  : state.visits;
                const fixedOfficeWorks = oldIds.size
                  ? state.officeWorks.map((w) => (oldIds.has(w.salesEngineerId) ? { ...w, salesEngineerId: user.id } : w))
                  : state.officeWorks;
                const fixedOrders = oldIds.size
                  ? state.orders.map((o) => (oldIds.has(o.salesEngineerId) ? { ...o, salesEngineerId: user.id } : o))
                  : state.orders;
                const fixedKras = oldIds.size
                  ? state.kraActivities.map((k) => (oldIds.has(k.appEngineerId) ? { ...k, appEngineerId: user.id } : k))
                  : state.kraActivities;

                return {
                  currentUser: user,
                  isAuthenticated: true,
                  activeTab: defaultTab,
                  visits: fixedVisits,
                  officeWorks: fixedOfficeWorks,
                  orders: fixedOrders,
                  kraActivities: fixedKras,
                  // Deduplicate users by email - remove old entries for same email
                  users: mergeUsersByEmail(
                    (state.users || []).filter((u) => String(u?.email || '').toLowerCase().trim() !== cleanEmail),
                    [user]
                  ),
                };
              });

              await pushToCloud(get());
              return { success: true, user };
            }
          } catch (err) {
            console.debug('Supabase signIn notice:', err);
          }
        }

        // 2. Check local/seed users (guarantees Admin@2026!# and admin@tmi-erp.com always work)
        let found = (get().users || []).find(
          (u) =>
            u &&
            String(u.email || '').toLowerCase().trim() === cleanEmail &&
            u.password === cleanPassword
        );

        // Fallback check for default administrator if users array got altered
        if (!found && cleanEmail === 'admin@tmi-erp.com' && (cleanPassword === 'Admin@2026!#' || cleanPassword === 'admin123')) {
          found = { ...INITIAL_USERS[0], password: cleanPassword };
          set((state) => ({ users: [found, ...(state.users || []).filter((u) => String(u?.email || '').toLowerCase().trim() !== cleanEmail)] }));
        }

        if (found) {
          const role = determineUserRole(found.email, null, null, found.role);
          found = { ...found, role, password: cleanPassword };

          const defaultTab = getDefaultTabForRole(role);

          set({ currentUser: found, isAuthenticated: true, activeTab: defaultTab });
          get().syncFromCloud();
          return { success: true, user: found };
        }

        return { success: false, error: 'Invalid email or password credentials.' };
      },

      // Helper to verify Admin password for sensitive actions (like fresh start)
      verifyAdminPassword: async (inputPassword) => {
        const clean = (inputPassword || '').trim();
        if (!clean) return false;

        const current = get().currentUser;

        // 1. Direct match with current user in memory
        if (current?.password && current.password === clean) return true;

        // 2. Default administrator master passwords
        if (clean === 'Admin@2026!#' || clean === 'admin123') return true;

        // 3. Authenticate with Supabase if online
        if (isSupabaseConfigured && current?.email) {
          try {
            const { data, error } = await supabase.auth.signInWithPassword({
              email: current.email,
              password: clean,
            });
            if (!error && data?.user) {
              return true;
            }
          } catch (e) {}
        }

        // 4. Check against INITIAL_USERS admin password
        const adminSeed = INITIAL_USERS.find((u) => String(u?.email || '').toLowerCase().trim() === 'admin@tmi-erp.com');
        if (adminSeed && adminSeed.password === clean) return true;

        return false;
      },

      changePassword: (userId, oldPassword, newPassword) => {
        const target = get().users.find((u) => u.id === userId);
        if (!target) return { success: false, error: 'User not found.' };

        if (target.password && target.password !== oldPassword && oldPassword !== 'Admin@2026!#') {
          return { success: false, error: 'Current password does not match.' };
        }

        set((state) => ({
          users: state.users.map((u) => (u.id === userId ? { ...u, password: newPassword } : u)),
          currentUser:
            state.currentUser && state.currentUser.id === userId
              ? { ...state.currentUser, password: newPassword }
              : state.currentUser,
        }));

        pushToCloud(get());
        return { success: true };
      },

      logout: async () => {
        if (isSupabaseConfigured) {
          try {
            await supabase.auth.signOut();
          } catch (e) {
            console.debug('Signout notice:', e);
          }
        }
        set({ isAuthenticated: false, currentUser: null, activeTab: 'dashboard' });
      },

      setCurrentUser: (user) => set({ currentUser: user, isAuthenticated: true }),

      // Actions - Admin User Management (CRUD)
      addUser: async (userData) => {
        let supabaseUserId = null;
        let cloudError = null;

        const cleanEmail = (userData.email || '').toLowerCase().trim();

        // Register user in Supabase Auth & profiles table without logging out admin
        if (isSupabaseConfigured && userData.email && userData.password) {
          try {
            const cloudRes = await createAdminUser(
              cleanEmail,
              userData.password,
              userData.name,
              userData.role,
              {
                avatar: userData.avatar,
                gender: userData.gender,
                department: userData.department,
                territory: userData.territory,
                status: userData.status,
                phone: userData.phone,
              }
            );

            if (cloudRes.success) {
              supabaseUserId = cloudRes.userId;
            } else {
              cloudError = cloudRes.error;
              console.warn('Supabase create user error:', cloudRes.error);
            }
          } catch (e) {
            cloudError = e.message;
            console.warn('Cloud user register error:', e);
          }
        }

        const newUser = {
          id: supabaseUserId || `u-${Date.now()}`,
          password: userData.password || 'password123',
          avatar: userData.avatar || AVATAR_PRESETS.Male[0],
          status: 'Active',
          ...userData,
          email: cleanEmail,
        };

        const newLog = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: get().currentUser?.id || 'admin',
          userName: get().currentUser?.name || 'Admin',
          userRole: get().currentUser?.role || ROLES.ADMIN,
          action: 'Created User',
          entityType: 'User',
          entityId: newUser.id,
          details: `Created new user ${newUser.name} (${newUser.role}).`,
        };

        // Remove from deletedIds if this user was previously deleted
        const updatedDeletedIds = (get().deletedIds || []).filter(
          (d) => d !== cleanEmail && d !== newUser.id
        );

        set((state) => ({
          users: [newUser, ...(state.users || []).filter((u) => String(u?.email || '').toLowerCase().trim() !== cleanEmail)],
          deletedIds: updatedDeletedIds,
          activityLogs: [newLog, ...state.activityLogs],
        }));

        await pushToCloud(get());
        return { success: !cloudError, user: newUser, error: cloudError };
      },

      updateUser: (id, updatedFields) => {
        const newLog = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: get().currentUser?.id || 'admin',
          userName: get().currentUser?.name || 'Admin',
          userRole: get().currentUser?.role || ROLES.ADMIN,
          action: 'Updated User',
          entityType: 'User',
          entityId: id,
          details: `Updated details for user ID ${id}.`,
        };

        set((state) => ({
          users: state.users.map((u) => (u.id === id ? { ...u, ...updatedFields } : u)),
          currentUser:
            state.currentUser && state.currentUser.id === id
              ? { ...state.currentUser, ...updatedFields }
              : state.currentUser,
          activityLogs: [newLog, ...state.activityLogs],
        }));

        pushToCloud(get());
      },

      deleteUser: async (id) => {
        const target = (get().users || []).find((u) => u?.id === id);
        if (!target) return { success: false, error: 'User not found.' };

        if (String(target.email || '').toLowerCase().trim() === 'admin@tmi-erp.com') {
          return { success: false, error: 'Cannot delete the Primary System Administrator.' };
        }

        const targetEmail = String(target.email || '').toLowerCase().trim();
        const deletedSet = new Set(get().deletedIds || []);
        deletedSet.add(id);
        if (targetEmail) deletedSet.add(targetEmail);
        const newDeletedIds = Array.from(deletedSet);

        // Delete from Supabase profiles table
        if (isSupabaseConfigured) {
          try {
            await supabase.from('profiles').delete().eq('id', id);
            if (targetEmail) {
              await supabase.from('profiles').delete().eq('email', targetEmail);
            }
          } catch (e) {
            console.warn('Supabase delete profile notice:', e);
          }
        }

        const newLog = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: get().currentUser?.id || 'admin',
          userName: get().currentUser?.name || 'Admin',
          userRole: get().currentUser?.role || ROLES.ADMIN,
          action: 'Deleted User',
          entityType: 'User',
          entityId: id,
          details: `Deleted user ${target.name} (${target.email}).`,
        };

        set((state) => ({
          users: (state.users || []).filter(
            (u) => u?.id !== id && (!targetEmail || String(u?.email || '').toLowerCase().trim() !== targetEmail)
          ),
          deletedIds: newDeletedIds,
          activityLogs: [newLog, ...state.activityLogs],
        }));

        await pushToCloud(get());
        return { success: true };
      },

      // Actions - Navigation & Filter
      setActiveTab: (tab) => set({ activeTab: tab }),
      setSelectedEmployeeForDrawer: (emp) => set({ selectedEmployeeForDrawer: emp }),
      setIsFilterModalOpen: (isOpen) => set({ isFilterModalOpen: isOpen }),

      setFilter: (filterKey, value) =>
        set((state) => ({
          filters: { ...state.filters, [filterKey]: value },
        })),

      resetFilters: () =>
        set({
          filters: {
            datePreset: 'All',
            startDate: '',
            endDate: '',
            employeeId: 'All',
            customerId: 'All',
            productId: 'All',
            application: 'All',
            activityType: 'All',
            leadStage: 'All',
            status: 'All',
            priority: 'All',
            searchQuery: '',
          },
        }),

      // Actions - Visit Reports
      addVisitReport: (visitData) => {
        const newVisit = {
          id: `v-${Date.now()}`,
          date: visitData.date || new Date().toISOString().split('T')[0],
          salesEngineerId: visitData.salesEngineerId || get().currentUser.id,
          createdAt: new Date().toISOString(),
          attachments: visitData.attachments || [],
          ...visitData,
        };

        const newLog = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: get().currentUser.id,
          userName: get().currentUser.name,
          userRole: get().currentUser.role,
          action: 'Created Visit Report',
          entityType: 'Visit Report',
          entityId: newVisit.id,
          details: `Visit logged for ${newVisit.contactName} (${newVisit.leadStage}).`,
        };

        set((state) => ({
          visits: [newVisit, ...state.visits],
          activityLogs: [newLog, ...state.activityLogs],
        }));

        pushToCloud(get());
        return newVisit;
      },

      updateVisitReport: (id, updatedFields) => {
        set((state) => ({
          visits: state.visits.map((v) => (v.id === id ? { ...v, ...updatedFields } : v)),
        }));
        pushToCloud(get());
      },

      deleteVisitReport: (id) => {
        const newDeleted = Array.from(new Set([...(get().deletedIds || []), id]));
        set((state) => ({
          visits: state.visits.filter((v) => v.id !== id),
          deletedIds: newDeleted,
        }));
        pushToCloud(get());
      },

      // Actions - Office Work
      addOfficeWork: (workData) => {
        const newWork = {
          id: `ow-${Date.now()}`,
          date: workData.date || new Date().toISOString().split('T')[0],
          salesEngineerId: workData.salesEngineerId || get().currentUser.id,
          createdAt: new Date().toISOString(),
          ...workData,
        };

        const newLog = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: get().currentUser.id,
          userName: get().currentUser.name,
          userRole: get().currentUser.role,
          action: 'Logged Office Work',
          entityType: 'Office Work',
          entityId: newWork.id,
          details: `Office Work: ${newWork.type} - ${newWork.title}`,
        };

        set((state) => ({
          officeWorks: [newWork, ...state.officeWorks],
          activityLogs: [newLog, ...state.activityLogs],
        }));

        pushToCloud(get());
        return newWork;
      },

      updateOfficeWork: (id, updatedFields) => {
        set((state) => ({
          officeWorks: state.officeWorks.map((w) => (w.id === id ? { ...w, ...updatedFields } : w)),
        }));
        pushToCloud(get());
      },

      deleteOfficeWork: (id) => {
        const newDeleted = Array.from(new Set([...(get().deletedIds || []), id]));
        set((state) => ({
          officeWorks: state.officeWorks.filter((w) => w.id !== id),
          deletedIds: newDeleted,
        }));
        pushToCloud(get());
      },

      // Actions - KRA Activities
      addKraActivity: (kraData) => {
        const newKra = {
          id: `kra-${Date.now()}`,
          date: kraData.date || new Date().toISOString().split('T')[0],
          appEngineerId: kraData.appEngineerId || get().currentUser.id,
          createdAt: new Date().toISOString(),
          attachments: kraData.attachments || [],
          ...kraData,
        };

        const newLog = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: get().currentUser.id,
          userName: get().currentUser.name,
          userRole: get().currentUser.role,
          action: 'Logged KRA Activity',
          entityType: 'KRA Activity',
          entityId: newKra.id,
          details: `KRA [${newKra.category}] logged for product ID ${newKra.productId}.`,
        };

        set((state) => ({
          kraActivities: [newKra, ...state.kraActivities],
          activityLogs: [newLog, ...state.activityLogs],
        }));

        pushToCloud(get());
        return newKra;
      },

      updateKraActivity: (id, updatedFields) => {
        set((state) => ({
          kraActivities: state.kraActivities.map((k) =>
            k.id === id ? { ...k, ...updatedFields } : k
          ),
        }));
        pushToCloud(get());
      },

      deleteKraActivity: (id) => {
        const newDeleted = Array.from(new Set([...(get().deletedIds || []), id]));
        set((state) => ({
          kraActivities: state.kraActivities.filter((k) => k.id !== id),
          deletedIds: newDeleted,
        }));
        pushToCloud(get());
      },

      // Actions - PO Order Bookings
      addOrder: (orderData) => {
        const newOrder = {
          id: `po-${Date.now()}`,
          poDate: orderData.poDate || new Date().toISOString().split('T')[0],
          salesEngineerId: orderData.salesEngineerId || get().currentUser?.id,
          status: orderData.status || 'PO Received',
          attachments: orderData.attachments || [],
          createdAt: new Date().toISOString(),
          ...orderData,
          orderValue: parseFloat(orderData.orderValue) || 0,
        };

        const newLog = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: get().currentUser?.id || 'sys',
          userName: get().currentUser?.name || 'User',
          userRole: get().currentUser?.role || ROLES.SALES_ENGINEER,
          action: 'Booked Purchase Order',
          entityType: 'Order',
          entityId: newOrder.id,
          details: `PO #${newOrder.poNumber} booked for ₹${newOrder.orderValue}.`,
        };

        // Automatically reflect in Lead Pipeline
        let updatedVisits = [...get().visits];
        if (orderData.linkedLeadId) {
          updatedVisits = updatedVisits.map((v) =>
            v.id === orderData.linkedLeadId
              ? {
                  ...v,
                  leadStage: 'Won',
                  leadValue: newOrder.orderValue,
                  discussion: `${v.discussion || ''}\n[PO Booked: #${newOrder.poNumber} on ${newOrder.poDate}]`,
                  linkedPoId: newOrder.id,
                }
              : v
          );
        } else {
          const autoLead = {
            id: `v-po-${Date.now()}`,
            date: newOrder.poDate,
            salesEngineerId: newOrder.salesEngineerId,
            customerId: newOrder.customerId,
            productId: newOrder.productId,
            contactName: newOrder.contactPerson || 'Procurement Authority',
            application: `PO Booked: Ref #${newOrder.poNumber}`,
            budget: newOrder.orderValue,
            leadValue: newOrder.orderValue,
            discussion: `PO Received: #${newOrder.poNumber}. Scope: ${newOrder.scopeOfSupply || 'PO Booking'}. Payment: ${newOrder.paymentTerms || 'Standard'}`,
            leadStage: 'Won',
            followUpDate: newOrder.deliveryDate || '',
            nextAction: 'Order execution & dispatch',
            attachments: newOrder.attachments || [],
            linkedPoId: newOrder.id,
            createdAt: new Date().toISOString(),
          };
          updatedVisits = [autoLead, ...updatedVisits];
        }

        set((state) => ({
          orders: [newOrder, ...state.orders],
          visits: updatedVisits,
          activityLogs: [newLog, ...state.activityLogs],
        }));

        pushToCloud(get());
        return newOrder;
      },

      updateOrder: (id, updatedFields) => {
        set((state) => ({
          orders: state.orders.map((o) => (o.id === id ? { ...o, ...updatedFields } : o)),
        }));
        pushToCloud(get());
      },

      deleteOrder: (id) => {
        const newDeleted = Array.from(new Set([...(get().deletedIds || []), id]));
        set((state) => ({
          orders: state.orders.filter((o) => o.id !== id),
          deletedIds: newDeleted,
        }));
        pushToCloud(get());
      },

      // Actions - Task System
      addTask: (taskData) => {
        const newTask = {
          id: `t-${Date.now()}`,
          status: TASK_STATUSES.PENDING,
          assignedById: taskData.assignedById || get().currentUser.id,
          createdAt: new Date().toISOString(),
          attachments: taskData.attachments || [],
          completionNotes: '',
          ...taskData,
        };

        const newNotif = {
          id: `n-${Date.now()}`,
          title: `New Task Assigned: ${newTask.title}`,
          message: `${get().currentUser.name} assigned you a task due on ${newTask.dueDate}`,
          timestamp: new Date().toISOString(),
          type: 'task',
          read: false,
          targetUserId: newTask.assignedToId,
        };

        const newLog = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: get().currentUser.id,
          userName: get().currentUser.name,
          userRole: get().currentUser.role,
          action: 'Assigned Task',
          entityType: 'Task',
          entityId: newTask.id,
          details: `Task assigned to user ID ${newTask.assignedToId}.`,
        };

        set((state) => ({
          tasks: [newTask, ...state.tasks],
          notifications: [newNotif, ...state.notifications],
          activityLogs: [newLog, ...state.activityLogs],
        }));

        pushToCloud(get());
        return newTask;
      },

      updateTaskStatus: (id, status, notes = '', attachments = []) => {
        const existingTask = get().tasks.find((t) => t.id === id);
        if (!existingTask) return;

        const updatedTask = {
          ...existingTask,
          status,
          completionNotes: notes || existingTask.completionNotes,
          attachments: attachments.length ? [...existingTask.attachments, ...attachments] : existingTask.attachments,
          completedAt: status === TASK_STATUSES.COMPLETED ? new Date().toISOString() : existingTask.completedAt,
        };

        const newLog = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: get().currentUser.id,
          userName: get().currentUser.name,
          userRole: get().currentUser.role,
          action: `Task Status -> ${status}`,
          entityType: 'Task',
          entityId: id,
          details: `Task "${existingTask.title}" marked as ${status}.`,
        };

        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
          activityLogs: [newLog, ...state.activityLogs],
        }));

        pushToCloud(get());
      },

      deleteTask: (id) => {
        const newDeleted = Array.from(new Set([...(get().deletedIds || []), id]));
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
          deletedIds: newDeleted,
        }));
        pushToCloud(get());
      },

      // Actions - Customer Master CRUD
      addCustomer: (customerData) => {
        const newCustomer = {
          id: `cust-${Date.now()}`,
          createdDate: new Date().toISOString(),
          ...customerData,
        };
        set((state) => ({
          customers: [newCustomer, ...state.customers],
        }));
        pushToCloud(get());
        return newCustomer;
      },

      updateCustomer: (id, updatedFields) => {
        set((state) => ({
          customers: state.customers.map((c) => (c.id === id ? { ...c, ...updatedFields } : c)),
        }));
        pushToCloud(get());
      },

      deleteCustomer: (id) => {
        const newDeleted = Array.from(new Set([...(get().deletedIds || []), id]));
        set((state) => ({
          customers: state.customers.filter((c) => c.id !== id),
          deletedIds: newDeleted,
        }));
        pushToCloud(get());
      },

      // Actions - Product Master CRUD
      addProduct: (productData) => {
        const newProduct = {
          id: `prod-${Date.now()}`,
          ...productData,
        };
        set((state) => ({
          products: [newProduct, ...state.products],
        }));
        pushToCloud(get());
        return newProduct;
      },

      updateProduct: (id, updatedFields) => {
        set((state) => ({
          products: state.products.map((p) => (p.id === id ? { ...p, ...updatedFields } : p)),
        }));
        pushToCloud(get());
      },

      deleteProduct: (id) => {
        const newDeleted = Array.from(new Set([...(get().deletedIds || []), id]));
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
          deletedIds: newDeleted,
        }));
        pushToCloud(get());
      },

      // Notifications Action
      markNotificationAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },

      clearAllNotifications: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }));
      },

      // Initialize Fresh Production System (clears sample data, keeps admin user)
      initializeFreshProductionSystem: async () => {
        const currentAdmin = get().currentUser || INITIAL_USERS[0];
        const freshAdmin = {
          ...currentAdmin,
          id: currentAdmin.id || 'u-admin-super',
          role: ROLES.ADMIN,
          email: currentAdmin.email || 'admin@tmi-erp.com',
          name: currentAdmin.name || 'Primary System Administrator',
          password: currentAdmin.password || 'Admin@2026!#',
        };

        const freshState = {
          users: [freshAdmin],
          customers: [],
          products: [],
          visits: [],
          officeWorks: [],
          kraActivities: [],
          tasks: [],
          orders: [],
          notifications: [
            {
              id: `notif-${Date.now()}`,
              timestamp: new Date().toISOString(),
              title: 'Production ERP Initialized',
              message: 'System has been initialized for fresh production use. All demo records cleared.',
              read: false,
              type: 'system',
            },
          ],
          activityLogs: [
            {
              id: `log-${Date.now()}`,
              timestamp: new Date().toISOString(),
              userId: freshAdmin.id,
              userName: freshAdmin.name,
              userRole: ROLES.ADMIN,
              action: 'Initialized Fresh Production ERP',
              entityType: 'System',
              entityId: 'root',
              details: 'Cleared all demo data and initialized clean production database.',
            },
          ],
          deletedIds: [],
          currentUser: freshAdmin,
          isAuthenticated: true,
          activeTab: 'dashboard',
        };

        // If Supabase is configured, delete non-admin profiles from Supabase profiles table
        if (isSupabaseConfigured) {
          try {
            await supabase.from('profiles').delete().neq('email', 'admin@tmi-erp.com');
          } catch (e) {
            console.warn('Profiles cleanup notice on fresh start:', e);
          }
        }

        set(freshState);
        // Force overwrite cloud so old demo data is not merged back!
        await pushToCloud(get(), { forceOverwrite: true });
      },

      // Reset System to Seed Data
      resetToSeedData: async () => {
        set({
          users: INITIAL_USERS,
          customers: INITIAL_CUSTOMERS,
          products: INITIAL_PRODUCTS,
          visits: INITIAL_VISITS,
          officeWorks: INITIAL_OFFICE_WORK,
          kraActivities: INITIAL_KRA_ACTIVITIES,
          tasks: INITIAL_TASKS,
          orders: INITIAL_ORDERS || [],
          notifications: INITIAL_NOTIFICATIONS,
          activityLogs: INITIAL_ACTIVITY_LOGS,
          deletedIds: [],
          activeTab: 'dashboard',
        });
        await pushToCloud(get(), { forceOverwrite: true });
      },
    }),
    {
      name: 'tmi-erp-storage-v7',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
