import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Plus,
  Search,
  Clock,
  User,
  Calendar,
  Phone,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { api } from '../api/client';
import { Visitor, Student, Staff } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SlideOver } from '../components/ui/SlideOver';
import { useToast } from '../components/ui/Toast';

export const VisitorsPage: React.FC = () => {
  const toast = useToast();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add Visitor Drawer
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newForm, setNewForm] = useState({
    name: '',
    contactNumber: '',
    relationToStudent: 'Father',
    studentId: '',
    visitDate: new Date().toISOString().split('T')[0],
    checkInTime: '10:00 AM',
    checkOutTime: '01:00 PM',
    approvedBy: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchVisitors = async () => {
    setIsLoading(true);
    try {
      const data = await api.getVisitors();
      setVisitors(data);
    } catch (err: any) {
      toast.error('Failed to load visitor log');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
    Promise.all([api.getStudents(), api.getStaff()])
      .then(([st, sf]) => {
        setStudents(st);
        setStaff(sf);
      })
      .catch(() => {});
  }, []);

  const handleCreateVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.name.trim() || !newForm.studentId || !newForm.contactNumber.trim()) {
      toast.error('Please fill in visitor name, mobile, and resident visited.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createVisitor({
        name: newForm.name,
        contactNumber: newForm.contactNumber,
        relationToStudent: newForm.relationToStudent,
        studentId: Number(newForm.studentId),
        visitDate: newForm.visitDate,
        checkInTime: newForm.checkInTime,
        checkOutTime: newForm.checkOutTime || undefined,
        approvedBy: newForm.approvedBy ? Number(newForm.approvedBy) : undefined,
      });
      toast.success(`Visitor entry recorded for ${newForm.name}`);
      setIsNewOpen(false);
      fetchVisitors();
    } catch (err: any) {
      toast.error(err.message || 'Failed to record visitor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = visitors.filter((v) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      v.Name.toLowerCase().includes(q) ||
      v.StudentName?.toLowerCase().includes(q) ||
      v.RegNo?.toLowerCase().includes(q) ||
      v.RelationToStudent.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-content-primary">
              Visitor Gate Logbook
            </h2>
            <Badge variant="neutral" size="sm">
              {visitors.length} Recorded Visits
            </Badge>
          </div>
          <p className="text-xs text-content-secondary mt-1">
            Campus security log of parents, guardians, and guests visiting hostel residents.
          </p>
        </div>

        <Button
          onClick={() => {
            setNewForm({
              name: '',
              contactNumber: '+91 ',
              relationToStudent: 'Father',
              studentId: '',
              visitDate: new Date().toISOString().split('T')[0],
              checkInTime: '10:00 AM',
              checkOutTime: '01:00 PM',
              approvedBy: '',
            });
            setIsNewOpen(true);
          }}
          icon={<Plus className="w-4 h-4" />}
        >
          Register Visitor Entry
        </Button>
      </div>

      {/* Toolbar */}
      <Card className="p-3">
        <div className="relative max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search visitor, student name, or relation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded border border-gray-300 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          />
        </div>
      </Card>

      {/* Visitors Table */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-content-secondary animate-pulse">
            Loading visitor log...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-content-primary">No visitor entries found</h3>
            <p className="text-xs text-content-secondary mt-1">
              Log student guests and visiting guardians at the main gate.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-surface-border bg-slate-50/70 text-content-secondary uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3 px-4">Visitor</th>
                  <th className="py-3 px-4">Relation</th>
                  <th className="py-3 px-4">Student Visited</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Timing (In / Out)</th>
                  <th className="py-3 px-4">Approved By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((v) => (
                  <tr key={v.VisitorID} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-content-primary text-xs">
                        {v.Name}
                      </div>
                      <div className="text-[11px] text-content-secondary flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {v.ContactNumber}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <Badge variant="sage" size="sm">
                        {v.RelationToStudent}
                      </Badge>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-content-primary">
                        {v.StudentName}
                      </div>
                      <div className="text-[11px] text-brand-blue font-mono">
                        {v.RegNo}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-content-secondary">
                      {v.VisitDate}
                    </td>

                    <td className="py-3 px-4 text-content-secondary">
                      <div>In: <strong className="text-content-primary">{v.CheckInTime}</strong></div>
                      {v.CheckOutTime && <div>Out: {v.CheckOutTime}</div>}
                    </td>

                    <td className="py-3 px-4 text-content-secondary">
                      {v.ApprovedByName ? (
                        <span className="font-medium text-slate-700">
                          {v.ApprovedByName}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Duty Warden</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* REGISTER ENTRY SLIDE-OVER */}
      <SlideOver
        isOpen={isNewOpen}
        onClose={() => setIsNewOpen(false)}
        title="Register Visitor Entry"
        subtitle="Hostel security clearance record"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsNewOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateVisitor} isLoading={isSubmitting}>
              Issue Gate Pass
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateVisitor} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-content-primary mb-1">
              Visitor Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Chandra"
              value={newForm.name}
              onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-content-primary mb-1">
                Relation to Student *
              </label>
              <select
                value={newForm.relationToStudent}
                onChange={(e) => setNewForm({ ...newForm, relationToStudent: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              >
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Brother">Brother</option>
                <option value="Sister">Sister</option>
                <option value="Local Guardian">Local Guardian</option>
                <option value="Friend / Relative">Friend / Relative</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-content-primary mb-1">
                Visitor Contact Number *
              </label>
              <input
                type="text"
                required
                placeholder="+91 98765 43210"
                value={newForm.contactNumber}
                onChange={(e) => setNewForm({ ...newForm, contactNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-content-primary mb-1">
              Student Being Visited *
            </label>
            <select
              required
              value={newForm.studentId}
              onChange={(e) => setNewForm({ ...newForm, studentId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            >
              <option value="">-- Choose Resident --</option>
              {students.map((st) => (
                <option key={st.StudentID} value={st.StudentID}>
                  {st.Name} ({st.RegNo}) {st.RoomNumber ? `• Room ${st.RoomNumber}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-content-primary mb-1">
                Check-in Time *
              </label>
              <input
                type="text"
                required
                placeholder="10:30 AM"
                value={newForm.checkInTime}
                onChange={(e) => setNewForm({ ...newForm, checkInTime: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              />
            </div>

            <div>
              <label className="block font-semibold text-content-primary mb-1">
                Expected Check-out Time
              </label>
              <input
                type="text"
                placeholder="02:00 PM"
                value={newForm.checkOutTime}
                onChange={(e) => setNewForm({ ...newForm, checkOutTime: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-content-primary mb-1">
              Authorizing Security / Staff
            </label>
            <select
              value={newForm.approvedBy}
              onChange={(e) => setNewForm({ ...newForm, approvedBy: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            >
              <option value="">-- Main Gate Duty Warden --</option>
              {staff.map((st) => (
                <option key={st.StaffID} value={st.StaffID}>
                  {st.Name} ({st.Role})
                </option>
              ))}
            </select>
          </div>
        </form>
      </SlideOver>
    </div>
  );
};
