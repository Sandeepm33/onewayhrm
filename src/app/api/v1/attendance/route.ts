import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { Attendance } from '@/models/Attendance';
import { Holiday } from '@/models/Holiday';
import { Employee } from '@/models/Employee';
import { resolveOrganizationId } from '@/lib/tenant';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = await resolveOrganizationId(session);

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const month = searchParams.get('month'); // YYYY-MM
    const employeeId = searchParams.get('employeeId');
    const status = searchParams.get('status');
    const myOnly = searchParams.get('myOnly') === 'true';

    const query: any = { organizationId: orgId };

    // Resolve target employee if requested for specific employee or myOnly or employee role
    let resolvedEmployeeId: any = null;
    if (session.role === 'EMPLOYEE' || myOnly) {
      if (session.employeeId && mongoose.Types.ObjectId.isValid(session.employeeId)) {
        resolvedEmployeeId = session.employeeId;
      } else {
        const orConditions: any[] = [{ email: session.email, organizationId: orgId }];
        if (session.userId && mongoose.Types.ObjectId.isValid(session.userId)) {
          orConditions.push({ userId: session.userId });
        }
        const emp = await Employee.findOne({ $or: orConditions });
        if (emp) resolvedEmployeeId = emp._id;
      }
      if (resolvedEmployeeId) {
        query.employeeId = resolvedEmployeeId;
      }
    } else if (employeeId && mongoose.Types.ObjectId.isValid(employeeId)) {
      query.employeeId = employeeId;
    }

    if (date) {
      query.date = date;
    } else if (month) {
      // e.g. "2026-10" matches "2026-10-01" to "2026-10-31"
      query.date = { $regex: `^${month}` };
    }

    if (status) query.status = status;

    const attendances = await Attendance.find(query)
      .populate('employeeId', 'firstName lastName employeeCode email designationId departmentId')
      .sort({ date: -1, createdAt: -1 })
      .limit(500);

    // Also fetch holidays for the given month/year to overlay on the attendance calendar
    let holidays: any[] = [];
    const targetYear = month ? parseInt(month.split('-')[0], 10) : new Date().getFullYear();
    const holidayQuery: any = {
      $or: [
        { organizationId: orgId },
        { organizationId: null },
        { organizationId: { $exists: false } },
      ],
      year: targetYear,
    };
    if (month) {
      holidayQuery.date = { $regex: `^${month}` };
    }
    holidays = await Holiday.find(holidayQuery).sort({ date: 1 });

    return NextResponse.json({
      success: true,
      attendances,
      holidays,
    });
  } catch (error: any) {
    console.error('Fetch attendance error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
