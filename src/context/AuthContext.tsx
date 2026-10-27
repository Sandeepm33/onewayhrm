'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface RolePermission {
  module: string;
  actions: ('view' | 'create' | 'edit' | 'delete' | 'approve' | 'export')[];
}

export interface CustomRole {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isSystemAdmin: boolean;
  permissions: RolePermission[];
}

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: string; // Dynamic custom role name
  roleId?: string;
  organizationId?: string;
  employeeId?: string;
}

export interface OrgFeature {
  key: string;
  name: string;
  href: string;
  icon: string;
  enabled: boolean;
  description?: string;
  category?: 'CORE' | 'OPERATIONS' | 'FINANCE' | 'SYSTEM';
}

export interface Organization {
  _id: string;
  name: string;
  slug: string;
  plan: string;
  planStatus: string;
  currency: string;
  timezone: string;
  features?: OrgFeature[];
  address?: {
    line1?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  statutoryConfig?: {
    epfEnabled: boolean;
    esiEnabled: boolean;
    panNumber?: string;
    ptState?: string;
  };
}

export interface Employee {
  _id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  status: string;
  ctcAnnual: number;
  grossMonthly: number;
  basicSalary: number;
  hra: number;
  specialAllowance: number;
  conveyanceAllowance: number;
  branchId?: any;
  departmentId?: any;
  designationId?: any;
}

export interface RegisterParams {
  companyName: string;
  companySlug?: string;
  adminName: string;
  adminEmail: string;
  password: string;
  plan?: string;
}

interface AuthContextType {
  user: User | null;
  roleData: CustomRole | null;
  organization: Organization | null;
  employee: Employee | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  register: (params: RegisterParams) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchDemoRole: (role: string) => Promise<void>;
  refreshSession: () => Promise<void>;
  hasPermission: (module: string, action?: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  roleData: null,
  organization: null,
  employee: null,
  loading: true,
  login: async () => false,
  register: async () => ({ success: false }),
  logout: async () => {},
  switchDemoRole: async () => {},
  refreshSession: async () => {},
  hasPermission: () => true,
});

export const DEMO_ACCOUNTS = [
  { role: 'Organization Owner', label: 'Organization Owner', email: 'admin@onewayhr.in', name: 'Vikramaditya Singhania' },
  { role: 'Staff Member', label: 'Staff Member', email: 'member@onewayhr.in', name: 'Arjun Sharma' },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [roleData, setRoleData] = useState<CustomRole | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        setRoleData(data.role || null);
        setOrganization(data.organization || null);
        setEmployee(data.employee || null);
      } else {
        setUser(null);
        setRoleData(null);
        setOrganization(null);
        setEmployee(null);
      }
    } catch {
      setUser(null);
      setRoleData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const login = async (email: string, password = ''): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setOrganization(data.organization);
        setEmployee(data.employee);
        await fetchSession();
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (params: RegisterParams): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setOrganization(data.organization);
        await fetchSession();
        return { success: true };
      }
      return { success: false, error: data.error || 'Failed to create workspace' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setRoleData(null);
    setOrganization(null);
    setEmployee(null);
    router.push('/login');
  };

  const switchDemoRole = async (roleName: string) => {
    const acc = DEMO_ACCOUNTS.find((a) => a.role === roleName);
    if (acc) {
      const success = await login(acc.email, 'Admin@12345');
      if (success) {
        router.push('/dashboard');
      }
    }
  };

  // Dynamic permission helper
  const hasPermission = (module: string, action: string = 'view'): boolean => {
    if (!user) return false;
    // If user's role is a system admin, grant all permissions
    if (roleData?.isSystemAdmin) return true;
    if (!roleData || !roleData.permissions) return true; // Default fallback if no custom role attached

    const modulePerm = roleData.permissions.find((p) => p.module === module);
    if (!modulePerm) return false;
    return modulePerm.actions.includes(action as any);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        roleData,
        organization,
        employee,
        loading,
        login,
        register,
        logout,
        switchDemoRole,
        refreshSession: fetchSession,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
