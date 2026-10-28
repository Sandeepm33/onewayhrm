import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { Employee } from '@/models/Employee';
import { Department } from '@/models/OrganizationStructure';
import { Team, TeamMembership, ReportingRelationship, ApprovalDelegation } from '@/models/Workforce';
import { Role } from '@/models/Role';
import { resolveOrganizationId } from '@/lib/tenant';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = await resolveOrganizationId(session);
    const [employees, departments, teams, memberships, relationships, delegations, roles] = await Promise.all([
      Employee.find({ organizationId: orgId, status: { $ne: 'TERMINATED' } })
        .populate('departmentId', 'name code parentDepartmentId')
        .populate('roleId', 'name slug isSystemAdmin')
        .populate('reportingManagerId', 'firstName lastName employeeCode email')
        .populate('technicalLeadId', 'firstName lastName employeeCode email')
        .sort({ firstName: 1 }),
      Department.find({ organizationId: orgId })
        .populate('headEmployeeId', 'firstName lastName employeeCode email')
        .populate('parentDepartmentId', 'name code'),
      Team.find({ organizationId: orgId })
        .populate('departmentId', 'name code')
        .populate('teamLeadId', 'firstName lastName employeeCode email'),
      TeamMembership.find({ organizationId: orgId, status: 'ACTIVE' })
        .populate('employeeId', 'firstName lastName employeeCode')
        .populate('teamId', 'name code'),
      ReportingRelationship.find({ organizationId: orgId })
        .populate('employeeId', 'firstName lastName employeeCode')
        .populate('managerEmployeeId', 'firstName lastName employeeCode')
        .sort({ effectiveStartDate: -1 }),
      ApprovalDelegation.find({ organizationId: orgId })
        .populate('delegatorEmployeeId', 'firstName lastName employeeCode')
        .populate('delegateeEmployeeId', 'firstName lastName employeeCode')
        .sort({ createdAt: -1 }),
      Role.find({ organizationId: orgId }).sort({ createdAt: 1 }),
    ]);

    // Build hierarchy tree: employees without reporting manager or whose manager is self/not in org are root nodes
    const empMap = new Map();
    employees.forEach((emp) => {
      empMap.set(String(emp._id), {
        ...emp.toObject(),
        directReports: [],
        techLeadReports: [],
      });
    });

    const rootEmployees: any[] = [];
    employees.forEach((emp) => {
      const empObj = empMap.get(String(emp._id));
      const managerId = emp.reportingManagerId?._id ? String(emp.reportingManagerId._id) : (emp.reportingManagerId ? String(emp.reportingManagerId) : null);
      const techLeadId = emp.technicalLeadId?._id ? String(emp.technicalLeadId._id) : (emp.technicalLeadId ? String(emp.technicalLeadId) : null);

      if (techLeadId && empMap.has(techLeadId) && techLeadId !== String(emp._id)) {
        empMap.get(techLeadId).techLeadReports.push(empObj);
      }

      if (managerId && empMap.has(managerId) && managerId !== String(emp._id)) {
        empMap.get(managerId).directReports.push(empObj);
      } else {
        rootEmployees.push(empObj);
      }
    });

    return NextResponse.json({
      success: true,
      employees,
      departments,
      teams,
      memberships,
      relationships,
      delegations,
      roles,
      tree: rootEmployees,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
