'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import {
  Users,
  Search,
  Plus,
  Filter,
  Building,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  X,
  CreditCard,
  FileCheck,
  Shield,
  UserCheck,
  GitFork,
  Briefcase,
  ExternalLink,
  Key,
  Copy,
  Check,
} from 'lucide-react';

export default function EmployeesPage() {
  const { user, organization, hasPermission } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [credentialsModal, setCredentialsModal] = useState<{ open: boolean; data: any }>({ open: false, data: null });
  const [copied, setCopied] = useState(false);

  const [filterLeadershipOnly, setFilterLeadershipOnly] = useState(true);

  // Granular RBAC checks
  const canCreate = hasPermission('employees', 'create');
  const canEdit = hasPermission('employees', 'edit');
  const canManageRoles = hasPermission('roles', 'view') || hasPermission('roles', 'create');

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: 'MALE',
    joiningDate: '',
    employmentType: 'FULL_TIME',
    ctcAnnual: 720000,
    roleId: '',
    departmentId: '',
    reportingManagerId: '',
    technicalLeadId: '',
    costCenter: '',
    panNumber: '',
    aadhaarNumber: '',
    uanNumber: '',
    createPortalAccount: true,
  });

  const [editFormData, setEditFormData] = useState({
    roleId: '',
    departmentId: '',
    reportingManagerId: '',
    technicalLeadId: '',
    costCenter: '',
    status: 'ACTIVE',
  });

  // Helper to resolve an employee's role object (whether populated or ID)
  const getEmployeeRole = (emp: any) => {
    if (!emp) return null;
    if (emp.roleId && typeof emp.roleId === 'object' && emp.roleId.name) {
      return emp.roleId;
    }
    const rId = emp.roleId?._id || emp.roleId;
    if (!rId) return null;
    return roles.find((r: any) => r._id === rId) || null;
  };

  // Strictly filter only employees who hold Manager roles (e.g. role name/slug contains 'manager')
  const isManagerRole = (emp: any) => {
    if (!emp) return false;
    const roleObj = getEmployeeRole(emp);
    const roleName = (roleObj?.name || '').toLowerCase();
    const roleSlug = (roleObj?.slug || '').toLowerCase();
    const desig = (emp.designationId?.title || '').toLowerCase();
    return (
      roleName.includes('manager') ||
      roleSlug.includes('manager') ||
      desig.includes('manager')
    );
  };

  // Strictly filter only employees who hold Team Lead (TL) roles (e.g. role name/slug contains 'lead' or 'tl')
  const isTLRole = (emp: any) => {
    if (!emp) return false;
    const roleObj = getEmployeeRole(emp);
    const roleName = (roleObj?.name || '').toLowerCase();
    const roleSlug = (roleObj?.slug || '').toLowerCase();
    const desig = (emp.designationId?.title || '').toLowerCase();
    return (
      roleName.includes('lead') ||
      roleSlug.includes('lead') ||
      roleName.includes('tl') ||
      roleSlug === 'tl' ||
      roleSlug.includes('team-lead') ||
      roleSlug.includes('tech-lead') ||
      roleName.includes('team lead') ||
      roleName.includes('tech lead') ||
      desig.includes('lead') ||
      desig.includes('tl')
    );
  };

  // Strict list: Only employees with Manager role
  const eligibleManagers = employees.filter(isManagerRole);

  // Strict list: Only employees with Team Lead (TL) role
  const eligibleTechLeads = employees.filter(isTLRole);

  useEffect(() => {
    setFormData((f) => ({ ...f, joiningDate: new Date().toISOString().split('T')[0] }));
  }, []);

  const fetchEmployees = async () => {
    try {
      let url = '/api/v1/employees?';
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (selectedStatus) url += `status=${encodeURIComponent(selectedStatus)}&`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setEmployees(json.employees || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchRolesAndDepartments = async () => {
    try {
      const [rolesRes, settingsRes] = await Promise.all([
        fetch('/api/v1/roles'),
        fetch('/api/v1/settings'),
      ]);
      const rolesData = await rolesRes.json();
      const settingsData = await settingsRes.json();

      if (rolesData.success) {
        setRoles(rolesData.roles || []);
        // Set default role in formData if available
        if (rolesData.roles?.length > 0) {
          const empRole = rolesData.roles.find((r: any) => r.slug === 'software-engineer' || r.slug.includes('engineer')) || rolesData.roles[0];
          setFormData((f) => ({ ...f, roleId: f.roleId || empRole._id }));
        }
      }
      if (settingsData.success && settingsData.departments) {
        setDepartments(settingsData.departments || []);
        if (settingsData.departments.length > 0) {
          setFormData((f) => ({ ...f, departmentId: f.departmentId || settingsData.departments[0]._id }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchRolesAndDepartments();
  }, [search, selectedStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/v1/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        setModalOpen(false);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          gender: 'MALE',
          joiningDate: new Date().toISOString().split('T')[0],
          employmentType: 'FULL_TIME',
          ctcAnnual: 720000,
          roleId: roles[0]?._id || '',
          departmentId: '',
          reportingManagerId: '',
          technicalLeadId: '',
          costCenter: '',
          panNumber: '',
          aadhaarNumber: '',
          uanNumber: '',
          createPortalAccount: true,
        });
        fetchEmployees();
      } else {
        setError(data.error || 'Failed to add employee');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEdit = (emp: any) => {
    setSelectedEmployee(emp);
    setEditFormData({
      roleId: emp.roleId?._id || emp.roleId || '',
      departmentId: emp.departmentId?._id || emp.departmentId || '',
      reportingManagerId: emp.reportingManagerId?._id || emp.reportingManagerId || '',
      technicalLeadId: emp.technicalLeadId?._id || emp.technicalLeadId || '',
      costCenter: emp.costCenter || '',
      status: emp.status || 'ACTIVE',
    });
    setEditModalOpen(true);
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    setSaving(true);

    try {
      const payload = {
        ...editFormData,
        roleId: editFormData.roleId || null,
        departmentId: editFormData.departmentId || null,
        reportingManagerId: editFormData.reportingManagerId || null,
        technicalLeadId: editFormData.technicalLeadId || null,
      };

      const res = await fetch(`/api/v1/employees/${selectedEmployee._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setEditModalOpen(false);
        fetchEmployees();
      } else {
        alert(data.error || 'Failed to update employee');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleProvisionPortal = async (emp: any) => {
    try {
      const res = await fetch(`/api/v1/employees/${emp._id}/portal-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        setCredentialsModal({ open: true, data: data.credentials });
      } else {
        alert(data.error || 'Failed to provision portal login');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <DashboardLayout>
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] text-orange-600 font-extrabold uppercase tracking-wider bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md">
              MNC Workforce Master
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-500">{employees.length} Records in Database</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 flex items-center gap-2">
            Employee Directory & Role Mapping
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Manage employee master records with assigned MNC security roles, HR reporting managers, and technical leads.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canManageRoles && (
            <a
              href="/roles"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-indigo-600" />
              <span>Manage Roles</span>
            </a>
          )}

          {canCreate && (
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-transform hover:scale-[1.02] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Onboard New Employee</span>
            </button>
          )}
        </div>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by legal name, employee code, or work email..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:bg-white focus:border-orange-500"
          >
            <option value="">All Employment Status</option>
            <option value="ACTIVE">Active</option>
            <option value="PROBATION">Probation</option>
            <option value="NOTICE_PERIOD">Notice Period</option>
            <option value="RESIGNED">Resigned</option>
          </select>
        </div>
      </div>

      {/* REAL EMPLOYEES TABLE */}
      <div className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Reporting Hierarchy</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Gross Salary</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {employees.map((emp) => (
                <tr key={emp._id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-xs font-bold text-white uppercase shadow-xs">
                        {emp.firstName?.[0]}{emp.lastName?.[0]}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{emp.firstName} {emp.lastName}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{emp.email}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-medium text-orange-600">
                    {emp.employeeCode}
                  </td>
                  <td className="py-3.5 px-4">
                    {emp.roleId ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                        <Shield className="w-3 h-3 text-indigo-600" />
                        <span>{emp.roleId.name || 'Assigned Role'}</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">No Role Assigned</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="space-y-1">
                      <div className="text-[11px]">
                        <span className="text-slate-400 font-semibold">HR Mgr: </span>
                        <span className="font-bold text-slate-800">
                          {emp.reportingManagerId ? `${emp.reportingManagerId.firstName} ${emp.reportingManagerId.lastName}` : 'Unassigned'}
                        </span>
                      </div>
                      <div className="text-[11px]">
                        <span className="text-slate-400 font-semibold">Tech Lead: </span>
                        <span className="font-bold text-slate-800">
                          {emp.technicalLeadId ? `${emp.technicalLeadId.firstName} ${emp.technicalLeadId.lastName}` : 'Unassigned'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800">{emp.departmentId?.name || 'General Operations'}</div>
                    <div className="text-[10px] text-slate-400">{emp.designationId?.title || 'Staff Specialist'}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">INR {(emp.grossMonthly || 0).toLocaleString('en-IN')}/mo</div>
                    <div className="text-[10px] text-slate-400 font-medium">CTC: INR {(emp.ctcAnnual || 0).toLocaleString('en-IN')}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        emp.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : emp.status === 'PROBATION'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {emp.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {canEdit ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleProvisionPortal(emp)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] border border-emerald-200 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Create or Reset Employee Portal Login"
                        >
                          <Key className="w-3 h-3 text-emerald-600" />
                          <span>Portal Login</span>
                        </button>
                        <button
                          onClick={() => handleOpenEdit(emp)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-colors cursor-pointer"
                        >
                          Configure
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium italic">Read Only</span>
                    )}
                  </td>
                </tr>
              ))}

              {employees.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No employees matching the search filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ONBOARD EMPLOYEE MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 relative my-8 text-slate-900">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-500" />
                <span>Onboard New Employee & Assign Role</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Assign an enterprise role, HR manager, technical lead, and statutory details.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* ROLE & REPORTING MAPPING FIRST */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-indigo-600" />
                    <span>Role & Reporting Assignment</span>
                  </span>
                  <a
                    href="/roles"
                    target="_blank"
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <span>+ Create Role</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      Organization Role *
                    </label>
                    <select
                      required
                      value={formData.roleId}
                      onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                      className="w-full bg-white border border-indigo-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Select Role</option>
                      {roles.map((r) => (
                        <option key={r._id} value={r._id}>
                          {r.name} {r.isSystemAdmin ? '(Admin)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-800">
                        HR Reporting Manager
                      </label>
                      <span className="text-[9px] text-indigo-600 font-semibold">Manager roles only</span>
                    </div>
                    <select
                      value={formData.reportingManagerId}
                      onChange={(e) => setFormData({ ...formData, reportingManagerId: e.target.value })}
                      className="w-full bg-white border border-indigo-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">
                        {eligibleManagers.length === 0
                          ? 'None / Top Level (No employees with Manager role yet)'
                          : 'None / Top Level (Executive / Board)'}
                      </option>
                      {eligibleManagers.map((emp) => {
                        const r = getEmployeeRole(emp);
                        return (
                          <option key={emp._id} value={emp._id}>
                            {emp.firstName} {emp.lastName} ({emp.employeeCode}) — {r?.name || 'Manager'}
                          </option>
                        );
                      })}
                    </select>
                    {eligibleManagers.length === 0 && (
                      <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                        💡 No users with a Manager role exist yet. To assign a manager, first onboard an employee with a Manager role.
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-800">
                        Technical Lead (TL)
                      </label>
                      <span className="text-[9px] text-indigo-600 font-semibold">TL roles only</span>
                    </div>
                    <select
                      value={formData.technicalLeadId}
                      onChange={(e) => setFormData({ ...formData, technicalLeadId: e.target.value })}
                      className="w-full bg-white border border-indigo-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">
                        {eligibleTechLeads.length === 0
                          ? 'None / Not Applicable (No employees with TL role yet)'
                          : 'None / Not Applicable'}
                      </option>
                      {eligibleTechLeads.map((emp) => {
                        const r = getEmployeeRole(emp);
                        return (
                          <option key={emp._id} value={emp._id}>
                            {emp.firstName} {emp.lastName} ({emp.employeeCode}) — {r?.name || 'Technical Lead'}
                          </option>
                        );
                      })}
                    </select>
                    {eligibleTechLeads.length === 0 && (
                      <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                        💡 No users with a Lead / TL role exist yet.
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">Department</label>
                    <select
                      value={formData.departmentId}
                      onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                      className="w-full bg-white border border-indigo-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Select Department</option>
                      {departments.map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">Cost Center Code</label>
                    <input
                      type="text"
                      value={formData.costCenter}
                      onChange={(e) => setFormData({ ...formData, costCenter: e.target.value.toUpperCase() })}
                      className="w-full bg-white border border-indigo-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-mono font-medium focus:outline-none focus:border-indigo-500 uppercase"
                      placeholder="e.g. CC-ENG-01"
                    />
                  </div>
                </div>
              </div>

              {/* PERSONAL DETAILS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                    placeholder="e.g. Sandeep"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                    placeholder="e.g. Reddy"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Corporate Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                    placeholder="employee@company.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Joining</label>
                  <input
                    type="date"
                    required
                    value={formData.joiningDate}
                    onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Annual CTC (INR)</label>
                  <input
                    type="number"
                    required
                    value={formData.ctcAnnual}
                    onChange={(e) => setFormData({ ...formData, ctcAnnual: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                    placeholder="900000"
                  />
                </div>
              </div>

              {/* Statutory details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">PAN Number</label>
                  <input
                    type="text"
                    value={formData.panNumber}
                    onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 uppercase font-mono font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                    placeholder="ABCDE1234F"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">UAN (EPF)</label>
                  <input
                    type="text"
                    value={formData.uanNumber}
                    onChange={(e) => setFormData({ ...formData, uanNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                    placeholder="100902837482"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Aadhaar (Last 4)</label>
                  <input
                    type="text"
                    value={formData.aadhaarNumber}
                    onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                    placeholder="XXXX-XXXX-1234"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="portalAcc"
                  checked={formData.createPortalAccount}
                  onChange={(e) => setFormData({ ...formData, createPortalAccount: e.target.checked })}
                  className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                />
                <label htmlFor="portalAcc" className="text-xs text-slate-600 font-medium">
                  Provision User Portal account with the selected Role permissions (Default password: <code>Welcome@123</code>)
                </label>
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
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xs font-bold shadow-md shadow-orange-500/20 disabled:opacity-50 cursor-pointer transition-transform hover:scale-[1.02]"
                >
                  {saving ? 'Creating Record...' : 'Complete Onboarding'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ROLE & REPORTING MODAL */}
      {editModalOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 relative my-8 text-slate-900">
            <button
              onClick={() => setEditModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-950 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                <span>Configure Role & Hierarchy: {selectedEmployee.firstName} {selectedEmployee.lastName}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Update operational role, HR reporting manager, and technical lead.
              </p>
            </div>

            <form onSubmit={handleUpdateEmployee} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Role</label>
                <select
                  value={editFormData.roleId}
                  onChange={(e) => setEditFormData({ ...editFormData, roleId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-indigo-500"
                >
                  <option value="">No Role Assigned</option>
                  {roles.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name} {r.isSystemAdmin ? '(Admin)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">HR Reporting Manager</label>
                  <span className="text-[10px] text-indigo-600 font-semibold">Manager roles only</span>
                </div>
                <select
                  value={editFormData.reportingManagerId}
                  onChange={(e) => setEditFormData({ ...editFormData, reportingManagerId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
                >
                  <option value="">
                    {eligibleManagers.filter((e) => e._id !== selectedEmployee._id).length === 0
                      ? 'None / Top Level (No employees with Manager role yet)'
                      : 'None / Top Level'}
                  </option>
                  {eligibleManagers
                    .filter((e) => e._id !== selectedEmployee._id)
                    .map((emp) => {
                      const r = getEmployeeRole(emp);
                      return (
                        <option key={emp._id} value={emp._id}>
                          {emp.firstName} {emp.lastName} ({emp.employeeCode}) — {r?.name || 'Manager'}
                        </option>
                      );
                    })}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Technical Lead (TL)</label>
                  <span className="text-[10px] text-indigo-600 font-semibold">TL roles only</span>
                </div>
                <select
                  value={editFormData.technicalLeadId}
                  onChange={(e) => setEditFormData({ ...editFormData, technicalLeadId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
                >
                  <option value="">
                    {eligibleTechLeads.filter((e) => e._id !== selectedEmployee._id).length === 0
                      ? 'None / Independent (No employees with TL role yet)'
                      : 'None / Independent'}
                  </option>
                  {eligibleTechLeads
                    .filter((e) => e._id !== selectedEmployee._id)
                    .map((emp) => {
                      const r = getEmployeeRole(emp);
                      return (
                        <option key={emp._id} value={emp._id}>
                          {emp.firstName} {emp.lastName} ({emp.employeeCode}) — {r?.name || 'Technical Lead'}
                        </option>
                      );
                    })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                <select
                  value={editFormData.departmentId}
                  onChange={(e) => setEditFormData({ ...editFormData, departmentId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Unassigned</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Employment Status</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PROBATION">PROBATION</option>
                  <option value="NOTICE_PERIOD">NOTICE_PERIOD</option>
                  <option value="RESIGNED">RESIGNED</option>
                  <option value="TERMINATED">TERMINATED</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Updating...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* CREDENTIALS SUCCESS MODAL */}
      {credentialsModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setCredentialsModal({ open: false, data: null })}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-950">Employee Portal Credentials</h3>
                <p className="text-xs text-slate-500">Active and ready for employee sign-in</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Employee Name:</span>
                <span className="font-bold text-slate-900">{credentialsModal.data?.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Corporate Email:</span>
                <span className="font-mono font-bold text-slate-900">{credentialsModal.data?.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Employee ID:</span>
                <span className="font-mono font-bold text-slate-900">{credentialsModal.data?.employeeCode}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Password:</span>
                <span className="font-mono font-extrabold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                  {credentialsModal.data?.password}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Sign-In URL:</span>
                <span className="font-semibold text-blue-600">http://localhost:3000/login</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mt-3 font-medium">
              Employee can log in using either their <strong className="text-slate-600">Corporate Email</strong> or <strong className="text-slate-600">Employee ID</strong>.
            </p>

            <div className="mt-5 flex gap-2.5">
              <button
                onClick={() => {
                  const text = `OneWayHR Employee Portal Credentials:\nName: ${credentialsModal.data?.name}\nEmail: ${credentialsModal.data?.email}\nEmployee ID: ${credentialsModal.data?.employeeCode}\nPassword: ${credentialsModal.data?.password}\nLogin URL: http://localhost:3000/login`;
                  navigator.clipboard.writeText(text);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2500);
                }}
                className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Credentials'}</span>
              </button>
              <button
                onClick={() => setCredentialsModal({ open: false, data: null })}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
