'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { DEFAULT_SAAS_FEATURES } from '@/config/features';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  CalendarDays,
  CreditCard,
  FileText,
  Clock,
  Receipt,
  Target,
  Laptop,
  HelpCircle,
  BarChart3,
  Settings,
  ShieldCheck,
  ShieldAlert,
  LogOut,
  Building2,
  ChevronDown,
  Briefcase,
  UserCheck2,
  Bell,
  Sparkles,
  Menu,
  X,
  Sliders,
  Shield,
  PlusCircle,
  ChevronRight,
  Network,
  Layers,
  PieChart,
  CheckSquare,
  Users2,
  User,
} from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  LayoutDashboard,
  Users,
  User,
  UserCheck,
  CalendarDays,
  CreditCard,
  Receipt,
  FileText,
  Clock,
  Target,
  Laptop,
  HelpCircle,
  BarChart3,
  UserCheck2,
  Settings,
  ShieldCheck,
  Briefcase,
  Building2,
  Users2,
  Shield,
  Network,
  Layers,
  PieChart,
  CheckSquare,
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, roleData, organization, logout, hasPermission, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

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
  // 3. Specific User explicitly granted by Organization Admin
  // 4. Specific Role granted settings permission by Organization Admin
  const canConfigSaas =
    isPlatformOwner ||
    isOrgAdmin ||
    Boolean(user?.canCustomizeSaas) ||
    hasPermission('settings', 'view');

  // If not authenticated, redirect to /login inside useEffect
  useEffect(() => {
    if (!loading && !user && pathname !== '/login' && pathname !== '/register' && pathname !== '/') {
      router.push('/login');
    }
  }, [loading, user, pathname, router]);

  // If still loading session
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-700">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wide text-slate-800">Connecting to OneWayHR SaaS Workspace...</p>
      </div>
    );
  }

  // If not authenticated, render null while useEffect redirects
  if (!user && pathname !== '/login' && pathname !== '/register' && pathname !== '/') {
    return null;
  }

  const userRole = user?.role || 'Employee';

  // DYNAMIC FEATURE CUSTOMIZATION:
  const orgFeatures = organization?.features && organization.features.length > 0
    ? organization.features
    : DEFAULT_SAAS_FEATURES;

  const visibleNavItems = orgFeatures
    .filter((feat) => feat.enabled)
    .filter((feat) => {
      // SaaS Settings (key: 'settings') is strictly reserved for Organization Admin,
      // or to others ONLY IF Org Admin gave access to that specific user or role
      if (feat.key === 'settings') {
        return canConfigSaas;
      }
      return isPlatformOwner || hasPermission(feat.key, 'view');
    })
    .map((feat) => ({
      name: feat.name,
      href: feat.href || `/${feat.key}`,
      icon: ICON_MAP[feat.icon] || LayoutDashboard,
      key: feat.key,
      badge: feat.key === 'payroll' ? 'India' : feat.key === 'settings' ? 'Admin' : undefined,
    }));

  const finalNavItems = [
    ...(isPlatformOwner
      ? [
          {
            name: 'SaaS Owner Console',
            href: '/super-admin',
            icon: ShieldCheck,
            key: 'super-admin',
            badge: 'Platform Owner',
          },
        ]
      : []),
    ...visibleNavItems,
    {
      name: 'My Profile',
      href: '/profile',
      icon: User,
      key: 'profile',
      badge: 'Account',
    },
  ];

  const currentModule = pathname.replace(/^\//, '').split('/')[0];
  const isProtectedModule =
    currentModule &&
    currentModule !== 'dashboard' &&
    currentModule !== 'self-service' &&
    currentModule !== 'profile';
  const hasAccessToCurrentPage =
    currentModule === 'settings'
      ? canConfigSaas
      : (!isProtectedModule || isPlatformOwner || hasPermission(currentModule, 'view'));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-orange-500 selection:text-white">
      {/* TOPBAR (HROne Clean White Style) */}
      <header className="h-16 border-b border-slate-200/90 bg-white sticky top-0 z-40 px-4 lg:px-6 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Logo Brand */}
          <a href={isPlatformOwner ? '/super-admin' : '/dashboard'} className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-700 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-slate-950 flex items-center">
                OneWay<span className="text-orange-600 font-black">HR</span>
                <span className="ml-1.5 text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-orange-50 text-orange-600 border border-orange-200">
                  {isPlatformOwner ? 'Master' : 'Cloud'}
                </span>
              </span>
              <p className="text-[10px] text-slate-500 font-medium -mt-0.5">Enterprise HCM & Payroll</p>
            </div>
          </a>

          {/* Org Pill or Platform Owner Root Badge */}
          {organization ? (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/90 border border-slate-200 text-xs text-slate-700">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span className="font-bold text-slate-900">{organization.name}</span>
              <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold uppercase tracking-wider">
                {organization.plan || 'SaaS'}
              </span>
            </div>
          ) : isPlatformOwner ? (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
              <span className="font-bold text-orange-950">SaaS Multi-Tenant Root</span>
              <span className="px-1.5 py-0.5 bg-orange-600 text-white rounded text-[10px] font-bold uppercase tracking-wider">
                Platform Owner
              </span>
            </div>
          ) : null}
        </div>

        {/* Right Action Icons & Role Display */}
        <div className="flex items-center gap-3">
          {/* Custom Role Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5 text-indigo-600" />
            <span>Role: <strong className="text-indigo-950">{isPlatformOwner ? 'Platform Owner' : userRole}</strong></span>
            {isPlatformOwner && (
              <span className="text-[9px] bg-orange-600 text-white font-extrabold px-1.5 py-0.5 rounded uppercase">Master</span>
            )}
          </div>

          {/* Quick Action Button (HROne Signature Coral/Orange Button) */}
          {isPlatformOwner ? (
            <a
              href="/super-admin"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xs font-extrabold shadow-md shadow-orange-500/20 transition-all cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Provision Organization</span>
            </a>
          ) : canConfigSaas ? (
            <a
              href="/settings"
              title="Customize Roles & Features (Org Admin / Authorized)"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold border border-slate-200 shadow-xs transition-all cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-orange-600" />
              <span>Customize SaaS</span>
            </a>
          ) : null}

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 relative transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" />
            </button>

            {notifDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-slate-200 shadow-2xl p-4 z-50 text-slate-900">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                  <h4 className="text-xs font-bold text-slate-900">Real-Time Action Feed</h4>
                  <span className="text-[10px] text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full font-bold">Live</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="font-bold text-slate-900">Workspace Connected</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Isolated tenant partitioning and dynamic role controls are active.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile & Interactive Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 pl-2 border-l border-slate-200 hover:bg-slate-50 p-1 rounded-2xl transition-all cursor-pointer text-left"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-orange-500 flex items-center justify-center text-xs font-bold text-white uppercase shadow-sm">
                {user?.name?.slice(0, 2) || 'OW'}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-slate-900 truncate max-w-[120px] leading-tight">{user?.name}</p>
                <p className="text-[10px] text-slate-500 truncate max-w-[120px] font-medium leading-tight">{user?.role || 'Member'}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-2xl p-2 z-50 text-slate-900">
                <div className="p-3 border-b border-slate-100 mb-1.5 bg-slate-50/70 rounded-xl">
                  <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                  <p className="text-[10px] text-slate-500 truncate font-mono">{user?.email}</p>
                  <span className="inline-block mt-1.5 text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-200">
                    {user?.role || 'Staff Member'}
                  </span>
                </div>

                <div className="space-y-0.5 text-xs font-medium">
                  <a
                    href="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-800 hover:bg-orange-50 hover:text-orange-700 transition-colors font-bold"
                  >
                    <User className="w-4 h-4 text-orange-500" />
                    <span>My Profile</span>
                  </a>

                  <a
                    href="/self-service"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <UserCheck2 className="w-4 h-4 text-indigo-500" />
                    <span>My Self-Service</span>
                  </a>

                  {canConfigSaas && (
                    <a
                      href="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <Sliders className="w-4 h-4 text-purple-500" />
                      <span>SaaS Settings</span>
                    </a>
                  )}
                </div>

                <div className="pt-1.5 mt-1.5 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold text-xs transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* BODY WITH SIDEBAR */}
      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR (HROne Crisp White Navigation Style) */}
        <aside className="w-64 border-r border-slate-200/90 bg-white hidden lg:flex flex-col justify-between shrink-0 overflow-y-auto">
          <div className="p-3.5 space-y-1">
            <div className="flex items-center justify-between px-3 py-2 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
              <span>{isPlatformOwner ? 'Master Controls' : 'Dynamic Modules'}</span>
              <span className="text-[10px] text-orange-600 font-mono font-bold">({finalNavItems.length})</span>
            </div>
            {finalNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <a
                  key={item.key}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-orange-50 text-orange-600 font-bold border-l-4 border-orange-500 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-orange-600' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wider ${
                        isActive
                          ? 'bg-orange-600 text-white'
                          : item.key === 'super-admin'
                          ? 'bg-orange-100 text-orange-700 border border-orange-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </a>
              );
            })}
          </div>

          {/* Database & Infrastructure Footer Card */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/70 text-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1 font-semibold">
              <span className="text-[11px]">System Status</span>
              <span className="flex items-center gap-1.5 text-emerald-600 font-bold text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                {isPlatformOwner ? 'Platform Master' : 'Tenant Active'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono truncate">
              {isPlatformOwner ? 'master-control' : organization?.slug || 'tenant-isolated'}
            </p>
          </div>
        </aside>

        {/* MOBILE DRAWER */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            <div className="relative w-72 bg-white border-r border-slate-200 flex flex-col justify-between p-4 z-50 shadow-2xl">
              <div className="space-y-1 overflow-y-auto">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                  <span className="font-extrabold text-slate-950 text-base">OneWayHR Menu</span>
                  <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-slate-900">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {finalNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <a
                      key={item.key}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold ${
                        isActive ? 'bg-orange-50 text-orange-600 font-bold border-l-4 border-orange-500' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-slate-400" />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 font-bold">{item.badge}</span>}
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* MAIN CANVAS (HROne Signature Soft Grey Canvas #f8fafc) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#f8fafc]">
          <div className="max-w-7xl mx-auto space-y-6">
            {!hasAccessToCurrentPage ? (
              <div className="p-8 sm:p-12 max-w-xl mx-auto my-12 text-center rounded-3xl bg-white border border-slate-200 shadow-md space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-black text-slate-900">Access Restricted</h2>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Your assigned role (<span className="font-bold text-slate-800">{roleData?.name || userRole}</span>) does not have permission to access the <span className="font-mono font-bold text-rose-600 uppercase">{currentModule}</span> module.
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
            ) : (
              children
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
