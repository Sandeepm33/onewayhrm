'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, DEMO_ACCOUNTS } from '@/context/AuthContext';
import {
  Sparkles,
  ShieldCheck,
  Users,
  CreditCard,
  Briefcase,
  Clock,
  FileText,
  CheckCircle2,
  ArrowRight,
  Star,
  Zap,
  BarChart3,
  Lock,
  Building2,
  Check,
  Inbox,
  UserCheck2,
  Laptop,
  Shield,
  HelpCircle,
  TrendingUp,
  Receipt,
  Target,
  ChevronRight,
  AlertCircle,
  ThumbsUp,
  Filter,
} from 'lucide-react';

export default function OneWayHRLandingPage() {
  const router = useRouter();
  const { user, login } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [empCount, setEmpCount] = useState<number>(75);
  const [inboxTab, setInboxTab] = useState<'pending' | 'payroll' | 'compliance'>('pending');
  const [activeModule, setActiveModule] = useState<'payroll' | 'attendance' | 'ats' | 'performance'>('payroll');
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [loggingInRole, setLoggingInRole] = useState<string | null>(null);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const [approvedItems, setApprovedItems] = useState<string[]>([]);

  const handleQuickLaunch = async (acc: typeof DEMO_ACCOUNTS[0]) => {
    setLoggingInRole(acc.role);
    try {
      const ok = await login(acc.email, 'Admin@12345');
      if (ok) {
        router.push('/dashboard');
      }
    } finally {
      setLoggingInRole(null);
    }
  };

  const handleApprove = (id: string) => {
    setApprovedItems((prev) => [...prev, id]);
  };

  // ROI calculations
  const hoursSaved = Math.round(empCount * 1.9);
  const moneySavedInr = Math.round(empCount * 720);

  const inboxItems = [
    {
      id: 'item-1',
      type: 'LEAVE',
      badge: 'Casual Leave',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      title: 'Leave Application (2 Days)',
      author: 'Rahul Sharma • Lead Architect',
      time: '12m ago',
      desc: 'Applied for Oct 29 - Oct 30 (Personal commitments). Balance remaining: 8 days.',
    },
    {
      id: 'item-2',
      type: 'EXPENSE',
      badge: 'Travel Claim',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      title: 'Client Visit Travel Expense (₹4,850)',
      author: 'Priya Patel • Senior HR Manager',
      time: '35m ago',
      desc: 'Bengaluru Airport cab & hotel vouchers attached. Policy compliant.',
    },
    {
      id: 'item-3',
      type: 'ATTENDANCE',
      badge: 'Regularization',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      title: 'Missed Punch Regularization',
      author: 'Aakash Verma • Frontend Dev',
      time: '1h ago',
      desc: 'Client on-site meeting caused missed biometric morning punch (09:45 AM).',
    },
  ];

  const faqs = [
    {
      q: 'How does the OneWayHR "Inbox for HR" save time?',
      a: 'Traditional HR tools bury critical tasks across 10 different menus. Our Inbox aggregates leaves, expense vouchers, biometric regularization, and payroll reviews into a single action-oriented queue. HR leaders and managers can review and approve tasks in 1 click without ever opening multiple screens.',
    },
    {
      q: 'Is the Payroll Engine compliant with all Indian Statutory Laws?',
      a: 'Yes, 100%. OneWayHR natively calculates EPF (12% ceiling at ₹15,000 wage base), ESIC (0.75% / 3.25%), state-specific Professional Tax (Karnataka, Maharashtra, Tamil Nadu, Telangana, etc.), and Section 192 TDS across both the Old and New tax regimes (115BAC).',
    },
    {
      q: 'Can employees access their attendance and payslips on their mobile phones?',
      a: 'Yes! The responsive Employee Self-Service (ESS) web portal allows employees to punch in via geofenced web clock, track real-time attendance logs, request leaves, declare tax investments, and download password-protected PDF payslips instantly.',
    },
    {
      q: 'How long does implementation and employee onboarding take?',
      a: 'Zero implementation delays. With our automated Excel / CSV employee master import and ready-to-run Indian statutory presets, companies go live in under 24 hours.',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-orange-500 selection:text-white">
      {/* TOP ANNOUNCEMENT BAR (HROne Signature Style) */}
      <div className="bg-slate-950 text-white text-xs py-2.5 px-4 text-center font-medium flex items-center justify-center gap-2">
        <span className="px-2 py-0.5 rounded bg-orange-600 text-white text-[10px] font-bold uppercase tracking-wider">
          New Release
        </span>
        <span>OneWayHR India 2026 Edition: Automated Form 16, New Tax Regime (115BAC) & Geofenced Clock-In</span>
        <button
          onClick={() => setDemoModalOpen(true)}
          className="text-orange-400 font-bold hover:underline inline-flex items-center gap-1 ml-1"
        >
          <span>Explore Live</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* HEADER NAVBAR (HROne Signature White Clean Style) */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-700 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900 flex items-center">
                OneWay<span className="text-orange-600 font-black">HR</span>
                <span className="ml-1.5 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
                  HCM Cloud
                </span>
              </span>
              <p className="text-[10px] text-slate-500 font-medium tracking-tight">The Simplest HR Software for India</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-slate-600">
            <a href="#inbox-preview" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
              <span>Inbox for HR</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-orange-100 text-orange-700 font-bold">1st</span>
            </a>
            <a href="#modules" className="hover:text-indigo-600 transition-colors">HCM Suite</a>
            <a href="#compliance" className="hover:text-indigo-600 transition-colors">India Statutory</a>
            <a href="#calculator" className="hover:text-indigo-600 transition-colors">ROI Calculator</a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-indigo-600 transition-colors">FAQ</a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
              >
                <span>Enter Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 hover:text-indigo-600 hover:bg-slate-50 border border-slate-200 transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-orange-500/25 hover:shadow-orange-500/35 transition-all flex items-center gap-1.5"
                >
                  <Zap className="w-4 h-4 fill-white text-white" />
                  <span>Start Free Workspace</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION (HROne Signature High-Impact Clean Style) */}
      <section className="relative pt-12 pb-20 lg:pt-16 lg:pb-28 overflow-hidden bg-gradient-to-b from-slate-50/80 via-white to-white">
        {/* Subtle geometric background elements */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-orange-100/50 via-indigo-50/40 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-indigo-100/40 via-purple-50/30 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Trust Rating Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white border border-slate-200/80 shadow-sm text-xs font-semibold text-slate-700 mb-6">
            <div className="flex items-center gap-0.5 text-amber-400">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            </div>
            <span className="font-bold text-slate-900">4.9 / 5 Rating</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600">Rated #1 Most Intuitive Indian HRMS & Payroll</span>
          </div>

          {/* Main Hero Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-950 max-w-5xl mx-auto leading-[1.12]">
            Make Worklife Simpler With{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-indigo-600 to-violet-600">
              Intelligent HR Automation
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-medium">
            From the world’s first <strong className="text-slate-900 font-bold">1-Click Inbox for HR</strong> to automated Indian statutory payroll (EPF, ESI, TDS, PT). Empower your entire workforce with 3-click simplicity.
          </p>

          {/* CTA Group */}
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-extrabold text-base shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5 fill-white text-white" />
              <span>Create SaaS Workspace Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="#inbox-preview"
              className="w-full sm:w-auto px-7 py-4 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-base border-2 border-slate-200 hover:border-indigo-400 transition-all flex items-center justify-center gap-2"
            >
              <Inbox className="w-4 h-4 text-indigo-600" />
              <span>Explore HR Inbox Tour</span>
            </a>
          </div>

          {/* Guarantee Badges */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              No Credit Card Required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              100% Indian Statutory Compliant
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Ready in 24 Hours
            </span>
          </div>

          {/* SOCIAL PROOF BRAND LOGO STRIP (HROne Style) */}
          <div className="mt-16 pt-10 border-t border-slate-200">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6">
              Trusted by 1,200+ Fast-Growing Companies Across India
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-70 grayscale hover:grayscale-0 transition-all">
              <span className="text-lg font-black tracking-tighter text-slate-800">SWIGGY</span>
              <span className="text-lg font-extrabold tracking-tight text-slate-800">Haier</span>
              <span className="text-lg font-black text-slate-800">CARS<span className="text-orange-500">24</span></span>
              <span className="text-lg font-extrabold tracking-wider text-slate-800">DELHIVERY</span>
              <span className="text-lg font-bold text-slate-800">lenskart</span>
              <span className="text-lg font-bold tracking-tight text-slate-800">mamaearth</span>
            </div>
          </div>
        </div>
      </section>

      {/* SIGNATURE HRONE FEATURE: "THE INBOX FOR HR" (INTERACTIVE DEMO) */}
      <section id="inbox-preview" className="py-20 bg-slate-50 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-extrabold tracking-wide uppercase">
              <Inbox className="w-3.5 h-3.5" />
              World&apos;s 1st Inbox for HR
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 mt-4 tracking-tight">
              Say Goodbye to 50 HR Tabs. Say Hello to 1 Inbox.
            </h2>
            <p className="text-slate-600 text-base sm:text-lg mt-3">
              Just like your email inbox, all employee approvals, regularization requests, expense claims, and statutory deadlines arrive in one actionable feed.
            </p>
          </div>

          {/* Interactive HROne Inbox Component */}
          <div className="max-w-5xl mx-auto bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden">
            {/* Window Top Header */}
            <div className="bg-slate-900 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>
                <div className="h-4 w-px bg-slate-700" />
                <span className="text-white font-bold text-sm flex items-center gap-2">
                  <Inbox className="w-4 h-4 text-orange-400" />
                  OneWayHR Unified Action Inbox
                </span>
              </div>

              {/* Inbox Filter Switcher */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-800 text-xs">
                <button
                  onClick={() => setInboxTab('pending')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    inboxTab === 'pending' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Pending Approvals (3)
                </button>
                <button
                  onClick={() => setInboxTab('payroll')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    inboxTab === 'payroll' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Payroll Action (1)
                </button>
                <button
                  onClick={() => setInboxTab('compliance')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    inboxTab === 'compliance' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Statutory Alerts (2)
                </button>
              </div>
            </div>

            {/* Inbox List View */}
            <div className="p-6 divide-y divide-slate-100">
              {inboxTab === 'pending' && (
                <div className="space-y-4">
                  {inboxItems.map((item) => {
                    const isApproved = approvedItems.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        className={`p-5 rounded-2xl border transition-all ${
                          isApproved
                            ? 'bg-emerald-50/60 border-emerald-200'
                            : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2.5">
                            <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${item.badgeColor}`}>
                              {item.badge}
                            </span>
                            <span className="font-extrabold text-slate-900 text-base">{item.title}</span>
                          </div>
                          <span className="text-xs font-semibold text-slate-400">{item.time}</span>
                        </div>

                        <p className="text-xs font-medium text-slate-600 mb-2">{item.author}</p>
                        <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          {item.desc}
                        </p>

                        <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100">
                          <span className="text-[11px] text-slate-400 font-medium">
                            {isApproved ? 'Status: Approved & Synced to Database' : 'Requires Manager Sign-off'}
                          </span>

                          <div className="flex items-center gap-2">
                            {isApproved ? (
                              <span className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5">
                                <Check className="w-3.5 h-3.5" />
                                Approved & Synced
                              </span>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleApprove(item.id)}
                                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  1-Click Approve
                                </button>
                                <button
                                  onClick={() => handleApprove(item.id)}
                                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {inboxTab === 'payroll' && (
                <div className="p-6 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto font-bold">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">October 2026 Payroll Run Ready For Sign-Off</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                      Total Net Disbursal: ₹4,57,600 across 4 active staff. Biometric attendance hours reconciled with 0 discrepancies.
                    </p>
                  </div>
                  <button
                    onClick={() => setDemoModalOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-600/20"
                  >
                    Open Payroll Review Sheet
                  </button>
                </div>
              )}

              {inboxTab === 'compliance' && (
                <div className="p-6 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto font-bold">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">PF & ESI Monthly Challan Validation Passed</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                      Statutory electronic challans (ECR) for EPFO portal verified with zero rejected UAN records.
                    </p>
                  </div>
                  <button
                    onClick={() => setDemoModalOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
                  >
                    Download Pre-Filled ECR File
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FULL HCM MODULE SUITE (HROne 8 Core Pillars) */}
      <section id="modules" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs uppercase font-extrabold tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
            Complete Enterprise HCM
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-950 mt-4 tracking-tight">
            One Unified Platform. Every HR Workflow.
          </h2>
          <p className="text-slate-600 text-base sm:text-lg mt-3">
            Designed specifically for Indian statutory guidelines, diverse shift rosters, and fast-scaling organizations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-xl transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Payroll & Compensation</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Automated 12% EPF, ESI (0.75%), state-wise PT, and Section 192 TDS. Direct bank NEFT text file downloads.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-orange-400 hover:shadow-xl transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold mb-4 group-hover:bg-orange-500 group-hover:text-white transition-colors">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Attendance & Geofencing</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Office web clock with location validation, biometric hardware integration, overtime engine, and night shifts.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-purple-400 hover:shadow-xl transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Briefcase className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Recruitment & ATS</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Visual job boards, candidate scoring, automated offer letters, and 1-click conversion to employee profiles.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-xl transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <UserCheck2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Employee Self-Service (ESS)</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Mobile-friendly portal for leave tracking, tax declarations (Old vs New Regime), and PDF payslip downloads.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-xl transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold mb-4 group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Document Generation</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Automated generation of Offer Letters, NDA agreements, Appointment Letters, and Relieving Certificates.
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-pink-400 hover:shadow-xl transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center font-bold mb-4 group-hover:bg-pink-600 group-hover:text-white transition-colors">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Expense & Claims</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Digital receipt upload, travel mileage calculation, multi-level manager approvals, and automated salary payout.
            </p>
          </div>

          {/* Card 7 */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-cyan-400 hover:shadow-xl transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold mb-4 group-hover:bg-cyan-600 group-hover:text-white transition-colors">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Performance & OKRs</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Goal setting, KPI tracking, 360-degree peer feedback, quarterly performance reviews, and rating bell curves.
            </p>
          </div>

          {/* Card 8 */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xl transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Laptop className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Asset Custody Management</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Assign and track laptops, monitors, sim cards, and software licenses with digital employee return acknowledgments.
            </p>
          </div>
        </div>
      </section>

      {/* STATUTORY INDIA COMPLIANCE (HROne Signature Green Block) */}
      <section id="compliance" className="py-20 bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                100% India Compliant
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-white mt-4 tracking-tight leading-tight">
                Built For India. Never Risk an EPFO or Tax Audit Penalty.
              </h2>
              <p className="text-slate-400 text-base mt-4 leading-relaxed">
                Indian labor laws and tax codes are intricate and unforgiving. OneWayHR automatically executes all statutory deductions with pinpoint accuracy.
              </p>

              <div className="mt-8 space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-bold text-white">EPF Act 1952 (12% Statutory Ceiling)</h4>
                    <p className="text-xs text-slate-400">Automates 12% employee share and 12% employer split (8.33% EPS + 3.67% EPF) with ₹15,000 threshold capping.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-bold text-white">ESI Act 1948 (0.75% / 3.25%)</h4>
                    <p className="text-xs text-slate-400">Automatic gross salary cutoff at ₹21,000 per month. Generates monthly contribution challans.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Professional Tax (PT) for All 28 States</h4>
                    <p className="text-xs text-slate-400">Karnataka, Maharashtra, Telangana, West Bengal, and Tamil Nadu slab rules built right into payroll.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Section 192 TDS & New Regime (115BAC)</h4>
                    <p className="text-xs text-slate-400">Employees toggle between Old vs New tax regimes; Section 80C, 80D, standard ₹75,000 deduction auto-computed.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Compliance Stats Dashboard */}
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <span className="text-sm font-bold text-slate-300">Statutory Health Monitor</span>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  100% AUDIT READY
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-xs text-slate-400">EPFO Monthly Filing</span>
                  <p className="text-xl font-bold text-emerald-400 mt-1">Ready in ECR</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-xs text-slate-400">ESIC Challan</span>
                  <p className="text-xl font-bold text-emerald-400 mt-1">Verified</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-xs text-slate-400">Quarterly Form 24Q</span>
                  <p className="text-xl font-bold text-indigo-400 mt-1">Auto-Export</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-xs text-slate-400">Audit Trail Logs</span>
                  <p className="text-xl font-bold text-white mt-1">Immutable</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">Form 16 Part A & B Generator</p>
                  <p className="text-[11px] text-slate-400">Annual digitally signed TDS certificates</p>
                </div>
                <span className="text-xs font-bold text-orange-400">Automated</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE ROI / SAVINGS CALCULATOR (HROne Style) */}
      <section id="calculator" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-14 rounded-3xl bg-slate-50 border border-slate-200/90 shadow-lg">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-widest text-orange-600 bg-orange-100 px-3 py-1 rounded-full">
                Interactive Value Estimator
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-slate-950 mt-4 tracking-tight">
                Calculate How Much Time & Money You Save
              </h2>
              <p className="text-slate-600 text-sm sm:text-base mt-3">
                Drag the slider to your company size and see the immediate monthly operational return.
              </p>

              <div className="mt-8 space-y-3">
                <div className="flex items-center justify-between text-sm font-bold text-slate-800">
                  <span>Current Company Headcount:</span>
                  <span className="text-lg text-orange-600">{empCount} Employees</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="500"
                  step="5"
                  value={empCount}
                  onChange={(e) => setEmpCount(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                />
                <div className="flex justify-between text-xs text-slate-600 font-semibold">
                  <span>15 Staff</span>
                  <span>250 Staff</span>
                  <span>500+ Staff</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-500 uppercase">HR Hours Saved / Mo</p>
                <p className="text-4xl font-extrabold text-indigo-600 mt-2">{hoursSaved} hrs</p>
                <p className="text-[11px] text-slate-500 mt-1">Manual payroll & leave calculations eliminated</p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-500 uppercase">Payroll Processing</p>
                <p className="text-4xl font-extrabold text-orange-600 mt-2">12 mins</p>
                <p className="text-[11px] text-slate-500 mt-1">Down from traditional 3-5 days</p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm sm:col-span-2">
                <p className="text-xs font-bold text-slate-500 uppercase">Direct Annual Savings</p>
                <p className="text-4xl font-black text-emerald-600 mt-2">
                  ₹{(moneySavedInr * 12).toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Combines administrative bandwidth recovery + 0 audit non-compliance penalty guarantees
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING PLANS (HROne Signature Light Cards) */}
      <section id="pricing" className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs uppercase font-extrabold tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
            Transparent Pricing
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-950 mt-4 tracking-tight">
            Simple, Transparent Indian Pricing
          </h2>
          <p className="text-slate-600 text-base sm:text-lg mt-3 max-w-2xl mx-auto">
            Choose the plan that fits your growth stage. No implementation fees, no hidden per-payslip charges.
          </p>

          {/* Toggle */}
          <div className="mt-8 inline-flex items-center gap-3 p-1.5 rounded-2xl bg-slate-100 border border-slate-200">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                billingCycle === 'annual' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>Annual Billing</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-white text-orange-600 font-black">20% OFF</span>
            </button>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto text-left">
            {/* Tier 1 */}
            <div className="p-8 rounded-3xl bg-slate-50/70 border border-slate-200 flex flex-col justify-between hover:shadow-lg transition-all">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Starter</h3>
                <p className="text-xs text-slate-500 mt-1">For early-stage companies and growing teams</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-950">₹{billingCycle === 'annual' ? '39' : '49'}</span>
                  <span className="text-xs font-medium text-slate-500">/ employee / month</span>
                </div>

                <div className="mt-8 space-y-3.5 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Up to 30 Employees</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Employee Master Database</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Attendance & Geofenced Web Clock</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Leave Management</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setDemoModalOpen(true)}
                className="mt-8 w-full py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs border border-slate-200 shadow-sm transition-all"
              >
                Start Free Trial
              </button>
            </div>

            {/* Tier 2: Professional (Featured) */}
            <div className="p-8 rounded-3xl bg-white border-2 border-orange-500 shadow-2xl flex flex-col justify-between relative transform lg:-translate-y-3">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-orange-500 text-white text-[10px] font-black uppercase tracking-wider shadow-md">
                MOST POPULAR IN INDIA
              </span>

              <div>
                <h3 className="text-xl font-bold text-slate-900">Professional</h3>
                <p className="text-xs text-slate-500 mt-1">Complete HR automation with full statutory payroll</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-950">₹{billingCycle === 'annual' ? '69' : '89'}</span>
                  <span className="text-xs font-medium text-slate-500">/ employee / month</span>
                </div>

                <div className="mt-8 space-y-3.5 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-orange-500" />
                    <span className="font-bold text-slate-900">1-Click Unified HR Inbox</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-orange-500" />
                    <span className="font-bold text-slate-900">Full Indian Statutory Payroll</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-orange-500" />
                    <span>EPF, ESIC, State PT, and Section 192 TDS</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-orange-500" />
                    <span>Applicant Tracking System (ATS)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-orange-500" />
                    <span>Cryptographic PDF Payslips</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-orange-500" />
                    <span>Expense Claims & Asset Tracking</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setDemoModalOpen(true)}
                className="mt-8 w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black text-xs shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2"
              >
                <span>Launch Professional Demo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Tier 3: Enterprise */}
            <div className="p-8 rounded-3xl bg-slate-50/70 border border-slate-200 flex flex-col justify-between hover:shadow-lg transition-all">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Enterprise</h3>
                <p className="text-xs text-slate-500 mt-1">For multi-entity corporations and enterprise scale</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-950">Custom</span>
                  <span className="text-xs font-medium text-slate-500">/ volume discount</span>
                </div>

                <div className="mt-8 space-y-3.5 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span className="font-bold text-slate-900">Multi-Entity & Multi-Tenant Support</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Biometric Machine Hardware Bridge</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>ERP Integration (Tally, SAP, Zoho)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Dedicated Compliance Advisor</span>
                  </div>
                </div>
              </div>

              <Link
                href="/login"
                className="mt-8 w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs text-center block transition-all shadow-sm"
              >
                Talk to Enterprise Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-xs uppercase font-extrabold tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
            Frequently Asked Questions
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-950 mt-4 tracking-tight">
            Got Questions? We Have Answers.
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm transition-all"
            >
              <button
                onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between text-base font-bold text-slate-900 hover:text-orange-600 transition-colors"
              >
                <span>{faq.q}</span>
                <span className="text-xl text-slate-400 font-mono ml-4">{faqOpen === idx ? '−' : '+'}</span>
              </button>
              {faqOpen === idx && (
                <div className="px-5 pb-5 text-sm text-slate-600 border-t border-slate-100 pt-4 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* BOTTOM CTA BANNER (HROne Signature Orange Gradient) */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="p-10 sm:p-16 rounded-3xl bg-gradient-to-r from-orange-500 via-orange-600 to-indigo-700 text-white text-center relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Ready to Experience OneWayHR Simplicity?
            </h2>
            <p className="mt-4 text-base sm:text-lg text-white/90 max-w-xl mx-auto">
              Join leading Indian organizations running zero-error payroll and 3-click HR workflows.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-slate-900 font-extrabold text-base shadow-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5 text-orange-600 fill-orange-600" />
                <span>Create Organization Workspace</span>
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-black/20 hover:bg-black/30 text-white font-bold text-base border border-white/30 transition-all"
              >
                Sign In to Workspace
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER (HROne Clean Light Footer) */}
      <footer className="border-t border-slate-200 bg-white py-12 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-slate-900 font-black text-sm">OneWayHR</span>
            <span className="text-slate-300">•</span>
            <span>Intelligent HCM & Payroll Software for India</span>
          </div>

          <div className="flex items-center gap-6 font-semibold">
            <a href="#inbox-preview" className="hover:text-indigo-600 transition-colors">HR Inbox</a>
            <a href="#modules" className="hover:text-indigo-600 transition-colors">HCM Suite</a>
            <a href="#compliance" className="hover:text-indigo-600 transition-colors">Statutory Compliance</a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors">Pricing</a>
            <Link href="/login" className="hover:text-indigo-600 transition-colors">Portal Login</Link>
          </div>

          <p className="text-slate-400 text-center sm:text-right">
            &copy; 2026 OneWayHR Technologies Pvt Ltd. All rights reserved.
          </p>
        </div>
      </footer>

      {/* 1-CLICK INTERACTIVE DEMO PERSONA MODAL */}
      {demoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-600 fill-orange-600" />
                  Select a Role to Test-Drive
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Instant 1-click test drive with pre-seeded multi-tenant records and active MongoDB state.
                </p>
              </div>
              <button
                onClick={() => setDemoModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  disabled={loggingInRole !== null}
                  onClick={() => handleQuickLaunch(acc)}
                  className="p-4 rounded-2xl bg-slate-50 hover:bg-orange-50/60 border border-slate-200 hover:border-orange-300 text-left transition-all group flex items-start justify-between disabled:opacity-50"
                >
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-700 uppercase">
                      {acc.role.replace('_', ' ')}
                    </span>
                    <p className="text-sm font-bold text-slate-900 mt-1.5">{acc.name}</p>
                    <p className="text-xs text-slate-500">{acc.label}</p>
                  </div>
                  <span className="text-slate-400 group-hover:text-orange-600 transition-colors text-sm font-bold mt-1">
                    {loggingInRole === acc.role ? '...' : '→'}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Password for all accounts: <code className="text-indigo-600 font-mono font-bold">Admin@12345</code></span>
              <button
                onClick={() => setDemoModalOpen(false)}
                className="text-slate-500 hover:text-slate-900 font-bold"
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
