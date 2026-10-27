import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { ApprovalWorkflow, ApprovalRequest } from '@/models/ApprovalWorkflow';
import { Employee } from '@/models/Employee';
import { Role } from '@/models/Role';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session || !session.organizationId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Auto-seed default enterprise MNC approval workflows if none exist
    let workflows = await ApprovalWorkflow.find({ organizationId: session.organizationId });
    if (workflows.length === 0) {
      const defaultWorkflows = [
        {
          organizationId: session.organizationId,
          module: 'LEAVE',
          name: 'Standard Leave Approval Workflow',
          description: 'Step 1: Direct HR Reporting Manager -> Step 2: HR Manager validation',
          isActive: true,
          steps: [
            { stepNumber: 1, stepName: 'Reporting Manager Review', approverType: 'REPORTING_MANAGER' },
            { stepNumber: 2, stepName: 'HR Administration Verification', approverType: 'ROLE', roleSlug: 'hr-manager' },
          ],
        },
        {
          organizationId: session.organizationId,
          module: 'TIMESHEET',
          name: 'Client Project Timesheet Dual-Approval',
          description: 'Step 1: Technical Lead task review -> Step 2: Project Manager billing signoff',
          isActive: true,
          steps: [
            { stepNumber: 1, stepName: 'Technical Lead Verification', approverType: 'TECHNICAL_LEAD' },
            { stepNumber: 2, stepName: 'Project Manager Billing Signoff', approverType: 'ROLE', roleSlug: 'project-manager' },
          ],
        },
        {
          organizationId: session.organizationId,
          module: 'ATTENDANCE_REGULARIZATION',
          name: 'Biometric Clock Regularization Flow',
          description: 'Step 1: Direct Line Manager review -> Step 2: HR Attendance Policy validation',
          isActive: true,
          steps: [
            { stepNumber: 1, stepName: 'Line Manager Review', approverType: 'REPORTING_MANAGER' },
            { stepNumber: 2, stepName: 'HR Attendance Compliance', approverType: 'ROLE', roleSlug: 'hr-manager' },
          ],
        },
        {
          organizationId: session.organizationId,
          module: 'EXPENSE_CLAIM',
          name: 'Corporate Expense Reimbursement Flow',
          description: 'Step 1: Manager expense verification -> Step 2: Finance Controller disbursement',
          isActive: true,
          steps: [
            { stepNumber: 1, stepName: 'Manager Pre-Approval', approverType: 'REPORTING_MANAGER' },
            { stepNumber: 2, stepName: 'Finance Audit & Payment', approverType: 'ROLE', roleSlug: 'finance-controller' },
          ],
        },
        {
          organizationId: session.organizationId,
          module: 'BUDGET_REVISION',
          name: 'Project Budget Revision Workflow',
          description: 'Step 1: Engineering Manager / PM -> Step 2: Finance Controller approval',
          isActive: true,
          steps: [
            { stepNumber: 1, stepName: 'Department Head Justification', approverType: 'DEPARTMENT_HEAD' },
            { stepNumber: 2, stepName: 'Finance Budget Authorization', approverType: 'ROLE', roleSlug: 'finance-controller' },
          ],
        },
      ];

      await ApprovalWorkflow.insertMany(defaultWorkflows);
      workflows = await ApprovalWorkflow.find({ organizationId: session.organizationId });
    }

    // Fetch approval requests
    let requests = await ApprovalRequest.find({ organizationId: session.organizationId })
      .populate('requesterEmployeeId', 'firstName lastName employeeCode email')
      .sort({ createdAt: -1 });

    // If no approval requests exist, generate a couple realistic pending enterprise demo requests so the user can experience the approval engine
    if (requests.length === 0) {
      const emps = await Employee.find({ organizationId: session.organizationId }).limit(3);
      if (emps.length > 0) {
        const emp1 = emps[0];
        const emp2 = emps[1] || emps[0];

        await ApprovalRequest.create([
          {
            organizationId: session.organizationId,
            module: 'LEAVE',
            entityId: 'LV-SAMPLE-01',
            requestNumber: 'REQ-LV-001',
            requesterEmployeeId: emp1._id,
            title: `Casual Leave Request (2 Days) - ${emp1.firstName} ${emp1.lastName}`,
            summary: 'Family emergency / personal commitment',
            details: { leaveType: 'Casual Leave', days: 2, from: '2026-11-02', to: '2026-11-03' },
            currentStepIndex: 0,
            totalSteps: 2,
            currentPendingRole: 'Reporting Manager',
            status: 'PENDING',
            stepHistory: [],
          },
          {
            organizationId: session.organizationId,
            module: 'TIMESHEET',
            entityId: 'TS-SAMPLE-01',
            requestNumber: 'REQ-TS-002',
            requesterEmployeeId: emp2._id,
            title: `Weekly Client Timesheet (40.0 hrs) - ${emp2.firstName} ${emp2.lastName}`,
            summary: 'Client Project Alpha (32 hrs) + Technical Architecture Review (8 hrs)',
            details: { totalHours: 40, billableHours: 32, period: 'Week 43, 2026' },
            currentStepIndex: 0,
            totalSteps: 2,
            currentPendingRole: 'Technical Lead',
            status: 'PENDING',
            stepHistory: [],
          },
        ]);

        requests = await ApprovalRequest.find({ organizationId: session.organizationId })
          .populate('requesterEmployeeId', 'firstName lastName employeeCode email')
          .sort({ createdAt: -1 });
      }
    }

    return NextResponse.json({
      success: true,
      workflows,
      requests,
      pendingCount: requests.filter((r) => r.status === 'PENDING').length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session || !session.organizationId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { module, name, description, steps } = body;

    if (!module || !name || !Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Module, name, and at least one step are required.' },
        { status: 400 }
      );
    }

    const workflow = await ApprovalWorkflow.create({
      organizationId: session.organizationId,
      module,
      name: name.trim(),
      description: description || '',
      isActive: true,
      steps,
    });

    return NextResponse.json({
      success: true,
      message: `Workflow "${workflow.name}" configured successfully.`,
      workflow,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
