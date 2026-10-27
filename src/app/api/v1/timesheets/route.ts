import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { Timesheet, Project } from '@/models/Operations';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const query: any = { organizationId: session.organizationId };
    if (session.role === 'EMPLOYEE' && session.employeeId) {
      query.employeeId = session.employeeId;
    }

    const [timesheets, projects] = await Promise.all([
      Timesheet.find(query)
        .populate('employeeId', 'firstName lastName employeeCode')
        .populate('projectId', 'name code')
        .sort({ date: -1 })
        .limit(100),
      Project.find({ organizationId: session.organizationId, status: 'ACTIVE' }),
    ]);

    return NextResponse.json({ success: true, timesheets, projects });
  } catch (error: any) {
    console.error('Fetch timesheets error:', error);
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

    const { projectId, date, hours, description, isBillable } = await req.json();

    const targetEmployeeId = session.employeeId;
    if (!targetEmployeeId) {
      return NextResponse.json({ success: false, error: 'Employee record required' }, { status: 400 });
    }

    const timesheet = await Timesheet.create({
      organizationId: session.organizationId,
      employeeId: targetEmployeeId,
      projectId,
      date,
      hours: Number(hours),
      description,
      isBillable: isBillable !== false,
      status: 'SUBMITTED',
    });

    return NextResponse.json({ success: true, timesheet });
  } catch (error: any) {
    console.error('Create timesheet error:', error);
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

    const { timesheetId, status } = await req.json();

    const timesheet = await Timesheet.findOneAndUpdate(
      { _id: timesheetId, organizationId: session.organizationId },
      { $set: { status, reviewedBy: session.userId } },
      { new: true }
    );

    return NextResponse.json({ success: true, timesheet });
  } catch (error: any) {
    console.error('Update timesheet error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
