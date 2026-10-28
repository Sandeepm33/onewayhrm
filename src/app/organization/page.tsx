'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import {
  Network,
  Users,
  Building,
  UserCheck,
  Plus,
  Search,
  ChevronRight,
  ChevronDown,
  Shield,
  Layers,
  ArrowRight,
  X,
  CheckCircle2,
  Clock,
  Sparkles,
  GitFork,
  Calendar,
  Briefcase,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface IEmployeeNode {
  _id: string;
  firstName: string;
  lastName: string;
  employeeCode: string;
  email: string;
  roleId?: { name: string; slug: string };
  departmentId?: { name: string; code: string };
  reportingManagerId?: any;
  technicalLeadId?: any;
  directReports?: IEmployeeNode[];
  techLeadReports?: IEmployeeNode[];
}

export default function OrganizationPage() {
  const { user, hasPermission } = useAuth();
  const canCreateTeam = hasPermission('teams', 'create') || hasPermission('organization', 'create');
  const canDelegate = hasPermission('organization', 'create') || hasPermission('approvals', 'create');
  const [activeTab, setActiveTab] = useState<'chart' | 'matrix' | 'teams' | 'departments' | 'delegations'>('chart');
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [relationships, setRelationships] = useState<any[]>([]);
  const [delegations, setDelegations] = useState<any[]>([]);
  const [tree, setTree] = useState<IEmployeeNode[]>([]);
  const [search, setSearch] = useState('');

  // Modals
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [delegationModalOpen, setDelegationModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  // Team Form
  const [teamForm, setTeamForm] = useState({
    name: '',
    code: '',
    departmentId: '',
    teamLeadId: '',
    description: '',
    memberEmployeeIds: [] as string[],
  });

  // Delegation Form
  const [delegationForm, setDelegationForm] = useState({
    delegatorEmployeeId: '',
    delegateeEmployeeId: '',
    modules: ['LEAVE', 'TIMESHEET'],
    startDate: '',
    endDate: '',
    reason: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/organization/hierarchy');
      const data = await res.json();
      if (data.success) {
        setEmployees(data.employees || []);
        setDepartments(data.departments || []);
        setTeams(data.teams || []);
        setMemberships(data.memberships || []);
        setRelationships(data.relationships || []);
        setDelegations(data.delegations || []);
        setTree(data.tree || []);
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

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/v1/organization/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamForm),
      });
      const data = await res.json();
      if (data.success) {
        setTeamModalOpen(false);
        setTeamForm({
          name: '',
          code: '',
          departmentId: '',
          teamLeadId: '',
          description: '',
          memberEmployeeIds: [],
        });
        setSuccessMsg(`Team "${data.team.name}" created successfully!`);
        setTimeout(() => setSuccessMsg(''), 4000);
        fetchData();
      } else {
        setErrorMsg(data.error || 'Failed to create team');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateDelegation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/v1/organization/delegations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(delegationForm),
      });
      const data = await res.json();
      if (data.success) {
        setDelegationModalOpen(false);
        setDelegationForm({
          delegatorEmployeeId: '',
          delegateeEmployeeId: '',
          modules: ['LEAVE', 'TIMESHEET'],
          startDate: '',
          endDate: '',
          reason: '',
        });
        setSuccessMsg('Authority delegated successfully!');
        setTimeout(() => setSuccessMsg(''), 4000);
        fetchData();
      } else {
        setErrorMsg(data.error || 'Failed to delegate authority');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Node Component for Visual Org Chart
  const OrgTreeNode = ({ node, level = 0 }: { node: IEmployeeNode; level?: number }) => {
    const [collapsed, setCollapsed] = useState(false);
    const hasReports = (node.directReports && node.directReports.length > 0) || (node.techLeadReports && node.techLeadReports.length > 0);
    const allReports = [...(node.directReports || [])];

    return (
      <div className="flex flex-col items-center my-3 relative">
        <div
          className={`p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all w-64 text-left relative z-10 ${
            level === 0 ? 'ring-2 ring-indigo-500/30 border-indigo-300' : ''
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center text-xs font-bold uppercase shadow-xs">
                {node.firstName?.[0]}{node.lastName?.[0]}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 leading-tight">
                  {node.firstName} {node.lastName}
                </h4>
                <span className="text-[10px] font-mono font-medium text-orange-600">
                  {node.employeeCode}
                </span>
              </div>
            </div>
            {level === 0 && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                Executive
              </span>
            )}
          </div>

          <div className="space-y-1 pt-2 border-t border-slate-100 text-[11px]">
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-slate-400 font-medium">Role:</span>
              <span className="font-semibold text-indigo-700">
                {node.roleId?.name || 'Staff'}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-slate-400 font-medium">Dept:</span>
              <span className="font-semibold text-slate-800">
                {node.departmentId?.name || 'General'}
              </span>
            </div>
          </div>

          {hasReports && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="mt-3 w-full py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/70 text-[10px] font-bold text-slate-600 flex items-center justify-center gap-1 cursor-pointer transition-colors"
            >
              <span>{allReports.length} Direct Report{allReports.length > 1 ? 's' : ''}</span>
              {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>

        {/* Child Subtree */}
        {hasReports && !collapsed && (
          <div className="flex flex-col items-center mt-2">
            <div className="w-0.5 h-6 bg-slate-300" />
            <div className="flex items-start gap-6 relative pt-4">
              {allReports.length > 1 && (
                <div className="absolute top-0 left-12 right-12 h-0.5 bg-slate-300" />
              )}
              {allReports.map((child) => (
                <div key={child._id} className="flex flex-col items-center">
                  <div className="w-0.5 h-4 bg-slate-300 -mt-4 mb-0" />
                  <OrgTreeNode node={child} level={level + 1} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] text-indigo-700 font-extrabold uppercase tracking-wider bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-md">
              Workforce Architecture
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-500">MNC Dual-Reporting & Org Chart</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 flex items-center gap-2">
            Organization Hierarchy & Teams
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Separate HR reporting managers, technical leads (TL), project teams, and approval delegations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canDelegate && (
            <button
              onClick={() => setDelegationModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Delegate Authority</span>
            </button>
          )}

          {canCreateTeam && (
            <button
              onClick={() => setTeamModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-transform hover:scale-[1.02] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Team</span>
            </button>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('chart')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
            activeTab === 'chart'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Network className="w-4 h-4" />
          <span>Visual Org Chart</span>
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
            activeTab === 'matrix'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <GitFork className="w-4 h-4" />
          <span>Matrix Reporting (MNC)</span>
        </button>

        <button
          onClick={() => setActiveTab('teams')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
            activeTab === 'teams'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Teams & Technical Leads ({teams.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('departments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
            activeTab === 'departments'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Departments & Subdepartments ({departments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('delegations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
            activeTab === 'delegations'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Acting Managers & Delegations ({delegations.length})</span>
        </button>
      </div>

      {/* TAB CONTENT */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading organization workforce hierarchy...
        </div>
      ) : (
        <>
          {/* 1. VISUAL ORG CHART */}
          {activeTab === 'chart' && (
            <div className="p-6 rounded-3xl bg-slate-100/70 border border-slate-200/90 overflow-x-auto min-h-[500px] flex justify-center items-start shadow-inner">
              {tree.length > 0 ? (
                <div className="flex flex-wrap gap-12 justify-center">
                  {tree.map((root) => (
                    <OrgTreeNode key={root._id} node={root} level={0} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-slate-400">
                  <Network className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-medium">No employees found in the directory.</p>
                </div>
              )}
            </div>
          )}

          {/* 2. MATRIX REPORTING TABLE */}
          {activeTab === 'matrix' && (
            <div className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    MNC Multi-Reporting Governance Matrix
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    In enterprise organizations, an employee can report to an HR Manager for career appraisals, a Technical Lead for daily commits, and a Project Manager for client milestones.
                  </p>
                </div>
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
                  {employees.length} Configured Employees
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Security Role</th>
                      <th className="py-3 px-4">HR Reporting Manager</th>
                      <th className="py-3 px-4">Technical Lead (TL)</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Cost Center</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {employees.map((emp) => (
                      <tr key={emp._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{emp.firstName} {emp.lastName}</div>
                          <div className="text-[11px] font-mono text-orange-600">{emp.employeeCode}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {emp.roleId?.name || 'Staff Member'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {emp.reportingManagerId ? (
                            <div>
                              <div className="font-bold text-slate-800">
                                {emp.reportingManagerId.firstName} {emp.reportingManagerId.lastName}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {emp.reportingManagerId.employeeCode}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Direct to Board / CEO</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {emp.technicalLeadId ? (
                            <div>
                              <div className="font-bold text-slate-800">
                                {emp.technicalLeadId.firstName} {emp.technicalLeadId.lastName}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {emp.technicalLeadId.employeeCode}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Self / Lead</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{emp.departmentId?.name || 'General'}</div>
                          <div className="text-[10px] text-slate-400">{emp.departmentId?.code || 'GEN'}</div>
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-slate-600">
                          {emp.costCenter || 'CC-DEFAULT'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. TEAMS & TECHNICAL LEADS */}
          {activeTab === 'teams' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map((team) => {
                  const teamMembers = memberships.filter((m) => m.teamId?._id === team._id || m.teamId === team._id);

                  return (
                    <div
                      key={team._id}
                      className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <span className="text-[10px] font-mono text-indigo-600 font-bold uppercase tracking-wider bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                              {team.code}
                            </span>
                            <h3 className="text-sm font-bold text-slate-900 mt-1">{team.name}</h3>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {team.status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 mb-4 line-clamp-2">
                          {team.description || 'Dedicated functional team delivering core business outcomes.'}
                        </p>

                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 mb-3 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400 font-medium">Technical Lead:</span>
                            <span className="font-bold text-slate-900">
                              {team.teamLeadId ? `${team.teamLeadId.firstName} ${team.teamLeadId.lastName}` : 'Unassigned'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400 font-medium">Department:</span>
                            <span className="font-semibold text-slate-700">
                              {team.departmentId?.name || 'General'}
                            </span>
                          </div>
                        </div>

                        {/* Members preview */}
                        <div>
                          <div className="text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                            <span>Team Members</span>
                            <span className="text-slate-400 font-semibold">{teamMembers.length} Active</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {teamMembers.map((m) => (
                              <span
                                key={m._id}
                                className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium"
                              >
                                {m.employeeId?.firstName} {m.employeeId?.lastName} {m.roleInTeam === 'LEAD' ? '(Lead)' : ''}
                              </span>
                            ))}
                            {teamMembers.length === 0 && (
                              <span className="text-[10px] text-slate-400 italic">No members assigned yet</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {teams.length === 0 && (
                  <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                    <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-semibold">No teams created yet.</p>
                    <button
                      onClick={() => setTeamModalOpen(true)}
                      className="mt-3 px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer"
                    >
                      + Create First Team
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. DEPARTMENTS & SUBDEPARTMENTS */}
          {activeTab === 'departments' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.map((dept) => {
                const subDepts = departments.filter((d) => d.parentDepartmentId?._id === dept._id || d.parentDepartmentId === dept._id);
                const deptEmps = employees.filter((e) => e.departmentId?._id === dept._id || e.departmentId === dept._id);

                return (
                  <div
                    key={dept._id}
                    className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center">
                          <Building className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{dept.name}</h4>
                          <span className="text-[10px] font-mono text-slate-400 uppercase">{dept.code}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {deptEmps.length} Employees
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mb-3 line-clamp-2">
                      {dept.description || 'Core organizational business unit.'}
                    </p>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">Department Head:</span>
                        <span className="font-bold text-slate-900">
                          {dept.headEmployeeId ? `${dept.headEmployeeId.firstName} ${dept.headEmployeeId.lastName}` : 'Unassigned'}
                        </span>
                      </div>
                      {dept.parentDepartmentId && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-medium">Parent Division:</span>
                          <span className="font-semibold text-indigo-600">
                            {dept.parentDepartmentId.name}
                          </span>
                        </div>
                      )}
                    </div>

                    {subDepts.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Subdepartments ({subDepts.length})
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {subDepts.map((sub) => (
                            <span
                              key={sub._id}
                              className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200"
                            >
                              {sub.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 5. DELEGATIONS & ACTING MANAGERS */}
          {activeTab === 'delegations' && (
            <div className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Delegation of Approval Authority & Acting Managers
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    When managers take extended leave or travel, their approval duties can be delegated to another employee for defined dates.
                  </p>
                </div>
                <button
                  onClick={() => setDelegationModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs cursor-pointer shadow-xs"
                >
                  + New Delegation
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Primary Approver (Delegator)</th>
                      <th className="py-3 px-4">Acting Approver (Delegatee)</th>
                      <th className="py-3 px-4">Delegated Modules</th>
                      <th className="py-3 px-4">Effective Dates</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {delegations.map((del) => (
                      <tr key={del._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {del.delegatorEmployeeId?.firstName} {del.delegatorEmployeeId?.lastName}
                          <div className="text-[10px] text-slate-400 font-mono">
                            {del.delegatorEmployeeId?.employeeCode}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-bold text-indigo-700">
                          {del.delegateeEmployeeId?.firstName} {del.delegateeEmployeeId?.lastName}
                          <div className="text-[10px] text-slate-400 font-mono">
                            {del.delegateeEmployeeId?.employeeCode}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {del.modules?.map((m: string) => (
                              <span
                                key={m}
                                className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 uppercase"
                              >
                                {m}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-600">
                          {new Date(del.startDate).toLocaleDateString('en-IN')} - {new Date(del.endDate).toLocaleDateString('en-IN')}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              del.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {del.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-medium">
                          {del.reason || 'Out of office delegation'}
                        </td>
                      </tr>
                    ))}

                    {delegations.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          No active delegation of authority configured.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* CREATE TEAM MODAL */}
      {teamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 relative my-8 text-slate-900">
            <button
              onClick={() => setTeamModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-950 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>Create Functional Team & Assign Lead</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Teams organize employees under a Technical Lead for daily delivery and peer reviews.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Team Name *</label>
                  <input
                    type="text"
                    required
                    value={teamForm.name}
                    onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Frontend Core, Cloud DevOps"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Team Code</label>
                  <input
                    type="text"
                    value={teamForm.code}
                    onChange={(e) => setTeamForm({ ...teamForm, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-medium focus:outline-none focus:border-indigo-500 uppercase"
                    placeholder="e.g. FE-CORE"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Technical Lead (TL) *</label>
                <select
                  required
                  value={teamForm.teamLeadId}
                  onChange={(e) => setTeamForm({ ...teamForm, teamLeadId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-indigo-500"
                >
                  <option value="">
                    {employees.filter((emp) => {
                      const r = ((emp.roleId?.name || '') + ' ' + (emp.roleId?.slug || '') + ' ' + (emp.designationId?.title || '')).toLowerCase();
                      return r.includes('lead') || r.includes('tl') || r.includes('manager');
                    }).length === 0
                      ? 'No employees with Lead or Manager role yet'
                      : 'Select Technical Lead'}
                  </option>
                  {employees
                    .filter((emp) => {
                      const r = ((emp.roleId?.name || '') + ' ' + (emp.roleId?.slug || '') + ' ' + (emp.designationId?.title || '')).toLowerCase();
                      return r.includes('lead') || r.includes('tl') || r.includes('manager');
                    })
                    .map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeCode}) — {emp.roleId?.name || 'Lead'}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                <select
                  value={teamForm.departmentId}
                  onChange={(e) => setTeamForm({ ...teamForm, departmentId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={teamForm.description}
                  onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
                  placeholder="Outline the operational responsibilities of this team..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setTeamModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Creating...' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELEGATE AUTHORITY MODAL */}
      {delegationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 relative my-8 text-slate-900">
            <button
              onClick={() => setDelegationModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-950 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <span>Delegate Approval Authority (Acting Manager)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Temporarily re-route approval decisions (Leave, Timesheets, Expenses) during manager absence.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateDelegation} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Primary Approver (Delegator) *
                </label>
                <select
                  required
                  value={delegationForm.delegatorEmployeeId}
                  onChange={(e) => setDelegationForm({ ...delegationForm, delegatorEmployeeId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select Manager</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Acting Approver (Delegatee) *
                </label>
                <select
                  required
                  value={delegationForm.delegateeEmployeeId}
                  onChange={(e) => setDelegationForm({ ...delegationForm, delegateeEmployeeId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select Acting Manager</option>
                  {employees
                    .filter((e) => e._id !== delegationForm.delegatorEmployeeId)
                    .map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeCode})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Effective Start Date *</label>
                  <input
                    type="date"
                    required
                    value={delegationForm.startDate}
                    onChange={(e) => setDelegationForm({ ...delegationForm, startDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Effective End Date *</label>
                  <input
                    type="date"
                    required
                    value={delegationForm.endDate}
                    onChange={(e) => setDelegationForm({ ...delegationForm, endDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Delegated Modules</label>
                <div className="flex gap-4 pt-1">
                  {['LEAVE', 'TIMESHEET', 'EXPENSE', 'BUDGET'].map((mod) => (
                    <label key={mod} className="flex items-center gap-1.5 text-xs text-slate-700 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={delegationForm.modules.includes(mod)}
                        onChange={(e) => {
                          const updated = e.target.checked
                            ? [...delegationForm.modules, mod]
                            : delegationForm.modules.filter((m) => m !== mod);
                          setDelegationForm({ ...delegationForm, modules: updated });
                        }}
                        className="rounded border-slate-300 text-indigo-600"
                      />
                      <span>{mod}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason</label>
                <input
                  type="text"
                  value={delegationForm.reason}
                  onChange={(e) => setDelegationForm({ ...delegationForm, reason: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Annual leave / Out of country"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setDelegationModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Delegating...' : 'Confirm Delegation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
