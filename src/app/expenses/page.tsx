'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { Receipt, Plus, CheckCircle2, X, Check, Ban, CreditCard } from 'lucide-react';

export default function ExpensesPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    category: 'TRAVEL',
    amount: 1200,
    expenseDate: '',
    description: '',
  });

  useEffect(() => {
    setForm((f) => ({ ...f, expenseDate: new Date().toISOString().split('T')[0] }));
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await fetch('/api/v1/expenses');
      const data = await res.json();
      if (data.success) {
        setExpenses(data.expenses || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        setForm({
          category: 'TRAVEL',
          amount: 1200,
          expenseDate: new Date().toISOString().split('T')[0],
          description: '',
        });
        fetchExpenses();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStatus = async (claimId: string, status: string) => {
    try {
      const res = await fetch('/api/v1/expenses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimId, status }),
      });
      const data = await res.json();
      if (data.success) {
        fetchExpenses();
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
            <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">Reimbursements</span>
            <span className="text-slate-500">•</span>
            <span className="text-xs text-slate-400">{expenses.length} Claims</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Expense Claims & Reimbursements
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Submit expense receipts, manager approvals, and payroll reimbursement integration
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Submit Expense Claim</span>
        </button>
      </div>

      {/* TABLE */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Claim ID</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Expense Date</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {expenses.map((exp) => (
                <tr key={exp._id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-medium text-indigo-400">{exp.claimNumber}</td>
                  <td className="py-3.5 px-4 font-semibold text-white">
                    {exp.employeeId?.firstName} {exp.employeeId?.lastName}
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 font-medium">{exp.category}</td>
                  <td className="py-3.5 px-4 font-bold text-emerald-400">INR {Number(exp.amount).toLocaleString('en-IN')}</td>
                  <td className="py-3.5 px-4 text-slate-400">{exp.expenseDate}</td>
                  <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate">{exp.description}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        exp.status === 'REIMBURSED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : exp.status === 'APPROVED'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : exp.status === 'PENDING'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {exp.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {exp.status === 'PENDING' && ['SUPER_ADMIN', 'ORG_ADMIN', 'PAYROLL_ADMIN', 'MANAGER'].includes(user?.role || '') && (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleStatus(exp._id, 'APPROVED')}
                          className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[10px]"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleStatus(exp._id, 'REJECTED')}
                          className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold text-[10px]"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {exp.status === 'APPROVED' && ['SUPER_ADMIN', 'ORG_ADMIN', 'PAYROLL_ADMIN'].includes(user?.role || '') && (
                      <button
                        onClick={() => handleStatus(exp._id, 'REIMBURSED')}
                        className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[10px]"
                      >
                        Mark Reimbursed
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No expense claims submitted.
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
            <h2 className="text-base font-bold text-white mb-3">Submit Expense Claim</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Expense Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="TRAVEL">Travel / Taxi</option>
                  <option value="MEALS">Client Meals</option>
                  <option value="LODGING">Lodging & Hotel</option>
                  <option value="OFFICE_SUPPLIES">Office Supplies</option>
                  <option value="INTERNET">Broadband / Internet Allowance</option>
                  <option value="OTHER">Other Business Expense</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Amount (INR)</label>
                  <input
                    type="number"
                    required
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Expense Date</label>
                  <input
                    type="date"
                    required
                    value={form.expenseDate}
                    onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Business Purpose / Description *</label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Detail the business context and vendor..."
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
                  Submit Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
