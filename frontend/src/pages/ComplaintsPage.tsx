import React, { useState, useEffect } from 'react';
import {
  MessageSquareWarning,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  DoorOpen,
  Calendar,
  ShieldCheck,
  Check
} from 'lucide-react';
import { api } from '../api/client';
import { Complaint, Student, Room, Staff } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge, getStatusBadgeVariant } from '../components/ui/Badge';
import { SlideOver } from '../components/ui/SlideOver';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';

export const ComplaintsPage: React.FC = () => {
  const toast = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Add Complaint Drawer
  const [isNewComplaintOpen, setIsNewComplaintOpen] = useState(false);
  const [newForm, setNewForm] = useState({
    studentId: '',
    roomId: '',
    complaintType: 'Electrical',
    description: '',
    priority: 'Medium',
    dateFiled: new Date().toISOString().split('T')[0],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status Update Modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [updateStatus, setUpdateStatus] = useState<string>('In Progress');
  const [handledByStaff, setHandledByStaff] = useState<number | ''>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchComplaints = async () => {
    setIsLoading(true);
    try {
      const data = await api.getComplaints(statusFilter !== 'All' ? statusFilter : undefined);
      setComplaints(data);
    } catch (err: any) {
      toast.error('Failed to load complaints');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
    Promise.all([api.getStudents(), api.getRooms(), api.getStaff()])
      .then(([st, rm, sf]) => {
        setStudents(st);
        setRooms(rm);
        setStaff(sf);
      })
      .catch(() => {});
  }, [statusFilter]);

  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.studentId || !newForm.roomId || !newForm.description.trim()) {
      toast.error('Please fill in student, room, and complaint description.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createComplaint({
        studentId: Number(newForm.studentId),
        roomId: Number(newForm.roomId),
        complaintType: newForm.complaintType,
        description: newForm.description,
        priority: newForm.priority,
        dateFiled: newForm.dateFiled,
      });
      toast.success('Complaint ticket registered successfully');
      setIsNewComplaintOpen(false);
      fetchComplaints();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit complaint');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    setIsUpdatingStatus(true);
    try {
      await api.updateComplaintStatus(selectedComplaint.ComplaintID, {
        status: updateStatus,
        handledBy: handledByStaff ? Number(handledByStaff) : undefined,
      });
      toast.success(`Complaint #${selectedComplaint.ComplaintID} marked as ${updateStatus}`);
      setStatusModalOpen(false);
      fetchComplaints();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const filtered = complaints.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.StudentName?.toLowerCase().includes(q) ||
      c.RoomNumber?.toLowerCase().includes(q) ||
      c.ComplaintType.toLowerCase().includes(q) ||
      c.Description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-content-primary">
              Complaint Resolution Desk
            </h2>
            <Badge variant="neutral" size="sm">
              {complaints.length} Tickets
            </Badge>
          </div>
          <p className="text-xs text-content-secondary mt-1">
            Tracks residential maintenance tickets, electrical, plumbing, carpentry, and Wi-Fi issues.
          </p>
        </div>

        <Button
          onClick={() => {
            setNewForm({
              studentId: '',
              roomId: '',
              complaintType: 'Electrical',
              description: '',
              priority: 'Medium',
              dateFiled: new Date().toISOString().split('T')[0],
            });
            setIsNewComplaintOpen(true);
          }}
          icon={<Plus className="w-4 h-4" />}
        >
          File Complaint Ticket
        </Button>
      </div>

      {/* Toolbar */}
      <Card className="p-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by student, room, issue type, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded border border-gray-300 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5">
            {['All', 'Open', 'In Progress', 'Resolved'].map((st) => (
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

      {/* Tickets List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-content-secondary animate-pulse">
            Loading residential complaints...
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-content-primary">No complaints found</h3>
            <p className="text-xs text-content-secondary mt-1">
              All resident facilities are operating normally with zero unresolved tickets.
            </p>
          </Card>
        ) : (
          filtered.map((c) => (
            <Card key={c.ComplaintID} className="p-4 hover:border-slate-300 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-content-primary">
                      {c.ComplaintType}
                    </span>
                    <Badge variant={getStatusBadgeVariant(c.Priority)} size="sm">
                      {c.Priority} Priority
                    </Badge>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Ticket #{c.ComplaintID}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    {c.Description}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-content-secondary pt-2 flex-wrap">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {c.StudentName} ({c.RegNo})
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-content-primary">
                      <DoorOpen className="w-3.5 h-3.5 text-slate-400" />
                      Room {c.RoomNumber} ({c.HostelName})
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Filed: {c.DateFiled}
                    </span>
                    {c.HandledByName && (
                      <span className="flex items-center gap-1 text-brand-blue font-medium">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Handled by: {c.HandledByName}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center sm:flex-col items-end gap-2 shrink-0">
                  <Badge variant={getStatusBadgeVariant(c.Status)} size="md">
                    {c.Status}
                  </Badge>

                  {c.Status !== 'Resolved' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedComplaint(c);
                        setUpdateStatus(c.Status === 'Open' ? 'In Progress' : 'Resolved');
                        setHandledByStaff(c.HandledBy || '');
                        setStatusModalOpen(true);
                      }}
                    >
                      Update Status
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* CREATE COMPLAINT SLIDE-OVER */}
      <SlideOver
        isOpen={isNewComplaintOpen}
        onClose={() => setIsNewComplaintOpen(false)}
        title="File Facility Complaint"
        subtitle="Log issue for hostel staff or technician intervention"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsNewComplaintOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateComplaint} isLoading={isSubmitting}>
              Submit Ticket
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateComplaint} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-content-primary mb-1">
              Filing Student *
            </label>
            <select
              required
              value={newForm.studentId}
              onChange={(e) => {
                const sId = Number(e.target.value);
                const st = students.find((s) => s.StudentID === sId);
                setNewForm({
                  ...newForm,
                  studentId: e.target.value,
                  roomId: st?.RoomID ? st.RoomID.toString() : newForm.roomId,
                });
              }}
              className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            >
              <option value="">-- Choose Resident --</option>
              {students.map((st) => (
                <option key={st.StudentID} value={st.StudentID}>
                  {st.Name} ({st.RegNo}) {st.RoomNumber ? `— Room ${st.RoomNumber}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-content-primary mb-1">
              Affected Room *
            </label>
            <select
              required
              value={newForm.roomId}
              onChange={(e) => setNewForm({ ...newForm, roomId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            >
              <option value="">-- Select Room --</option>
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
                Category *
              </label>
              <select
                value={newForm.complaintType}
                onChange={(e) => setNewForm({ ...newForm, complaintType: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              >
                <option value="Electrical">Electrical</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Wi-Fi / Internet">Wi-Fi / Internet</option>
                <option value="Carpentry">Carpentry</option>
                <option value="Housekeeping">Housekeeping</option>
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
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-content-primary mb-1">
              Issue Description *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Describe the defect, location, or issue details clearly..."
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
        title="Update Ticket Status"
        subtitle={selectedComplaint ? `Ticket #${selectedComplaint.ComplaintID} — ${selectedComplaint.ComplaintType}` : ''}
        maxWidth="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleStatusUpdate} isLoading={isUpdatingStatus}>
              Save Status
            </Button>
          </>
        }
      >
        <form onSubmit={handleStatusUpdate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-content-primary mb-1">
              New Status *
            </label>
            <select
              value={updateStatus}
              onChange={(e) => setUpdateStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            >
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-content-primary mb-1">
              Assign Staff / Technician
            </label>
            <select
              value={handledByStaff}
              onChange={(e) => setHandledByStaff(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            >
              <option value="">-- Unassigned --</option>
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
