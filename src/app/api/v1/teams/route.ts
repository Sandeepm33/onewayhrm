import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { Team, TeamMembership } from '@/models/Workforce';
import { AuditLog } from '@/models/Operations';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session || !session.organizationId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get('departmentId');

    const query: any = { organizationId: session.organizationId };
    if (departmentId) {
      query.departmentId = departmentId;
    }

    const teams = await Team.find(query)
      .populate('departmentId', 'name code')
      .populate('teamLeadId', 'firstName lastName employeeCode email roleId')
      .sort({ name: 1 });

    const allMemberships = await TeamMembership.find({
      organizationId: session.organizationId,
      status: 'ACTIVE',
    })
      .populate({
        path: 'employeeId',
        select: 'firstName lastName employeeCode email roleId designationId',
        populate: [
          { path: 'roleId', select: 'name slug' },
          { path: 'designationId', select: 'title code' },
        ],
      })
      .sort({ roleInTeam: 1 });

    // Group memberships by teamId
    const teamsWithMembers = teams.map((team) => {
      const teamIdStr = String(team._id);
      const members = allMemberships
        .filter((m) => String(m.teamId) === teamIdStr && m.employeeId)
        .map((m) => ({
          membershipId: m._id,
          roleInTeam: m.roleInTeam,
          startDate: m.startDate,
          employee: m.employeeId,
        }));

      return {
        ...team.toObject(),
        members,
        memberCount: members.length,
      };
    });

    return NextResponse.json({
      success: true,
      teams: teamsWithMembers,
    });
  } catch (error: any) {
    console.error('Fetch teams error:', error);
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
    const { name, code, departmentId, teamLeadId, description, memberEmployeeIds = [] } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Team name is required.' }, { status: 400 });
    }

    const teamCode = (code || name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6)).toUpperCase();

    const existing = await Team.findOne({ organizationId: session.organizationId, code: teamCode });
    if (existing) {
      return NextResponse.json({ success: false, error: `Team code "${teamCode}" is already in use.` }, { status: 409 });
    }

    const newTeam = await Team.create({
      organizationId: session.organizationId,
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
        organizationId: session.organizationId,
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
        .filter((id: string) => id && id !== teamLeadId)
        .map((empId: string) => ({
          organizationId: session.organizationId,
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

    await AuditLog.create({
      organizationId: session.organizationId,
      userId: session.userId,
      userName: session.name,
      action: 'TEAM_CREATED',
      entityType: 'Team',
      entityId: String(newTeam._id),
      details: { name: newTeam.name, code: newTeam.code, lead: teamLeadId },
    });

    return NextResponse.json({
      success: true,
      message: `Team "${newTeam.name}" created successfully.`,
      team: newTeam,
    });
  } catch (error: any) {
    console.error('Create team error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
