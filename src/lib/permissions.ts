import { Role } from '@/models/Role';
import { User } from '@/models/User';
import { Employee } from '@/models/Employee';

/**
 * Validates whether the authenticated session user has permission to customize SaaS features & settings.
 * SaaS customization is strictly reserved for:
 * 1. SaaS Platform Owner / Super Admin
 * 2. Organization Admin
 * 3. Specific Users explicitly granted canCustomizeSaas = true by Organization Admin
 * 4. Specific Roles explicitly granted 'settings' module permissions by Organization Admin
 */
export async function canUserCustomizeSaas(session: any): Promise<boolean> {
  if (!session) return false;

  const roleUpper = (session.role || '').toUpperCase();
  const emailLower = (session.email || '').toLowerCase().trim();

  // 1. SaaS Platform Owner / Super Admin
  if (
    roleUpper === 'SUPER_ADMIN' ||
    roleUpper === 'PLATFORM_OWNER' ||
    emailLower === 'superadmin@onewayhr.in' ||
    emailLower === 'owner@onewayhr.com' ||
    emailLower === 'admin@hrms-saas.com'
  ) {
    return true;
  }

  // 2. Organization Admin / Owner
  if (
    roleUpper === 'ORG_ADMIN' ||
    roleUpper === 'ADMIN' ||
    roleUpper === 'ORGANIZATION OWNER' ||
    roleUpper === 'ORGANIZATION ADMIN' ||
    roleUpper === 'OWNER'
  ) {
    return true;
  }

  // Check User in database
  const user = await User.findById(session.userId);
  if (!user) return false;

  // 3. User-specific grant decided by Organization Admin
  if (user.canCustomizeSaas) {
    return true;
  }

  // 4. Role-based grant decided by Organization Admin
  let roleDoc = null;
  if (user.roleId) {
    roleDoc = await Role.findById(user.roleId);
  }
  if (!roleDoc && user.employeeId) {
    const emp = await Employee.findById(user.employeeId);
    if (emp?.roleId) {
      roleDoc = await Role.findById(emp.roleId);
    }
  }
  if (!roleDoc && user.organizationId && user.role) {
    roleDoc = await Role.findOne({
      organizationId: user.organizationId,
      $or: [
        { name: user.role },
        { slug: user.role.toLowerCase().replace(/\s+/g, '-') },
      ],
    });
  }

  if (roleDoc?.isSystemAdmin) return true;
  if (roleDoc?.permissions) {
    const settingsPerm = roleDoc.permissions.find(
      (p: any) => p.module === 'settings'
    );
    if (
      settingsPerm &&
      (settingsPerm.actions.includes('view') ||
        settingsPerm.actions.includes('edit') ||
        settingsPerm.actions.includes('create'))
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Validates whether the authenticated session user has permission to perform a specific action on a module.
 */
export async function checkSessionPermission(
  session: any,
  module: string,
  action: 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export' = 'view'
): Promise<boolean> {
  if (!session) return false;
  if (session.role === 'SUPER_ADMIN' || session.role === 'PLATFORM_OWNER') return true;

  // Settings & SaaS feature customization governance: strictly reserved for Org Admin
  // or users/roles explicitly granted 'settings' access by Org Admin
  if (module === 'settings') {
    return canUserCustomizeSaas(session);
  }

  const user = await User.findById(session.userId);
  if (!user) return false;

  const roleUpper = (user.role || session.role || '').toUpperCase();
  if (
    roleUpper === 'ORG_ADMIN' ||
    roleUpper === 'ADMIN' ||
    roleUpper === 'ORGANIZATION OWNER' ||
    roleUpper === 'ORGANIZATION ADMIN' ||
    roleUpper === 'OWNER'
  ) {
    return true;
  }

  let roleDoc = null;
  if (user.roleId) {
    roleDoc = await Role.findById(user.roleId);
  }
  if (!roleDoc && user.employeeId) {
    const emp = await Employee.findById(user.employeeId);
    if (emp?.roleId) {
      roleDoc = await Role.findById(emp.roleId);
    }
  }
  if (!roleDoc && user.organizationId && user.role) {
    roleDoc = await Role.findOne({
      organizationId: user.organizationId,
      $or: [
        { name: user.role },
        { slug: user.role.toLowerCase().replace(/\s+/g, '-') },
      ],
    });
  }

  if (roleDoc?.isSystemAdmin) return true;
  if (!roleDoc?.permissions) return false;

  const modulePerm = roleDoc.permissions.find((p: any) => p.module === module);
  if (!modulePerm) return false;
  return modulePerm.actions.includes(action);
}

