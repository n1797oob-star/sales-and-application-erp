import { ROLES } from '../types';

export const isWithinDatePreset = (dateStr, datePreset, startDate, endDate) => {
  if (!dateStr || datePreset === 'All') return true;

  const rawDateStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const parts = rawDateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return true;
  const [year, month, day] = parts;

  // Set target to local noon to avoid DST/TZ edge cases
  const targetDate = new Date(year, month - 1, day, 12, 0, 0);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);

  if (datePreset === 'Today') {
    return (
      targetDate.getFullYear() === today.getFullYear() &&
      targetDate.getMonth() === today.getMonth() &&
      targetDate.getDate() === today.getDate()
    );
  }

  if (datePreset === 'Yesterday') {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return (
      targetDate.getFullYear() === yesterday.getFullYear() &&
      targetDate.getMonth() === yesterday.getMonth() &&
      targetDate.getDate() === yesterday.getDate()
    );
  }

  if (datePreset === 'This Week') {
    // Current Monday to Sunday (full calendar week)
    const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday ...
    const distToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + distToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return targetDate >= monday && targetDate <= sunday;
  }

  if (datePreset === 'This Month') {
    // Current calendar month (1st through last day)
    return (
      targetDate.getFullYear() === today.getFullYear() &&
      targetDate.getMonth() === today.getMonth()
    );
  }

  if (datePreset === 'This Quarter') {
    const currentQuarter = Math.floor(today.getMonth() / 3);
    const targetQuarter = Math.floor(targetDate.getMonth() / 3);
    return (
      targetDate.getFullYear() === today.getFullYear() &&
      targetQuarter === currentQuarter
    );
  }

  if (datePreset === 'Custom') {
    if (startDate) {
      const [sY, sM, sD] = startDate.split('-').map(Number);
      if (sY && sM && sD) {
        const start = new Date(sY, sM - 1, sD, 0, 0, 0);
        if (targetDate < start) return false;
      }
    }
    if (endDate) {
      const [eY, eM, eD] = endDate.split('-').map(Number);
      if (eY && eM && eD) {
        const end = new Date(eY, eM - 1, eD, 23, 59, 59);
        if (targetDate > end) return false;
      }
    }
    return true;
  }

  return true;
};

// Filter Visits with deep search (customer name, product name/model, engineer name)
export const filterVisits = (visits, filters = {}, currentUser = null, customers = [], products = [], users = []) => {
  if (!Array.isArray(visits)) return [];
  filters = filters || {};

  // Collect ALL IDs that belong to the current user (handles old local IDs vs Supabase UUIDs)
  const currentUserIds = new Set();
  if (currentUser?.id) currentUserIds.add(currentUser.id);
  if (currentUser?.email) {
    users.forEach((u) => {
      if (u.email?.toLowerCase() === currentUser.email?.toLowerCase() && u.id) {
        currentUserIds.add(u.id);
      }
    });
  }

  return visits.filter((v) => {
    // Sales Engineer restricted to own visits — match by any known ID for this user
    if (currentUser && currentUser.role === ROLES.SALES_ENGINEER && !currentUserIds.has(v.salesEngineerId)) {
      return false;
    }

    if (!isWithinDatePreset(v.date, filters.datePreset, filters.startDate, filters.endDate)) return false;
    if (filters.employeeId && filters.employeeId !== 'All' && v.salesEngineerId !== filters.employeeId) return false;
    if (filters.customerId && filters.customerId !== 'All' && v.customerId !== filters.customerId) return false;
    if (filters.productId && filters.productId !== 'All' && v.productId !== filters.productId) return false;
    if (filters.leadStage && filters.leadStage !== 'All' && v.leadStage !== filters.leadStage) return false;

    if (filters.application && filters.application !== 'All' && v.application && !v.application.toLowerCase().includes(filters.application.toLowerCase())) {
      return false;
    }

    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase().trim();
      const cust = customers.find((c) => c.id === v.customerId);
      const prod = products.find((p) => p.id === v.productId);
      const eng = users.find((u) => u.id === v.salesEngineerId);

      const match =
        (v.contactName && v.contactName.toLowerCase().includes(q)) ||
        (v.application && v.application.toLowerCase().includes(q)) ||
        (v.discussion && v.discussion.toLowerCase().includes(q)) ||
        (v.nextAction && v.nextAction.toLowerCase().includes(q)) ||
        (v.leadStage && v.leadStage.toLowerCase().includes(q)) ||
        (cust?.name && cust.name.toLowerCase().includes(q)) ||
        (prod?.name && prod.name.toLowerCase().includes(q)) ||
        (prod?.modelNumber && prod.modelNumber.toLowerCase().includes(q)) ||
        (eng?.name && eng.name.toLowerCase().includes(q));

      if (!match) return false;
    }

    return true;
  });
};

