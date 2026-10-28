import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { LeaveBalance } from '@/models/Leave';
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
        casualLeave: { total: 12, used: 0 },
        sickLeave: { total: 12, used: 0 },
        earnedLeave: { total: 15, used: 0 },
        unpaidLeave: { used: 0 },
      });
    }

    return NextResponse.json({ success: true, balance });
  } catch (error: any) {
    console.error('Fetch leave balance error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
