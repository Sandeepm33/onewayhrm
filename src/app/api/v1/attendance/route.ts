import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { Attendance } from '@/models/Attendance';
import { Holiday } from '@/models/Holiday';
import { Employee } from '@/models/Employee';
import { Role } from '@/models/Role';
import { Team, TeamMembership } from '@/models/Workforce';
import { resolveOrganizationId, resolveEmployeeForSession } from '@/lib/tenant';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = await resolveOrganizationId(session);

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const month = searchParams.get('month'); // YYYY-MM
    const requestedEmployeeId = searchParams.get('employeeId');
    const status = searchParams.get('status');
    const myOnly = searchParams.get('myOnly') === 'true';

    // 1. Resolve current user's employee record
    const currentEmp = await resolveEmployeeForSession(session, undefined, orgId);

    // 2. Check if user is full administrator
    const roleUpper = (session.role || '').toUpperCase();
    const isPlatformOwner = roleUpper === 'SUPER_ADMIN' || roleUpper === 'PLATFORM_OWNER' || roleUpper === 'ORG_ADMIN';
    let isSystemAdmin = isPlatformOwner;

    if (!isSystemAdmin && (currentEmp?.roleId || session.roleId)) {
      const roleDoc = await Role.findById(currentEmp?.roleId || session.roleId);
      if (roleDoc?.isSystemAdmin) {
        isSystemAdmin = true;
      }
    }

    const query: any = { organizationId: orgId };
    let userScope: 'ADMIN' | 'MANAGER' | 'EMPLOYEE' = 'EMPLOYEE';
    let subordinateEmployees: any[] = [];

    if (isSystemAdmin) {
      userScope = 'ADMIN';
      if (myOnly && currentEmp) {
        query.employeeId = currentEmp._id;
      } else if (requestedEmployeeId && mongoose.Types.ObjectId.isValid(requestedEmployeeId)) {
        query.employeeId = new mongoose.Types.ObjectId(requestedEmployeeId);
      }
    } else {
      // 3. Non-admin: Discover any users under them (as Manager or Technical Lead)
      let subordinateIds: mongoose.Types.ObjectId[] = [];

      if (currentEmp) {
        // Direct reports (HR Manager, Technical Lead, Project Manager)
        const directReports = await Employee.find({
          organizationId: orgId,
          $or: [
            { reportingManagerId: currentEmp._id },
            { technicalLeadId: currentEmp._id },
            { projectManagerId: currentEmp._id },
          ],
        }).select('_id firstName lastName employeeCode email');

        // Teams where current user is Team Lead
        const ledTeams = await Team.find({
          organizationId: orgId,
          teamLeadId: currentEmp._id,
        }).select('_id');

        let teamMemberIds: mongoose.Types.ObjectId[] = [];
        if (ledTeams.length > 0) {
          const memberships = await TeamMembership.find({
            organizationId: orgId,
            teamId: { $in: ledTeams.map((t) => t._id) },
            status: 'ACTIVE',
          }).select('employeeId');
          teamMemberIds = memberships.map((m) => m.employeeId).filter(Boolean);
        }

        let teamEmployees: any[] = [];
        if (teamMemberIds.length > 0) {
          teamEmployees = await Employee.find({
            organizationId: orgId,
            _id: { $in: teamMemberIds },
          }).select('_id firstName lastName employeeCode email');
        }

        // Deduplicate subordinate list
        const subMap = new Map<string, any>();
        directReports.forEach((r) => {
          if (r._id.toString() !== currentEmp._id.toString()) {
            subMap.set(r._id.toString(), r);
          }
        });
        teamEmployees.forEach((r) => {
          if (r._id.toString() !== currentEmp._id.toString()) {
            subMap.set(r._id.toString(), r);
          }
        });

        subordinateEmployees = Array.from(subMap.values());
        subordinateIds = Array.from(subMap.keys()).map((id) => new mongoose.Types.ObjectId(id));
      }

      // Hierarchy permissions: self + any direct/TL reports
      const allowedIds = currentEmp ? [currentEmp._id, ...subordinateIds] : [];

      if (subordinateIds.length > 0) {
        userScope = 'MANAGER';
      } else {
        userScope = 'EMPLOYEE';
      }

      if (myOnly) {
        query.employeeId = currentEmp ? currentEmp._id : null;
      } else if (requestedEmployeeId && mongoose.Types.ObjectId.isValid(requestedEmployeeId)) {
        // Allow filtering by a specific employee ONLY if that employee is under this manager/TL
        if (allowedIds.some((id) => id.toString() === requestedEmployeeId)) {
          query.employeeId = new mongoose.Types.ObjectId(requestedEmployeeId);
        } else {
          // Fallback to own records if unauthorized
          query.employeeId = currentEmp ? currentEmp._id : null;
        }
      } else {
        if (subordinateIds.length > 0) {
          // Manager or TL sees their own records AND all users reporting to them
          query.employeeId = { $in: allowedIds };
        } else {
          // Standard employee sees ONLY their own attendance logs
          query.employeeId = currentEmp ? currentEmp._id : null;
        }
      }
    }

    if (date) {
      query.date = date;
    } else if (month) {
      // e.g. "2026-10" matches "2026-10-01" to "2026-10-31"
      query.date = { $regex: `^${month}` };
    }

    if (status) query.status = status;

    const attendances = await Attendance.find(query)
      .populate('employeeId', 'firstName lastName employeeCode email designationId departmentId')
      .sort({ date: -1, createdAt: -1 })
      .limit(500);

    // Also fetch holidays for the given month/year strictly for this tenant
    const targetYear = month ? parseInt(month.split('-')[0], 10) : new Date().getFullYear();
    const holidayQuery: any = {
      organizationId: orgId,
      year: targetYear,
    };
    if (month) {
      holidayQuery.date = { $regex: `^${month}` };
    }
    const holidays = await Holiday.find(holidayQuery).sort({ date: 1 });

    return NextResponse.json({
      success: true,
      userScope,
      currentEmployeeId: currentEmp ? currentEmp._id : null,
      subordinates: subordinateEmployees,
      attendances,
      holidays,
    });
  } catch (error: any) {
    console.error('Fetch attendance error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
