import type { BloodGroup } from './types';
import { DISTRICTS } from './constants';

export interface MockHospital {
  id: string;
  name: string;
  district: string;
  license: string;
  regDate: string;
  status: 'pending' | 'approved' | 'rejected';
  contact: string;
  email: string;
  address: string;
  adminName: string;
}

export const HOSPITALS: MockHospital[] = [
  {
    id: 'HOS-001',
    name: 'Rajiv Gandhi Govt General Hospital',
    district: 'Chennai',
    license: 'TN-BB-2021-00451',
    regDate: '2024-11-02',
    status: 'approved',
    contact: '9841023456',
    email: 'admin@rgggh-chennai.tn.gov.in',
    address: 'No. 1, Poonamallee High Road, Park Town, Chennai – 600003',
    adminName: 'Dr. R. Kannan',
  },
  {
    id: 'HOS-002',
    name: 'Madurai Medical College Hospital',
    district: 'Madurai',
    license: 'TN-BB-2020-00382',
    regDate: '2024-11-18',
    status: 'approved',
    contact: '9894032176',
    email: 'ms@mmc-madurai.tn.gov.in',
    address: 'Alagar Kovil Main Road, Tallakulam, Madurai – 625020',
    adminName: 'Dr. S. Meenakshi',
  },
  {
    id: 'HOS-003',
    name: 'Coimbatore Medical College Hospital',
    district: 'Coimbatore',
    license: 'TN-BB-2022-00714',
    regDate: '2025-01-06',
    status: 'approved',
    contact: '9842718890',
    email: 'dean@cmch-coimbatore.tn.gov.in',
    address: 'Avinashi Road, Peelamedu, Coimbatore – 641014',
    adminName: 'Dr. P. Velusamy',
  },
  {
    id: 'HOS-004',
    name: 'Salem Mohan Kumaramangalam Hospital',
    district: 'Salem',
    license: 'TN-BB-2021-00593',
    regDate: '2025-02-11',
    status: 'approved',
    contact: '9789012445',
    email: 'admin@smkmch-salem.tn.gov.in',
    address: 'Steel Plant Road, Salem – 636030',
    adminName: 'Dr. K. Ilamaran',
  },
  {
    id: 'HOS-005',
    name: 'Trichy Mahatma Gandhi Memorial Hospital',
    district: 'Tiruchirappalli',
    license: 'TN-BB-2023-00921',
    regDate: '2025-03-04',
    status: 'pending',
    contact: '9842455771',
    email: 'contact@mgm-trichy.tn.gov.in',
    address: 'Puthur High Road, Tiruchirappalli – 620017',
    adminName: 'Dr. A. Fathima Begum',
  },
  {
    id: 'HOS-006',
    name: 'Vellore Christian Medical College Hospital',
    district: 'Vellore',
    license: 'TN-BB-2019-00247',
    regDate: '2025-04-19',
    status: 'approved',
    contact: '9843029984',
    email: 'bloodbank@cmch-vellore.edu',
    address: 'Ida Scudder Road, Vellore – 632004',
    adminName: 'Dr. John Abraham',
  },
  {
    id: 'HOS-007',
    name: 'Tirunelveli Medical College Hospital',
    district: 'Tirunelveli',
    license: 'TN-BB-2023-01033',
    regDate: '2025-06-02',
    status: 'pending',
    contact: '9894211078',
    email: 'dean@tvmc-tirunelveli.tn.gov.in',
    address: 'High Ground Road, Palayamkottai, Tirunelveli – 627011',
    adminName: 'Dr. M. Subbulakshmi',
  },
  {
    id: 'HOS-008',
    name: 'Erode Govt District Headquarters Hospital',
    district: 'Erode',
    license: 'TN-BB-2022-00658',
    regDate: '2025-07-15',
    status: 'rejected',
    contact: '9842765430',
    email: 'ms@ghh-erode.tn.gov.in',
    address: 'Brough Road, Erode – 638001',
    adminName: 'Dr. C. Natarajan',
  },
  {
    id: 'HOS-009',
    name: 'Thanjavur Medical College Hospital',
    district: 'Thanjavur',
    license: 'TN-BB-2020-00319',
    regDate: '2025-08-08',
    status: 'approved',
    contact: '9786018932',
    email: 'dean@tmch-thanjavur.tn.gov.in',
    address: 'Medical College Road, Thanjavur – 613004',
    adminName: 'Dr. V. Karthikeyan',
  },
  {
    id: 'HOS-010',
    name: 'Dindigul District Headquarters Hospital',
    district: 'Dindigul',
    license: 'TN-BB-2024-01207',
    regDate: '2025-09-01',
    status: 'rejected',
    contact: '9842146709',
    email: 'ms@ghh-dindigul.tn.gov.in',
    address: 'GTN Salai, Dindigul – 624001',
    adminName: 'Dr. S. Revathi',
  },
];

