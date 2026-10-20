import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Grid,
  List,
  Bed,
  Users,
  Wrench,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  DoorOpen,
  Edit2,
  Trash2,
  Eye,
  Layers
} from 'lucide-react';
import { api } from '../api/client';
import { Hostel, Block, Room } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge, getStatusBadgeVariant } from '../components/ui/Badge';
import { OccupancyBar } from '../components/ui/OccupancyBar';
import { Modal } from '../components/ui/Modal';
import { SlideOver } from '../components/ui/SlideOver';
import { useToast } from '../components/ui/Toast';

export const HostelsRoomsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active filters
  const [selectedHostelId, setSelectedHostelId] = useState<number | 'all'>(
    searchParams.get('hostel') ? Number(searchParams.get('hostel')) : 'all'
  );
  const [selectedBlockId, setSelectedBlockId] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modals
  const [isAddHostelOpen, setIsAddHostelOpen] = useState(false);
  const [isAddBlockOpen, setIsAddBlockOpen] = useState(false);
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [isRoomDetailOpen, setIsRoomDetailOpen] = useState(false);
  const [selectedRoomDetail, setSelectedRoomDetail] = useState<Room | null>(null);

  // Form states
  const [hostelForm, setHostelForm] = useState({ name: '', type: 'Boys', totalCapacity: 150 });
  const [blockForm, setBlockForm] = useState({ name: 'Block C', hostelId: 1, totalFloors: 4 });
  const [roomForm, setRoomForm] = useState({
    roomNumber: '',
    floorId: 1,
    roomType: 'Double',
    capacity: 2,
    status: 'Available',
  });
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [hList, bList, rList] = await Promise.all([
        api.getHostels(),
        api.getBlocks(),
        api.getRooms({
          hostel_id: selectedHostelId !== 'all' ? selectedHostelId : undefined,
          block_id: selectedBlockId !== 'all' ? selectedBlockId : undefined,
          status: statusFilter !== 'All' ? statusFilter : undefined,
          search: searchQuery.trim() || undefined,
        }),
      ]);
      setHostels(hList);
      setBlocks(bList);
      setRooms(rList);
    } catch (err: any) {
      toast.error('Failed to load room inventory');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedHostelId, selectedBlockId, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleOpenRoomDetail = async (room: Room) => {
    try {
      const detail = await api.getRoom(room.RoomID);
      setSelectedRoomDetail(detail);
      setIsRoomDetailOpen(true);
    } catch (err: any) {
      toast.error('Failed to load room details');
    }
  };

  const handleCreateHostel = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.createHostel(hostelForm);
      toast.success(`Hostel ${hostelForm.name} created successfully`);
      setIsAddHostelOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create hostel');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.createBlock(blockForm);
      toast.success(`Block ${blockForm.name} created with floors`);
      setIsAddBlockOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create block');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.createRoom(roomForm);
      toast.success(`Room ${roomForm.roomNumber} created`);
      setIsAddRoomOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create room');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate quick stats on current filtered view
  const totalBeds = rooms.reduce((acc, r) => acc + r.Capacity, 0);
  const occupiedBeds = rooms.reduce((acc, r) => acc + r.CurrentOccupancy, 0);
  const availableBeds = Math.max(0, totalBeds - occupiedBeds);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-content-primary">
              Hostels & Room Inventory
            </h2>
            <Badge variant="sage" size="sm">
              Property Suite
            </Badge>
          </div>
          <p className="text-xs text-content-secondary mt-1">
            Visual room map, occupancy quotas, bed-level allocations, and block structures.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddBlockOpen(true)}
            icon={<Layers className="w-4 h-4" />}
          >
            Add Block
          </Button>
          <Button
            size="sm"
            onClick={() => setIsAddRoomOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Add Room
          </Button>
        </div>
      </div>

      {/* Hostel Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-gray-200">
        <button
          onClick={() => {
            setSelectedHostelId('all');
            setSelectedBlockId('all');
            setSearchParams({});
          }}
          className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors whitespace-nowrap ${
            selectedHostelId === 'all'
              ? 'bg-blue-600 text-white border-blue-600 font-semibold'
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
          }`}
        >
          All Hostels ({hostels.length})
        </button>

        {hostels.map((h) => (
          <button
            key={h.HostelID}
            onClick={() => {
              setSelectedHostelId(h.HostelID);
              setSelectedBlockId('all');
              setSearchParams({ hostel: h.HostelID.toString() });
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              selectedHostelId === h.HostelID
                ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <span>{h.HostelName}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded ${
                selectedHostelId === h.HostelID
                  ? 'bg-blue-700 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {h.HostelType}
            </span>
          </button>
        ))}

        <button
          onClick={() => setIsAddHostelOpen(true)}
          className="px-2.5 py-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium hover:bg-blue-50 rounded border border-dashed border-blue-300 transition-colors whitespace-nowrap flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Hostel
        </button>
      </div>

      {/* Property Capacity Overview Banner */}
      <Card className="p-4 bg-white border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Viewing Rooms
            </span>
            <div className="text-xl font-bold text-gray-900 mt-0.5">
              {rooms.length} Rooms Listed
            </div>
          </div>

          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Bed Capacity
            </span>
            <div className="text-xl font-bold text-gray-900 mt-0.5">
              {occupiedBeds} <span className="text-xs font-normal text-gray-500">/ {totalBeds} Beds</span>
            </div>
          </div>

          <div className="md:col-span-2">
            <OccupancyBar occupied={occupiedBeds} total={totalBeds} size="md" />
          </div>
        </div>
      </Card>

      {/* Filters & Search Toolbar */}
      <Card className="p-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search room number (e.g. A101, B201)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded border border-gray-300 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            />
          </form>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {['All', 'Available', 'Partially Occupied', 'Full', 'Under Maintenance'].map((st) => (
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

            <div className="h-4 w-px bg-gray-200 mx-1" />

            {/* Grid / List toggle */}
            <div className="flex items-center border border-gray-200 rounded p-0.5 bg-gray-50">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded ${viewMode === 'grid' ? 'bg-white shadow-xs text-blue-600' : 'text-gray-400'}`}
                title="Grid View"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1 rounded ${viewMode === 'list' ? 'bg-white shadow-xs text-blue-600' : 'text-gray-400'}`}
                title="List View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Room Inventory Collection */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-44 bg-slate-200 rounded-card" />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <Card className="p-12 text-center">
          <DoorOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-content-primary">No rooms match filter</h3>
          <p className="text-xs text-content-secondary mt-1 mb-4">
            Try switching hostel tabs or selecting 'All' status.
          </p>
          <Button size="sm" onClick={() => setIsAddRoomOpen(true)} icon={<Plus className="w-4 h-4" />}>
            Create New Room
          </Button>
        </Card>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {rooms.map((room) => {
            const isFull = room.CurrentOccupancy >= room.Capacity;
            const isMaintenance = room.Status === 'Under Maintenance';
            const availableSlots = Math.max(0, room.Capacity - room.CurrentOccupancy);

            return (
              <Card
                key={room.RoomID}
                hoverable
                onClick={() => handleOpenRoomDetail(room)}
                className="flex flex-col justify-between group relative border-surface-border"
              >
                <div>
                  {/* Top: Room Number & Status */}
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-lg font-bold text-content-primary group-hover:text-brand-blue transition-colors">
                        Room {room.RoomNumber}
                      </span>
                      <p className="text-[11px] text-content-secondary">
                        {room.BlockName} • {room.HostelName}
                      </p>
                    </div>
                    <Badge variant={getStatusBadgeVariant(room.Status)} size="sm">
                      {room.Status}
                    </Badge>
                  </div>

                  {/* Room Type & Details */}
                  <div className="mt-4 flex items-center gap-2 text-xs text-content-secondary">
                    <span className="font-semibold text-content-primary bg-slate-100 px-2 py-0.5 rounded">
                      {room.RoomType}
                    </span>
                    <span>Floor {room.FloorNumber ?? 1}</span>
                  </div>

                  {/* Bed Visualization Chips */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-content-secondary">Bed Occupancy</span>
                      <span className="font-semibold text-content-primary">
                        {room.CurrentOccupancy} / {room.Capacity} Beds
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {[...Array(room.Capacity)].map((_, idx) => {
                        const isOccupied = idx < room.CurrentOccupancy;
                        return (
                          <div
                            key={idx}
                            className={`flex-1 h-7 rounded-lg flex items-center justify-center text-[10px] font-semibold border ${
                              isMaintenance
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : isOccupied
                                ? 'bg-blue-50 text-brand-blue border-blue-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                            title={`Bed ${idx + 1}: ${isOccupied ? 'Occupied' : 'Vacant'}`}
                          >
                            <Bed className="w-3.5 h-3.5 mr-1" />
                            {idx + 1}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-4 pt-3 border-t border-surface-border flex items-center justify-between text-xs text-slate-400">
                  <span>{availableSlots} beds vacant</span>
                  <span className="text-brand-blue font-semibold group-hover:underline flex items-center gap-0.5">
                    Inspect Room
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-surface-border bg-slate-50/70 text-content-secondary uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3 px-4">Room</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Occupancy</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rooms.map((room) => (
                  <tr key={room.RoomID} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-bold text-content-primary">
                      Room {room.RoomNumber}
                    </td>
                    <td className="py-3 px-4 text-content-secondary">
                      {room.BlockName} • {room.HostelName} (Floor {room.FloorNumber})
                    </td>
                    <td className="py-3 px-4 font-medium text-content-primary">
                      {room.RoomType}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-content-primary">
                        {room.CurrentOccupancy}
                      </span>{' '}
                      / {room.Capacity} beds
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={getStatusBadgeVariant(room.Status)} size="sm">
                        {room.Status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenRoomDetail(room)}
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ROOM DETAILS INSPECTOR SLIDE-OVER */}
      <SlideOver
        isOpen={isRoomDetailOpen}
        onClose={() => {
          setIsRoomDetailOpen(false);
          setSelectedRoomDetail(null);
        }}
        title={`Room ${selectedRoomDetail?.RoomNumber ?? ''}`}
        subtitle={`${selectedRoomDetail?.BlockName ?? ''} • ${selectedRoomDetail?.HostelName ?? ''}`}
      >
        {selectedRoomDetail && (
          <div className="space-y-6 text-xs">
            {/* Meta summary */}
            <div className="p-4 bg-slate-50 border border-surface-border rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-content-primary">
                  {selectedRoomDetail.RoomType} Room
                </span>
                <Badge variant={getStatusBadgeVariant(selectedRoomDetail.Status)}>
                  {selectedRoomDetail.Status}
                </Badge>
              </div>
              <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2 text-content-secondary">
                <div>Total Capacity: {selectedRoomDetail.Capacity} Beds</div>
                <div>Occupied: {selectedRoomDetail.CurrentOccupancy} Beds</div>
                <div>Floor: {selectedRoomDetail.FloorNumber}</div>
                <div>Available: {Math.max(0, selectedRoomDetail.Capacity - selectedRoomDetail.CurrentOccupancy)} Beds</div>
              </div>
            </div>

            {/* Current Occupants List */}
            <div className="border border-surface-border rounded-xl p-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-content-primary mb-3 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-brand-blue" />
                Active Student Occupants ({selectedRoomDetail.occupants?.length ?? 0})
              </h4>

              {selectedRoomDetail.occupants && selectedRoomDetail.occupants.length > 0 ? (
                <div className="space-y-2.5">
                  {selectedRoomDetail.occupants.map((occ) => (
                    <div
                      key={occ.AllocationID}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-content-primary">{occ.Name}</div>
                        <div className="text-[11px] text-content-secondary mt-0.5">
                          {occ.RegNo} • {occ.Department}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          Allocated on: {occ.AllocationDate}
                        </div>
                      </div>
                      <Badge variant="success" size="sm">
                        Active
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 italic">No students allocated to this room currently.</p>
              )}
            </div>

            {/* Room Maintenance Records */}
            <div className="border border-surface-border rounded-xl p-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-content-primary mb-3 flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-amber-600" />
                Maintenance Requests
              </h4>

              {selectedRoomDetail.maintenance && selectedRoomDetail.maintenance.length > 0 ? (
                <div className="space-y-2">
                  {selectedRoomDetail.maintenance.map((m) => (
                    <div key={m.RequestID} className="p-2.5 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-content-primary">{m.RequestType}</span>
                        <Badge variant={getStatusBadgeVariant(m.Status)} size="sm">
                          {m.Status}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-content-secondary mt-1">{m.Description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 italic">No maintenance tickets logged for this room.</p>
              )}
            </div>
          </div>
        )}
      </SlideOver>

      {/* CREATE HOSTEL MODAL */}
      <Modal
        isOpen={isAddHostelOpen}
        onClose={() => setIsAddHostelOpen(false)}
        title="Create New Hostel Building"
        subtitle="BACSE202 College Hostel Property Management"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsAddHostelOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateHostel} isLoading={isSaving}>
              Save Hostel
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateHostel} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-content-primary mb-1">Hostel Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Tagore International Hostel"
              value={hostelForm.name}
              onChange={(e) => setHostelForm({ ...hostelForm, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-content-primary mb-1">Hostel Type *</label>
              <select
                value={hostelForm.type}
                onChange={(e) => setHostelForm({ ...hostelForm, type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              >
                <option value="Boys">Boys Hostel</option>
                <option value="Girls">Girls Hostel</option>
                <option value="Co-ed">Co-ed Hostel</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-content-primary mb-1">Total Capacity (Beds) *</label>
              <input
                type="number"
                required
                min={1}
                value={hostelForm.totalCapacity}
                onChange={(e) => setHostelForm({ ...hostelForm, totalCapacity: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* CREATE BLOCK MODAL */}
      <Modal
        isOpen={isAddBlockOpen}
        onClose={() => setIsAddBlockOpen(false)}
        title="Add New Block"
        subtitle="Divides hostel buildings into floors and room wings"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsAddBlockOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateBlock} isLoading={isSaving}>
              Save Block
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateBlock} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-content-primary mb-1">Block Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Block C (East Wing)"
              value={blockForm.name}
              onChange={(e) => setBlockForm({ ...blockForm, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            />
          </div>

          <div>
            <label className="block font-semibold text-content-primary mb-1">Parent Hostel *</label>
            <select
              value={blockForm.hostelId}
              onChange={(e) => setBlockForm({ ...blockForm, hostelId: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            >
              {hostels.map((h) => (
                <option key={h.HostelID} value={h.HostelID}>
                  {h.HostelName} ({h.HostelType})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-content-primary mb-1">Total Floors *</label>
            <input
              type="number"
              required
              min={1}
              max={15}
              value={blockForm.totalFloors}
              onChange={(e) => setBlockForm({ ...blockForm, totalFloors: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            />
          </div>
        </form>
      </Modal>

      {/* CREATE ROOM MODAL */}
      <Modal
        isOpen={isAddRoomOpen}
        onClose={() => setIsAddRoomOpen(false)}
        title="Add Room to Inventory"
        subtitle="Assigns room capacity and unit configuration"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsAddRoomOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateRoom} isLoading={isSaving}>
              Save Room
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateRoom} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-content-primary mb-1">Room Number *</label>
            <input
              type="text"
              required
              placeholder="e.g. A-301"
              value={roomForm.roomNumber}
              onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-content-primary mb-1">Room Type *</label>
              <select
                value={roomForm.roomType}
                onChange={(e) => {
                  const t = e.target.value;
                  const defaultCap = t === 'Single' ? 1 : t === 'Double' ? 2 : t === 'Triple' ? 3 : 4;
                  setRoomForm({ ...roomForm, roomType: t, capacity: defaultCap });
                }}
                className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              >
                <option value="Single">Single (1 Bed)</option>
                <option value="Double">Double (2 Beds)</option>
                <option value="Triple">Triple (3 Beds)</option>
                <option value="Dormitory">Dormitory (4+ Beds)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-content-primary mb-1">Bed Capacity *</label>
              <input
                type="number"
                required
                min={1}
                max={10}
                value={roomForm.capacity}
                onChange={(e) => setRoomForm({ ...roomForm, capacity: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
