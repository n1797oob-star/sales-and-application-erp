import { ROLES, LEAD_STAGES, KRA_CATEGORIES, TASK_PRIORITIES, TASK_STATUSES } from '../types';

export const AVATAR_PRESETS = {
  Male: [
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
  ],
  Female: [
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
  ],
};

export const INITIAL_USERS = [
  {
    id: 'u-admin',
    name: 'Primary System Administrator',
    email: 'admin@tmi-erp.com',
    password: 'Admin@2026!#',
    gender: 'Male',
    role: ROLES.ADMIN,
    phone: '+91 98765 00001',
    avatar: AVATAR_PRESETS.Male[0],
    department: 'Executive Board',
    territory: 'Pan-India',
    status: 'Active',
  },
];

export const INITIAL_CUSTOMERS = [
  {
    id: 'cust-1',
    name: 'ISRO Satellite Centre (URSC)',
    industry: 'Aerospace & Defense',
    contactPerson: 'Dr. K. Sriman',
    email: 'sriman.k@ursc.gov.in',
    phone: '+91 80 2508 3111',
    address: 'HAL Airport Road, Vimanapura, Bengaluru, Karnataka 560017',
    accountTier: 'Strategic Account',
    taxId: '29AAATI0000A1Z5',
  },
  {
    id: 'cust-2',
    name: 'DRDO Defense Electronics Lab (DLRL)',
    industry: 'Aerospace & Defense',
    contactPerson: 'Col. A. K. Deshmukh',
    email: 'deshmukh.dlrl@drdo.gov.in',
    phone: '+91 40 2458 4000',
    address: 'Chandrayangutta, Hyderabad, Telangana 500005',
    accountTier: 'Strategic Account',
    taxId: '36AAATD1234F1Z8',
  },
  {
    id: 'cust-3',
    name: 'Tata Motors EV R&D Center',
    industry: 'Automotive & EV',
    contactPerson: 'Vikram Joshi',
    email: 'vjoshi@tatamotors.com',
    phone: '+91 20 6613 1111',
    address: 'Pimpri Industrial Area, Pune, Maharashtra 411018',
    accountTier: 'Key Account',
    taxId: '27AAACT0500P1ZE',
  },
  {
    id: 'cust-4',
    name: 'Bharat Electronics Limited (BEL)',
    industry: 'Aerospace & Defense',
    contactPerson: 'Ramesh Sundaram',
    email: 'sundaramr@bel.co.in',
    phone: '+91 80 2838 1234',
    address: 'Jalahalli Post, Bengaluru, Karnataka 560013',
    accountTier: 'Key Account',
    taxId: '29AAACB1111E1Z0',
  },
  {
    id: 'cust-5',
    name: 'Schneider Electric R&D Hub',
    industry: 'Power Electronics & Energy',
    contactPerson: 'Meera Iyer',
    email: 'meera.iyer@se.com',
    phone: '+91 80 4321 8888',
    address: 'EPIP Zone, Whitefield, Bengaluru, Karnataka 560066',
    accountTier: 'Key Account',
    taxId: '29AAACS2222D1Z9',
  },
  {
    id: 'cust-6',
    name: 'Bosch Automotive Electronics',
    industry: 'Automotive & EV',
    contactPerson: 'Harish Mehta',
    email: 'harish.mehta@bosch.com',
    phone: '+91 20 4000 5555',
    address: 'Chakan Industrial Phase 2, Pune, Maharashtra 410501',
    accountTier: 'Key Account',
    taxId: '27AAACB3333C1Z2',
  },
  {
    id: 'cust-7',
    name: 'IIT Bombay Microelectronics Lab',
    industry: 'Academic & Government R&D',
    contactPerson: 'Prof. R. V. Swaminathan',
    email: 'rvswami@ee.iitb.ac.in',
    phone: '+91 22 2576 7777',
    address: 'Powai, Mumbai, Maharashtra 400076',
    accountTier: 'Standard Account',
    taxId: '27AAATI4444B1Z4',
  },
  {
    id: 'cust-8',
    name: 'Ather Energy Battery Testing Facility',
    industry: 'Automotive & EV',
    contactPerson: 'Nikhil Rane',
    email: 'nikhil.rane@atherenergy.com',
    phone: '+91 80 6890 0000',
    address: 'Hosur Industrial Area, Tamil Nadu 635126',
    accountTier: 'Key Account',
    taxId: '33AAACA5555A1Z6',
  },
];

