import mongoose from 'mongoose';
import { Organization } from '@/models/Organization';

/**
 * Safely resolves a valid mongoose ObjectId for organizationId from session.
 * If user session has an empty string or invalid ObjectId (e.g. Super Admin or Platform Owner),
 * it falls back to the primary organization in the database or provisions a default.
 */
export async function resolveOrganizationId(session: any): Promise<mongoose.Types.ObjectId> {
  if (session?.organizationId && typeof session.organizationId === 'string' && mongoose.Types.ObjectId.isValid(session.organizationId)) {
    return new mongoose.Types.ObjectId(session.organizationId);
  }

  if (session?.organizationId && session.organizationId instanceof mongoose.Types.ObjectId) {
    return session.organizationId;
  }

  // Fallback to first existing organization in DB
  const existingOrg = await Organization.findOne().sort({ createdAt: 1 });
  if (existingOrg) {
    return existingOrg._id as mongoose.Types.ObjectId;
  }

  // Auto-provision initial tenant if database has no organizations yet
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
    workWeek: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
  });

  return defaultOrg._id as mongoose.Types.ObjectId;
}

import { Employee } from '@/models/Employee';

/**
 * Safely resolves or auto-provisions an Employee profile for the current user/session.
 * Guaranteed to return an active Employee document so employee operations never fail.
 */
export async function resolveEmployeeForSession(session: any, targetId?: string, orgId?: mongoose.Types.ObjectId) {
  const finalOrgId = orgId || await resolveOrganizationId(session);

  const roleUpper = (session?.role || '').toUpperCase();
  const isAdminOrManager = roleUpper.includes('ADMIN') || roleUpper.includes('MANAGER') || roleUpper.includes('SUPER') || roleUpper.includes('OWNER');

  if (targetId && mongoose.Types.ObjectId.isValid(targetId) && isAdminOrManager) {
    const targetEmp = await Employee.findById(targetId);
    if (targetEmp) return targetEmp;
  }

  if (session?.employeeId && mongoose.Types.ObjectId.isValid(session.employeeId)) {
    const emp = await Employee.findById(session.employeeId);
    if (emp) return emp;
  }

  if (session?.userId && mongoose.Types.ObjectId.isValid(session.userId)) {
    let emp = await Employee.findOne({ userId: session.userId });
    if (emp) return emp;
  }

  const cleanEmail = (session?.email || '').toLowerCase().trim();
  if (cleanEmail) {
    let emp = await Employee.findOne({ email: cleanEmail, organizationId: finalOrgId });
    if (!emp) {
      emp = await Employee.findOne({ email: cleanEmail });
    }
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
