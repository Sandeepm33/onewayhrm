import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { ProjectAllocation } from '@/models/ResourceAllocation';
import { Project } from '@/models/Operations';
import { Employee } from '@/models/Employee';
import { Department } from '@/models/OrganizationStructure';
import { resolveOrganizationId } from '@/lib/tenant';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = await resolveOrganizationId(session);
    const [allocations, projects, employees] = await Promise.all([
      ProjectAllocation.find({ organizationId: orgId })
        .populate('projectId', 'name code clientName status')
        .populate('employeeId', 'firstName lastName employeeCode email departmentId roleId grossMonthly fullyLoadedMonthlyCost')
        .sort({ createdAt: -1 }),
      Project.find({ organizationId: orgId }).sort({ name: 1 }),
      Employee.find({ organizationId: orgId, status: 'ACTIVE' })
        .populate('departmentId', 'name code')
        .populate('roleId', 'name slug')
        .sort({ firstName: 1 }),
    ]);

    // Calculate real-time utilization per employee
    const activeAllocations = allocations.filter((a) => a.status === 'ACTIVE');
    const utilizationMap: Record<string, { totalPercentage: number; projects: any[] }> = {};

    employees.forEach((emp) => {
      utilizationMap[String(emp._id)] = { totalPercentage: 0, projects: [] };
    });

    activeAllocations.forEach((alloc) => {
      const p = alloc.projectId as any;
      const emp = alloc.employeeId as any;
      const empId = emp?._id ? String(emp._id) : (emp ? String(emp) : null);
      if (empId && utilizationMap[empId]) {
        utilizationMap[empId].totalPercentage += alloc.allocationPercentage;
        utilizationMap[empId].projects.push({
          projectId: p?._id,
          projectName: p?.name || 'Project',
          projectCode: p?.code || '',
          percentage: alloc.allocationPercentage,
          role: alloc.roleInProject,
        });
      }
    });

    const employeeUtilization = employees.map((emp) => {
      const util = utilizationMap[String(emp._id)] || { totalPercentage: 0, projects: [] };
      let status: 'BENCH' | 'PARTIAL' | 'OPTIMAL' | 'OVER_ALLOCATED' = 'BENCH';

      if (util.totalPercentage === 0) status = 'BENCH';
      else if (util.totalPercentage < 100) status = 'PARTIAL';
      else if (util.totalPercentage === 100) status = 'OPTIMAL';
      else status = 'OVER_ALLOCATED';

      return {
        employee: emp,
        allocatedPercentage: util.totalPercentage,
        availablePercentage: Math.max(0, 100 - util.totalPercentage),
        status,
        projects: util.projects,
      };
    });

    return NextResponse.json({
      success: true,
      allocations,
      projects,
      employees,
      employeeUtilization,
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
    const body = await req.json();
    const {
      projectId,
      employeeId,
      roleInProject,
      allocationPercentage = 100,
      expectedHoursPerWeek = 40,
      billableRatePerHour = 0,
      costRatePerHour = 0,
      startDate,
      endDate,
      notes,
    } = body;

    if (!projectId || !employeeId || !startDate) {
      return NextResponse.json(
        { success: false, error: 'Project, employee, and start date are required.' },
        { status: 400 }
      );
    }

    // Check existing allocations for capacity validation strictly within tenant
    const existingAllocations = await ProjectAllocation.find({
      organizationId: orgId,
      employeeId,
      status: 'ACTIVE',
    });

    const currentTotal = existingAllocations.reduce((sum, a) => sum + (a.allocationPercentage || 0), 0);
    const newTotal = currentTotal + Number(allocationPercentage);

    const isOverAllocated = newTotal > 100;

    const allocation = await ProjectAllocation.create({
      organizationId: orgId,
      projectId,
      employeeId,
      roleInProject: roleInProject || 'Developer',
      allocationPercentage: Number(allocationPercentage),
      expectedHoursPerWeek: Number(expectedHoursPerWeek),
      billableRatePerHour: Number(billableRatePerHour),
      costRatePerHour: Number(costRatePerHour),
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      status: 'ACTIVE',
      notes: notes || '',
    });

    // Also ensure employee is in Project's assignedEmployees list
    await Project.findOneAndUpdate(
      { _id: projectId, organizationId: orgId },
      { $addToSet: { assignedEmployees: employeeId } }
    );

    return NextResponse.json({
      success: true,
      message: isOverAllocated
        ? `Resource allocated successfully! (Warning: Employee is now at ${newTotal}% total allocation)`
        : `Resource successfully allocated (${allocationPercentage}%).`,
      allocation,
      isOverAllocated,
      newTotal,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
