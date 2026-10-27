import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { Attendance } from '@/models/Attendance';
import { Employee } from '@/models/Employee';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    let targetEmployeeId = session.employeeId;
    // Admins/managers can punch on behalf if employeeId passed
    const body = await req.json().catch(() => ({}));
    if (body.employeeId && (session.role === 'ORG_ADMIN' || session.role === 'HR_ADMIN' || session.role === 'MANAGER')) {
      targetEmployeeId = body.employeeId;
    }

    if (!targetEmployeeId) {
      // Find employee by user ID if not in session payload
      const emp = await Employee.findOne({ userId: session.userId });
      if (emp) targetEmployeeId = String(emp._id);
    }

    if (!targetEmployeeId) {
      return NextResponse.json(
        { success: false, error: 'No employee record linked to current user' },
        { status: 400 }
      );
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();

    let record = await Attendance.findOne({
      organizationId: session.organizationId,
      employeeId: targetEmployeeId,
      date: todayStr,
    });

    if (!record) {
      // First punch of the day: CLOCK IN
      // Mark LATE if after 9:30 AM
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const isLate = hours > 9 || (hours === 9 && minutes > 30);

      record = await Attendance.create({
        organizationId: session.organizationId,
        employeeId: targetEmployeeId,
        date: todayStr,
        checkIn: now,
        status: isLate ? 'LATE' : 'PRESENT',
        workLocation: body.workLocation || 'OFFICE',
        checkInCoordinates: body.coordinates,
        notes: body.notes || 'Web punch in',
      });

      return NextResponse.json({
        success: true,
        action: 'PUNCH_IN',
        message: `Punched in successfully at ${now.toLocaleTimeString()}`,
        attendance: record,
      });
    } else if (!record.checkOut) {
      // Second punch: CLOCK OUT
      record.checkOut = now;
      record.checkOutCoordinates = body.coordinates;

      if (record.checkIn) {
        const diffMs = now.getTime() - new Date(record.checkIn).getTime();
        const durationMins = Math.round(diffMs / (1000 * 60));
        record.workHoursMinutes = durationMins;

        // Half day if less than 4 hours (240 mins)
        if (durationMins < 240) {
          record.status = 'HALF_DAY';
        }
      }

      await record.save();

      return NextResponse.json({
        success: true,
        action: 'PUNCH_OUT',
        message: `Punched out successfully at ${now.toLocaleTimeString()}`,
        attendance: record,
      });
    } else {
      // Already punched in & out for today, update checkOut time
      record.checkOut = now;
      if (record.checkIn) {
        const diffMs = now.getTime() - new Date(record.checkIn).getTime();
        record.workHoursMinutes = Math.round(diffMs / (1000 * 60));
      }
      await record.save();

      return NextResponse.json({
        success: true,
        action: 'PUNCH_OUT_UPDATE',
        message: `Updated punch out time to ${now.toLocaleTimeString()}`,
        attendance: record,
      });
    }
  } catch (error: any) {
    console.error('Punch clock error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
