'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth, OrgFeature } from '@/context/AuthContext';
import { DEFAULT_SAAS_FEATURES } from '@/config/features';
import {
  Settings,
  Building,
  Shield,
  Sliders,
  CheckCircle2,
  Plus,
  Trash2,
  Edit2,
  Save,
  Check,
  X,
  RefreshCw,
  Eye,
  FileCheck,
  Layers,
  MapPin,
  Lock,
  Users,
  Search,
  ShieldAlert,
} from 'lucide-react';

interface CustomRoleItem {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isSystemAdmin: boolean;
  permissions: {
    module: string;
    actions: string[];
  }[];
}

const ALL_MODULE_KEYS = [
  { key: 'dashboard', label: 'Dashboard & Metrics' },
  { key: 'employees', label: 'Employee Master' },
  { key: 'attendance', label: 'Attendance & Clock' },
  { key: 'leave', label: 'Leave Management' },
  { key: 'payroll', label: 'Payroll & Form 16' },
  { key: 'payslips', label: 'Payslips & Salary' },
  { key: 'recruitment', label: 'Recruitment & ATS' },
  { key: 'documents', label: 'Letters & Docs' },
  { key: 'timesheets', label: 'Timesheets' },
  { key: 'expenses', label: 'Expense Claims' },
  { key: 'performance', label: 'Performance & KPI' },
  { key: 'assets', label: 'Asset Management' },
  { key: 'helpdesk', label: 'HR Helpdesk' },
  { key: 'reports', label: 'Analytics & Reports' },
  { key: 'self-service', label: 'My Self-Service' },
  { key: 'settings', label: 'Settings & Roles' },
];

const PERMISSION_ACTIONS = ['view', 'create', 'edit', 'delete', 'approve'];

