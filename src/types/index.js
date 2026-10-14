// Role Definitions
export const ROLES = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  SALES_ENGINEER: 'Sales Engineer',
  APPLICATION_ENGINEER: 'Application Engineer',
};

// Lead Stages
export const LEAD_STAGES = [
  'Prospecting',
  'Qualified',
  'Demo Needed',
  'Proposal Sent',
  'Negotiation',
  'Won',
  'Lost',
];

// Office Work Types
export const OFFICE_WORK_TYPES = [
  'Internal Meeting',
  'Quotation Preparation',
  'Tender/Bid Preparation',
  'Technical Discussion',
  'Customer Follow-up',
  'Administrative / Reporting',
  'Product Training',
];

// KRA Categories for Application Engineers
export const KRA_CATEGORIES = {
  DEMONSTRATION: 'Demonstration',
  INSTALLATION: 'Installation',
  QUERY_HANDLING: 'Query Handling',
  COMPLIANCE_MAKING: 'Compliance Making',
  // Backward compatibility alias
  APPLICATION_MARKETING: 'Compliance Making',
};

export const KRA_CATEGORY_LIST = [
  'Demonstration',
  'Installation',
  'Query Handling',
  'Compliance Making',
];

// Purchase Order (PO) Booking Statuses
export const PO_STATUSES = [
  'PO Received',
  'Order Acknowledged',
  'Under Execution',
  'Dispatched',
  'Completed',
  'Cancelled',
];

// Task Priorities
export const TASK_PRIORITIES = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

// Task Statuses
export const TASK_STATUSES = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

// TMI Industry Segments
export const INDUSTRY_SEGMENTS = [
  'Aerospace & Defense',
  'Automotive & EV',
  'Power Electronics & Energy',
  'Semiconductor & Microelectronics',
  'Telecommunications & 5G/RF',
  'Academic & Government R&D',
  'Industrial & Manufacturing',
  'Medical Devices',
];

// Formatters
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
