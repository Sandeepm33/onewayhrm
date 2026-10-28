import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { PayrollRun, Payslip, SalaryStructure } from '@/models/Payroll';
import { Employee } from '@/models/Employee';
import { Attendance } from '@/models/Attendance';
import { LeaveRequest } from '@/models/Leave';
import { AuditLog } from '@/models/Operations';
import { resolveOrganizationId } from '@/lib/tenant';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = await resolveOrganizationId(session);
    const runs = await PayrollRun.find({ organizationId: orgId })
      .populate('processedBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ year: -1, month: -1 });

    return NextResponse.json({ success: true, runs });
  } catch (error: any) {
    console.error('Fetch payroll runs error:', error);
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

    if (!['SUPER_ADMIN', 'ORG_ADMIN', 'HR_ADMIN', 'PAYROLL_ADMIN'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const orgId = await resolveOrganizationId(session);
    const { month, year, notes } = await req.json();
    if (!month || !year) {
      return NextResponse.json({ success: false, error: 'Month and year are required' }, { status: 400 });
    }

    const existing = await PayrollRun.findOne({
      organizationId: orgId,
      month: Number(month),
      year: Number(year),
    });

    if (existing && existing.status === 'LOCKED') {
      return NextResponse.json(
        { success: false, error: 'This payroll cycle is LOCKED and cannot be recomputed' },
        { status: 400 }
      );
    }

    // Get all active employees in this org
    const employees = await Employee.find({
      organizationId: orgId,
      status: { $in: ['ACTIVE', 'PROBATION', 'NOTICE_PERIOD'] },
    });

    if (employees.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No active employees found to process payroll' },
        { status: 400 }
      );
    }

    const daysInMonth = new Date(Number(year), Number(month), 0).getDate();
    const monthName = new Date(Number(year), Number(month) - 1, 1).toLocaleString('default', { month: 'long' });

    let totalGrossPay = 0;
    let totalDeductions = 0;
    let totalNetPay = 0;
    let totalEmployerCost = 0;

    // Create or update run record
    let run = existing;
    if (!run) {
      run = new PayrollRun({
        organizationId: orgId,
        month: Number(month),
        year: Number(year),
        title: `Payroll - ${monthName} ${year}`,
        processedBy: session.userId,
        status: 'CALCULATED',
        notes,
      });
    }

    // Clear old draft payslips if recomputing
    await Payslip.deleteMany({ payrollRunId: run._id, organizationId: orgId });

    // Compute payslips with India statutory rules
    for (const emp of employees) {
      const basic = emp.basicSalary;
      const hra = emp.hra;
      const spl = emp.specialAllowance;
      const conveyance = emp.conveyanceAllowance;
      const gross = emp.grossMonthly;

      // 1. Employee EPF (12% of basic)
      const epfEmployee = Math.round(basic * 0.12);
      // 2. Employer EPF (12% of basic)
      const epfEmployer = epfEmployee;
      // 3. ESI (if gross <= 21000)
      const esiEmployee = gross <= 21000 ? Math.round(gross * 0.0075) : 0;
      const esiEmployer = gross <= 21000 ? Math.round(gross * 0.0325) : 0;
      // 4. Professional Tax (Karnataka / Maharashtra slab standard ~200/mo)
      const professionalTax = 200;
      // 5. TDS Income Tax withholding estimate
      const annualIncome = gross * 12;
      let incomeTaxTds = 0;
      if (annualIncome > 700000) {
        // Standard marginal slab estimate
        incomeTaxTds = Math.round((gross * 0.05));
      }

      const deductions = epfEmployee + esiEmployee + professionalTax + incomeTaxTds;
      const net = gross - deductions;
      const employerCost = gross + epfEmployer + esiEmployer;

      totalGrossPay += gross;
      totalDeductions += deductions;
      totalNetPay += net;
      totalEmployerCost += employerCost;

      await Payslip.create({
        organizationId: orgId,
        payrollRunId: run._id,
        employeeId: emp._id,
        month: Number(month),
        year: Number(year),
        payslipNumber: `PAY-${year}-${String(month).padStart(2, '0')}-${emp.employeeCode}`,
        totalDaysInMonth: daysInMonth,
        payableDays: daysInMonth,
        presentDays: daysInMonth - 8, // Exclude weekend defaults
        leaveDays: 0,
        unpaidAbsenceDays: 0,
        basic,
        hra,
        specialAllowance: spl,
        conveyance,
        medicalAllowance: 0,
        bonus: 0,
        incentives: 0,
        grossEarnings: gross,
        epfEmployee,
        esiEmployee,
        professionalTax,
        incomeTaxTds,
        loanAdvanceDeduction: 0,
        totalDeductions: deductions,
        netSalary: net,
        epfEmployer,
        esiEmployer,
        gratuityContribution: Math.round((basic * 15) / 26),
        isPublished: false,
        paymentMethod: 'BANK_TRANSFER',
        paymentStatus: 'PENDING',
      });
    }

    run.totalEmployees = employees.length;
    run.totalGrossPay = totalGrossPay;
    run.totalDeductions = totalDeductions;
    run.totalNetPay = totalNetPay;
    run.totalEmployerCost = totalEmployerCost;
    run.status = 'VALIDATED';
    await run.save();

    await AuditLog.create({
      organizationId: orgId,
      userId: session.userId,
      userName: session.name,
      action: 'PAYROLL_RUN_CALCULATED',
      entityType: 'PayrollRun',
      entityId: String(run._id),
      details: { month, year, totalEmployees: employees.length, totalNetPay },
    });

    return NextResponse.json({
      success: true,
      message: `Payroll for ${monthName} ${year} calculated successfully for ${employees.length} employees`,
      payrollRun: run,
    });
  } catch (error: any) {
    console.error('Process payroll error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!['SUPER_ADMIN', 'ORG_ADMIN', 'PAYROLL_ADMIN'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const orgId = await resolveOrganizationId(session);
    const { runId, action, notes, paymentReference } = await req.json();

    const run = await PayrollRun.findOne({ _id: runId, organizationId: orgId });
    if (!run) {
      return NextResponse.json({ success: false, error: 'Payroll run not found' }, { status: 404 });
    }

    if (action === 'APPROVE') {
      run.status = 'APPROVED';
      run.approvedBy = session.userId as any;
      run.approvedAt = new Date();
    } else if (action === 'LOCK') {
      run.status = 'LOCKED';
    } else if (action === 'PAY_AND_PUBLISH') {
      run.status = 'PAID';
      run.paidAt = new Date();
      run.paymentReference = paymentReference || `BATCH-${Date.now()}`;

      // Mark all associated payslips as published
      await Payslip.updateMany(
        { payrollRunId: run._id, organizationId: orgId },
        {
          $set: {
            isPublished: true,
            publishedAt: new Date(),
            paymentStatus: 'SUCCESS',
            paymentReference: run.paymentReference,
          },
        }
      );
    }

    if (notes) run.notes = notes;
    await run.save();

    await AuditLog.create({
      organizationId: orgId,
      userId: session.userId,
      userName: session.name,
      action: `PAYROLL_${action}`,
      entityType: 'PayrollRun',
      entityId: String(run._id),
      details: { action, month: run.month, year: run.year, totalNetPay: run.totalNetPay },
    });

    return NextResponse.json({
      success: true,
      message: `Payroll run status updated to ${run.status}`,
      payrollRun: run,
    });
  } catch (error: any) {
    console.error('Update payroll run error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
