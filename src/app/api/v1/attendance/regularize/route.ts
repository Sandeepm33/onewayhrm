import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { Attendance } from '@/models/Attendance';
import { AuditLog } from '@/models/Operations';
import { resolveOrganizationId, resolveEmployeeForSession } from '@/lib/tenant';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { date, reason, requestedCheckIn, requestedCheckOut, employeeId } = body;

    if (!date || !reason) {
      return NextResponse.json({ success: false, error: 'Date and reason are required' }, { status: 400 });
    }

    const orgId = await resolveOrganizationId(session);
    const emp = await resolveEmployeeForSession(session, employeeId, orgId);
    if (!emp) {
      return NextResponse.json({ success: false, error: 'No employee record found for user' }, { status: 400 });
    }
    const targetEmployeeId = emp._id;

    let record = await Attendance.findOne({
      organizationId: orgId,
      employeeId: targetEmployeeId,
      date,
    });

    if (!record) {
      record = new Attendance({
        organizationId: orgId,
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

    const roleUpper = (session.role || '').toUpperCase();
    const isAdminOrManager = roleUpper.includes('ADMIN') || roleUpper.includes('MANAGER') || roleUpper.includes('SUPER') || roleUpper.includes('OWNER');

    // Only Managers, HR, Org Admin can approve regularization
    if (!isAdminOrManager) {
      return NextResponse.json({ success: false, error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    const { attendanceId, decision, reviewerRemarks } = await req.json();

    if (!attendanceId || !['APPROVED', 'REJECTED'].includes(decision)) {
      return NextResponse.json({ success: false, error: 'Invalid attendanceId or decision' }, { status: 400 });
    }

    const orgId = await resolveOrganizationId(session);

    const record = await Attendance.findOne({
      _id: attendanceId,
      organizationId: orgId,
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
      organizationId: orgId,
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
