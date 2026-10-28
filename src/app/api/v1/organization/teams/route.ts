import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { Team, TeamMembership } from '@/models/Workforce';
import { Employee } from '@/models/Employee';
import { resolveOrganizationId } from '@/lib/tenant';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = await resolveOrganizationId(session);
    const teams = await Team.find({ organizationId: orgId })
      .populate('departmentId', 'name code')
      .populate('teamLeadId', 'firstName lastName employeeCode email')
      .sort({ createdAt: -1 });

    const memberships = await TeamMembership.find({ organizationId: orgId, status: 'ACTIVE' })
      .populate('employeeId', 'firstName lastName employeeCode email roleId designationId')
      .populate('teamId', 'name code');

    return NextResponse.json({ success: true, teams, memberships });
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
    const body = await req.json();
    const { name, code, departmentId, teamLeadId, description, memberEmployeeIds = [] } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Team name is required.' }, { status: 400 });
    }

    const teamCode = (code || name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6)).toUpperCase();

    const existing = await Team.findOne({ organizationId: orgId, code: teamCode });
    if (existing) {
      return NextResponse.json({ success: false, error: `A team with code "${teamCode}" already exists.` }, { status: 409 });
    }

    const newTeam = await Team.create({
      organizationId: orgId,
      name: name.trim(),
      code: teamCode,
      departmentId: departmentId || undefined,
      teamLeadId: teamLeadId || undefined,
      description: description || '',
      status: 'ACTIVE',
    });

    // Add team lead as LEAD membership
    if (teamLeadId) {
      await TeamMembership.create({
        organizationId: orgId,
        teamId: newTeam._id,
        employeeId: teamLeadId,
        roleInTeam: 'LEAD',
        startDate: new Date(),
        status: 'ACTIVE',
      });
    }

    // Add selected members
    if (Array.isArray(memberEmployeeIds) && memberEmployeeIds.length > 0) {
      const memberDocs = memberEmployeeIds
        .filter((id) => id !== teamLeadId)
        .map((empId) => ({
          organizationId: orgId,
          teamId: newTeam._id,
          employeeId: empId,
          roleInTeam: 'MEMBER',
          startDate: new Date(),
          status: 'ACTIVE',
        }));

      if (memberDocs.length > 0) {
        await TeamMembership.insertMany(memberDocs);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Team "${newTeam.name}" created successfully.`,
      team: newTeam,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
