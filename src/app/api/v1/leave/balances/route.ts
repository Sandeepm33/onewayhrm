import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { LeaveBalance } from '@/models/Leave';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId') || session.employeeId;
    const year = Number(searchParams.get('year')) || new Date().getFullYear();

    if (!employeeId) {
      return NextResponse.json({ success: false, error: 'Employee ID required' }, { status: 400 });
    }

    let balance = await LeaveBalance.findOne({
      organizationId: session.organizationId,
      employeeId,
      year,
    });

    if (!balance) {
      balance = await LeaveBalance.create({
        organizationId: session.organizationId,
        employeeId,
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