export default function SettingsPage() {
  const { user, roleData, organization, refreshSession, hasPermission } = useAuth();

  const isPlatformOwner =
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'PLATFORM_OWNER' ||
    user?.email === 'superadmin@onewayhr.in' ||
    user?.email === 'admin@hrms-saas.com' ||
    user?.email === 'owner@onewayhr.com';

  const roleUpper = (user?.role || '').toUpperCase();
  const isOrgAdmin =
    isPlatformOwner ||
    roleUpper === 'ORG_ADMIN' ||
    roleUpper === 'ADMIN' ||
    roleUpper === 'ORGANIZATION OWNER' ||
    roleUpper === 'ORGANIZATION ADMIN' ||
    roleUpper === 'OWNER' ||
    Boolean(roleData?.isSystemAdmin) ||
    roleData?.slug === 'system-admin';

  // Can configure SaaS:
  // 1. Platform Owner (SaaS Owner)
  // 2. Organization Admin
  // 3. Specific User granted canCustomizeSaas by Org Admin
  // 4. Role granted settings permission by Org Admin
  const canConfigSaas =
    isPlatformOwner ||
    isOrgAdmin ||
    Boolean(user?.canCustomizeSaas) ||
    hasPermission('settings', 'view');

  const canCreate = hasPermission('settings', 'create') || hasPermission('roles', 'create');
  const canEdit = hasPermission('settings', 'edit') || hasPermission('roles', 'edit');
  const [activeTab, setActiveTab] = useState<'roles' | 'features' | 'users' | 'profile' | 'structure'>('features');

  // Specific User Privileges state (Org Admin delegation)
  const [tenantUsers, setTenantUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');

  // Roles state
  const [roles, setRoles] = useState<CustomRoleItem[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRoleItem | null>(null);
  const [roleFormName, setRoleFormName] = useState('');
  const [roleFormDesc, setRoleFormDesc] = useState('');
  const [roleFormIsAdmin, setRoleFormIsAdmin] = useState(false);
  const [roleFormPermissions, setRoleFormPermissions] = useState<Record<string, string[]>>({});
  const [roleSaving, setRoleSaving] = useState(false);

  // Features state
  const [features, setFeatures] = useState<OrgFeature[]>([]);
  const [featuresLoading, setFeaturesLoading] = useState(true);
  const [featuresSaving, setFeaturesSaving] = useState(false);

  // Profile form state
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    contactEmail: '',
    contactPhone: '',
    city: '',
    state: '',
    pincode: '',
    panNumber: '',
    tanNumber: '',
    gstNumber: '',
    epfNumber: '',
    esiNumber: '',
  });

  // Structure state
  const [branches, setBranches] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [structModalOpen, setStructModalOpen] = useState(false);
  const [structType, setStructType] = useState<'BRANCH' | 'DEPARTMENT' | 'DESIGNATION'>('BRANCH');
  const [structForm, setStructForm] = useState({ name: '', code: '', city: 'Bengaluru' });

  // Notifications
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg(null), 5000);
  };

  // 1. Fetch Roles
  const fetchRoles = async () => {
    setRolesLoading(true);
    try {
      const res = await fetch('/api/v1/roles');
      const data = await res.json();
      if (data.success) {
        setRoles(data.roles || []);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setRolesLoading(false);
    }
  };

  // 2. Fetch Features
  const fetchFeatures = async () => {
    setFeaturesLoading(true);
    try {
      const res = await fetch('/api/v1/organization/features');
      const data = await res.json();
      if (data.success && data.features) {
        setFeatures(data.features);
      } else {
        setFeatures(DEFAULT_SAAS_FEATURES);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setFeaturesLoading(false);
    }
  };

  // 3. Fetch Profile & Structures
  const fetchProfileAndStructures = async () => {
    setProfileLoading(true);
    try {
      const res = await fetch('/api/v1/settings');
      const json = await res.json();
      if (json.success) {
        const org = json.organization;
        if (org) {
          setProfileForm({
            name: org.name || '',
            contactEmail: org.contactEmail || '',
            contactPhone: org.contactPhone || '',
            city: org.address?.city || '',
            state: org.address?.state || '',
            pincode: org.address?.pincode || '',
            panNumber: org.statutoryConfig?.panNumber || '',
            tanNumber: org.statutoryConfig?.tanNumber || '',
            gstNumber: org.statutoryConfig?.gstNumber || '',
            epfNumber: org.statutoryConfig?.epfNumber || '',
            esiNumber: org.statutoryConfig?.esiNumber || '',
          });
        }
        setBranches(json.branches || []);
        setDepartments(json.departments || []);
        setDesignations(json.designations || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProfileLoading(false);
    }
  };

  // 4. Fetch Tenant Users for specific delegation
  const fetchTenantUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await fetch('/api/v1/settings/users');
      const data = await res.json();
      if (data.success) {
        setTenantUsers(data.users || []);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (canConfigSaas) {
      fetchRoles();
      fetchFeatures();
      fetchProfileAndStructures();
      fetchTenantUsers();
    }
  }, [canConfigSaas]);

  // Handler for Organization Admin to toggle specific user SaaS Customization access
  const handleToggleUserCustomSaas = async (targetUser: any) => {
    setUpdatingUserId(targetUser._id);
    try {
      const nextVal = !targetUser.canCustomizeSaas;
      const res = await fetch('/api/v1/settings/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: targetUser._id,
          canCustomizeSaas: nextVal,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showMsg(
          nextVal
            ? `Granted SaaS Customization access to ${targetUser.name}`
            : `Revoked SaaS Customization access from ${targetUser.name}`
        );
        setTenantUsers((prev) =>
          prev.map((u) => (u._id === targetUser._id ? { ...u, canCustomizeSaas: nextVal } : u))
        );
      } else {
        showMsg(data.error || 'Failed to update user privilege', 'error');
      }
    } catch (e: any) {
      showMsg(e.message || 'Error updating user privilege', 'error');
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Handler for Organization Admin to reassign roles on the fly
  const handleAssignUserRole = async (targetUserId: string, newRoleId: string) => {
    setUpdatingUserId(targetUserId);
    try {
      const res = await fetch('/api/v1/settings/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: targetUserId,
          roleId: newRoleId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showMsg(`User role successfully reassigned!`);
        await fetchTenantUsers();
        await refreshSession();
      } else {
        showMsg(data.error || 'Failed to assign role', 'error');
      }
    } catch (e: any) {
      showMsg(e.message || 'Error assigning role', 'error');
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Save Role Handler
  const handleOpenRoleModal = (role?: CustomRoleItem) => {
    if (role) {
      setEditingRole(role);
      setRoleFormName(role.name);
      setRoleFormDesc(role.description || '');
      setRoleFormIsAdmin(role.isSystemAdmin);

      const permMap: Record<string, string[]> = {};
      role.permissions?.forEach((p) => {
        permMap[p.module] = p.actions;
      });
      setRoleFormPermissions(permMap);
    } else {
      setEditingRole(null);
      setRoleFormName('');
      setRoleFormDesc('');
      setRoleFormIsAdmin(false);

      // Default permissions: basic view on core
      const defaultMap: Record<string, string[]> = {
        dashboard: ['view'],
        attendance: ['view', 'create'],
        leave: ['view', 'create'],
        self_service: ['view', 'create', 'edit'],
      };
      setRoleFormPermissions(defaultMap);
    }
    setRoleModalOpen(true);
  };

  const handleTogglePermission = (module: string, action: string) => {
    setRoleFormPermissions((prev) => {
      const current = prev[module] || [];
      const updated = current.includes(action)
        ? current.filter((a) => a !== action)
        : [...current, action];
      return { ...prev, [module]: updated };
    });
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleFormName.trim()) {
      showMsg('Role name is required', 'error');
      return;
    }

    setRoleSaving(true);
    const permArray = Object.keys(roleFormPermissions)
      .filter((k) => roleFormPermissions[k].length > 0)
      .map((k) => ({
        module: k,
        actions: roleFormPermissions[k],
      }));

    try {
      const url = editingRole ? `/api/v1/roles/${editingRole._id}` : '/api/v1/roles';
      const method = editingRole ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: roleFormName.trim(),
          description: roleFormDesc.trim(),
          isSystemAdmin: roleFormIsAdmin,
          permissions: permArray,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showMsg(data.message || 'Custom role saved successfully!');
        setRoleModalOpen(false);
        await fetchRoles();
        await refreshSession();
      } else {
        showMsg(data.error || 'Failed to save role', 'error');
      }
    } catch (err: any) {
      showMsg(err.message, 'error');
    } finally {
      setRoleSaving(false);
    }
  };

  const handleDeleteRole = async (role: CustomRoleItem) => {
    if (!confirm(`Are you sure you want to delete role "${role.name}"?`)) return;
    try {
      const res = await fetch(`/api/v1/roles/${role._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showMsg(data.message || 'Role deleted');
        fetchRoles();
      } else {
        showMsg(data.error || 'Failed to delete role', 'error');
      }
    } catch (err: any) {
      showMsg(err.message, 'error');
    }
  };

  // Feature Customization Handlers
  const handleToggleFeature = (key: string) => {
    setFeatures((prev) =>
      prev.map((f) => (f.key === key ? { ...f, enabled: !f.enabled } : f))
    );
  };

  const handleRenameFeature = (key: string, newName: string) => {
    setFeatures((prev) =>
      prev.map((f) => (f.key === key ? { ...f, name: newName } : f))
    );
  };

  const handleSaveFeatures = async () => {
    setFeaturesSaving(true);
    try {
      const res = await fetch('/api/v1/organization/features', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features }),
      });
      const data = await res.json();
      if (data.success) {
        showMsg('Feature modules customized! Sidebar & routes updated across organization.');
        await refreshSession();
      } else {
        showMsg(data.error || 'Failed to save features', 'error');
      }
    } catch (err: any) {
      showMsg(err.message, 'error');
    } finally {
      setFeaturesSaving(false);
    }
  };

  // Save Profile Handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const res = await fetch('/api/v1/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileForm.name,
          contactEmail: profileForm.contactEmail,
          contactPhone: profileForm.contactPhone,
          address: {
            city: profileForm.city,
            state: profileForm.state,
            pincode: profileForm.pincode,
          },
          statutoryConfig: {
            panNumber: profileForm.panNumber,
            tanNumber: profileForm.tanNumber,
            gstNumber: profileForm.gstNumber,
            epfNumber: profileForm.epfNumber,
            esiNumber: profileForm.esiNumber,
            epfEnabled: true,
            esiEnabled: true,
            ptState: 'Karnataka',
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        showMsg('Organization profile and statutory settings updated!');
        refreshSession();
      }
    } catch (err: any) {
      showMsg(err.message, 'error');
    } finally {
      setProfileSaving(false);
    }
  };

  // Add Structure Handler
  const handleAddStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = { type: structType, data: { name: structForm.name, code: structForm.code } };
      if (structType === 'BRANCH') payload.data.city = structForm.city;
      if (structType === 'DESIGNATION') payload.data.title = structForm.name;

      const res = await fetch('/api/v1/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setStructModalOpen(false);
        setStructForm({ name: '', code: '', city: 'Bengaluru' });
        showMsg('Structure node added successfully!');
        fetchProfileAndStructures();
      }
    } catch (err: any) {
      showMsg(err.message, 'error');
    }
  };

  if (!canConfigSaas) {
    return (
      <DashboardLayout>
        <div className="p-8 sm:p-12 max-w-xl mx-auto my-12 text-center rounded-3xl bg-white border border-slate-200 shadow-md space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Access Restricted: Organization Admin Only</h2>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            SaaS feature customization, custom roles, and corporate structure are restricted to the <strong>Organization Administrator</strong> and <strong>SaaS Platform Owner</strong>.
            Your role or account currently does not have delegation to customize SaaS.
          </p>
          <div className="pt-2">
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all"
            >
              <span>Return to Dashboard</span>
            </a>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] text-orange-600 font-extrabold uppercase tracking-wider bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md">
              Multi-Tenant SaaS
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-500">{organization?.name || 'Workspace'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 flex items-center gap-3">
            <span>SaaS Customizer & Settings</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl font-medium">
            Organization Admins can customize SaaS features, configure custom roles with granular permissions, and decide which specific users have SaaS customization privileges.
          </p>
        </div>

        {/* Status Toast */}
        {statusMsg && (
          <div
            className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 shadow-xs ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-rose-600" />}
            <span>{statusMsg.text}</span>
          </div>
        )}
      </div>

      {/* Tabs Navigation (HROne Clean Modern Pill Tabs) */}
      <div className="flex border-b border-slate-200/90 space-x-2 overflow-x-auto pb-2 text-xs font-bold">
        {[
          { id: 'features', label: '1. Modular Feature Toggles', icon: Sliders },
          { id: 'roles', label: '2. Custom Roles & Permissions', icon: Shield },
          { id: 'users', label: '3. Specific User Privileges', icon: Users },
          { id: 'profile', label: '4. Company & Statutory Info', icon: Building },
          { id: 'structure', label: '5. Branches & Departments', icon: Layers },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 py-2.5 px-4 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25 font-bold'
                  : 'bg-white text-slate-600 hover:text-slate-950 hover:bg-slate-100 border border-slate-200/90 font-semibold'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: DYNAMIC CUSTOM ROLES & PERMISSIONS */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-orange-600" />
                <span>Custom Role Management</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Define dynamic custom roles tailored to your company hierarchy (e.g. &quot;Shift Supervisor&quot;, &quot;HR Lead&quot;, &quot;Finance Auditor&quot;).
              </p>
            </div>
            {canCreate && (
              <button
                onClick={() => handleOpenRoleModal()}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-xs shadow-md shadow-orange-500/20 flex items-center gap-2 cursor-pointer transition-transform hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4" />
                <span>Create Custom Role</span>
              </button>
            )}
          </div>

          {/* Roles Table */}
          <div className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs">
            {rolesLoading ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading custom roles...</div>
            ) : roles.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No custom roles defined yet. Click &quot;Create Custom Role&quot; above to set up your first role.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider border-b border-slate-200 text-[11px] font-bold">
                    <tr>
                      <th className="py-3 px-4">Role Name & Slug</th>
                      <th className="py-3 px-4">Access Scope</th>
                      <th className="py-3 px-4">Configured Permissions</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {roles.map((r) => (
                      <tr key={r._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            <span>{r.name}</span>
                            {r.isSystemAdmin && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-orange-50 text-orange-700 font-bold border border-orange-200">
                                Unrestricted Admin
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">{r.slug}</div>
                          {r.description && <div className="text-[11px] text-slate-500 mt-1">{r.description}</div>}
                        </td>
                        <td className="py-3.5 px-4">
                          {r.isSystemAdmin ? (
                            <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Full Access to All 16 Modules</span>
                            </span>
                          ) : (
                            <span className="text-slate-600 font-medium">
                              Granular ({r.permissions?.length || 0} modules configured)
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {r.isSystemAdmin ? (
                            <span className="text-[11px] text-slate-400">Bypasses permission matrix</span>
                          ) : (
                            <div className="flex flex-wrap gap-1 max-w-md">
                              {r.permissions?.slice(0, 4).map((p) => (
                                <span
                                  key={p.module}
                                  className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-medium"
                                >
                                  {p.module} ({p.actions?.join(', ')})
                                </span>
                              ))}
                              {r.permissions?.length > 4 && (
                                <span className="text-[10px] text-slate-500 font-medium self-center">
                                  +{r.permissions.length - 4} more
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {canEdit && (
                              <button
                                onClick={() => handleOpenRoleModal(r)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-all cursor-pointer"
                                title="Edit permissions"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {!r.isSystemAdmin && canEdit && (
                              <button
                                onClick={() => handleDeleteRole(r)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all cursor-pointer"
                                title="Delete role"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MODULAR FEATURE TOGGLES */}
      {activeTab === 'features' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-orange-600" />
                <span>Organization Feature Customizer</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Enable or disable modules and rename feature labels to match your corporate vocabulary.
              </p>
            </div>
            <button
              onClick={handleSaveFeatures}
              disabled={featuresSaving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-xs shadow-md shadow-orange-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-transform hover:scale-[1.02]"
            >
              {featuresSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{featuresSaving ? 'Applying Changes...' : 'Save & Publish Features'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feat) => (
              <div
                key={feat.key}
                className={`p-4 rounded-2xl border transition-all ${
                  feat.enabled
                    ? 'bg-white border-slate-200/90 shadow-xs'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                        feat.enabled
                          ? 'bg-orange-50 text-orange-600 border border-orange-200 shadow-xs'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {feat.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={feat.name}
                          onChange={(e) => handleRenameFeature(feat.key, e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all max-w-[200px]"
                          title="Click to rename display title"
                        />
                        <span className="text-[10px] text-slate-400 font-mono">({feat.key})</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 font-medium">{feat.description || 'Module component'}</p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => handleToggleFeature(feat.key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      feat.enabled ? 'bg-orange-500' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        feat.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SPECIFIC USER PRIVILEGES (Organization Admin Delegation) */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-orange-100 text-orange-700">
                  Granular User Delegation
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-semibold text-slate-500">{tenantUsers.length} Organization Users</span>
              </div>
              <h2 className="text-base font-bold text-slate-900 mt-1 flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-600" />
                <span>Specific User SaaS Customization Privileges</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium max-w-2xl">
                Organization Admins can decide which specific users have the feature to customize SaaS settings & feature toggles, or reassign custom roles directly.
              </p>
            </div>

            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search user by name or email..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500"
              />
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs">
            {usersLoading ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-orange-500" />
                Loading organization users and permissions...
              </div>
            ) : tenantUsers.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs font-medium">
                No users found for this organization.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] uppercase text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">User Details</th>
                      <th className="py-3 px-4">Assigned Role</th>
                      <th className="py-3 px-4 text-center">SaaS Customization Access</th>
                      <th className="py-3 px-4 text-right">Admin Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {tenantUsers
                      .filter(
                        (u) =>
                          u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
                          u.email?.toLowerCase().includes(userSearch.toLowerCase())
                      )
                      .map((u) => {
                        const isUserOrgAdmin =
                          u.role === 'Admin' ||
                          u.role === 'ORG_ADMIN' ||
                          u.role === 'ORGANIZATION OWNER' ||
                          u.roleId?.isSystemAdmin;

                        const roleHasSettings =
                          u.roleId?.permissions?.some(
                            (p: any) =>
                              (p.module === 'settings' || p.module === 'roles') &&
                              (p.actions?.includes('view') || p.actions?.includes('edit'))
                          ) ?? false;

                        const isUpdating = updatingUserId === u._id;

                        return (
                          <tr key={u._id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 font-bold text-xs flex items-center justify-center">
                                  {u.name?.slice(0, 2).toUpperCase() || 'US'}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900">{u.name}</div>
                                  <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                                  {u.employeeId?.employeeCode && (
                                    <span className="text-[10px] text-slate-400 font-medium">
                                      Emp Code: {u.employeeId.employeeCode}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="flex flex-col gap-1 max-w-[200px]">
                                <select
                                  value={u.roleId?._id || ''}
                                  onChange={(e) => handleAssignUserRole(u._id, e.target.value)}
                                  disabled={isUpdating}
                                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-orange-500"
                                >
                                  <option value="">{u.role || 'Assign Role'}</option>
                                  {roles.map((r) => (
                                    <option key={r._id} value={r._id}>
                                      {r.name} {r.isSystemAdmin ? '(System Admin)' : ''}
                                    </option>
                                  ))}
                                </select>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  Role: <strong className="text-slate-600">{u.role}</strong>
                                </span>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              {isUserOrgAdmin ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                  <Shield className="w-3 h-3" />
                                  Org Administrator (Full Access)
                                </span>
                              ) : roleHasSettings ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  <Check className="w-3 h-3" />
                                  Granted via Role ({u.role})
                                </span>
                              ) : u.canCustomizeSaas ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Specific User Override (Granted)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
                                  <X className="w-3 h-3" />
                                  No Customization Access
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              {isUserOrgAdmin ? (
                                <span className="text-[11px] text-slate-400 font-medium italic">
                                  Org Admin Always Enabled
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleToggleUserCustomSaas(u)}
                                  disabled={isUpdating}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                                    u.canCustomizeSaas
                                      ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                                      : 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100'
                                  }`}
                                >
                                  {isUpdating ? (
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  ) : u.canCustomizeSaas ? (
                                    <X className="w-3.5 h-3.5" />
                                  ) : (
                                    <Check className="w-3.5 h-3.5" />
                                  )}
                                  <span>
                                    {u.canCustomizeSaas ? 'Revoke SaaS Feature' : 'Enable SaaS Feature'}
                                  </span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: COMPANY & STATUTORY CONFIG */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Building className="w-4 h-4 text-orange-600" />
              <span>Corporate Legal Entity Details</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company Registered Name</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Official Contact Email</label>
                <input
                  type="email"
                  value={profileForm.contactEmail}
                  onChange={(e) => setProfileForm({ ...profileForm, contactEmail: e.target.value })}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={profileForm.contactPhone}
                  onChange={(e) => setProfileForm({ ...profileForm, contactPhone: e.target.value })}
                  placeholder="+91 80 4123 4567"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={profileForm.city}
                  onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">State / Province</label>
                <input
                  type="text"
                  value={profileForm.state}
                  onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">PIN / Postal Code</label>
                <input
                  type="text"
                  value={profileForm.pincode}
                  onChange={(e) => setProfileForm({ ...profileForm, pincode: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>

            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-orange-600 pt-4 border-t border-slate-200 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-orange-600" />
              <span>India Statutory & Tax Compliance Numbers</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company PAN</label>
                <input
                  type="text"
                  value={profileForm.panNumber}
                  onChange={(e) => setProfileForm({ ...profileForm, panNumber: e.target.value })}
                  placeholder="AAACT1234C"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 uppercase font-mono font-medium focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company TAN</label>
                <input
                  type="text"
                  value={profileForm.tanNumber}
                  onChange={(e) => setProfileForm({ ...profileForm, tanNumber: e.target.value })}
                  placeholder="BLRT12345E"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 uppercase font-mono font-medium focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN Number</label>
                <input
                  type="text"
                  value={profileForm.gstNumber}
                  onChange={(e) => setProfileForm({ ...profileForm, gstNumber: e.target.value })}
                  placeholder="29AAACT1234C1Z5"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 uppercase font-mono font-medium focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">EPF Establishment Code</label>
                <input
                  type="text"
                  value={profileForm.epfNumber}
                  onChange={(e) => setProfileForm({ ...profileForm, epfNumber: e.target.value })}
                  placeholder="KN/BNG/1234567/000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ESIC Registration Code</label>
                <input
                  type="text"
                  value={profileForm.esiNumber}
                  onChange={(e) => setProfileForm({ ...profileForm, esiNumber: e.target.value })}
                  placeholder="53-00-123456-000-0001"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={profileSaving}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-xs shadow-md shadow-orange-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-transform hover:scale-[1.02]"
              >
                {profileSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{profileSaving ? 'Saving Profile...' : 'Save Organization Profile'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 4: STRUCTURE & HIERARCHY */}
      {activeTab === 'structure' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Branches, Departments & Designations</h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">Manage geographical offices and corporate hierarchy nodes</p>
            </div>
            <button
              onClick={() => setStructModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-orange-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add Structure Node</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Branches */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>Offices / Branches</span>
                <span className="text-orange-600 font-bold">({branches.length})</span>
              </h4>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {branches.length === 0 ? (
                  <p className="text-xs text-slate-400">No branches added yet.</p>
                ) : (
                  branches.map((b) => (
                    <div key={b._id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                      <div className="font-bold text-slate-900">{b.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">{b.code} • {b.city}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Departments */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>Departments</span>
                <span className="text-orange-600 font-bold">({departments.length})</span>
              </h4>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {departments.length === 0 ? (
                  <p className="text-xs text-slate-400">No departments added yet.</p>
                ) : (
                  departments.map((d) => (
                    <div key={d._id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                      <div className="font-bold text-slate-900">{d.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">{d.code}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Designations */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>Designations / Titles</span>
                <span className="text-orange-600 font-bold">({designations.length})</span>
              </h4>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {designations.length === 0 ? (
                  <p className="text-xs text-slate-400">No designations added yet.</p>
                ) : (
                  designations.map((des) => (
                    <div key={des._id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                      <div className="font-bold text-slate-900">{des.title}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">{des.code}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CUSTOM ROLE BUILDER & PERMISSION MATRIX */}
      {roleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 text-slate-900 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-black text-slate-950 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-orange-500" />
                  <span>{editingRole ? `Edit Role: ${editingRole.name}` : 'Create Custom Organization Role'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Configure custom role name and granular action matrix per module
                </p>
              </div>
              <button
                onClick={() => setRoleModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Custom Role Name</label>
                  <input
                    type="text"
                    value={roleFormName}
                    onChange={(e) => setRoleFormName(e.target.value)}
                    required
                    placeholder="e.g. Senior Shift Supervisor"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Description / Responsibilities</label>
                  <input
                    type="text"
                    value={roleFormDesc}
                    onChange={(e) => setRoleFormDesc(e.target.value)}
                    placeholder="e.g. Approves timesheets and regularizes attendance"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>

              {/* System Admin toggle */}
              <div className="p-3.5 rounded-xl bg-orange-50/70 border border-orange-200/80 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-orange-600" />
                    <span>Unrestricted Administrator Privilege</span>
                  </p>
                  <p className="text-[11px] text-slate-600 font-medium">
                    If checked, users with this role will bypass all permission checks and access all modules.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={roleFormIsAdmin}
                  onChange={(e) => setRoleFormIsAdmin(e.target.checked)}
                  className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
                />
              </div>

              {/* Granular Permission Matrix */}
              {!roleFormIsAdmin && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Module Permissions Matrix
                    </label>
                    <span className="text-[10px] text-slate-500">Check actions allowed for this custom role</span>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 sticky top-0 text-[10px] uppercase text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Module</th>
                          {PERMISSION_ACTIONS.map((a) => (
                            <th key={a} className="py-2.5 px-3 text-center capitalize">{a}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {ALL_MODULE_KEYS.map((m) => {
                          const currentActions = roleFormPermissions[m.key] || [];
                          const isSettingsKey = m.key === 'settings';
                          return (
                            <tr key={m.key} className={isSettingsKey ? 'bg-orange-50/70 hover:bg-orange-100/50' : 'hover:bg-slate-50/80'}>
                              <td className="py-2 px-3 font-semibold text-slate-800">
                                <div className="flex items-center gap-1.5">
                                  <span>{m.label}</span>
                                  {isSettingsKey && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-200 text-orange-950 font-extrabold uppercase tracking-wide">
                                      Customize SaaS
                                    </span>
                                  )}
                                </div>
                                <div className={`text-[10px] ${isSettingsKey ? 'text-orange-700 font-medium' : 'text-slate-400 font-mono'}`}>
                                  {isSettingsKey ? 'Grants this role permission to customize SaaS features' : m.key}
                                </div>
                              </td>
                              {PERMISSION_ACTIONS.map((action) => {
                                const checked = currentActions.includes(action);
                                return (
                                  <td key={action} className="py-2 px-3 text-center">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => handleTogglePermission(m.key, action)}
                                      className="w-3.5 h-3.5 rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
                                    />
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRoleModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={roleSaving}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-extrabold text-xs shadow-md shadow-orange-500/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-transform hover:scale-[1.02]"
                >
                  {roleSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{roleSaving ? 'Saving Role...' : 'Save Custom Role'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD STRUCTURE NODE */}
      {structModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">Add Organization Hierarchy Node</h3>
              <button onClick={() => setStructModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddStructure} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Node Type</label>
                <select
                  value={structType}
                  onChange={(e: any) => setStructType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                >
                  <option value="BRANCH">Office / Branch</option>
                  <option value="DEPARTMENT">Department</option>
                  <option value="DESIGNATION">Designation / Role Title</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Name / Title</label>
                <input
                  type="text"
                  value={structForm.name}
                  onChange={(e) => setStructForm({ ...structForm, name: e.target.value })}
                  required
                  placeholder="e.g. Pune Tech Center"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Unique Code</label>
                <input
                  type="text"
                  value={structForm.code}
                  onChange={(e) => setStructForm({ ...structForm, code: e.target.value.toUpperCase() })}
                  required
                  placeholder="e.g. PUN-01"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 uppercase font-mono font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                />
              </div>
              {structType === 'BRANCH' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={structForm.city}
                    onChange={(e) => setStructForm({ ...structForm, city: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                  />
                </div>
              )}
              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStructModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 text-xs text-slate-700 font-semibold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-xs text-white font-bold shadow-md shadow-orange-500/20"
                >
                  Save Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
