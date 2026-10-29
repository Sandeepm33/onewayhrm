'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  UserCheck,
  Calendar,
  DollarSign,
  FileText,
  Shield,
  Layers,
  ArrowRight,
  Plus,
  X,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

interface IWorkflowStep {
  stepNumber: number;
  stepName: string;
  approverType: string;
  roleSlug?: string;
}

interface IWorkflow {
  _id: string;
  module: string;
  name: string;
  description: string;
  isActive: boolean;
  steps: IWorkflowStep[];
}

interface IApprovalRequest {
  _id: string;
  module: string;
  entityId: string;
  requestNumber: string;
  requesterEmployeeId?: { firstName: string; lastName: string; employeeCode: string; email: string };
  title: string;
  summary: string;
  details?: any;
  currentStepIndex: number;
  totalSteps: number;
  currentPendingRole?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  stepHistory: {
    stepNumber: number;
    stepName: string;
    approverName?: string;
    action: string;
    comments?: string;
    actedAt: string;
  }[];
  createdAt: string;
}

export default function ApprovalsPage() {
  const { user, hasPermission } = useAuth();
  const canCreate = hasPermission('approvals', 'create');
  const canApprove = hasPermission('approvals', 'approve');
  const [requests, setRequests] = useState<IApprovalRequest[]>([]);
  const [workflows, setWorkflows] = useState<IWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inbox' | 'history' | 'workflows'>('inbox');
  const [moduleFilter, setModuleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedReqForAction, setSelectedReqForAction] = useState<IApprovalRequest | null>(null);
  const [rejectComments, setRejectComments] = useState('');
  const [workflowModalOpen, setWorkflowModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Workflow Form
  const [wfForm, setWfForm] = useState({
    module: 'LEAVE',
    name: '',
    description: '',
    step1Name: 'Manager Review',
    step1Type: 'REPORTING_MANAGER',
    step2Name: 'HR / Compliance Verification',
    step2Type: 'ROLE',
    step2RoleSlug: 'hr-manager',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/approvals');
      const data = await res.json();
      if (data.success) {
        setRequests(data.requests || []);
        setWorkflows(data.workflows || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (requestId: string, action: 'APPROVED' | 'REJECTED', comments: string = '') => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/approvals/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, comments }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message);
        setTimeout(() => setSuccessMsg(''), 4000);
        setRejectModalOpen(false);
        setRejectComments('');
        fetchData();
      } else {
        alert(data.error);
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReject = (req: IApprovalRequest) => {
    setSelectedReqForAction(req);
    setRejectComments('');
    setRejectModalOpen(true);
  };

  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const steps = [
        { stepNumber: 1, stepName: wfForm.step1Name, approverType: wfForm.step1Type },
        { stepNumber: 2, stepName: wfForm.step2Name, approverType: wfForm.step2Type, roleSlug: wfForm.step2RoleSlug },
      ];

      const res = await fetch('/api/v1/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: wfForm.module,
          name: wfForm.name,
          description: wfForm.description,
          steps,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setWorkflowModalOpen(false);
        setSuccessMsg(data.message);
        setTimeout(() => setSuccessMsg(''), 4000);
        fetchData();
      } else {
        alert(data.error);
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const pendingRequests = requests.filter((r) => r.status === 'PENDING');
  const historyRequests = requests.filter((r) => r.status !== 'PENDING');

  const displayedRequests = activeTab === 'inbox' ? pendingRequests : historyRequests;
  const filteredRequests = displayedRequests.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.requestNumber.toLowerCase().includes(search.toLowerCase()) ||
      (r.requesterEmployeeId && `${r.requesterEmployeeId.firstName} ${r.requesterEmployeeId.lastName}`.toLowerCase().includes(search.toLowerCase()));
    const matchesModule = !moduleFilter || r.module === moduleFilter;
    return matchesSearch && matchesModule;
  });

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] text-blue-700 font-extrabold uppercase tracking-wider bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md">
              Enterprise Governance
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-500">
              {pendingRequests.length} Pending Approval{pendingRequests.length !== 1 ? 's' : ''}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 flex items-center gap-2">
            Approval Workflow Engine
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium max-w-2xl">
            Multi-step approval routing for leaves, client timesheets, clock regularizations, expense reimbursements, and budget revisions.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setWorkflowModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-transform hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Configure Workflow</span>
          </button>
        )}
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* TABS & SEARCH */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('inbox')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'inbox'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Inbox ({pendingRequests.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Decision Audit History ({historyRequests.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('workflows')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'workflows'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Configured Chains ({workflows.length})</span>
          </button>
        </div>

        {activeTab !== 'workflows' && (
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search requests..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-blue-500"
            >
              <option value="">All Modules</option>
              <option value="LEAVE">Leave Applications</option>
              <option value="TIMESHEET">Client Timesheets</option>
              <option value="ATTENDANCE_REGULARIZATION">Regularizations</option>
              <option value="EXPENSE_CLAIM">Expense Claims</option>
              <option value="BUDGET_REVISION">Budget Revisions</option>
            </select>
          </div>
        )}
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading approval requests and engine rules...
        </div>
      ) : activeTab === 'workflows' ? (
        /* WORKFLOWS TAB */
        workflows.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
            <Layers className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-900">No Approval Workflows Configured</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Your organization does not have any approval workflow chains defined yet. Set up multi-level approval hierarchies for leaves, timesheets, and expense claims.
            </p>
            {canCreate && (
              <button
                onClick={() => setWorkflowModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 inline-flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Configure Workflow</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workflows.map((wf) => (
              <div
                key={wf._id}
                className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md">
                      {wf.module}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">{wf.name}</h3>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active
                  </span>
                </div>

                <p className="text-xs text-slate-500 mb-4">{wf.description}</p>

                {/* Step Sequence Visualizer */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2.5">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Sequential Approval Route ({wf.steps?.length || 0} Steps)
                  </div>

                  <div className="space-y-2">
                    {wf.steps?.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                          {step.stepNumber}
                        </div>
                        <span className="font-semibold text-slate-800">{step.stepName}</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          ({step.approverType === 'ROLE' ? `Role: ${step.roleSlug}` : step.approverType})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* INBOX OR AUDIT HISTORY LIST */
        filteredRequests.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
            <CheckSquare className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-900">
              {activeTab === 'inbox' ? 'Your Inbox is Clean' : 'No Decision Audit History'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {activeTab === 'inbox'
                ? 'No pending approval requests require your review at this time.'
                : 'No historical approvals or rejections have been recorded yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((req) => {
            const isPending = req.status === 'PENDING';
            const emp = req.requesterEmployeeId;

            return (
              <div
                key={req._id}
                className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md">
                      {req.requestNumber}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md">
                      {req.module}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-400 font-medium">
                      {new Date(req.createdAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{req.title}</h3>
                  <p className="text-xs text-slate-600 mt-0.5 font-medium">{req.summary}</p>

                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                      <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>
                        {emp ? `${emp.firstName} ${emp.lastName} (${emp.employeeCode})` : 'Requester'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Workflow Progress:</span>
                      <span className="font-bold text-slate-900">
                        Step {req.currentStepIndex + 1} of {req.totalSteps}
                      </span>
                      {isPending && (
                        <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-semibold">
                          Awaiting {req.currentPendingRole || 'Reviewer'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Decision History Snippet if available */}
                  {req.stepHistory && req.stepHistory.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-2 text-[11px]">
                      {req.stepHistory.map((h, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-700 font-medium"
                        >
                          Step {h.stepNumber}: <strong className="text-slate-900">{h.approverName || 'Approver'}</strong> (
                          {h.action}) {h.comments ? `- "${h.comments}"` : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {isPending && canApprove ? (
                    <>
                      <button
                        disabled={actionLoading}
                        onClick={() => handleAction(req._id, 'APPROVED')}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer transition-transform hover:scale-[1.02]"
                      >
                        Approve Decision
                      </button>
                      <button
                        disabled={actionLoading}
                        onClick={() => handleOpenReject(req)}
                        className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 disabled:opacity-50 cursor-pointer transition-colors"
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <span
                      className={`px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider ${
                        req.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : req.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {req.status}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* REJECT MODAL WITH COMMENTS */}
      {rejectModalOpen && selectedReqForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 relative my-8 text-slate-900">
            <button
              onClick={() => setRejectModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-950 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600" />
                <span>Reject Approval Request</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Rejecting {selectedReqForAction.requestNumber} requires a mandatory reason for the audit trail.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rejection Reason / Comments *
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectComments}
                  onChange={(e) => setRejectComments(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-rose-500"
                  placeholder="State the justification for rejection (e.g. Timesheet hours conflict with clock, insufficient leave balance)..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!rejectComments.trim() || actionLoading}
                  onClick={() => handleAction(selectedReqForAction._id, 'REJECTED', rejectComments)}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIGURE WORKFLOW MODAL */}
      {workflowModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 relative my-8 text-slate-900">
            <button
              onClick={() => setWorkflowModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-950 flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                <span>Configure Multi-Step Approval Workflow</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Design sequential approval steps with designated manager or role approvers.
              </p>
            </div>

            <form onSubmit={handleCreateWorkflow} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Module *</label>
                <select
                  value={wfForm.module}
                  onChange={(e) => setWfForm({ ...wfForm, module: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                >
                  <option value="LEAVE">Leave Management</option>
                  <option value="TIMESHEET">Client Timesheets</option>
                  <option value="ATTENDANCE_REGULARIZATION">Attendance Regularization</option>
                  <option value="EXPENSE_CLAIM">Expense Reimbursement</option>
                  <option value="BUDGET_REVISION">Budget Revision</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Workflow Title *</label>
                <input
                  type="text"
                  required
                  value={wfForm.name}
                  onChange={(e) => setWfForm({ ...wfForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Enterprise Client Timesheet Flow"
                />
              </div>

              {/* Step 1 */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Step 1: First Line Review
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={wfForm.step1Name}
                    onChange={(e) => setWfForm({ ...wfForm, step1Name: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-medium"
                    placeholder="Step name"
                  />
                  <select
                    value={wfForm.step1Type}
                    onChange={(e) => setWfForm({ ...wfForm, step1Type: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-medium"
                  >
                    <option value="REPORTING_MANAGER">Reporting Manager</option>
                    <option value="TECHNICAL_LEAD">Technical Lead (TL)</option>
                    <option value="DEPARTMENT_HEAD">Department Head</option>
                  </select>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Step 2: Second Line Verification
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={wfForm.step2Name}
                    onChange={(e) => setWfForm({ ...wfForm, step2Name: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-medium"
                    placeholder="Step name"
                  />
                  <select
                    value={wfForm.step2RoleSlug}
                    onChange={(e) => setWfForm({ ...wfForm, step2RoleSlug: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-medium"
                  >
                    <option value="hr-manager">HR Manager Role</option>
                    <option value="finance-controller">Finance Controller Role</option>
                    <option value="project-manager">Project Manager Role</option>
                    <option value="system-admin">System Admin</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setWorkflowModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? 'Saving...' : 'Deploy Workflow'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
