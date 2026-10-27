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
  const { user, organization, refreshSession } = useAuth();
  const [activeTab, setActiveTab] = useState<'roles' | 'features' | 'profile' | 'structure'>('roles');

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

  useEffect(() => {
    fetchRoles();
    fetchFeatures();
    fetchProfileAndStructures();
  }, []);

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

  return (
    <DashboardLayout>
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-orange-400 font-bold uppercase tracking-wider">Multi-Tenant SaaS</span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400">{organization?.name || 'Workspace'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <span>SaaS Customizer & Settings</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Create completely custom roles with granular permission matrices, and toggle or rename modules for your organization.
          </p>
        </div>

        {/* Status Toast */}
        {statusMsg && (
          <div
            className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/80 border-rose-500/40 text-rose-300'
            }`}
          >
            {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-rose-400" />}
            <span>{statusMsg.text}</span>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 space-x-1 sm:space-x-3 overflow-x-auto pb-1 text-xs font-bold">
        {[
          { id: 'roles', label: '1. Custom Roles & Permissions', icon: Shield },
          { id: 'features', label: '2. Modular Feature Toggles', icon: Sliders },
          { id: 'profile', label: '3. Company & Statutory Info', icon: Building },
          { id: 'structure', label: '4. Branches & Departments', icon: Layers },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 py-3 px-4 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-400" />
                <span>Custom Role Management</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Define dynamic custom roles tailored to your company hierarchy (e.g. "Shift Supervisor", "HR Lead", "Finance Auditor").
              </p>
            </div>
            <button
              onClick={() => handleOpenRoleModal()}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-xs shadow-lg shadow-orange-500/20 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Custom Role</span>
            </button>
          </div>

          {/* Roles Table */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
            {rolesLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading custom roles...</div>
            ) : roles.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No custom roles defined yet. Click &quot;Create Custom Role&quot; above to set up your first role.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider border-b border-slate-800 text-[10px]">
                    <tr>
                      <th className="py-3 px-4 font-bold">Role Name & Slug</th>
                      <th className="py-3 px-4 font-bold">Access Scope</th>
                      <th className="py-3 px-4 font-bold">Configured Permissions</th>
                      <th className="py-3 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-slate-300">
                    {roles.map((r) => (
                      <tr key={r._id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white text-sm flex items-center gap-2">
                            <span>{r.name}</span>
                            {r.isSystemAdmin && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-orange-500/20 text-orange-400 font-bold border border-orange-500/30">
                                Unrestricted Admin
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">{r.slug}</div>
                          {r.description && <div className="text-[11px] text-slate-400 mt-1">{r.description}</div>}
                        </td>
                        <td className="py-3.5 px-4">
                          {r.isSystemAdmin ? (
                            <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Full Access to All 16 Modules</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">
                              Granular ({r.permissions?.length || 0} modules configured)
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {r.isSystemAdmin ? (
                            <span className="text-[11px] text-slate-500">Bypasses permission matrix</span>
                          ) : (
                            <div className="flex flex-wrap gap-1 max-w-md">
                              {r.permissions?.slice(0, 4).map((p) => (
                                <span
                                  key={p.module}
                                  className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700 text-[10px] font-medium"
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
                            <button
                              onClick={() => handleOpenRoleModal(r)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                              title="Edit permissions"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {!r.isSystemAdmin && (
                              <button
                                onClick={() => handleDeleteRole(r)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-orange-400" />
                <span>Organization Feature Customizer</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Enable or disable modules and rename feature labels to match your corporate vocabulary.
              </p>
            </div>
            <button
              onClick={handleSaveFeatures}
              disabled={featuresSaving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-xs shadow-lg shadow-orange-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
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
                    ? 'bg-slate-900/90 border-slate-800 shadow-md'
                    : 'bg-slate-950 border-slate-900 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                        feat.enabled ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'bg-slate-800 text-slate-500'
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
                          className="bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold text-white focus:outline-none focus:border-orange-500 focus:bg-slate-800 transition-all max-w-[200px]"
                          title="Click to rename display title"
                        />
                        <span className="text-[10px] text-slate-500 font-mono">({feat.key})</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">{feat.description || 'Module component'}</p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => handleToggleFeature(feat.key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      feat.enabled ? 'bg-emerald-600' : 'bg-slate-700'
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

      {/* TAB 3: COMPANY & STATUTORY CONFIG */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-indigo-400">
              Corporate Legal Entity Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Company Registered Name</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Official Contact Email</label>
                <input
                  type="email"
                  value={profileForm.contactEmail}
                  onChange={(e) => setProfileForm({ ...profileForm, contactEmail: e.target.value })}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={profileForm.contactPhone}
                  onChange={(e) => setProfileForm({ ...profileForm, contactPhone: e.target.value })}
                  placeholder="+91 80 4123 4567"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">City</label>
                <input
                  type="text"
                  value={profileForm.city}
                  onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">State / Province</label>
                <input
                  type="text"
                  value={profileForm.state}
                  onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">PIN / Postal Code</label>
                <input
                  type="text"
                  value={profileForm.pincode}
                  onChange={(e) => setProfileForm({ ...profileForm, pincode: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-orange-400 pt-4 border-t border-slate-800">
              India Statutory & Tax Numbers
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Company PAN</label>
                <input
                  type="text"
                  value={profileForm.panNumber}
                  onChange={(e) => setProfileForm({ ...profileForm, panNumber: e.target.value })}
                  placeholder="AAACT1234C"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white uppercase focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Company TAN</label>
                <input
                  type="text"
                  value={profileForm.tanNumber}
                  onChange={(e) => setProfileForm({ ...profileForm, tanNumber: e.target.value })}
                  placeholder="BLRT12345E"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white uppercase focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">GSTIN Number</label>
                <input
                  type="text"
                  value={profileForm.gstNumber}
                  onChange={(e) => setProfileForm({ ...profileForm, gstNumber: e.target.value })}
                  placeholder="29AAACT1234C1Z5"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white uppercase focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">EPF Establishment Code</label>
                <input
                  type="text"
                  value={profileForm.epfNumber}
                  onChange={(e) => setProfileForm({ ...profileForm, epfNumber: e.target.value })}
                  placeholder="KN/BNG/1234567/000"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">ESIC Registration Code</label>
                <input
                  type="text"
                  value={profileForm.esiNumber}
                  onChange={(e) => setProfileForm({ ...profileForm, esiNumber: e.target.value })}
                  placeholder="53-00-123456-000-0001"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={profileSaving}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
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
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">Branches, Departments & Designations</h3>
              <p className="text-xs text-slate-400 mt-0.5">Manage geographical offices and corporate hierarchy nodes</p>
            </div>
            <button
              onClick={() => setStructModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Structure Node</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Branches */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Offices / Branches</span>
                <span className="text-indigo-400 font-mono">({branches.length})</span>
              </h4>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {branches.length === 0 ? (
                  <p className="text-xs text-slate-500">No branches added yet.</p>
                ) : (
                  branches.map((b) => (
                    <div key={b._id} className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
                      <div className="font-semibold text-white">{b.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{b.code} • {b.city}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Departments */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Departments</span>
                <span className="text-indigo-400 font-mono">({departments.length})</span>
              </h4>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {departments.length === 0 ? (
                  <p className="text-xs text-slate-500">No departments added yet.</p>
                ) : (
                  departments.map((d) => (
                    <div key={d._id} className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
                      <div className="font-semibold text-white">{d.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{d.code}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Designations */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Designations / Titles</span>
                <span className="text-indigo-400 font-mono">({designations.length})</span>
              </h4>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {designations.length === 0 ? (
                  <p className="text-xs text-slate-500">No designations added yet.</p>
                ) : (
                  designations.map((des) => (
                    <div key={des._id} className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
                      <div className="font-semibold text-white">{des.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{des.code}</div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-orange-500" />
                  <span>{editingRole ? `Edit Role: ${editingRole.name}` : 'Create Custom Organization Role'}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure custom role name and granular action matrix per module
                </p>
              </div>
              <button
                onClick={() => setRoleModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Custom Role Name</label>
                  <input
                    type="text"
                    value={roleFormName}
                    onChange={(e) => setRoleFormName(e.target.value)}
                    required
                    placeholder="e.g. Senior Shift Supervisor"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Description / Responsibilities</label>
                  <input
                    type="text"
                    value={roleFormDesc}
                    onChange={(e) => setRoleFormDesc(e.target.value)}
                    placeholder="e.g. Approves timesheets and regularizes attendance"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* System Admin toggle */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-orange-400" />
                    <span>Unrestricted Administrator Privilege</span>
                  </p>
                  <p className="text-[11px] text-slate-400">
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
                    <label className="block text-xs font-bold text-indigo-400 uppercase tracking-wider">
                      Module Permissions Matrix
                    </label>
                    <span className="text-[10px] text-slate-500">Check actions allowed for this custom role</span>
                  </div>

                  <div className="border border-slate-800 rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-950 sticky top-0 text-[10px] uppercase text-slate-400 font-bold border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3">Module</th>
                          {PERMISSION_ACTIONS.map((a) => (
                            <th key={a} className="py-2.5 px-3 text-center capitalize">{a}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                        {ALL_MODULE_KEYS.map((m) => {
                          const currentActions = roleFormPermissions[m.key] || [];
                          return (
                            <tr key={m.key} className="hover:bg-slate-800/40">
                              <td className="py-2 px-3 font-semibold text-slate-200">
                                {m.label} <span className="text-[10px] text-slate-500 font-mono">({m.key})</span>
                              </td>
                              {PERMISSION_ACTIONS.map((action) => {
                                const checked = currentActions.includes(action);
                                return (
                                  <td key={action} className="py-2 px-3 text-center">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => handleTogglePermission(m.key, action)}
                                      className="w-3.5 h-3.5 rounded text-indigo-600 cursor-pointer"
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

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRoleModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={roleSaving}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-extrabold text-xs shadow-lg shadow-orange-500/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Add Organization Hierarchy Node</h3>
              <button onClick={() => setStructModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddStructure} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Node Type</label>
                <select
                  value={structType}
                  onChange={(e: any) => setStructType(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="BRANCH">Office / Branch</option>
                  <option value="DEPARTMENT">Department</option>
                  <option value="DESIGNATION">Designation / Role Title</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Name / Title</label>
                <input
                  type="text"
                  value={structForm.name}
                  onChange={(e) => setStructForm({ ...structForm, name: e.target.value })}
                  required
                  placeholder="e.g. Pune Tech Center"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Unique Code</label>
                <input
                  type="text"
                  value={structForm.code}
                  onChange={(e) => setStructForm({ ...structForm, code: e.target.value.toUpperCase() })}
                  required
                  placeholder="e.g. PUN-01"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white uppercase font-mono"
                />
              </div>
              {structType === 'BRANCH' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    value={structForm.city}
                    onChange={(e) => setStructForm({ ...structForm, city: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              )}
              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStructModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs text-white font-bold"
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
