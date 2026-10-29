'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Sparkles,
  Shield,
  ArrowRight,
  Lock,
  Mail,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle2,
  Users,
  Building2,
  Check,
  AlertCircle,
  HelpCircle,
  ArrowLeft,
  Zap,
  Award,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filledFeedback, setFilledFeedback] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res: any = await login(email, password);
    setLoading(false);

    if (res === true || res?.success) {
      if (res?.mustChangePassword) {
        router.push('/reset-password?mustReset=true');
      } else {
        router.push('/dashboard');
      }
    } else {
      setError('Invalid credentials. Please verify your Corporate Email / Employee ID and password.');
    }
  };

  const handleQuickFill = (targetEmail: string, targetPass: string, label: string) => {
    setEmail(targetEmail);
    setPassword(targetPass);
    setError('');
    setFilledFeedback(`${label} credentials loaded!`);
    setTimeout(() => {
      setFilledFeedback(null);
    }, 2800);
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-900 text-slate-900 antialiased selection:bg-orange-500 selection:text-white">
      {/* ─────────────────────────────────────────────────────────────
          LEFT SIDE: Visually rich image showcase & brand value props
          ───────────────────────────────────────────────────────────── */}
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-5/12 flex-col justify-between overflow-hidden bg-slate-950 text-white p-10 xl:p-14">
        {/* Real Workplace Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/login-bg.jpg"
            alt="OneWayHR Modern Workplace"
            className="w-full h-full object-cover object-center scale-105 transform motion-safe:animate-pulse [animation-duration:12s]"
          />
          {/* Deep cinematic overlay gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-950/50" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-transparent" />
          <div className="absolute inset-0 bg-indigo-950/30 mix-blend-multiply" />
        </div>

        {/* Ambient atmospheric glow spots */}
        <div className="absolute top-1/4 -left-16 w-80 h-80 bg-orange-500/20 rounded-full blur-[120px] pointer-events-none z-0" />
        <div className="absolute bottom-1/3 -right-16 w-96 h-96 bg-indigo-500/25 rounded-full blur-[140px] pointer-events-none z-0" />

        {/* TOP BRAND HEADER */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-700 flex items-center justify-center text-white shadow-xl shadow-indigo-600/30 ring-1 ring-white/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-white">
                OneWay<span className="text-orange-500">HR</span>
              </span>
              <span className="ml-2 text-[10px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-full bg-white/10 text-orange-400 border border-white/10 backdrop-blur-sm">
                SaaS v2.4
              </span>
            </div>
          </Link>

          {/* System status pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/70 border border-white/10 backdrop-blur-md text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px] font-semibold text-slate-200">Systems Operational</span>
          </div>
        </div>

        {/* MIDDLE VALUE SHOWCASE & FLOATING CARDS */}
        <div className="relative z-10 my-auto py-8 space-y-8 max-w-lg">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-bold tracking-wide uppercase">
              <Zap className="w-3.5 h-3.5" />
              <span>Enterprise Human Capital Suite</span>
            </div>
            <h2 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Empowering people, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-indigo-300">
                streamlining enterprise
              </span>{' '}
              operations.
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed font-normal">
              Unified real-time attendance, 1-click statutory payroll, biometric geofencing, and multi-tenant compliance across all your branches.
            </p>
          </div>

          {/* Floating Glassmorphic Feature Metrics */}
          <div className="space-y-3">
            {/* Metric 1: Payroll */}
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-2xl flex items-center justify-between hover:bg-white/15 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Automated Statutory Payroll</p>
                  <p className="text-[11px] text-slate-300">EPF, ESI, TDS & Form 16 ready</p>
                </div>
              </div>
              <span className="text-xs font-black text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                99.98% Accuracy
              </span>
            </div>

            {/* Metric 2: Multi-Tenant Scale */}
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-2xl flex items-center justify-between hover:bg-white/15 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-400/30 flex items-center justify-center text-orange-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Multi-Tenant Isolation</p>
                  <p className="text-[11px] text-slate-300">50,000+ Active Personnel across branches</p>
                </div>
              </div>
              <span className="text-xs font-black text-orange-400 bg-orange-950/60 px-2.5 py-1 rounded-lg border border-orange-500/30">
                Zero Data Leak
              </span>
            </div>

            {/* Testimonial Snippet */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-900/60 backdrop-blur-md border border-indigo-500/20">
              <p className="text-xs text-slate-200 italic leading-relaxed">
                &ldquo;OneWayHR automated our 4-state statutory compliance and reduced our monthly payroll processing time from 4 days down to 15 minutes.&rdquo;
              </p>
              <div className="mt-3 flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-[10px] font-black flex items-center justify-center text-white">
                  VS
                </div>
                <div className="text-[11px]">
                  <span className="font-bold text-white">Vikramaditya Singhania</span>
                  <span className="text-slate-400 font-normal"> — Managing Director, TechCorp</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM COMPLIANCE BADGES */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 hover:text-slate-200 transition-colors">
              <Shield className="w-3.5 h-3.5 text-orange-400" /> SOC2 Type II Certified
            </span>
            <span className="flex items-center gap-1.5 hover:text-slate-200 transition-colors">
              <Lock className="w-3.5 h-3.5 text-indigo-400" /> 256-Bit SSL Encrypted
            </span>
          </div>
          <span>© 2026 OneWayHR</span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          RIGHT SIDE: Modern, high-conversion, intuitive Login Portal
          ───────────────────────────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 xl:w-7/12 flex flex-col justify-between bg-slate-50 relative p-6 sm:p-10 xl:p-14 min-h-screen overflow-y-auto">
        {/* Soft background glows */}
        <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-orange-100/60 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-100/50 rounded-full blur-[140px] pointer-events-none" />

        {/* TOP NAV BAR */}
        <div className="relative z-10 flex items-center justify-between mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-orange-600 transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-200/50"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to OneWayHR Home</span>
          </Link>

          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-200/50 cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Need Help?</span>
          </button>
        </div>

        {/* MAIN SIGN-IN CONTAINER */}
        <div className="relative z-10 max-w-md w-full mx-auto my-auto py-4">
          {/* Mobile Logo visible only when screen < lg */}
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-700 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900">
                OneWay<span className="text-orange-600">HR</span>
              </span>
              <span className="ml-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-orange-50 text-orange-600 border border-orange-200">
                SaaS Portal
              </span>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              Sign In to Workspace
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
              Access your employee portal, HRMS management, or platform control console.
            </p>
          </div>

          {/* Feedback pill when quick fill used */}
          {filledFeedback && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{filledFeedback}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold text-rose-900">Sign in failed</p>
                <p className="text-[11px] text-rose-700 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* LOGIN FORM CARD */}
          <div className="bg-white border border-slate-200/90 shadow-xl shadow-slate-200/50 rounded-3xl p-6 sm:p-8 backdrop-blur-xl transition-all">
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email / Employee ID */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Corporate Email or Employee ID
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-3 text-slate-400 pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@company.com or EMP001"
                    className="w-full bg-slate-50/80 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 font-medium leading-relaxed">
                  Employees can sign in with their assigned Employee ID. Default password:{' '}
                  <span className="font-mono text-slate-700 font-bold bg-slate-100 px-1 py-0.5 rounded">
                    Welcome@123
                  </span>
                </p>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Password
                  </label>
                  <Link
                    href="/reset-password"
                    className="text-[11px] font-bold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute left-3.5 top-3 text-slate-400 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-slate-50/80 border border-slate-200 rounded-xl pl-10 pr-11 py-2.5 text-xs text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-0.5 rounded"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300 accent-orange-600 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-600">
                    Keep me signed in for 30 days
                  </span>
                </label>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold text-xs shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
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

            {/* ─────────────────────────────────────────────────────────────
                PRESETS & QUICK-FILL: Platform Owner & Demo Accounts
                ───────────────────────────────────────────────────────────── */}
            <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-orange-500" />
                  <span>Quick Access Demo Accounts</span>
                </p>
                <span className="text-[10px] text-slate-400 font-semibold">1-Click Fill</span>
              </div>

              {/* SaaS Master Account (Platform Owner) */}
              <button
                type="button"
                onClick={() =>
                  handleQuickFill('owner@onewayhr.com', 'Owner@12345', 'Platform Owner')
                }
                className="w-full p-2.5 rounded-xl bg-gradient-to-r from-orange-50/90 to-amber-50/90 hover:from-orange-100 hover:to-amber-100 border border-orange-200/80 text-left transition-all flex items-center justify-between group cursor-pointer shadow-sm hover:shadow"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-orange-600" />
                    <span className="text-xs font-extrabold text-orange-950 group-hover:text-orange-700">
                      SaaS Master: Platform Owner
                    </span>
                    <span className="text-[9px] font-bold bg-orange-600/10 text-orange-700 px-1.5 py-0.2 rounded border border-orange-300">
                      Master
                    </span>
                  </div>
                  <p className="text-[10px] text-orange-800/80 font-mono mt-0.5">
                    owner@onewayhr.com • Password: Owner@12345
                  </p>
                </div>
                <span className="text-[10px] font-bold bg-orange-600 hover:bg-orange-700 text-white px-2.5 py-1 rounded-lg transition-colors shadow-sm">
                  Fill
                </span>
              </button>

              {/* Other fast roles (Org Admin & Staff) */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    handleQuickFill('admin@techcorp.in', 'Admin@12345', 'Org Admin')
                  }
                  className="p-2 rounded-xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-200 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800 group-hover:text-indigo-600 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-indigo-500" />
                      <span>Org Admin</span>
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 group-hover:text-indigo-600">
                      Fill
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-500 font-mono truncate mt-0.5">admin@techcorp.in</p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleQuickFill('employee@techcorp.in', 'Admin@12345', 'Employee')
                  }
                  className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-200 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800 group-hover:text-emerald-600 flex items-center gap-1">
                      <Users className="w-3 h-3 text-emerald-500" />
                      <span>Employee</span>
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 group-hover:text-emerald-600">
                      Fill
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-500 font-mono truncate mt-0.5">employee@techcorp.in</p>
                </button>
              </div>
            </div>
          </div>

          {/* Security & Isolation Assurance */}
          <div className="mt-5 text-center space-y-2">
            <p className="text-[11px] text-slate-500 font-medium flex items-center justify-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Multi-Tenant Enterprise Isolation & Statutory Encryption</span>
            </p>
            <div className="flex items-center justify-center gap-3 text-[11px] text-slate-400">
              <Link href="/" className="hover:text-slate-600 transition-colors">
                Privacy Policy
              </Link>
              <span>•</span>
              <Link href="/" className="hover:text-slate-600 transition-colors">
                Terms of Service
              </Link>
              <span>•</span>
              <Link href="/" className="hover:text-slate-600 transition-colors">
                System Status
              </Link>
            </div>
          </div>
        </div>

        {/* Empty bottom spacer for balance */}
        <div className="hidden lg:block h-6" />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          HELP / PASSWORD RESET MODAL
          ───────────────────────────────────────────────────────────── */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mb-4">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900">
              Sign-In & Password Assistance
            </h3>
            <div className="mt-3 space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-900 mb-1">Are you an Employee?</p>
                <p>
                  You can sign in with your <span className="font-semibold text-slate-800">Corporate Email</span> or your assigned <span className="font-semibold text-slate-800">Employee ID</span> (e.g. EMP001). Default employee password is <code className="font-mono text-orange-600 font-bold">Welcome@123</code>.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-900 mb-1">Forgot your password?</p>
                <p>
                  Please reach out directly to your company's <span className="font-semibold text-slate-800">HR Administrator</span> or <span className="font-semibold text-slate-800">IT Helpdesk</span> to have your credentials reset securely.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-900 mb-1">Platform Super Admin?</p>
                <p>
                  Platform Owners use master authorization (<code className="font-mono text-indigo-600 font-bold">owner@onewayhr.com</code>) to manage multi-tenant provisioning.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-2">
              <Link
                href="/reset-password"
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
              >
                <span>Reset Password via Email</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
