'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Sparkles,
  Building2,
  Mail,
  Lock,
  User,
  Globe,
  ArrowRight,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { user, register } = useAuth();

  const [companyName, setCompanyName] = useState('');
  const [companySlug, setCompanySlug] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('');
  const [plan, setPlan] = useState<'TRIAL' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'>('PROFESSIONAL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isOwner = user?.role === 'SUPER_ADMIN';

  // Auto-slugify company name
  const handleCompanyNameChange = (val: string) => {
    setCompanyName(val);
    const generated = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    setCompanySlug(generated);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await register({
      companyName,
      companySlug,
      adminName,
      adminEmail,
      password,
      plan,
    });

    setLoading(false);
    if (res.success) {
      router.push('/super-admin');
    } else {
      setError(res.error || 'Failed to provision organization.');
    }
  };

  // If not logged in as the master Platform Owner:
  if (!isOwner) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-slate-900">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-orange-600 mb-6 transition-colors"
          >
            <span>← Back to Home</span>
          </Link>

          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 mx-auto mb-4">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <h1 className="text-2xl font-black tracking-tight text-slate-950">
            Platform Owner Access Required
          </h1>
          <p className="mt-2 text-xs text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
            Public self-registration is disabled. Organizations can only be provisioned and onboarded directly by the Platform Owner.
          </p>

          <div className="mt-8 bg-white border border-slate-200 shadow-xl rounded-2xl p-6 text-left space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
              <p className="font-bold text-slate-900">Are you the Platform Owner?</p>
              <p className="text-slate-500 text-[11px]">
                Sign in with your master credentials (<code className="font-mono text-indigo-600">owner@onewayhr.com</code>) to access the tenant provisioning console.
              </p>
            </div>

            <Link
              href="/login"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-extrabold text-xs shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Sign In as Platform Owner</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Owner form to provision organizations:
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden text-slate-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg relative z-10 text-center">
        <Link
          href="/super-admin"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-orange-600 mb-6 transition-colors"
        >
          <span>← Back to SaaS Owner Console</span>
        </Link>

        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-700 flex items-center justify-center text-white shadow-xl shadow-indigo-600/25 ring-1 ring-black/5">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-950">
          Provision <span className="text-orange-600">New Organization</span>
        </h1>
        <p className="mt-1.5 text-xs text-slate-500 font-medium max-w-md mx-auto">
          Logged in as Platform Owner ({user?.email}). Add an isolated organization workspace.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        <div className="bg-white border border-slate-200 shadow-2xl rounded-3xl p-6 sm:p-8 backdrop-blur-xl">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Company Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Company / Organization Name</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => handleCompanyNameChange(e.target.value)}
                    required
                    placeholder="e.g. Acme Technologies"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Workspace URL Slug</label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={companySlug}
                    onChange={(e) => setCompanySlug(e.target.value.toLowerCase().trim())}
                    required
                    placeholder="acme"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 font-mono font-medium focus:outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Admin User Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tenant Admin Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    required
                    placeholder="e.g. Vikram Singhania"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tenant Corporate Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                    placeholder="admin@acme.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Initial Admin Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Minimum 8 characters"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>
            </div>

            {/* Plan Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Assign SaaS Plan</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'STARTER', label: 'Starter', desc: 'Up to 50 Users' },
                  { id: 'PROFESSIONAL', label: 'Professional', desc: 'Up to 250 Users' },
                  { id: 'ENTERPRISE', label: 'Enterprise', desc: 'Unlimited' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlan(p.id as any)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      plan === p.id
                        ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-200'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900">{p.label}</div>
                    <div className="text-[10px] text-slate-500">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-extrabold text-sm shadow-xl shadow-orange-500/25 hover:shadow-orange-500/35 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <span>Provisioning Tenant...</span>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-white" />
                  <span>Provision Organization</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
