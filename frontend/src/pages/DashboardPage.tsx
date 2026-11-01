import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { DashboardSummary, HostelSummary, RecentActivity } from '../types';

export const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [hostels, setHostels] = useState<HostelSummary[]>([]);
  const [activity, setActivity] = useState<RecentActivity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [sumRes, hostRes, actRes] = await Promise.all([
        api.getDashboardSummary(),
        api.getDashboardHostels(),
        api.getRecentActivity(),
      ]);
      setSummary(sumRes);
      setHostels(hostRes);
      setActivity(actRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data from backend');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="py-8 text-center text-sm text-gray-500">
        Loading dashboard data from database...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-white border border-red-300 rounded text-sm text-red-700">
        <p className="font-semibold">Backend Connection Error</p>
        <p className="text-xs mt-1 text-gray-600">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-3 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-300 gap-2">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Dashboard</h1>
          <p className="text-xs text-gray-500">
            System overview and hostel occupancy metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboardData}
            className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
          >
            Refresh
          </button>
          <Link
            to="/allocations"
            className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            New Allocation
          </Link>
        </div>
      </div>

      {/* 4 Simple Rectangular Stat Blocks */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 bg-white border border-gray-300 rounded">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Total Students
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {summary?.totalStudents ?? 0}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">Enrolled in system</div>
        </div>

        <div className="p-4 bg-white border border-gray-300 rounded">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Total Rooms
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {summary?.totalRooms ?? 0}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">Across all blocks</div>
        </div>

        <div className="p-4 bg-white border border-gray-300 rounded">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Occupied Beds
          </div>
          <div className="text-2xl font-bold text-blue-700 mt-1">
            {summary?.occupiedBeds ?? 0}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {summary?.occupancyPercentage ?? 0}% occupancy
          </div>
        </div>

        <div className="p-4 bg-white border border-gray-300 rounded">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Available Beds
          </div>
          <div className="text-2xl font-bold text-green-700 mt-1">
            {summary?.availableBeds ?? 0}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">Vacant for allocation</div>
        </div>
      </div>

      {/* Hostel Overview Table */}
      <div className="bg-white border border-gray-300 rounded">
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-300 flex items-center justify-between">
          <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
            Hostel Overview
          </h2>
          <Link
            to="/rooms"
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            View All Rooms
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300 text-gray-700 font-semibold">
                <th className="py-2.5 px-3 border-r border-gray-300">Hostel Name</th>
                <th className="py-2.5 px-3 border-r border-gray-300">Type</th>
                <th className="py-2.5 px-3 border-r border-gray-300 text-center">Rooms</th>
                <th className="py-2.5 px-3 border-r border-gray-300 text-center">Bed Capacity</th>
                <th className="py-2.5 px-3 border-r border-gray-300 text-center">Occupied Beds</th>
                <th className="py-2.5 px-3 border-r border-gray-300 text-center">Available Beds</th>
                <th className="py-2.5 px-3 text-center">Occupancy %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {hostels.map((h) => (
                <tr key={h.hostelId} className="hover:bg-gray-50">
                  <td className="py-2 px-3 font-semibold text-gray-900 border-r border-gray-200">
                    {h.hostelName}
                  </td>
                  <td className="py-2 px-3 text-gray-600 border-r border-gray-200">
                    {h.hostelType}
                  </td>
                  <td className="py-2 px-3 text-center text-gray-800 border-r border-gray-200">
                    {h.roomCount}
                  </td>
                  <td className="py-2 px-3 text-center text-gray-800 border-r border-gray-200">
                    {h.totalCapacity}
                  </td>
                  <td className="py-2 px-3 text-center font-medium text-blue-700 border-r border-gray-200">
                    {h.occupiedBeds}
                  </td>
                  <td className="py-2 px-3 text-center font-medium text-green-700 border-r border-gray-200">
                    {h.availableBeds}
                  </td>
                  <td className="py-2 px-3 text-center font-medium text-gray-900">
                    {h.occupancyPercentage}%
                  </td>
                </tr>
              ))}
              {hostels.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-gray-500">
                    No hostels registered.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Allocations Table */}
      <div className="bg-white border border-gray-300 rounded">
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-300 flex items-center justify-between">
          <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
            Recent Allocations
          </h2>
          <Link
            to="/allocations"
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Manage Allocations
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300 text-gray-700 font-semibold">
                <th className="py-2.5 px-3 border-r border-gray-300">Student Name</th>
                <th className="py-2.5 px-3 border-r border-gray-300">Reg No</th>
                <th className="py-2.5 px-3 border-r border-gray-300">Room</th>
                <th className="py-2.5 px-3 border-r border-gray-300">Allocation Date</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {activity?.recentAllocations?.map((alloc) => (
                <tr key={alloc.AllocationID} className="hover:bg-gray-50">
                  <td className="py-2 px-3 font-medium text-gray-900 border-r border-gray-200">
                    {alloc.StudentName}
                  </td>
                  <td className="py-2 px-3 font-mono text-gray-600 border-r border-gray-200">
                    {alloc.RegNo}
                  </td>
                  <td className="py-2 px-3 text-gray-700 border-r border-gray-200">
                    Room {alloc.RoomNumber}
                  </td>
                  <td className="py-2 px-3 text-gray-600 border-r border-gray-200">
                    {alloc.AllocationDate}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${
                        alloc.Status === 'Active'
                          ? 'bg-green-50 text-green-800 border-green-300'
                          : 'bg-gray-100 text-gray-700 border-gray-300'
                      }`}
                    >
                      {alloc.Status}
                    </span>
                  </td>
                </tr>
              ))}
              {(!activity?.recentAllocations || activity.recentAllocations.length === 0) && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-500">
                    No recent allocations recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default DashboardPage;
