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

      // Actions - Authentication
      login: (email, password) => {
        const found = get().users.find(
          (u) =>
            u.email.toLowerCase() === email.toLowerCase() &&
            u.password === password
        );
        if (found) {
          let defaultTab = 'dashboard';
          if (found.role === ROLES.SALES_ENGINEER) defaultTab = 'dashboard_se';
          if (found.role === ROLES.APPLICATION_ENGINEER) defaultTab = 'dashboard_ae';

          set({ currentUser: found, isAuthenticated: true, activeTab: defaultTab });
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
          currentUser: state.currentUser && state.currentUser.id === userId ? { ...state.currentUser, password: newPassword } : state.currentUser,
        }));

        return { success: true };
      },

      logout: () => {
        set({ isAuthenticated: false, currentUser: null, activeTab: 'dashboard' });
      },

      setCurrentUser: (user) => set({ currentUser: user, isAuthenticated: true }),

      // Initialize Fresh Production Mode (Wipes sample demo data for real company deployment)
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

        set({
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
            }
          ],
          currentUser: primaryAdmin,
          isAuthenticated: true,
          activeTab: 'dashboard',
        });
      },

      // Actions - Admin User Management (CRUD)
      addUser: (userData) => {
        const newUser = {
          id: `u-${Date.now()}`,
          password: userData.password || 'password123',
          avatar: userData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userData.name)}`,
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
          users: [newUser, ...state.users],
          activityLogs: [newLog, ...state.activityLogs],
        }));

        return newUser;
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
          currentUser: state.currentUser && state.currentUser.id === id ? { ...state.currentUser, ...updatedFields } : state.currentUser,
          activityLogs: [newLog, ...state.activityLogs],
        }));
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

        return newVisit;
      },

      updateVisitReport: (id, updatedFields) => {
        set((state) => ({
          visits: state.visits.map((v) => (v.id === id ? { ...v, ...updatedFields } : v)),
        }));
      },

      deleteVisitReport: (id) => {
        set((state) => ({
          visits: state.visits.filter((v) => v.id !== id),
        }));
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

        return newWork;
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

        return newKra;
      },

      updateKraActivity: (id, updatedFields) => {
        set((state) => ({
          kraActivities: state.kraActivities.map((k) =>
            k.id === id ? { ...k, ...updatedFields } : k
          ),
        }));
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
          // Auto-generate Won Lead in pipeline for this PO
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

        return newOrder;
      },

      updateOrder: (id, updatedFields) => {
        set((state) => ({
          orders: state.orders.map((o) => (o.id === id ? { ...o, ...updatedFields } : o)),
        }));
      },

      deleteOrder: (id) => {
        set((state) => ({
          orders: state.orders.filter((o) => o.id !== id),
        }));
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
        return newCustomer;
      },

      updateCustomer: (id, updatedFields) => {
        set((state) => ({
          customers: state.customers.map((c) => (c.id === id ? { ...c, ...updatedFields } : c)),
        }));
      },

      deleteCustomer: (id) => {
        set((state) => ({
          customers: state.customers.filter((c) => c.id !== id),
        }));
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
        return newProduct;
      },

      updateProduct: (id, updatedFields) => {
        set((state) => ({
          products: state.products.map((p) => (p.id === id ? { ...p, ...updatedFields } : p)),
        }));
      },

      deleteProduct: (id) => {
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        }));
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
      },
    }),
    {
      name: 'tmi-erp-storage-v6',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