// Filter Office Works with deep search
export const filterOfficeWorks = (works, filters = {}, currentUser = null, customers = [], users = []) => {
  if (!Array.isArray(works)) return [];
  filters = filters || {};

  // Collect ALL IDs that belong to the current user
  const currentUserIds = new Set();
  if (currentUser?.id) currentUserIds.add(currentUser.id);
  if (currentUser?.email) {
    users.forEach((u) => {
      if (u.email?.toLowerCase() === currentUser.email?.toLowerCase() && u.id) {
        currentUserIds.add(u.id);
      }
    });
  }

  return works.filter((w) => {
    if (currentUser && currentUser.role === ROLES.SALES_ENGINEER && !currentUserIds.has(w.salesEngineerId)) {
      return false;
    }

    if (!isWithinDatePreset(w.date, filters.datePreset, filters.startDate, filters.endDate)) return false;
    if (filters.employeeId && filters.employeeId !== 'All' && w.salesEngineerId !== filters.employeeId) return false;
    if (filters.customerId && filters.customerId !== 'All' && w.customerId !== filters.customerId) return false;

    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase().trim();
      const cust = customers.find((c) => c.id === w.customerId);
      const eng = users.find((u) => u.id === w.salesEngineerId);

      const match =
        (w.title && w.title.toLowerCase().includes(q)) ||
        (w.type && w.type.toLowerCase().includes(q)) ||
        (w.notes && w.notes.toLowerCase().includes(q)) ||
        (cust?.name && cust.name.toLowerCase().includes(q)) ||
        (eng?.name && eng.name.toLowerCase().includes(q));

      if (!match) return false;
    }

    return true;
  });
};

// Filter KRA Activities with deep search
export const filterKras = (kras, filters = {}, currentUser = null, customers = [], products = [], users = []) => {
  if (!Array.isArray(kras)) return [];
  filters = filters || {};

  // Collect ALL IDs that belong to the current user (handles old local IDs vs Supabase UUIDs)
  const currentUserIds = new Set();
  if (currentUser?.id) currentUserIds.add(currentUser.id);
  if (currentUser?.email) {
    users.forEach((u) => {
      if (u.email?.toLowerCase() === currentUser.email?.toLowerCase() && u.id) {
        currentUserIds.add(u.id);
      }
    });
  }

  return kras.filter((k) => {
    if (currentUser && currentUser.role === ROLES.APPLICATION_ENGINEER && !currentUserIds.has(k.appEngineerId)) {
      return false;
    }

    if (!isWithinDatePreset(k.date, filters.datePreset, filters.startDate, filters.endDate)) return false;
    if (filters.employeeId && filters.employeeId !== 'All' && k.appEngineerId !== filters.employeeId) return false;
    if (filters.customerId && filters.customerId !== 'All' && k.customerId !== filters.customerId) return false;
    if (filters.productId && filters.productId !== 'All' && k.productId !== filters.productId) return false;
    if (filters.status && filters.status !== 'All' && k.status !== filters.status) return false;

    if (filters.activityType && filters.activityType !== 'All' && filters.activityType !== 'Task' && filters.activityType !== 'Visit' && filters.activityType !== 'Office Work') {
      if (k.category !== filters.activityType) return false;
    }

    if (filters.application && filters.application !== 'All' && k.applicationArea && !k.applicationArea.toLowerCase().includes(filters.application.toLowerCase())) {
      return false;
    }

    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase().trim();
      const cust = customers.find((c) => c.id === k.customerId);
      const prod = products.find((p) => p.id === k.productId);
      const ae = users.find((u) => u.id === k.appEngineerId);

      const match =
        (k.applicationArea && k.applicationArea.toLowerCase().includes(q)) ||
        (k.result && k.result.toLowerCase().includes(q)) ||
        (k.category && k.category.toLowerCase().includes(q)) ||
        (cust?.name && cust.name.toLowerCase().includes(q)) ||
        (prod?.name && prod.name.toLowerCase().includes(q)) ||
        (prod?.modelNumber && prod.modelNumber.toLowerCase().includes(q)) ||
        (ae?.name && ae.name.toLowerCase().includes(q));

      if (!match) return false;
    }

    return true;
  });
};

