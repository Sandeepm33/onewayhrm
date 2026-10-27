'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import {
  UserCheck,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  MapPin,
  Check,
  Ban,
} from 'lucide-react';

export default function AttendancePage() {
  const { user } = useAuth();
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [punchMessage, setPunchMessage] = useState('');
  const [punchLoading, setPunchLoading] = useState(false);

  // Regularization modal
  const [regularizeModalOpen, setRegularizeModalOpen] = useState(false);
  const [regForm, setRegForm] = useState({
    date: '',
    reason: '',
    checkIn: '09:30',
    checkOut: '18:30',
  });

  useEffect(() => {
    setRegForm((f) => ({ ...f, date: new Date().toISOString().split('T')[0] }));
  }, []);
  const [regSuccess, setRegSuccess] = useState('');

  const fetchAttendance = async () => {
    try {
      let url = '/api/v1/attendance';
      if (selectedDate) url += `?date=${selectedDate}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setAttendances(data.attendances || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate]);

  const handlePunch = async () => {
    setPunchLoading(true);
    setPunchMessage('');
    try {
      const res = await fetch('/api/v1/attendance/punch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workLocation: 'OFFICE' }),
      });
      const data = await res.json();
      if (data.success) {
        setPunchMessage(data.message);
        fetchAttendance();
      } else {
        setPunchMessage(data.error || 'Punch failed');
      }
    } catch (e: any) {
      setPunchMessage(e.message);
    } finally {
      setPunchLoading(false);
    }
  };

  const handleRegularizeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/attendance/regularize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm),
      });
      const data = await res.json();
      if (data.success) {
        setRegSuccess(data.message);
        setRegularizeModalOpen(false);
        fetchAttendance();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReviewRegularize = async (attendanceId: string, decision: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch('/api/v1/attendance/regularize', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendanceId, decision, reviewerRemarks: `Review completed by ${user?.name}` }),
      });
      const data = await res.json();
      if (data.success) {
        fetchAttendance();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const pendingRegularizations = attendances.filter((a) => a.regularization?.requested && a.regularization?.status === 'PENDING');

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] text-orange-600 font-extrabold uppercase tracking-wider bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md">
              Attendance & Shifts
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-500">Live Biometric & Web Time-Tracking</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 flex items-center gap-2">
            Daily Attendance & Roster
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Preserves immutable timestamps, handles grace periods, and calculates payable hours for payroll
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setRegularizeModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold shadow-xs cursor-pointer"
          >
            Request Regularization
          </button>
          <button
            onClick={handlePunch}
            disabled={punchLoading}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-xs shadow-md shadow-orange-500/20 flex items-center gap-2 cursor-pointer transition-transform hover:scale-[1.02]"
          >
            <Clock className="w-4 h-4" />
            <span>{punchLoading ? 'Saving Punch...' : 'Web Clock In / Out'}</span>
          </button>
        </div>
      </div>

      {punchMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{punchMessage}</span>
        </div>
      )}

      {regSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{regSuccess}</span>
        </div>
      )}

      {/* PENDING REGULARIZATIONS BANNER (FOR MANAGERS/ADMINS) */}
      {pendingRegularizations.length > 0 && ['SUPER_ADMIN', 'ORG_ADMIN', 'HR_ADMIN', 'MANAGER'].includes(user?.role || '') && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 shadow-xs">
          <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>{pendingRegularizations.length} Attendance Regularization Requests Pending Approval</span>
          </h3>
          <div className="space-y-2">
            {pendingRegularizations.map((reg) => (
              <div key={reg._id} className="p-3 rounded-xl bg-white border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
                <div>
                  <span className="font-bold text-slate-900">{reg.employeeId?.firstName} {reg.employeeId?.lastName}</span>
                  <span className="text-slate-300 mx-2">•</span>
                  <span className="text-slate-500 font-medium">Date: {reg.date}</span>
                  <p className="text-[11px] text-amber-800 mt-0.5 font-medium">Reason: &quot;{reg.regularization?.reason}&quot;</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleReviewRegularize(reg._id, 'APPROVED')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => handleReviewRegularize(reg._id, 'REJECTED')}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FILTER BAR */}
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs text-xs">
        <span className="text-slate-700 font-bold">Filter Attendance Date:</span>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-medium focus:bg-white focus:border-orange-500"
        />
        {selectedDate && (
          <button
            onClick={() => setSelectedDate('')}
            className="text-xs text-orange-600 hover:text-orange-700 font-bold cursor-pointer"
          >
            Clear Date Filter
          </button>
        )}
      </div>

      {/* ATTENDANCE TABLE */}
      <div className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Clock In</th>
                <th className="py-3 px-4">Clock Out</th>
                <th className="py-3 px-4">Effective Duration</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {attendances.map((att) => (
                <tr key={att._id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {att.date}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">
                      {att.employeeId?.firstName} {att.employeeId?.lastName}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {att.employeeId?.employeeCode}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">
                    {att.checkIn ? new Date(att.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">
                    {att.checkOut ? new Date(att.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-orange-600">
                    {att.workHoursMinutes > 0
                      ? `${Math.floor(att.workHoursMinutes / 60)}h ${att.workHoursMinutes % 60}m`
                      : '—'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="flex items-center gap-1 text-slate-600 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-orange-500" />
                      <span>{att.workLocation}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        att.status === 'PRESENT'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : att.status === 'LATE'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {att.status}
                    </span>
                  </td>
                </tr>
              ))}
              {attendances.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No attendance logs recorded for this query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REGULARIZE MODAL */}
      {regularizeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 relative text-slate-900">
            <button onClick={() => setRegularizeModalOpen(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-slate-950 mb-1">Submit Attendance Regularization</h2>
            <p className="text-xs text-slate-500 mb-4 font-medium">Request missed punch correction for manager review and approval</p>
            <form onSubmit={handleRegularizeSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date to Regularize *</label>
                <input
                  type="date"
                  required
                  value={regForm.date}
                  onChange={(e) => setRegForm({ ...regForm, date: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Actual Check In</label>
                  <input
                    type="time"
                    value={regForm.checkIn}
                    onChange={(e) => setRegForm({ ...regForm, checkIn: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Actual Check Out</label>
                  <input
                    type="time"
                    value={regForm.checkOut}
                    onChange={(e) => setRegForm({ ...regForm, checkOut: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Business Reason *</label>
                <textarea
                  required
                  rows={3}
                  value={regForm.reason}
                  onChange={(e) => setRegForm({ ...regForm, reason: e.target.value })}
                  placeholder="e.g. Offsite client presentation; system biometric device network sync issue..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setRegularizeModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xs font-bold shadow-md shadow-orange-500/20 cursor-pointer"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
