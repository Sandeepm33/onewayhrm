import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { Candidate, JobRequisition } from '@/models/Recruitment';
import { Employee } from '@/models/Employee';
import { LeaveBalance } from '@/models/Leave';
import { AuditLog } from '@/models/Operations';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { candidateId, departmentId, designationId, branchId, joiningDate, ctcAnnual } = await req.json();

    const candidate = await Candidate.findOne({
      _id: candidateId,
      organizationId: session.organizationId,
    });

    if (!candidate) {
      return NextResponse.json({ success: false, error: 'Candidate not found' }, { status: 404 });
    }

    if (candidate.convertedToEmployeeId) {
      return NextResponse.json(
        { success: false, error: 'Candidate has already been converted to an employee' },
        { status: 400 }
      );
    }

    const count = await Employee.countDocuments({ organizationId: session.organizationId });
    const employeeCode = `EMP${String(count + 1).padStart(3, '0')}`;

    const annual = Number(ctcAnnual) || candidate.offerDetails?.offeredCtc || 600000;
    const grossMonthly = Math.round(annual / 12);
    const basicSalary = Math.round(grossMonthly * 0.5);
    const hra = Math.round(basicSalary * 0.5);
    const conveyanceAllowance = 1600;
    const specialAllowance = Math.max(0, grossMonthly - basicSalary - hra - conveyanceAllowance);

    const newEmployee = await Employee.create({
      organizationId: session.organizationId,
      employeeCode,
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      email: candidate.email,
      phone: candidate.phone,
      gender: 'MALE',
      joiningDate: joiningDate ? new Date(joiningDate) : candidate.offerDetails?.joiningDate || new Date(),
      employmentType: 'FULL_TIME',
      status: 'PROBATION',
      departmentId,
      designationId,
      branchId,
      ctcAnnual: annual,
      grossMonthly,
      basicSalary,
      hra,
      conveyanceAllowance,
      specialAllowance,
    });

    candidate.stage = 'HIRED';
    candidate.convertedToEmployeeId = newEmployee._id as any;
    await candidate.save();

    // Default leave balances
    await LeaveBalance.create({
      organizationId: session.organizationId,
      employeeId: newEmployee._id,
      year: new Date().getFullYear(),
      casualLeave: { total: 12, used: 0 },
      sickLeave: { total: 12, used: 0 },
      earnedLeave: { total: 15, used: 0 },
      unpaidLeave: { used: 0 },
    });

    await AuditLog.create({
      organizationId: session.organizationId,
      userId: session.userId,
      userName: session.name,
      action: 'CANDIDATE_CONVERTED_TO_EMPLOYEE',
      entityType: 'Employee',
      entityId: String(newEmployee._id),
      details: {
        candidateId: String(candidate._id),
        employeeCode,
        name: `${candidate.firstName} ${candidate.lastName}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Candidate ${candidate.firstName} ${candidate.lastName} successfully converted to employee ${employeeCode}`,
      employee: newEmployee,
    });
  } catch (error: any) {
    console.error('Convert candidate error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
