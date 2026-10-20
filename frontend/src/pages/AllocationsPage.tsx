import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Building,
  User,
  AlertCircle,
  DoorOpen,
  LogOut,
  Clock
} from 'lucide-react';
import { api, ApiError } from '../api/client';
import { RoomAllocation, Student, Room } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge, getStatusBadgeVariant } from '../components/ui/Badge';
import { SlideOver } from '../components/ui/SlideOver';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';

export const AllocationsPage: React.FC = () => {
  const toast = useToast();
  const [allocations, setAllocations] = useState<RoomAllocation[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Allocation Drawer
  const [isNewAllocOpen, setIsNewAllocOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<number | ''>('');
  const [selectedRoomId, setSelectedRoomId] = useState<number | ''>('');
  const [allocationDate, setAllocationDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allocError, setAllocError] = useState<string | null>(null);

  // Vacate Modal
  const [vacateModalOpen, setVacateModalOpen] = useState(false);
  const [allocToVacate, setAllocToVacate] = useState<RoomAllocation | null>(null);
  const [isVacating, setIsVacating] = useState(false);

  const fetchAllocations = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAllocations(statusFilter !== 'All' ? statusFilter : undefined);
      setAllocations(data);
    } catch (err: any) {
      toast.error('Failed to load allocations');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDependencies = async () => {
    try {
      const [allStudents, allRooms] = await Promise.all([
        api.getStudents(),
        api.getRooms(),
      ]);
      setStudents(allStudents);
      // Filter rooms that actually have capacity available
      const freeRooms = allRooms.filter(
        (r) => r.CurrentOccupancy < r.Capacity && r.Status !== 'Under Maintenance'
      );
      setAvailableRooms(freeRooms);
    } catch (err: any) {
      // non-blocking
    }
  };

  useEffect(() => {
    fetchAllocations();
    loadDependencies();
  }, [statusFilter]);

  const handleOpenNew = () => {
    setSelectedStudentId('');
    setSelectedRoomId('');
    setAllocationDate(new Date().toISOString().split('T')[0]);
    setAllocError(null);
    loadDependencies();
    setIsNewAllocOpen(true);
  };

  const handleCreateAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setAllocError(null);

    if (!selectedStudentId || !selectedRoomId) {
      setAllocError('Please select both a student and an available room.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.createAllocation({
        studentId: Number(selectedStudentId),
        roomId: Number(selectedRoomId),
        allocationDate,
      });
      toast.success(`Room assigned successfully (Allocation #${res.AllocationID})`);
      setIsNewAllocOpen(false);
      fetchAllocations();
    } catch (err: any) {
      setAllocError(err.message || 'Allocation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVacateConfirm = async () => {
    if (!allocToVacate) return;
    setIsVacating(true);
    try {
      await api.vacateAllocation(allocToVacate.AllocationID);
      toast.success(`Allocation #${allocToVacate.AllocationID} marked as vacated. Bed is now available.`);
      setVacateModalOpen(false);
      fetchAllocations();
    } catch (err: any) {
      toast.error(err.message || 'Failed to vacate room');
    } finally {
      setIsVacating(false);
      setAllocToVacate(null);
    }
  };

  // Filtered allocations
  const filtered = allocations.filter((a) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.StudentName?.toLowerCase().includes(q) ||
      a.RegNo?.toLowerCase().includes(q) ||
      a.RoomNumber?.toLowerCase().includes(q) ||
      a.HostelName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-content-primary">
              Room Allocations
            </h2>
            <Badge variant="neutral" size="sm">
              {allocations.length} Active & Past
            </Badge>
          </div>
          <p className="text-xs text-content-secondary mt-1">
            Enforces bed-capacity constraints and maintains complete historical occupancy audit logs.
          </p>
        </div>

        <Button onClick={handleOpenNew} icon={<Plus className="w-4 h-4" />}>
          New Room Allocation
        </Button>
      </div>

      {/* Toolbar */}
      <Card className="p-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by student, registration number, or room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded border border-gray-300 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5">
            {['All', 'Active', 'Vacated'].map((st) => (
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

      {/* Allocations Table */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-content-secondary animate-pulse">
            Loading allocations from database...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <KeyRound className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-content-primary">No allocations found</h3>
            <p className="text-xs text-content-secondary mt-1 mb-4">
              Allocate an available bed to a registered college resident.
            </p>
            <Button size="sm" onClick={handleOpenNew} icon={<Plus className="w-4 h-4" />}>
              Create Allocation
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-surface-border bg-slate-50/70 text-content-secondary uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3 px-4">Allocation ID</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Assigned Room</th>
                  <th className="py-3 px-4">Hostel & Block</th>
                  <th className="py-3 px-4">Allocation Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((alloc) => {
                  const isActive = alloc.Status === 'Active';
                  return (
                    <tr key={alloc.AllocationID} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-500">
                        #{alloc.AllocationID}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-content-primary text-xs">
                          {alloc.StudentName}
                        </div>
                        <div className="text-[11px] text-brand-blue font-mono">
                          {alloc.RegNo}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-content-primary">
                          Room {alloc.RoomNumber}
                        </div>
                        <div className="text-[10px] text-content-secondary">
                          {alloc.RoomType} ({alloc.CurrentOccupancy}/{alloc.Capacity} Beds)
                        </div>
                      </td>

                      <td className="py-3 px-4 text-content-secondary">
                        <div>{alloc.HostelName}</div>
                        <div className="text-[10px] text-slate-400">{alloc.BlockName}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-content-primary">{alloc.AllocationDate}</div>
                        {alloc.VacateDate && (
                          <div className="text-[10px] text-slate-400">
                            Vacated: {alloc.VacateDate}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <Badge variant={isActive ? 'success' : 'neutral'} size="sm">
                          {alloc.Status}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {isActive && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setAllocToVacate(alloc);
                              setVacateModalOpen(true);
                            }}
                            icon={<LogOut className="w-3.5 h-3.5 text-rose-500" />}
                          >
                            Vacate Room
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* NEW ALLOCATION SLIDE-OVER */}
      <SlideOver
        isOpen={isNewAllocOpen}
        onClose={() => setIsNewAllocOpen(false)}
        title="Assign Room to Resident"
        subtitle="Capacity-enforced assignment workflow"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsNewAllocOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateAllocation} isLoading={isSubmitting}>
              Confirm Allocation
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateAllocation} className="space-y-4 text-xs">
          {allocError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{allocError}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-content-primary mb-1">
              Select Student *
            </label>
            <select
              required
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            >
              <option value="">-- Choose Resident --</option>
              {students.map((st) => (
                <option key={st.StudentID} value={st.StudentID}>
                  {st.Name} ({st.RegNo}) — {st.Department}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-content-primary mb-1">
              Select Room with Available Capacity *
            </label>
            <select
              required
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            >
              <option value="">-- Choose Room with Available Bed --</option>
              {availableRooms.map((rm) => (
                <option key={rm.RoomID} value={rm.RoomID}>
                  Room {rm.RoomNumber} ({rm.RoomType}) — {rm.HostelName} ({rm.CurrentOccupancy}/{rm.Capacity} Beds Occupied)
                </option>
              ))}
            </select>
            <p className="text-[11px] text-content-secondary mt-1">
              {availableRooms.length} rooms currently have verified bed vacancies.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-content-primary mb-1">
              Allocation Date *
            </label>
            <input
              type="date"
              required
              value={allocationDate}
              onChange={(e) => setAllocationDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            />
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-[11px]">
            <strong>Validation Rule:</strong> Overbooking is prevented at the database layer. If a room has 0 vacancies or is under maintenance, allocation will be rejected.
          </div>
        </form>
      </SlideOver>

      {/* VACATE MODAL */}
      <Modal
        isOpen={vacateModalOpen}
        onClose={() => setVacateModalOpen(false)}
        title="Confirm Room Vacate"
        maxWidth="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setVacateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleVacateConfirm}
              isLoading={isVacating}
            >
              Vacate & Release Bed
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <p className="text-content-secondary">
            Are you sure you want to mark Allocation #{allocToVacate?.AllocationID} for{' '}
            <strong className="text-content-primary">{allocToVacate?.StudentName}</strong> as vacated?
          </p>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-content-secondary">
            Bed in <strong>Room {allocToVacate?.RoomNumber}</strong> will immediately become available for new allocations.
          </div>
        </div>
      </Modal>
    </div>
  );
};
