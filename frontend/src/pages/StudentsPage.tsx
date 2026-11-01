import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Student } from '../types';

export const StudentsPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    regNo: '',
    name: '',
    gender: 'M',
    dob: '2005-01-01',
    department: 'Computer Science',
    year: 1,
    contactNumber: '',
    email: '',
    admissionDate: new Date().toISOString().split('T')[0],
  });

  const fetchStudents = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.getStudents({
        search: search.trim() || undefined,
        department: deptFilter !== 'All' ? deptFilter : undefined,
      });
      setStudents(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to fetch student records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [deptFilter]);

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
      contactNumber: '',
      email: '',
      admissionDate: new Date().toISOString().split('T')[0],
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (st: Student) => {
    setSelectedStudent(st);
    setFormData({
      regNo: st.RegNo,
      name: st.Name,
      gender: st.Gender || 'M',
      dob: st.DOB || '2005-01-01',
      department: st.Department,
      year: st.Year,
      contactNumber: st.ContactNumber,
      email: st.Email,
      admissionDate: st.AdmissionDate || new Date().toISOString().split('T')[0],
    });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (st: Student) => {
    setSelectedStudent(st);
    setFormError(null);
    setIsDeleteModalOpen(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim() || !formData.regNo.trim() || !formData.email.trim()) {
      setFormError('Please enter Name, Registration Number, and Email.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isAddModalOpen) {
        await api.createStudent(formData);
        setSuccessMessage(`Student ${formData.name} added successfully.`);
        setIsAddModalOpen(false);
      } else if (isEditModalOpen && selectedStudent) {
        await api.updateStudent(selectedStudent.StudentID, {
          name: formData.name,
          gender: formData.gender,
          department: formData.department,
          year: Number(formData.year),
          contactNumber: formData.contactNumber,
          email: formData.email,
        });
        setSuccessMessage(`Student ${formData.name} updated successfully.`);
        setIsEditModalOpen(false);
      }
      fetchStudents();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setFormError(err.message || 'Operation failed on server');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedStudent) return;
    setIsSubmitting(true);
    setFormError(null);
    try {
      await api.deleteStudent(selectedStudent.StudentID);
      setSuccessMessage(`Student ${selectedStudent.Name} deleted.`);
      setIsDeleteModalOpen(false);
      fetchStudents();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to delete student');
    } finally {
      setIsSubmitting(false);
    }
  };

  const departments = [
    'All',
    'Computer Science',
    'Information Technology',
    'Electronics & Communication',
    'Mechanical Engineering',
    'Civil Engineering',
    'Electrical & Electronics',
  ];

  return (
    <div className="space-y-4">
      {/* Title & Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-300 gap-2">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Students</h1>
          <p className="text-xs text-gray-500">
            View, add, edit, and delete student records ({students.length} total)
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700"
        >
          + Add Student
        </button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-2.5 bg-green-50 border border-green-300 text-green-800 text-xs rounded">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="p-2.5 bg-red-50 border border-red-300 text-red-800 text-xs rounded">
          {errorMessage}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-3 bg-white border border-gray-300 rounded flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, reg no, department..."
            className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:border-blue-600"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-gray-100 border border-gray-300 text-xs text-gray-700 rounded hover:bg-gray-200"
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                api.getStudents().then(setStudents);
              }}
              className="px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          )}
        </form>

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600 font-medium">Department:</label>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:border-blue-600 bg-white"
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-white border border-gray-300 rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300 text-gray-700 font-semibold">
                <th className="py-2.5 px-3 border-r border-gray-300 w-12 text-center">ID</th>
                <th className="py-2.5 px-3 border-r border-gray-300">Reg No</th>
                <th className="py-2.5 px-3 border-r border-gray-300">Name</th>
                <th className="py-2.5 px-3 border-r border-gray-300 text-center">Gender</th>
                <th className="py-2.5 px-3 border-r border-gray-300">Department</th>
                <th className="py-2.5 px-3 border-r border-gray-300 text-center">Year</th>
                <th className="py-2.5 px-3 border-r border-gray-300">Contact</th>
                <th className="py-2.5 px-3 border-r border-gray-300">Allocated Room</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-gray-500">
                    Loading student records from Neo4j database...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-gray-500">
                    No student records found matching the criteria.
                  </td>
                </tr>
              ) : (
                students.map((st) => (
                  <tr key={st.StudentID} className="hover:bg-gray-50">
                    <td className="py-2 px-3 text-center font-mono text-gray-500 border-r border-gray-200">
                      {st.StudentID}
                    </td>
                    <td className="py-2 px-3 font-mono font-medium text-blue-700 border-r border-gray-200">
                      {st.RegNo}
                    </td>
                    <td className="py-2 px-3 font-medium text-gray-900 border-r border-gray-200">
                      {st.Name}
                    </td>
                    <td className="py-2 px-3 text-center text-gray-600 border-r border-gray-200">
                      {st.Gender}
                    </td>
                    <td className="py-2 px-3 text-gray-700 border-r border-gray-200">
                      {st.Department}
                    </td>
                    <td className="py-2 px-3 text-center text-gray-700 border-r border-gray-200">
                      {st.Year}
                    </td>
                    <td className="py-2 px-3 text-gray-600 border-r border-gray-200">
                      {st.ContactNumber}
                    </td>
                    <td className="py-2 px-3 border-r border-gray-200">
                      {st.RoomNumber ? (
                        <span className="text-gray-900 font-medium">
                          Room {st.RoomNumber} ({st.HostelName})
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Unallocated</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center space-x-2">
                      <button
                        onClick={() => handleOpenEdit(st)}
                        className="text-blue-600 hover:text-blue-800 font-medium underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleOpenDelete(st)}
                        className="text-red-600 hover:text-red-800 font-medium underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-400 rounded max-w-md w-full p-5 space-y-4 shadow-sm">
            <div className="border-b border-gray-300 pb-2 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-900">
                {isAddModalOpen ? 'Add New Student' : 'Edit Student Record'}
              </h2>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="text-gray-500 hover:text-gray-800 text-sm"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-2 bg-red-50 border border-red-300 text-red-700 text-xs rounded">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveStudent} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    Registration No <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isEditModalOpen}
                    value={formData.regNo}
                    onChange={(e) => setFormData({ ...formData, regNo: e.target.value })}
                    placeholder="e.g. 24BCE1001"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded bg-white"
                  >
                    <option value="M">Male (M)</option>
                    <option value="F">Female (F)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Student Full Name"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded bg-white"
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics & Communication">Electronics & Communication</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                    <option value="Electrical & Electronics">Electrical & Electronics</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    Academic Year <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded bg-white"
                  >
                    <option value={1}>Year 1</option>
                    <option value={2}>Year 2</option>
                    <option value={3}>Year 3</option>
                    <option value={4}>Year 4</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Contact Number</label>
                  <input
                    type="text"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="student@vitstudent.ac.in"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded"
                />
              </div>

              <div className="border-t border-gray-300 pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-400 rounded max-w-sm w-full p-4 space-y-3 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-2">
              Confirm Student Deletion
            </h2>

            {formError ? (
              <div className="p-2 bg-red-50 border border-red-300 text-red-700 text-xs rounded">
                {formError}
              </div>
            ) : (
              <p className="text-xs text-gray-700">
                Are you sure you want to delete student <strong>{selectedStudent.Name}</strong> (
                {selectedStudent.RegNo})?
              </p>
            )}

            <div className="border-t border-gray-200 pt-2 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDeleteConfirm}
                className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default StudentsPage;
