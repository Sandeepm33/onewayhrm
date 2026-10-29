'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import {
  CalendarDays,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  X,
  Check,
  Ban,
  Calendar,
  Trash2,
  DownloadCloud,
  SlidersHorizontal,
} from 'lucide-react';

function LeaveContent() {
  const { user, hasPermission } = useAuth();
  const canCreate = hasPermission('leave', 'create');
  const canApprove = hasPermission('leave', 'approve');
  const [requests, setRequests] = useState<any[]>([]);
  const [balance, setBalance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Holiday management state
  const [holidays, setHolidays] = useState<any[]>([]);
  const [holidayModalOpen, setHolidayModalOpen] = useState(false);
  const [holidayLoading, setHolidayLoading] = useState(false);
  const [currentYear, setCurrentYear] = useState('2026');
  const [holidayForm, setHolidayForm] = useState({
    name: '',
    date: '',
    type: 'GAZETTED',
    description: '',
    isMandatory: true,
  });

  // Quota Policy Modal State
  const [quotaModalOpen, setQuotaModalOpen] = useState(false);
  const [quotaSaving, setQuotaSaving] = useState(false);
  const [quotaForm, setQuotaForm] = useState({
    casualTotal: 0,
    sickTotal: 0,
    earnedTotal: 0,
    applyToAllEmployees: true,
  });

  const [form, setForm] = useState({
    leaveType: 'CASUAL',
    startDate: '',
    endDate: '',
    totalDays: 1,
    isHalfDay: false,
    reason: '',
  });

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const year = String(new Date().getFullYear());
    setForm((f) => ({ ...f, startDate: today, endDate: today }));
    setHolidayForm((h) => ({ ...h, date: today }));
    setCurrentYear(year);
  }, []);

  const fetchData = async () => {
    try {
      const [resReq, resBal, resHol] = await Promise.all([
        fetch('/api/v1/leave'),
        fetch('/api/v1/leave/balances'),
        fetch('/api/v1/holidays'),
      ]);
      const dataReq = await resReq.json();
      const dataBal = await resBal.json();
      const dataHol = await resHol.json();

      if (dataReq.success) setRequests(dataReq.requests || []);
      if (dataBal.success) setBalance(dataBal.balance);
      if (dataHol.success) setHolidays(dataHol.holidays || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/v1/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Leave application submitted successfully!');
        setApplyModalOpen(false);
        setForm({
          leaveType: 'CASUAL',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          totalDays: 1,
          isHalfDay: false,
          reason: '',
        });
        fetchData();
      } else {
        setError(data.error || 'Failed to submit leave request');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDecision = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch('/api/v1/leave', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status, reviewerRemarks: `Decision by ${user?.name}` }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Add Custom Holiday
  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    setHolidayLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(holidayForm),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(data.message || 'Holiday added successfully!');
        setHolidayModalOpen(false);
        setHolidayForm({
          name: '',
          date: new Date().toISOString().split('T')[0],
          type: 'GAZETTED',
          description: '',
          isMandatory: true,
        });
        fetchData();
      } else {
        setError(data.error || 'Failed to add holiday');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setHolidayLoading(false);
    }
  };

  // Delete Holiday
  const handleDeleteHoliday = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from your company calendar?`)) return;
    try {
      const res = await fetch(`/api/v1/holidays?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(`Holiday "${name}" removed.`);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Optional: Import standard gazetted Indian holidays
  const handleImportIndianHolidays = async () => {
    if (!confirm('Import standard gazetted Indian public holidays for this year?')) return;
    setHolidayLoading(true);
    try {
      const res = await fetch('/api/v1/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'IMPORT_INDIAN_GAZETTED', year: new Date().getFullYear() }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(data.message);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHolidayLoading(false);
    }
  };

  const handleOpenQuotaModal = () => {
    setError('');
    setQuotaForm({
      casualTotal: balance?.casualLeave?.total ?? 0,
      sickTotal: balance?.sickLeave?.total ?? 0,
      earnedTotal: balance?.earnedLeave?.total ?? 0,
      applyToAllEmployees: true,
    });
    setQuotaModalOpen(true);
  };

  const handleSaveQuotas = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuotaSaving(true);
    setError('');
    try {
      const res = await fetch('/api/v1/leave/balances', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quotaForm),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(data.message || 'Leave policy quotas saved successfully!');
        if (data.balance) {
          setBalance(data.balance);
        } else {
          fetchData();
        }
        setQuotaModalOpen(false);
      } else {
        setError(data.error || 'Failed to update leave policy quotas');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred');
    } finally {
      setQuotaSaving(false);
    }
  };

  const clTotal = balance?.casualLeave?.total ?? 0;
  const clUsed = balance?.casualLeave?.used ?? 0;
  const clAvail = Math.max(0, clTotal - clUsed);
  const clPct = clTotal > 0 ? (clAvail / clTotal) * 100 : 0;

  const slTotal = balance?.sickLeave?.total ?? 0;
  const slUsed = balance?.sickLeave?.used ?? 0;
  const slAvail = Math.max(0, slTotal - slUsed);
  const slPct = slTotal > 0 ? (slAvail / slTotal) * 100 : 0;

  const elTotal = balance?.earnedLeave?.total ?? 0;
  const elUsed = balance?.earnedLeave?.used ?? 0;
  const elAvail = Math.max(0, elTotal - elUsed);
  const elPct = elTotal > 0 ? (elAvail / elTotal) * 100 : 0;

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] text-orange-600 font-extrabold uppercase tracking-wider bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md">
              Time Off & Attendance
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-500">Policy Rules & Balances</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 flex items-center gap-2">
            Leave & Holiday Management
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Annual accruals, multi-day requests, manager approval chains, and real ledger reconciliation
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canApprove && (
            <button
              type="button"
              onClick={handleOpenQuotaModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition-colors cursor-pointer"
              title="Configure Organization Leave Quotas"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
              <span>Configure Quotas</span>
            </button>
          )}
          {canCreate && (
            <button
              onClick={() => setApplyModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-transform hover:scale-[1.02] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Apply for Leave</span>
            </button>
          )}
        </div>
      </div>

      {success && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="text-slate-400 hover:text-slate-700 text-xs">
            ✕
          </button>
        </div>
      )}

      {/* LEAVE BALANCE CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-2">
            <span>Casual Leave (CL)</span>
            <span className="text-orange-600 font-bold">Total: {clTotal}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{clAvail}</span>
            <span className="text-xs text-slate-400 font-medium">{clUsed} days used</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-orange-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${clPct}%` }}
            />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-2">
            <span>Sick / Medical Leave (SL)</span>
            <span className="text-emerald-600 font-bold">Total: {slTotal}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{slAvail}</span>
            <span className="text-xs text-slate-400 font-medium">{slUsed} days used</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${slPct}%` }}
            />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-2">
            <span>Earned / Privilege Leave (EL)</span>
            <span className="text-indigo-600 font-bold">Total: {elTotal}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{elAvail}</span>
            <span className="text-xs text-slate-400 font-medium">{elUsed} days used</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${elPct}%` }}
            />
          </div>
        </div>
      </div>

      {clTotal === 0 && slTotal === 0 && elTotal === 0 && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              No leave policy quotas have been allocated yet. Click <strong>Configure Quotas</strong> to define annual Casual, Sick, and Earned allowances.
            </span>
          </div>
          {canApprove && (
            <button
              type="button"
              onClick={handleOpenQuotaModal}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-xl shrink-0 cursor-pointer self-start sm:self-auto transition-colors"
            >
              Configure Quotas
            </button>
          )}
        </div>
      )}

      {/* LEAVE APPLICATIONS TABLE */}
      <div className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Leave Requests & Approval Queue
          </h3>
          <span className="text-[11px] text-slate-500 font-bold">{requests.length} Requests Recorded</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Leave Type</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Dates</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {requests.map((req) => (
                <tr key={req._id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">
                      {req.employeeId ? `${req.employeeId.firstName} ${req.employeeId.lastName}` : 'Direct Applicant'}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {req.employeeId?.employeeCode || 'EMP'}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                      {req.leaveType}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {req.totalDays} Day{req.totalDays > 1 ? 's' : ''} {req.isHalfDay ? `(Half-day)` : ''}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                    {req.startDate} {req.startDate !== req.endDate ? `to ${req.endDate}` : ''}
                  </td>
                  <td className="py-3 px-4 max-w-xs truncate text-slate-600">{req.reason}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        req.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : req.status === 'REJECTED'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {canApprove && req.status === 'PENDING' && (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleDecision(req._id, 'APPROVED')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleDecision(req._id, 'REJECTED')}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <Ban className="w-3 h-3" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                    {req.status !== 'PENDING' && (
                      <span className="text-[11px] text-slate-400 italic font-medium">
                        Reviewed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {requests.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No leave requests found in the record ledger.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* HOLIDAY CALENDAR */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-orange-600" />
            <span>Company Holiday Calendar ({currentYear})</span>
            <span className="text-[10px] text-slate-400 font-mono font-bold">({holidays.length} Holidays)</span>
          </h3>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleImportIndianHolidays}
              disabled={holidayLoading}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Import Indian Gazetted Holidays"
            >
              <DownloadCloud className="w-3.5 h-3.5 text-indigo-600" />
              <span>Import Indian Gazetted</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setError('');
                setHolidayModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Holiday</span>
            </button>
          </div>
        </div>

        {holidays.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">No Holidays Configured</p>
            <p className="text-[11px] text-slate-400 mt-0.5 mb-3">
              Your organization has not scheduled any company holidays for {currentYear} yet.
            </p>
            <div className="inline-flex gap-2">
              <button
                type="button"
                onClick={() => setHolidayModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-orange-600 text-white text-xs font-bold cursor-pointer hover:bg-orange-700"
              >
                + Add Custom Holiday
              </button>
              <button
                type="button"
                onClick={handleImportIndianHolidays}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold cursor-pointer hover:bg-slate-50"
              >
                Import Gazetted Indian Holidays
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {holidays.map((h) => (
              <div
                key={h._id || h.name}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-left relative group hover:shadow-xs transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">{h.type}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteHoliday(h._id, h.name)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-0.5 rounded transition-opacity cursor-pointer"
                    title="Delete holiday"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">{h.name}</p>
                <p className="text-[11px] text-slate-500 font-medium mt-1">
                  {isNaN(new Date(h.date).getTime())
                    ? h.date
                    : new Date(h.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* APPLY LEAVE MODAL */}
      {applyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 relative text-slate-900">
            <button
              onClick={() => setApplyModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-slate-950 mb-1">Apply for Leave</h2>
            <p className="text-xs text-slate-500 mb-4 font-medium">Select leave category and date range</p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleApply} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Leave Type</label>
                <select
                  value={form.leaveType}
                  onChange={(e) => setForm({ ...form, leaveType: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                >
                  <option value="CASUAL">Casual Leave (CL)</option>
                  <option value="SICK">Sick Leave (SL)</option>
                  <option value="EARNED">Earned Leave (EL)</option>
                  <option value="UNPAID">Loss of Pay / Unpaid</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Days</label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={form.totalDays}
                    onChange={(e) => setForm({ ...form, totalDays: parseFloat(e.target.value) || 1 })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.isHalfDay}
                      onChange={(e) => setForm({ ...form, isHalfDay: e.target.checked })}
                      className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300 accent-orange-600"
                    />
                    <span className="text-xs font-medium text-slate-700">Half Day Session</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Leave</label>
                <textarea
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  required
                  rows={3}
                  placeholder="Provide brief context for the manager review..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500 resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md shadow-orange-600/20 cursor-pointer transition-colors"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD HOLIDAY MODAL */}
      {holidayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 relative text-slate-900 animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setHolidayModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-slate-950 mb-1">Schedule Company Holiday</h2>
            <p className="text-xs text-slate-500 mb-4 font-medium">Add a dynamic holiday to your organization calendar</p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleAddHoliday} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Holiday Name *</label>
                <input
                  type="text"
                  value={holidayForm.name}
                  onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
                  required
                  placeholder="e.g. Founder's Day / Regional Festival"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={holidayForm.date}
                    onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Holiday Type</label>
                  <select
                    value={holidayForm.type}
                    onChange={(e) => setHolidayForm({ ...holidayForm, type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                  >
                    <option value="GAZETTED">Gazetted</option>
                    <option value="NATIONAL">National</option>
                    <option value="RESTRICTED">Restricted</option>
                    <option value="COMPANY">Company Holiday</option>
                    <option value="OPTIONAL">Optional</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={holidayForm.description}
                  onChange={(e) => setHolidayForm({ ...holidayForm, description: e.target.value })}
                  placeholder="e.g. Annual celebration observed across all branches"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={holidayLoading}
                  className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md shadow-orange-600/20 cursor-pointer transition-colors"
                >
                  {holidayLoading ? 'Saving...' : 'Add to Calendar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIGURE LEAVE QUOTAS MODAL */}
      {quotaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 relative my-8 animate-fadeIn text-slate-900">
            <button
              type="button"
              onClick={() => setQuotaModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 mb-2">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-950">Configure Leave Policy Quotas</h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Set annual dynamic leave quotas for personnel ({currentYear}).
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveQuotas} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Casual Leave (CL) Days / Year
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={quotaForm.casualTotal}
                  onChange={(e) => setQuotaForm((f) => ({ ...f, casualTotal: Number(e.target.value) }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sick / Medical Leave (SL) Days / Year
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={quotaForm.sickTotal}
                  onChange={(e) => setQuotaForm((f) => ({ ...f, sickTotal: Number(e.target.value) }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Earned / Privilege Leave (EL) Days / Year
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={quotaForm.earnedTotal}
                  onChange={(e) => setQuotaForm((f) => ({ ...f, earnedTotal: Number(e.target.value) }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                  required
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={quotaForm.applyToAllEmployees}
                    onChange={(e) => setQuotaForm((f) => ({ ...f, applyToAllEmployees: e.target.checked }))}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-medium text-slate-700">
                    Apply these quotas to all active employees in organization
                  </span>
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setQuotaModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={quotaSaving}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 cursor-pointer transition-all flex items-center gap-1.5"
                >
                  {quotaSaving ? 'Saving...' : 'Save Policy Quotas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function LeavePage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-400 text-xs">
          <div className="w-8 h-8 border-3 border-orange-600 border-t-transparent rounded-full animate-spin mb-3" />
          <span>Loading Leave Management...</span>
        </div>
      }
    >
      <LeaveContent />
    </React.Suspense>
  );
}
