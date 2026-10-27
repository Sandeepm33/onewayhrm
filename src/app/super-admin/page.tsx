'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import {
  ShieldCheck,
  Building2,
  Plus,
  CheckCircle2,
  AlertCircle,
  Users,
  Sparkles,
  X,
  Key,
  Copy,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  Send,
  Sliders,
} from 'lucide-react';

export default function SuperAdminPage() {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Tenant Provisioning Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    contactEmail: '',
    contactPhone: '',
    plan: 'PROFESSIONAL',
    employeeLimit: 200,
    adminName: '',
    adminPassword: 'Admin@12345',
  });

  // Credential Handover Modal (Shown after successful creation)
  const [credentialModalOpen, setCredentialModalOpen] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    orgName: string;
    orgSlug: string;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
    plan: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Reset Password Modal
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetOrg, setResetOrg] = useState<any>(null);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const fetchTenants = async () => {
    try {
      const res = await fetch('/api/v1/superadmin/tenants');
      const data = await res.json();
      if (data.success) {
        setTenants(data.organizations || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
    setForm((prev) => ({
      ...prev,
      adminPassword: 'Admin@' + Math.floor(1000 + Math.random() * 9000),
    }));
  }, []);

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let pass = 'Pass@';
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm((prev) => ({ ...prev, adminPassword: pass }));
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/v1/superadmin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        // Save for the handover modal
        setCreatedCredentials({
          orgName: form.name,
          orgSlug: form.slug,
          adminName: form.adminName,
          adminEmail: form.contactEmail,
          adminPassword: form.adminPassword,
          plan: form.plan,
        });

        setModalOpen(false);
        setCredentialModalOpen(true);
        setSuccess(`Organization "${form.name}" provisioned successfully!`);

        // Reset form
        setForm({
          name: '',
          slug: '',
          contactEmail: '',
          contactPhone: '',
          plan: 'PROFESSIONAL',
          employeeLimit: 200,
          adminName: '',
          adminPassword: 'Admin@' + Math.floor(1000 + Math.random() * 9000),
        });
        fetchTenants();
      } else {
        setError(data.error || 'Failed to create organization');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCopyInvitation = () => {
    if (!createdCredentials) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const text = `🎉 Welcome to OneWayHR HCM!

Your isolated SaaS organization workspace has been provisioned:

🏢 Organization: ${createdCredentials.orgName}
🌐 Workspace: ${createdCredentials.orgSlug}
🔗 Login Portal: ${origin}/login
👤 Admin Name: ${createdCredentials.adminName}
📧 Admin Email: ${createdCredentials.adminEmail}
🔑 Temporary Password: ${createdCredentials.adminPassword}

Please sign in to customize your dynamic roles, toggle modular features, and onboard your team!`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleOpenResetModal = (org: any) => {
    setResetOrg(org);
    const pass = 'Reset@' + Math.floor(1000 + Math.random() * 9000);
    setResetNewPassword(pass);
    setResetModalOpen(true);
  };

  const handleSaveResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetOrg) return;
    setResetLoading(true);
    try {
      const res = await fetch('/api/v1/superadmin/tenants/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: resetOrg._id,
          newPassword: resetNewPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(`Password for ${resetOrg.name} (${resetOrg.contactEmail}) updated to "${resetNewPassword}".`);
        setResetModalOpen(false);
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResetLoading(false);
    }
  };

  const handleToggleStatus = async (organizationId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await fetch('/api/v1/superadmin/tenants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId, planStatus: newStatus }),
      });
      fetchTenants();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] text-orange-600 font-extrabold uppercase tracking-wider bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md">
              Platform Owner Console
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-500">{tenants.length} Tenant Organizations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 flex items-center gap-3">
            <span>SaaS Tenant Provisioning</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl font-medium">
            Only you (Platform Owner) can add new organizations. Set their credentials, plan limits, and handover their access.
          </p>
        </div>

        <button
          onClick={() => {
            setError('');
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-transform hover:scale-[1.02] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Provision New SaaS Tenant</span>
        </button>
      </div>

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-xs font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* PLATFORM METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <span className="text-xs font-bold text-slate-500">Total SaaS Tenants</span>
          <div className="text-3xl font-black text-slate-900 mt-1">{tenants.length}</div>
          <p className="text-[11px] text-slate-400 font-medium mt-1">All isolated organizations</p>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <span className="text-xs font-bold text-slate-500">Owner Access Mode</span>
          <div className="text-xl font-black text-orange-600 mt-1">Single Provisioner</div>
          <p className="text-[11px] text-slate-400 font-medium mt-1">Self-registration disabled</p>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <span className="text-xs font-bold text-slate-500">Multi-Tenant Isolation</span>
          <div className="text-xl font-black text-indigo-600 mt-1">Strict Server RBAC</div>
          <p className="text-[11px] text-slate-400 font-medium mt-1">Isolated DB partitioning</p>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <span className="text-xs font-bold text-slate-500">Platform Availability</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">100.0%</div>
          <p className="text-[11px] text-slate-400 font-medium mt-1">Zero downtime recorded</p>
        </div>
      </div>

      {/* TENANTS TABLE */}
      <div className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Provisioned Organizations & Admin Access
          </h3>
          <span className="text-[11px] text-slate-500 font-mono font-bold">{tenants.length} Tenants</span>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading organizations...</div>
          ) : tenants.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No organizations created yet. Click &quot;Provision New SaaS Tenant&quot; above to add your first client company.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Organization Name</th>
                  <th className="py-3 px-4">Tenant Slug</th>
                  <th className="py-3 px-4">Admin Email</th>
                  <th className="py-3 px-4">Plan Tier</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Handover & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {tenants.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">{t.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">ID: {t._id}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-orange-600">
                      {t.slug}
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 font-mono font-medium">
                      {t.contactEmail}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {t.plan}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.planStatus === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {t.planStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Reset Password Button */}
                        <button
                          onClick={() => handleOpenResetModal(t)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Reset Tenant Password"
                        >
                          <Key className="w-3.5 h-3.5 text-orange-600" />
                          <span>Reset Password</span>
                        </button>

                        {/* Suspend / Activate Button */}
                        <button
                          onClick={() => handleToggleStatus(t._id, t.planStatus)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                            t.planStatus === 'ACTIVE'
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          {t.planStatus === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL 1: PROVISION NEW SAAS TENANT */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 relative my-8 text-slate-900">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-orange-500" />
              <span>Provision New SaaS Tenant</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 mb-4 font-medium">
              Create an organization partition and set initial credentials for the client admin
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateTenant} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Organization Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      const slug = val.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
                      setForm({ ...form, name: val, slug });
                    }}
                    placeholder="e.g. Apex Financial"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Workspace Slug *</label>
                  <input
                    type="text"
                    required
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().trim() })}
                    placeholder="apex-financial"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-medium focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Plan Tier</label>
                  <select
                    value={form.plan}
                    onChange={(e) => setForm({ ...form, plan: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                  >
                    <option value="STARTER">Starter Tier (50)</option>
                    <option value="PROFESSIONAL">Professional Tier (250)</option>
                    <option value="ENTERPRISE">Enterprise Tier (Unlimited)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Employee Limit</label>
                  <input
                    type="number"
                    value={form.employeeLimit}
                    onChange={(e) => setForm({ ...form, employeeLimit: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 space-y-3">
                <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wider block">
                  Tenant Administrator Login Credentials
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Full Name *</label>
                    <input
                      type="text"
                      required
                      value={form.adminName}
                      onChange={(e) => setForm({ ...form, adminName: e.target.value })}
                      placeholder="e.g. Vikramaditya"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Email (Login ID) *</label>
                    <input
                      type="email"
                      required
                      value={form.contactEmail}
                      onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                      placeholder="admin@apex.in"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>
                </div>

                {/* Password field with random generator & reveal */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">Initial Password *</label>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="text-[11px] text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Generate Random</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={form.adminPassword}
                      onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                      placeholder="Minimum 8 characters"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-medium focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">
                    You can copy the welcome invitation with this password immediately after creation.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xs font-bold shadow-md shadow-orange-500/20 cursor-pointer transition-transform hover:scale-[1.02]"
                >
                  Provision & Generate Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREDENTIAL HANDOVER MODAL */}
      {credentialModalOpen && createdCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 relative text-slate-900">
            <button
              onClick={() => setCredentialModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-950">Tenant Provisioned Successfully!</h3>
                <p className="text-xs text-slate-500 font-medium">Handover these login credentials to the tenant administrator</p>
              </div>
            </div>

            {/* Credential summary box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-slate-200/80 pb-2">
                <span className="text-slate-500 font-medium">Organization:</span>
                <span className="text-slate-900 font-bold">{createdCredentials.orgName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/80 pb-2">
                <span className="text-slate-500 font-medium">Login Portal:</span>
                <span className="text-orange-600 font-bold">http://localhost:3000/login</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/80 pb-2">
                <span className="text-slate-500 font-medium">Corporate Email:</span>
                <span className="text-slate-900 font-bold">{createdCredentials.adminEmail}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Initial Password:</span>
                <span className="text-orange-700 font-bold px-2 py-0.5 rounded bg-orange-50 border border-orange-200">
                  {createdCredentials.adminPassword}
                </span>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <button
                onClick={handleCopyInvitation}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-extrabold text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-[1.01]"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Formatted Welcome Invitation'}</span>
              </button>

              <button
                onClick={() => setCredentialModalOpen(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: RESET TENANT PASSWORD */}
      {resetModalOpen && resetOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 relative text-slate-900">
            <button
              onClick={() => setResetModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-950 flex items-center gap-2 mb-1">
              <Key className="w-5 h-5 text-orange-600" />
              <span>Reset Tenant Password</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4 font-medium">
              Set a new temporary password for <strong>{resetOrg.name}</strong> ({resetOrg.contactEmail})
            </p>

            <form onSubmit={handleSaveResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const pass = 'Reset@' + Math.floor(1000 + Math.random() * 9000);
                      setResetNewPassword(pass);
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 font-semibold whitespace-nowrap cursor-pointer"
                  >
                    Random
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setResetModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xs font-bold shadow-md shadow-orange-500/20 cursor-pointer disabled:opacity-50"
                >
                  {resetLoading ? 'Updating...' : 'Update & Save Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
