import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { RoomAllocation, Student, Room } from '../types';

export const AllocationsPage: React.FC = () => {
  const [allocations, setAllocations] = useState<RoomAllocation[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');

  // Allocation form state
  const [selectedStudentId, setSelectedStudentId] = useState<number | ''>('');
  const [selectedRoomId, setSelectedRoomId] = useState<number | ''>('');
  const [allocationDate, setAllocationDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Vacate modal state
  const [vacateTarget, setVacateTarget] = useState<RoomAllocation | null>(null);
  const [isVacating, setIsVacating] = useState(false);

  const fetchAllocations = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAllocations(statusFilter !== 'All' ? statusFilter : undefined);
      setAllocations(data);
    } catch (err: any) {
      setFormError('Failed to load allocations from server');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDropdownData = async () => {
    try {
      const [allStudents, allRooms] = await Promise.all([
        api.getStudents(),
        api.getRooms(),
      ]);
      setStudents(allStudents);
      // Available rooms with at least 1 free bed and not under maintenance
      setRooms(allRooms);
    } catch (err: any) {
      // non-blocking
    }
  };

  useEffect(() => {
    fetchAllocations();
  }, [statusFilter]);

  useEffect(() => {
    loadDropdownData();
  }, []);

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedStudentId || !selectedRoomId) {
      setFormError('Please select both a student and a room.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createAllocation({
        studentId: Number(selectedStudentId),
        roomId: Number(selectedRoomId),
        allocationDate: allocationDate || new Date().toISOString().split('T')[0],
      });
      setSuccessMessage('Room allocated successfully.');
      setSelectedStudentId('');
      setSelectedRoomId('');
      fetchAllocations();
      loadDropdownData();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to allocate room');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVacateConfirm = async () => {
    if (!vacateTarget) return;
    setIsVacating(true);
    setFormError(null);
    try {
      await api.vacateAllocation(vacateTarget.AllocationID);
      setSuccessMessage(`Room vacated for allocation #${vacateTarget.AllocationID}.`);
      setVacateTarget(null);
      fetchAllocations();
      loadDropdownData();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to vacate room');
    } finally {
      setIsVacating(false);
    }
  };

  // Rooms that have space
  const availableRooms = rooms.filter(
    (r) => r.CurrentOccupancy < r.Capacity && r.Status !== 'Under Maintenance'
  );

  return (
    <div className="space-y-5">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-300 gap-2">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Room Allocations</h1>
          <p className="text-xs text-gray-500">
            Allocate rooms to students and record room vacating in the Neo4j graph database
          </p>
        </div>
        <button
          onClick={() => {
            fetchAllocations();
            loadDropdownData();
          }}
          className="px-3 py-1.5 bg-white border border-gray-300 text-xs text-gray-700 rounded hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-2.5 bg-green-50 border border-green-300 text-green-800 text-xs rounded">
          {successMessage}
        </div>
      )}
      {formError && (
        <div className="p-2.5 bg-red-50 border border-red-300 text-red-800 text-xs rounded">
          {formError}
        </div>
      )}

      {/* New Allocation Form */}
      <div className="p-4 bg-white border border-gray-300 rounded space-y-3">
        <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
          New Room Allocation Form
        </h2>

        <form onSubmit={handleAllocate} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Select Student <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded bg-white"
              required
            >
              <option value="">-- Choose Student --</option>
              {students.map((st) => (
                <option key={st.StudentID} value={st.StudentID}>
                  {st.Name} ({st.RegNo}) {st.RoomNumber ? `[Currently: Room ${st.RoomNumber}]` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Select Room <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded bg-white"
              required
            >
              <option value="">-- Choose Available Room --</option>
              {availableRooms.map((r) => (
                <option key={r.RoomID} value={r.RoomID}>
                  Room {r.RoomNumber} - {r.BlockName} ({r.HostelName}) [{r.Capacity - r.CurrentOccupancy} free]
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Allocation Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={allocationDate}
              onChange={(e) => setAllocationDate(e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded"
              required
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Allocating...' : 'Allocate Room'}
            </button>
          </div>
        </form>
      </div>

      {/* Allocations Filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
          Current Allocation Records ({allocations.length})
        </h2>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600 font-medium">Status Filter:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 rounded bg-white"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Vacated">Vacated</option>
          </select>
        </div>
      </div>

      {/* Allocations Table */}
      <div className="bg-white border border-gray-300 rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300 text-gray-700 font-semibold">
                <th className="py-2.5 px-3 border-r border-gray-300 w-16 text-center">Alloc ID</th>
                <th className="py-2.5 px-3 border-r border-gray-300">Student Name</th>
                <th className="py-2.5 px-3 border-r border-gray-300">Reg No</th>
                <th className="py-2.5 px-3 border-r border-gray-300">Room</th>
                <th className="py-2.5 px-3 border-r border-gray-300">Block</th>
                <th className="py-2.5 px-3 border-r border-gray-300">Hostel</th>
                <th className="py-2.5 px-3 border-r border-gray-300">Date Allocated</th>
                <th className="py-2.5 px-3 border-r border-gray-300">Date Vacated</th>
                <th className="py-2.5 px-3 border-r border-gray-300 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-6 text-center text-gray-500">
                    Loading allocation records from Neo4j...
                  </td>
                </tr>
              ) : allocations.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-6 text-center text-gray-500">
                    No allocation records found.
                  </td>
                </tr>
              ) : (
                allocations.map((a) => (
                  <tr key={a.AllocationID} className="hover:bg-gray-50">
                    <td className="py-2 px-3 text-center font-mono text-gray-500 border-r border-gray-200">
                      {a.AllocationID}
                    </td>
                    <td className="py-2 px-3 font-semibold text-gray-900 border-r border-gray-200">
                      {a.StudentName}
                    </td>
                    <td className="py-2 px-3 font-mono text-blue-700 border-r border-gray-200">
                      {a.RegNo}
                    </td>
                    <td className="py-2 px-3 text-gray-800 border-r border-gray-200">
                      Room {a.RoomNumber}
                    </td>
                    <td className="py-2 px-3 text-gray-700 border-r border-gray-200">
                      {a.BlockName}
                    </td>
                    <td className="py-2 px-3 text-gray-700 border-r border-gray-200">
                      {a.HostelName}
                    </td>
                    <td className="py-2 px-3 text-gray-600 border-r border-gray-200">
                      {a.AllocationDate}
                    </td>
                    <td className="py-2 px-3 text-gray-500 border-r border-gray-200">
                      {a.VacateDate || '—'}
                    </td>
                    <td className="py-2 px-3 text-center border-r border-gray-200">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${
                          a.Status === 'Active'
                            ? 'bg-green-50 text-green-800 border-green-300'
                            : 'bg-gray-100 text-gray-700 border-gray-300'
                        }`}
                      >
                        {a.Status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      {a.Status === 'Active' ? (
                        <button
                          onClick={() => setVacateTarget(a)}
                          className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded text-xs hover:bg-red-100"
                        >
                          Vacate
                        </button>
                      ) : (
                        <span className="text-gray-400 italic text-[11px]">Completed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vacate Confirmation Modal */}
      {vacateTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-400 rounded max-w-sm w-full p-4 space-y-3 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-2">
              Confirm Vacate Room
            </h2>
            <p className="text-xs text-gray-700">
              Are you sure you want to vacate Room <strong>{vacateTarget.RoomNumber}</strong> for student{' '}
              <strong>{vacateTarget.StudentName}</strong> ({vacateTarget.RegNo})?
            </p>
            <p className="text-[11px] text-gray-500">
              This will update the allocation status to &apos;Vacated&apos; and reduce the room&apos;s current occupancy count in Neo4j.
            </p>

            <div className="border-t border-gray-200 pt-2 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setVacateTarget(null)}
                className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isVacating}
                onClick={handleVacateConfirm}
                className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {isVacating ? 'Vacating...' : 'Confirm Vacate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AllocationsPage;
