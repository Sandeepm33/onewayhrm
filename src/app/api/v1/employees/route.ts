import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest, hashPassword } from '@/lib/auth';
import { Employee } from '@/models/Employee';
import { User } from '@/models/User';
import { Role } from '@/models/Role';
import { LeaveBalance } from '@/models/Leave';
import { AuditLog } from '@/models/Operations';
import { ReportingRelationship } from '@/models/Workforce';

import { resolveOrganizationId } from '@/lib/tenant';
import { checkSessionPermission } from '@/lib/permissions';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const hasView = await checkSessionPermission(session, 'employees', 'view');
    if (!hasView) {
      return NextResponse.json({ success: false, error: 'Forbidden: Access to Employee Directory is restricted for your role' }, { status: 403 });
    }

    const orgId = await resolveOrganizationId(session);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const departmentId = searchParams.get('departmentId');
    const branchId = searchParams.get('branchId');
    const status = searchParams.get('status');

    const query: any = { organizationId: orgId };

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

    const hasCreate = await checkSessionPermission(session, 'employees', 'create');
    if (!hasCreate) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Your role does not have permission to onboard new employees' },
        { status: 403 }
      );
    }

    const orgId = await resolveOrganizationId(session);
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

    // Auto-generate next unique employeeCode if not provided
    let employeeCode = body.employeeCode?.trim();
    if (!employeeCode) {
      const existingEmployees = await Employee.find({ organizationId: orgId }).select('employeeCode').lean();
      let maxNum = 0;
      for (const emp of existingEmployees) {
        if (emp.employeeCode) {
          const match = emp.employeeCode.match(/\d+/);
          if (match) {
            const num = parseInt(match[0], 10);
            if (num > maxNum) maxNum = num;
          }
        }
      }
      let candidateNum = Math.max(maxNum + 1, existingEmployees.length + 1, 1);
      let candidateCode = `EMP${String(candidateNum).padStart(3, '0')}`;
      while (await Employee.findOne({ organizationId: orgId, employeeCode: candidateCode })) {
        candidateNum++;
        candidateCode = `EMP${String(candidateNum).padStart(3, '0')}`;
      }
      employeeCode = candidateCode;
    } else {
      const existingCode = await Employee.findOne({ organizationId: orgId, employeeCode });
      if (existingCode) {
        return NextResponse.json(
          { success: false, error: `Employee code "${employeeCode}" is already in use in your organization.` },
          { status: 400 }
        );
      }
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check duplicate email specifically
    const existingEmail = await Employee.findOne({
      organizationId: orgId,
      email: cleanEmail,
    });
    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: `An employee with email "${cleanEmail}" is already registered in your organization.` },
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
      roleDoc = await Role.findOne({ _id: roleId, organizationId: orgId });
    }

    const newEmployee = await Employee.create({
      organizationId: orgId,
      employeeCode,
      firstName,
      lastName,
      email: cleanEmail,
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
      const existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
        existingUser.organizationId = orgId as any;
        existingUser.employeeId = newEmployee._id as any;
        existingUser.name = `${firstName} ${lastName}`;
        if (roleDoc) {
          existingUser.role = roleDoc.name;
          existingUser.roleId = roleDoc._id as any;
        }
        existingUser.isActive = true;
        await existingUser.save();
        newEmployee.userId = existingUser._id as any;
        await newEmployee.save();
      } else {
        const newUser = await User.create({
          organizationId: orgId,
          employeeId: newEmployee._id,
          name: `${firstName} ${lastName}`,
          email: cleanEmail,
          passwordHash: pwdHash,
          role: roleDoc ? roleDoc.name : 'EMPLOYEE',
          roleId: roleDoc ? roleDoc._id : undefined,
          isActive: true,
        });
        newEmployee.userId = newUser._id;
        await newEmployee.save();
      }
    }

    // Record initial reporting relationships for audit trail
    if (reportingManagerId) {
      await ReportingRelationship.create({
        organizationId: orgId,
        employeeId: newEmployee._id,
        managerEmployeeId: reportingManagerId,
        relationshipType: 'HR_REPORTING_MANAGER',
        effectiveStartDate: new Date(joiningDate),
        isPrimary: true,
      });
    }

    if (technicalLeadId) {
      await ReportingRelationship.create({
        organizationId: orgId,
        employeeId: newEmployee._id,
        managerEmployeeId: technicalLeadId,
        relationshipType: 'TECHNICAL_LEAD',
        effectiveStartDate: new Date(joiningDate),
        isPrimary: false,
      });
    }

    // Initialize leave balance for current year
    await LeaveBalance.create({
      organizationId: orgId,
      employeeId: newEmployee._id,
      year: new Date().getFullYear(),
      casualLeave: { total: 12, used: 0 },
      sickLeave: { total: 12, used: 0 },
      earnedLeave: { total: 15, used: 0 },
      unpaidLeave: { used: 0 },
    });

    // Audit log
    await AuditLog.create({
      organizationId: orgId,
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
