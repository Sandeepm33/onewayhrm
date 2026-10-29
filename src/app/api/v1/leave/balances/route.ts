import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { LeaveBalance } from '@/models/Leave';
import { Employee } from '@/models/Employee';
import { resolveOrganizationId, resolveEmployeeForSession } from '@/lib/tenant';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = await resolveOrganizationId(session);
    const { searchParams } = new URL(req.url);
    const requestedEmpId = searchParams.get('employeeId');
    const year = Number(searchParams.get('year')) || new Date().getFullYear();

    const emp = await resolveEmployeeForSession(session, requestedEmpId || undefined, orgId);
    if (!emp) {
      return NextResponse.json({ success: false, error: 'Employee record required' }, { status: 400 });
    }

    let balance = await LeaveBalance.findOne({
      organizationId: orgId,
      employeeId: emp._id,
      year,
    });

    if (!balance) {
      balance = await LeaveBalance.create({
        organizationId: orgId,
        employeeId: emp._id,
        year,
        casualLeave: { total: 0, used: 0 },
        sickLeave: { total: 0, used: 0 },
        earnedLeave: { total: 0, used: 0 },
        unpaidLeave: { used: 0 },
      });
    }

    return NextResponse.json({ success: true, balance });
  } catch (error: any) {
    console.error('Fetch leave balance error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = await resolveOrganizationId(session);
    const body = await req.json();
    const {
      casualTotal = 0,
      sickTotal = 0,
      earnedTotal = 0,
      year = new Date().getFullYear(),
      applyToAllEmployees = true,
      employeeId,
    } = body;

    const cTotal = Math.max(0, Number(casualTotal) || 0);
    const sTotal = Math.max(0, Number(sickTotal) || 0);
    const eTotal = Math.max(0, Number(earnedTotal) || 0);

    if (applyToAllEmployees) {
      // Apply leave quotas to all employees in this organization
      const allEmps = await Employee.find({ organizationId: orgId });
      for (const emp of allEmps) {
        await LeaveBalance.findOneAndUpdate(
          { organizationId: orgId, employeeId: emp._id, year },
          {
            $set: {
              'casualLeave.total': cTotal,
              'sickLeave.total': sTotal,
              'earnedLeave.total': eTotal,
            },
          },
          { upsert: true, new: true }
        );
      }

      // Return current user's updated balance
      const currentEmp = await resolveEmployeeForSession(session, undefined, orgId);
      const updatedBalance = currentEmp
        ? await LeaveBalance.findOne({ organizationId: orgId, employeeId: currentEmp._id, year })
        : null;

      return NextResponse.json({
        success: true,
        message: `Leave policy quotas updated for all ${allEmps.length} organization employees!`,
        balance: updatedBalance,
      });
    } else {
      // Update targeted employee or session employee
      const targetEmp = employeeId
        ? await Employee.findOne({ _id: employeeId, organizationId: orgId })
        : await resolveEmployeeForSession(session, undefined, orgId);

      if (!targetEmp) {
        return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
      }

      const updated = await LeaveBalance.findOneAndUpdate(
        { organizationId: orgId, employeeId: targetEmp._id, year },
        {
          $set: {
            'casualLeave.total': cTotal,
            'sickLeave.total': sTotal,
            'earnedLeave.total': eTotal,
          },
        },
        { upsert: true, new: true }
      );

      return NextResponse.json({
        success: true,
        message: 'Leave quota balance updated successfully',
        balance: updated,
      });
    }
  } catch (error: any) {
    console.error('Update leave quota error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
