'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import {
  CreditCard,
  Plus,
  CheckCircle2,
  Lock,
  Download,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  Send,
  X,
} from 'lucide-react';

export default function PayrollPage() {
  const { user } = useAuth();
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [runModalOpen, setRunModalOpen] = useState(false);
  const [calcLoading, setCalcLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    month: 10,
    year: 2026,
    notes: 'Monthly standard payroll execution with Indian statutory EPF, ESI, and PT compliance.',
  });

  const fetchPayrollRuns = async () => {
    try {
      const res = await fetch('/api/v1/payroll');
      const data = await res.json();
      if (data.success) {
        setRuns(data.runs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollRuns();
  }, []);

  const handleComputeRun = async (e: React.FormEvent) => {
    e.preventDefault();
    setCalcLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/v1/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(data.message);
        setRunModalOpen(false);
        fetchPayrollRuns();
      } else {
        setError(data.error || 'Failed to calculate payroll');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCalcLoading(false);
    }
  };

  const handleAction = async (runId: string, action: 'APPROVE' | 'LOCK' | 'PAY_AND_PUBLISH') => {
    try {
      const res = await fetch('/api/v1/payroll', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId, action, paymentReference: `NEFT-BATCH-${Date.now()}` }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(`Payroll run updated to ${action}`);
        fetchPayrollRuns();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">Payroll Engine</span>
            <span className="text-slate-500">•</span>
            <span className="text-xs text-slate-400">Statutory Compliance (India)</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Compensation & Payroll Processing
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Calculates Gross earnings, Basic (50%), HRA, Employee EPF (12%), Employer EPF, ESI, Professional Tax, and Net Pay
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/payslips"
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-indigo-400" />
            <span>View All Payslips</span>
          </a>
          <button
            onClick={() => setRunModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Execute New Pay Run</span>
          </button>
        </div>
      </div>

      {success && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* STATUTORY RULES STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Employees Provident Fund (EPF)</span>
          <p className="text-slate-200 font-bold mt-0.5">12% Employee + 12% Employer</p>
          <p className="text-[10px] text-slate-500">Wage ceiling / Basic component</p>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Employee State Insurance (ESI)</span>
          <p className="text-slate-200 font-bold mt-0.5">0.75% Emp + 3.25% Empr</p>
          <p className="text-[10px] text-slate-500">Applicable on Gross &lt;= 21,000</p>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Professional Tax (PT)</span>
          <p className="text-slate-200 font-bold mt-0.5">INR 200 / month</p>
          <p className="text-[10px] text-slate-500">Karnataka & Maharashtra Slab</p>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Income Tax Withholding (TDS)</span>
          <p className="text-slate-200 font-bold mt-0.5">Section 192 (Old & New Regime)</p>
          <p className="text-[10px] text-slate-500">Marginal estimated deduction</p>
        </div>
      </div>

      {/* PAYROLL RUNS TABLE */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Payroll Batches & Disbursal Records
          </h3>
          <span className="text-[11px] text-slate-400">{runs.length} Pay Cycles Run</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Pay Period</th>
                <th className="py-3 px-4">Headcount</th>
                <th className="py-3 px-4">Total Gross</th>
                <th className="py-3 px-4">Total Deductions</th>
                <th className="py-3 px-4">Net Salary Disbursed</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Approvals & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {runs.map((run) => (
                <tr key={run._id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white">{run.title}</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Cycle: {run.month}/{run.year}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-300">
                    {run.totalEmployees} Employees
                  </td>
                  <td className="py-3.5 px-4 text-slate-200 font-medium">
                    INR {(run.totalGrossPay || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-rose-400 font-medium">
                    INR {(run.totalDeductions || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-emerald-400 text-sm">
                    INR {(run.totalNetPay || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        run.status === 'PAID'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : run.status === 'APPROVED'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : run.status === 'VALIDATED'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {run.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {run.status === 'VALIDATED' && (
                        <button
                          onClick={() => handleAction(run._id, 'APPROVE')}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] flex items-center gap-1 shadow-sm"
                        >
                          <Check className="w-3 h-3" />
                          <span>Approve Run</span>
                        </button>
                      )}
                      {run.status === 'APPROVED' && (
                        <button
                          onClick={() => handleAction(run._id, 'PAY_AND_PUBLISH')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] flex items-center gap-1 shadow-sm"
                        >
                          <Send className="w-3 h-3" />
                          <span>Disburse & Publish Payslips</span>
                        </button>
                      )}
                      {run.status === 'PAID' && (
                        <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Disbursed & Published</span>
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {runs.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No payroll runs executed yet. Click &quot;Execute New Pay Run&quot; to compute.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EXECUTE RUN MODAL */}
      {runModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 relative">
            <button onClick={() => setRunModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-white mb-1">Execute Monthly Pay Run</h2>
            <p className="text-xs text-slate-400 mb-4">
              Pulls active employees from MongoDB and computes statutory earnings & deductions
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleComputeRun} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Month</label>
                  <select
                    value={form.month}
                    onChange={(e) => setForm({ ...form, month: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    {[
                      { m: 1, name: 'January' },
                      { m: 2, name: 'February' },
                      { m: 3, name: 'March' },
                      { m: 4, name: 'April' },
                      { m: 5, name: 'May' },
                      { m: 6, name: 'June' },
                      { m: 7, name: 'July' },
                      { m: 8, name: 'August' },
                      { m: 9, name: 'September' },
                      { m: 10, name: 'October' },
                      { m: 11, name: 'November' },
                      { m: 12, name: 'December' },
                    ].map((item) => (
                      <option key={item.m} value={item.m}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Year</label>
                  <input
                    type="number"
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Execution Notes</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setRunModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={calcLoading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                >
                  {calcLoading ? 'Computing Formulae...' : 'Calculate Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
