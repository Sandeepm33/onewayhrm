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

    let organization = null;
    if (user.organizationId) {
      organization = await Organization.findById(user.organizationId);
    }

    let userRole = null;
    if (user.roleId) {
      userRole = await Role.findById(user.roleId);
    }

    let employee = null;
    if (user.employeeId) {
      employee = await Employee.findById(user.employeeId)
        .populate('branchId')
        .populate('departmentId')
        .populate('designationId');
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
