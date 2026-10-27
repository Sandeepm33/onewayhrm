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
} from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  LayoutDashboard,
  Users,
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
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, roleData, organization, logout, hasPermission, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const isPlatformOwner = user?.role === 'SUPER_ADMIN' || user?.role === 'PLATFORM_OWNER';

  // If not authenticated, redirect to /login inside useEffect (avoids setState during render)
  useEffect(() => {
    if (!loading && !user && pathname !== '/login' && pathname !== '/register' && pathname !== '/') {
      router.push('/login');
    }
  }, [loading, user, pathname, router]);

  // If still loading session
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium tracking-wide">Connecting to OneWayHR SaaS Workspace...</p>
      </div>
    );
  }

  // If not authenticated, render null while useEffect redirects
  if (!user && pathname !== '/login' && pathname !== '/register' && pathname !== '/') {
    return null;
  }

  const userRole = user?.role || 'Admin';

  // DYNAMIC FEATURE CUSTOMIZATION:
  // 1. Read features from organization (which can be customized/renamed/toggled by the tenant)
  const orgFeatures = organization?.features && organization.features.length > 0
    ? organization.features
    : DEFAULT_SAAS_FEATURES;

  // 2. Filter only features that are enabled by the tenant AND allowed by user's custom role
  const visibleNavItems = orgFeatures
    .filter((feat) => feat.enabled)
    .filter((feat) => isPlatformOwner || hasPermission(feat.key, 'view'))
    .map((feat) => ({
      name: feat.name,
      href: feat.href || `/${feat.key}`,
      icon: ICON_MAP[feat.icon] || LayoutDashboard,
      key: feat.key,
      badge: feat.key === 'payroll' ? 'India' : feat.key === 'settings' ? 'SaaS' : undefined,
    }));

  // If Platform Owner, put Owner Console at the top
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
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* TOPBAR */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <a href={isPlatformOwner ? '/super-admin' : '/dashboard'} className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                OneWayHR <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-semibold border border-indigo-500/30">SaaS</span>
              </span>
              <p className="text-[10px] text-slate-400 font-medium">Multi-Tenant Platform</p>
            </div>
          </a>

          {/* Org Pill or Platform Owner Root Badge */}
          {organization ? (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-medium text-slate-200">{organization.name}</span>
              <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 rounded text-[10px] font-bold uppercase tracking-wider">
                {organization.plan || 'SaaS Active'}
              </span>
            </div>
          ) : isPlatformOwner ? (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-950/60 border border-orange-500/30 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />
              <span className="font-bold text-orange-200">SaaS Platform Root</span>
              <span className="px-1.5 py-0.2 bg-orange-500/20 text-orange-400 rounded text-[10px] font-bold uppercase tracking-wider">
                Platform Owner
              </span>
            </div>
          ) : null}
        </div>

        {/* Right Action Icons & Role Display */}
        <div className="flex items-center gap-3">
          {/* Custom Role Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-medium">
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span>Role: <strong className="text-white">{isPlatformOwner ? 'Platform Owner' : userRole}</strong></span>
            {isPlatformOwner && (
              <span className="text-[9px] bg-orange-500/20 text-orange-400 font-bold px-1.5 py-0.5 rounded uppercase">Master</span>
            )}
          </div>

          {/* If Owner: Add Organization Shortcut */}
          {isPlatformOwner ? (
            <a
              href="/super-admin"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Provision Organization</span>
            </a>
          ) : (
            <a
              href="/settings"
              title="Customize Roles & Features"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
            >
              <Sliders className="w-3.5 h-3.5 text-orange-400" />
              <span>Customize SaaS</span>
            </a>
          )}

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 relative transition-colors"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full" />
            </button>

            {notifDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-3 z-50">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                  <h4 className="text-xs font-semibold text-slate-200">System Notification Feed</h4>
                  <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full font-medium">Real-Time</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
                    <p className="font-medium text-slate-200">Platform Owner Mode Active</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Only the platform owner can provision new organization tenants.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white uppercase">
              {user?.name?.slice(0, 2) || 'OW'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-200 truncate max-w-[130px]">{user?.name}</p>
              <p className="text-[10px] text-slate-400 truncate max-w-[130px]">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 ml-1 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* BODY WITH SIDEBAR */}
      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR (Desktop) */}
        <aside className="w-64 border-r border-slate-800 bg-slate-900/60 hidden lg:flex flex-col justify-between shrink-0 overflow-y-auto">
          <div className="p-4 space-y-1">
            <div className="flex items-center justify-between px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              <span>{isPlatformOwner ? 'Master Controls' : 'Dynamic Modules'}</span>
              <span className="text-[10px] text-indigo-400 font-mono">({finalNavItems.length})</span>
            </div>
            {finalNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <a
                  key={item.key}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : item.key === 'super-admin'
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                          : 'bg-slate-800 text-indigo-400 border border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </a>
              );
            })}
          </div>

          {/* Quick System Badge */}
          <div className="p-4 border-t border-slate-800/80 bg-slate-900/90 text-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span>SaaS System Mode</span>
              <span className="flex items-center gap-1 text-emerald-400 font-semibold text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                {isPlatformOwner ? 'Platform Master' : 'Tenant Active'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono truncate">
              {isPlatformOwner ? 'master-control' : organization?.slug || 'tenant-isolated'}
            </p>
          </div>
        </aside>

        {/* MOBILE DRAWER */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            <div className="relative w-72 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4 z-50">
              <div className="space-y-1 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-white text-base">OneWayHR Menu</span>
                  <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-white">
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
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium ${
                        isActive ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-indigo-400 font-bold">{item.badge}</span>}
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* MAIN VIEW CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-slate-950">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
