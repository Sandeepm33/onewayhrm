'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import {
  PieChart,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Search,
  Filter,
  Building,
  Briefcase,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  X,
  FileCheck,
  RefreshCw,
  Sparkles,
  Percent,
} from 'lucide-react';

interface IBudget {
  _id: string;
  name: string;
  budgetCode: string;
  budgetType: 'ANNUAL' | 'DEPARTMENT' | 'PROJECT' | 'COST_CENTER';
  departmentId?: { name: string; code: string };
  projectId?: { name: string; code: string; clientName?: string };
  costCenterCode?: string;
  financialYear: string;
  startDate: string;
  endDate: string;
  approvedAmount: number;
  committedLaborCost: number;
  committedExpenseCost: number;
  actualSpent: number;
  totalCommitted: number;
  variance: number;
  percentUtilized: number;
  health: 'HEALTHY' | 'WARNING' | 'OVER_BUDGET';
  status: string;
  notes?: string;
}

interface IRevision {
  _id: string;
  budgetId: { name: string; budgetCode: string };
  revisionNumber: number;
  previousAmount: number;
  requestedAmount: number;
  difference: number;
  reason: string;
  requestedByUserId?: { name: string; email: string };
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export default function BudgetsPage() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<IBudget[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [revisions, setRevisions] = useState<IRevision[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'budgets' | 'revisions'>('budgets');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [selectedBudgetForRev, setSelectedBudgetForRev] = useState<IBudget | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Budget Form
  const [formData, setFormData] = useState({
    name: '',
    budgetCode: '',
    budgetType: 'PROJECT',
    departmentId: '',
    projectId: '',
    costCenterCode: '',
    financialYear: '2026-2027',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    approvedAmount: 3000000,
    committedExpenseCost: 450000,
    actualSpent: 0,
    notes: '',
  });

  // Revision Form
  const [revFormData, setRevFormData] = useState({
    requestedAmount: 0,
    reason: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/budgets');
      const data = await res.json();
      if (data.success) {
        setBudgets(data.budgets || []);
        setProjects(data.projects || []);
        setDepartments(data.departments || []);
        setRevisions(data.revisions || []);
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

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/v1/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        setSuccessMsg(data.message);
        setTimeout(() => setSuccessMsg(''), 4000);
        setFormData({
          name: '',
          budgetCode: '',
          budgetType: 'PROJECT',
          departmentId: '',
          projectId: '',
          costCenterCode: '',
          financialYear: '2026-2027',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          approvedAmount: 3000000,
          committedExpenseCost: 450000,
          actualSpent: 0,
          notes: '',
        });
        fetchData();
      } else {
        setErrorMsg(data.error || 'Failed to create budget');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenRevisionModal = (b: IBudget) => {
    setSelectedBudgetForRev(b);
    setRevFormData({
      requestedAmount: b.approvedAmount + 500000,
      reason: '',
    });
    setRevisionModalOpen(true);
  };

  const handleSubmitRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBudgetForRev) return;
    setSaving(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/v1/budgets/revisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budgetId: selectedBudgetForRev._id,
          requestedAmount: revFormData.requestedAmount,
          reason: revFormData.reason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRevisionModalOpen(false);
        setSuccessMsg(data.message);
        setTimeout(() => setSuccessMsg(''), 4000);
        fetchData();
      } else {
        setErrorMsg(data.error || 'Failed to submit revision');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReviewRevision = async (revId: string, action: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch('/api/v1/budgets/revisions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revisionId: revId, action }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message);
        setTimeout(() => setSuccessMsg(''), 4000);
        fetchData();
      } else {
        alert(data.error);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Aggregated Financial Metrics
  const totalApproved = budgets.reduce((sum, b) => sum + (b.approvedAmount || 0), 0);
  const totalLaborCommitted = budgets.reduce((sum, b) => sum + (b.committedLaborCost || 0), 0);
  const totalExpenseCommitted = budgets.reduce((sum, b) => sum + (b.committedExpenseCost || 0), 0);
  const totalActual = budgets.reduce((sum, b) => sum + (b.actualSpent || 0), 0);
  const totalCommittedOverall = totalLaborCommitted + totalExpenseCommitted + totalActual;
  const totalVariance = totalApproved - totalCommittedOverall;

  const filteredBudgets = budgets.filter((b) => {
    const matchesSearch = b.name.toLowerCase().includes(search.toLowerCase()) || b.budgetCode.toLowerCase().includes(search.toLowerCase());
    const matchesType = !typeFilter || b.budgetType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] text-emerald-700 font-extrabold uppercase tracking-wider bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
              Enterprise Financial Governance
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-500">MNC Multi-Tier Cost Centers</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 flex items-center gap-2">
            Budget Management & Labor Costing
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium max-w-2xl">
            Model fully loaded employment cost (Monthly Salary Cost × Allocation % × Duration), monitor variances, and enforce finance revision approval chains.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-transform hover:scale-[1.02] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Budget</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* FINANCIAL SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Approved Budget</div>
          <div className="text-2xl font-black text-slate-950 mt-1">
            INR {totalApproved.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Across {budgets.length} cost centers</div>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">Committed Labor Cost</div>
          <div className="text-2xl font-black text-indigo-950 mt-1">
            INR {totalLaborCommitted.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-indigo-700 mt-0.5">Calculated from resource allocations</div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Operating Expenses</div>
          <div className="text-2xl font-black text-amber-950 mt-1">
            INR {totalExpenseCommitted.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-amber-700 mt-0.5">Software licenses & infrastructure</div>
        </div>

        <div
          className={`p-4 rounded-2xl border shadow-xs ${
            totalVariance >= 0
              ? 'bg-emerald-50/50 border-emerald-200/80 text-emerald-950'
              : 'bg-rose-50/50 border-rose-200/80 text-rose-950'
          }`}
        >
          <div
            className={`text-[11px] font-bold uppercase tracking-wider ${
              totalVariance >= 0 ? 'text-emerald-800' : 'text-rose-800'
            }`}
          >
            Net Budget Variance
          </div>
          <div className="text-2xl font-black mt-1">
            {totalVariance >= 0 ? '+' : ''}INR {totalVariance.toLocaleString('en-IN')}
          </div>
          <div className={`text-[10px] mt-0.5 ${totalVariance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {totalVariance >= 0 ? 'Budget healthy & within limit' : 'Overrun warning across plans'}
          </div>
        </div>
      </div>

      {/* TABS & SEARCH */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('budgets')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'budgets'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Budgets Directory ({budgets.length})
          </button>
          <button
            onClick={() => setActiveTab('revisions')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'revisions'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Revision Approvals ({revisions.filter((r) => r.status === 'PENDING').length} Pending)
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code or plan name..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Types</option>
            <option value="PROJECT">Project Budget</option>
            <option value="DEPARTMENT">Department Budget</option>
            <option value="ANNUAL">Annual Corporate</option>
            <option value="COST_CENTER">Cost Center</option>
          </select>
        </div>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading budget plans and labor cost data...
        </div>
      ) : activeTab === 'budgets' ? (
        /* BUDGETS GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBudgets.map((b) => {
            const isOver = b.health === 'OVER_BUDGET';
            const isWarn = b.health === 'WARNING';

            return (
              <div
                key={b._id}
                className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-emerald-700 font-bold uppercase tracking-wider bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                          {b.budgetCode}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 font-mono">
                          FY {b.financialYear}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mt-1">{b.name}</h3>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        isOver
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : isWarn
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {b.health === 'OVER_BUDGET' ? 'Overrun' : b.health === 'WARNING' ? 'Warning' : 'Healthy'}
                    </span>
                  </div>

                  {/* Financial Breakdown */}
                  <div className="my-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Approved Budget:</span>
                      <span className="font-bold text-slate-950 text-sm">
                        INR {b.approvedAmount.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                      <span className="text-slate-500 font-medium">Committed Labor:</span>
                      <span className="font-semibold text-indigo-700">
                        INR {(b.committedLaborCost || 0).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Operating Expenses:</span>
                      <span className="font-semibold text-amber-700">
                        INR {(b.committedExpenseCost || 0).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Actual Realized:</span>
                      <span className="font-semibold text-slate-800">
                        INR {(b.actualSpent || 0).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200 font-bold">
                      <span className="text-slate-700">Remaining Variance:</span>
                      <span className={b.variance >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                        INR {b.variance.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Consumption Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-[11px] mb-1 font-semibold text-slate-600">
                      <span>Consumed Capacity</span>
                      <span className={isOver ? 'text-rose-600 font-bold' : ''}>{b.percentUtilized}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        style={{ width: `${Math.min(100, b.percentUtilized)}%` }}
                        className={`h-full ${
                          isOver ? 'bg-rose-500' : isWarn ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(b.startDate).toLocaleDateString('en-IN')} → {new Date(b.endDate).toLocaleDateString('en-IN')}
                  </span>

                  <button
                    onClick={() => handleOpenRevisionModal(b)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-colors cursor-pointer"
                  >
                    Request Revision
                  </button>
                </div>
              </div>
            );
          })}

          {filteredBudgets.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              <PieChart className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-semibold">No budget plans matching search criteria.</p>
              <button
                onClick={() => setModalOpen(true)}
                className="mt-3 px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
              >
                + Create Initial Budget
              </button>
            </div>
          )}
        </div>
      ) : (
        /* REVISIONS TABLE */
        <div className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Budget Revision Proposals & Finance Approval Chain
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Changes to approved project or department budgets require authorized review by Finance / Leadership.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Budget Plan</th>
                  <th className="py-3 px-4">Rev #</th>
                  <th className="py-3 px-4">Previous Amount</th>
                  <th className="py-3 px-4">Requested Amount</th>
                  <th className="py-3 px-4">Delta (Difference)</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {revisions.map((rev) => (
                  <tr key={rev._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {rev.budgetId?.name || 'Budget'}
                      <div className="text-[10px] text-slate-400 font-mono">{rev.budgetId?.budgetCode}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                      R{rev.revisionNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      INR {rev.previousAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      INR {rev.requestedAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-700">
                      +INR {rev.difference.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium max-w-xs truncate">
                      {rev.reason}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          rev.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : rev.status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {rev.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {rev.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleReviewRevision(rev._id, 'APPROVED')}
                            className="px-2 py-1 rounded-md bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-700 cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReviewRevision(rev._id, 'REJECTED')}
                            className="px-2 py-1 rounded-md bg-rose-50 text-rose-700 font-bold text-[10px] hover:bg-rose-100 cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">Decided</span>
                      )}
                    </td>
                  </tr>
                ))}

                {revisions.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No budget revision requests recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE BUDGET MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 relative my-8 text-slate-900">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-950 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-emerald-600" />
                <span>Create Annual or Project Budget</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Establish financial authorization limits, link cost centers, and configure operational expenditure.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateBudget} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Budget Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. FY27 AI Core Project Budget"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Budget Code</label>
                  <input
                    type="text"
                    value={formData.budgetCode}
                    onChange={(e) => setFormData({ ...formData, budgetCode: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-medium focus:outline-none focus:border-emerald-500 uppercase"
                    placeholder="e.g. BDG-PRJ-01"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Budget Category</label>
                  <select
                    value={formData.budgetType}
                    onChange={(e) => setFormData({ ...formData, budgetType: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                  >
                    <option value="PROJECT">Project Budget</option>
                    <option value="DEPARTMENT">Department Budget</option>
                    <option value="ANNUAL">Annual Corporate</option>
                    <option value="COST_CENTER">Cost Center</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Financial Year</label>
                  <input
                    type="text"
                    value={formData.financialYear}
                    onChange={(e) => setFormData({ ...formData, financialYear: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-medium focus:outline-none focus:border-emerald-500"
                    placeholder="2026-2027"
                  />
                </div>
              </div>

              {formData.budgetType === 'PROJECT' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Link to Project</label>
                  <select
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Select Project</option>
                    {projects.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.budgetType === 'DEPARTMENT' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Link to Department</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Approved Amount (INR) *</label>
                  <input
                    type="number"
                    required
                    value={formData.approvedAmount}
                    onChange={(e) => setFormData({ ...formData, approvedAmount: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Non-Labor Expense (INR)</label>
                  <input
                    type="number"
                    value={formData.committedExpenseCost}
                    onChange={(e) => setFormData({ ...formData, committedExpenseCost: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Creating...' : 'Authorize Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REQUEST REVISION MODAL */}
      {revisionModalOpen && selectedBudgetForRev && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 relative my-8 text-slate-900">
            <button
              onClick={() => setRevisionModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-950 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                <span>Request Budget Revision</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Submit an authorized revision request for {selectedBudgetForRev.name}.
              </p>
            </div>

            <form onSubmit={handleSubmitRevision} className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Current Approved Amount:</span>
                  <span className="font-bold text-slate-900">
                    INR {selectedBudgetForRev.approvedAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Requested Amount (INR) *
                </label>
                <input
                  type="number"
                  required
                  value={revFormData.requestedAmount}
                  onChange={(e) => setRevFormData({ ...revFormData, requestedAmount: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Revision Justification / Reason *
                </label>
                <textarea
                  rows={3}
                  required
                  value={revFormData.reason}
                  onChange={(e) => setRevFormData({ ...revFormData, reason: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
                  placeholder="Detail why an increase or scope change is required..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setRevisionModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Submitting...' : 'Submit to Finance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
