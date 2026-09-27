import type { BloodComponent, BloodGroup } from './types';

export const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const COMPONENTS: BloodComponent[] = ['wholeBlood', 'prbc', 'ffp', 'platelets', 'cryo'];

export const DISTRICTS: string[] = [
  'Ariyalur',
  'Chengalpattu',
  'Chennai',
  'Coimbatore',
  'Cuddalore',
  'Dharmapuri',
  'Dindigul',
  'Erode',
  'Kallakurichi',
  'Kancheepuram',
  'Karur',
  'Krishnagiri',
  'Kanyakumari',
  'Madurai',
  'Mayiladuthurai',
  'Nagapattinam',
  'Namakkal',
  'Nilgiris',
  'Perambalur',
  'Pudukkottai',
  'Ramanathapuram',
  'Ranipet',
  'Salem',
  'Sivaganga',
  'Tenkasi',
  'Thanjavur',
  'Theni',
  'Thoothukudi',
  'Tiruchirappalli',
  'Tirunelveli',
  'Tirupathur',
  'Tiruppur',
  'Tiruvallur',
  'Tiruvannamalai',
  'Tiruvarur',
  'Vellore',
  'Viluppuram',
  'Virudhunagar',
];

export const STORAGE_LOCATIONS: string[] = [
  'Rack A-01',
  'Rack A-02',
  'Rack B-01',
  'Rack B-02',
  'Rack C-01',
  'Rack C-02',
  'Rack D-01',
  'Rack D-02',
];

export const TEST_STATUSES = ['Pending', 'Passed', 'Failed'] as const;

export const UNIT_STATUSES = [
  'Available',
  'UnderTesting',
  'Reserved',
  'Used',
  'Expired',
  'Discarded',
] as const;

export const EXPIRY_STATUSES = ['Safe', 'ExpiringSoon', 'Expired'] as const;

export interface DemoAccount {
  role: 'Doctor' | 'Staff' | 'SuperAdmin';
  staffId: string;
  pin: string;
}

// Seeded via backend/seed.js (`node seed.js`):
// DOC-001 / 1234 (Doctor), STAFF-001 / 1234 (Staff).
// SUPER001 / Admin@123 (SuperAdmin, frontend demo only).
export const DEMO_ACCOUNTS: DemoAccount[] = [
  { role: 'Doctor', staffId: 'DOC-001', pin: '1234' },
  { role: 'Staff', staffId: 'STAFF-001', pin: '1234' },
  { role: 'SuperAdmin', staffId: 'SUPER001', pin: 'Admin@123' },
];
