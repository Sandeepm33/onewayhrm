import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { Attendance } from '@/models/Attendance';
import { AuditLog } from '@/models/Operations';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { date, reason, requestedCheckIn, requestedCheckOut } = await req.json();

    if (!date || !reason) {
      return NextResponse.json({ success: false, error: 'Date and reason are required' }, { status: 400 });
    }

    const targetEmployeeId = session.employeeId;
    if (!targetEmployeeId) {
      return NextResponse.json({ success: false, error: 'No employee record found for user' }, { status: 400 });
    }

    let record = await Attendance.findOne({
      organizationId: session.organizationId,
      employeeId: targetEmployeeId,
      date,
    });

    if (!record) {
      record = new Attendance({
        organizationId: session.organizationId,
        employeeId: targetEmployeeId,
        date,
        status: 'ABSENT',
      });
    }

    record.regularization = {
      requested: true,
      reason,
      requestedCheckIn: requestedCheckIn ? new Date(requestedCheckIn) : undefined,
      requestedCheckOut: requestedCheckOut ? new Date(requestedCheckOut) : undefined,
      status: 'PENDING',
    };

    await record.save();

    return NextResponse.json({
      success: true,
      message: 'Regularization request submitted for manager approval',
      attendance: record,
    });
  } catch (error: any) {
    console.error('Regularize request error:', error);
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

    // Only Managers, HR, Org Admin can approve regularization
    if (!['ORG_ADMIN', 'HR_ADMIN', 'MANAGER'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    const { attendanceId, decision, reviewerRemarks } = await req.json();

    if (!attendanceId || !['APPROVED', 'REJECTED'].includes(decision)) {
      return NextResponse.json({ success: false, error: 'Invalid attendanceId or decision' }, { status: 400 });
    }

    const record = await Attendance.findOne({
      _id: attendanceId,
      organizationId: session.organizationId,
    });

    if (!record || !record.regularization?.requested) {
      return NextResponse.json({ success: false, error: 'Regularization request not found' }, { status: 404 });
    }

    record.regularization.status = decision;
    record.regularization.reviewedBy = session.userId as any;
    record.regularization.reviewedAt = new Date();
    record.regularization.reviewerRemarks = reviewerRemarks;

    if (decision === 'APPROVED') {
      if (record.regularization.requestedCheckIn) {
        record.checkIn = record.regularization.requestedCheckIn;
      }
      if (record.regularization.requestedCheckOut) {
        record.checkOut = record.regularization.requestedCheckOut;
      }
      record.status = 'PRESENT';
      if (record.checkIn && record.checkOut) {
        const diffMs = new Date(record.checkOut).getTime() - new Date(record.checkIn).getTime();
        record.workHoursMinutes = Math.round(diffMs / (1000 * 60));
      }
    }

    await record.save();

    await AuditLog.create({
      organizationId: session.organizationId,
      userId: session.userId,
      userName: session.name,
      action: `ATTENDANCE_REGULARIZATION_${decision}`,
      entityType: 'Attendance',
      entityId: String(record._id),
      details: { decision, reviewerRemarks },
    });

    return NextResponse.json({
      success: true,
      message: `Regularization request ${decision.toLowerCase()} successfully`,
      attendance: record,
    });
  } catch (error: any) {
    console.error('Approve regularization error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
