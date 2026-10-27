'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Building2,
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  FolderTree,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Network,
  Users2,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface IDepartment {
  _id: string;
  name: string;
  code: string;
  parentDepartmentId?: { _id: string; name: string; code: string } | null;
  costCenterCode?: string;
  headEmployeeId?: {
    _id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
    email: string;
  } | null;
  description?: string;
  headcount?: number;
  teamCount?: number;
}

interface IEmployee {
  _id: string;
  firstName: string;
  lastName: string;
  employeeCode: string;
  email: string;
  roleId?: { _id: string; name: string; slug: string };
  designationId?: { _id: string; title: string; code: string };
  status: string;
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<IDepartment[]>([]);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [parentFilter, setParentFilter] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewMembersModalOpen, setViewMembersModalOpen] = useState(false);

  // Selected Department for view or edit
  const [selectedDept, setSelectedDept] = useState<IDepartment | null>(null);
  const [deptEmployees, setDeptEmployees] = useState<IEmployee[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    parentDepartmentId: '',
    costCenterCode: '',
    headEmployeeId: '',
    description: '',
  });

  const fetchData = async () => {
    try {
      const [deptRes, empRes, rolesRes] = await Promise.all([
        fetch('/api/v1/departments'),
        fetch('/api/v1/employees'),
        fetch('/api/v1/roles'),
      ]);

      const [deptData, empData, rolesData] = await Promise.all([
        deptRes.json(),
        empRes.json(),
        rolesRes.json(),
      ]);

      if (deptData.success) setDepartments(deptData.departments || []);
      if (empData.success) setAllEmployees(empData.employees || []);
      if (rolesData.success) setRoles(rolesData.roles || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter candidates for Head of Department (Strictly Manager roles)
  const isManagerRole = (emp: any) => {
    if (!emp) return false;
    const rId = emp.roleId?._id || emp.roleId;
    const roleObj = roles.find((r) => r._id === rId) || emp.roleId;
    const roleName = (roleObj?.name || '').toLowerCase();
    const roleSlug = (roleObj?.slug || '').toLowerCase();
    const desig = (emp.designationId?.title || '').toLowerCase();
    return (
      roleName.includes('manager') ||
      roleSlug.includes('manager') ||
      desig.includes('manager')
    );
  };

  const eligibleManagers = allEmployees.filter(isManagerRole);

  // Filtered Departments
  const filteredDepartments = departments.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase()) ||
      (d.costCenterCode || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.headEmployeeId ? `${d.headEmployeeId.firstName} ${d.headEmployeeId.lastName}`.toLowerCase().includes(search.toLowerCase()) : false);

    if (parentFilter === 'TOP_LEVEL') {
      return matchesSearch && !d.parentDepartmentId;
    }
    if (parentFilter === 'SUB_DEPT') {
      return matchesSearch && !!d.parentDepartmentId;
    }
    return matchesSearch;
  });

  // Open Create
  const handleOpenCreate = () => {
    setFormData({
      name: '',
      code: '',
      parentDepartmentId: '',
      costCenterCode: '',
      headEmployeeId: '',
      description: '',
    });
    setErrorMsg('');
    setCreateModalOpen(true);
  };

  // Open Edit
  const handleOpenEdit = (dept: IDepartment) => {
    setSelectedDept(dept);
    setFormData({
      name: dept.name,
      code: dept.code,
      parentDepartmentId: dept.parentDepartmentId?._id || '',
      costCenterCode: dept.costCenterCode || '',
      headEmployeeId: dept.headEmployeeId?._id || '',
      description: dept.description || '',
    });
    setErrorMsg('');
    setEditModalOpen(true);
  };

  // Open View Members
  const handleOpenViewMembers = async (dept: IDepartment) => {
    setSelectedDept(dept);
    setViewMembersModalOpen(true);
    setLoadingMembers(true);
    try {
      const res = await fetch(`/api/v1/departments/${dept._id}`);
      const data = await res.json();
      if (data.success) {
        setDeptEmployees(data.employees || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Submit Create
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/v1/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message);
        setTimeout(() => setSuccessMsg(''), 4000);
        setCreateModalOpen(false);
        fetchData();
      } else {
        setErrorMsg(data.error || 'Failed to create department');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Update
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDept) return;
    setActionLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/v1/departments/${selectedDept._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message);
        setTimeout(() => setSuccessMsg(''), 4000);
        setEditModalOpen(false);
        fetchData();
      } else {
        setErrorMsg(data.error || 'Failed to update department');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Department
  const handleDelete = async (dept: IDepartment) => {
    if (!confirm(`Are you sure you want to delete "${dept.name}" (${dept.code})?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/departments/${dept._id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message);
        setTimeout(() => setSuccessMsg(''), 4000);
        fetchData();
      } else {
        alert(data.error || 'Failed to delete department');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Totals
  const totalHeadcount = departments.reduce((acc, d) => acc + (d.headcount || 0), 0);
  const totalSubdepts = departments.filter((d) => d.parentDepartmentId).length;
  const costCentersCount = new Set(departments.map((d) => d.costCenterCode).filter(Boolean)).size;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* HEADER & QUICK NAV */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <Building2 className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Departments & Cost Centers</h1>
                <p className="text-xs text-slate-500">
                  Manage business units, sub-department hierarchies, assigned heads of department, and operational costing.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/organization"
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Network className="w-3.5 h-3.5 text-blue-600" />
              <span>Org Chart</span>
            </Link>
            <Link
              href="/teams"
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Users2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Teams & Squads</span>
            </Link>
            <button
              onClick={handleOpenCreate}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Department</span>
            </button>
          </div>
        </div>

        {/* NOTIFICATIONS */}
        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* METRICS STRIP */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Departments</span>
              <Building2 className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{departments.length}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {departments.length - totalSubdepts} Primary • {totalSubdepts} Sub-units
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Assigned Headcount</span>
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{totalHeadcount}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Active staff in departments</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Cost Centers</span>
              <DollarSign className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{costCentersCount}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Operational budget codes</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Functional Teams</span>
              <Users2 className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {departments.reduce((acc, d) => acc + (d.teamCount || 0), 0)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Squads mapped to departments</div>
          </div>
        </div>

        {/* SEARCH & FILTER BAR */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, code, cost center, head..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={parentFilter}
              onChange={(e) => setParentFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-blue-500"
            >
              <option value="">All Hierarchy Levels</option>
              <option value="TOP_LEVEL">Top-Level Departments Only</option>
              <option value="SUB_DEPT">Sub-Departments Only</option>
            </select>
          </div>
        </div>

        {/* DEPARTMENTS GRID */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading organizational departments...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDepartments.map((dept) => {
              const hod = dept.headEmployeeId;
              const isSubdept = !!dept.parentDepartmentId;

              return (
                <div
                  key={dept._id}
                  className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Top Badges */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md">
                          {dept.code}
                        </span>
                        {dept.costCenterCode && (
                          <span className="text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                            {dept.costCenterCode}
                          </span>
                        )}
                        {isSubdept && (
                          <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                            <FolderTree className="w-3 h-3" />
                            Sub-unit
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(dept)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Edit Department"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(dept)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Department"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Hierarchy Path if Subdepartment */}
                    {isSubdept && (
                      <div className="text-[10px] text-slate-500 font-semibold mb-1 flex items-center gap-1">
                        <span>{dept.parentDepartmentId?.name}</span>
                        <ChevronRight className="w-3 h-3 text-slate-300" />
                        <span className="text-slate-800">{dept.name}</span>
                      </div>
                    )}

                    <h3 className="text-base font-bold text-slate-900">{dept.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {dept.description || 'No description configured for this department.'}
                    </p>

                    {/* Head of Department Card */}
                    <div className="mt-4 p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {hod ? `${hod.firstName[0]}${hod.lastName[0]}` : '—'}
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            Head of Department
                          </div>
                          <div className="text-xs font-bold text-slate-800">
                            {hod ? `${hod.firstName} ${hod.lastName}` : 'Unassigned (No HOD)'}
                          </div>
                        </div>
                      </div>

                      {hod && (
                        <span className="text-[10px] font-mono text-slate-400 font-semibold">
                          {hod.employeeCode}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Footer Stats & Actions */}
                  <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs">
                      <button
                        onClick={() => handleOpenViewMembers(dept)}
                        className="flex items-center gap-1 font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>{dept.headcount || 0} Members</span>
                      </button>

                      <span className="text-slate-300">•</span>

                      <span className="text-slate-500 font-medium">
                        {dept.teamCount || 0} Teams
                      </span>
                    </div>

                    <button
                      onClick={() => handleOpenViewMembers(dept)}
                      className="text-xs font-bold text-slate-700 hover:text-blue-600 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>View</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CREATE DEPARTMENT MODAL */}
        {createModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-scaleIn">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                    <Building2 className="w-4 h-4" />
                  </span>
                  <h2 className="text-base font-bold text-slate-900">Create New Department</h2>
                </div>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Department Name *</label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Core Engineering"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Code *</label>
                    <input
                      required
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="e.g. CORE-ENG"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Parent Department</label>
                    <select
                      value={formData.parentDepartmentId}
                      onChange={(e) => setFormData({ ...formData, parentDepartmentId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">None (Top-Level Primary Department)</option>
                      {departments.map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Cost Center Code</label>
                    <input
                      type="text"
                      value={formData.costCenterCode}
                      onChange={(e) => setFormData({ ...formData, costCenterCode: e.target.value })}
                      placeholder="e.g. CC-ENG-02"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-mono uppercase"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">Head of Department (HOD)</label>
                    <span className="text-[10px] text-blue-600 font-semibold">Manager roles only</span>
                  </div>
                  <select
                    value={formData.headEmployeeId}
                    onChange={(e) => setFormData({ ...formData, headEmployeeId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">
                      {eligibleManagers.length === 0 ? 'No employees with Manager role yet' : 'None / Unassigned'}
                    </option>
                    {eligibleManagers.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeCode}) — {emp.roleId?.name || 'Manager'}
                      </option>
                    ))}
                  </select>
                  {eligibleManagers.length === 0 && (
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      💡 To assign a Head of Department, first onboard or promote an employee with a Manager role.
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Description / Function</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of department scope and operations..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
                  >
                    {actionLoading ? 'Creating...' : 'Create Department'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT DEPARTMENT MODAL */}
        {editModalOpen && selectedDept && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-scaleIn">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                    <Edit2 className="w-4 h-4" />
                  </span>
                  <h2 className="text-base font-bold text-slate-900">Edit Department: {selectedDept.name}</h2>
                </div>
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Department Name *</label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Code *</label>
                    <input
                      required
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Parent Department</label>
                    <select
                      value={formData.parentDepartmentId}
                      onChange={(e) => setFormData({ ...formData, parentDepartmentId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">None (Top-Level Primary Department)</option>
                      {departments
                        .filter((d) => d._id !== selectedDept._id)
                        .map((d) => (
                          <option key={d._id} value={d._id}>
                            {d.name} ({d.code})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Cost Center Code</label>
                    <input
                      type="text"
                      value={formData.costCenterCode}
                      onChange={(e) => setFormData({ ...formData, costCenterCode: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-mono uppercase"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">Head of Department (HOD)</label>
                    <span className="text-[10px] text-blue-600 font-semibold">Manager roles only</span>
                  </div>
                  <select
                    value={formData.headEmployeeId}
                    onChange={(e) => setFormData({ ...formData, headEmployeeId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">None / Unassigned</option>
                    {eligibleManagers.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeCode}) — {emp.roleId?.name || 'Manager'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Description / Function</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
                  >
                    {actionLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* VIEW MEMBERS DRAWER/MODAL */}
        {viewMembersModalOpen && selectedDept && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl animate-scaleIn max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md">
                      {selectedDept.code}
                    </span>
                    <h2 className="text-base font-bold text-slate-900">{selectedDept.name} Members</h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Assigned staff and functional teams operating within this business unit.
                  </p>
                </div>
                <button
                  onClick={() => setViewMembersModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              {loadingMembers ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Loading department roster...
                </div>
              ) : (
                <div className="overflow-y-auto flex-1 pr-1 space-y-3">
                  {deptEmployees.length === 0 ? (
                    <div className="py-12 text-center text-slate-400">
                      <Users className="w-8 h-8 mx-auto text-slate-300 mb-1.5" />
                      <p className="text-xs font-semibold">No employees currently assigned to this department.</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Assign employees to this department when onboarding or via the Employee Master.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden">
                      {deptEmployees.map((emp) => (
                        <div key={emp._id} className="p-3 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                              {emp.firstName[0]}{emp.lastName[0]}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900">
                                {emp.firstName} {emp.lastName}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {emp.email} • <span className="font-mono text-slate-600 font-semibold">{emp.employeeCode}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md">
                              {emp.roleId?.name || 'Staff'}
                            </span>
                            {emp.designationId?.title && (
                              <span className="text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md">
                                {emp.designationId.title}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between shrink-0">
                <span className="text-xs font-semibold text-slate-500">
                  Total Roster: {deptEmployees.length} Employee{deptEmployees.length === 1 ? '' : 's'}
                </span>
                <button
                  onClick={() => setViewMembersModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
