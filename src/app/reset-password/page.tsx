'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  Shield,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Mail,
  ArrowLeft,
  KeyRound,
} from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tokenParam = searchParams.get('token') || '';
  const mustResetParam = searchParams.get('mustReset') === 'true';

  const [mode, setMode] = useState<'REQUEST_LINK' | 'SET_NEW_PASSWORD'>(
    tokenParam || mustResetParam ? 'SET_NEW_PASSWORD' : 'REQUEST_LINK'
  );

  // Request Link State
  const [email, setEmail] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState('');

  // Set Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (tokenParam || mustResetParam) {
      setMode('SET_NEW_PASSWORD');
    }
  }, [tokenParam, mustResetParam]);

  // Handle Request Reset Link
  const handleRequestLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestLoading(true);
    setRequestError('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setRequestSent(true);
      } else {
        setRequestError(data.error || 'Failed to dispatch reset email.');
      }
    } catch (err: any) {
      setRequestError(err.message || 'Network error');
    } finally {
      setRequestLoading(false);
    }
  };

  // Handle Set Permanent Password
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setSubmitError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setSubmitError('Passwords do not match. Please verify your entries.');
      return;
    }

    setSubmitLoading(true);
    setSubmitError('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tokenParam || undefined,
          newPassword,
          oldPassword: oldPassword || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmitSuccess(true);
        setTimeout(() => {
          router.push('/dashboard');
        }, 2500);
      } else {
        setSubmitError(data.error || 'Failed to update password.');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Network error');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Password Strength calculation
  const getPasswordStrength = () => {
    if (!newPassword) return 0;
    let score = 0;
    if (newPassword.length >= 8) score += 1;
    if (/[A-Z]/.test(newPassword)) score += 1;
    if (/[0-9]/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;
    return score;
  };
  const strength = getPasswordStrength();

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-slate-900 p-4 sm:p-6 relative overflow-hidden text-slate-900 antialiased selection:bg-orange-500 selection:text-white">
      {/* Background ambient accents */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-500/15 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/20 blur-[140px] rounded-full pointer-events-none" />

      {/* Brand Header */}
      <div className="text-center mb-8 relative z-10">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-700 flex items-center justify-center text-white shadow-xl shadow-indigo-600/30 ring-1 ring-white/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white">
            OneWay<span className="text-orange-500">HR</span>
          </span>
        </Link>
      </div>

      {/* Main Card */}
      <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/90 relative z-10 backdrop-blur-xl">
        {/* SUCCESS CONFIRMATION */}
        {submitSuccess ? (
          <div className="text-center py-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-slate-900">Password Updated!</h2>
            <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
              Your permanent password has been saved and your account is now fully secured. Redirecting you to your workspace...
            </p>
            <div className="pt-2">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-orange-600 bg-orange-50 px-4 py-2 rounded-xl">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Launching Dashboard...</span>
              </div>
            </div>
          </div>
        ) : mode === 'REQUEST_LINK' ? (
          /* ─────────────────────────────────────────────────────────────
             MODE 1: REQUEST PASSWORD RESET EMAIL
             ───────────────────────────────────────────────────────────── */
          <div>
            <div className="mb-6">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mb-3">
                <KeyRound className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-black text-slate-900">Reset Password</h1>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Enter your registered corporate email or employee ID. We&apos;ll dispatch a secure reset link to your inbox.
              </p>
            </div>

            {requestSent ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Check Your Inbox!</span>
                </div>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  We&apos;ve sent reset instructions to <strong className="font-semibold">{email}</strong>. Please click the link inside the email to set your new password.
                </p>
                <div className="pt-2 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setRequestSent(false)}
                    className="font-bold text-emerald-800 hover:underline cursor-pointer"
                  >
                    Try another email
                  </button>
                  <Link href="/login" className="font-bold text-orange-600 hover:underline">
                    Back to Sign In →
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRequestLink} className="space-y-4">
                {requestError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{requestError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Corporate Email or Employee ID
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="name@company.com or EMP001"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={requestLoading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold text-xs shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {requestLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending Email...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Reset Link</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Return to Login</span>
                  </Link>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* ─────────────────────────────────────────────────────────────
             MODE 2: SET PERMANENT PASSWORD (TOKEN OR FIRST-TIME RESET)
             ───────────────────────────────────────────────────────────── */
          <div>
            <div className="mb-6">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mb-3">
                <Lock className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-black text-slate-900">
                {mustResetParam ? 'Set Permanent Password' : 'Create New Password'}
              </h1>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {mustResetParam
                  ? 'For security compliance, you must replace your temporary password with a permanent personal password.'
                  : 'Please enter your new secure password below.'}
              </p>
            </div>

            {submitError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSetPassword} className="space-y-4">
              {/* Optional Old Password if authenticated without token */}
              {!tokenParam && !mustResetParam && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                  />
                </div>
              )}

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  New Permanent Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="At least 6 characters"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-11 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password strength bar */}
                {newPassword && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1 h-1">
                      <div className={`h-full flex-1 rounded-full ${strength >= 1 ? 'bg-orange-500' : 'bg-slate-200'}`} />
                      <div className={`h-full flex-1 rounded-full ${strength >= 2 ? 'bg-amber-500' : 'bg-slate-200'}`} />
                      <div className={`h-full flex-1 rounded-full ${strength >= 3 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                      <div className={`h-full flex-1 rounded-full ${strength >= 4 ? 'bg-emerald-600' : 'bg-slate-200'}`} />
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {strength <= 1 ? 'Weak' : strength <= 3 ? 'Good' : 'Strong & Secure'}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Confirm Permanent Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Re-enter your password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-11 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold text-xs shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {submitLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Password...</span>
                  </>
                ) : (
                  <>
                    <span>Set Password & Activate</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Cancel & Back to Sign In</span>
                </Link>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Security footer */}
      <div className="mt-6 text-center text-xs text-slate-400 relative z-10 flex items-center gap-1.5">
        <Shield className="w-3.5 h-3.5 text-emerald-400" />
        <span>Enterprise SSL Encryption • Multi-Tenant Compliant</span>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs">
          Loading Security Service...
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

