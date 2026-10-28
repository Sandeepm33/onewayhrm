import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { Attendance } from '@/models/Attendance';
import { Employee } from '@/models/Employee';
import { resolveOrganizationId, resolveEmployeeForSession } from '@/lib/tenant';

// Compute day status from record
function determineDayStatus(record: any): 'NOT_CLOCKED_IN' | 'WORKING' | 'ON_BREAK' | 'CLOCKED_OUT' {
  if (!record || !record.checkIn) return 'NOT_CLOCKED_IN';

  // Check if there is an active open break
  if (record.breaks && Array.isArray(record.breaks)) {
    const activeBreak = record.breaks.find((b: any) => !b.endTime);
    if (activeBreak) return 'ON_BREAK';
  }

  if (record.checkOut) {
    return 'CLOCKED_OUT';
  }

  return 'WORKING';
}

// GET: Current user's today status
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetEmpId = searchParams.get('employeeId') || undefined;

    const orgId = await resolveOrganizationId(session);
    const emp = await resolveEmployeeForSession(session, targetEmpId, orgId);
    if (!emp) {
      return NextResponse.json({ success: false, error: 'Could not resolve employee' }, { status: 400 });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const record = await Attendance.findOne({
      organizationId: orgId,
      employeeId: emp._id,
      date: todayStr,
    });

    const dayStatus = determineDayStatus(record);
    const activeBreak = record?.breaks?.find((b: any) => !b.endTime) || null;

    return NextResponse.json({
      success: true,
      todayStr,
      serverTime: new Date(),
      dayStatus,
      activeBreak,
      record: record || null,
      employee: {
        id: emp._id,
        name: `${emp.firstName} ${emp.lastName}`,
        code: emp.employeeCode,
      },
    });
  } catch (error: any) {
    console.error('Fetch today punch status error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Execute Clock In, Start Break, End Break, Clock Out
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const orgId = await resolveOrganizationId(session);
    const emp = await resolveEmployeeForSession(session, body.employeeId, orgId);
    if (!emp) {
      return NextResponse.json(
        { success: false, error: 'No employee record linked to current user' },
        { status: 400 }
      );
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const action = body.action || 'TOGGLE'; // CLOCK_IN, START_BREAK, END_BREAK, CLOCK_OUT, TOGGLE

    let record = await Attendance.findOne({
      organizationId: orgId,
      employeeId: emp._id,
      date: todayStr,
    });

    if (record) {
      if (!Array.isArray(record.breaks)) {
        record.breaks = [];
      }
      if (typeof record.totalBreakMinutes !== 'number') {
        record.totalBreakMinutes = 0;
      }
    }

    // 1. CLOCK IN
    if (action === 'CLOCK_IN') {
      if (record && record.checkIn && !record.checkOut) {
        return NextResponse.json({
          success: true,
          action: 'ALREADY_CLOCKED_IN',
          message: `Already clocked in at ${new Date(record.checkIn).toLocaleTimeString()}`,
          attendance: record,
        });
      }

      const hours = now.getHours();
      const minutes = now.getMinutes();
      const isLate = hours > 9 || (hours === 9 && minutes > 30);

      if (!record) {
        record = await Attendance.create({
          organizationId: orgId,
          employeeId: emp._id,
          date: todayStr,
          checkIn: now,
          status: isLate ? 'LATE' : 'PRESENT',
          workLocation: body.workLocation || 'OFFICE',
          checkInCoordinates: body.coordinates,
          dayStatus: 'WORKING',
          breaks: [],
          totalBreakMinutes: 0,
          workHoursMinutes: 0,
          notes: body.notes || 'Web clock in',
        });
      } else {
        // Re-clock in after earlier checkout (Overtime / shift continuation)
        record.checkOut = undefined;
        record.dayStatus = 'WORKING';
        if (body.workLocation) record.workLocation = body.workLocation;
        await record.save();
      }

      return NextResponse.json({
        success: true,
        action: 'CLOCK_IN',
        message: `Clocked in successfully at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        attendance: record,
        dayStatus: 'WORKING',
      });
    }

    // 2. START BREAK
    if (action === 'START_BREAK') {
      const breakType = body.breakType || 'GENERAL';

      // Auto clock in first if not clocked in yet!
      if (!record || !record.checkIn) {
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const isLate = hours > 9 || (hours === 9 && minutes > 30);

        record = await Attendance.create({
          organizationId: orgId,
          employeeId: emp._id,
          date: todayStr,
          checkIn: now,
          status: isLate ? 'LATE' : 'PRESENT',
          workLocation: body.workLocation || 'OFFICE',
          checkInCoordinates: body.coordinates,
          dayStatus: 'ON_BREAK',
          breaks: [
            {
              startTime: now,
              type: breakType,
              notes: body.notes || `${breakType} break`,
            }
          ],
          totalBreakMinutes: 0,
          workHoursMinutes: 0,
          notes: body.notes || 'Auto clock-in on break',
        });

        return NextResponse.json({
          success: true,
          action: 'START_BREAK',
          message: `${breakType} break started at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          attendance: record,
          dayStatus: 'ON_BREAK',
        });
      }

      // Check if already on break
      const existingOpenBreak = record.breaks?.find((b: any) => !b.endTime);
      if (existingOpenBreak) {
        return NextResponse.json({
          success: true,
          action: 'ALREADY_ON_BREAK',
          message: `Already on ${existingOpenBreak.type} break since ${new Date(existingOpenBreak.startTime).toLocaleTimeString()}`,
          attendance: record,
          dayStatus: 'ON_BREAK',
        });
      }

      if (!Array.isArray(record.breaks)) {
        record.breaks = [];
      }
      record.breaks.push({
        startTime: now,
        type: breakType,
        notes: body.notes || `${breakType} break`,
      } as any);

      record.dayStatus = 'ON_BREAK';
      record.markModified('breaks');
      record.markModified('dayStatus');
      await record.save();

      await Attendance.updateOne(
        { _id: record._id },
        {
          $set: {
            breaks: record.breaks,
            dayStatus: 'ON_BREAK',
          }
        }
      );

      return NextResponse.json({
        success: true,
        action: 'START_BREAK',
        message: `${breakType} break started at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        attendance: record,
        dayStatus: 'ON_BREAK',
      });
    }

    // 3. END BREAK
    if (action === 'END_BREAK') {
      if (!record || !record.checkIn) {
        return NextResponse.json({ success: false, error: 'No active clock-in found' }, { status: 400 });
      }

      if (!Array.isArray(record.breaks)) {
        record.breaks = [];
      }

      const openBreak = record.breaks.find((b: any) => !b.endTime);
      if (!openBreak) {
        return NextResponse.json({
          success: false,
          error: 'No active break to end. You are currently in working state.',
        }, { status: 400 });
      }

      openBreak.endTime = now;
      const breakDurationMs = now.getTime() - new Date(openBreak.startTime).getTime();
      openBreak.durationMinutes = Math.max(1, Math.round(breakDurationMs / (1000 * 60)));

      // Recalculate totalBreakMinutes
      const totalBreakMins = (record.breaks || []).reduce((acc: number, b: any) => {
        return acc + (b.durationMinutes || 0);
      }, 0);
      record.totalBreakMinutes = totalBreakMins;
      record.dayStatus = 'WORKING';

      record.markModified('breaks');
      record.markModified('totalBreakMinutes');
      record.markModified('dayStatus');
      await record.save();

      await Attendance.updateOne(
        { _id: record._id },
        {
          $set: {
            breaks: record.breaks,
            totalBreakMinutes: totalBreakMins,
            dayStatus: 'WORKING',
          }
        }
      );

      return NextResponse.json({
        success: true,
        action: 'END_BREAK',
        message: `Break finished (${openBreak.durationMinutes} mins). Resumed work!`,
        attendance: record,
        dayStatus: 'WORKING',
      });
    }

    // 4. CLOCK OUT
    if (action === 'CLOCK_OUT') {
      if (!record || !record.checkIn) {
        return NextResponse.json({ success: false, error: 'You are not clocked in today' }, { status: 400 });
      }

      if (!Array.isArray(record.breaks)) {
        record.breaks = [];
      }

      // If open break, auto-close it
      const openBreak = record.breaks.find((b: any) => !b.endTime);
      if (openBreak) {
        openBreak.endTime = now;
        const breakDurationMs = now.getTime() - new Date(openBreak.startTime).getTime();
        openBreak.durationMinutes = Math.max(1, Math.round(breakDurationMs / (1000 * 60)));
      }

      const totalBreakMins = (record.breaks || []).reduce((acc: number, b: any) => {
        return acc + (b.durationMinutes || 0);
      }, 0);
      record.totalBreakMinutes = totalBreakMins;

      record.checkOut = now;
      record.checkOutCoordinates = body.coordinates;
      record.dayStatus = 'CLOCKED_OUT';

      const grossDiffMs = now.getTime() - new Date(record.checkIn).getTime();
      const grossMins = Math.round(grossDiffMs / (1000 * 60));
      const netMins = Math.max(0, grossMins - totalBreakMins);

      record.workHoursMinutes = netMins;
      record.netWorkHoursMinutes = netMins;

      // Status check (half day if less than 4 hours)
      if (netMins < 240) {
        record.status = 'HALF_DAY';
      }

      record.markModified('breaks');
      record.markModified('totalBreakMinutes');
      record.markModified('dayStatus');
      record.markModified('workHoursMinutes');
      record.markModified('netWorkHoursMinutes');
      await record.save();

      await Attendance.updateOne(
        { _id: record._id },
        {
          $set: {
            checkOut: now,
            breaks: record.breaks,
            totalBreakMinutes: totalBreakMins,
            dayStatus: 'CLOCKED_OUT',
            workHoursMinutes: netMins,
            netWorkHoursMinutes: netMins,
            status: record.status,
          }
        }
      );

      const hoursDisplay = Math.floor(netMins / 60);
      const minsDisplay = netMins % 60;

      return NextResponse.json({
        success: true,
        action: 'CLOCK_OUT',
        message: `Clocked out at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Total net hours: ${hoursDisplay}h ${minsDisplay}m`,
        attendance: record,
        dayStatus: 'CLOCKED_OUT',
      });
    }

    // 5. LEGACY TOGGLE (fallback if clicked old button)
    const currentStatus = determineDayStatus(record);
    if (currentStatus === 'NOT_CLOCKED_IN') {
      return POST(new NextRequest(req.url, {
        method: 'POST',
        headers: req.headers,
        body: JSON.stringify({ action: 'CLOCK_IN', ...body }),
      }));
    } else if (currentStatus === 'ON_BREAK') {
      return POST(new NextRequest(req.url, {
        method: 'POST',
        headers: req.headers,
        body: JSON.stringify({ action: 'END_BREAK', ...body }),
      }));
    } else {
      return POST(new NextRequest(req.url, {
        method: 'POST',
        headers: req.headers,
        body: JSON.stringify({ action: 'CLOCK_OUT', ...body }),
      }));
    }
  } catch (error: any) {
    console.error('Punch clock error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
