import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { HelpdeskTicket } from '@/models/Operations';
import { resolveOrganizationId, resolveEmployeeForSession } from '@/lib/tenant';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = await resolveOrganizationId(session);
    const query: any = { organizationId: orgId };
    if (session.role === 'EMPLOYEE') {
      const emp = await resolveEmployeeForSession(session, undefined, orgId);
      if (emp) {
        query.employeeId = emp._id;
      }
    }

    const tickets = await HelpdeskTicket.find(query)
      .populate('employeeId', 'firstName lastName employeeCode')
      .populate('assignedToUserId', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, tickets });
  } catch (error: any) {
    console.error('Fetch helpdesk error:', error);
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
    const { category, priority, subject, description } = await req.json();

    const emp = await resolveEmployeeForSession(session, undefined, orgId);
    if (!emp) {
      return NextResponse.json({ success: false, error: 'Employee record required' }, { status: 400 });
    }

    const count = await HelpdeskTicket.countDocuments({ organizationId: orgId });
    const ticketNumber = `TKT-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

    const ticket = await HelpdeskTicket.create({
      organizationId: orgId,
      employeeId: emp._id,
      ticketNumber,
      category: category || 'GENERAL_HR',
      priority: priority || 'MEDIUM',
      subject,
      description,
      status: 'OPEN',
    });

    return NextResponse.json({ success: true, ticket });
  } catch (error: any) {
    console.error('Create ticket error:', error);
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
    const { ticketId, status, resolutionNotes, assignedToUserId } = await req.json();

    const updates: any = {};
    if (status) updates.status = status;
    if (resolutionNotes) updates.resolutionNotes = resolutionNotes;
    if (assignedToUserId) updates.assignedToUserId = assignedToUserId;

    const ticket = await HelpdeskTicket.findOneAndUpdate(
      { _id: ticketId, organizationId: orgId },
      { $set: updates },
      { new: true }
    );

    return NextResponse.json({ success: true, ticket });
  } catch (error: any) {
    console.error('Update ticket error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
