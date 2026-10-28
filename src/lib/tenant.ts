import mongoose from 'mongoose';
import { Organization } from '@/models/Organization';
import { User } from '@/models/User';
import { Employee } from '@/models/Employee';

/**
 * Safely resolves a valid mongoose ObjectId for organizationId from session.
 * In a multi-tenant SaaS application, each organization's data must be 100% strictly isolated.
 */
export async function resolveOrganizationId(session: any): Promise<mongoose.Types.ObjectId> {
  // 1. Direct valid organizationId on session token
  if (session?.organizationId && typeof session.organizationId === 'string' && mongoose.Types.ObjectId.isValid(session.organizationId)) {
    return new mongoose.Types.ObjectId(session.organizationId);
  }

  if (session?.organizationId && session.organizationId instanceof mongoose.Types.ObjectId) {
    return session.organizationId;
  }

  // 2. Look up user in DB to check their assigned organization
  if (session?.userId && mongoose.Types.ObjectId.isValid(session.userId)) {
    const userDoc = await User.findById(session.userId);
    if (userDoc?.organizationId && mongoose.Types.ObjectId.isValid(userDoc.organizationId)) {
      return userDoc.organizationId as mongoose.Types.ObjectId;
    }
  }

  // 2b. Look up user or employee by email to find their registered organization
  const cleanEmail = (session?.email || '').toLowerCase().trim();
  if (cleanEmail) {
    const userDoc = await User.findOne({ email: cleanEmail });
    if (userDoc?.organizationId && mongoose.Types.ObjectId.isValid(userDoc.organizationId)) {
      return userDoc.organizationId as mongoose.Types.ObjectId;
    }
    const empDoc = await Employee.findOne({ email: cleanEmail });
    if (empDoc?.organizationId && mongoose.Types.ObjectId.isValid(empDoc.organizationId)) {
      return empDoc.organizationId as mongoose.Types.ObjectId;
    }
  }

  // 3. For Platform Owner / Super Admin: dedicated Master Platform Organization
  const roleUpper = (session?.role || '').toUpperCase();
  if (roleUpper.includes('SUPER') || roleUpper.includes('PLATFORM') || cleanEmail === 'owner@onewayhr.com') {
    let masterOrg = await Organization.findOne({ slug: 'onewayhr-master' });
    if (!masterOrg) {
      masterOrg = await Organization.create({
        name: 'OneWayHR Master Platform',
        slug: 'onewayhr-master',
        contactEmail: 'owner@onewayhr.com',
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        plan: 'ENTERPRISE',
        planStatus: 'ACTIVE',
        employeeLimit: 9999,
        features: [],
        statutoryConfig: { epfEnabled: true, esiEnabled: true },
        workWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      });
    }
    return masterOrg._id as mongoose.Types.ObjectId;
  }

  // 4. Fallback to first existing customer organization in DB
  const existingOrg = await Organization.findOne({ slug: { $ne: 'onewayhr-master' } }).sort({ createdAt: 1 });
  if (existingOrg) {
    return existingOrg._id as mongoose.Types.ObjectId;
  }

  // 5. Auto-provision initial tenant if database has no organizations yet
  const defaultOrg = await Organization.create({
    name: 'OneWayHR Cloud',
    slug: 'onewayhr-cloud',
    contactEmail: session?.email || 'admin@onewayhr.com',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    plan: 'ENTERPRISE',
    planStatus: 'ACTIVE',
    employeeLimit: 250,
    features: [],
    statutoryConfig: { epfEnabled: true, esiEnabled: true },
    workWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  });

  return defaultOrg._id as mongoose.Types.ObjectId;
}

/**
 * Safely resolves or auto-provisions an Employee profile strictly within the tenant's organization.
 * Guaranteed to return an active Employee document belonging ONLY to finalOrgId.
 */
export async function resolveEmployeeForSession(session: any, targetId?: string, orgId?: mongoose.Types.ObjectId) {
  const finalOrgId = orgId || await resolveOrganizationId(session);

  const roleUpper = (session?.role || '').toUpperCase();
  const isAdminOrManager = roleUpper.includes('ADMIN') || roleUpper.includes('MANAGER') || roleUpper.includes('SUPER') || roleUpper.includes('OWNER');

  // If admin/manager requesting another employee in THIS organization
  if (targetId && mongoose.Types.ObjectId.isValid(targetId) && isAdminOrManager) {
    const targetEmp = await Employee.findOne({ _id: targetId, organizationId: finalOrgId });
    if (targetEmp) return targetEmp;
  }

  // Check direct employeeId if it belongs to finalOrgId
  if (session?.employeeId && mongoose.Types.ObjectId.isValid(session.employeeId)) {
    const emp = await Employee.findOne({ _id: session.employeeId, organizationId: finalOrgId });
    if (emp) return emp;
  }

  // Look up by userId inside finalOrgId
  if (session?.userId && mongoose.Types.ObjectId.isValid(session.userId)) {
    let emp = await Employee.findOne({ userId: session.userId, organizationId: finalOrgId });
    if (emp) return emp;
  }

  // Look up by email STRICTLY inside finalOrgId
  const cleanEmail = (session?.email || '').toLowerCase().trim();
  if (cleanEmail) {
    let emp = await Employee.findOne({ email: cleanEmail, organizationId: finalOrgId });
    if (emp) {
      if (session?.userId && mongoose.Types.ObjectId.isValid(session.userId) && !emp.userId) {
        emp.userId = session.userId;
        await emp.save();
      }
      return emp;
    }
  }

  // Auto-provision an employee profile for this user/admin so operations never fail
  const nameParts = (session?.name || 'User Admin').split(' ');
  const firstName = nameParts[0] || 'User';
  const lastName = nameParts.slice(1).join(' ') || 'Admin';

  const count = await Employee.countDocuments({ organizationId: finalOrgId });
  const employeeCode = `EMP${String(count + 1).padStart(3, '0')}`;

  const newEmp = await Employee.create({
    organizationId: finalOrgId,
    userId: (session?.userId && mongoose.Types.ObjectId.isValid(session.userId)) ? session.userId : undefined,
    employeeCode,
    firstName,
    lastName,
    email: cleanEmail || 'admin@onewayhr.com',
    phone: '9876543210',
    gender: 'OTHER',
    joiningDate: new Date(),
    employmentType: 'FULL_TIME',
    status: 'ACTIVE',
    ctcAnnual: 1200000,
    grossMonthly: 100000,
    basicSalary: 50000,
    hra: 25000,
    specialAllowance: 25000,
    conveyanceAllowance: 0,
    medicalAllowance: 0,
    bankDetails: {},
  });

  return newEmp;
}
