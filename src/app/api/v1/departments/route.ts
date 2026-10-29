import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { Department } from '@/models/OrganizationStructure';
import { Employee } from '@/models/Employee';
import { Team } from '@/models/Workforce';
import { AuditLog } from '@/models/Operations';
import { resolveOrganizationId } from '@/lib/tenant';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = await resolveOrganizationId(session);

    // Fetch only dynamically created departments belonging strictly to this tenant
    const departments = await Department.find({ organizationId: orgId })
      .populate('parentDepartmentId', 'name code')
      .populate('headEmployeeId', 'firstName lastName employeeCode email')
      .sort({ name: 1 });

    // Compute live headcount and team count for each department strictly within tenant
    const deptStats = await Promise.all(
      departments.map(async (dept) => {
        const [headcount, teamCount] = await Promise.all([
          Employee.countDocuments({ organizationId: orgId, departmentId: dept._id }),
          Team.countDocuments({ organizationId: orgId, departmentId: dept._id }),
        ]);

        return {
          ...dept.toObject(),
          headcount,
          teamCount,
        };
      })
    );

    return NextResponse.json({
      success: true,
      departments: deptStats,
    });
  } catch (error: any) {
    console.error('Fetch departments error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = await resolveOrganizationId(session);
    const body = await req.json();
    const { name, code, parentDepartmentId, costCenterCode, headEmployeeId, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Department name is required' }, { status: 400 });
    }

    const deptCode = (code || name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6)).toUpperCase();

    const existing = await Department.findOne({
      organizationId: orgId,
      code: deptCode,
    });
    if (existing) {
      return NextResponse.json({ success: false, error: `Department code "${deptCode}" is already in use in this organization.` }, { status: 409 });
    }

    const newDepartment = await Department.create({
      organizationId: orgId,
      name: name.trim(),
      code: deptCode,
      parentDepartmentId: parentDepartmentId || undefined,
      costCenterCode: costCenterCode ? costCenterCode.trim().toUpperCase() : '',
      headEmployeeId: headEmployeeId || undefined,
      description: description || '',
    });

    await AuditLog.create({
      organizationId: orgId,
      userId: session.userId,
      userName: session.name,
      action: 'DEPARTMENT_CREATED',
      entityType: 'Department',
      entityId: String(newDepartment._id),
      details: { name: newDepartment.name, code: newDepartment.code },
    });

    return NextResponse.json({
      success: true,
      message: `Department "${newDepartment.name}" created successfully.`,
      department: newDepartment,
    });
  } catch (error: any) {
    console.error('Create department error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
