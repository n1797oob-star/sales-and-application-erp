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

// Helper to safely merge arrays by ID without losing records created across multiple devices
const mergeById = (cloudArr = [], localArr = []) => {
  const map = new Map();
  (cloudArr || []).forEach((item) => {
    if (item && item.id) map.set(item.id, item);
  });
  (localArr || []).forEach((item) => {
    if (item && item.id) {
      const existing = map.get(item.id);
      map.set(item.id, existing ? { ...existing, ...item } : item);
    }
  });
  return Array.from(map.values());
};

// Push universal state to Supabase so all laptops see the exact same data without overwriting each other
const pushToCloud = async (state) => {
  if (!isSupabaseConfigured) return;
  try {
    // 1. Fetch latest cloud state first to safely merge
    const { data: cloudRow, error: fetchErr } = await supabase
      .from('erp_shared_data')
      .select('data')
      .eq('id', 'global_data')
      .single();

    if (fetchErr && (fetchErr.code === '42P01' || fetchErr.message?.includes('relation "erp_shared_data" does not exist'))) {
      console.warn('⚠️ Supabase table "erp_shared_data" does not exist yet. Please run supabase_setup.sql in your Supabase SQL editor.');
      useAppStore.setState({ cloudSyncStatus: 'table_missing' });
      return;
    }

    const cloudData = cloudRow?.data || {};

    // 2. Merge cloud and local data safely
    const mergedKraActivities = mergeById(cloudData.kraActivities, state.kraActivities);
    const mergedVisits = mergeById(cloudData.visits, state.visits);
    const mergedOfficeWorks = mergeById(cloudData.officeWorks, state.officeWorks);
    const mergedTasks = mergeById(cloudData.tasks, state.tasks);
    const mergedOrders = mergeById(cloudData.orders, state.orders);
    const mergedCustomers = mergeById(cloudData.customers, state.customers);
    const mergedProducts = mergeById(cloudData.products, state.products);
    const mergedUsers = mergeById(cloudData.users, state.users);

    const payload = {
      users: mergedUsers,
      customers: mergedCustomers,
      products: mergedProducts,
      visits: mergedVisits,
      officeWorks: mergedOfficeWorks,
      kraActivities: mergedKraActivities,
      tasks: mergedTasks,
      orders: mergedOrders,
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
                      set((state) => ({
                        users: mergeById(cloud.users, state.users),
                        customers: mergeById(cloud.customers, state.customers),
                        products: mergeById(cloud.products, state.products),
                        visits: mergeById(cloud.visits, state.visits),
                        officeWorks: mergeById(cloud.officeWorks, state.officeWorks),
                        kraActivities: mergeById(cloud.kraActivities, state.kraActivities),
                        tasks: mergeById(cloud.tasks, state.tasks),
                        orders: mergeById(cloud.orders, state.orders),
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

            let matchedUser = get().users.find((u) => u.email?.toLowerCase() === email);

            // NEVER default an arbitrary non-admin user to ROLES.ADMIN!
            let rawRole =
              metaRole ||
              (matchedUser?.role && normalizeRole(matchedUser.role) !== ROLES.ADMIN ? matchedUser.role : null) ||
              (email === 'admin@tmi-erp.com' ? ROLES.ADMIN : ROLES.APPLICATION_ENGINEER);

            if (email !== 'admin@tmi-erp.com' && normalizeRole(rawRole) === ROLES.ADMIN) {
              rawRole = metaRole || ROLES.APPLICATION_ENGINEER;
            }

            const resolvedRole = normalizeRole(rawRole);

            const defaultDept =
              resolvedRole === ROLES.APPLICATION_ENGINEER
                ? 'Application Engineering'
                : resolvedRole === ROLES.SALES_ENGINEER
                ? 'Sales & Marketing'
                : 'Executive Board';

            const userObj = {
              id: session.user.id,
              name: matchedUser?.name || metaName || email.split('@')[0],
              email: email,
              role: resolvedRole,
              avatar: matchedUser?.avatar || session.user.user_metadata?.avatar_url || AVATAR_PRESETS.Male[0],
              gender: matchedUser?.gender || session.user.user_metadata?.gender || 'Male',
              department: matchedUser?.department || metaDept || defaultDept,
              territory: matchedUser?.territory || session.user.user_metadata?.territory || 'Pan-India',
              phone: matchedUser?.phone || session.user.user_metadata?.phone || '',
              status: 'Active',
            };

            let defaultTab = 'dashboard';
            if (userObj.role === ROLES.SALES_ENGINEER) defaultTab = 'dashboard_se';
            if (userObj.role === ROLES.APPLICATION_ENGINEER) defaultTab = 'dashboard_ae';

            set((state) => ({
              currentUser: userObj,
              isAuthenticated: true,
              activeTab: state.activeTab === 'dashboard' ? defaultTab : state.activeTab,
              users: [userObj, ...state.users.filter((u) => u.email?.toLowerCase() !== email && u.id !== userObj.id)],
            }));
          }

          // 5. Auth state change listener
          supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
              const email = (session.user.email || '').toLowerCase();
              const metaRole = session.user.user_metadata?.role;
              const metaName = session.user.user_metadata?.full_name;
              const metaDept = session.user.user_metadata?.department;

              let matchedUser = get().users.find((u) => u.email?.toLowerCase() === email);

              let rawRole =
                metaRole ||
                (matchedUser?.role && normalizeRole(matchedUser.role) !== ROLES.ADMIN ? matchedUser.role : null) ||
                (email === 'admin@tmi-erp.com' ? ROLES.ADMIN : ROLES.APPLICATION_ENGINEER);

              if (email !== 'admin@tmi-erp.com' && normalizeRole(rawRole) === ROLES.ADMIN) {
                rawRole = metaRole || ROLES.APPLICATION_ENGINEER;
              }

              const resolvedRole = normalizeRole(rawRole);

              const defaultDept =
                resolvedRole === ROLES.APPLICATION_ENGINEER
                  ? 'Application Engineering'
                  : resolvedRole === ROLES.SALES_ENGINEER
                  ? 'Sales & Marketing'
                  : 'Executive Board';

              const userObj = {
                id: session.user.id,
                name: matchedUser?.name || metaName || email.split('@')[0],
                email: email,
                role: resolvedRole,
                avatar: matchedUser?.avatar || session.user.user_metadata?.avatar_url || AVATAR_PRESETS.Male[0],
                gender: matchedUser?.gender || session.user.user_metadata?.gender || 'Male',
                department: matchedUser?.department || metaDept || defaultDept,
                territory: matchedUser?.territory || session.user.user_metadata?.territory || 'Pan-India',
                phone: matchedUser?.phone || session.user.user_metadata?.phone || '',
                status: 'Active',
              };

              let defaultTab = 'dashboard';
              if (userObj.role === ROLES.SALES_ENGINEER) defaultTab = 'dashboard_se';
              if (userObj.role === ROLES.APPLICATION_ENGINEER) defaultTab = 'dashboard_ae';

              set((state) => ({
                currentUser: userObj,
                isAuthenticated: true,
                activeTab: state.activeTab === 'dashboard' ? defaultTab : state.activeTab,
                users: [userObj, ...state.users.filter((u) => u.email?.toLowerCase() !== email && u.id !== userObj.id)],
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
          // 1. Fetch profiles from Supabase if table exists
          const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
          if (!pError && Array.isArray(profiles) && profiles.length > 0) {
            set((state) => {
              const updatedUsers = [...state.users];
              profiles.forEach((p) => {
                const existingIndex = updatedUsers.findIndex(
                  (u) => u.id === p.id || (p.email && u.email?.toLowerCase() === p.email?.toLowerCase())
                );
                if (existingIndex >= 0) {
                  updatedUsers[existingIndex] = {
                    ...updatedUsers[existingIndex],
                    ...p,
                    name: p.name || updatedUsers[existingIndex].name,
                    role: p.role || updatedUsers[existingIndex].role,
                  };
                } else {
                  updatedUsers.push({
                    id: p.id,
                    name: p.name || 'User',
                    email: p.email || '',
                    role: p.role || ROLES.APPLICATION_ENGINEER,
                    avatar: p.avatar || AVATAR_PRESETS.Male[0],
                    gender: p.gender || 'Male',
                    department: p.department || (p.role === ROLES.APPLICATION_ENGINEER ? 'Application Engineering' : 'Sales Engineering'),
                    territory: p.territory || 'Pan-India',
                    status: p.status || 'Active',
                    password: 'password123',
                  });
                }
              });
              return { users: updatedUsers };
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
            set((state) => ({
              users: mergeById(cloud.users, state.users),
              customers: mergeById(cloud.customers, state.customers),
              products: mergeById(cloud.products, state.products),
              visits: mergeById(cloud.visits, state.visits),
              officeWorks: mergeById(cloud.officeWorks, state.officeWorks),
              kraActivities: mergeById(cloud.kraActivities, state.kraActivities),
              tasks: mergeById(cloud.tasks, state.tasks),
              orders: mergeById(cloud.orders, state.orders),
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
              } catch (e) {
                // profiles query error is safe to ignore
              }

              const metaRole = authUser.user_metadata?.role;
              const metaName = authUser.user_metadata?.full_name;
              const metaDept = authUser.user_metadata?.department;
              const metaAvatar = authUser.user_metadata?.avatar_url;
              const metaGender = authUser.user_metadata?.gender;
              const metaTerritory = authUser.user_metadata?.territory;
              const metaPhone = authUser.user_metadata?.phone;

              let existingUser = get().users.find((u) => u.email?.toLowerCase() === cleanEmail);

              // Accurately determine role - NEVER default an engineer to Admin!
              let rawRole =
                profile?.role ||
                metaRole ||
                (existingUser?.role && normalizeRole(existingUser.role) !== ROLES.ADMIN ? existingUser.role : null) ||
                (cleanEmail === 'admin@tmi-erp.com' ? ROLES.ADMIN : ROLES.APPLICATION_ENGINEER);

              // If cleanEmail is NOT admin@tmi-erp.com and was mistakenly saved as ADMIN, repair it
              if (cleanEmail !== 'admin@tmi-erp.com' && normalizeRole(rawRole) === ROLES.ADMIN) {
                rawRole = metaRole || ROLES.APPLICATION_ENGINEER;
              }

              const resolvedRole = normalizeRole(rawRole);

              const defaultDept =
                resolvedRole === ROLES.APPLICATION_ENGINEER
                  ? 'Application Engineering'
                  : resolvedRole === ROLES.SALES_ENGINEER
                  ? 'Sales & Marketing'
                  : 'Executive Board';

              const user = {
                id: authUser.id,
                name: profile?.name || metaName || existingUser?.name || cleanEmail.split('@')[0],
                email: cleanEmail,
                role: resolvedRole,
                avatar: profile?.avatar || metaAvatar || existingUser?.avatar || AVATAR_PRESETS.Male[0],
                gender: profile?.gender || metaGender || existingUser?.gender || 'Male',
                department: profile?.department || metaDept || existingUser?.department || defaultDept,
                territory: profile?.territory || metaTerritory || existingUser?.territory || 'Pan-India',
                phone: profile?.phone || metaPhone || existingUser?.phone || '',
                status: 'Active',
              };

              let defaultTab = 'dashboard';
              if (user.role === ROLES.SALES_ENGINEER) defaultTab = 'dashboard_se';
              if (user.role === ROLES.APPLICATION_ENGINEER) defaultTab = 'dashboard_ae';

              set((state) => ({
                currentUser: user,
                isAuthenticated: true,
                activeTab: defaultTab,
                users: [user, ...state.users.filter((u) => u.email?.toLowerCase() !== cleanEmail && u.id !== user.id)],
              }));

              await pushToCloud(get());
              return { success: true, user };
            }
          } catch (err) {
            console.debug('Supabase signIn notice:', err);
          }
        }

        // 2. Check local/seed users (guarantees Admin@2026!# and admin@tmi-erp.com always work)
        let found = get().users.find(
          (u) =>
            u.email.toLowerCase() === cleanEmail &&
            u.password === cleanPassword
        );

        // Fallback check for default administrator if users array got altered
        if (!found && cleanEmail === 'admin@tmi-erp.com' && (cleanPassword === 'Admin@2026!#' || cleanPassword === 'admin123')) {
          found = INITIAL_USERS[0];
          set((state) => ({ users: [found, ...state.users.filter((u) => u.email.toLowerCase() !== cleanEmail)] }));
        }

        if (found) {
          // If non-admin user was previously corrupted into ADMIN, repair it
          let role = normalizeRole(found.role);
          if (found.email.toLowerCase() !== 'admin@tmi-erp.com' && role === ROLES.ADMIN) {
            role = ROLES.APPLICATION_ENGINEER;
          }
          found = { ...found, role };

          let defaultTab = 'dashboard';
          if (role === ROLES.SALES_ENGINEER) defaultTab = 'dashboard_se';
          if (role === ROLES.APPLICATION_ENGINEER) defaultTab = 'dashboard_ae';

          set({ currentUser: found, isAuthenticated: true, activeTab: defaultTab });
          get().syncFromCloud();
          return { success: true, user: found };
        }

        return { success: false, error: 'Invalid email or password credentials.' };
      },

      changePassword: (userId, oldPassword, newPassword) => {
        const target = get().users.find((u) => u.id === userId);
        if (!target) return { success: false, error: 'User not found.' };

        if (target.password !== oldPassword) {
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

      // Initialize Fresh Production Mode
      initializeFreshProductionSystem: () => {
        const primaryAdmin = {
          id: 'u-admin-super',
          name: 'Primary System Administrator',
          email: 'admin@tmi-erp.com',
          password: 'Admin@2026!#',
          gender: 'Male',
          role: ROLES.ADMIN,
          phone: '+91 98765 00000',
          avatar: AVATAR_PRESETS.Male[0],
          department: 'Executive System Administration',
          territory: 'Pan-India',
          status: 'Active',
        };

        const newState = {
          users: [primaryAdmin],
          customers: [],
          products: [],
          visits: [],
          officeWorks: [],
          kraActivities: [],
          tasks: [],
          orders: [],
          notifications: [],
          activityLogs: [
            {
              id: `log-${Date.now()}`,
              timestamp: new Date().toISOString(),
              userId: primaryAdmin.id,
              userName: primaryAdmin.name,
              userRole: ROLES.ADMIN,
              action: 'Initialized Fresh Production System',
              entityType: 'System',
              entityId: 'sys-1',
              details: 'Cleared sample demo data. Initialized clean production ERP environment.',
            },
          ],
          currentUser: primaryAdmin,
          isAuthenticated: true,
          activeTab: 'dashboard',
        };

        set(newState);
        pushToCloud(get());
      },

      // Actions - Admin User Management (CRUD)
      addUser: async (userData) => {
        let supabaseUserId = null;
        let cloudError = null;

        // Register user in Supabase Auth & profiles table without logging out admin
        if (isSupabaseConfigured && userData.email && userData.password) {
          try {
            const cloudRes = await createAdminUser(
              userData.email,
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

        set((state) => ({
          users: [newUser, ...state.users.filter((u) => u.email.toLowerCase() !== newUser.email.toLowerCase())],
          activityLogs: [newLog, ...state.activityLogs],
        }));

        pushToCloud(get());
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

      deleteUser: (id) => {
        const target = get().users.find((u) => u.id === id);
        if (!target) return;

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
          users: state.users.filter((u) => u.id !== id),
          activityLogs: [newLog, ...state.activityLogs],
        }));

        pushToCloud(get());
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
        set((state) => ({
          visits: state.visits.filter((v) => v.id !== id),
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
        set((state) => ({
          officeWorks: state.officeWorks.filter((w) => w.id !== id),
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
        set((state) => ({
          kraActivities: state.kraActivities.filter((k) => k.id !== id),
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
        set((state) => ({
          orders: state.orders.filter((o) => o.id !== id),
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
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
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
        set((state) => ({
          customers: state.customers.filter((c) => c.id !== id),
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
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
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

      // Reset System to Seed Data
      resetToSeedData: () => {
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
        });
        pushToCloud(get());
      },
    }),
    {
      name: 'tmi-erp-storage-v7',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
