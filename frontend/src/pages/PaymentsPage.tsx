import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  Download,
  IndianRupee,
  Calendar,
  User
} from 'lucide-react';
import { api } from '../api/client';
import { Payment, Student } from '../types';
import { Card, MetricCard } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge, getStatusBadgeVariant } from '../components/ui/Badge';
import { SlideOver } from '../components/ui/SlideOver';
import { useToast } from '../components/ui/Toast';

export const PaymentsPage: React.FC = () => {
  const toast = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  // New Payment Drawer
  const [isNewPaymentOpen, setIsNewPaymentOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<number | ''>('');
  const [amount, setAmount] = useState<number>(75000);
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [paymentMode, setPaymentMode] = useState<string>('UPI');
  const [paymentType, setPaymentType] = useState<string>('Hostel Fee');
  const [paymentStatus, setPaymentStatus] = useState<string>('Completed');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const data = await api.getPayments({
        search: search.trim() || undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
        payment_type: typeFilter !== 'All' ? typeFilter : undefined,
      });
      setPayments(data);
    } catch (err: any) {
      toast.error('Failed to load payments ledger');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
    api.getStudents().then(setStudents).catch(() => {});
  }, [statusFilter, typeFilter]);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedStudentId || amount <= 0) {
      setErrorMsg('Please select a student and enter a valid payment amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await api.createPayment({
        studentId: Number(selectedStudentId),
        amount: Number(amount),
        paymentDate,
        paymentMode,
        paymentType,
        status: paymentStatus,
      });
      toast.success(`Payment recorded with receipt ${created.ReceiptNumber}`);
      setIsNewPaymentOpen(false);
      fetchPayments();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Financial aggregates from real records
  const totalCollected = payments
    .filter((p) => p.Status === 'Completed')
    .reduce((acc, p) => acc + p.Amount, 0);

  const totalPending = payments
    .filter((p) => p.Status === 'Pending')
    .reduce((acc, p) => acc + p.Amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-content-primary">
              Fee Transactions & Ledger
            </h2>
            <Badge variant="neutral" size="sm">
              Finance Management
            </Badge>
          </div>
          <p className="text-xs text-content-secondary mt-1">
            Reconciles hostel accommodation, mess, maintenance, and security deposit transactions.
          </p>
        </div>

        <Button
          onClick={() => {
            setSelectedStudentId('');
            setAmount(75000);
            setErrorMsg(null);
            setIsNewPaymentOpen(true);
          }}
          icon={<Plus className="w-4 h-4" />}
        >
          Record Transaction
        </Button>
      </div>

      {/* Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Total Collected"
          value={`₹${totalCollected.toLocaleString('en-IN')}`}
          subtitle={`${payments.filter((p) => p.Status === 'Completed').length} completed settlements`}
          icon={<IndianRupee className="w-5 h-5 text-emerald-600" />}
          iconBg="bg-emerald-50"
        />

        <MetricCard
          title="Pending Dues"
          value={`₹${totalPending.toLocaleString('en-IN')}`}
          subtitle={`${payments.filter((p) => p.Status === 'Pending').length} pending collections`}
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          iconBg="bg-amber-50"
        />

        <MetricCard
          title="Total Ledger Value"
          value={`₹${(totalCollected + totalPending).toLocaleString('en-IN')}`}
          subtitle={`${payments.length} total receipts stored`}
          icon={<FileText className="w-5 h-5 text-brand-blue" />}
          iconBg="bg-blue-50"
        />
      </div>

      {/* Filters & Search Toolbar */}
      <Card className="p-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchPayments();
            }}
            className="relative flex-1 max-w-md"
          >
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by student name, RegNo, or receipt number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded border border-gray-300 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            />
          </form>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-2.5 text-xs rounded border border-gray-300 text-gray-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="py-1.5 px-2.5 text-xs rounded border border-gray-300 text-gray-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All Fee Types</option>
              <option value="Hostel Fee">Hostel Fee</option>
              <option value="Mess Fee">Mess Fee</option>
              <option value="Security Deposit">Security Deposit</option>
              <option value="Maintenance Charge">Maintenance Charge</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Payments Table */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-content-secondary animate-pulse">
            Loading ledger transactions...
          </div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center">
            <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-content-primary">No transactions found</h3>
            <p className="text-xs text-content-secondary mt-1">
              Adjust filters or record a new student payment transaction.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-surface-border bg-slate-50/70 text-content-secondary uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Fee Category</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Transaction Date</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.PaymentID} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-brand-blue">
                      {p.ReceiptNumber}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-content-primary text-xs">
                        {p.StudentName}
                      </div>
                      <div className="text-[11px] text-content-secondary font-mono">
                        {p.RegNo}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-medium text-content-primary">
                      {p.PaymentType}
                    </td>

                    <td className="py-3 px-4 text-content-secondary">
                      {p.PaymentMode}
                    </td>

                    <td className="py-3 px-4 text-content-secondary">
                      {p.PaymentDate}
                    </td>

                    <td className="py-3 px-4 font-bold text-content-primary">
                      ₹{p.Amount.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-4">
                      <Badge variant={getStatusBadgeVariant(p.Status)} size="sm">
                        {p.Status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* RECORD TRANSACTION SLIDE-OVER */}
      <SlideOver
        isOpen={isNewPaymentOpen}
        onClose={() => setIsNewPaymentOpen(false)}
        title="Record Fee Transaction"
        subtitle="Registers student fee settlement into hostel ledger"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsNewPaymentOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleRecordPayment} isLoading={isSubmitting}>
              Generate Receipt
            </Button>
          </>
        }
      >
        <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-content-primary mb-1">
              Student Resident *
            </label>
            <select
              required
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            >
              <option value="">-- Choose Student --</option>
              {students.map((st) => (
                <option key={st.StudentID} value={st.StudentID}>
                  {st.Name} ({st.RegNo}) — {st.Department}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-content-primary mb-1">
                Fee Category *
              </label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              >
                <option value="Hostel Fee">Hostel Fee</option>
                <option value="Mess Fee">Mess Fee</option>
                <option value="Security Deposit">Security Deposit</option>
                <option value="Maintenance Charge">Maintenance Charge</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-content-primary mb-1">
                Amount (₹ INR) *
              </label>
              <input
                type="number"
                required
                min={1}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-content-primary mb-1">
                Payment Mode *
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              >
                <option value="UPI">UPI / QR Code</option>
                <option value="NetBanking">NetBanking</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Demand Draft">Demand Draft</option>
                <option value="Cash">Cash</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-content-primary mb-1">
                Payment Status *
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              >
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-content-primary mb-1">
              Payment Date *
            </label>
            <input
              type="date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-surface-border bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            />
          </div>
        </form>
      </SlideOver>
    </div>
  );
};
