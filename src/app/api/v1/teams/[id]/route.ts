import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { Team, TeamMembership } from '@/models/Workforce';
import { ProjectAllocation } from '@/models/ResourceAllocation';
import { AuditLog } from '@/models/Operations';
import { resolveOrganizationId } from '@/lib/tenant';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = await resolveOrganizationId(session);
    const { id } = await params;
    const team = await Team.findOne({ _id: id, organizationId: orgId })
      .populate('departmentId', 'name code')
      .populate('teamLeadId', 'firstName lastName employeeCode email roleId designationId');

    if (!team) {
      return NextResponse.json({ success: false, error: 'Team not found' }, { status: 404 });
    }

    // Fetch team memberships strictly within tenant
    const memberships = await TeamMembership.find({ teamId: id, organizationId: orgId, status: 'ACTIVE' })
      .populate({
        path: 'employeeId',
        select: 'firstName lastName employeeCode email roleId designationId fullyLoadedMonthlyCost',
        populate: [
          { path: 'roleId', select: 'name slug' },
          { path: 'designationId', select: 'title code' },
        ],
      });

    // Fetch project allocations for all team members
    const memberEmployeeIds = memberships.map((m) => m.employeeId?._id).filter(Boolean);
    const allocations = await ProjectAllocation.find({
      organizationId: orgId,
      employeeId: { $in: memberEmployeeIds },
      status: 'ACTIVE',
    }).populate('projectId', 'name code clientName');

    return NextResponse.json({
      success: true,
      team,
      memberships,
      allocations,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = await resolveOrganizationId(session);
    const { id } = await params;
    const body = await req.json();
    const { name, code, departmentId, teamLeadId, description, status, memberEmployeeIds } = body;

    const updates: any = {};
    if (name !== undefined) updates.name = name.trim();
    if (code !== undefined) updates.code = code.trim().toUpperCase();
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;

    if (departmentId !== undefined) {
      updates.departmentId = departmentId || null;
    }
    if (teamLeadId !== undefined) {
      updates.teamLeadId = teamLeadId || null;
    }

    const updatedTeam = await Team.findOneAndUpdate(
      { _id: id, organizationId: orgId },
      { $set: updates },
      { new: true }
    );

    if (!updatedTeam) {
      return NextResponse.json({ success: false, error: 'Team not found' }, { status: 404 });
    }

    // If memberEmployeeIds is provided, synchronize memberships strictly within tenant
    if (Array.isArray(memberEmployeeIds)) {
      // Deactivate memberships not in the new list (except lead)
      const validEmployeeIds = memberEmployeeIds.filter((empId: string) => empId);
      if (updatedTeam.teamLeadId && !validEmployeeIds.includes(String(updatedTeam.teamLeadId))) {
        validEmployeeIds.push(String(updatedTeam.teamLeadId));
      }

      // Remove previous memberships
      await TeamMembership.deleteMany({ teamId: id, organizationId: orgId });

      // Re-insert current members
      const newMembershipDocs = validEmployeeIds.map((empId: string) => {
        const isLead = updatedTeam.teamLeadId && String(updatedTeam.teamLeadId) === String(empId);
        return {
          organizationId: orgId,
          teamId: updatedTeam._id,
          employeeId: empId,
          roleInTeam: isLead ? 'LEAD' : 'MEMBER',
          startDate: new Date(),
          status: 'ACTIVE',
        };
      });

      if (newMembershipDocs.length > 0) {
        await TeamMembership.insertMany(newMembershipDocs);
      }
    }

    await AuditLog.create({
      organizationId: orgId,
      userId: session.userId,
      userName: session.name,
      action: 'TEAM_UPDATED',
      entityType: 'Team',
      entityId: id,
      details: { name: updatedTeam.name, lead: updatedTeam.teamLeadId },
    });

    return NextResponse.json({
      success: true,
      message: `Team "${updatedTeam.name}" updated successfully.`,
      team: updatedTeam,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = await resolveOrganizationId(session);
    const { id } = await params;

    const deleted = await Team.findOneAndDelete({
      _id: id,
      organizationId: orgId,
    });

    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Team not found' }, { status: 404 });
    }

    // Clean up memberships
    await TeamMembership.deleteMany({ teamId: id, organizationId: orgId });

    await AuditLog.create({
      organizationId: orgId,
      userId: session.userId,
      userName: session.name,
      action: 'TEAM_DELETED',
      entityType: 'Team',
      entityId: id,
      details: { name: deleted.name, code: deleted.code },
    });

    return NextResponse.json({
      success: true,
      message: `Team "${deleted.name}" has been removed.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
