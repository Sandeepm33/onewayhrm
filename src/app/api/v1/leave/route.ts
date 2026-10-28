import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { LeaveRequest, LeaveBalance } from '@/models/Leave';
import { AuditLog } from '@/models/Operations';
import { ApprovalRequest } from '@/models/ApprovalWorkflow';
import { Employee } from '@/models/Employee';
import { resolveOrganizationId, resolveEmployeeForSession } from '@/lib/tenant';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = await resolveOrganizationId(session);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const employeeId = searchParams.get('employeeId');

    const query: any = { organizationId: orgId };

    if (session.role === 'EMPLOYEE') {
      const emp = await resolveEmployeeForSession(session, undefined, orgId);
      if (emp) {
        query.employeeId = emp._id;
      }
    } else if (employeeId) {
      query.employeeId = employeeId;
    }

    if (status) query.status = status;

    const requests = await LeaveRequest.find(query)
      .populate('employeeId', 'firstName lastName employeeCode email')
      .populate('reviewedBy', 'name email role')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, requests });
  } catch (error: any) {
    console.error('Fetch leave error:', error);
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

    const orgId = await resolveOrganizationId(session);
    const body = await req.json();
    const { leaveType, startDate, endDate, totalDays, isHalfDay, halfDaySession, reason } = body;

    const emp = await resolveEmployeeForSession(session, body.employeeId, orgId);
    if (!emp) {
      return NextResponse.json({ success: false, error: 'Target employee record not found' }, { status: 400 });
    }
    const targetEmployeeId = emp._id;

    if (!leaveType || !startDate || !endDate || !reason) {
      return NextResponse.json(
        { success: false, error: 'Leave type, start date, end date, and reason are required' },
        { status: 400 }
      );
    }

    const days = Number(totalDays) || 1;

    // Check balance
    const currentYear = new Date(startDate).getFullYear();
    const balance = await LeaveBalance.findOne({
      organizationId: orgId,
      employeeId: targetEmployeeId,
      year: currentYear,
    });

    if (balance && leaveType !== 'UNPAID') {
      let remaining = 0;
      if (leaveType === 'CASUAL') remaining = balance.casualLeave.total - balance.casualLeave.used;
      if (leaveType === 'SICK') remaining = balance.sickLeave.total - balance.sickLeave.used;
      if (leaveType === 'EARNED') remaining = balance.earnedLeave.total - balance.earnedLeave.used;

      if (remaining < days) {
        return NextResponse.json(
          {
            success: false,
            error: `Insufficient ${leaveType} leave balance. Remaining: ${remaining} days, Requested: ${days} days.`,
          },
          { status: 400 }
        );
      }
    }

    const newRequest = await LeaveRequest.create({
      organizationId: orgId,
      employeeId: targetEmployeeId,
      leaveType,
      startDate,
      endDate,
      totalDays: days,
      isHalfDay: !!isHalfDay,
      halfDaySession,
      reason,
      status: 'PENDING',
    });

    // Create corresponding ApprovalRequest routed through the employee's hierarchy
    try {
      const requester = await Employee.findOne({ _id: targetEmployeeId, organizationId: orgId })
        .populate('reportingManagerId', 'firstName lastName employeeCode email')
        .populate('technicalLeadId', 'firstName lastName employeeCode email');

      if (requester) {
        const hasTL = !!requester.technicalLeadId;
        const hasManager = !!requester.reportingManagerId;

        let totalSteps = 1;
        let firstPendingRole = 'HR Administration';
        let firstApproverIds: any[] = [];

        if (hasTL && hasManager) {
          // Tiered: Step 1 TL -> Step 2 Manager
          totalSteps = 2;
          firstPendingRole = `Technical Lead (${(requester.technicalLeadId as any).firstName} ${(requester.technicalLeadId as any).lastName})`;
          firstApproverIds = [(requester.technicalLeadId as any)._id];
        } else if (hasManager) {
          // Direct to Manager (e.g. TL or employee without a TL)
          totalSteps = 1;
          firstPendingRole = `Reporting Manager (${(requester.reportingManagerId as any).firstName} ${(requester.reportingManagerId as any).lastName})`;
          firstApproverIds = [(requester.reportingManagerId as any)._id];
        } else {
          // Top-level executive
          totalSteps = 1;
          firstPendingRole = 'Organization Executive / Admin';
        }

        const reqNum = `REQ-LV-${Date.now().toString().slice(-4)}`;
        await ApprovalRequest.create({
          organizationId: orgId,
          module: 'LEAVE',
          entityId: String(newRequest._id),
          requestNumber: reqNum,
          requesterEmployeeId: requester._id,
          title: `${leaveType} Leave (${days} Day${days > 1 ? 's' : ''}) - ${requester.firstName} ${requester.lastName}`,
          summary: `${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()} • ${reason}`,
          details: {
            leaveType,
            startDate,
            endDate,
            days,
            reason,
            hasTL,
            hasManager,
            managerId: hasManager ? (requester.reportingManagerId as any)._id : null,
            managerName: hasManager ? `${(requester.reportingManagerId as any).firstName} ${(requester.reportingManagerId as any).lastName}` : null,
            technicalLeadId: hasTL ? (requester.technicalLeadId as any)._id : null,
            technicalLeadName: hasTL ? `${(requester.technicalLeadId as any).firstName} ${(requester.technicalLeadId as any).lastName}` : null,
          },
          currentStepIndex: 0,
          totalSteps,
          currentPendingRole: firstPendingRole,
          currentPendingApproverIds: firstApproverIds,
          status: 'PENDING',
          stepHistory: [],
        });
      }
    } catch (wfErr) {
      console.error('Error generating approval request for leave:', wfErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Leave application submitted successfully',
      leaveRequest: newRequest,
    });
  } catch (error: any) {
    console.error('Apply leave error:', error);
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

    const orgId = await resolveOrganizationId(session);

    if (!['SUPER_ADMIN', 'ORG_ADMIN', 'HR_ADMIN', 'MANAGER'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { requestId, status, reviewerRemarks } = await req.json();

    if (!requestId || !['APPROVED', 'REJECTED', 'CANCELLED'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid requestId or status' }, { status: 400 });
    }

    const leave = await LeaveRequest.findOne({
      _id: requestId,
      organizationId: orgId,
    });

    if (!leave) {
      return NextResponse.json({ success: false, error: 'Leave request not found' }, { status: 404 });
    }

    const previousStatus = leave.status;
    leave.status = status;
    leave.reviewedBy = session.userId as any;
    leave.reviewedAt = new Date();
    leave.reviewerRemarks = reviewerRemarks || '';
    await leave.save();

    // If newly approved, deduct from leave balance
    if (status === 'APPROVED' && previousStatus !== 'APPROVED') {
      const year = new Date(leave.startDate).getFullYear();
      const balance = await LeaveBalance.findOne({
        organizationId: orgId,
        employeeId: leave.employeeId,
        year,
      });

      if (balance) {
        if (leave.leaveType === 'CASUAL') balance.casualLeave.used += leave.totalDays;
        if (leave.leaveType === 'SICK') balance.sickLeave.used += leave.totalDays;
        if (leave.leaveType === 'EARNED') balance.earnedLeave.used += leave.totalDays;
        if (leave.leaveType === 'UNPAID') balance.unpaidLeave.used += leave.totalDays;
        await balance.save();
      }
    }

    // Synchronize linked ApprovalRequest if one exists
    try {
      const appReq = await ApprovalRequest.findOne({ entityId: String(leave._id), module: 'LEAVE', organizationId: orgId });
      if (appReq && appReq.status === 'PENDING') {
        appReq.status = status as any;
        appReq.stepHistory.push({
          stepNumber: appReq.currentStepIndex + 1,
          stepName: `Direct Resolution (${session.role})`,
          approverName: session.name,
          action: status === 'APPROVED' ? 'APPROVED' : 'REJECTED',
          comments: reviewerRemarks || `Resolved directly via Leave Management`,
          actedAt: new Date(),
        });
        await appReq.save();
      }
    } catch (syncErr) {
      console.error('Error synchronizing ApprovalRequest from leave route:', syncErr);
    }

    await AuditLog.create({
      organizationId: orgId,
      userId: session.userId,
      userName: session.name,
      action: `LEAVE_REQUEST_${status}`,
      entityType: 'LeaveRequest',
      entityId: String(leave._id),
      details: { status, reviewerRemarks, leaveType: leave.leaveType, days: leave.totalDays },
    });

    return NextResponse.json({
      success: true,
      message: `Leave request ${status.toLowerCase()} successfully`,
      leaveRequest: leave,
    });
  } catch (error: any) {
    console.error('Update leave status error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
