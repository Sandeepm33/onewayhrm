import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest, hashPassword, comparePassword } from '@/lib/auth';
import { User } from '@/models/User';
import { Employee } from '@/models/Employee';
import { Organization } from '@/models/Organization';
import { Role } from '@/models/Role';
import { AuditLog } from '@/models/Operations';

/**
 * GET /api/v1/profile
 * Retrieves full profile of the currently logged-in user including:
 * - User account data
 * - Employee employment, statutory, and reporting hierarchy
 * - Organization details
 * - Role and permissions summary
 */
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findById(session.userId).select('-passwordHash');
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    let employee = null;
    if (user.employeeId) {
      employee = await Employee.findById(user.employeeId)
        .populate('branchId', 'name code city address')
        .populate('departmentId', 'name code description')
        .populate('designationId', 'title code grade')
        .populate('roleId', 'name slug isSystemAdmin')
        .populate('reportingManagerId', 'firstName lastName employeeCode email phone')
        .populate('technicalLeadId', 'firstName lastName employeeCode email phone')
        .populate('projectManagerId', 'firstName lastName employeeCode email phone')
        .populate('resourceManagerId', 'firstName lastName employeeCode email phone');
    }

    if (!employee && user.email) {
      employee = await Employee.findOne({ email: user.email.toLowerCase() })
        .populate('branchId', 'name code city address')
        .populate('departmentId', 'name code description')
        .populate('designationId', 'title code grade')
        .populate('roleId', 'name slug isSystemAdmin')
        .populate('reportingManagerId', 'firstName lastName employeeCode email phone')
        .populate('technicalLeadId', 'firstName lastName employeeCode email phone')
        .populate('projectManagerId', 'firstName lastName employeeCode email phone')
        .populate('resourceManagerId', 'firstName lastName employeeCode email phone');

      if (employee && !user.employeeId) {
        user.employeeId = employee._id as any;
        await user.save();
      }
    }

    // If still no employee profile, auto-create a real profile document for this user
    if (!employee && user.organizationId) {
      const nameParts = (user.name || 'User').trim().split(' ');
      const firstName = nameParts[0] || 'User';
      const lastName = nameParts.slice(1).join(' ') || 'Member';

      const empCount = await Employee.countDocuments({ organizationId: user.organizationId });
      const empCode = `EMP${String(empCount + 1).padStart(3, '0')}`;

      employee = await Employee.create({
        organizationId: user.organizationId,
        userId: user._id,
        employeeCode: empCode,
        firstName,
        lastName,
        email: user.email.toLowerCase(),
        phone: user.phone || '',
        gender: 'OTHER',
        joiningDate: new Date(),
        employmentType: 'FULL_TIME',
        status: 'ACTIVE',
        ctcAnnual: 0,
        grossMonthly: 0,
        basicSalary: 0,
        hra: 0,
        specialAllowance: 0,
        conveyanceAllowance: 0,
        medicalAllowance: 0,
        bankDetails: {},
      });

      user.employeeId = employee._id as any;
      await user.save();
    }

    let organization = null;
    if (user.organizationId) {
      organization = await Organization.findById(user.organizationId).select('name slug plan currency timezone address');
    }

    let roleDoc = null;
    if (user.roleId) {
      roleDoc = await Role.findById(user.roleId);
    } else if (employee?.roleId) {
      roleDoc = await Role.findById(employee.roleId);
    }

    return NextResponse.json({
      success: true,
      user,
      employee,
      organization,
      role: roleDoc,
    });
  } catch (error: any) {
    console.error('Fetch profile error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/v1/profile
 * Allows users to update their real contact info, address, statutory IDs, and bank accounts.
 */
export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      phone,
      currentAddress,
      permanentAddress,
      emergencyContact,
      panNumber,
      aadhaarNumber,
      uanNumber,
      esiNumber,
      bankDetails,
    } = body;

    const user = await User.findById(session.userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (name && name.trim()) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    await user.save();

    let employee = null;
    if (user.employeeId) {
      employee = await Employee.findById(user.employeeId);
    } else if (user.email) {
      employee = await Employee.findOne({ email: user.email.toLowerCase() });
    }

    if (!employee && user.organizationId) {
      const nameParts = (user.name || 'User').trim().split(' ');
      const empCount = await Employee.countDocuments({ organizationId: user.organizationId });
      employee = await Employee.create({
        organizationId: user.organizationId,
        userId: user._id,
        employeeCode: `EMP${String(empCount + 1).padStart(3, '0')}`,
        firstName: nameParts[0] || 'User',
        lastName: nameParts.slice(1).join(' ') || 'Member',
        email: user.email.toLowerCase(),
        phone: user.phone || '',
        gender: 'OTHER',
        joiningDate: new Date(),
        employmentType: 'FULL_TIME',
        status: 'ACTIVE',
        ctcAnnual: 0,
        grossMonthly: 0,
        basicSalary: 0,
        hra: 0,
        specialAllowance: 0,
        conveyanceAllowance: 0,
        medicalAllowance: 0,
        bankDetails: {},
      });
      user.employeeId = employee._id as any;
      await user.save();
    }

    if (employee) {
      if (phone !== undefined) employee.phone = phone.trim();
      if (currentAddress !== undefined) employee.currentAddress = currentAddress;
      if (permanentAddress !== undefined) employee.permanentAddress = permanentAddress;
      if (emergencyContact !== undefined) employee.emergencyContact = emergencyContact;

      // Real Statutory IDs
      if (panNumber !== undefined) employee.panNumber = panNumber.trim().toUpperCase();
      if (aadhaarNumber !== undefined) employee.aadhaarNumber = aadhaarNumber.trim();
      if (uanNumber !== undefined) employee.uanNumber = uanNumber.trim();
      if (esiNumber !== undefined) employee.esiNumber = esiNumber.trim();

      // Real Bank Details
      if (bankDetails) {
        employee.bankDetails = {
          bankName: bankDetails.bankName || employee.bankDetails?.bankName || '',
          accountNumber: bankDetails.accountNumber || employee.bankDetails?.accountNumber || '',
          ifscCode: bankDetails.ifscCode ? bankDetails.ifscCode.trim().toUpperCase() : (employee.bankDetails?.ifscCode || ''),
          accountHolderName: bankDetails.accountHolderName || employee.bankDetails?.accountHolderName || user.name,
          branchName: bankDetails.branchName || employee.bankDetails?.branchName || '',
        };
      }

      await employee.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully!',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
      employee,
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
