import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  Plus,
  Search,
  Phone,
  User,
  ShieldAlert,
  HeartHandshake
} from 'lucide-react';
import { api } from '../api/client';
import { EmergencyContact, Student } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SlideOver } from '../components/ui/SlideOver';
import { useToast } from '../components/ui/Toast';

export const EmergencyContactsPage: React.FC = () => {
  const toast = useToast();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add Contact Drawer
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newForm, setNewForm] = useState({
    studentId: '',
    name: '',
    relationship: 'Father',
    phoneNumber: '+91 ',
    alternatePhone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const data = await api.getEmergencyContacts();
      setContacts(data);
    } catch (err: any) {
      toast.error('Failed to load emergency contacts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
    api.getStudents().then(setStudents).catch(() => {});
  }, []);

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.studentId || !newForm.name.trim() || !newForm.phoneNumber.trim()) {
      toast.error('Please select student and enter contact details.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createEmergencyContact({
        studentId: Number(newForm.studentId),
        name: newForm.name,
        relationship: newForm.relationship,
        phoneNumber: newForm.phoneNumber,
        alternatePhone: newForm.alternatePhone || undefined,
      });
      toast.success(`Emergency contact added for resident`);
      setIsNewOpen(false);
      fetchContacts();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save contact');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = contacts.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.Name.toLowerCase().includes(q) ||
      c.StudentName?.toLowerCase().includes(q) ||
      c.RegNo?.toLowerCase().includes(q) ||
      c.Relationship.toLowerCase().includes(q) ||
      c.PhoneNumber.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-content-primary">
              Emergency Contact Registry
            </h2>
            <Badge variant="danger" size="sm">
              Safety Hotline
            </Badge>
          </div>
          <p className="text-xs text-content-secondary mt-1">
            Verified guardian phone numbers and immediate emergency references for all hostel residents.
          </p>
        </div>

        <Button
          onClick={() => {
            setNewForm({
              studentId: '',
              name: '',
              relationship: 'Father',
              phoneNumber: '+91 ',
              alternatePhone: '',
            });
            setIsNewOpen(true);
          }}
          icon={<Plus className="w-4 h-4" />}
        >
          Add Emergency Contact
        </Button>
      </div>

      {/* Toolbar */}
      <Card className="p-3">
        <div className="relative max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search student, guardian, relationship, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded border border-gray-300 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          />
        </div>
      </Card>

      {/* Contacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-3 p-12 text-center text-xs text-content-secondary animate-pulse">
            Loading emergency contacts...
          </div>
        ) : filtered.length === 0 ? (
          <Card className="col-span-3 p-12 text-center">
            <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-content-primary">No emergency contacts found</h3>
            <p className="text-xs text-content-secondary mt-1">
              Add verified guardian contact records for hostel students.
            </p>
          </Card>
        ) : (
          filtered.map((c) => (
            <Card key={c.ContactID} className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-content-primary">{c.Name}</h4>
                    <Badge variant="sage" size="sm" className="mt-1">
                      {c.Relationship}
                    </Badge>
                  </div>
                  <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-content-secondary">
                  <div>
                    <span className="text-slate-400">Student:</span>{' '}
                    <strong className="text-content-primary">{c.StudentName}</strong>{' '}
                    <span className="font-mono text-brand-blue">({c.RegNo})</span>
                  </div>

                  <div className="flex items-center gap-2 pt-1 font-mono text-xs font-semibold text-content-primary">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{c.PhoneNumber}</span>
                  </div>

                  {c.AlternatePhone && (
                    <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>Alt: {c.AlternatePhone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-surface-border flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[10px]">Registry ID #{c.ContactID}</span>
                <a
                  href={`tel:${c.PhoneNumber.replace(/\s+/g, '')}`}
                  className="font-semibold text-brand-blue hover:underline"
                >
                  Call Contact
                </a>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* ADD CONTACT SLIDE-OVER */}
      <SlideOver
        isOpen={isNewOpen}
        onClose={() => setIsNewOpen(false)}
        title="Register Emergency Contact"
        subtitle="Ensures immediate guardian contact in safety or medical incidents"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsNewOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateContact} isLoading={isSubmitting}>
              Save Contact
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateContact} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-content-primary mb-1">
              Select Student *
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
                  {st.Name} ({st.RegNo}) — {st.Department}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-content-primary mb-1">
              Contact / Guardian Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. N. Somasekhar"
              value={newForm.name}
              onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            />
          </div>

          <div>
            <label className="block font-semibold text-content-primary mb-1">
              Relationship to Student *
            </label>
            <select
              value={newForm.relationship}
              onChange={(e) => setNewForm({ ...newForm, relationship: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            >
              <option value="Father">Father</option>
              <option value="Mother">Mother</option>
              <option value="Guardian">Legal Guardian</option>
              <option value="Brother">Brother</option>
              <option value="Sister">Sister</option>
              <option value="Uncle">Uncle</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-content-primary mb-1">
              Primary Emergency Phone Number *
            </label>
            <input
              type="text"
              required
              placeholder="+91 94433 12121"
              value={newForm.phoneNumber}
              onChange={(e) => setNewForm({ ...newForm, phoneNumber: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            />
          </div>

          <div>
            <label className="block font-semibold text-content-primary mb-1">
              Alternate Phone Number (Optional)
            </label>
            <input
              type="text"
              placeholder="+91 98400 11111"
              value={newForm.alternatePhone}
              onChange={(e) => setNewForm({ ...newForm, alternatePhone: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            />
          </div>
        </form>
      </SlideOver>
    </div>
  );
};
