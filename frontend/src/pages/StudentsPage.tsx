import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  Mail,
  Phone,
  Building,
  KeyRound,
  AlertCircle,
  CheckCircle,
  FileText,
  Calendar,
  CreditCard
} from 'lucide-react';
import { api, ApiError } from '../api/client';
import { Student, Hostel } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge, getStatusBadgeVariant } from '../components/ui/Badge';
import { SlideOver } from '../components/ui/SlideOver';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';

export const StudentsPage: React.FC = () => {
  const toast = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');

  // Slide-over states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [fullStudentDetail, setFullStudentDetail] = useState<Student | null>(null);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    regNo: '',
    name: '',
    gender: 'M',
    dob: '2005-01-01',
    department: 'Computer Science',
    year: 2,
    contactNumber: '',
    email: '',
    admissionDate: new Date().toISOString().split('T')[0],
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const data = await api.getStudents({
        search: search.trim() || undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
        department: deptFilter !== 'All' ? deptFilter : undefined,
      });
      setStudents(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch students');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const [stData, hData] = await Promise.all([
          api.getStudents(),
          api.getHostels(),
        ]);
        setStudents(stData);
        setHostels(hData);
      } catch (err: any) {
        toast.error('Could not connect to backend service.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitial();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudents();
  };

  const handleOpenAdd = () => {
    setFormData({
      regNo: '',
      name: '',
      gender: 'M',
      dob: '2005-01-01',
      department: 'Computer Science',
      year: 1,
      contactNumber: '+91 ',
      email: '',
      admissionDate: new Date().toISOString().split('T')[0],
    });
    setFormError(null);
    setIsAddOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setSelectedStudent(student);
    setFormData({
      regNo: student.RegNo,
      name: student.Name,
      gender: student.Gender,
      dob: student.DOB,
      department: student.Department,
      year: student.Year,
      contactNumber: student.ContactNumber,
      email: student.Email,
      admissionDate: student.AdmissionDate,
    });
    setFormError(null);
    setIsEditOpen(true);
  };

  const handleOpenView = async (student: Student) => {
    setSelectedStudent(student);
    setIsViewOpen(true);
    try {
      const full = await api.getStudent(student.StudentID);
      setFullStudentDetail(full);
    } catch (err: any) {
      toast.error('Failed to load student complete history');
    }
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Basic Validation
    if (!formData.regNo.trim() || !formData.name.trim() || !formData.email.trim()) {
      setFormError('Registration number, Full name, and Email are required.');
      return;
    }

    setIsSaving(true);
    try {
      if (isAddOpen) {
        await api.createStudent(formData);
        toast.success(`Student ${formData.name} registered successfully`);
        setIsAddOpen(false);
      } else if (isEditOpen && selectedStudent) {
        await api.updateStudent(selectedStudent.StudentID, formData);
        toast.success(`Student ${formData.name} updated successfully`);
        setIsEditOpen(false);
      }
      fetchStudents();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save student record');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!studentToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteStudent(studentToDelete.StudentID);
      toast.success(`Student ${studentToDelete.Name} removed from registry`);
      setDeleteModalOpen(false);
      fetchStudents();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete student');
    } finally {
      setIsDeleting(false);
      setStudentToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-content-primary">
              Student Directory
            </h2>
            <Badge variant="neutral" size="sm">
              {students.length} Records
            </Badge>
          </div>
          <p className="text-xs text-content-secondary mt-1">
            Manage student registrations, academic departments, and hostel room assignments.
          </p>
        </div>

        <Button onClick={handleOpenAdd} icon={<Plus className="w-4 h-4" />}>
          Register Student
        </Button>
      </div>

      {/* Filters and Search Bar */}
      <Card className="p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, registration number, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded border border-gray-300 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-2.5 text-xs rounded border border-gray-300 text-gray-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All Allocation Status</option>
              <option value="Allocated">Allocated</option>
              <option value="Unallocated">Unallocated</option>
            </select>

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="py-1.5 px-2.5 text-xs rounded border border-gray-300 text-gray-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Information Tech">Information Tech</option>
              <option value="Mechanical Eng">Mechanical Eng</option>
              <option value="Electrical Eng">Electrical Eng</option>
            </select>

            <Button type="submit" variant="secondary" size="sm">
              Apply
            </Button>
          </div>
        </form>
      </Card>

      {/* Students Data Table */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-content-secondary animate-pulse">
            Loading student records from database...
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-content-primary">No students found</h3>
            <p className="text-xs text-content-secondary mt-1 mb-4">
              Try adjusting your search query or department filter.
            </p>
            <Button size="sm" onClick={handleOpenAdd} icon={<Plus className="w-4 h-4" />}>
              Add First Student
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-surface-border bg-slate-50/70 text-content-secondary uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Program & Year</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Hostel & Room</th>
                  <th className="py-3 px-4">Allocation</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => {
                  const isAllocated = student.RoomNumber && student.AllocationStatus === 'Active';
                  return (
                    <tr key={student.StudentID} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0 border border-slate-200">
                            {student.Name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-content-primary text-xs flex items-center gap-1.5">
                              {student.Name}
                              <span className="text-[10px] text-slate-400 font-normal">
                                ({student.Gender})
                              </span>
                            </div>
                            <div className="text-[11px] text-brand-blue font-mono">
                              {student.RegNo}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-content-primary">
                          {student.Department}
                        </div>
                        <div className="text-[11px] text-content-secondary">
                          Year {student.Year}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-content-primary flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {student.ContactNumber}
                        </div>
                        <div className="text-content-secondary text-[11px] flex items-center gap-1.5 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {student.Email}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {isAllocated ? (
                          <div>
                            <div className="font-semibold text-content-primary flex items-center gap-1">
                              <KeyRound className="w-3 h-3 text-emerald-600" />
                              Room {student.RoomNumber}
                            </div>
                            <div className="text-[10px] text-content-secondary">
                              {student.BlockName} • {student.HostelName}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <Badge
                          variant={isAllocated ? 'success' : 'neutral'}
                          size="sm"
                        >
                          {isAllocated ? 'Allocated' : 'Unallocated'}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenView(student)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-brand-blue hover:bg-blue-50 transition-colors"
                            title="View Student Dossier"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(student)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                            title="Edit Student Record"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setStudentToDelete(student);
                              setDeleteModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Student"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ADD / EDIT STUDENT SLIDE-OVER */}
      <SlideOver
        isOpen={isAddOpen || isEditOpen}
        onClose={() => {
          setIsAddOpen(false);
          setIsEditOpen(false);
        }}
        title={isAddOpen ? 'Register New Student' : 'Edit Student Details'}
        subtitle={
          isAddOpen
            ? 'Enter personal, academic, and contact details for residential allocation.'
            : `Updating information for ${selectedStudent?.Name} (${selectedStudent?.RegNo})`
        }
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAddOpen(false);
                setIsEditOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveStudent}
              isLoading={isSaving}
            >
              {isAddOpen ? 'Register Student' : 'Save Changes'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveStudent} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-content-primary mb-1">
              Registration Number *
            </label>
            <input
              type="text"
              required
              disabled={isEditOpen}
              placeholder="e.g. 24BCE1099"
              value={formData.regNo}
              onChange={(e) => setFormData({ ...formData, regNo: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue uppercase disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="block font-semibold text-content-primary mb-1">
              Full Legal Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Aravindhan Subramanian"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-content-primary mb-1">
                Gender *
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              >
                <option value="M">Male (M)</option>
                <option value="F">Female (F)</option>
                <option value="O">Other (O)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-content-primary mb-1">
                Date of Birth *
              </label>
              <input
                type="date"
                required
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-content-primary mb-1">
                Academic Department *
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Information Tech">Information Tech</option>
                <option value="Mechanical Eng">Mechanical Eng</option>
                <option value="Electrical Eng">Electrical Eng</option>
                <option value="Civil Engineering">Civil Engineering</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-content-primary mb-1">
                Year of Study *
              </label>
              <select
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              >
                <option value={1}>1st Year (Freshman)</option>
                <option value={2}>2nd Year (Sophomore)</option>
                <option value={3}>3rd Year (Junior)</option>
                <option value={4}>4th Year (Senior)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-content-primary mb-1">
              Contact Mobile Number *
            </label>
            <input
              type="text"
              required
              placeholder="+91 98765 43210"
              value={formData.contactNumber}
              onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            />
          </div>

          <div>
            <label className="block font-semibold text-content-primary mb-1">
              Institutional Email *
            </label>
            <input
              type="email"
              required
              placeholder="student@college.edu"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            />
          </div>

          <div>
            <label className="block font-semibold text-content-primary mb-1">
              Hostel Admission Date *
            </label>
            <input
              type="date"
              required
              value={formData.admissionDate}
              onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            />
          </div>
        </form>
      </SlideOver>

      {/* VIEW STUDENT DETAILS DOSSIER */}
      <SlideOver
        isOpen={isViewOpen}
        onClose={() => {
          setIsViewOpen(false);
          setFullStudentDetail(null);
        }}
        title="Student Residential Dossier"
        subtitle={fullStudentDetail ? `${fullStudentDetail.Name} (${fullStudentDetail.RegNo})` : 'Loading...'}
        width="lg"
      >
        {fullStudentDetail ? (
          <div className="space-y-6 text-xs">
            {/* Primary Details Card */}
            <div className="p-4 bg-slate-50 border border-surface-border rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-content-primary">
                  {fullStudentDetail.Name}
                </span>
                <Badge
                  variant={fullStudentDetail.AllocationStatus === 'Active' ? 'success' : 'neutral'}
                >
                  {fullStudentDetail.AllocationStatus || 'Unallocated'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-content-secondary pt-2 border-t border-slate-200">
                <div>
                  <span className="font-semibold text-content-primary">Reg No:</span>{' '}
                  <span className="font-mono">{fullStudentDetail.RegNo}</span>
                </div>
                <div>
                  <span className="font-semibold text-content-primary">Gender:</span>{' '}
                  {fullStudentDetail.Gender === 'M' ? 'Male' : fullStudentDetail.Gender === 'F' ? 'Female' : 'Other'}
                </div>
                <div>
                  <span className="font-semibold text-content-primary">Department:</span>{' '}
                  {fullStudentDetail.Department}
                </div>
                <div>
                  <span className="font-semibold text-content-primary">Year:</span> Year{' '}
                  {fullStudentDetail.Year}
                </div>
                <div>
                  <span className="font-semibold text-content-primary">Mobile:</span>{' '}
                  {fullStudentDetail.ContactNumber}
                </div>
                <div>
                  <span className="font-semibold text-content-primary">Email:</span>{' '}
                  {fullStudentDetail.Email}
                </div>
              </div>
            </div>

            {/* Room Allocation Info */}
            <div className="border border-surface-border rounded-xl p-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-content-primary mb-2 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-brand-blue" />
                Current Room Allocation
              </h4>
              {fullStudentDetail.RoomNumber ? (
                <div className="space-y-1 text-content-secondary">
                  <p>
                    <span className="font-semibold text-content-primary">Room:</span> Room{' '}
                    {fullStudentDetail.RoomNumber} ({fullStudentDetail.RoomType || 'Single'})
                  </p>
                  <p>
                    <span className="font-semibold text-content-primary">Block & Hostel:</span>{' '}
                    {fullStudentDetail.BlockName} • {fullStudentDetail.HostelName}
                  </p>
                  <p>
                    <span className="font-semibold text-content-primary">Allocated Date:</span>{' '}
                    {fullStudentDetail.AllocationDate}
                  </p>
                </div>
              ) : (
                <p className="text-slate-400 italic">No active room allocation found.</p>
              )}
            </div>

            {/* Emergency Contacts */}
            <div className="border border-surface-border rounded-xl p-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-content-primary mb-2">
                Emergency Contacts
              </h4>
              {fullStudentDetail.emergencyContacts && fullStudentDetail.emergencyContacts.length > 0 ? (
                <div className="space-y-2">
                  {fullStudentDetail.emergencyContacts.map((c) => (
                    <div key={c.ContactID} className="p-2.5 bg-slate-50 rounded-lg flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-content-primary">{c.Name}</span>{' '}
                        <span className="text-slate-500">({c.Relationship})</span>
                        <div className="text-[11px] text-content-secondary mt-0.5">{c.PhoneNumber}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 italic">No emergency contact on file.</p>
              )}
            </div>

            {/* Payment Transactions */}
            <div className="border border-surface-border rounded-xl p-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-content-primary mb-2 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                Fee Payment Records
              </h4>
              {fullStudentDetail.payments && fullStudentDetail.payments.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {fullStudentDetail.payments.map((p) => (
                    <div key={p.PaymentID} className="py-2 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-content-primary">{p.PaymentType}</span>
                        <div className="text-[10px] text-content-secondary">
                          {p.PaymentDate} • {p.ReceiptNumber}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-content-primary">
                          ₹{p.Amount.toLocaleString('en-IN')}
                        </span>
                        <div>
                          <Badge variant={p.Status === 'Completed' ? 'success' : 'warning'} size="sm">
                            {p.Status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 italic">No payment history recorded.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">Loading details...</div>
        )}
      </SlideOver>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Student Deletion"
        maxWidth="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteConfirm}
              isLoading={isDeleting}
            >
              Delete Student
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <p className="text-content-secondary">
            Are you sure you want to delete{' '}
            <strong className="text-content-primary">{studentToDelete?.Name}</strong> (
            {studentToDelete?.RegNo})?
          </p>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px]">
            <strong>Warning:</strong> Any active room allocation bed occupied by this student will be
            automatically released and marked available.
          </div>
        </div>
      </Modal>
    </div>
  );
};
