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
  const { user, hasPermission } = useAuth();
  const canCreate = hasPermission('payroll', 'create');
  const canApprove = hasPermission('payroll', 'approve');
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
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] text-orange-600 font-extrabold uppercase tracking-wider bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md">
              Payroll Engine
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-500">Statutory Compliance (India)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 flex items-center gap-2">
            Compensation & Payroll Processing
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Calculates Gross earnings, Basic (50%), HRA, Employee EPF (12%), Employer EPF, ESI, Professional Tax, and Net Pay
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/payslips"
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2 shadow-xs"
          >
            <Download className="w-4 h-4 text-orange-600" />
            <span>View All Payslips</span>
          </a>
          {canCreate && (
            <button
              onClick={() => setRunModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-transform hover:scale-[1.02] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Execute New Pay Run</span>
            </button>
          )}
        </div>
      </div>

      {success && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* STATUTORY RULES STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs text-xs">
        <div>
          <span className="text-[10px] text-orange-600 uppercase font-extrabold tracking-wider">Employees Provident Fund (EPF)</span>
          <p className="text-slate-900 font-bold mt-0.5">12% Employee + 12% Employer</p>
          <p className="text-[10px] text-slate-400 font-medium">Wage ceiling / Basic component</p>
        </div>
        <div>
          <span className="text-[10px] text-orange-600 uppercase font-extrabold tracking-wider">Employee State Insurance (ESI)</span>
          <p className="text-slate-900 font-bold mt-0.5">0.75% Emp + 3.25% Empr</p>
          <p className="text-[10px] text-slate-400 font-medium">Applicable on Gross &le; 21,000</p>
        </div>
        <div>
          <span className="text-[10px] text-orange-600 uppercase font-extrabold tracking-wider">Professional Tax (PT)</span>
          <p className="text-slate-900 font-bold mt-0.5">INR 200 / month</p>
          <p className="text-[10px] text-slate-400 font-medium">State compliance slabs</p>
        </div>
        <div>
          <span className="text-[10px] text-orange-600 uppercase font-extrabold tracking-wider">Income Tax Withholding (TDS)</span>
          <p className="text-slate-900 font-bold mt-0.5">Section 192 (Old & New Regime)</p>
          <p className="text-[10px] text-slate-400 font-medium">Marginal estimated deduction</p>
        </div>
      </div>

      {/* PAYROLL RUNS TABLE */}
      <div className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Payroll Batches & Disbursal Records
          </h3>
          <span className="text-[11px] text-slate-500 font-bold">{runs.length} Pay Cycles Run</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Pay Period</th>
                <th className="py-3 px-4">Headcount</th>
                <th className="py-3 px-4">Total Gross</th>
                <th className="py-3 px-4">Total Deductions</th>
                <th className="py-3 px-4">Net Salary Disbursed</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Approvals & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {runs.map((run) => (
                <tr key={run._id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{run.title}</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Cycle: {run.month}/{run.year}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-700">
                    {run.totalEmployees} Employees
                  </td>
                  <td className="py-3.5 px-4 text-slate-900 font-bold">
                    INR {(run.totalGrossPay || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-rose-600 font-semibold">
                    INR {(run.totalDeductions || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 font-black text-emerald-700 text-sm">
                    INR {(run.totalNetPay || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        run.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : run.status === 'APPROVED'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : run.status === 'VALIDATED'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {run.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {run.status === 'VALIDATED' && canApprove && (
                        <button
                          onClick={() => handleAction(run._id, 'APPROVE')}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                          <span>Approve Run</span>
                        </button>
                      )}
                      {run.status === 'APPROVED' && canApprove && (
                        <button
                          onClick={() => handleAction(run._id, 'PAY_AND_PUBLISH')}
                          className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>Disburse & Publish Payslips</span>
                        </button>
                      )}
                      {run.status === 'PAID' && (
                        <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Disbursed & Published</span>
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {runs.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 relative text-slate-900">
            <button onClick={() => setRunModalOpen(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-slate-950 mb-1">Execute Monthly Pay Run</h2>
            <p className="text-xs text-slate-500 mb-4 font-medium">
              Pulls active employees from database and computes statutory earnings & deductions
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleComputeRun} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Month</label>
                  <select
                    value={form.month}
                    onChange={(e) => setForm({ ...form, month: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Year</label>
                  <input
                    type="number"
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Execution Notes</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setRunModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={calcLoading}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xs font-bold shadow-md shadow-orange-500/20 disabled:opacity-50 cursor-pointer"
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
