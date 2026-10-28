import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest, hashPassword } from '@/lib/auth';
import { Employee } from '@/models/Employee';
import { User } from '@/models/User';
import { Role } from '@/models/Role';
import { AuditLog } from '@/models/Operations';
import { resolveOrganizationId } from '@/lib/tenant';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = await resolveOrganizationId(session);
    if (!orgId) {
      return NextResponse.json({ success: false, error: 'Organization context required' }, { status: 400 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const newPassword = body.newPassword?.trim() || 'Welcome@123';

    const employee = await Employee.findOne({ _id: id, organizationId: orgId });
    if (!employee) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
    }

    let roleName = 'EMPLOYEE';
    if (employee.roleId) {
      const roleDoc = await Role.findOne({ _id: employee.roleId, organizationId: orgId });
      if (roleDoc) roleName = roleDoc.name;
    }

    const passwordHash = await hashPassword(newPassword);
    const cleanEmail = employee.email.toLowerCase().trim();

    let user = await User.findOne({ email: cleanEmail });
    if (user) {
      user.organizationId = orgId as any;
      user.employeeId = employee._id as any;
      user.passwordHash = passwordHash;
      user.name = `${employee.firstName} ${employee.lastName}`;
      user.role = roleName;
      user.roleId = employee.roleId as any;
      user.isActive = true;
      await user.save();
    } else {
      user = await User.create({
        organizationId: orgId,
        employeeId: employee._id,
        email: cleanEmail,
        name: `${employee.firstName} ${employee.lastName}`,
        passwordHash,
        role: roleName,
        roleId: employee.roleId || undefined,
        isActive: true,
      });
    }

    employee.userId = user._id as any;
    await employee.save();

    await AuditLog.create({
      organizationId: orgId,
      userId: session.userId,
      userName: session.name,
      action: 'EMPLOYEE_PORTAL_CREDENTIALS_PROVISIONED',
      entityType: 'Employee',
      entityId: String(employee._id),
      details: {
        employeeCode: employee.employeeCode,
        email: cleanEmail,
        provisionedBy: session.name,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Portal login active for ${employee.firstName} ${employee.lastName}`,
      credentials: {
        name: `${employee.firstName} ${employee.lastName}`,
        email: cleanEmail,
        employeeCode: employee.employeeCode,
        password: newPassword,
        loginUrl: '/login',
      },
    });
  } catch (error: any) {
    console.error('Portal access provisioning error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
