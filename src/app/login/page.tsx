'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Sparkles, Shield, ArrowRight, Lock, Mail, RefreshCw } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const success = await login(email, password);
    setLoading(false);

    if (success) {
      router.push('/dashboard');
    } else {
      setError('Invalid credentials. Please verify your email and password.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden text-slate-900">
      {/* Background soft glow accents */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-100/60 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-100/60 blur-[130px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        {/* Back to Landing Page */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-orange-600 mb-6 transition-colors"
        >
          <span>← Back to OneWayHR Home</span>
        </Link>

        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-700 flex items-center justify-center text-white shadow-xl shadow-indigo-600/25 ring-1 ring-black/5">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-950">
          OneWay<span className="text-orange-600">HR</span> <span className="text-sm font-bold text-slate-400 block sm:inline">SaaS</span>
        </h1>
        <p className="mt-1.5 text-xs text-slate-500 font-medium max-w-sm mx-auto">
          Sign in to your organization or Platform Owner console.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-white border border-slate-200 shadow-2xl rounded-3xl p-6 sm:p-8 backdrop-blur-xl">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Corporate Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@company.com or owner@onewayhr.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-extrabold text-xs shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Platform Master Owner 1-Click Fill */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              SaaS Master Account:
            </p>
            <button
              type="button"
              onClick={() => {
                setEmail('owner@onewayhr.com');
                setPassword('Owner@12345');
              }}
              className="w-full p-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-left transition-all flex items-center justify-between group cursor-pointer"
            >
              <div>
                <p className="text-xs font-extrabold text-orange-950 group-hover:text-orange-600 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-orange-600" />
                  <span>Platform Owner (Only can add orgs)</span>
                </p>
                <p className="text-[10px] text-orange-800/80 font-mono">owner@onewayhr.com • Password: Owner@12345</p>
              </div>
              <span className="text-[10px] font-bold bg-orange-600 text-white px-2 py-0.5 rounded-md">Fill</span>
            </button>
          </div>
        </div>

        {/* Security badge */}
        <p className="mt-4 text-center text-[11px] text-slate-500 font-medium flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span>Multi-Tenant Enterprise Isolation & Statutory Encryption</span>
        </p>
      </div>
    </div>
  );
}
