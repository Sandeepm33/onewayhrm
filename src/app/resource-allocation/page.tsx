'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import {
  Layers,
  Users,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Search,
  Filter,
  Clock,
  DollarSign,
  TrendingUp,
  X,
  Edit2,
  Trash2,
  Calendar,
  Percent,
  Sparkles,
} from 'lucide-react';

interface IProject {
  _id: string;
  name: string;
  code: string;
  clientName?: string;
  status: string;
}

interface IAllocation {
  _id: string;
  projectId: IProject;
  employeeId: any;
  roleInProject: string;
  allocationPercentage: number;
  expectedHoursPerWeek: number;
  billableRatePerHour?: number;
  startDate: string;
  endDate?: string;
  status: string;
  notes?: string;
}

interface IUtilization {
  employee: any;
  allocatedPercentage: number;
  availablePercentage: number;
  status: 'BENCH' | 'PARTIAL' | 'OPTIMAL' | 'OVER_ALLOCATED';
  projects: {
    projectId: string;
    projectName: string;
    projectCode: string;
    percentage: number;
    role: string;
  }[];
}

export default function ResourceAllocationPage() {
  const { user } = useAuth();
  const [allocations, setAllocations] = useState<IAllocation[]>([]);
  const [projects, setProjects] = useState<IProject[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [utilizationList, setUtilizationList] = useState<IUtilization[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'matrix' | 'table'>('matrix');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Allocation Form
  const [formData, setFormData] = useState({
    projectId: '',
    employeeId: '',
    roleInProject: 'Developer',
    allocationPercentage: 50,
    expectedHoursPerWeek: 20,
    billableRatePerHour: 1500,
    costRatePerHour: 800,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    notes: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/resource-allocation');
      const data = await res.json();
      if (data.success) {
        setAllocations(data.allocations || []);
        setProjects(data.projects || []);
        setEmployees(data.employees || []);
        setUtilizationList(data.employeeUtilization || []);
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

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/v1/resource-allocation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        setModalOpen(false);
        setSuccessMsg(data.message);
        setTimeout(() => setSuccessMsg(''), 5000);
        setFormData({
          projectId: '',
          employeeId: '',
          roleInProject: 'Developer',
          allocationPercentage: 50,
          expectedHoursPerWeek: 20,
          billableRatePerHour: 1500,
          costRatePerHour: 800,
          startDate: new Date().toISOString().split('T')[0],
          endDate: '',
          notes: '',
        });
        fetchData();
      } else {
        setErrorMsg(data.error || 'Failed to allocate resource');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAllocation = async (id: string) => {
    if (!confirm('Are you sure you want to release this project allocation?')) return;

    try {
      const res = await fetch(`/api/v1/resource-allocation/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Allocation released.');
        setTimeout(() => setSuccessMsg(''), 4000);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Capacity calculation for modal preview
  const selectedEmpUtil = utilizationList.find(
    (u) => String(u.employee._id) === String(formData.employeeId)
  );
  const currentLoad = selectedEmpUtil ? selectedEmpUtil.allocatedPercentage : 0;
  const projectedLoad = currentLoad + Number(formData.allocationPercentage);

  // High-level KPI metrics
  const totalEmployees = utilizationList.length;
  const optimalCount = utilizationList.filter((u) => u.status === 'OPTIMAL').length;
  const benchCount = utilizationList.filter((u) => u.status === 'BENCH').length;
  const partialCount = utilizationList.filter((u) => u.status === 'PARTIAL').length;
  const conflictCount = utilizationList.filter((u) => u.status === 'OVER_ALLOCATED').length;

  const filteredUtilization = utilizationList.filter((u) => {
    const fullName = `${u.employee?.firstName || ''} ${u.employee?.lastName || ''}`.toLowerCase();
    const code = (u.employee?.employeeCode || '').toLowerCase();
    const matchesSearch = fullName.includes(search.toLowerCase()) || code.includes(search.toLowerCase());
    const matchesStatus = !statusFilter || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] text-teal-700 font-extrabold uppercase tracking-wider bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-md">
              Workforce Planning & Utilization
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-500">MNC Matrix Resource Pool</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 flex items-center gap-2">
            Team & Project Resource Allocation
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium max-w-2xl">
            Track multi-project split allocations (e.g. 50% Client Alpha / 50% Project Beta), prevent capacity over-allocation, and monitor bench talent.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-transform hover:scale-[1.02] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Allocate Resource</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Headcount</div>
          <div className="text-2xl font-black text-slate-950 mt-1">{totalEmployees}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Active workforce</div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Optimal (100%)</span>
          </div>
          <div className="text-2xl font-black text-emerald-950 mt-1">{optimalCount}</div>
          <div className="text-[10px] text-emerald-700 mt-0.5">Fully utilized</div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Partial (1-99%)</div>
          <div className="text-2xl font-black text-amber-950 mt-1">{partialCount}</div>
          <div className="text-[10px] text-amber-700 mt-0.5">Available for partial staffing</div>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">On Bench (0%)</div>
          <div className="text-2xl font-black text-indigo-950 mt-1">{benchCount}</div>
          <div className="text-[10px] text-indigo-700 mt-0.5">Ready for new projects</div>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80 shadow-xs col-span-2 sm:col-span-1">
          <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Over-Allocated</span>
          </div>
          <div className="text-2xl font-black text-rose-950 mt-1">{conflictCount}</div>
          <div className="text-[10px] text-rose-700 mt-0.5">&gt;100% capacity conflict</div>
        </div>
      </div>

      {/* FILTER & TABS BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-2 border-b sm:border-b-0 pb-2 sm:pb-0">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Utilization Matrix
          </button>
          <button
            onClick={() => setActiveTab('table')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'table'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Allocations Master ({allocations.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search resource..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-teal-500"
          >
            <option value="">All Capacity Status</option>
            <option value="OPTIMAL">Optimal (100%)</option>
            <option value="PARTIAL">Partial (1-99%)</option>
            <option value="BENCH">On Bench (0%)</option>
            <option value="OVER_ALLOCATED">Over-Allocated (&gt;100%)</option>
          </select>
        </div>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading resource allocation data...
        </div>
      ) : activeTab === 'matrix' ? (
        /* UTILIZATION MATRIX VIEW */
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredUtilization.map((u) => {
              const emp = u.employee;
              const isOver = u.allocatedPercentage > 100;
              const isOptimal = u.allocatedPercentage === 100;
              const isBench = u.allocatedPercentage === 0;

              return (
                <div
                  key={emp._id}
                  className={`p-4 rounded-2xl bg-white border transition-all shadow-xs ${
                    isOver
                      ? 'border-rose-300 ring-1 ring-rose-200 bg-rose-50/20'
                      : isOptimal
                      ? 'border-emerald-200/90'
                      : 'border-slate-200/90'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                        {emp.firstName?.[0]}{emp.lastName?.[0]}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 leading-tight">
                          {emp.firstName} {emp.lastName}
                        </h4>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <span className="font-mono text-orange-600 font-medium">{emp.employeeCode}</span>
                          <span>•</span>
                          <span>{emp.departmentId?.name || 'Engineering'}</span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        isOver
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : isOptimal
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : isBench
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {u.status} ({u.allocatedPercentage}%)
                    </span>
                  </div>

                  {/* Utilization Progress Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-bold text-slate-700">Capacity Load</span>
                      <span className="font-bold text-slate-900">
                        {u.allocatedPercentage}% Allocated{' '}
                        {u.availablePercentage > 0 && (
                          <span className="text-emerald-600 font-semibold">({u.availablePercentage}% free)</span>
                        )}
                      </span>
                    </div>

                    <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden flex">
                      <div
                        style={{ width: `${Math.min(100, u.allocatedPercentage)}%` }}
                        className={`h-full transition-all ${
                          isOver ? 'bg-rose-500' : isOptimal ? 'bg-emerald-500' : 'bg-teal-500'
                        }`}
                      />
                      {isOver && (
                        <div
                          style={{ width: `${Math.min(100, u.allocatedPercentage - 100)}%` }}
                          className="h-full bg-rose-600 animate-pulse"
                        />
                      )}
                    </div>
                  </div>

                  {/* Active Projects List */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>Assigned Projects</span>
                      <span>{u.projects.length} Active</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {u.projects.map((p, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-700 flex items-center gap-1"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                          <span>{p.projectName}</span>
                          <strong className="text-teal-700">({p.percentage}%)</strong>
                        </span>
                      ))}

                      {u.projects.length === 0 && (
                        <span className="text-[11px] text-slate-400 italic">Unallocated - Talent currently on bench</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ALLOCATIONS MASTER TABLE */
        <div className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Resource</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Role in Project</th>
                  <th className="py-3 px-4">Allocation %</th>
                  <th className="py-3 px-4">Weekly Hours</th>
                  <th className="py-3 px-4">Billing Rate</th>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {allocations.map((a) => (
                  <tr key={a._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">
                        {a.employeeId?.firstName} {a.employeeId?.lastName}
                      </div>
                      <div className="text-[10px] font-mono text-orange-600">{a.employeeId?.employeeCode}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{a.projectId?.name || 'Project'}</div>
                      <div className="text-[10px] text-slate-400">{a.projectId?.clientName || 'Internal Client'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                        {a.roleInProject}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-teal-700">
                      {a.allocationPercentage}%
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {a.expectedHoursPerWeek} hrs/wk
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      INR {a.billableRatePerHour || 0}/hr
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-medium">
                      {new Date(a.startDate).toLocaleDateString('en-IN')}{' '}
                      {a.endDate ? `→ ${new Date(a.endDate).toLocaleDateString('en-IN')}` : '(Ongoing)'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteAllocation(a._id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Release Allocation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}

                {allocations.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No project resource allocations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ALLOCATE RESOURCE MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 relative my-8 text-slate-900">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-950 flex items-center gap-2">
                <Layers className="w-5 h-5 text-teal-600" />
                <span>Allocate Resource to Project</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Configure fractional or full capacity assignment with billable costing rates.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAllocate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Employee *</label>
                <select
                  required
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-teal-500"
                >
                  <option value="">Select Resource from Workforce</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode}) - {emp.roleId?.name || 'Staff'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Capacity Preview Indicator */}
              {formData.employeeId && (
                <div
                  className={`p-3 rounded-xl border text-xs ${
                    projectedLoad > 100
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : projectedLoad === 100
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>Current Capacity: {currentLoad}%</span>
                    <span>Projected: {projectedLoad}%</span>
                  </div>
                  <div className="text-[11px] mt-0.5 font-medium">
                    {projectedLoad > 100
                      ? '⚠️ Warning: This will over-allocate the employee beyond 100% capacity!'
                      : projectedLoad === 100
                      ? '✓ Optimal 100% capacity achieved.'
                      : `Resource will have ${100 - projectedLoad}% remaining bandwidth.`}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Project *</label>
                <select
                  required
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-teal-500"
                >
                  <option value="">Select Project</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.code}) - {p.clientName || 'Internal'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Role in Project</label>
                  <input
                    type="text"
                    required
                    value={formData.roleInProject}
                    onChange={(e) => setFormData({ ...formData, roleInProject: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-teal-500"
                    placeholder="e.g. Lead React Dev"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Allocation Percentage *</label>
                  <select
                    value={formData.allocationPercentage}
                    onChange={(e) => {
                      const pct = Number(e.target.value);
                      setFormData({
                        ...formData,
                        allocationPercentage: pct,
                        expectedHoursPerWeek: Math.round((pct / 100) * 40),
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-teal-500"
                  >
                    <option value={25}>25% (10 hrs/wk)</option>
                    <option value={50}>50% (20 hrs/wk)</option>
                    <option value={75}>75% (30 hrs/wk)</option>
                    <option value={100}>100% (40 hrs/wk)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Billable Rate (INR/hr)</label>
                  <input
                    type="number"
                    value={formData.billableRatePerHour}
                    onChange={(e) => setFormData({ ...formData, billableRatePerHour: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cost Rate (INR/hr)</label>
                  <input
                    type="number"
                    value={formData.costRatePerHour}
                    onChange={(e) => setFormData({ ...formData, costRatePerHour: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-teal-500"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">End Date (Optional)</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-teal-500"
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
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Allocating...' : 'Confirm Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
