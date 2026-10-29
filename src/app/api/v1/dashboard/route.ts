import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { Employee } from '@/models/Employee';
import { Attendance } from '@/models/Attendance';
import { LeaveRequest } from '@/models/Leave';
import { PayrollRun } from '@/models/Payroll';
import { JobRequisition, Candidate } from '@/models/Recruitment';
import { HelpdeskTicket, AuditLog } from '@/models/Operations';
import { Organization } from '@/models/Organization';
import { ApprovalRequest } from '@/models/ApprovalWorkflow';
import { Holiday } from '@/models/Holiday';
import { resolveOrganizationId } from '@/lib/tenant';

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);

    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const orgId = await resolveOrganizationId(session);

    const todayStart = new Date(todayStr + 'T00:00:00.000Z');
    const todayEnd = new Date(todayStr + 'T23:59:59.999Z');

    // Parallel fetch core metrics for orgId (strictly dynamic from database)
    const [
      totalEmployees,
      activeEmployees,
      probationEmployees,
      todayAttendances,
      pendingLeavesCount,
      openJobsCount,
      totalCandidatesCount,
      latestPayroll,
      openTicketsCount,
      recentAuditLogs,
      pendingApprovals,
      dbHolidays,
      orgEmployees,
      leavesToday,
    ] = await Promise.all([
      orgId ? Employee.countDocuments({ organizationId: orgId }) : Employee.countDocuments(),
      orgId ? Employee.countDocuments({ organizationId: orgId, status: 'ACTIVE' }) : Employee.countDocuments({ status: 'ACTIVE' }),
      orgId ? Employee.countDocuments({ organizationId: orgId, status: 'PROBATION' }) : Employee.countDocuments({ status: 'PROBATION' }),
      orgId ? Attendance.find({ organizationId: orgId, date: todayStr }) : Attendance.find({ date: todayStr }),
      orgId ? LeaveRequest.countDocuments({ organizationId: orgId, status: 'PENDING' }) : LeaveRequest.countDocuments({ status: 'PENDING' }),
      orgId ? JobRequisition.countDocuments({ organizationId: orgId, status: 'OPEN' }) : JobRequisition.countDocuments({ status: 'OPEN' }),
      orgId ? Candidate.countDocuments({ organizationId: orgId }) : Candidate.countDocuments(),
      orgId ? PayrollRun.findOne({ organizationId: orgId }).sort({ year: -1, month: -1 }) : PayrollRun.findOne().sort({ year: -1, month: -1 }),
      orgId ? HelpdeskTicket.countDocuments({ organizationId: orgId, status: { $in: ['OPEN', 'IN_PROGRESS'] } }) : HelpdeskTicket.countDocuments({ status: { $in: ['OPEN', 'IN_PROGRESS'] } }),
      orgId ? AuditLog.find({ organizationId: orgId }).sort({ createdAt: -1 }).limit(10) : AuditLog.find().sort({ createdAt: -1 }).limit(10),
      orgId
        ? ApprovalRequest.find({ organizationId: orgId, status: 'PENDING' })
            .populate('requesterEmployeeId', 'firstName lastName employeeCode email')
            .sort({ createdAt: -1 })
            .limit(6)
        : ApprovalRequest.find({ status: 'PENDING' })
            .populate('requesterEmployeeId', 'firstName lastName employeeCode email')
            .sort({ createdAt: -1 })
            .limit(6),
      orgId
        ? Holiday.find({ organizationId: orgId, date: { $gte: todayStr } }).sort({ date: 1 }).limit(5)
        : Holiday.find({ date: { $gte: todayStr } }).sort({ date: 1 }).limit(5),
      orgId
        ? Employee.find({ organizationId: orgId, status: { $in: ['ACTIVE', 'PROBATION'] } })
            .populate('designationId', 'title')
            .select('firstName lastName employeeCode email dateOfBirth joiningDate designationId')
        : Employee.find({ status: { $in: ['ACTIVE', 'PROBATION'] } })
            .populate('designationId', 'title')
            .select('firstName lastName employeeCode email dateOfBirth joiningDate designationId'),
      orgId
        ? LeaveRequest.find({
            organizationId: orgId,
            status: 'APPROVED',
            startDate: { $lte: todayEnd },
            endDate: { $gte: todayStart },
          }).populate('employeeId', 'firstName lastName employeeCode')
        : LeaveRequest.find({
            status: 'APPROVED',
            startDate: { $lte: todayEnd },
            endDate: { $gte: todayStart },
          }).populate('employeeId', 'firstName lastName employeeCode'),
    ]);

    const presentToday = todayAttendances.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
    const lateToday = todayAttendances.filter((a) => a.status === 'LATE').length;
    const onLeaveToday = todayAttendances.filter((a) => a.status === 'ON_LEAVE').length;
    const effectiveTotal = Math.max(totalEmployees, 1);
    const absentToday = totalEmployees > 0 ? Math.max(0, totalEmployees - presentToday - onLeaveToday) : 0;

    // Upcoming Holidays: Strictly dynamic from DB
    const upcomingHolidays = dbHolidays.map((h) => ({
      _id: h._id,
      name: h.name,
      date: h.date,
      type: h.type,
      daysAway: Math.ceil((new Date(h.date).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24)),
    }));

    // Dynamic Celebrations (Birthdays, Work Anniversaries, New Joiners)
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();
    const currentYear = now.getFullYear();
    const celebrations: any[] = [];

    for (const emp of orgEmployees) {
      const designationTitle = (emp.designationId as any)?.title || 'Team Member';
      const fullName = `${emp.firstName} ${emp.lastName}`;

      // Check Birthday
      if (emp.dateOfBirth) {
        const dob = new Date(emp.dateOfBirth);
        const bMonth = dob.getMonth();
        const bDay = dob.getDate();

        // Calculate days away in current calendar year
        const targetBirthdayThisYear = new Date(currentYear, bMonth, bDay);
        const diffTime = targetBirthdayThisYear.getTime() - new Date(currentYear, currentMonth, currentDay).getTime();
        const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

        if (diffDays >= 0 && diffDays <= 7) {
          celebrations.push({
            id: String(emp._id),
            name: fullName,
            email: emp.email,
            type: 'BIRTHDAY',
            title: 'Birthday Celebration',
            date: diffDays === 0 ? 'Today 🎂' : diffDays === 1 ? 'Tomorrow' : `In ${diffDays} days`,
            badge: '🎂 Birthday',
            role: designationTitle,
          });
        }
      }

      // Check Work Anniversary
      if (emp.joiningDate) {
        const jDate = new Date(emp.joiningDate);
        const jMonth = jDate.getMonth();
        const jDay = jDate.getDate();
        const jYear = jDate.getFullYear();
        const years = currentYear - jYear;

        if (years > 0) {
          const targetAnniversary = new Date(currentYear, jMonth, jDay);
          const diffTime = targetAnniversary.getTime() - new Date(currentYear, currentMonth, currentDay).getTime();
          const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

          if (diffDays >= 0 && diffDays <= 7) {
            celebrations.push({
              id: String(emp._id),
              name: fullName,
              email: emp.email,
              type: 'WORK_ANNIVERSARY',
              title: `${years}${getOrdinalSuffix(years)} Work Anniversary`,
              date: diffDays === 0 ? 'Today 🎉' : diffDays === 1 ? 'Tomorrow' : `In ${diffDays} days`,
              badge: `🎉 ${years} Years`,
              role: designationTitle,
            });
          }
        } else {
          // New joiner in past 14 days
          const daysSinceJoining = Math.round((now.getTime() - jDate.getTime()) / (1000 * 3600 * 24));
          if (daysSinceJoining >= 0 && daysSinceJoining <= 14) {
            celebrations.push({
              id: String(emp._id),
              name: fullName,
              email: emp.email,
              type: 'NEW_JOINER',
              title: 'New Member Welcome',
              date: daysSinceJoining === 0 ? 'Joined Today 🌟' : `Joined ${daysSinceJoining}d ago`,
              badge: '🌟 New Joiner',
              role: designationTitle,
            });
          }
        }
      }
    }

    // Dynamic Who is on leave today
    const whoIsOnLeaveToday = leavesToday.map((l: any) => ({
      id: String(l._id),
      name: l.employeeId ? `${l.employeeId.firstName} ${l.employeeId.lastName}` : 'Employee',
      code: l.employeeId?.employeeCode || 'EMP',
      leaveType: l.leaveType || 'Approved Leave',
      duration: l.duration ? `${l.duration} Days` : '1 Day',
      status: 'Approved',
      avatarBg: 'bg-purple-100 text-purple-700',
    }));

    // Super Admin platform metrics (if applicable)
    let superAdminMetrics = null;
    if (session.role === 'SUPER_ADMIN' || session.role === 'PLATFORM_OWNER') {
      const [totalTenants, activeTenants, trialTenants, totalEmployeesPlatform] = await Promise.all([
        Organization.countDocuments(),
        Organization.countDocuments({ planStatus: 'ACTIVE' }),
        Organization.countDocuments({ planStatus: 'TRIALING' }),
        Employee.countDocuments(),
      ]);
      superAdminMetrics = {
        totalTenants,
        activeTenants,
        trialTenants,
        totalEmployeesPlatform,
        systemHealth: '100% OPERATIONAL',
        databaseEngine: 'MongoDB Atlas',
      };
    }

    // Attendance breakdown percentages (only computed if employees exist)
    const attendanceStats = totalEmployees > 0 ? {
      presentPercentage: Math.round((presentToday / totalEmployees) * 100),
      latePercentage: Math.round((lateToday / totalEmployees) * 100),
      onLeavePercentage: Math.round((onLeaveToday / totalEmployees) * 100),
      absentPercentage: Math.round((absentToday / totalEmployees) * 100),
      avgClockIn: '09:30 AM',
      onTimeRate: `${Math.round(((presentToday - lateToday) / Math.max(presentToday, 1)) * 100)}%`,
    } : {
      presentPercentage: 0,
      latePercentage: 0,
      onLeavePercentage: 0,
      absentPercentage: 0,
      avgClockIn: '—',
      onTimeRate: '0%',
    };

    return NextResponse.json({
      success: true,
      role: session.role,
      metrics: {
        totalEmployees: totalEmployees || 0,
        activeEmployees: activeEmployees || 0,
        probationEmployees: probationEmployees || 0,
        presentToday: presentToday || 0,
        lateToday: lateToday || 0,
        onLeaveToday: onLeaveToday || 0,
        absentToday: absentToday || 0,
        pendingLeavesCount: pendingLeavesCount || 0,
        openJobsCount: openJobsCount || 0,
        totalCandidatesCount: totalCandidatesCount || 0,
        openTicketsCount: openTicketsCount || 0,
        latestPayroll: latestPayroll ? {
          title: `${latestPayroll.month || ''} ${latestPayroll.year || ''} Regular Cycle`.trim(),
          totalNetPay: latestPayroll.totalNetPay || 0,
          totalGrossPay: latestPayroll.totalGrossPay || 0,
          status: latestPayroll.status || 'DRAFT',
        } : null,
      },
      attendanceStats,
      superAdminMetrics,
      pendingApprovals,
      upcomingHolidays,
      celebrations,
      whoIsOnLeaveToday,
      announcements: [],
      recentAuditLogs,
    });
  } catch (error: any) {
    console.error('Dashboard aggregation error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
