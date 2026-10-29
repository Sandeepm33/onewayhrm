import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { Employee } from '@/models/Employee';
import { Organization } from '@/models/Organization';
import { sendCelebrationWishEmail } from '@/lib/email';
import { resolveOrganizationId } from '@/lib/tenant';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { employeeId, celebrationType = 'BIRTHDAY' } = await req.json();

    if (!employeeId) {
      return NextResponse.json({ success: false, error: 'Employee ID is required' }, { status: 400 });
    }

    const orgId = await resolveOrganizationId(session);
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
    }

    const org = await Organization.findById(employee.organizationId || orgId);
    const orgName = org?.name || 'OneWayHR Workspace';

    if (employee.email) {
      await sendCelebrationWishEmail({
        to: employee.email,
        recipientName: `${employee.firstName} ${employee.lastName}`,
        senderName: session.name,
        celebrationType,
        organizationName: orgName,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Warm wishes sent to ${employee.firstName} ${employee.lastName} via email! 🎊`,
    });
  } catch (error: any) {
    console.error('Send wish error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

