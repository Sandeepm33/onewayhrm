import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { Organization } from '@/models/Organization';
import { Branch, Department, Designation } from '@/models/OrganizationStructure';
import { AuditLog } from '@/models/Operations';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    let [organization, branches, departments, designations, auditLogs] = await Promise.all([
      Organization.findById(session.organizationId),
      Branch.find({ organizationId: session.organizationId }),
      Department.find({ organizationId: session.organizationId }),
      Designation.find({ organizationId: session.organizationId }),
      AuditLog.find({ organizationId: session.organizationId }).sort({ createdAt: -1 }).limit(25),
    ]);

    // Auto-seed default MNC departments if none exist
    if (departments.length === 0) {
      const defaultDepts = [
        { organizationId: session.organizationId, name: 'Engineering', code: 'ENG', description: 'Software engineering, QA and cloud infrastructure' },
        { organizationId: session.organizationId, name: 'Product & Design', code: 'PROD', description: 'Product management, UX and technical architecture' },
        { organizationId: session.organizationId, name: 'Human Resources', code: 'HR', description: 'Talent acquisition, employee lifecycle and payroll' },
        { organizationId: session.organizationId, name: 'Finance & Operations', code: 'FIN', description: 'Budgets, financial controllership and resource allocations' },
        { organizationId: session.organizationId, name: 'Sales & Delivery', code: 'SALES', description: 'Client deliveries, project management and business growth' },
      ];
      await Department.insertMany(defaultDepts);
      departments = await Department.find({ organizationId: session.organizationId });
    }

    // Auto-seed default MNC designations if none exist
    if (designations.length === 0) {
      const defaultDesigs = [
        { organizationId: session.organizationId, title: 'Engineering Manager', code: 'ENG-MGR', grade: 'L5' },
        { organizationId: session.organizationId, title: 'Technical Lead', code: 'TECH-LEAD', grade: 'L4' },
        { organizationId: session.organizationId, title: 'Senior Software Engineer', code: 'SR-DEV', grade: 'L3' },
        { organizationId: session.organizationId, title: 'Software Engineer', code: 'DEV', grade: 'L2' },
        { organizationId: session.organizationId, title: 'QA Automation Engineer', code: 'QA-ENG', grade: 'L2' },
        { organizationId: session.organizationId, title: 'HR Manager', code: 'HR-MGR', grade: 'L4' },
      ];
      await Designation.insertMany(defaultDesigs);
      designations = await Designation.find({ organizationId: session.organizationId });
    }

    return NextResponse.json({
      success: true,
      organization,
      branches,
      departments,
      designations,
      auditLogs,
    });
  } catch (error: any) {
    console.error('Fetch settings error:', error);
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

    if (!['SUPER_ADMIN', 'ORG_ADMIN'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { name, contactEmail, contactPhone, address, statutoryConfig, workWeek } = await req.json();

    const organization = await Organization.findByIdAndUpdate(
      session.organizationId,
      {
        $set: {
          name,
          contactEmail,
          contactPhone,
          address,
          statutoryConfig,
          workWeek,
        },
      },
      { new: true }
    );

    await AuditLog.create({
      organizationId: session.organizationId,
      userId: session.userId,
      userName: session.name,
      action: 'ORGANIZATION_SETTINGS_UPDATED',
      entityType: 'Organization',
      entityId: String(organization?._id),
      details: { name, statutoryConfig },
    });

    return NextResponse.json({ success: true, organization });
  } catch (error: any) {
    console.error('Update settings error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Add branch/dept/designation
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { type, data } = await req.json();

    if (type === 'BRANCH') {
      const branch = await Branch.create({
        organizationId: session.organizationId,
        ...data,
      });
      return NextResponse.json({ success: true, branch });
    } else if (type === 'DEPARTMENT') {
      const department = await Department.create({
        organizationId: session.organizationId,
        ...data,
      });
      return NextResponse.json({ success: true, department });
    } else if (type === 'DESIGNATION') {
      const designation = await Designation.create({
        organizationId: session.organizationId,
        ...data,
      });
      return NextResponse.json({ success: true, designation });
    }

    return NextResponse.json({ success: false, error: 'Invalid entity type' }, { status: 400 });
  } catch (error: any) {
    console.error('Create structure item error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
