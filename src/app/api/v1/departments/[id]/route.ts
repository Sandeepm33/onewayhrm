import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { Department } from '@/models/OrganizationStructure';
import { Employee } from '@/models/Employee';
import { Team } from '@/models/Workforce';
import { AuditLog } from '@/models/Operations';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session || !session.organizationId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const department = await Department.findOne({ _id: id, organizationId: session.organizationId })
      .populate('parentDepartmentId', 'name code')
      .populate('headEmployeeId', 'firstName lastName employeeCode email');

    if (!department) {
      return NextResponse.json({ success: false, error: 'Department not found' }, { status: 404 });
    }

    // Fetch employees in this department
    const employees = await Employee.find({ organizationId: session.organizationId, departmentId: id })
      .populate('roleId', 'name slug')
      .populate('designationId', 'title code')
      .select('firstName lastName employeeCode email roleId designationId status')
      .sort({ firstName: 1 });

    // Fetch teams in this department
    const teams = await Team.find({ organizationId: session.organizationId, departmentId: id })
      .populate('teamLeadId', 'firstName lastName employeeCode email')
      .sort({ name: 1 });

    return NextResponse.json({
      success: true,
      department,
      employees,
      teams,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session || !session.organizationId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, code, parentDepartmentId, costCenterCode, headEmployeeId, description } = body;

    const updates: any = {};
    if (name !== undefined) updates.name = name.trim();
    if (code !== undefined) updates.code = code.trim().toUpperCase();
    if (costCenterCode !== undefined) updates.costCenterCode = costCenterCode.trim().toUpperCase();
    if (description !== undefined) updates.description = description;

    // Handle reference fields (convert empty strings to null)
    if (parentDepartmentId !== undefined) {
      updates.parentDepartmentId = parentDepartmentId || null;
    }
    if (headEmployeeId !== undefined) {
      updates.headEmployeeId = headEmployeeId || null;
    }

    // Prevent cyclic parent department
    if (parentDepartmentId && String(parentDepartmentId) === String(id)) {
      return NextResponse.json({ success: false, error: 'A department cannot be its own parent.' }, { status: 400 });
    }

    const updated = await Department.findOneAndUpdate(
      { _id: id, organizationId: session.organizationId },
      { $set: updates },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Department not found' }, { status: 404 });
    }

    await AuditLog.create({
      organizationId: session.organizationId,
      userId: session.userId,
      userName: session.name,
      action: 'DEPARTMENT_UPDATED',
      entityType: 'Department',
      entityId: id,
      details: { updatedFields: Object.keys(updates) },
    });

    return NextResponse.json({
      success: true,
      message: `Department "${updated.name}" updated successfully.`,
      department: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session || !session.organizationId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Safety check: Cannot delete if employees are currently assigned to this department
    const employeeCount = await Employee.countDocuments({
      organizationId: session.organizationId,
      departmentId: id,
    });

    if (employeeCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete department: ${employeeCount} employee${employeeCount > 1 ? 's are' : ' is'} currently assigned to it. Please reassign or transfer them first.`,
        },
        { status: 400 }
      );
    }

    // Safety check: Cannot delete if child subdepartments exist
    const subdeptCount = await Department.countDocuments({
      organizationId: session.organizationId,
      parentDepartmentId: id,
    });

    if (subdeptCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete department: It has ${subdeptCount} child subdepartment${subdeptCount > 1 ? 's' : ''}. Please reassign or delete subdepartments first.`,
        },
        { status: 400 }
      );
    }

    const deleted = await Department.findOneAndDelete({
      _id: id,
      organizationId: session.organizationId,
    });

    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Department not found' }, { status: 404 });
    }

    await AuditLog.create({
      organizationId: session.organizationId,
      userId: session.userId,
      userName: session.name,
      action: 'DEPARTMENT_DELETED',
      entityType: 'Department',
      entityId: id,
      details: { name: deleted.name, code: deleted.code },
    });

    return NextResponse.json({
      success: true,
      message: `Department "${deleted.name}" has been removed.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
