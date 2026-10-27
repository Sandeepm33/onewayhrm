'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { Clock, Plus, CheckCircle2, Calendar, X, Check, Ban } from 'lucide-react';

export default function TimesheetsPage() {
  const { user } = useAuth();
  const [timesheets, setTimesheets] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    projectId: '',
    date: '',
    hours: 8,
    description: '',
    isBillable: true,
  });

  useEffect(() => {
    setForm((f) => ({ ...f, date: new Date().toISOString().split('T')[0] }));
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/v1/timesheets');
      const data = await res.json();
      if (data.success) {
        setTimesheets(data.timesheets || []);
        setProjects(data.projects || []);
        if (data.projects?.length > 0 && !form.projectId) {
          setForm((f) => ({ ...f, projectId: data.projects[0]._id }));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/timesheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        setForm({
          projectId: projects[0]?._id || '',
          date: new Date().toISOString().split('T')[0],
          hours: 8,
          description: '',
          isBillable: true,
        });
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDecision = async (timesheetId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch('/api/v1/timesheets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timesheetId, status }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">Project Accounting</span>
            <span className="text-slate-500">•</span>
            <span className="text-xs text-slate-400">{timesheets.length} Logs</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Timesheets & Project Hours
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track daily work entries, billable client hours, and manager approval workflows
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Log Work Entry</span>
        </button>
      </div>

      {/* TABLE */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Hours</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {timesheets.map((ts) => (
                <tr key={ts._id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-medium text-slate-300">{ts.date}</td>
                  <td className="py-3.5 px-4 font-semibold text-white">
                    {ts.employeeId?.firstName} {ts.employeeId?.lastName}
                  </td>
                  <td className="py-3.5 px-4 text-indigo-400 font-medium">
                    {ts.projectId?.name || 'Client Project'}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-white">{ts.hours} hrs</td>
                  <td className="py-3.5 px-4 text-slate-300 max-w-sm truncate">{ts.description}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        ts.status === 'APPROVED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : ts.status === 'SUBMITTED'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {ts.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {ts.status === 'SUBMITTED' && ['SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER'].includes(user?.role || '') && (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleDecision(ts._id, 'APPROVED')}
                          className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[10px] flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleDecision(ts._id, 'REJECTED')}
                          className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold text-[10px] flex items-center gap-1"
                        >
                          <Ban className="w-3 h-3" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {timesheets.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No timesheet entries recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 relative">
            <button onClick={() => setModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-white mb-3">Log Timesheet Work Entry</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Project</label>
                <select
                  value={form.projectId}
                  onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Hours Worked</label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    required
                    value={form.hours}
                    onChange={(e) => setForm({ ...form, hours: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description *</label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Task completed..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  Submit Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