export interface ManagedAdmin {
  id: string;
  name: string;
  email: string;
  phone: string;
  district: string;
  role: string;
  status: 'active' | 'inactive';
}

export const MANAGED_ADMINS: ManagedAdmin[] = [
  {
    id: 'ADM-001',
    name: 'Arun Prakash S',
    email: 'arun.prakash@rgggh-chennai.tn.gov.in',
    phone: '9841011223',
    district: 'Chennai',
    role: 'Hospital Admin',
    status: 'active',
  },
  {
    id: 'ADM-002',
    name: 'Divya Lakshmi R',
    email: 'divya.lakshmi@mmc-madurai.tn.gov.in',
    phone: '9894013456',
    district: 'Madurai',
    role: 'Blood Bank Admin',
    status: 'active',
  },
  {
    id: 'ADM-003',
    name: 'Karthik Raja M',
    email: 'karthik.raja@cmch-coimbatore.tn.gov.in',
    phone: '9789022211',
    district: 'Coimbatore',
    role: 'District Coordinator',
    status: 'active',
  },
  {
    id: 'ADM-004',
    name: 'Priya Dharshini K',
    email: 'priya.dharshini@smkmch-salem.tn.gov.in',
    phone: '9842788899',
    district: 'Salem',
    role: 'Hospital Admin',
    status: 'active',
  },
  {
    id: 'ADM-005',
    name: 'Mohammed Asif J',
    email: 'asif.j@mgm-trichy.tn.gov.in',
    phone: '8940123355',
    district: 'Tiruchirappalli',
    role: 'Blood Bank Admin',
    status: 'inactive',
  },
  {
    id: 'ADM-006',
    name: 'Anitha Kumari V',
    email: 'anitha.kumari@cmch-vellore.edu',
    phone: '9843044677',
    district: 'Vellore',
    role: 'District Coordinator',
    status: 'active',
  },
  {
    id: 'ADM-007',
    name: 'Suresh Kumar T',
    email: 'suresh.kumar@tvmc-tirunelveli.tn.gov.in',
    phone: '9787712901',
    district: 'Tirunelveli',
    role: 'Hospital Admin',
    status: 'inactive',
  },
  {
    id: 'ADM-008',
    name: 'Revathi Natarajan',
    email: 'revathi.n@ghh-erode.tn.gov.in',
    phone: '7845312098',
    district: 'Erode',
    role: 'Blood Bank Admin',
    status: 'active',
  },
];

export interface BloodBankRow {
  id: string;
  name: string;
  district: string;
  contact: string;
  units: number;
  status: 'active' | 'inactive' | 'maintenance';
}