export const INITIAL_PRODUCTS = [
  {
    id: 'prod-1',
    modelNumber: 'MSO-X 6004A',
    name: 'Keysight Infiniium 6 GHz 4-Channel Oscilloscope',
    category: 'Oscilloscopes',
    priceRange: '₹35,000,000 - ₹48,000,000',
    specs: '6 GHz Bandwidth, 20 GSa/s, 10-bit ADC, Signal Integrity analysis for Radar & High-speed SerDes',
    brochureUrl: '#',
  },
  {
    id: 'prod-2',
    modelNumber: 'AWG-70002B',
    name: 'Tektronix 25 GSa/s Arbitrary Waveform Generator',
    category: 'Signal Generators',
    priceRange: '₹28,000,000 - ₹38,000,000',
    specs: '2 Channel, 16-bit vertical resolution, direct RF waveform generation up to 20 GHz',
    brochureUrl: '#',
  },
  {
    id: 'prod-3',
    modelNumber: 'ZNA67',
    name: 'Rohde & Schwarz 67 GHz Vector Network Analyzer',
    category: 'Spectrum & Network Analyzers',
    priceRange: '₹55,000,000 - ₹72,000,000',
    specs: '4-Port High Performance VNA, 140 dB dynamic range, Millimeter-wave & 5G FR2 testing',
    brochureUrl: '#',
  },
  {
    id: 'prod-4',
    modelNumber: 'WT5000',
    name: 'Yokogawa Precision Power Analyzer (EV Motor Test)',
    category: 'Power Analyzers',
    priceRange: '₹18,000,000 - ₹26,000,000',
    specs: '0.03% Basic Accuracy, 7 Power Element Channels, Dual Harmonic analysis for EV Inverters',
    brochureUrl: '#',
  },
  {
    id: 'prod-5',
    modelNumber: 'Ti480-PRO',
    name: 'Fluke HD Thermal Imaging Camera',
    category: 'Thermal Cameras & Optical',
    priceRange: '₹1,200,000 - ₹1,800,000',
    specs: '640 x 480 Infrared Resolution, MultiSharp Focus, -20 °C to +1000 °C range',
    brochureUrl: '#',
  },
  {
    id: 'prod-6',
    modelNumber: '63220A',
    name: 'Chroma High Power DC Electronic Load 20kW',
    category: 'DC Power & Loads',
    priceRange: '₹4,500,000 - ₹6,800,000',
    specs: '150V/1500A/20kW, Master-Slave Parallel up to 240kW, Battery Discharge testing',
    brochureUrl: '#',
  },
  {
    id: 'prod-7',
    modelNumber: 'BT3564',
    name: 'Hioki High Voltage Battery Tester 1000V',
    category: 'Battery Testing Equipment',
    priceRange: '₹1,500,000 - ₹2,200,000',
    specs: '1000V maximum input, ultra-fast internal resistance measurement for EV battery packs',
    brochureUrl: '#',
  },
  {
    id: 'prod-8',
    modelNumber: 'SML-4000',
    name: 'Megger Substation Insulation Diagnostic Analyzer',
    category: 'Field & Substation Testers',
    priceRange: '₹3,200,000 - ₹4,500,000',
    specs: '15 kV insulation resistance test, Dielectric Discharge, Step Voltage test',
    brochureUrl: '#',
  },
];

const today = new Date();
const formatDateOffset = (daysOffset) => {
  const d = new Date(today);
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
};

export const INITIAL_VISITS = [];
export const INITIAL_OFFICE_WORK = [];
export const INITIAL_KRA_ACTIVITIES = [];
export const INITIAL_TASKS = [];
export const INITIAL_ORDERS = [];
export const INITIAL_NOTIFICATIONS = [];
export const INITIAL_ACTIVITY_LOGS = [];
