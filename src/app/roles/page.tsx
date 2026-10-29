'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Plus,
  Users,
  Search,
  CheckCircle2,
  X,
  Edit2,
  Trash2,
  KeyRound,
  Lock,
  ArrowRight,
  Info,
  Sparkles,
} from 'lucide-react';

interface IRole {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isSystemAdmin: boolean;
  permissions: {
    module: string;
    actions: string[];
  }[];
  createdAt: string;
}

const ALL_MODULES = [
  { key: 'dashboard', label: 'Dashboard & Metrics' },
  { key: 'employees', label: 'Employee Master' },
  { key: 'departments', label: 'Departments & Cost Centers' },
  { key: 'teams', label: 'Teams & Squads' },
  { key: 'organization', label: 'Org Hierarchy & Reporting' },
  { key: 'resource-allocation', label: 'Resource Allocation' },
  { key: 'budgets', label: 'Budget Management' },
  { key: 'approvals', label: 'Approval Workflows' },
  { key: 'roles', label: 'Roles & Permissions' },
  { key: 'attendance', label: 'Attendance & Clock' },
  { key: 'leave', label: 'Leave Management' },
  { key: 'payroll', label: 'Payroll & Form 16' },
  { key: 'payslips', label: 'Payslips & Salary' },
  { key: 'timesheets', label: 'Timesheets' },
  { key: 'expenses', label: 'Expense Claims' },
  { key: 'recruitment', label: 'Recruitment & ATS' },
  { key: 'documents', label: 'Letters & Docs' },
  { key: 'performance', label: 'Performance & KPI' },
  { key: 'assets', label: 'Asset Management' },
  { key: 'helpdesk', label: 'HR Helpdesk' },
  { key: 'reports', label: 'Analytics & Reports' },
  { key: 'self-service', label: 'My Self-Service' },
  { key: 'settings', label: 'SaaS Settings' },
];

const PERMISSION_ACTIONS = ['view', 'create', 'edit', 'delete', 'approve', 'export'];