export const BLOOD_BANKS: BloodBankRow[] = [
  {
    id: 'BB-001',
    name: 'Chennai Central Blood Bank',
    district: 'Chennai',
    contact: '04428510567',
    units: 1240,
    status: 'active',
  },
  {
    id: 'BB-002',
    name: 'Madurai Meenakshi Blood Centre',
    district: 'Madurai',
    contact: '04522345678',
    units: 986,
    status: 'active',
  },
  {
    id: 'BB-003',
    name: 'Kovai Voluntary Blood Bank',
    district: 'Coimbatore',
    contact: '04222308945',
    units: 874,
    status: 'active',
  },
  {
    id: 'BB-004',
    name: 'Salem Govt Blood Bank',
    district: 'Salem',
    contact: '04272345612',
    units: 642,
    status: 'maintenance',
  },
  {
    id: 'BB-005',
    name: 'Trichy Cauvery Blood Bank',
    district: 'Tiruchirappalli',
    contact: '04312458901',
    units: 518,
    status: 'active',
  },
  {
    id: 'BB-006',
    name: 'Vellore CMC Blood Bank',
    district: 'Vellore',
    contact: '04162283456',
    units: 730,
    status: 'active',
  },
  {
    id: 'BB-007',
    name: 'Nellai District Blood Bank',
    district: 'Tirunelveli',
    contact: '04622567890',
    units: 396,
    status: 'inactive',
  },
  {
    id: 'BB-008',
    name: 'Thanjavur Delta Blood Centre',
    district: 'Thanjavur',
    contact: '04362345678',
    units: 455,
    status: 'active',
  },
];

export interface DonorRow {
  id: string;
  name: string;
  group: BloodGroup;
  district: string;
  lastDonation: string;
  nextDonation: string;
  status: 'eligible' | 'deferred';
}

export const DONORS: DonorRow[] = [
  {
    id: 'DNR-001',
    name: 'Vignesh Kumar S',
    group: 'O+',
    district: 'Chennai',
    lastDonation: '2026-05-12',
    nextDonation: '2026-08-12',
    status: 'eligible',
  },
  {
    id: 'DNR-002',
    name: 'Lakshmi Priya M',
    group: 'B+',
    district: 'Madurai',
    lastDonation: '2026-06-02',
    nextDonation: '2026-09-02',
    status: 'eligible',
  },
  {
    id: 'DNR-003',
    name: 'Mohamed Riyaz A',
    group: 'A+',
    district: 'Coimbatore',
    lastDonation: '2026-04-20',
    nextDonation: '2026-07-20',
    status: 'eligible',
  },
  {
    id: 'DNR-004',
    name: 'Deepika Rani K',
    group: 'AB+',
    district: 'Salem',
    lastDonation: '2026-07-28',
    nextDonation: '2026-10-28',
    status: 'deferred',
  },
  {
    id: 'DNR-005',
    name: 'Senthil Nathan P',
    group: 'O-',
    district: 'Tiruchirappalli',
    lastDonation: '2026-03-15',
    nextDonation: '2026-06-15',
    status: 'eligible',
  },
  {
    id: 'DNR-006',
    name: 'Kavitha Bharathi S',
    group: 'A-',
    district: 'Vellore',
    lastDonation: '2026-06-25',
    nextDonation: '2026-09-25',
    status: 'eligible',
  },
  {
    id: 'DNR-007',
    name: 'Rajesh Kannan V',
    group: 'B-',
    district: 'Tirunelveli',
    lastDonation: '2026-08-01',
    nextDonation: '2026-11-01',
    status: 'deferred',
  },
  {
    id: 'DNR-008',
    name: 'Anusuya Devi T',
    group: 'AB-',
    district: 'Erode',
    lastDonation: '2026-02-10',
    nextDonation: '2026-05-10',
    status: 'eligible',
  },
  {
    id: 'DNR-009',
    name: 'Hariharan M',
    group: 'O+',
    district: 'Thanjavur',
    lastDonation: '2026-05-30',
    nextDonation: '2026-08-30',
    status: 'eligible',
  },
  {
    id: 'DNR-010',
    name: 'Nithya Shree R',
    group: 'B+',
    district: 'Dindigul',
    lastDonation: '2026-07-05',
    nextDonation: '2026-10-05',
    status: 'eligible',
  },
  {
    id: 'DNR-011',
    name: 'Prabakaran D',
    group: 'A+',
    district: 'Tiruppur',
    lastDonation: '2026-06-18',
    nextDonation: '2026-09-18',
    status: 'eligible',
  },
  {
    id: 'DNR-012',
    name: 'Saranya Mohan G',
    group: 'O-',
    district: 'Kancheepuram',
    lastDonation: '2026-07-11',
    nextDonation: '2026-10-11',
    status: 'deferred',
  },
];

