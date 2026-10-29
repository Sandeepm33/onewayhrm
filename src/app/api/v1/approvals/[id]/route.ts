import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { resolveOrganizationId } from '@/lib/tenant';
import { ApprovalRequest } from '@/models/ApprovalWorkflow';
import { AuditLog } from '@/models/Operations';
import { LeaveRequest, LeaveBalance } from '@/models/Leave';
import { Employee } from '@/models/Employee';
import { sendLeaveStatusEmail } from '@/lib/email';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = await resolveOrganizationId(session);
    if (!orgId) {
      return NextResponse.json({ success: false, error: 'Organization context required' }, { status: 400 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action, comments = '' } = body; // action: 'APPROVED' | 'REJECTED' | 'DELEGATED'

    const request = await ApprovalRequest.findOne({ _id: id, organizationId: orgId });
    if (!request) {
      return NextResponse.json({ success: false, error: 'Approval request not found' }, { status: 404 });
    }

    const currentStepNum = request.currentStepIndex + 1;
    const stepName = `Step ${currentStepNum} (${request.currentPendingRole || 'Reviewer'})`;

    // Record decision in step history
    request.stepHistory.push({
      stepNumber: currentStepNum,
      stepName,
      approverName: session.name,
      action,
      comments,
      actedAt: new Date(),
    });

    if (action === 'REJECTED') {
      request.status = 'REJECTED';

      // If linked to a LeaveRequest, update LeaveRequest to REJECTED
      if (request.module === 'LEAVE' && request.entityId) {
        await LeaveRequest.findOneAndUpdate(
          { _id: request.entityId, organizationId: orgId },
          {
            status: 'REJECTED',
            reviewedBy: session.userId,
            reviewedAt: new Date(),
            reviewerRemarks: comments || 'Rejected in approval workflow',
          }
        );
      }

      // Email employee on rejection
      if (request.requesterEmployeeId) {
        const emp = await Employee.findById(request.requesterEmployeeId);
        if (emp?.email) {
          sendLeaveStatusEmail({
            to: emp.email,
            employeeName: `${emp.firstName} ${emp.lastName}`,
            leaveType: request.title || 'Leave Request',
            dates: request.details?.duration || 'Requested dates',
            status: 'REJECTED',
            approverComments: comments,
          }).catch((e) => console.error('[Leave Rejection Email Error]:', e));
        }
      }
    } else if (action === 'APPROVED') {
      // Check if more steps remain in the chain
      if (request.currentStepIndex + 1 < request.totalSteps) {
        request.currentStepIndex += 1;

        // If advancing to Step 2 for Leave, route to HR Reporting Manager
        if (request.module === 'LEAVE' && request.details?.hasManager && request.details?.managerId) {
          request.currentPendingRole = `HR Reporting Manager (${request.details.managerName || 'Manager'})`;
          request.currentPendingApproverIds = [request.details.managerId];
        } else {
          request.currentPendingRole = `Step ${request.currentStepIndex + 1} Reviewer`;
        }
        request.status = 'PENDING';
      } else {
        // All workflow steps completed!
        request.status = 'APPROVED';

        // If linked to a LeaveRequest, mark LeaveRequest APPROVED and deduct balance
        if (request.module === 'LEAVE' && request.entityId) {
          const leave = await LeaveRequest.findOne({ _id: request.entityId, organizationId: orgId });
          if (leave && leave.status !== 'APPROVED') {
            leave.status = 'APPROVED';
            leave.reviewedBy = session.userId as any;
            leave.reviewedAt = new Date();
            leave.reviewerRemarks = comments || 'Approved through multi-step hierarchy workflow';
            await leave.save();

            // Deduct from employee leave balance
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

            // Email employee on approval
            const emp = await Employee.findById(leave.employeeId);
            if (emp?.email) {
              sendLeaveStatusEmail({
                to: emp.email,
                employeeName: `${emp.firstName} ${emp.lastName}`,
                leaveType: leave.leaveType || 'Leave Application',
                dates: `${new Date(leave.startDate).toLocaleDateString('en-IN')} to ${new Date(leave.endDate).toLocaleDateString('en-IN')}`,
                status: 'APPROVED',
                approverComments: comments,
              }).catch((e) => console.error('[Leave Approval Email Error]:', e));
            }
          }
        }
      }
    }

    await request.save();

    // Audit log
    await AuditLog.create({
      organizationId: orgId,
      userId: session.userId,
      userName: session.name,
      action: `APPROVAL_REQUEST_${action}`,
      entityType: 'ApprovalRequest',
      entityId: id,
      details: { module: request.module, requestNumber: request.requestNumber, comments },
    });

    return NextResponse.json({
      success: true,
      message: `Request ${request.requestNumber} ${action === 'APPROVED' ? (request.status === 'APPROVED' ? 'fully approved!' : 'approved and forwarded to next step.') : 'rejected.'}`,
      request,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