// Filter Tasks with deep search
export const filterTasks = (tasks, filters = {}, currentUser = null, users = []) => {
  if (!Array.isArray(tasks)) return [];
  filters = filters || {};
  return tasks.filter((t) => {
    if (currentUser && currentUser.role !== ROLES.ADMIN && currentUser.role !== ROLES.MANAGER) {
      if (t.assignedToId !== currentUser.id && t.assignedById !== currentUser.id) {
        return false;
      }
    }

    if (!isWithinDatePreset(t.dueDate, filters.datePreset, filters.startDate, filters.endDate)) return false;
    if (filters.employeeId && filters.employeeId !== 'All' && t.assignedToId !== filters.employeeId) return false;
    if (filters.status && filters.status !== 'All' && t.status !== filters.status) return false;
    if (filters.priority && filters.priority !== 'All' && t.priority !== filters.priority) return false;

    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase().trim();
      const assignee = users.find((u) => u.id === t.assignedToId);
      const assigner = users.find((u) => u.id === t.assignedById);

      const match =
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.category && t.category.toLowerCase().includes(q)) ||
        (t.status && t.status.toLowerCase().includes(q)) ||
        (assignee?.name && assignee.name.toLowerCase().includes(q)) ||
        (assigner?.name && assigner.name.toLowerCase().includes(q));

      if (!match) return false;
    }

    return true;
  });
};

// Filter PO Order Bookings
export const filterOrders = (orders, filters = {}, currentUser = null, customers = [], products = [], users = []) => {
  if (!Array.isArray(orders)) return [];
  filters = filters || {};

  // Collect ALL IDs that belong to the current user
  const currentUserIds = new Set();
  if (currentUser?.id) currentUserIds.add(currentUser.id);
  if (currentUser?.email) {
    users.forEach((u) => {
      if (u.email?.toLowerCase() === currentUser.email?.toLowerCase() && u.id) {
        currentUserIds.add(u.id);
      }
    });
  }

  return orders.filter((o) => {
    if (currentUser && currentUser.role === ROLES.SALES_ENGINEER && !currentUserIds.has(o.salesEngineerId)) {
      return false;
    }

    if (!isWithinDatePreset(o.poDate, filters.datePreset, filters.startDate, filters.endDate)) return false;
    if (filters.employeeId && filters.employeeId !== 'All' && o.salesEngineerId !== filters.employeeId) return false;
    if (filters.customerId && filters.customerId !== 'All' && o.customerId !== filters.customerId) return false;
    if (filters.productId && filters.productId !== 'All' && o.productId !== filters.productId) return false;
    if (filters.status && filters.status !== 'All' && o.status !== filters.status) return false;

    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase().trim();
      const cust = customers.find((c) => c.id === o.customerId);
      const prod = products.find((p) => p.id === o.productId);
      const eng = users.find((u) => u.id === o.salesEngineerId);

      const match =
        (o.poNumber && o.poNumber.toLowerCase().includes(q)) ||
        (o.contactPerson && o.contactPerson.toLowerCase().includes(q)) ||
        (o.scopeOfSupply && o.scopeOfSupply.toLowerCase().includes(q)) ||
        (o.paymentTerms && o.paymentTerms.toLowerCase().includes(q)) ||
        (o.status && o.status.toLowerCase().includes(q)) ||
        (cust?.name && cust.name.toLowerCase().includes(q)) ||
        (prod?.name && prod.name.toLowerCase().includes(q)) ||
        (prod?.modelNumber && prod.modelNumber.toLowerCase().includes(q)) ||
        (eng?.name && eng.name.toLowerCase().includes(q));

      if (!match) return false;
    }

    return true;
  });
};