export interface BloodRequestRow {
  id: string;
  hospital: string;
  district: string;
  group: BloodGroup;
  units: number;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  priority: 'emergency' | 'normal';
}

export const REQUESTS: BloodRequestRow[] = [
  {
    id: 'REQ-001',
    hospital: 'Rajiv Gandhi Govt General Hospital',
    district: 'Chennai',
    group: 'O-',
    units: 4,
    date: '2026-09-24',
    status: 'pending',
    priority: 'emergency',
  },
  {
    id: 'REQ-002',
    hospital: 'Madurai Medical College Hospital',
    district: 'Madurai',
    group: 'B+',
    units: 2,
    date: '2026-09-23',
    status: 'approved',
    priority: 'normal',
  },
  {
    id: 'REQ-003',
    hospital: 'Coimbatore Medical College Hospital',
    district: 'Coimbatore',
    group: 'A+',
    units: 3,
    date: '2026-09-22',
    status: 'approved',
    priority: 'normal',
  },
  {
    id: 'REQ-004',
    hospital: 'Salem Mohan Kumaramangalam Hospital',
    district: 'Salem',
    group: 'AB-',
    units: 2,
    date: '2026-09-21',
    status: 'pending',
    priority: 'emergency',
  },
  {
    id: 'REQ-005',
    hospital: 'Trichy Mahatma Gandhi Memorial Hospital',
    district: 'Tiruchirappalli',
    group: 'O+',
    units: 5,
    date: '2026-09-20',
    status: 'approved',
    priority: 'normal',
  },
  {
    id: 'REQ-006',
    hospital: 'Vellore Christian Medical College Hospital',
    district: 'Vellore',
    group: 'B-',
    units: 1,
    date: '2026-09-19',
    status: 'rejected',
    priority: 'normal',
  },
  {
    id: 'REQ-007',
    hospital: 'Tirunelveli Medical College Hospital',
    district: 'Tirunelveli',
    group: 'A-',
    units: 3,
    date: '2026-09-18',
    status: 'pending',
    priority: 'normal',
  },
  {
    id: 'REQ-008',
    hospital: 'Erode Govt District Headquarters Hospital',
    district: 'Erode',
    group: 'AB+',
    units: 2,
    date: '2026-09-17',
    status: 'approved',
    priority: 'normal',
  },
  {
    id: 'REQ-009',
    hospital: 'Thanjavur Medical College Hospital',
    district: 'Thanjavur',
    group: 'O+',
    units: 6,
    date: '2026-09-25',
    status: 'pending',
    priority: 'emergency',
  },
  {
    id: 'REQ-010',
    hospital: 'Dindigul District Headquarters Hospital',
    district: 'Dindigul',
    group: 'B+',
    units: 2,
    date: '2026-09-16',
    status: 'rejected',
    priority: 'normal',
  },
  {
    id: 'REQ-011',
    hospital: 'Rajiv Gandhi Govt General Hospital',
    district: 'Chennai',
    group: 'A+',
    units: 4,
    date: '2026-09-15',
    status: 'approved',
    priority: 'normal',
  },
  {
    id: 'REQ-012',
    hospital: 'Madurai Medical College Hospital',
    district: 'Madurai',
    group: 'O-',
    units: 3,
    date: '2026-09-14',
    status: 'approved',
    priority: 'emergency',
  },
];

export interface InventoryRow {
  group: BloodGroup;
  available: number;
  expiringSoon: number;
  low: boolean;
}

