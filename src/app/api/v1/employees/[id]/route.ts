import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { Employee } from '@/models/Employee';
import { Attendance } from '@/models/Attendance';
import { LeaveBalance, LeaveRequest } from '@/models/Leave';
import { Payslip } from '@/models/Payroll';
import { Asset, AuditLog } from '@/models/Operations';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const employee = await Employee.findOne({ _id: id, organizationId: session.organizationId })
      .populate('branchId')
      .populate('departmentId')
      .populate('designationId')
      .populate('reportingManagerId');

    if (!employee) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
    }

    // Related data for profile tabs
    const [attendances, leaveBalance, leaveRequests, payslips, assets] = await Promise.all([
      Attendance.find({ employeeId: employee._id }).sort({ date: -1 }).limit(10),
      LeaveBalance.findOne({ employeeId: employee._id, year: new Date().getFullYear() }),
      LeaveRequest.find({ employeeId: employee._id }).sort({ createdAt: -1 }),
      Payslip.find({ employeeId: employee._id }).sort({ year: -1, month: -1 }),
      Asset.find({ assignedToEmployeeId: employee._id }),
    ]);

    return NextResponse.json({
      success: true,
      employee,
      attendances,
      leaveBalance,
      leaveRequests,
      payslips,
      assets,
    });
  } catch (error: any) {
    console.error('Fetch employee error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const updates = await req.json();

    // If CTC is changed, recalculate breakdown
    if (updates.ctcAnnual) {
      const annual = Number(updates.ctcAnnual);
      const grossMonthly = Math.round(annual / 12);
      const basicSalary = Math.round(grossMonthly * 0.5);
      const hra = Math.round(basicSalary * 0.5);
      const conveyanceAllowance = 1600;
      const specialAllowance = Math.max(0, grossMonthly - basicSalary - hra - conveyanceAllowance);

      updates.grossMonthly = grossMonthly;
      updates.basicSalary = basicSalary;
      updates.hra = hra;
      updates.conveyanceAllowance = conveyanceAllowance;
      updates.specialAllowance = specialAllowance;
    }

    const employee = await Employee.findOneAndUpdate(
      { _id: id, organizationId: session.organizationId },
      { $set: updates },
      { new: true }
    );

    if (!employee) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
    }

    // Audit log
    await AuditLog.create({
      organizationId: session.organizationId,
      userId: session.userId,
      userName: session.name,
      action: 'EMPLOYEE_UPDATED',
      entityType: 'Employee',
      entityId: id,
      details: { updatedFields: Object.keys(updates) },
    });

    return NextResponse.json({ success: true, employee });
  } catch (error: any) {
    console.error('Update employee error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
