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

export type UserRole = 'Doctor' | 'Staff' | 'SuperAdmin';

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  designation: string;
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
