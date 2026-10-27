import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest, hashPassword } from '@/lib/auth';
import { Employee } from '@/models/Employee';
import { User } from '@/models/User';
import { Role } from '@/models/Role';
import { LeaveBalance } from '@/models/Leave';
import { AuditLog } from '@/models/Operations';
import { ReportingRelationship } from '@/models/Workforce';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const departmentId = searchParams.get('departmentId');
    const branchId = searchParams.get('branchId');
    const status = searchParams.get('status');

    const query: any = { organizationId: session.organizationId };

    if (departmentId) query.departmentId = departmentId;
    if (branchId) query.branchId = branchId;
    if (status) query.status = status;

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeCode: { $regex: search, $options: 'i' } },
      ];
    }

    const employees = await Employee.find(query)
      .populate('branchId', 'name code city')
      .populate('departmentId', 'name code')
      .populate('designationId', 'title code grade')
      .populate('roleId', 'name slug isSystemAdmin')
      .populate('reportingManagerId', 'firstName lastName employeeCode email')
      .populate('technicalLeadId', 'firstName lastName employeeCode email')
      .populate('projectManagerId', 'firstName lastName employeeCode email')
      .populate('resourceManagerId', 'firstName lastName employeeCode email')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, employees });
  } catch (error: any) {
    console.error('Error fetching employees:', error);
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

    const body = await req.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      gender,
      joiningDate,
      employmentType,
      departmentId,
      branchId,
      designationId,
      roleId,
      reportingManagerId,
      technicalLeadId,
      projectManagerId,
      resourceManagerId,
      costCenter,
      fullyLoadedMonthlyCost,
      ctcAnnual,
      panNumber,
      aadhaarNumber,
      uanNumber,
      bankDetails,
      createPortalAccount,
      password,
    } = body;

    if (!firstName || !lastName || !email || !joiningDate) {
      return NextResponse.json(
        { success: false, error: 'First name, last name, email, and joining date are required' },
        { status: 400 }
      );
    }

    // Auto-generate next employeeCode if not provided
    let employeeCode = body.employeeCode;
    if (!employeeCode) {
      const count = await Employee.countDocuments({ organizationId: session.organizationId });
      employeeCode = `EMP${String(count + 1).padStart(3, '0')}`;
    }

    // Check duplicate email in this org
    const existing = await Employee.findOne({
      organizationId: session.organizationId,
      $or: [{ email: email.toLowerCase() }, { employeeCode }],
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'An employee with this email or code already exists in your organization' },
        { status: 400 }
      );
    }

    // Calculate Indian statutory breakdown from CTC
    const annual = Number(ctcAnnual) || 600000;
    const grossMonthly = Math.round(annual / 12);
    const basicSalary = Math.round(grossMonthly * 0.5); // 50% Basic
    const hra = Math.round(basicSalary * 0.5); // 50% of Basic
    const conveyanceAllowance = 1600;
    const specialAllowance = Math.max(0, grossMonthly - basicSalary - hra - conveyanceAllowance);
    const fullyLoadedCost = fullyLoadedMonthlyCost ? Number(fullyLoadedMonthlyCost) : Math.round(grossMonthly * 1.25);

    // Verify assigned role if provided
    let roleDoc = null;
    if (roleId) {
      roleDoc = await Role.findOne({ _id: roleId, organizationId: session.organizationId });
    }

    const newEmployee = await Employee.create({
      organizationId: session.organizationId,
      employeeCode,
      firstName,
      lastName,
      email: email.toLowerCase().trim(),
      phone: phone || '',
      gender: gender || 'MALE',
      joiningDate: new Date(joiningDate),
      employmentType: employmentType || 'FULL_TIME',
      status: 'ACTIVE',
      branchId: branchId || undefined,
      departmentId: departmentId || undefined,
      designationId: designationId || undefined,
      roleId: roleDoc ? roleDoc._id : undefined,
      reportingManagerId: reportingManagerId || undefined,
      technicalLeadId: technicalLeadId || undefined,
      projectManagerId: projectManagerId || undefined,
      resourceManagerId: resourceManagerId || undefined,
      costCenter: costCenter || '',
      ctcAnnual: annual,
      grossMonthly,
      fullyLoadedMonthlyCost: fullyLoadedCost,
      basicSalary,
      hra,
      specialAllowance,
      conveyanceAllowance,
      panNumber: panNumber ? panNumber.toUpperCase() : undefined,
      aadhaarNumber,
      uanNumber,
      bankDetails: bankDetails || {},
    });

    // Optionally create user portal login
    if (createPortalAccount) {
      const pwdHash = await hashPassword(password || 'Welcome@123');
      const newUser = await User.create({
        organizationId: session.organizationId,
        employeeId: newEmployee._id,
        name: `${firstName} ${lastName}`,
        email: email.toLowerCase().trim(),
        passwordHash: pwdHash,
        role: roleDoc ? roleDoc.name : 'EMPLOYEE',
        roleId: roleDoc ? roleDoc._id : undefined,
        isActive: true,
      });
      newEmployee.userId = newUser._id;
      await newEmployee.save();
    }

    // Record initial reporting relationships for audit trail
    if (reportingManagerId) {
      await ReportingRelationship.create({
        organizationId: session.organizationId,
        employeeId: newEmployee._id,
        managerEmployeeId: reportingManagerId,
        relationshipType: 'HR_REPORTING_MANAGER',
        effectiveStartDate: new Date(joiningDate),
        isPrimary: true,
      });
    }

    if (technicalLeadId) {
      await ReportingRelationship.create({
        organizationId: session.organizationId,
        employeeId: newEmployee._id,
        managerEmployeeId: technicalLeadId,
        relationshipType: 'TECHNICAL_LEAD',
        effectiveStartDate: new Date(joiningDate),
        isPrimary: false,
      });
    }

    // Initialize leave balance for current year
    await LeaveBalance.create({
      organizationId: session.organizationId,
      employeeId: newEmployee._id,
      year: new Date().getFullYear(),
      casualLeave: { total: 12, used: 0 },
      sickLeave: { total: 12, used: 0 },
      earnedLeave: { total: 15, used: 0 },
      unpaidLeave: { used: 0 },
    });

    // Audit log
    await AuditLog.create({
      organizationId: session.organizationId,
      userId: session.userId,
      userName: session.name,
      action: 'EMPLOYEE_CREATED',
      entityType: 'Employee',
      entityId: String(newEmployee._id),
      details: { employeeCode, name: `${firstName} ${lastName}`, email },
    });

    return NextResponse.json({
      success: true,
      message: 'Employee successfully created!',
      employee: newEmployee,
    });
  } catch (error: any) {
    console.error('Create employee error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