export const INVENTORY: InventoryRow[] = [
  { group: 'A+', available: 842, expiringSoon: 48, low: false },
  { group: 'A-', available: 214, expiringSoon: 18, low: false },
  { group: 'B+', available: 768, expiringSoon: 52, low: false },
  { group: 'B-', available: 196, expiringSoon: 22, low: false },
  { group: 'AB+', available: 328, expiringSoon: 25, low: false },
  { group: 'AB-', available: 96, expiringSoon: 14, low: true },
  { group: 'O+', available: 1124, expiringSoon: 64, low: false },
  { group: 'O-', available: 118, expiringSoon: 19, low: true },
];

export interface DistrictRow {
  district: string;
  hospitals: number;
  banks: number;
  donors: number;
  requests: number;
  stock: number;
}

export const DISTRICTS_OVERVIEW: DistrictRow[] = DISTRICTS.map((district, index) => {
  const seed = (index * 37 + 11) % 23;
  const base =
    district === 'Chennai'
      ? { hospitals: 18, banks: 9, donors: 4820, requests: 214, stock: 3120 }
      : district === 'Coimbatore'
        ? { hospitals: 12, banks: 6, donors: 3150, requests: 148, stock: 2210 }
        : district === 'Madurai'
          ? { hospitals: 11, banks: 6, donors: 2980, requests: 136, stock: 2045 }
          : district === 'Salem'
            ? { hospitals: 9, banks: 5, donors: 2410, requests: 112, stock: 1730 }
            : district === 'Tiruchirappalli'
              ? { hospitals: 9, banks: 4, donors: 2265, requests: 104, stock: 1615 }
              : district === 'Tirunelveli'
                ? { hospitals: 7, banks: 4, donors: 1890, requests: 88, stock: 1320 }
                : district === 'Vellore'
                  ? { hospitals: 8, banks: 4, donors: 2040, requests: 92, stock: 1480 }
                  : {
                      hospitals: 3 + (seed % 5),
                      banks: 1 + (seed % 3),
                      donors: 620 + seed * 41,
                      requests: 18 + (seed % 28),
                      stock: 380 + seed * 32,
                    };
  return { district, ...base };
});

export interface ActivityRow {
  id: string;
  text: string;
  at: string;
  tone: 'red' | 'emerald' | 'amber' | 'sky';
}

export const ACTIVITIES: ActivityRow[] = [
  {
    id: 'ACT-001',
    text: 'Emergency request REQ-001 for 4 units of O- from Chennai flagged critical',
    at: '2026-09-27T09:42:00+05:30',
    tone: 'red',
  },
  {
    id: 'ACT-002',
    text: 'REQ-003 (3 units A+) for Coimbatore Medical College approved',
    at: '2026-09-26T17:15:00+05:30',
    tone: 'emerald',
  },
  {
    id: 'ACT-003',
    text: 'Salem Govt Blood Bank moved to maintenance — 642 units quarantined',
    at: '2026-09-26T11:05:00+05:30',
    tone: 'amber',
  },
  {
    id: 'ACT-004',
    text: 'New hospital registration from Trichy MGM Hospital awaiting review',
    at: '2026-09-25T15:48:00+05:30',
    tone: 'sky',
  },
  {
    id: 'ACT-005',
    text: 'Thanjavur emergency request REQ-009 for 6 units of O+ raised',
    at: '2026-09-25T10:22:00+05:30',
    tone: 'red',
  },
  {
    id: 'ACT-006',
    text: '42 units collected at Madurai donation camp; B+ stock replenished',
    at: '2026-09-24T18:30:00+05:30',
    tone: 'emerald',
  },
  {
    id: 'ACT-007',
    text: 'O- stock below threshold (118 units) — 19 units expiring within 7 days',
    at: '2026-09-24T09:12:00+05:30',
    tone: 'amber',
  },
  {
    id: 'ACT-008',
    text: 'District Coordinator Karthik Raja assigned to Coimbatore region',
    at: '2026-09-23T14:00:00+05:30',
    tone: 'sky',
  },
];

export const REPORT_SUMMARY = {
  collections: 1842,
  issues: 1496,
  newDonors: 326,
  fulfilment: '91.4%',
};
