import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  Search,
  Mail,
  Phone,
  Building,
  UserCheck,
  Calendar,
  Clock,
  Briefcase
} from 'lucide-react';
import { api } from '../api/client';
import { Staff, Warden, Hostel } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SlideOver } from '../components/ui/SlideOver';
import { useToast } from '../components/ui/Toast';

export const StaffWardensPage: React.FC = () => {
  const toast = useToast();
  const [wardens, setWardens] = useState<Warden[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'wardens' | 'staff'>('wardens');

  // Add modals
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [isAddWardenOpen, setIsAddWardenOpen] = useState(false);

  // Forms
  const [staffForm, setStaffForm] = useState({
    name: '',
    role: 'Electrician',
    contactNumber: '+91 ',
    shift: 'Morning',
    hostelId: '',
    dateOfJoining: new Date().toISOString().split('T')[0],
  });
  const [wardenForm, setWardenForm] = useState({
    name: '',
    contactNumber: '+91 ',
    email: '',
    dateOfJoining: new Date().toISOString().split('T')[0],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [wList, sList, hList] = await Promise.all([
        api.getWardens(),
        api.getStaff(),
        api.getHostels(),
      ]);
      setWardens(wList);
      setStaff(sList);
      setHostels(hList);
    } catch (err: any) {
      toast.error('Failed to load personnel directory');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.name.trim() || !staffForm.contactNumber.trim()) {
      toast.error('Please fill in name and mobile number.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createStaff({
        ...staffForm,
        hostelId: staffForm.hostelId ? Number(staffForm.hostelId) : undefined,
      });
      toast.success(`Staff member ${staffForm.name} registered`);
      setIsAddStaffOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add staff');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateWarden = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wardenForm.name.trim() || !wardenForm.email.trim()) {
      toast.error('Please fill in warden name and official email.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createWarden(wardenForm);
      toast.success(`Warden ${wardenForm.name} registered`);
      setIsAddWardenOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add warden');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-content-primary">
              Wardens & Hostel Staff
            </h2>
            <Badge variant="neutral" size="sm">
              Personnel Directory
            </Badge>
          </div>
          <p className="text-xs text-content-secondary mt-1">
            Administrative chief wardens, shift maintenance technicians, and security personnel.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddWardenOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Add Warden
          </Button>
          <Button
            size="sm"
            onClick={() => setIsAddStaffOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Add Staff Member
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('wardens')}
          className={`px-3.5 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'wardens'
              ? 'border-blue-600 text-blue-700 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Hostel Wardens ({wardens.length})
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`px-3.5 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'staff'
              ? 'border-blue-600 text-blue-700 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Operational Staff ({staff.length})
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-gray-500 animate-pulse">
          Loading personnel directory...
        </div>
      ) : activeTab === 'wardens' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {wardens.map((w) => (
            <Card key={w.WardenID} className="p-4">
              <div className="flex items-start justify-between">
                <div className="w-8 h-8 rounded border border-blue-200 bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-xs">
                  {w.Name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </div>
                <Badge variant="sage" size="sm">
                  Warden
                </Badge>
              </div>

              <h4 className="text-sm font-bold text-content-primary mt-3">
                {w.Name}
              </h4>

              <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-xs text-content-secondary">
                <div className="flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-medium text-content-primary">
                    {w.HostelName || 'Assigned to General Operations'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{w.ContactNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{w.Email}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Joined on: {w.DateOfJoining}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {staff.map((s) => (
            <Card key={s.StaffID} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-content-primary">{s.Name}</h4>
                  <p className="text-xs text-brand-blue font-semibold">{s.Role}</p>
                </div>
                <Badge
                  variant={
                    s.Shift === 'Morning' ? 'info' : s.Shift === 'Night' ? 'neutral' : 'warning'
                  }
                  size="sm"
                >
                  {s.Shift} Shift
                </Badge>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-content-secondary">
                <div className="flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span>{s.HostelName || 'All Campus Hostels'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{s.ContactNumber}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Joined on: {s.DateOfJoining}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ADD WARDEN SLIDE-OVER */}
      <SlideOver
        isOpen={isAddWardenOpen}
        onClose={() => setIsAddWardenOpen(false)}
        title="Register Chief Warden"
        subtitle="BACSE202 Residential Administration"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsAddWardenOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateWarden} isLoading={isSubmitting}>
              Save Warden
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateWarden} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-content-primary mb-1">
              Full Legal Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Dr. K. Ramanathan"
              value={wardenForm.name}
              onChange={(e) => setWardenForm({ ...wardenForm, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            />
          </div>

          <div>
            <label className="block font-semibold text-content-primary mb-1">
              Mobile Contact *
            </label>
            <input
              type="text"
              required
              placeholder="+91 98401 23456"
              value={wardenForm.contactNumber}
              onChange={(e) => setWardenForm({ ...wardenForm, contactNumber: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            />
          </div>

          <div>
            <label className="block font-semibold text-content-primary mb-1">
              Official Email *
            </label>
            <input
              type="email"
              required
              placeholder="warden@college.edu"
              value={wardenForm.email}
              onChange={(e) => setWardenForm({ ...wardenForm, email: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            />
          </div>

          <div>
            <label className="block font-semibold text-content-primary mb-1">
              Date of Joining *
            </label>
            <input
              type="date"
              required
              value={wardenForm.dateOfJoining}
              onChange={(e) => setWardenForm({ ...wardenForm, dateOfJoining: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            />
          </div>
        </form>
      </SlideOver>

      {/* ADD STAFF SLIDE-OVER */}
      <SlideOver
        isOpen={isAddStaffOpen}
        onClose={() => setIsAddStaffOpen(false)}
        title="Register Hostel Staff"
        subtitle="Technician, Housekeeping, or Security personnel"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsAddStaffOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateStaff} isLoading={isSubmitting}>
              Save Staff
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-content-primary mb-1">
              Staff Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. S. Govindaraj"
              value={staffForm.name}
              onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-content-primary mb-1">
                Designation / Role *
              </label>
              <select
                value={staffForm.role}
                onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              >
                <option value="Electrician">Electrician</option>
                <option value="Plumber">Plumber</option>
                <option value="Caretaker">Caretaker</option>
                <option value="Security Officer">Security Officer</option>
                <option value="Housekeeping Supervisor">Housekeeping Supervisor</option>
                <option value="Maintenance Technician">Maintenance Technician</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-content-primary mb-1">
                Duty Shift *
              </label>
              <select
                value={staffForm.shift}
                onChange={(e) => setStaffForm({ ...staffForm, shift: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              >
                <option value="Morning">Morning (06:00 - 14:00)</option>
                <option value="Evening">Evening (14:00 - 22:00)</option>
                <option value="Night">Night (22:00 - 06:00)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-content-primary mb-1">
              Mobile Contact *
            </label>
            <input
              type="text"
              required
              placeholder="+91 94441 11223"
              value={staffForm.contactNumber}
              onChange={(e) => setStaffForm({ ...staffForm, contactNumber: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            />
          </div>

          <div>
            <label className="block font-semibold text-content-primary mb-1">
              Assigned Hostel
            </label>
            <select
              value={staffForm.hostelId}
              onChange={(e) => setStaffForm({ ...staffForm, hostelId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            >
              <option value="">-- All Hostels / Campus General --</option>
              {hostels.map((h) => (
                <option key={h.HostelID} value={h.HostelID}>
                  {h.HostelName} ({h.HostelType})
                </option>
              ))}
            </select>
          </div>
        </form>
      </SlideOver>
    </div>
  );
};
