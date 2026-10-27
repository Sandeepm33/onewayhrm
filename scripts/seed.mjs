import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = 'mongodb+srv://shareitem4_db_user:gmLTLZ5HgUox9Icq@cluster0.dqw90fr.mongodb.net/neighbournet?retryWrites=true&w=majority';

async function seed() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected! Checking existing data...');

  const db = mongoose.connection.db;
  
  // Clean or check
  const orgCollection = db.collection('organizations');
  const existingOrg = await orgCollection.findOne({ slug: 'techcorp' });
  if (existingOrg) {
    console.log('Found existing TechCorp organization with ID:', existingOrg._id);
    console.log('Database is already seeded with real dynamic records!');
    await mongoose.disconnect();
    return;
  }

  console.log('Seeding fresh multi-tenant organization, users, and full HRMS records...');
  const passwordHash = await bcrypt.hash('Admin@12345', 10);

  // 1. Organization
  const orgResult = await orgCollection.insertOne({
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
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const orgId = orgResult.insertedId;
  console.log('Created Organization:', orgId);

  // 2. Branches
  const branchCol = db.collection('branches');
  const blrBranch = await branchCol.insertOne({
    organizationId: orgId,
    name: 'Bengaluru Innovation Center',
    code: 'BLR-HQ',
    address: 'Indiranagar 100ft Road, Bengaluru',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    isHeadquarters: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const mumBranch = await branchCol.insertOne({
    organizationId: orgId,
    name: 'Mumbai Financial Hub',
    code: 'MUM-01',
    address: 'BKC, Bandra East, Mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    isHeadquarters: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // 3. Departments
  const deptCol = db.collection('departments');
  const engDept = await deptCol.insertOne({
    organizationId: orgId,
    name: 'Engineering & Technology',
    code: 'ENG',
    description: 'Core software engineering and architecture',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const hrDept = await deptCol.insertOne({
    organizationId: orgId,
    name: 'Human Resources & Talent',
    code: 'HR',
    description: 'People operations, payroll, and culture',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const finDept = await deptCol.insertOne({
    organizationId: orgId,
    name: 'Finance & Accounts',
    code: 'FIN',
    description: 'Statutory compliance, treasury, and accounting',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const prodDept = await deptCol.insertOne({
    organizationId: orgId,
    name: 'Product & Design',
    code: 'PROD',
    description: 'Product strategy, UI/UX, and research',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // 4. Designations
  const desigCol = db.collection('designations');
  const desigLead = await desigCol.insertOne({
    organizationId: orgId,
    departmentId: engDept.insertedId,
    title: 'Lead Software Architect',
    code: 'ENG-L1',
    grade: 'L4',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const desigSrDev = await desigCol.insertOne({
    organizationId: orgId,
    departmentId: engDept.insertedId,
    title: 'Senior Full Stack Engineer',
    code: 'ENG-SDE2',
    grade: 'L3',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const desigHrLead = await desigCol.insertOne({
    organizationId: orgId,
    departmentId: hrDept.insertedId,
    title: 'Head of People Operations',
    code: 'HR-DIR',
    grade: 'Director',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const desigFin = await desigCol.insertOne({
    organizationId: orgId,
    departmentId: finDept.insertedId,
    title: 'Senior Payroll Specialist',
    code: 'FIN-SPEC',
    grade: 'L3',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const desigDes = await desigCol.insertOne({
    organizationId: orgId,
    departmentId: prodDept.insertedId,
    title: 'Staff UI/UX Designer',
    code: 'PROD-DES',
    grade: 'L3',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // 5. Users
  const userCol = db.collection('users');
  const superAdmin = await userCol.insertOne({
    email: 'superadmin@hrms.com',
    passwordHash,
    name: 'Kavita Iyer (Super Admin)',
    role: 'SUPER_ADMIN',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const adminUser = await userCol.insertOne({
    organizationId: orgId,
    email: 'admin@techcorp.in',
    passwordHash,
    name: 'Vikramaditya Singhania',
    phone: '+91 98200 11223',
    role: 'ORG_ADMIN',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const hrUser = await userCol.insertOne({
    organizationId: orgId,
    email: 'hr@techcorp.in',
    passwordHash,
    name: 'Ananya Deshmukh',
    phone: '+91 98450 33445',
    role: 'HR_ADMIN',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const payrollUser = await userCol.insertOne({
    organizationId: orgId,
    email: 'finance@techcorp.in',
    passwordHash,
    name: 'Rohan Mehra',
    phone: '+91 98765 43210',
    role: 'PAYROLL_ADMIN',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const managerUser = await userCol.insertOne({
    organizationId: orgId,
    email: 'manager@techcorp.in',
    passwordHash,
    name: 'Siddharth Rao',
    phone: '+91 98111 22334',
    role: 'MANAGER',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const employeeUser = await userCol.insertOne({
    organizationId: orgId,
    email: 'employee@techcorp.in',
    passwordHash,
    name: 'Arjun Sharma',
    phone: '+91 97654 32109',
    role: 'EMPLOYEE',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const recruiterUser = await userCol.insertOne({
    organizationId: orgId,
    email: 'recruiter@techcorp.in',
    passwordHash,
    name: 'Meera Sen',
    phone: '+91 99000 88776',
    role: 'RECRUITER',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // 6. Employees
  const empCol = db.collection('employees');
  const managerEmp = await empCol.insertOne({
    organizationId: orgId,
    userId: managerUser.insertedId,
    employeeCode: 'EMP001',
    firstName: 'Siddharth',
    lastName: 'Rao',
    email: 'manager@techcorp.in',
    phone: '+91 98111 22334',
    gender: 'MALE',
    joiningDate: new Date('2023-01-15'),
    employmentType: 'FULL_TIME',
    status: 'ACTIVE',
    branchId: blrBranch.insertedId,
    departmentId: engDept.insertedId,
    designationId: desigLead.insertedId,
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
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const hrEmp = await empCol.insertOne({
    organizationId: orgId,
    userId: hrUser.insertedId,
    employeeCode: 'EMP002',
    firstName: 'Ananya',
    lastName: 'Deshmukh',
    email: 'hr@techcorp.in',
    phone: '+91 98450 33445',
    gender: 'FEMALE',
    joiningDate: new Date('2023-03-01'),
    employmentType: 'FULL_TIME',
    status: 'ACTIVE',
    branchId: blrBranch.insertedId,
    departmentId: hrDept.insertedId,
    designationId: desigHrLead.insertedId,
    reportingManagerId: managerEmp.insertedId,
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
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const emp1 = await empCol.insertOne({
    organizationId: orgId,
    userId: employeeUser.insertedId,
    employeeCode: 'EMP003',
    firstName: 'Arjun',
    lastName: 'Sharma',
    email: 'employee@techcorp.in',
    phone: '+91 97654 32109',
    gender: 'MALE',
    joiningDate: new Date('2024-02-01'),
    employmentType: 'FULL_TIME',
    status: 'ACTIVE',
    branchId: blrBranch.insertedId,
    departmentId: engDept.insertedId,
    designationId: desigSrDev.insertedId,
    reportingManagerId: managerEmp.insertedId,
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
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const emp2 = await empCol.insertOne({
    organizationId: orgId,
    employeeCode: 'EMP004',
    firstName: 'Priya',
    lastName: 'Nair',
    email: 'priya.nair@techcorp.in',
    phone: '+91 98222 33445',
    gender: 'FEMALE',
    joiningDate: new Date('2024-04-10'),
    employmentType: 'FULL_TIME',
    status: 'ACTIVE',
    branchId: mumBranch.insertedId,
    departmentId: prodDept.insertedId,
    designationId: desigDes.insertedId,
    reportingManagerId: managerEmp.insertedId,
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
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Link employee IDs back to user accounts
  await userCol.updateOne({ _id: managerUser.insertedId }, { $set: { employeeId: managerEmp.insertedId } });
  await userCol.updateOne({ _id: hrUser.insertedId }, { $set: { employeeId: hrEmp.insertedId } });
  await userCol.updateOne({ _id: employeeUser.insertedId }, { $set: { employeeId: emp1.insertedId } });

  // 7. Leave Balances
  const leaveBalCol = db.collection('leavebalances');
  const allEmpIds = [managerEmp.insertedId, hrEmp.insertedId, emp1.insertedId, emp2.insertedId];
  for (const empId of allEmpIds) {
    await leaveBalCol.insertOne({
      organizationId: orgId,
      employeeId: empId,
      year: 2026,
      casualLeave: { total: 12, used: 2 },
      sickLeave: { total: 12, used: 1 },
      earnedLeave: { total: 15, used: 0 },
      unpaidLeave: { used: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // 8. Leave Requests
  const leaveReqCol = db.collection('leaverequests');
  await leaveReqCol.insertOne({
    organizationId: orgId,
    employeeId: emp1.insertedId,
    leaveType: 'CASUAL',
    startDate: '2026-10-28',
    endDate: '2026-10-29',
    totalDays: 2,
    isHalfDay: false,
    reason: 'Family function and personal commitment in hometown',
    status: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await leaveReqCol.insertOne({
    organizationId: orgId,
    employeeId: emp2.insertedId,
    leaveType: 'SICK',
    startDate: '2026-10-20',
    endDate: '2026-10-20',
    totalDays: 1,
    isHalfDay: false,
    reason: 'Viral fever and doctor consultation',
    status: 'APPROVED',
    reviewedBy: managerUser.insertedId,
    reviewedAt: new Date('2026-10-20T10:00:00Z'),
    reviewerRemarks: 'Approved. Get well soon.',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // 9. Attendance
  const attCol = db.collection('attendances');
  const todayStr = new Date().toISOString().split('T')[0];
  for (const empId of allEmpIds) {
    await attCol.insertOne({
      organizationId: orgId,
      employeeId: empId,
      date: todayStr,
      checkIn: new Date(new Date().setHours(9, 15, 0, 0)),
      checkOut: new Date(new Date().setHours(18, 30, 0, 0)),
      workHoursMinutes: 555,
      status: 'PRESENT',
      workLocation: 'OFFICE',
      notes: 'Web Biometric Punch Verified',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  await attCol.insertOne({
    organizationId: orgId,
    employeeId: emp1.insertedId,
    date: '2026-10-24',
    workHoursMinutes: 0,
    status: 'ABSENT',
    workLocation: 'OFFICE',
    regularization: {
      requested: true,
      reason: 'Client meeting offsite at Indiranagar; missed punch on portal.',
      requestedCheckIn: new Date('2026-10-24T09:30:00Z'),
      requestedCheckOut: new Date('2026-10-24T18:45:00Z'),
      status: 'PENDING',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // 10. Salary Structure & October 2026 Payroll Run & Payslips
  const salaryStructureCol = db.collection('salarystructures');
  await salaryStructureCol.insertOne({
    organizationId: orgId,
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
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const payrollRunCol = db.collection('payrollruns');
  const runResult = await payrollRunCol.insertOne({
    organizationId: orgId,
    month: 10,
    year: 2026,
    title: 'October 2026 Monthly Payroll',
    totalEmployees: 4,
    totalGrossPay: 515000,
    totalDeductions: 57400,
    totalNetPay: 457600,
    totalEmployerCost: 552000,
    status: 'APPROVED',
    approvedBy: adminUser.insertedId,
    approvedAt: new Date(),
    paymentReference: 'HDFC-NEFT-BATCH-20261027',
    notes: 'Approved by Org Admin. Bank transfer file prepared.',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const payslipCol = db.collection('payslips');
  const empDetails = [
    { id: managerEmp.insertedId, code: 'EMP001', gross: 200000, basic: 100000, hra: 50000, spl: 48400, conv: 1600 },
    { id: hrEmp.insertedId, code: 'EMP002', gross: 125000, basic: 62500, hra: 31250, spl: 29650, conv: 1600 },
    { id: emp1.insertedId, code: 'EMP003', gross: 100000, basic: 50000, hra: 25000, spl: 23400, conv: 1600 },
    { id: emp2.insertedId, code: 'EMP004', gross: 90000, basic: 45000, hra: 22500, spl: 20900, conv: 1600 },
  ];

  for (const emp of empDetails) {
    const epf = Math.round(emp.basic * 0.12);
    const pt = 200;
    const tds = Math.round(emp.gross * 0.05);
    const totDed = epf + pt + tds;
    const net = emp.gross - totDed;

    await payslipCol.insertOne({
      organizationId: orgId,
      payrollRunId: runResult.insertedId,
      employeeId: emp.id,
      month: 10,
      year: 2026,
      payslipNumber: `PAY-2026-10-${emp.code}`,
      totalDaysInMonth: 31,
      payableDays: 31,
      presentDays: 23,
      leaveDays: 0,
      unpaidAbsenceDays: 0,
      basic: emp.basic,
      hra: emp.hra,
      specialAllowance: emp.spl,
      conveyance: emp.conv,
      medicalAllowance: 0,
      bonus: 0,
      incentives: 0,
      grossEarnings: emp.gross,
      epfEmployee: epf,
      esiEmployee: 0,
      professionalTax: pt,
      incomeTaxTds: tds,
      loanAdvanceDeduction: 0,
      totalDeductions: totDed,
      netSalary: net,
      epfEmployer: epf,
      esiEmployer: 0,
      gratuityContribution: Math.round((emp.basic * 15) / 26),
      isPublished: true,
      publishedAt: new Date(),
      paymentMethod: 'BANK_TRANSFER',
      paymentStatus: 'SUCCESS',
      paymentReference: `NEFT-${emp.code}-202610`,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // 11. Recruitment ATS
  const jobCol = db.collection('jobrequisitions');
  const jobEng = await jobCol.insertOne({
    organizationId: orgId,
    title: 'Senior Full Stack Engineer (Next.js & Node)',
    departmentId: engDept.insertedId,
    branchId: blrBranch.insertedId,
    jobType: 'FULL_TIME',
    experienceRequired: '3-6 years',
    openings: 2,
    salaryMin: 1200000,
    salaryMax: 1800000,
    description: 'Looking for high-impact engineers to build scalable SaaS systems and APIs.',
    requirements: ['TypeScript', 'Next.js', 'MongoDB', 'System Architecture'],
    status: 'OPEN',
    hiringManagerId: managerEmp.insertedId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const candidateCol = db.collection('candidates');
  await candidateCol.insertOne({
    organizationId: orgId,
    jobId: jobEng.insertedId,
    firstName: 'Karan',
    lastName: 'Malhotra',
    email: 'karan.malhotra@gmail.com',
    phone: '+91 99887 76655',
    currentCompany: 'FinTech Labs India',
    currentCtc: 1200000,
    expectedCtc: 1600000,
    stage: 'OFFER',
    rating: 5,
    source: 'LINKEDIN',
    offerDetails: {
      offeredCtc: 1650000,
      joiningDate: new Date('2026-11-15'),
      offerLetterIssued: true,
      status: 'OFFER_MADE',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await candidateCol.insertOne({
    organizationId: orgId,
    jobId: jobEng.insertedId,
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
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // 12. Documents
  const templateCol = db.collection('documenttemplates');
  await templateCol.insertOne({
    organizationId: orgId,
    type: 'OFFER_LETTER',
    title: 'Standard Corporate Employment Offer Letter',
    isDefault: true,
    templateBody: `Dear {{recipientName}},\n\nWe are pleased to extend an offer of employment for the position of {{designation}} at {{organizationName}}.\n\nYour annual Cost to Company (CTC) will be INR {{ctc}} per annum. Your anticipated joining date is {{joiningDate}}.\n\nWarm regards,\nPeople Operations`,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const docCol = db.collection('issueddocuments');
  await docCol.insertOne({
    organizationId: orgId,
    documentType: 'OFFER_LETTER',
    documentNumber: 'DOC-OFFER-2026-001',
    recipientName: 'Karan Malhotra',
    recipientEmail: 'karan.malhotra@gmail.com',
    title: 'Employment Offer Letter - Senior Full Stack Engineer',
    content: `Dear Karan Malhotra,\n\nWe are pleased to extend an offer of employment for the position of Senior Full Stack Engineer at TechCorp Solutions India Pvt Ltd.\n\nYour annual Cost to Company (CTC) will be INR 16,50,000 per annum. Your anticipated joining date is November 15, 2026 at our Bengaluru Innovation Center office.\n\nWarm regards,\nAnanya Deshmukh\nHead of People Operations`,
    status: 'ISSUED',
    issuedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // 13. Assets
  const assetCol = db.collection('assets');
  await assetCol.insertOne({
    organizationId: orgId,
    name: 'Apple MacBook Pro 16" M2 Pro',
    assetCode: 'AST-LAP-001',
    category: 'LAPTOP',
    serialNumber: 'C02G9988HJKL',
    purchaseDate: new Date('2023-05-10'),
    purchaseCost: 220000,
    status: 'ASSIGNED',
    assignedToEmployeeId: emp1.insertedId,
    assignedAt: new Date('2024-02-01'),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await assetCol.insertOne({
    organizationId: orgId,
    name: 'Dell UltraSharp 27" 4K Monitor',
    assetCode: 'AST-MON-002',
    category: 'MONITOR',
    serialNumber: 'CN-098765-XYZ',
    purchaseCost: 45000,
    status: 'ASSIGNED',
    assignedToEmployeeId: emp2.insertedId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // 14. Projects & Timesheets
  const projCol = db.collection('projects');
  const projectA = await projCol.insertOne({
    organizationId: orgId,
    name: 'Core Banking API Modernization',
    code: 'PRJ-BANK-01',
    clientName: 'Apex Financial Services',
    status: 'ACTIVE',
    assignedEmployees: [emp1.insertedId, managerEmp.insertedId],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const tsCol = db.collection('timesheets');
  await tsCol.insertOne({
    organizationId: orgId,
    employeeId: emp1.insertedId,
    projectId: projectA.insertedId,
    date: todayStr,
    hours: 8,
    description: 'Implemented multi-tenant JWT middleware and MongoDB compound index optimizations.',
    isBillable: true,
    status: 'APPROVED',
    reviewedBy: managerUser.insertedId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // 15. Expense Claims
  const expCol = db.collection('expenseclaims');
  await expCol.insertOne({
    organizationId: orgId,
    employeeId: emp1.insertedId,
    claimNumber: 'EXP-2026-001',
    category: 'TRAVEL',
    amount: 4500,
    expenseDate: '2026-10-23',
    description: 'Taxi fares and client dinner during Mumbai branch deployment review.',
    status: 'APPROVED',
    reviewedBy: managerUser.insertedId,
    reviewedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // 16. Goals
  const goalCol = db.collection('goals');
  await goalCol.insertOne({
    organizationId: orgId,
    employeeId: emp1.insertedId,
    title: 'Achieve Sub-100ms P95 API Latency for Payroll Runs',
    description: 'Optimize MongoDB aggregation pipelines and indexing for multi-tenant batch salary calculation.',
    category: 'INDIVIDUAL',
    targetDate: '2026-12-31',
    progressPercentage: 75,
    weightage: 30,
    status: 'IN_PROGRESS',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // 17. Helpdesk Tickets
  const ticketCol = db.collection('helpdesktickets');
  await ticketCol.insertOne({
    organizationId: orgId,
    employeeId: emp2.insertedId,
    ticketNumber: 'TKT-2026-001',
    category: 'PAYROLL',
    priority: 'MEDIUM',
    subject: 'Clarification regarding Form 12BB and Section 80C Tax Proof Submission',
    description: 'Kindly advise on the portal window cutoff date for submitting ELSS and Term Insurance tax receipts for FY 2026-27.',
    status: 'IN_PROGRESS',
    assignedToUserId: payrollUser.insertedId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // 18. Audit Log
  const auditCol = db.collection('auditlogs');
  await auditCol.insertOne({
    organizationId: orgId,
    userId: adminUser.insertedId,
    userName: 'Vikramaditya Singhania',
    action: 'ORGANIZATION_INITIALIZED_AND_SEEDED',
    entityType: 'Organization',
    entityId: String(orgId),
    details: {
      plan: 'ENTERPRISE',
      employeesCount: 4,
      payrollApprovedMonth: 10,
    },
    createdAt: new Date(),
  });

  console.log('>>> MONGO ATLAS SEED COMPLETE! Successfully initialized all HRMS collections! <<<');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
