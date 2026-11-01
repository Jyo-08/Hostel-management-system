import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Room, Hostel } from '../types';

export const RoomsPage: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [hostelFilter, setHostelFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [roomsData, hostelsData] = await Promise.all([
        api.getRooms({
          hostel_id: hostelFilter !== 'All' ? Number(hostelFilter) : undefined,
          status: statusFilter !== 'All' ? statusFilter : undefined,
          search: search.trim() || undefined,
        }),
        api.getHostels(),
      ]);
      setRooms(roomsData);
      setHostels(hostelsData);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to fetch rooms from database');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [hostelFilter, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  // Summary counts
  const totalRooms = rooms.length;
  const totalCapacity = rooms.reduce((acc, r) => acc + r.Capacity, 0);
  const occupiedBeds = rooms.reduce((acc, r) => acc + r.CurrentOccupancy, 0);
  const availableBeds = totalCapacity - occupiedBeds;

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-300 gap-2">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Rooms</h1>
          <p className="text-xs text-gray-500">
            Hostel room inventory, bed capacities, and current occupancy status
          </p>
        </div>
        <button
          onClick={fetchData}
          className="px-3 py-1.5 bg-white border border-gray-300 text-xs text-gray-700 rounded hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white border border-gray-300 rounded">
          <div className="text-[11px] font-medium text-gray-500 uppercase">Total Rooms</div>
          <div className="text-xl font-bold text-gray-900 mt-0.5">{totalRooms}</div>
        </div>
        <div className="p-3 bg-white border border-gray-300 rounded">
          <div className="text-[11px] font-medium text-gray-500 uppercase">Total Capacity</div>
          <div className="text-xl font-bold text-gray-900 mt-0.5">{totalCapacity} Beds</div>
        </div>
        <div className="p-3 bg-white border border-gray-300 rounded">
          <div className="text-[11px] font-medium text-gray-500 uppercase">Occupied Beds</div>
          <div className="text-xl font-bold text-blue-700 mt-0.5">{occupiedBeds}</div>
        </div>
        <div className="p-3 bg-white border border-gray-300 rounded">
          <div className="text-[11px] font-medium text-gray-500 uppercase">Available Beds</div>
          <div className="text-xl font-bold text-green-700 mt-0.5">{availableBeds}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-white border border-gray-300 rounded flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-sm">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search room number..."
            className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:border-blue-600"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-gray-100 border border-gray-300 text-xs text-gray-700 rounded hover:bg-gray-200"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-600 font-medium">Hostel:</label>
            <select
              value={hostelFilter}
              onChange={(e) => setHostelFilter(e.target.value)}
              className="px-2 py-1.5 text-xs border border-gray-300 rounded bg-white"
            >
              <option value="All">All Hostels</option>
              {hostels.map((h) => (
                <option key={h.HostelID} value={h.HostelID}>
                  {h.HostelName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-600 font-medium">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 py-1.5 text-xs border border-gray-300 rounded bg-white"
            >
              <option value="All">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Partially Occupied">Partially Occupied</option>
              <option value="Full">Full</option>
              <option value="Under Maintenance">Under Maintenance</option>
            </select>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-2.5 bg-red-50 border border-red-300 text-red-800 text-xs rounded">
          {errorMessage}
        </div>
      )}

      {/* Rooms Table */}
      <div className="bg-white border border-gray-300 rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300 text-gray-700 font-semibold">
                <th className="py-2.5 px-3 border-r border-gray-300 w-16 text-center">Room ID</th>
                <th className="py-2.5 px-3 border-r border-gray-300">Room Number</th>
                <th className="py-2.5 px-3 border-r border-gray-300">Block</th>
                <th className="py-2.5 px-3 border-r border-gray-300">Hostel</th>
                <th className="py-2.5 px-3 border-r border-gray-300">Type</th>
                <th className="py-2.5 px-3 border-r border-gray-300 text-center">Capacity</th>
                <th className="py-2.5 px-3 border-r border-gray-300 text-center">Occupied</th>
                <th className="py-2.5 px-3 border-r border-gray-300 text-center">Available</th>
                <th className="py-2.5 px-3 border-r border-gray-300 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Occupants</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-6 text-center text-gray-500">
                    Loading rooms from Neo4j database...
                  </td>
                </tr>
              ) : rooms.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-6 text-center text-gray-500">
                    No rooms found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                rooms.map((r) => {
                  const free = r.Capacity - r.CurrentOccupancy;
                  return (
                    <tr key={r.RoomID} className="hover:bg-gray-50">
                      <td className="py-2 px-3 text-center font-mono text-gray-500 border-r border-gray-200">
                        {r.RoomID}
                      </td>
                      <td className="py-2 px-3 font-semibold text-gray-900 border-r border-gray-200">
                        Room {r.RoomNumber}
                      </td>
                      <td className="py-2 px-3 text-gray-700 border-r border-gray-200">
                        {r.BlockName || '—'}
                      </td>
                      <td className="py-2 px-3 text-gray-700 border-r border-gray-200">
                        {r.HostelName || '—'}
                      </td>
                      <td className="py-2 px-3 text-gray-600 border-r border-gray-200">
                        {r.RoomType}
                      </td>
                      <td className="py-2 px-3 text-center text-gray-800 border-r border-gray-200">
                        {r.Capacity}
                      </td>
                      <td className="py-2 px-3 text-center font-medium text-blue-700 border-r border-gray-200">
                        {r.CurrentOccupancy}
                      </td>
                      <td className="py-2 px-3 text-center font-medium text-green-700 border-r border-gray-200">
                        {free}
                      </td>
                      <td className="py-2 px-3 text-center border-r border-gray-200">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${
                            r.Status === 'Available'
                              ? 'bg-green-50 text-green-800 border-green-300'
                              : r.Status === 'Partially Occupied'
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : r.Status === 'Full'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-red-50 text-red-800 border-red-300'
                          }`}
                        >
                          {r.Status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        {r.occupants && r.occupants.length > 0 ? (
                          <button
                            onClick={() => setSelectedRoom(r)}
                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                          >
                            {r.occupants.length} Student{r.occupants.length > 1 ? 's' : ''}
                          </button>
                        ) : (
                          <span className="text-gray-400 italic">None</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Room Occupants Modal */}
      {selectedRoom && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-400 rounded max-w-lg w-full p-4 space-y-3 shadow-sm">
            <div className="border-b border-gray-200 pb-2 flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-gray-900">
                  Room {selectedRoom.RoomNumber} Occupants
                </h2>
                <p className="text-xs text-gray-500">
                  {selectedRoom.BlockName} • {selectedRoom.HostelName} ({selectedRoom.CurrentOccupancy}/
                  {selectedRoom.Capacity} Beds Occupied)
                </p>
              </div>
              <button
                onClick={() => setSelectedRoom(null)}
                className="text-gray-500 hover:text-gray-800 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 font-semibold">
                    <th className="py-1.5 px-2 border-r border-gray-200">Reg No</th>
                    <th className="py-1.5 px-2 border-r border-gray-200">Name</th>
                    <th className="py-1.5 px-2 border-r border-gray-200">Contact</th>
                    <th className="py-1.5 px-2">Allocation Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {selectedRoom.occupants?.map((occ) => (
                    <tr key={occ.AllocationID}>
                      <td className="py-1.5 px-2 font-mono text-blue-700 border-r border-gray-200">
                        {occ.RegNo}
                      </td>
                      <td className="py-1.5 px-2 font-medium text-gray-900 border-r border-gray-200">
                        {occ.Name}
                      </td>
                      <td className="py-1.5 px-2 text-gray-600 border-r border-gray-200">
                        {occ.ContactNumber}
                      </td>
                      <td className="py-1.5 px-2 text-gray-600">
                        {occ.AllocationDate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-gray-200 pt-2 flex justify-end">
              <button
                onClick={() => setSelectedRoom(null)}
                className="px-3 py-1 bg-gray-100 border border-gray-300 text-xs text-gray-700 rounded hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default RoomsPage;
