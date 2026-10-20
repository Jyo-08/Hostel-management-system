/**
 * Centralized, Typed API Client for HostelOS
 * Connects directly to FastAPI backend and handles error propagation
 */

import {
  SystemHealth,
  DashboardSummary,
  HostelSummary,
  DashboardAnalytics,
  RecentActivity,
  Student,
  Hostel,
  Block,
  Room,
  RoomAllocation,
  Payment,
  Complaint,
  MaintenanceRequest,
  Visitor,
  Staff,
  Warden,
  EmergencyContact,
  GraphData
} from '../types';

let customBaseUrl = localStorage.getItem('hostelos_api_url') || 'http://localhost:8000';

export const getApiBaseUrl = (): string => customBaseUrl;

export const setApiBaseUrl = (url: string): void => {
  customBaseUrl = url.replace(/\/+$/, '');
  localStorage.setItem('hostelos_api_url', customBaseUrl);
};

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${getApiBaseUrl()}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
      let errorData = null;
      try {
        errorData = await response.json();
        if (errorData && errorData.detail) {
          errorMsg = errorData.detail;
        }
      } catch {
        // Response was not JSON
      }
      throw new ApiError(errorMsg, response.status, errorData);
    }

    return await response.json() as T;
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(
      `Network error connecting to ${url}. Ensure the FastAPI backend is running on port 8000.`,
      0,
      err
    );
  }
}

export const api = {
  // System Health & Database Status
  getHealth: () => request<SystemHealth>('/api/health'),
  getDbStatus: () => request<any>('/api/db-status'),

  // Dashboard Overview
  getDashboardSummary: () => request<DashboardSummary>('/api/dashboard/summary'),
  getDashboardHostels: () => request<HostelSummary[]>('/api/dashboard/hostels'),
  getDashboardAnalytics: () => request<DashboardAnalytics>('/api/dashboard/analytics'),
  getRecentActivity: () => request<RecentActivity>('/api/dashboard/recent-activity'),

  // Students
  getStudents: (params?: { search?: string; department?: string; hostel_id?: number; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.department) query.append('department', params.department);
    if (params?.hostel_id) query.append('hostel_id', params.hostel_id.toString());
    if (params?.status) query.append('status', params.status);
    const qs = query.toString();
    return request<Student[]>(`/api/students${qs ? `?${qs}` : ''}`);
  },
  getStudent: (id: number) => request<Student>(`/api/students/${id}`),
  createStudent: (payload: any) => request<Student>('/api/students', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  updateStudent: (id: number, payload: any) => request<Student>(`/api/students/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  }),
  deleteStudent: (id: number) => request<{ message: string; studentId: number }>(`/api/students/${id}`, {
    method: 'DELETE'
  }),

  // Hostels, Blocks & Rooms
  getHostels: () => request<Hostel[]>('/api/hostels'),
  createHostel: (payload: any) => request<Hostel>('/api/hostels', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getBlocks: (hostelId?: number) => request<Block[]>(`/api/blocks${hostelId ? `?hostel_id=${hostelId}` : ''}`),
  createBlock: (payload: any) => request<Block>('/api/blocks', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getRooms: (params?: { hostel_id?: number; block_id?: number; status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.hostel_id) query.append('hostel_id', params.hostel_id.toString());
    if (params?.block_id) query.append('block_id', params.block_id.toString());
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    const qs = query.toString();
    return request<Room[]>(`/api/rooms${qs ? `?${qs}` : ''}`);
  },
  getRoom: (id: number) => request<Room>(`/api/rooms/${id}`),
  createRoom: (payload: any) => request<Room>('/api/rooms', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  updateRoom: (id: number, payload: any) => request<Room>(`/api/rooms/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  }),
  deleteRoom: (id: number) => request<{ message: string; roomId: number }>(`/api/rooms/${id}`, {
    method: 'DELETE'
  }),

  // Room Allocations
  getAllocations: (status?: string) => request<RoomAllocation[]>(`/api/allocations${status ? `?status=${status}` : ''}`),
  createAllocation: (payload: { studentId: number; roomId: number; allocationDate: string }) => request<RoomAllocation>('/api/allocations', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  vacateAllocation: (allocationId: number) => request<{ message: string; allocationId: number; vacateDate: string }>(`/api/allocations/${allocationId}/vacate`, {
    method: 'POST'
  }),

  // Payments
  getPayments: (params?: { search?: string; status?: string; payment_type?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    if (params?.payment_type) query.append('payment_type', params.payment_type);
    const qs = query.toString();
    return request<Payment[]>(`/api/payments${qs ? `?${qs}` : ''}`);
  },
  createPayment: (payload: any) => request<Payment>('/api/payments', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  // Complaints
  getComplaints: (status?: string) => request<Complaint[]>(`/api/complaints${status ? `?status=${status}` : ''}`),
  createComplaint: (payload: any) => request<Complaint>('/api/complaints', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  updateComplaintStatus: (id: number, payload: { status: string; resolvedDate?: string; handledBy?: number }) => request<Complaint>(`/api/complaints/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  }),

  // Maintenance Requests
  getMaintenance: (status?: string) => request<MaintenanceRequest[]>(`/api/maintenance${status ? `?status=${status}` : ''}`),
  createMaintenance: (payload: any) => request<MaintenanceRequest>('/api/maintenance', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  updateMaintenanceStatus: (id: number, payload: { status: string; completionDate?: string; assignedStaff?: number }) => request<MaintenanceRequest>(`/api/maintenance/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  }),

  // Visitors
  getVisitors: () => request<Visitor[]>('/api/visitors'),
  createVisitor: (payload: any) => request<Visitor>('/api/visitors', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  // Staff & Wardens
  getStaff: () => request<Staff[]>('/api/staff'),
  createStaff: (payload: any) => request<Staff>('/api/staff', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getWardens: () => request<Warden[]>('/api/wardens'),
  createWarden: (payload: any) => request<Warden>('/api/wardens', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  // Emergency Contacts
  getEmergencyContacts: () => request<EmergencyContact[]>('/api/emergency-contacts'),
  createEmergencyContact: (payload: any) => request<EmergencyContact>('/api/emergency-contacts', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  // Neo4j Relationship Explorer
  getGraph: () => request<GraphData>('/api/graph'),
  getEntitySubgraph: (nodeId: string) => request<{ centerNode: any; nodes: any[]; links: any[] }>(`/api/graph/entity/${nodeId}`)
};