export default function RolesPage() {
  const { user, hasPermission } = useAuth();
  const canCreate = hasPermission('roles', 'create');
  const canEdit = hasPermission('roles', 'edit');
  const canDelete = hasPermission('roles', 'delete');
  const [roles, setRoles] = useState<IRole[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<IRole | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [roleName, setRoleName] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [isSystemAdmin, setIsSystemAdmin] = useState(false);
  const [permissionsMap, setPermissionsMap] = useState<Record<string, string[]>>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesRes, empRes] = await Promise.all([
        fetch('/api/v1/roles'),
        fetch('/api/v1/employees'),
      ]);
      const rolesData = await rolesRes.json();
      const empData = await empRes.json();

      if (rolesData.success) {
        setRoles(rolesData.roles || []);
      }
      if (empData.success) {
        setEmployees(empData.employees || []);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = (role?: IRole) => {
    setError('');
    if (role) {
      setEditingRole(role);
      setRoleName(role.name);
      setRoleDesc(role.description || '');
      setIsSystemAdmin(role.isSystemAdmin);

      const pMap: Record<string, string[]> = {};
      role.permissions?.forEach((p) => {
        pMap[p.module] = p.actions;
      });
      setPermissionsMap(pMap);
    } else {
      setEditingRole(null);
      setRoleName('');
      setRoleDesc('');
      setIsSystemAdmin(false);

      // Default baseline permissions
      const initialMap: Record<string, string[]> = {
        dashboard: ['view'],
        attendance: ['view', 'create'],
        leave: ['view', 'create'],
        timesheets: ['view', 'create'],
        'self-service': ['view', 'create', 'edit'],
      };
      setPermissionsMap(initialMap);
    }
    setModalOpen(true);
  };

  const toggleAction = (moduleKey: string, action: string) => {
    setPermissionsMap((prev) => {
      const current = prev[moduleKey] || [];
      const updated = current.includes(action)
        ? current.filter((a) => a !== action)
        : [...current, action];

      return {
        ...prev,
        [moduleKey]: updated,
      };
    });
  };

  const toggleAllForModule = (moduleKey: string) => {
    setPermissionsMap((prev) => {
      const current = prev[moduleKey] || [];
      const allSelected = PERMISSION_ACTIONS.every((a) => current.includes(a));
      return {
        ...prev,
        [moduleKey]: allSelected ? [] : [...PERMISSION_ACTIONS],
      };
    });
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) {
      setError('Role name is required');
      return;
    }

    setSaving(true);
    setError('');

    const permissionsPayload = Object.entries(permissionsMap)
      .filter(([_, actions]) => actions && actions.length > 0)
      .map(([module, actions]) => ({ module, actions }));

    try {
      const url = editingRole ? `/api/v1/roles/${editingRole._id}` : '/api/v1/roles';
      const method = editingRole ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: roleName.trim(),
          description: roleDesc.trim(),
          isSystemAdmin,
          permissions: permissionsPayload,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message || 'Role successfully saved!');
        setTimeout(() => setSuccessMsg(''), 4000);
        setModalOpen(false);
        fetchData();
      } else {
        setError(data.error || 'Failed to save role');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (role: IRole) => {
    if (!confirm(`Are you sure you want to delete role "${role.name}"?`)) return;

    try {
      const res = await fetch(`/api/v1/roles/${role._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Role "${role.name}" deleted.`);
        setTimeout(() => setSuccessMsg(''), 4000);
        fetchData();
      } else {
        alert(data.error || 'Failed to delete role');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const filteredRoles = roles.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.description && r.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] text-indigo-700 font-extrabold uppercase tracking-wider bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-md">
              Enterprise Access Governance
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-500">{roles.length} Defined Roles</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 flex items-center gap-2">
            Role Definitions & Security Matrix
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium max-w-2xl">
            Configure MNC roles (System Admin, HR Manager, Engineering Manager, Team Lead, Resource Manager, Finance Controller) with granular module permissions before assigning them to employees.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => openModal()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-transform hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Role</span>
          </button>
        )}
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* SEARCH BAR */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search roles by title, key, or operational scope..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 font-medium"
          />
        </div>
      </div>

      {/* ROLES GRID */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading roles & permissions matrix...
        </div>
      ) : filteredRoles.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Roles Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {search
              ? 'No roles match your search keyword.'
              : 'Your organization has not defined any custom roles yet. Create roles with granular module-level permissions for your personnel.'}
          </p>
          {canCreate && !search && (
            <button
              onClick={() => openModal()}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 inline-flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Role</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRoles.map((role) => {
            const assignedCount = employees.filter((e) => e.roleId?._id === role._id || e.roleId === role._id).length;
            const isSystemAdminRole = role.isSystemAdmin || role.slug === 'system-admin';

            return (
              <div
                key={role._id}
                className="rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          isSystemAdminRole
                            ? 'bg-rose-50 text-rose-600 border border-rose-200'
                            : role.slug.includes('manager')
                            ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                            : role.slug.includes('lead')
                            ? 'bg-amber-50 text-amber-600 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        }`}
                      >
                        {isSystemAdminRole ? (
                          <ShieldAlert className="w-5 h-5" />
                        ) : (
                          <ShieldCheck className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-slate-900 leading-tight">{role.name}</h2>
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                          slug: {role.slug}
                        </span>
                      </div>
                    </div>

                    {isSystemAdminRole ? (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                        Full Admin
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {role.permissions?.length || 0} Modules
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 min-h-[32px] mb-4">
                    {role.description || 'Enterprise role with customized security policies.'}
                  </p>

                  {/* Permissions Snippet */}
                  <div className="mb-4 pt-3 border-t border-slate-100">
                    <div className="text-[11px] font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span>Module Permissions</span>
                      {isSystemAdminRole ? (
                        <span className="text-[10px] text-rose-600 font-semibold">Unrestricted root access</span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {role.permissions?.reduce((acc, p) => acc + (p.actions?.length || 0), 0) || 0} Actions Granted
                        </span>
                      )}
                    </div>
                    {!isSystemAdminRole ? (
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                        {role.permissions && role.permissions.length > 0 ? (
                          role.permissions.map((p) => (
                            <span
                              key={p.module}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-700 font-medium"
                            >
                              <strong className="text-indigo-600 capitalize">{p.module}</strong> ({p.actions?.join(', ')})
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No specific permissions configured</span>
                        )}
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                        <span>Can view, modify, approve & export all 21 SaaS operational modules.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer with assigned count and actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      <strong className="text-slate-900 font-bold">{assignedCount}</strong> Employees Assigned
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {canEdit && (
                      <button
                        onClick={() => openModal(role)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
                        title="Edit Role & Permissions"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {!isSystemAdminRole && canDelete && (
                      <button
                        onClick={() => handleDeleteRole(role)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Delete Role"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT ROLE MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 relative my-8 text-slate-900 max-h-[90vh] flex flex-col">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4 pr-8">
              <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                <span>{editingRole ? `Edit Role: ${editingRole.name}` : 'Create New MNC Organization Role'}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Configure role title, system administrative privileges, and granular matrix permissions for each module.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveRole} className="flex-1 overflow-y-auto space-y-5 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Role Name *</label>
                  <input
                    type="text"
                    required
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-indigo-500"
                    placeholder="e.g. Technical Lead (TL), Engineering Manager, QA Lead"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSystemAdmin}
                      onChange={(e) => setIsSystemAdmin(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-800">Super Administrator Privileges</div>
                      <div className="text-[11px] text-slate-400">Bypasses all module restrictions</div>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description & Scope</label>
                <textarea
                  rows={2}
                  value={roleDesc}
                  onChange={(e) => setRoleDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-indigo-500"
                  placeholder="Summarize the operational responsibilities and governance boundaries for this role..."
                />
              </div>

              {/* PERMISSION MATRIX */}
              {!isSystemAdmin && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Module Access Permissions Matrix
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Select allowed actions for each module
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                          <th className="py-2.5 px-4 w-1/3">Module</th>
                          {PERMISSION_ACTIONS.map((action) => (
                            <th key={action} className="py-2.5 px-3 text-center capitalize">
                              {action}
                            </th>
                          ))}
                          <th className="py-2.5 px-3 text-center">Toggle</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {ALL_MODULES.map((mod) => {
                          const currentActions = permissionsMap[mod.key] || [];
                          const allSelected = PERMISSION_ACTIONS.every((a) => currentActions.includes(a));
                          const isSettingsKey = mod.key === 'settings';

                          return (
                            <tr key={mod.key} className={isSettingsKey ? 'bg-orange-50/70 hover:bg-orange-100/50 transition-colors' : 'hover:bg-slate-50/70 transition-colors'}>
                              <td className="py-2.5 px-4 font-semibold text-slate-900">
                                <div className="flex items-center gap-1.5">
                                  <span>{mod.label}</span>
                                  {isSettingsKey && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-200 text-orange-950 font-extrabold uppercase tracking-wide">
                                      Customize SaaS
                                    </span>
                                  )}
                                </div>
                                <div className={`text-[10px] ${isSettingsKey ? 'text-orange-700 font-medium' : 'font-mono text-slate-400'}`}>
                                  {isSettingsKey ? 'Grants this role permission to customize SaaS features' : mod.key}
                                </div>
                              </td>

                              {PERMISSION_ACTIONS.map((action) => {
                                const checked = currentActions.includes(action);
                                return (
                                  <td key={action} className="py-2.5 px-3 text-center">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => toggleAction(mod.key, action)}
                                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                                    />
                                  </td>
                                );
                              })}

                              <td className="py-2.5 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => toggleAllForModule(mod.key)}
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                                    allSelected
                                      ? 'bg-indigo-100 text-indigo-700'
                                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  }`}
                                >
                                  {allSelected ? 'Clear' : 'All'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

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
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer transition-transform hover:scale-[1.02]"
                >
                  {saving ? 'Saving Role...' : editingRole ? 'Update Role' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
