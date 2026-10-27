import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { Budget, BudgetRevision } from '@/models/Budget';
import { Project } from '@/models/Operations';
import { Department } from '@/models/OrganizationStructure';
import { ProjectAllocation } from '@/models/ResourceAllocation';
import { Employee } from '@/models/Employee';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session || !session.organizationId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const [budgets, projects, departments, allocations, revisions] = await Promise.all([
      Budget.find({ organizationId: session.organizationId })
        .populate('departmentId', 'name code')
        .populate('projectId', 'name code clientName')
        .populate('approvedByUserId', 'name email')
        .sort({ createdAt: -1 }),
      Project.find({ organizationId: session.organizationId }).sort({ name: 1 }),
      Department.find({ organizationId: session.organizationId }).sort({ name: 1 }),
      ProjectAllocation.find({ organizationId: session.organizationId, status: 'ACTIVE' })
        .populate('employeeId', 'firstName lastName grossMonthly fullyLoadedMonthlyCost ctcAnnual'),
      BudgetRevision.find({ organizationId: session.organizationId })
        .populate('requestedByUserId', 'name email')
        .populate('budgetId', 'name budgetCode')
        .sort({ createdAt: -1 }),
    ]);

    // Calculate dynamic labor commitment per project budget
    const projectLaborCostMap: Record<string, number> = {};
    allocations.forEach((alloc) => {
      const pId = String(alloc.projectId);
      const emp = alloc.employeeId as any;
      const monthlyCost = emp?.fullyLoadedMonthlyCost || (emp?.grossMonthly ? emp.grossMonthly * 1.25 : 62500);
      const fractionalCost = Math.round(monthlyCost * ((alloc.allocationPercentage || 100) / 100));
      // Estimate 6 months default project window
      const estimatedDurationMonths = 6;
      const totalLaborEstimate = fractionalCost * estimatedDurationMonths;

      projectLaborCostMap[pId] = (projectLaborCostMap[pId] || 0) + totalLaborEstimate;
    });

    const enrichedBudgets = budgets.map((b) => {
      const pId = b.projectId?._id ? String(b.projectId._id) : (b.projectId ? String(b.projectId) : null);
      const laborCost = pId && projectLaborCostMap[pId] ? projectLaborCostMap[pId] : b.committedLaborCost;
      const totalCommitted = laborCost + (b.committedExpenseCost || 0) + (b.actualSpent || 0);
      const variance = b.approvedAmount - totalCommitted;
      const percentUtilized = b.approvedAmount > 0 ? Math.round((totalCommitted / b.approvedAmount) * 100) : 0;

      let health: 'HEALTHY' | 'WARNING' | 'OVER_BUDGET' = 'HEALTHY';
      if (percentUtilized > 100) health = 'OVER_BUDGET';
      else if (percentUtilized >= 80) health = 'WARNING';

      return {
        ...b.toObject(),
        committedLaborCost: laborCost,
        totalCommitted,
        variance,
        percentUtilized,
        health,
      };
    });

    return NextResponse.json({
      success: true,
      budgets: enrichedBudgets,
      projects,
      departments,
      revisions,
    });
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
    const {
      name,
      budgetCode,
      budgetType = 'PROJECT',
      departmentId,
      projectId,
      costCenterCode,
      financialYear = '2026-2027',
      startDate,
      endDate,
      approvedAmount = 0,
      committedExpenseCost = 0,
      actualSpent = 0,
      notes,
    } = body;

    if (!name || !approvedAmount || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'Name, approved amount, start date, and end date are required.' },
        { status: 400 }
      );
    }

    const code = (budgetCode || `BDG-${Date.now().toString().slice(-5)}`).toUpperCase();

    const newBudget = await Budget.create({
      organizationId: session.organizationId,
      name: name.trim(),
      budgetCode: code,
      budgetType,
      departmentId: departmentId || undefined,
      projectId: projectId || undefined,
      costCenterCode: costCenterCode || '',
      financialYear,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      approvedAmount: Number(approvedAmount),
      committedExpenseCost: Number(committedExpenseCost),
      actualSpent: Number(actualSpent),
      status: 'APPROVED',
      approvedByUserId: session.userId,
      approvedAt: new Date(),
      notes: notes || '',
    });

    return NextResponse.json({
      success: true,
      message: `Budget "${newBudget.name}" created successfully.`,
      budget: newBudget,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
