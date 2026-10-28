import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { Payslip } from '@/models/Payroll';
import { Organization } from '@/models/Organization';
import { resolveOrganizationId, resolveEmployeeForSession } from '@/lib/tenant';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = await resolveOrganizationId(session);
    const { searchParams } = new URL(req.url);
    const payrollRunId = searchParams.get('payrollRunId');
    const employeeId = searchParams.get('employeeId');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    const query: any = { organizationId: orgId };

    // Employee role restriction
    if (session.role === 'EMPLOYEE') {
      const emp = await resolveEmployeeForSession(session, undefined, orgId);
      if (emp) {
        query.employeeId = emp._id;
      }
      query.isPublished = true; // Employees only see published payslips
    } else if (employeeId) {
      query.employeeId = employeeId;
    }

    if (payrollRunId) query.payrollRunId = payrollRunId;
    if (month) query.month = Number(month);
    if (year) query.year = Number(year);

    const [payslips, organization] = await Promise.all([
      Payslip.find(query)
        .populate({
          path: 'employeeId',
          select: 'firstName lastName employeeCode email panNumber uanNumber bankDetails designationId departmentId',
          populate: [
            { path: 'designationId', select: 'title' },
            { path: 'departmentId', select: 'name' },
          ],
        })
        .sort({ year: -1, month: -1 }),
      Organization.findById(orgId),
    ]);

    return NextResponse.json({ success: true, payslips, organization });
  } catch (error: any) {
    console.error('Fetch payslips error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
