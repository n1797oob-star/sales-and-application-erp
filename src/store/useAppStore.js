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
import { ROLES, TASK_STATUSES } from '../types';
import { supabase, isSupabaseConfigured, createAdminUser } from '../lib/supabase';

// Helper to push universal state to Supabase so all laptops see the exact same data
const pushToCloud = async (state) => {
  if (!isSupabaseConfigured) return;
  try {
    const payload = {
      users: state.users,
      customers: state.customers,
      products: state.products,
      visits: state.visits,
      officeWorks: state.officeWorks,
      kraActivities: state.kraActivities,
      tasks: state.tasks,
      orders: state.orders,
      updated_at: new Date().toISOString(),
    };
    await supabase.from('erp_shared_data').upsert({ id: 'global_data', data: payload });
  } catch (err) {
    // Silently continue if cloud table is not set up yet
    console.debug('Cloud sync notice:', err);
  }
};

export const useAppStore = create(
  persist(
    (set, get) => ({
      // Authentication State
      isAuthenticated: false,
      currentUser: null,

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
          // 1. Pull cloud data if available
          await get().syncFromCloud();

          // 2. Check Supabase auth session
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && !get().isAuthenticated) {
            const email = session.user.email;
            let matchedUser = get().users.find((u) => u.email.toLowerCase() === email?.toLowerCase());
            if (!matchedUser) {
              matchedUser = {
                id: session.user.id,
                name: session.user.user_metadata?.full_name || email?.split('@')[0] || 'User',
                email: email,
                role: session.user.user_metadata?.role || ROLES.ADMIN,
                avatar: session.user.user_metadata?.avatar_url || AVATAR_PRESETS.Male[0],
                gender: 'Male',
                department: 'Executive Board',
                territory: 'Pan-India',
                status: 'Active',
              };
            }
            set({ currentUser: matchedUser, isAuthenticated: true });
          }

          // 3. Listen for auth changes
          supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
              const email = session.user.email;
              const matchedUser = get().users.find((u) => u.email.toLowerCase() === email?.toLowerCase());
              if (matchedUser) {
                set({ currentUser: matchedUser, isAuthenticated: true });
              }
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
          // 1. Fetch profiles from Supabase so all laptops immediately see all users
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
                    role: p.role || ROLES.SALES_ENGINEER,
                    avatar: p.avatar || AVATAR_PRESETS.Male[0],
                    gender: p.gender || 'Male',
                    department: p.department || 'Sales & App Engineering',
                    territory: p.territory || 'Pan-India',
                    status: p.status || 'Active',
                    password: 'password123',
                  });
                }
              });
              return { users: updatedUsers };
            });
          }

          // 2. Fetch shared ERP state if erp_shared_data table is created
          const { data, error } = await supabase
            .from('erp_shared_data')
            .select('data')
            .eq('id', 'global_data')
            .single();

          if (!error && data?.data) {
            const cloud = data.data;
            set((state) => ({
              customers: cloud.customers !== undefined ? cloud.customers : state.customers,
              products: cloud.products !== undefined ? cloud.products : state.products,
              visits: cloud.visits !== undefined ? cloud.visits : state.visits,
              officeWorks: cloud.officeWorks !== undefined ? cloud.officeWorks : state.officeWorks,
              kraActivities: cloud.kraActivities !== undefined ? cloud.kraActivities : state.kraActivities,
              tasks: cloud.tasks !== undefined ? cloud.tasks : state.tasks,
              orders: cloud.orders !== undefined ? cloud.orders : state.orders,
            }));
          }
        } catch (err) {
          console.debug('SyncFromCloud notice:', err);
        }
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
              await get().syncFromCloud();

              let user = get().users.find((u) => u.email.toLowerCase() === cleanEmail);
              if (!user) {
                // Try fetching profile from profiles table
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', data.session.user.id)
                  .single();

                user = {
                  id: data.session.user.id,
                  name: profile?.name || data.session.user.user_metadata?.full_name || cleanEmail.split('@')[0],
                  email: cleanEmail,
                  role: profile?.role || ROLES.ADMIN,
                  avatar: profile?.avatar || AVATAR_PRESETS.Male[0],
                  gender: profile?.gender || 'Male',
                  department: profile?.department || 'Executive Board',
                  territory: profile?.territory || 'Pan-India',
                  status: 'Active',
                };
                set((state) => ({ users: [user, ...state.users.filter((u) => u.email.toLowerCase() !== cleanEmail)] }));
              }

              let defaultTab = 'dashboard';
              if (user.role === ROLES.SALES_ENGINEER) defaultTab = 'dashboard_se';
              if (user.role === ROLES.APPLICATION_ENGINEER) defaultTab = 'dashboard_ae';

              set({ currentUser: user, isAuthenticated: true, activeTab: defaultTab });
              pushToCloud(get());
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
          let defaultTab = 'dashboard';
          if (found.role === ROLES.SALES_ENGINEER) defaultTab = 'dashboard_se';
          if (found.role === ROLES.APPLICATION_ENGINEER) defaultTab = 'dashboard_ae';

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
