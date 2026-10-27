export interface IOrgFeature {
  key: string;
  name: string;
  href: string;
  icon: string;
  enabled: boolean;
  description?: string;
  category?: 'CORE' | 'OPERATIONS' | 'FINANCE' | 'SYSTEM';
}

export const DEFAULT_SAAS_FEATURES: IOrgFeature[] = [
  { key: 'dashboard', name: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard', enabled: true, category: 'CORE', description: 'Central operational KPIs & web clock' },
  { key: 'employees', name: 'Employee Master', href: '/employees', icon: 'Users', enabled: true, category: 'CORE', description: 'Employee directories, onboardings & profiles' },
  { key: 'departments', name: 'Departments', href: '/departments', icon: 'Building2', enabled: true, category: 'CORE', description: 'Business units, subdepartments & cost centers' },
  { key: 'teams', name: 'Teams & Squads', href: '/teams', icon: 'Users2', enabled: true, category: 'CORE', description: 'Agile delivery teams, leads & squad rosters' },
  { key: 'organization', name: 'Org & Reporting', href: '/organization', icon: 'Network', enabled: true, category: 'CORE', description: 'Interactive org chart, departments, teams & multi-reporting' },
  { key: 'resource-allocation', name: 'Resource Allocation', href: '/resource-allocation', icon: 'Layers', enabled: true, category: 'OPERATIONS', description: 'Project allocations, utilization matrix & capacity tracking' },
  { key: 'budgets', name: 'Budget Management', href: '/budgets', icon: 'PieChart', enabled: true, category: 'FINANCE', description: 'Project & dept budgets, fully loaded labor cost & variance' },
  { key: 'approvals', name: 'Approval Workflows', href: '/approvals', icon: 'CheckSquare', enabled: true, category: 'SYSTEM', description: 'Multi-tier approval engine, pending requests & delegation' },
  { key: 'roles', name: 'Roles & Permissions', href: '/roles', icon: 'Shield', enabled: true, category: 'SYSTEM', description: 'Enterprise role definitions, permissions & assignments' },
  { key: 'attendance', name: 'Attendance & Clock', href: '/attendance', icon: 'UserCheck', enabled: true, category: 'CORE', description: 'Biometric punches, regularization & geo-clock' },
  { key: 'leave', name: 'Leave Management', href: '/leave', icon: 'CalendarDays', enabled: true, category: 'CORE', description: 'Leave applications, policy limits & approvals' },
  { key: 'payroll', name: 'Payroll & Form 16', href: '/payroll', icon: 'CreditCard', enabled: true, category: 'FINANCE', description: 'Indian statutory EPF/ESI/TDS salary processing' },
  { key: 'payslips', name: 'Payslips & Salary', href: '/payslips', icon: 'Receipt', enabled: true, category: 'FINANCE', description: 'Salary slips with one-click PDF generation' },
  { key: 'timesheets', name: 'Timesheets', href: '/timesheets', icon: 'Clock', enabled: true, category: 'OPERATIONS', description: 'Client project billing & weekly time tracking' },
  { key: 'expenses', name: 'Expense Claims', href: '/expenses', icon: 'Receipt', enabled: true, category: 'FINANCE', description: 'Travel, food & reimbursement workflows' },
  { key: 'recruitment', name: 'Recruitment & ATS', href: '/recruitment', icon: 'Briefcase', enabled: true, category: 'OPERATIONS', description: 'Job openings, candidates & interview pipelines' },
  { key: 'documents', name: 'Letters & Docs', href: '/documents', icon: 'FileText', enabled: true, category: 'OPERATIONS', description: 'Offer letters, NDAs & document generation' },
  { key: 'performance', name: 'Performance & KPI', href: '/performance', icon: 'Target', enabled: true, category: 'OPERATIONS', description: 'Goals, KPIs, reviews & appraisal cycles' },
  { key: 'assets', name: 'Asset Management', href: '/assets', icon: 'Laptop', enabled: true, category: 'OPERATIONS', description: 'Laptops, hardware inventory & asset assignments' },
  { key: 'helpdesk', name: 'HR Helpdesk', href: '/helpdesk', icon: 'HelpCircle', enabled: true, category: 'CORE', description: 'Employee queries, tickets & support resolution' },
  { key: 'reports', name: 'Analytics & Reports', href: '/reports', icon: 'BarChart3', enabled: true, category: 'CORE', description: 'Statutory registers, headcount & audit reports' },
  { key: 'self-service', name: 'My Self-Service', href: '/self-service', icon: 'UserCheck2', enabled: true, category: 'CORE', description: 'Employee self-service personal portal' },
  { key: 'settings', name: 'SaaS Settings', href: '/settings', icon: 'Settings', enabled: true, category: 'SYSTEM', description: 'Configure feature toggles & company profile' },
];
