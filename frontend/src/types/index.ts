/**
 * HostelOS TypeScript Interfaces & Domain Models
 * Aligned with BACSE202 DA3 BCNF Relational Schema & Neo4j Graph Models
 */

export interface SystemHealth {
  status: string;
  service: string;
  version: string;
  database: string;
  neo4j: {
    connected: boolean;
    uri: string;
    mode: string;
    error?: string;
  };
  active_records: number;
}

export interface DashboardSummary {
  totalStudents: number;
  totalRooms: number;
  totalCapacity: number;
  occupiedBeds: number;
  availableBeds: number;
  occupancyPercentage: number;
  pendingFees: number;
  totalCollected: number;
  openComplaints: number;
  openMaintenance: number;
}

export interface HostelSummary {
  hostelId: number;
  hostelName: string;
  hostelType: 'Boys' | 'Girls' | 'Co-ed';
  wardenName: string | null;
  wardenContact: string | null;
  blockCount: number;
  roomCount: number;
  totalCapacity: number;
  occupiedBeds: number;
  availableBeds: number;
  occupancyPercentage: number;
}

export interface DashboardAnalytics {
  hostelOccupancy: {
    name: string;
    occupied: number;
    available: number;
    capacity: number;
    rate: number;
  }[];
  capacityDistribution: {
    type: string;
    rooms: number;
    totalBeds: number;
    occupiedBeds: number;
    availableBeds: number;
  }[];
  paymentsByStatus: {
    status: string;
    count: number;
    amount: number;
  }[];
  complaintsByType: {
    category: string;
    count: number;
  }[];
}

export interface RecentActivity {
  recentAllocations: {
    AllocationID: number;
    AllocationDate: string;
    Status: string;
    StudentName: string;
    RegNo: string;
    RoomNumber: string;
  }[];
  recentPayments: {
    PaymentID: number;
    Amount: number;
    PaymentDate: string;
    PaymentType: string;
    Status: string;
    ReceiptNumber: string;
    StudentName: string;
    RegNo: string;
  }[];
  openComplaints: {
    ComplaintID: number;
    ComplaintType: string;
    Description: string;
    Priority: string;
    DateFiled: string;
    Status: string;
    StudentName: string;
    RoomNumber: string;
  }[];
  maintenanceIssues: {
    RequestID: number;
    RequestType: string;
    Description: string;
    Priority: string;
    DateRaised: string;
    Status: string;
    RoomNumber: string;
  }[];
}

export interface Student {
  StudentID: number;
  RegNo: string;
  Name: string;
  Gender: 'M' | 'F' | 'O';
  DOB: string;
  Department: string;
  Year: number;
  ContactNumber: string;
  Email: string;
  AdmissionDate: string;
  AllocationID?: number;
  AllocationDate?: string;
  AllocationStatus?: string;
  RoomID?: number;
  RoomNumber?: string;
  RoomType?: string;
  BlockName?: string;
  HostelID?: number;
  HostelName?: string;
  payments?: Payment[];
  complaints?: Complaint[];
  emergencyContacts?: EmergencyContact[];
}

export interface Hostel {
  HostelID: number;
  HostelName: string;
  HostelType: 'Boys' | 'Girls' | 'Co-ed';
  TotalCapacity: number;
  WardenID: number | null;
  WardenName?: string;
  WardenContact?: string;
  WardenEmail?: string;
}

export interface Block {
  BlockID: number;
  BlockName: string;
  HostelID: number;
  TotalFloors: number;
  HostelName?: string;
}

export interface Room {
  RoomID: number;
  RoomNumber: string;
  FloorID: number;
  FloorNumber?: number;
  BlockID?: number;
  BlockName?: string;
  HostelID?: number;
  HostelName?: string;
  HostelType?: string;
  RoomType: 'Single' | 'Double' | 'Triple' | 'Dormitory';
  Capacity: number;
  CurrentOccupancy: number;
  Status: 'Available' | 'Partially Occupied' | 'Full' | 'Under Maintenance';
  occupants?: {
    AllocationID: number;
    AllocationDate: string;
    StudentID: number;
    RegNo: string;
    Name: string;
    ContactNumber: string;
    Department: string;
  }[];
  maintenance?: MaintenanceRequest[];
}

export interface RoomAllocation {
  AllocationID: number;
  StudentID: number;
  RoomID: number;
  AllocationDate: string;
  VacateDate: string | null;
  Status: 'Active' | 'Vacated' | 'Cancelled';
  RegNo?: string;
  StudentName?: string;
  Department?: string;
  StudentContact?: string;
  RoomNumber?: string;
  RoomType?: string;
  Capacity?: number;
  CurrentOccupancy?: number;
  BlockName?: string;
  HostelName?: string;
}

export interface Payment {
  PaymentID: number;
  StudentID: number;
  Amount: number;
  PaymentDate: string;
  PaymentMode: 'UPI' | 'NetBanking' | 'Credit Card' | 'Debit Card' | 'Cash' | 'Demand Draft';
  PaymentType: 'Hostel Fee' | 'Mess Fee' | 'Security Deposit' | 'Maintenance Charge';
  Status: 'Completed' | 'Pending' | 'Failed';
  ReceiptNumber: string;
  StudentName?: string;
  RegNo?: string;
  Department?: string;
}

export interface Complaint {
  ComplaintID: number;
  StudentID: number;
  RoomID: number;
  ComplaintType: string;
  Description: string;
  Priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  DateFiled: string;
  Status: 'Open' | 'In Progress' | 'Resolved';
  ResolvedDate: string | null;
  HandledBy: number | null;
  StudentName?: string;
  RegNo?: string;
  RoomNumber?: string;
  HostelName?: string;
  HandledByName?: string;
}

export interface MaintenanceRequest {
  RequestID: number;
  RoomID: number;
  RequestType: string;
  Description: string;
  Priority: 'Low' | 'Medium' | 'High';
  DateRaised: string;
  Status: 'Pending' | 'In Progress' | 'Completed';
  AssignedStaff: number | null;
  CompletionDate: string | null;
  RoomNumber?: string;
  BlockName?: string;
  HostelName?: string;
  StaffName?: string;
}

export interface Visitor {
  VisitorID: number;
  Name: string;
  ContactNumber: string;
  RelationToStudent: string;
  StudentID: number;
  VisitDate: string;
  CheckInTime: string;
  CheckOutTime: string | null;
  ApprovedBy: number | null;
  StudentName?: string;
  RegNo?: string;
  ApprovedByName?: string;
}

export interface Staff {
  StaffID: number;
  Name: string;
  Role: string;
  ContactNumber: string;
  Shift: 'Morning' | 'Evening' | 'Night';
  HostelID: number | null;
  DateOfJoining: string;
  HostelName?: string;
}

export interface Warden {
  WardenID: number;
  Name: string;
  ContactNumber: string;
  Email: string;
  DateOfJoining: string;
  HostelName?: string;
  HostelType?: string;
}

export interface EmergencyContact {
  ContactID: number;
  StudentID: number;
  Name: string;
  Relationship: string;
  PhoneNumber: string;
  AlternatePhone: string | null;
  StudentName?: string;
  RegNo?: string;
  Department?: string;
}

export interface GraphNode {
  id: string;
  label: string;
  name: string;
  properties: Record<string, any>;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface GraphLink {
  id: string;
  source: string;
  target: string;
  type: string;
  properties: Record<string, any>;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  engine: string;
}
