import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  DoorOpen,
  Calendar,
  Hammer,
  UserCheck
} from 'lucide-react';
import { api } from '../api/client';
import { MaintenanceRequest, Room, Staff } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge, getStatusBadgeVariant } from '../components/ui/Badge';
import { SlideOver } from '../components/ui/SlideOver';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';

export const MaintenancePage: React.FC = () => {
  const toast = useToast();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Add Maintenance Drawer
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newForm, setNewForm] = useState({
    roomId: '',
    requestType: 'Plumbing',
    description: '',
    priority: 'Medium',
    dateRaised: new Date().toISOString().split('T')[0],
    assignedStaff: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status Modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState<MaintenanceRequest | null>(null);
  const [updateStatus, setUpdateStatus] = useState<string>('In Progress');
  const [assignedStaff, setAssignedStaff] = useState<number | ''>('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const data = await api.getMaintenance(statusFilter !== 'All' ? statusFilter : undefined);
      setRequests(data);
    } catch (err: any) {
      toast.error('Failed to load maintenance requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    Promise.all([api.getRooms(), api.getStaff()])
      .then(([rm, sf]) => {
        setRooms(rm);
        setStaff(sf);
      })
      .catch(() => {});
  }, [statusFilter]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.roomId || !newForm.description.trim()) {
      toast.error('Please select room and describe maintenance required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createMaintenance({
        roomId: Number(newForm.roomId),
        requestType: newForm.requestType,
        description: newForm.description,
        priority: newForm.priority,
        dateRaised: newForm.dateRaised,
        assignedStaff: newForm.assignedStaff ? Number(newForm.assignedStaff) : undefined,
      });
      toast.success('Maintenance job created');
      setIsNewOpen(false);
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create job');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;

    setIsUpdating(true);
    try {
      await api.updateMaintenanceStatus(selectedReq.RequestID, {
        status: updateStatus,
        assignedStaff: assignedStaff ? Number(assignedStaff) : undefined,
      });
      toast.success(`Job #${selectedReq.RequestID} updated to ${updateStatus}`);
      setStatusModalOpen(false);
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update job');
    } finally {
      setIsUpdating(false);
    }
  };

  const filtered = requests.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.RoomNumber?.toLowerCase().includes(q) ||
      r.RequestType.toLowerCase().includes(q) ||
      r.Description.toLowerCase().includes(q) ||
      r.StaffName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-content-primary">
              Facility Maintenance Desk
            </h2>
            <Badge variant="neutral" size="sm">
              {requests.length} Jobs
            </Badge>
          </div>
          <p className="text-xs text-content-secondary mt-1">
            Tracks structural repairs, civil upkeep, fixture servicing, and assigned hostel technicians.
          </p>
        </div>

        <Button
          onClick={() => {
            setNewForm({
              roomId: '',
              requestType: 'Plumbing',
              description: '',
              priority: 'Medium',
              dateRaised: new Date().toISOString().split('T')[0],
              assignedStaff: '',
            });
            setIsNewOpen(true);
          }}
          icon={<Plus className="w-4 h-4" />}
        >
          Raise Maintenance Job
        </Button>
      </div>

      {/* Toolbar */}
      <Card className="p-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by room, job type, description, or technician..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded border border-gray-300 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5">
            {['All', 'Pending', 'In Progress', 'Completed'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors ${
                  statusFilter === st
                    ? 'bg-blue-50 text-blue-700 border-blue-300 font-semibold'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Maintenance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="col-span-2 p-12 text-center text-xs text-content-secondary animate-pulse">
            Loading facility maintenance jobs...
          </div>
        ) : filtered.length === 0 ? (
          <Card className="col-span-2 p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-content-primary">No active maintenance jobs</h3>
            <p className="text-xs text-content-secondary mt-1">
              All residential fixtures and hostel facilities are in working condition.
            </p>
          </Card>
        ) : (
          filtered.map((req) => (
            <Card key={req.RequestID} className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-amber-50 rounded-lg text-amber-700">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-content-primary">
                        {req.RequestType}
                      </h4>
                      <p className="text-[11px] text-content-secondary">
                        Room {req.RoomNumber} ({req.BlockName} • {req.HostelName})
                      </p>
                    </div>
                  </div>

                  <Badge variant={getStatusBadgeVariant(req.Status)} size="sm">
                    {req.Status}
                  </Badge>
                </div>

                <p className="text-xs text-slate-700 mt-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                  {req.Description}
                </p>

                <div className="grid grid-cols-2 gap-2 mt-4 text-[11px] text-content-secondary">
                  <div>
                    <span className="text-slate-400">Date Raised:</span> {req.DateRaised}
                  </div>
                  <div>
                    <span className="text-slate-400">Priority:</span>{' '}
                    <span className="font-semibold text-content-primary">{req.Priority}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400">Assigned Technician:</span>{' '}
                    <span className="font-medium text-brand-blue">
                      {req.StaffName || 'Unassigned'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-surface-border flex items-center justify-end">
                {req.Status !== 'Completed' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedReq(req);
                      setUpdateStatus(req.Status === 'Pending' ? 'In Progress' : 'Completed');
                      setAssignedStaff(req.AssignedStaff || '');
                      setStatusModalOpen(true);
                    }}
                  >
                    Update Progress
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* RAISE JOB SLIDE-OVER */}
      <SlideOver
        isOpen={isNewOpen}
        onClose={() => setIsNewOpen(false)}
        title="Raise Facility Maintenance Job"
        subtitle="Schedules repair work on physical room equipment or building assets"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsNewOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateRequest} isLoading={isSubmitting}>
              Dispatch Job
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-content-primary mb-1">
              Select Room *
            </label>
            <select
              required
              value={newForm.roomId}
              onChange={(e) => setNewForm({ ...newForm, roomId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            >
              <option value="">-- Choose Room --</option>
              {rooms.map((rm) => (
                <option key={rm.RoomID} value={rm.RoomID}>
                  Room {rm.RoomNumber} ({rm.HostelName})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-content-primary mb-1">
                Job Category *
              </label>
              <select
                value={newForm.requestType}
                onChange={(e) => setNewForm({ ...newForm, requestType: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              >
                <option value="Plumbing">Plumbing</option>
                <option value="Electrical">Electrical</option>
                <option value="Water Seepage">Water Seepage</option>
                <option value="Lighting">Lighting</option>
                <option value="Carpentry">Carpentry</option>
                <option value="Air Conditioning">Air Conditioning</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-content-primary mb-1">
                Priority *
              </label>
              <select
                value={newForm.priority}
                onChange={(e) => setNewForm({ ...newForm, priority: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-content-primary mb-1">
              Assign Staff / Technician
            </label>
            <select
              value={newForm.assignedStaff}
              onChange={(e) => setNewForm({ ...newForm, assignedStaff: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            >
              <option value="">-- Leave Unassigned for Now --</option>
              {staff.map((st) => (
                <option key={st.StaffID} value={st.StaffID}>
                  {st.Name} ({st.Role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-content-primary mb-1">
              Description of Repair Work *
            </label>
            <textarea
              required
              rows={4}
              placeholder="State the equipment condition or defect requiring inspection..."
              value={newForm.description}
              onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            />
          </div>
        </form>
      </SlideOver>

      {/* UPDATE STATUS MODAL */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="Update Maintenance Progress"
        subtitle={selectedReq ? `Job #${selectedReq.RequestID} — ${selectedReq.RequestType}` : ''}
        maxWidth="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleStatusUpdate} isLoading={isUpdating}>
              Save Progress
            </Button>
          </>
        }
      >
        <form onSubmit={handleStatusUpdate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-content-primary mb-1">
              Job Status *
            </label>
            <select
              value={updateStatus}
              onChange={(e) => setUpdateStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-content-primary mb-1">
              Assigned Technician
            </label>
            <select
              value={assignedStaff}
              onChange={(e) => setAssignedStaff(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            >
              <option value="">-- Select Staff --</option>
              {staff.map((st) => (
                <option key={st.StaffID} value={st.StaffID}>
                  {st.Name} ({st.Role})
                </option>
              ))}
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
};
