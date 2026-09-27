export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type BloodComponent = 'wholeBlood' | 'prbc' | 'ffp' | 'platelets' | 'cryo';

export type TestStatus = 'Pending' | 'Passed' | 'Failed';

export type UnitStatus =
  | 'Available'
  | 'UnderTesting'
  | 'Reserved'
  | 'Used'
  | 'Expired'
  | 'Discarded';

export type ExpiryStatus = 'Safe' | 'ExpiringSoon' | 'Expired';

export type HistoryEventType =
  | 'registered'
  | 'testingStarted'
  | 'testCompleted'
  | 'statusUpdated';

export interface HistoryEvent {
  id: string;
  type: HistoryEventType;
  at: string;
  note?: string;
  status?: UnitStatus;
}

export interface BloodUnit {
  id: string;
  bloodGroup: BloodGroup;
  component: BloodComponent;
  district: string;
  collectionDate: string;
  expiryDate: string;
  storageLocation: string;
  quantity: number;
  collectionStaff: string;
  testStatus: TestStatus;
  status: UnitStatus;
  screeningResult?: string;
  testedBy?: string;
  testDate?: string;
  remarks?: string;
  updatedAt: string;
  history: HistoryEvent[];
}

export type UserRole = 'DistrictAdmin' | 'SuperAdmin';

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  designation: string;
  email?: string;
  phone?: string;
  districtId?: string;
}

export type RequestStatus = 'submitted' | 'approved' | 'fulfilled' | 'cancelled';

export interface BloodRequest {
  requestId: string;
  patientName: string;
  bloodGroup: string;
  units: number;
  districtId: string;
  hospitalName: string;
  hospitalAddress?: string;
  contact?: string;
  requiredDate?: string;
  requestType: 'emergency' | 'normal';
  priority?: string;
  status: RequestStatus;
  createdAt?: string;
  groupId?: string;
}

export interface DonorRow {
  id: string;
  name: string;
  bloodGroup: string;
  district: string;
  mobile?: string;
  status: string;
}

export type DonationStatus = 'pending' | 'approved' | 'completed' | 'cancelled';

export interface Donation {
  donationId: string;
  donorName: string;
  bloodGroup: string;
  mobile: string;
  districtId: string;
  district?: string;
  availableDate?: string;
  preferredTime?: string;
  notes?: string;
  status: DonationStatus;
  createdAt?: string;
}

export type NewUnitInput = Omit<
  BloodUnit,
  'history' | 'updatedAt' | 'testStatus' | 'status' | 'screeningResult' | 'testedBy' | 'testDate' | 'remarks'
>;

export type TestResultInput = {
  testStatus: TestStatus;
  screeningResult?: string;
  testedBy?: string;
  testDate?: string;
  remarks?: string;
};

export type MessageStatus = 'unread' | 'read' | 'replied';

export interface Message {
  messageId: string;
  subject: string;
  body: string;
  reply?: string;
  status: MessageStatus;
  createdAt?: string;
  fromName?: string;
  fromDistrictId?: string;
}
