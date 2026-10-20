import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Building2,
  BedDouble,
  CreditCard,
  AlertTriangle,
  RefreshCw,
  Building,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import { api } from '../api/client';
import {
  DashboardSummary,
  HostelSummary,
  DashboardAnalytics,
  RecentActivity
} from '../types';
import { MetricCard, Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge, getStatusBadgeVariant } from '../components/ui/Badge';
import { OccupancyBar } from '../components/ui/OccupancyBar';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [hostels, setHostels] = useState<HostelSummary[]>([]);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [activity, setActivity] = useState<RecentActivity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [sumRes, hostRes, anaRes, actRes] = await Promise.all([
        api.getDashboardSummary(),
        api.getDashboardHostels(),
        api.getDashboardAnalytics(),
        api.getRecentActivity(),
      ]);
      setSummary(sumRes);
      setHostels(hostRes);
      setAnalytics(anaRes);
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
      <div className="space-y-4">
        <div className="h-6 bg-gray-100 rounded w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded border border-gray-200" />
          ))}
        </div>
        <div className="h-64 bg-gray-100 rounded border border-gray-200" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white border border-red-200 rounded text-center">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <h3 className="text-base font-bold text-gray-900">Backend Connection Error</h3>
        <p className="text-xs text-gray-600 max-w-md mx-auto mt-1 mb-3">
          {error}
        </p>
        <div className="flex justify-center gap-2">
          <Button size="sm" onClick={fetchDashboardData} icon={<RefreshCw className="w-3.5 h-3.5" />}>
            Retry
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate('/settings')}>
            Settings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Clean Academic Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold tracking-tight text-gray-900">
              Hostel Management Dashboard
            </h2>
            <Badge variant="info" size="sm">
              BACSE202 DA3
            </Badge>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Digital Assignment 3 — BACSE202 Database Systems • VIT Chennai • Ganga, Yamuna & Cauvery Hostels
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/allocations')}
            icon={<BedDouble className="w-3.5 h-3.5" />}
          >
            Allocate Room
          </Button>
        </div>
      </div>

      {/* 1. Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <MetricCard
          title="Total Students"
          value={summary?.totalStudents ?? 0}
          subtitle="Enrolled residents"
          icon={<Users className="w-4 h-4 text-blue-600" />}
          iconBg="bg-blue-50"
          onClick={() => navigate('/students')}
        />

        <MetricCard
          title="Room Occupancy"
          value={`${summary?.occupancyPercentage ?? 0}%`}
          subtitle={`${summary?.occupiedBeds ?? 0} of ${summary?.totalCapacity ?? 0} beds`}
          icon={<BedDouble className="w-4 h-4 text-green-700" />}
          iconBg="bg-green-50"
          onClick={() => navigate('/hostels-rooms')}
        />

        <MetricCard
          title="Available Beds"
          value={summary?.availableBeds ?? 0}
          subtitle={`${summary?.totalRooms ?? 0} rooms registered`}
          icon={<Building2 className="w-4 h-4 text-gray-700" />}
          iconBg="bg-gray-100"
          onClick={() => navigate('/hostels-rooms')}
        />

        <MetricCard
          title="Pending Fees"
          value={`₹${(summary?.pendingFees ?? 0).toLocaleString('en-IN')}`}
          subtitle={`₹${(summary?.totalCollected ?? 0).toLocaleString('en-IN')} collected`}
          icon={<CreditCard className="w-4 h-4 text-amber-700" />}
          iconBg="bg-amber-50"
          onClick={() => navigate('/payments')}
        />

        <MetricCard
          title="Open Complaints"
          value={summary?.openComplaints ?? 0}
          subtitle={`${summary?.openMaintenance ?? 0} maintenance tasks`}
          icon={<AlertTriangle className="w-4 h-4 text-red-700" />}
          iconBg="bg-red-50"
          onClick={() => navigate('/complaints')}
        />
      </div>

      {/* 2. Hostels Capacity Table */}
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Hostel Property & Capacity Status
            </h3>
            <p className="text-xs text-gray-500">
              Overview of residential buildings, block counts, and live capacity
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/hostels-rooms')}
          >
            Manage Rooms
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50 text-gray-600 font-semibold">
                <th className="py-2.5 px-3">Hostel</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Warden</th>
                <th className="py-2.5 px-3 text-center">Blocks</th>
                <th className="py-2.5 px-3 text-center">Rooms</th>
                <th className="py-2.5 px-3">Bed Capacity</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {hostels.map((h) => (
                <tr key={h.hostelId} className="hover:bg-gray-50/70">
                  <td className="py-2.5 px-3 font-semibold text-gray-900">
                    {h.hostelName}
                  </td>
                  <td className="py-2.5 px-3">
                    <Badge variant={h.hostelType === 'Boys' ? 'info' : 'sage'} size="sm">
                      {h.hostelType}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 text-gray-600">
                    {h.wardenName || 'Not Assigned'}
                  </td>
                  <td className="py-2.5 px-3 text-center font-medium text-gray-800">
                    {h.blockCount}
                  </td>
                  <td className="py-2.5 px-3 text-center font-medium text-gray-800">
                    {h.roomCount}
                  </td>
                  <td className="py-2.5 px-3 w-48">
                    <OccupancyBar
                      occupied={h.occupiedBeds}
                      total={h.totalCapacity}
                      size="sm"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => navigate(`/hostels-rooms?hostel=${h.hostelId}`)}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800 underline"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Simple Analytics Summary */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Hostel Occupancy Simple Bar Chart */}
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3 border-b border-gray-200 pb-2">
              <div>
                <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
                  Hostel Capacity Distribution
                </h3>
                <p className="text-xs text-gray-500">
                  Occupied vs available student capacity
                </p>
              </div>
              <span className="text-[11px] text-gray-500">
                Database Records
              </span>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analytics.hostelOccupancy}
                  margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                >
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '4px',
                      border: '1px solid #E5E7EB',
                      fontSize: '11px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="occupied" name="Occupied Beds" fill="#2563EB" />
                  <Bar dataKey="available" name="Available Beds" fill="#E2E8F0" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Simple Financial Summary Card */}
          <Card>
            <div className="mb-3 border-b border-gray-200 pb-2">
              <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
                Fee Collection Summary
              </h3>
              <p className="text-xs text-gray-500">
                Student fee status
              </p>
            </div>

            <div className="space-y-3 py-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded bg-green-50 border border-green-200">
                <span className="text-green-800 font-medium">Total Collected:</span>
                <span className="font-bold text-green-900 text-sm">
                  ₹{(summary?.totalCollected || 0).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded bg-amber-50 border border-amber-200">
                <span className="text-amber-800 font-medium">Pending Dues:</span>
                <span className="font-bold text-amber-900 text-sm">
                  ₹{(summary?.pendingFees || 0).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded bg-gray-50 border border-gray-200">
                <span className="text-gray-700 font-medium">Total Ledger:</span>
                <span className="font-bold text-gray-900 text-sm">
                  ₹{((summary?.totalCollected || 0) + (summary?.pendingFees || 0)).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200 text-center">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => navigate('/payments')}
              >
                View Payments Ledger
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* 4. Operational Activity Tables */}
      {activity && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent Allocations Table */}
          <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
            <div className="px-3.5 py-2.5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
                  Recent Room Allocations
                </h3>
              </div>
              <button
                onClick={() => navigate('/allocations')}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
              >
                View All
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50 text-gray-600 font-semibold">
                    <th className="py-2 px-3">Student</th>
                    <th className="py-2 px-3">Room</th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activity.recentAllocations.map((a) => (
                    <tr key={a.AllocationID} className="hover:bg-gray-50/50">
                      <td className="py-2 px-3">
                        <div className="font-medium text-gray-900">{a.StudentName}</div>
                        <div className="text-[10px] text-gray-500">{a.RegNo}</div>
                      </td>
                      <td className="py-2 px-3 font-semibold text-gray-800">
                        Room {a.RoomNumber}
                      </td>
                      <td className="py-2 px-3 text-gray-600">
                        {a.AllocationDate}
                      </td>
                      <td className="py-2 px-3">
                        <Badge variant="success" size="sm">
                          {a.Status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Open Complaints Requiring Attention */}
          <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
            <div className="px-3.5 py-2.5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
                  Complaints Requiring Attention
                </h3>
              </div>
              <button
                onClick={() => navigate('/complaints')}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
              >
                View Desk
              </button>
            </div>

            <div className="divide-y divide-gray-100">
              {activity.openComplaints.length === 0 ? (
                <div className="py-6 text-center text-xs text-gray-500">
                  <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-1" />
                  No open complaints recorded.
                </div>
              ) : (
                activity.openComplaints.map((c) => (
                  <div key={c.ComplaintID} className="p-3 flex items-start justify-between gap-2 hover:bg-gray-50/50">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-gray-900">
                          {c.ComplaintType}
                        </span>
                        <Badge variant={getStatusBadgeVariant(c.Priority)} size="sm">
                          {c.Priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">
                        {c.Description}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                        <span>{c.StudentName}</span>
                        <span>•</span>
                        <span>Room {c.RoomNumber}</span>
                        <span>•</span>
                        <span>{c.DateFiled}</span>
                      </div>
                    </div>
                    <Badge variant={getStatusBadgeVariant(c.Status)} size="sm">
                      {c.Status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

