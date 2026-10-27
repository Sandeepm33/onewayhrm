import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { Attendance } from '@/models/Attendance';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const employeeId = searchParams.get('employeeId');
    const status = searchParams.get('status');

    const query: any = { organizationId: session.organizationId };

    // If Employee role, restrict to self
    if (session.role === 'EMPLOYEE' && session.employeeId) {
      query.employeeId = session.employeeId;
    } else if (employeeId) {
      query.employeeId = employeeId;
    }

    if (date) query.date = date;
    if (status) query.status = status;

    const attendances = await Attendance.find(query)
      .populate('employeeId', 'firstName lastName employeeCode email')
      .sort({ date: -1, createdAt: -1 })
      .limit(100);

    return NextResponse.json({ success: true, attendances });
  } catch (error: any) {
    console.error('Fetch attendance error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
