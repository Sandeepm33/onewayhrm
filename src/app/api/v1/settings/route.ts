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

    const [organization, branches, departments, designations, auditLogs] = await Promise.all([
      Organization.findById(session.organizationId),
      Branch.find({ organizationId: session.organizationId }),
      Department.find({ organizationId: session.organizationId }),
      Designation.find({ organizationId: session.organizationId }),
      AuditLog.find({ organizationId: session.organizationId }).sort({ createdAt: -1 }).limit(25),
    ]);

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
