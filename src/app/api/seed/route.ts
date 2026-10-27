import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { hashPassword } from '@/lib/auth';
import { Organization } from '@/models/Organization';
import { User } from '@/models/User';
import { Branch, Department, Designation } from '@/models/OrganizationStructure';
import { Employee } from '@/models/Employee';
import { Attendance } from '@/models/Attendance';
import { LeaveBalance, LeaveRequest } from '@/models/Leave';
import { SalaryStructure, PayrollRun, Payslip } from '@/models/Payroll';
import { JobRequisition, Candidate } from '@/models/Recruitment';
import { DocumentTemplate, IssuedDocument } from '@/models/DocumentManagement';
import { Project, Timesheet, ExpenseClaim, Goal, Asset, HelpdeskTicket, AuditLog } from '@/models/Operations';

export async function POST() {
  try {
    await connectToDatabase();

    const existingOrg = await Organization.findOne({ slug: 'techcorp' });
    if (existingOrg) {
      return NextResponse.json({
        success: true,
        message: 'Database already initialized with multi-tenant data.',
        organization: existingOrg,
      });
    }

    // 1. Create Organization
    const org = await Organization.create({
      name: 'TechCorp Solutions India Pvt Ltd',
      slug: 'techcorp',
      website: 'https://techcorp.in',
      contactEmail: 'contact@techcorp.in',
      contactPhone: '+91 80 4123 4567',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      plan: 'ENTERPRISE',
      planStatus: 'ACTIVE',
      employeeLimit: 500,
      address: {
        line1: 'Indiranagar 100ft Road, Stage 2',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
        country: 'India',
      },
      statutoryConfig: {
        epfEnabled: true,
        epfNumber: 'KN/BNG/1234567/000',
        esiEnabled: true,
        esiNumber: '53-00-123456-000-0001',
        panNumber: 'AAACT1234C',
        tanNumber: 'BLRT12345E',
        gstNumber: '29AAACT1234C1Z5',
        ptState: 'Karnataka',
      },
      workWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    });

    // 2. Branches
    const bangaloreBranch = await Branch.create({
      organizationId: org._id,
      name: 'Bengaluru Innovation Center',
      code: 'BLR-HQ',
      address: 'Indiranagar 100ft Road, Bengaluru',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      isHeadquarters: true,
    });

    const mumbaiBranch = await Branch.create({
      organizationId: org._id,
      name: 'Mumbai Financial Hub',
      code: 'MUM-01',
      address: 'BKC, Bandra East, Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      isHeadquarters: false,
    });

    // 3. Departments
    const engDept = await Department.create({
      organizationId: org._id,
      name: 'Engineering & Technology',
      code: 'ENG',
      description: 'Core software engineering and architecture',
    });

    const hrDept = await Department.create({
      organizationId: org._id,
      name: 'Human Resources & Talent',
      code: 'HR',
      description: 'People operations, payroll, and culture',
    });

    const financeDept = await Department.create({
      organizationId: org._id,
      name: 'Finance & Accounts',
      code: 'FIN',
      description: 'Statutory compliance, treasury, and accounting',
    });

    const productDept = await Department.create({
      organizationId: org._id,
      name: 'Product & Design',
      code: 'PROD',
      description: 'Product strategy, UI/UX, and research',
    });

    // 4. Designations
    const desigTechLead = await Designation.create({
      organizationId: org._id,
      departmentId: engDept._id,
      title: 'Lead Software Architect',
      code: 'ENG-L1',
      grade: 'L4',
    });

    const desigSrDev = await Designation.create({
      organizationId: org._id,
      departmentId: engDept._id,
      title: 'Senior Full Stack Engineer',
      code: 'ENG-SDE2',
      grade: 'L3',
    });

    const desigHrLead = await Designation.create({
      organizationId: org._id,
      departmentId: hrDept._id,
      title: 'Head of People Operations',
      code: 'HR-DIR',
      grade: 'Director',
    });

    const desigFinanceLead = await Designation.create({
      organizationId: org._id,
      departmentId: financeDept._id,
      title: 'Senior Payroll & Tax Specialist',
      code: 'FIN-SPEC',
      grade: 'L3',
    });

    const desigDesigner = await Designation.create({
      organizationId: org._id,
      departmentId: productDept._id,
      title: 'Staff UI/UX Designer',
      code: 'PROD-DES',
      grade: 'L3',
    });

    // 5. Default Password Hash: Admin@12345
    const defaultPasswordHash = await hashPassword('Admin@12345');

    // Super Admin User (SaaS platform owner)
    await User.create({
      email: 'superadmin@hrms.com',
      passwordHash: defaultPasswordHash,
      name: 'Kavita Iyer (Super Admin)',
      role: 'SUPER_ADMIN',
      isActive: true,
    });

    // Org Owner / Admin
    const orgAdminUser = await User.create({
      organizationId: org._id,
      email: 'admin@techcorp.in',
      passwordHash: defaultPasswordHash,
      name: 'Vikramaditya Singhania',
      phone: '+91 98200 11223',
      role: 'ORG_ADMIN',
      isActive: true,
    });

    // HR Admin User
    const hrAdminUser = await User.create({
      organizationId: org._id,
      email: 'hr@techcorp.in',
      passwordHash: defaultPasswordHash,
      name: 'Ananya Deshmukh',
      phone: '+91 98450 33445',
      role: 'HR_ADMIN',
      isActive: true,
    });

    // Payroll Admin User
    const payrollUser = await User.create({
      organizationId: org._id,
      email: 'finance@techcorp.in',
      passwordHash: defaultPasswordHash,
      name: 'Rohan Mehra',
      phone: '+91 98765 43210',
      role: 'PAYROLL_ADMIN',
      isActive: true,
    });

    // Manager User
    const managerUser = await User.create({
      organizationId: org._id,
      email: 'manager@techcorp.in',
      passwordHash: defaultPasswordHash,
      name: 'Siddharth Rao',
      phone: '+91 98111 22334',
      role: 'MANAGER',
      isActive: true,
    });

    // Recruiter User
    await User.create({
      organizationId: org._id,
      email: 'recruiter@techcorp.in',
      passwordHash: defaultPasswordHash,
      name: 'Meera Sen',
      phone: '+91 99000 88776',
      role: 'RECRUITER',
      isActive: true,
    });

    // 6. Create Employees
    // Manager Employee
    const managerEmp = await Employee.create({
      organizationId: org._id,
      userId: managerUser._id,
      employeeCode: 'EMP001',
      firstName: 'Siddharth',
      lastName: 'Rao',
      email: 'manager@techcorp.in',
      phone: '+91 98111 22334',
      gender: 'MALE',
      joiningDate: new Date('2023-01-15'),
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
      branchId: bangaloreBranch._id,
      departmentId: engDept._id,
      designationId: desigTechLead._id,
      ctcAnnual: 2400000,
      grossMonthly: 200000,
      basicSalary: 100000,
      hra: 50000,
      specialAllowance: 48400,
      conveyanceAllowance: 1600,
      panNumber: 'ABCDE1234F',
      aadhaarNumber: '2345 6789 0123',
      uanNumber: '100902837482',
      bankDetails: {
        accountHolderName: 'Siddharth Rao',
        accountNumber: '50100234567890',
        bankName: 'HDFC Bank',
        ifscCode: 'HDFC0001234',
        branchName: 'Indiranagar Bangalore',
      },
      currentAddress: 'Villa 12, Palm Meadows, Whitefield, Bengaluru',
    });
    managerUser.employeeId = managerEmp._id;
    await managerUser.save();

    // HR Employee
    const hrEmp = await Employee.create({
      organizationId: org._id,
      userId: hrAdminUser._id,
      employeeCode: 'EMP002',
      firstName: 'Ananya',
      lastName: 'Deshmukh',
      email: 'hr@techcorp.in',
      phone: '+91 98450 33445',
      gender: 'FEMALE',
      joiningDate: new Date('2023-03-01'),
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
      branchId: bangaloreBranch._id,
      departmentId: hrDept._id,
      designationId: desigHrLead._id,
      reportingManagerId: managerEmp._id,
      ctcAnnual: 1500000,
      grossMonthly: 125000,
      basicSalary: 62500,
      hra: 31250,
      specialAllowance: 29650,
      conveyanceAllowance: 1600,
      panNumber: 'BGHYU9876K',
      uanNumber: '100801928374',
      bankDetails: {
        accountHolderName: 'Ananya Deshmukh',
        accountNumber: '00120198273645',
        bankName: 'ICICI Bank',
        ifscCode: 'ICIC0000012',
        branchName: 'Koramangala Bangalore',
      },
    });
    hrAdminUser.employeeId = hrEmp._id;
    await hrAdminUser.save();

    // Employee 1: Arjun Sharma (Regular Employee)
    const empUser1 = await User.create({
      organizationId: org._id,
      email: 'employee@techcorp.in',
      passwordHash: defaultPasswordHash,
      name: 'Arjun Sharma',
      phone: '+91 97654 32109',
      role: 'EMPLOYEE',
      isActive: true,
    });

    const emp1 = await Employee.create({
      organizationId: org._id,
      userId: empUser1._id,
      employeeCode: 'EMP003',
      firstName: 'Arjun',
      lastName: 'Sharma',
      email: 'employee@techcorp.in',
      phone: '+91 97654 32109',
      gender: 'MALE',
      joiningDate: new Date('2024-02-01'),
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
      branchId: bangaloreBranch._id,
      departmentId: engDept._id,
      designationId: desigSrDev._id,
      reportingManagerId: managerEmp._id,
      ctcAnnual: 1200000,
      grossMonthly: 100000,
      basicSalary: 50000,
      hra: 25000,
      specialAllowance: 23400,
      conveyanceAllowance: 1600,
      panNumber: 'DFGTY4321P',
      aadhaarNumber: '3456 7890 1234',
      uanNumber: '100701827364',
      bankDetails: {
        accountHolderName: 'Arjun Sharma',
        accountNumber: '91827364501928',
        bankName: 'Axis Bank',
        ifscCode: 'UTIB0000123',
        branchName: 'MG Road Bangalore',
      },
    });
    empUser1.employeeId = emp1._id;
    await empUser1.save();

    // Employee 2: Priya Nair (UI/UX Designer)
    const empUser2 = await User.create({
      organizationId: org._id,
      email: 'priya.nair@techcorp.in',
      passwordHash: defaultPasswordHash,
      name: 'Priya Nair',
      phone: '+91 98222 33445',
      role: 'EMPLOYEE',
      isActive: true,
    });

    const emp2 = await Employee.create({
      organizationId: org._id,
      userId: empUser2._id,
      employeeCode: 'EMP004',
      firstName: 'Priya',
      lastName: 'Nair',
      email: 'priya.nair@techcorp.in',
      phone: '+91 98222 33445',
      gender: 'FEMALE',
      joiningDate: new Date('2024-04-10'),
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
      branchId: mumbaiBranch._id,
      departmentId: productDept._id,
      designationId: desigDesigner._id,
      reportingManagerId: managerEmp._id,
      ctcAnnual: 1080000,
      grossMonthly: 90000,
      basicSalary: 45000,
      hra: 22500,
      specialAllowance: 20900,
      conveyanceAllowance: 1600,
      panNumber: 'PLKMJ8876Q',
      bankDetails: {
        accountHolderName: 'Priya Nair',
        accountNumber: '44556677889900',
        bankName: 'State Bank of India',
        ifscCode: 'SBIN0001234',
        branchName: 'BKC Mumbai',
      },
    });
    empUser2.employeeId = emp2._id;
    await empUser2.save();

    // 7. Leave Balances for all employees
    const allEmployees = [managerEmp, hrEmp, emp1, emp2];
    for (const emp of allEmployees) {
      await LeaveBalance.create({
        organizationId: org._id,
        employeeId: emp._id,
        year: 2026,
        casualLeave: { total: 12, used: 2 },
        sickLeave: { total: 12, used: 1 },
        earnedLeave: { total: 15, used: 0 },
        unpaidLeave: { used: 0 },
      });
    }

    // 8. Sample Leave Requests
    await LeaveRequest.create({
      organizationId: org._id,
      employeeId: emp1._id,
      leaveType: 'CASUAL',
      startDate: '2026-10-28',
      endDate: '2026-10-29',
      totalDays: 2,
      isHalfDay: false,
      reason: 'Family function and personal commitment in home town',
      status: 'PENDING',
    });

    await LeaveRequest.create({
      organizationId: org._id,
      employeeId: emp2._id,
      leaveType: 'SICK',
      startDate: '2026-10-20',
      endDate: '2026-10-20',
      totalDays: 1,
      isHalfDay: false,
      reason: 'Viral fever and doctor consultation',
      status: 'APPROVED',
      reviewedBy: managerUser._id,
      reviewedAt: new Date('2026-10-20T10:00:00Z'),
      reviewerRemarks: 'Approved. Get well soon.',
    });

    // 9. Attendance Logs for the current week
    const today = new Date().toISOString().split('T')[0];
    for (const emp of allEmployees) {
      await Attendance.create({
        organizationId: org._id,
        employeeId: emp._id,
        date: today,
        checkIn: new Date(new Date().setHours(9, 15, 0, 0)),
        checkOut: new Date(new Date().setHours(18, 30, 0, 0)),
        workHoursMinutes: 555,
        status: 'PRESENT',
        workLocation: 'OFFICE',
        notes: 'Biometric web check-in verified',
      });
    }

    // Sample regularization request
    await Attendance.create({
      organizationId: org._id,
      employeeId: emp1._id,
      date: '2026-10-24',
      workHoursMinutes: 0,
      status: 'ABSENT',
      workLocation: 'OFFICE',
      regularization: {
        requested: true,
        reason: 'Client meeting offsite at Indiranagar; forgot to punch web clock.',
        requestedCheckIn: new Date('2026-10-24T09:30:00Z'),
        requestedCheckOut: new Date('2026-10-24T18:45:00Z'),
        status: 'PENDING',
      },
    });

    // 10. Salary Structure & Processed Payroll Run
    const salaryStructure = await SalaryStructure.create({
      organizationId: org._id,
      name: 'India Standard Corporate Structure',
      description: 'Standard 50% Basic, 50% HRA of Basic, Statutory EPF, ESI, Professional Tax',
      isDefault: true,
      components: {
        basicPercentageOfGross: 50,
        hraPercentageOfBasic: 50,
        specialAllowancePercentage: 20,
        conveyanceFixed: 1600,
        epfEmployeeRate: 12,
        epfEmployerRate: 12,
        esiEmployeeRate: 0.75,
        esiEmployerRate: 3.25,
        professionalTaxMonthly: 200,
      },
    });

    // Create a real finalized October 2026 Payroll Run
    const payrollRun = await PayrollRun.create({
      organizationId: org._id,
      month: 10,
      year: 2026,
      title: 'October 2026 Monthly Payroll',
      totalEmployees: allEmployees.length,
      totalGrossPay: 515000,
      totalDeductions: 57400,
      totalNetPay: 457600,
      totalEmployerCost: 552000,
      status: 'APPROVED',
      approvedBy: orgAdminUser._id,
      approvedAt: new Date(),
      paymentReference: 'HDFC-NEFT-BATCH-20261027',
      notes: 'All attendance synchronized and approved. Statutory EPF & PT deductions computed.',
    });

    // Create detailed Payslips for each employee in the run
    for (const emp of allEmployees) {
      const basic = emp.basicSalary;
      const hra = emp.hra;
      const spl = emp.specialAllowance;
      const conveyance = emp.conveyanceAllowance;
      const gross = emp.grossMonthly;

      // 12% of Basic for EPF (capped at 1800 or actual)
      const epfEmployee = Math.round(basic * 0.12);
      const epfEmployer = epfEmployee;
      const pt = 200; // Karnataka PT
      const tds = Math.round(gross * 0.05); // Sample standard TDS deduction
      const totalDeductions = epfEmployee + pt + tds;
      const net = gross - totalDeductions;

      await Payslip.create({
        organizationId: org._id,
        payrollRunId: payrollRun._id,
        employeeId: emp._id,
        month: 10,
        year: 2026,
        payslipNumber: `PAY-2026-10-${emp.employeeCode}`,
        totalDaysInMonth: 31,
        payableDays: 31,
        presentDays: 23,
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
        esiEmployee: 0,
        professionalTax: pt,
        incomeTaxTds: tds,
        loanAdvanceDeduction: 0,
        totalDeductions,
        netSalary: net,
        epfEmployer,
        esiEmployer: 0,
        gratuityContribution: Math.round((basic * 15) / 26),
        isPublished: true,
        publishedAt: new Date(),
        paymentMethod: 'BANK_TRANSFER',
        paymentStatus: 'SUCCESS',
        paymentReference: `NEFT-${emp.employeeCode}-202610`,
      });
    }

    // 11. Recruitment ATS Job Requisitions & Candidates
    const jobEng = await JobRequisition.create({
      organizationId: org._id,
      title: 'Senior Full Stack Engineer (Next.js & Node)',
      departmentId: engDept._id,
      branchId: bangaloreBranch._id,
      jobType: 'FULL_TIME',
      experienceRequired: '3-6 years',
      openings: 2,
      salaryMin: 1200000,
      salaryMax: 1800000,
      description: 'Looking for high-impact engineers to build scalable SaaS systems and APIs.',
      requirements: ['TypeScript', 'Next.js', 'MongoDB/PostgreSQL', 'System Architecture'],
      status: 'OPEN',
      hiringManagerId: managerEmp._id,
    });

    const jobDesign = await JobRequisition.create({
      organizationId: org._id,
      title: 'Senior UI/UX Designer',
      departmentId: productDept._id,
      branchId: mumbaiBranch._id,
      jobType: 'FULL_TIME',
      experienceRequired: '4-7 years',
      openings: 1,
      salaryMin: 1000000,
      salaryMax: 1600000,
      description: 'Lead design systems and user workflows for modern enterprise applications.',
      requirements: ['Figma', 'Design Systems', 'Micro-interactions', 'User Research'],
      status: 'OPEN',
      hiringManagerId: managerEmp._id,
    });

    // Candidates in various stages
    await Candidate.create({
      organizationId: org._id,
      jobId: jobEng._id,
      firstName: 'Karan',
      lastName: 'Malhotra',
      email: 'karan.malhotra@gmail.com',
      phone: '+91 99887 76655',
      currentCompany: 'FinTech Labs India',
      currentCtc: 1200000,
      expectedCtc: 1600000,
      noticePeriodDays: 30,
      stage: 'OFFER',
      rating: 5,
      source: 'LINKEDIN',
      interviewNotes: [
        {
          round: 'Technical Architecture Round',
          interviewerName: 'Siddharth Rao',
          date: new Date('2026-10-22'),
          feedback: 'Exceptional grasp of scalable distributed state, microservices, and TypeScript.',
          rating: 5,
        },
      ],
      offerDetails: {
        offeredCtc: 1650000,
        joiningDate: new Date('2026-11-15'),
        offerLetterIssued: true,
        status: 'OFFER_MADE',
      },
    });

    await Candidate.create({
      organizationId: org._id,
      jobId: jobEng._id,
      firstName: 'Ritu',
      lastName: 'Bansal',
      email: 'ritu.bansal@gmail.com',
      phone: '+91 98771 12233',
      currentCompany: 'Infosys Ltd',
      currentCtc: 900000,
      expectedCtc: 1300000,
      stage: 'INTERVIEW',
      rating: 4,
      source: 'REFERRAL',
    });

    await Candidate.create({
      organizationId: org._id,
      jobId: jobDesign._id,
      firstName: 'Sneha',
      lastName: 'Kapoor',
      email: 'sneha.k@outlook.com',
      phone: '+91 91234 56780',
      currentCompany: 'DesignScape Studios',
      currentCtc: 850000,
      expectedCtc: 1200000,
      stage: 'SHORTLISTED',
      rating: 4,
      source: 'CAREERS_PAGE',
    });

    // 12. Document Templates & Issued Offer Letter
    const offerTemplate = await DocumentTemplate.create({
      organizationId: org._id,
      type: 'OFFER_LETTER',
      title: 'Standard Corporate Employment Offer Letter',
      isDefault: true,
      templateBody: `Dear {{recipientName}},\n\nWe are pleased to extend an offer of employment for the position of {{designation}} at {{organizationName}}.\n\nYour annual Cost to Company (CTC) will be INR {{ctc}} per annum. Your anticipated joining date is {{joiningDate}} at our {{branchName}} office.\n\nPlease sign and return this document to confirm your acceptance.\n\nWarm regards,\n{{hrName}}\nPeople Operations`,
    });

    await IssuedDocument.create({
      organizationId: org._id,
      documentType: 'OFFER_LETTER',
      documentNumber: 'DOC-OFFER-2026-001',
      recipientName: 'Karan Malhotra',
      recipientEmail: 'karan.malhotra@gmail.com',
      title: 'Employment Offer Letter - Senior Full Stack Engineer',
      content: `Dear Karan Malhotra,\n\nWe are pleased to extend an offer of employment for the position of Senior Full Stack Engineer at TechCorp Solutions India Pvt Ltd.\n\nYour annual Cost to Company (CTC) will be INR 16,50,000 per annum. Your anticipated joining date is November 15, 2026 at our Bengaluru Innovation Center office.\n\nPlease confirm your acceptance by signing below.\n\nWarm regards,\nAnanya Deshmukh\nHead of People Operations`,
      status: 'ISSUED',
      issuedAt: new Date(),
    });

    // 13. Assets & Equipment
    await Asset.create({
      organizationId: org._id,
      name: 'Apple MacBook Pro 16" M2 Pro',
      assetCode: 'AST-LAP-001',
      category: 'LAPTOP',
      serialNumber: 'C02G9988HJKL',
      purchaseDate: new Date('2023-05-10'),
      purchaseCost: 220000,
      status: 'ASSIGNED',
      assignedToEmployeeId: emp1._id,
      assignedAt: new Date('2024-02-01'),
    });

    await Asset.create({
      organizationId: org._id,
      name: 'Dell UltraSharp 27" 4K Monitor',
      assetCode: 'AST-MON-002',
      category: 'MONITOR',
      serialNumber: 'CN-098765-XYZ',
      purchaseCost: 45000,
      status: 'ASSIGNED',
      assignedToEmployeeId: emp2._id,
    });

    await Asset.create({
      organizationId: org._id,
      name: 'MacBook Air 15" M3 (Spare Inventory)',
      assetCode: 'AST-LAP-003',
      category: 'LAPTOP',
      serialNumber: 'C02K1122ABCD',
      purchaseCost: 134000,
      status: 'AVAILABLE',
    });

    // 14. Projects & Timesheets
    const projectA = await Project.create({
      organizationId: org._id,
      name: 'Core Banking API Modernization',
      code: 'PRJ-BANK-01',
      clientName: 'Apex Financial Services',
      status: 'ACTIVE',
      assignedEmployees: [emp1._id, managerEmp._id],
    });

    await Timesheet.create({
      organizationId: org._id,
      employeeId: emp1._id,
      projectId: projectA._id,
      date: today,
      hours: 8,
      description: 'Implemented multi-tenant JWT middleware and MongoDB compound index optimizations.',
      isBillable: true,
      status: 'APPROVED',
      reviewedBy: managerUser._id,
    });

    // 15. Expense Claims
    await ExpenseClaim.create({
      organizationId: org._id,
      employeeId: emp1._id,
      claimNumber: 'EXP-2026-001',
      category: 'TRAVEL',
      amount: 4500,
      expenseDate: '2026-10-23',
      description: 'Taxi fares and client dinner during Mumbai branch deployment review.',
      status: 'APPROVED',
      reviewedBy: managerUser._id,
      reviewedAt: new Date(),
    });

    // 16. Goals & KPIs
    await Goal.create({
      organizationId: org._id,
      employeeId: emp1._id,
      title: 'Achieve Sub-100ms P95 API Latency for Payroll Runs',
      description: 'Optimize MongoDB aggregation pipelines and indexing for multi-tenant batch salary calculation.',
      category: 'INDIVIDUAL',
      targetDate: '2026-12-31',
      progressPercentage: 75,
      weightage: 30,
      status: 'IN_PROGRESS',
    });

    // 17. Helpdesk Tickets
    await HelpdeskTicket.create({
      organizationId: org._id,
      employeeId: emp2._id,
      ticketNumber: 'TKT-2026-001',
      category: 'PAYROLL',
      priority: 'MEDIUM',
      subject: 'Clarification regarding Form 12BB and Section 80C Tax Proof Submission',
      description: 'Kindly advise on the portal window cutoff date for submitting ELSS and Term Insurance tax receipts for FY 2026-27.',
      status: 'IN_PROGRESS',
      assignedToUserId: payrollUser._id,
    });

    // 18. Audit Log
    await AuditLog.create({
      organizationId: org._id,
      userId: orgAdminUser._id,
      userName: orgAdminUser.name,
      action: 'ORGANIZATION_INITIALIZED_AND_SEEDED',
      entityType: 'Organization',
      entityId: String(org._id),
      details: {
        plan: 'ENTERPRISE',
        employeesCount: allEmployees.length,
        payrollApprovedMonth: 10,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Full-scale multi-tenant HRMS seeded successfully with real dynamic records!',
      organizationId: org._id,
      orgSlug: org.slug,
      accounts: [
        { role: 'SUPER_ADMIN', email: 'superadmin@hrms.com', password: 'Admin@12345' },
        { role: 'ORG_ADMIN', email: 'admin@techcorp.in', password: 'Admin@12345' },
        { role: 'HR_ADMIN', email: 'hr@techcorp.in', password: 'Admin@12345' },
        { role: 'PAYROLL_ADMIN', email: 'finance@techcorp.in', password: 'Admin@12345' },
        { role: 'MANAGER', email: 'manager@techcorp.in', password: 'Admin@12345' },
        { role: 'EMPLOYEE', email: 'employee@techcorp.in', password: 'Admin@12345' },
        { role: 'RECRUITER', email: 'recruiter@techcorp.in', password: 'Admin@12345' },
      ],
    });
  } catch (error: any) {
    console.error('Seeding error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to seed database' },
      { status: 500 }
    );
  }
}
