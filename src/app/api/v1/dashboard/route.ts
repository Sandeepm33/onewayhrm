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

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);

    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // If Super Admin
    if (session.role === 'SUPER_ADMIN') {
      const totalTenants = await Organization.countDocuments();
      const activeTenants = await Organization.countDocuments({ planStatus: 'ACTIVE' });
      const trialTenants = await Organization.countDocuments({ planStatus: 'TRIALING' });
      const totalEmployeesPlatform = await Employee.countDocuments();
      const recentAudit = await AuditLog.find().sort({ createdAt: -1 }).limit(10);

      return NextResponse.json({
        success: true,
        role: 'SUPER_ADMIN',
        metrics: {
          totalTenants,
          activeTenants,
          trialTenants,
          totalEmployeesPlatform,
          systemHealth: '100% OPERATIONAL',
          databaseEngine: 'MongoDB Atlas (Cluster0)',
        },
        recentAudit,
      });
    }

    const orgId = session.organizationId;
    if (!orgId) {
      return NextResponse.json({ success: false, error: 'No organization attached to user' }, { status: 400 });
    }

    // Role-filtered dashboard
    // If Employee self-service dashboard
    if (session.role === 'EMPLOYEE' && session.employeeId) {
      const todayAttendance = await Attendance.findOne({
        organizationId: orgId,
        employeeId: session.employeeId,
        date: todayStr,
      });

      const pendingLeaves = await LeaveRequest.find({
        organizationId: orgId,
        employeeId: session.employeeId,
      }).sort({ createdAt: -1 }).limit(5);

      const recentTickets = await HelpdeskTicket.find({
        organizationId: orgId,
        employeeId: session.employeeId,
      }).sort({ createdAt: -1 }).limit(5);

      return NextResponse.json({
        success: true,
        role: 'EMPLOYEE',
        todayAttendance,
        pendingLeaves,
        recentTickets,
      });
    }

    // Org Admin / HR / Payroll / Manager dashboard
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
    ] = await Promise.all([
      Employee.countDocuments({ organizationId: orgId }),
      Employee.countDocuments({ organizationId: orgId, status: 'ACTIVE' }),
      Employee.countDocuments({ organizationId: orgId, status: 'PROBATION' }),
      Attendance.find({ organizationId: orgId, date: todayStr }),
      LeaveRequest.countDocuments({ organizationId: orgId, status: 'PENDING' }),
      JobRequisition.countDocuments({ organizationId: orgId, status: 'OPEN' }),
      Candidate.countDocuments({ organizationId: orgId }),
      PayrollRun.findOne({ organizationId: orgId }).sort({ year: -1, month: -1 }),
      HelpdeskTicket.countDocuments({ organizationId: orgId, status: { $in: ['OPEN', 'IN_PROGRESS'] } }),
      AuditLog.find({ organizationId: orgId }).sort({ createdAt: -1 }).limit(8),
    ]);

    const presentToday = todayAttendances.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
    const lateToday = todayAttendances.filter((a) => a.status === 'LATE').length;

    return NextResponse.json({
      success: true,
      role: session.role,
      metrics: {
        totalEmployees,
        activeEmployees,
        probationEmployees,
        presentToday,
        lateToday,
        pendingLeavesCount,
        openJobsCount,
        totalCandidatesCount,
        openTicketsCount,
        latestPayroll: latestPayroll || {
          title: 'No Payroll Run Yet',
          totalNetPay: 0,
          totalGrossPay: 0,
          status: 'DRAFT',
        },
      },
      recentAuditLogs,
    });
  } catch (error: any) {
    console.error('Dashboard aggregation error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
