import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { resolveOrganizationId } from '@/lib/tenant';
import { ApprovalWorkflow, ApprovalRequest } from '@/models/ApprovalWorkflow';
import { Employee } from '@/models/Employee';
import { Role } from '@/models/Role';

export async function GET(req: NextRequest) {
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

    // Fetch strictly dynamic workflows registered for this organization
    let workflows = await ApprovalWorkflow.find({ organizationId: orgId }).sort({ createdAt: 1 });

    // Fetch strictly dynamic approval requests submitted in this organization
    const requests = await ApprovalRequest.find({ organizationId: orgId })
      .populate('requesterEmployeeId', 'firstName lastName employeeCode email')
      .sort({ createdAt: -1 });

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
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = await resolveOrganizationId(session);
    if (!orgId) {
      return NextResponse.json({ success: false, error: 'Organization context required' }, { status: 400 });
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
      organizationId: orgId,
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
