import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Organization } from '@/models/Organization';
import { Employee } from '@/models/Employee';
import { Role } from '@/models/Role';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await User.findById(session.userId).select('-passwordHash');
    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: 'User not found or inactive' },
        { status: 401 }
      );
    }

    let orgId = user.organizationId ? String(user.organizationId) : null;
    let employee = null;
    if (user.employeeId) {
      employee = await Employee.findById(user.employeeId)
        .populate('branchId')
        .populate('departmentId')
        .populate('designationId');
    }
    if (!employee && user.email) {
      employee = await Employee.findOne({ email: user.email.toLowerCase() })
        .populate('branchId')
        .populate('departmentId')
        .populate('designationId');
    }
    if (!orgId && employee?.organizationId) {
      orgId = String(employee.organizationId);
    }

    let organization = null;
    if (orgId) {
      organization = await Organization.findById(orgId);
    }

    let userRole = null;
    if (user.roleId) {
      userRole = await Role.findById(user.roleId);
    }
    if (!userRole && employee?.roleId) {
      userRole = await Role.findById(employee.roleId);
      if (userRole) {
        user.roleId = userRole._id as any;
        await user.save();
      }
    }
    if (!userRole && user.role && orgId) {
      userRole = await Role.findOne({
        organizationId: orgId,
        $or: [
          { name: user.role },
          { slug: user.role.toLowerCase().replace(/\s+/g, '-') },
        ],
      });
      if (userRole) {
        user.roleId = userRole._id as any;
        await user.save();
      }
    }

    return NextResponse.json({
      success: true,
      user,
      role: userRole,
      organization,
      employee,
    });
  } catch (error: any) {
    console.error('Session error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
