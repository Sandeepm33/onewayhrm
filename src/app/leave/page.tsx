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
} from 'lucide-react';

export default function LeavePage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [balance, setBalance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    setForm((f) => ({ ...f, startDate: today, endDate: today }));
  }, []);

  const fetchData = async () => {
    try {
      const [resReq, resBal] = await Promise.all([
        fetch('/api/v1/leave'),
        fetch('/api/v1/leave/balances'),
      ]);
      const dataReq = await resReq.json();
      const dataBal = await resBal.json();

      if (dataReq.success) setRequests(dataReq.requests || []);
      if (dataBal.success) setBalance(dataBal.balance);
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

  const holidays = [
    { name: 'Republic Day', date: '26 Jan 2026', type: 'National' },
    { name: 'Holi', date: '04 Mar 2026', type: 'Gazetted' },
    { name: 'Independence Day', date: '15 Aug 2026', type: 'National' },
    { name: 'Mahatma Gandhi Jayanti', date: '02 Oct 2026', type: 'National' },
    { name: 'Diwali (Deepavali)', date: '08 Nov 2026', type: 'Festival' },
    { name: 'Christmas', date: '25 Dec 2026', type: 'Gazetted' },
  ];

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">Time Off & Attendance</span>
            <span className="text-slate-500">•</span>
            <span className="text-xs text-slate-400">Policy Rules & Balances</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Leave & Holiday Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Annual accruals, multi-day requests, manager approval chains, and real ledger reconciliation
          </p>
        </div>

        <button
          onClick={() => setApplyModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Apply for Leave</span>
        </button>
      </div>

      {success && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* LEAVE BALANCE CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Casual Leave (CL)</span>
            <span className="font-semibold text-indigo-400">Total: {balance?.casualLeave?.total ?? 12}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {(balance?.casualLeave?.total ?? 12) - (balance?.casualLeave?.used ?? 2)}
            </span>
            <span className="text-xs text-slate-500">{balance?.casualLeave?.used ?? 2} days used</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full"
              style={{
                width: `${(((balance?.casualLeave?.total ?? 12) - (balance?.casualLeave?.used ?? 2)) / (balance?.casualLeave?.total ?? 12)) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Sick / Medical Leave (SL)</span>
            <span className="font-semibold text-emerald-400">Total: {balance?.sickLeave?.total ?? 12}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {(balance?.sickLeave?.total ?? 12) - (balance?.sickLeave?.used ?? 1)}
            </span>
            <span className="text-xs text-slate-500">{balance?.sickLeave?.used ?? 1} days used</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full"
              style={{
                width: `${(((balance?.sickLeave?.total ?? 12) - (balance?.sickLeave?.used ?? 1)) / (balance?.sickLeave?.total ?? 12)) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Earned / Privilege Leave (EL)</span>
            <span className="font-semibold text-purple-400">Total: {balance?.earnedLeave?.total ?? 15}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {(balance?.earnedLeave?.total ?? 15) - (balance?.earnedLeave?.used ?? 0)}
            </span>
            <span className="text-xs text-slate-500">{balance?.earnedLeave?.used ?? 0} days used</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-purple-500 h-full rounded-full"
              style={{
                width: `${(((balance?.earnedLeave?.total ?? 15) - (balance?.earnedLeave?.used ?? 0)) / (balance?.earnedLeave?.total ?? 15)) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* LEAVE APPLICATIONS TABLE */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Leave Requests & Approval Queue
          </h3>
          <span className="text-[11px] text-slate-400">{requests.length} Requests Recorded</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Leave Type</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Dates</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {requests.map((req) => (
                <tr key={req._id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-white">
                      {req.employeeId?.firstName} {req.employeeId?.lastName}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {req.employeeId?.employeeCode}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-indigo-400">
                    {req.leaveType} LEAVE
                  </td>
                  <td className="py-3.5 px-4 text-slate-200 font-medium">
                    {req.totalDays} {req.totalDays === 1 ? 'Day' : 'Days'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">
                    {req.startDate} to {req.endDate}
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate">
                    {req.reason}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        req.status === 'APPROVED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : req.status === 'PENDING'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {req.status === 'PENDING' && ['SUPER_ADMIN', 'ORG_ADMIN', 'HR_ADMIN', 'MANAGER'].includes(user?.role || '') && (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleDecision(req._id, 'APPROVED')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleDecision(req._id, 'REJECTED')}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-[11px] flex items-center gap-1"
                        >
                          <Ban className="w-3 h-3" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                    {req.status !== 'PENDING' && (
                      <span className="text-[11px] text-slate-500 italic">
                        Reviewed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {requests.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No leave requests found in the record ledger.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* HOLIDAY CALENDAR */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-400" />
          <span>India Company Holiday Calendar (2026)</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {holidays.map((h) => (
            <div key={h.name} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-left">
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">{h.type}</span>
              <p className="text-xs font-semibold text-white mt-0.5">{h.name}</p>
              <p className="text-[11px] text-slate-400 mt-1">{h.date}</p>
            </div>
          ))}
        </div>
      </div>

      {/* APPLY LEAVE MODAL */}
      {applyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 relative">
            <button onClick={() => setApplyModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-white mb-1">Apply for Leave</h2>
            <p className="text-xs text-slate-400 mb-4">Select leave category and date range</p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleApply} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Leave Type</label>
                <select
                  value={form.leaveType}
                  onChange={(e) => setForm({ ...form, leaveType: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="CASUAL">Casual Leave (CL)</option>
                  <option value="SICK">Sick / Medical Leave (SL)</option>
                  <option value="EARNED">Earned Leave (EL)</option>
                  <option value="MATERNITY">Maternity Leave</option>
                  <option value="PATERNITY">Paternity Leave</option>
                  <option value="UNPAID">Unpaid Leave (LWP)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">From Date</label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">To Date</label>
                  <input
                    type="date"
                    required
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Total Days</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  required
                  value={form.totalDays}
                  onChange={(e) => setForm({ ...form, totalDays: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Reason for Leave *</label>
                <textarea
                  required
                  rows={3}
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="Explain the purpose of your time-off request..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setApplyModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
