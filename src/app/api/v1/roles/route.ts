import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { Role } from '@/models/Role';
import { User } from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session || !session.organizationId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    let roles = await Role.find({ organizationId: session.organizationId }).sort({ createdAt: 1 });

    // Auto-seed enterprise MNC default roles if none exist
    if (roles.length === 0) {
      const defaultRoles = [
        {
          name: 'System Administrator',
          slug: 'system-admin',
          description: 'Full administrative access across all organization modules and settings',
          isSystemAdmin: true,
          permissions: [],
        },
        {
          name: 'HR Manager',
          slug: 'hr-manager',
          description: 'Oversees employee records, attendance, leave policies, onboarding & statutory compliance',
          isSystemAdmin: false,
          permissions: [
            { module: 'dashboard', actions: ['view', 'export'] },
            { module: 'employees', actions: ['view', 'create', 'edit', 'delete', 'export'] },
            { module: 'attendance', actions: ['view', 'create', 'edit', 'approve', 'export'] },
            { module: 'leave', actions: ['view', 'create', 'edit', 'approve', 'export'] },
            { module: 'organization', actions: ['view', 'create', 'edit'] },
            { module: 'resource-allocation', actions: ['view'] },
            { module: 'budgets', actions: ['view'] },
            { module: 'approvals', actions: ['view', 'approve'] },
            { module: 'payroll', actions: ['view', 'create', 'edit', 'export'] },
            { module: 'recruitment', actions: ['view', 'create', 'edit', 'delete'] },
            { module: 'documents', actions: ['view', 'create', 'export'] },
            { module: 'reports', actions: ['view', 'export'] },
          ],
        },
        {
          name: 'Engineering Manager',
          slug: 'engineering-manager',
          description: 'Departmental leadership managing direct reports, project delivery, team leads and budgets',
          isSystemAdmin: false,
          permissions: [
            { module: 'dashboard', actions: ['view'] },
            { module: 'employees', actions: ['view'] },
            { module: 'organization', actions: ['view', 'create', 'edit'] },
            { module: 'resource-allocation', actions: ['view', 'create', 'edit', 'approve'] },
            { module: 'budgets', actions: ['view', 'create', 'edit', 'approve'] },
            { module: 'approvals', actions: ['view', 'approve'] },
            { module: 'timesheets', actions: ['view', 'approve'] },
            { module: 'leave', actions: ['view', 'approve'] },
            { module: 'attendance', actions: ['view', 'approve'] },
            { module: 'reports', actions: ['view'] },
          ],
        },
        {
          name: 'Team Lead (TL)',
          slug: 'team-lead',
          description: 'Guides day-to-day technical delivery, code reviews, task allocation, and daily timesheets',
          isSystemAdmin: false,
          permissions: [
            { module: 'dashboard', actions: ['view'] },
            { module: 'employees', actions: ['view'] },
            { module: 'organization', actions: ['view'] },
            { module: 'resource-allocation', actions: ['view'] },
            { module: 'timesheets', actions: ['view', 'approve'] },
            { module: 'attendance', actions: ['view', 'approve'] },
            { module: 'leave', actions: ['view'] },
            { module: 'approvals', actions: ['view', 'approve'] },
          ],
        },
        {
          name: 'Project Manager (PM)',
          slug: 'project-manager',
          description: 'Manages client/internal project scopes, milestones, timesheet approvals, and project budgets',
          isSystemAdmin: false,
          permissions: [
            { module: 'dashboard', actions: ['view'] },
            { module: 'organization', actions: ['view'] },
            { module: 'resource-allocation', actions: ['view', 'create', 'edit'] },
            { module: 'budgets', actions: ['view', 'create', 'edit'] },
            { module: 'timesheets', actions: ['view', 'approve'] },
            { module: 'approvals', actions: ['view', 'approve'] },
            { module: 'reports', actions: ['view', 'export'] },
          ],
        },
        {
          name: 'Resource Manager (RM)',
          slug: 'resource-manager',
          description: 'Manages talent allocation, bench utilization, capacity constraints, and staffing forecasts',
          isSystemAdmin: false,
          permissions: [
            { module: 'dashboard', actions: ['view'] },
            { module: 'employees', actions: ['view'] },
            { module: 'organization', actions: ['view'] },
            { module: 'resource-allocation', actions: ['view', 'create', 'edit', 'delete', 'export'] },
            { module: 'budgets', actions: ['view'] },
            { module: 'reports', actions: ['view', 'export'] },
          ],
        },
        {
          name: 'Finance Controller',
          slug: 'finance-controller',
          description: 'Monitors financial plans, labor costs, budget allocations, and variances across cost centers',
          isSystemAdmin: false,
          permissions: [
            { module: 'dashboard', actions: ['view'] },
            { module: 'budgets', actions: ['view', 'create', 'edit', 'approve', 'export'] },
            { module: 'payroll', actions: ['view', 'export'] },
            { module: 'expenses', actions: ['view', 'approve', 'export'] },
            { module: 'timesheets', actions: ['view', 'export'] },
            { module: 'reports', actions: ['view', 'export'] },
          ],
        },
        {
          name: 'Software Engineer',
          slug: 'software-engineer',
          description: 'Individual contributor with self-service attendance, leave, timesheets, and profile access',
          isSystemAdmin: false,
          permissions: [
            { module: 'dashboard', actions: ['view'] },
            { module: 'attendance', actions: ['view', 'create'] },
            { module: 'leave', actions: ['view', 'create'] },
            { module: 'timesheets', actions: ['view', 'create', 'edit'] },
            { module: 'self-service', actions: ['view', 'create', 'edit'] },
            { module: 'payslips', actions: ['view'] },
          ],
        },
      ];

      await Role.insertMany(
        defaultRoles.map((r) => ({
          ...r,
          organizationId: session.organizationId,
        }))
      );

      roles = await Role.find({ organizationId: session.organizationId }).sort({ createdAt: 1 });
    }

    return NextResponse.json({ success: true, roles });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session || !session.organizationId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, isSystemAdmin = false, permissions = [] } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Role name is required.' }, { status: 400 });
    }

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-');

    // Check if role name already exists in this organization
    const existingRole = await Role.findOne({
      organizationId: session.organizationId,
      $or: [{ name: name.trim() }, { slug }],
    });

    if (existingRole) {
      return NextResponse.json(
        { success: false, error: `A role named "${name}" already exists in your organization.` },
        { status: 409 }
      );
    }

    const newRole = await Role.create({
      organizationId: session.organizationId,
      name: name.trim(),
      slug,
      description: description || '',
      isSystemAdmin: Boolean(isSystemAdmin),
      permissions: permissions || [],
    });

    return NextResponse.json({
      success: true,
      message: `Custom role "${newRole.name}" created successfully.`,
      role: newRole,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
