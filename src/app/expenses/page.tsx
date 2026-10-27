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
            <span className="text-[11px] font-bold tracking-wider uppercase text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200/60">
              Reimbursements
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-medium text-slate-500">{expenses.length} Claims</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            Expense Claims & Reimbursements
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Submit expense receipts, manager approvals, and payroll reimbursement integration
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Submit Expense Claim</span>
        </button>
      </div>

      {/* TABLE */}
      <div className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Claim ID</th>
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Expense Date</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.map((exp) => (
                <tr key={exp._id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-orange-600">{exp.claimNumber}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {exp.employeeId?.firstName} {exp.employeeId?.lastName}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">{exp.category}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">INR {Number(exp.amount).toLocaleString('en-IN')}</td>
                  <td className="py-3.5 px-4 text-slate-500 font-medium">{exp.expenseDate}</td>
                  <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate font-medium">{exp.description}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        exp.status === 'REIMBURSED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : exp.status === 'APPROVED'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : exp.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
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
                          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] shadow-sm cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleStatus(exp._id, 'REJECTED')}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] shadow-sm cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {exp.status === 'APPROVED' && ['SUPER_ADMIN', 'ORG_ADMIN', 'PAYROLL_ADMIN'].includes(user?.role || '') && (
                      <button
                        onClick={() => handleStatus(exp._id, 'REIMBURSED')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] shadow-sm cursor-pointer"
                      >
                        Mark Reimbursed
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 relative">
            <button onClick={() => setModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-black text-slate-900 mb-3">Submit Expense Claim</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Expense Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:bg-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer"
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Amount (INR)</label>
                  <input
                    type="number"
                    required
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:bg-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Expense Date</label>
                  <input
                    type="date"
                    required
                    value={form.expenseDate}
                    onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:bg-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Business Purpose / Description *</label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Detail the business context and vendor..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:bg-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xs font-bold shadow-md shadow-orange-500/20 cursor-pointer transition-all"
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
