import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { ApprovalDelegation } from '@/models/Workforce';
import { Employee } from '@/models/Employee';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session || !session.organizationId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const delegations = await ApprovalDelegation.find({ organizationId: session.organizationId })
      .populate('delegatorEmployeeId', 'firstName lastName employeeCode email')
      .populate('delegateeEmployeeId', 'firstName lastName employeeCode email')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, delegations });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session || !session.organizationId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { delegatorEmployeeId, delegateeEmployeeId, modules = ['LEAVE', 'TIMESHEET'], startDate, endDate, reason } = body;

    if (!delegatorEmployeeId || !delegateeEmployeeId || !startDate || !endDate) {
      return NextResponse.json({ success: false, error: 'Delegator, delegatee, start and end dates are required.' }, { status: 400 });
    }

    if (delegatorEmployeeId === delegateeEmployeeId) {
      return NextResponse.json({ success: false, error: 'Cannot delegate authority to self.' }, { status: 400 });
    }

    const delegation = await ApprovalDelegation.create({
      organizationId: session.organizationId,
      delegatorEmployeeId,
      delegateeEmployeeId,
      modules,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason: reason || 'Temporary acting manager delegation',
      status: 'ACTIVE',
    });

    return NextResponse.json({
      success: true,
      message: 'Approval authority delegated successfully.',
      delegation,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
