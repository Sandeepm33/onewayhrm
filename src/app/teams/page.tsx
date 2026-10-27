'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Users2,
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Network,
  Layers,
  ArrowRight,
  UserPlus,
  UserMinus,
  Sparkles,
} from 'lucide-react';

interface ITeamMember {
  membershipId: string;
  roleInTeam: string;
  startDate: string;
  employee: {
    _id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
    email: string;
    roleId?: { _id: string; name: string; slug: string };
    designationId?: { _id: string; title: string; code: string };
  };
}

interface ITeam {
  _id: string;
  name: string;
  code: string;
  departmentId?: { _id: string; name: string; code: string } | null;
  teamLeadId?: {
    _id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
    email: string;
    roleId?: { _id: string; name: string };
  } | null;
  description?: string;
  status: 'ACTIVE' | 'ARCHIVED';
  members?: ITeamMember[];
  memberCount?: number;
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<ITeam[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [membersModalOpen, setMembersModalOpen] = useState(false);

  // Selected Team
  const [selectedTeam, setSelectedTeam] = useState<ITeam | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    departmentId: '',
    teamLeadId: '',
    description: '',
    memberEmployeeIds: [] as string[],
  });

  const [addMemberEmpId, setAddMemberEmpId] = useState('');

  const fetchData = async () => {
    try {
      const [teamsRes, deptsRes, empsRes, rolesRes] = await Promise.all([
        fetch('/api/v1/teams'),
        fetch('/api/v1/departments'),
        fetch('/api/v1/employees'),
        fetch('/api/v1/roles'),
      ]);

      const [teamsData, deptsData, empsData, rolesData] = await Promise.all([
        teamsRes.json(),
        deptsRes.json(),
        empsRes.json(),
        rolesRes.json(),
      ]);

      if (teamsData.success) setTeams(teamsData.teams || []);
      if (deptsData.success) setDepartments(deptsData.departments || []);
      if (empsData.success) setAllEmployees(empsData.employees || []);
      if (rolesData.success) setRoles(rolesData.roles || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter candidates for Technical Lead (Strictly TL / Lead / Manager roles)
  const isTLRole = (emp: any) => {
    if (!emp) return false;
    const rId = emp.roleId?._id || emp.roleId;
    const roleObj = roles.find((r) => r._id === rId) || emp.roleId;
    const roleName = (roleObj?.name || '').toLowerCase();
    const roleSlug = (roleObj?.slug || '').toLowerCase();
    const desig = (emp.designationId?.title || '').toLowerCase();
    return (
      roleName.includes('lead') ||
      roleSlug.includes('lead') ||
      roleName.includes('tl') ||
      roleSlug === 'tl' ||
      roleName.includes('manager') ||
      desig.includes('lead')
    );
  };

  const eligibleLeads = allEmployees.filter(isTLRole);

  // Filtered Teams
  const filteredTeams = teams.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.code.toLowerCase().includes(search.toLowerCase()) ||
      (t.departmentId?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.teamLeadId ? `${t.teamLeadId.firstName} ${t.teamLeadId.lastName}`.toLowerCase().includes(search.toLowerCase()) : false);

    if (deptFilter) {
      return matchesSearch && t.departmentId?._id === deptFilter;
    }
    return matchesSearch;
  });

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormData({
      name: '',
      code: '',
      departmentId: departments[0]?._id || '',
      teamLeadId: '',
      description: '',
      memberEmployeeIds: [],
    });
    setErrorMsg('');
    setCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (team: ITeam) => {
    setSelectedTeam(team);
    const existingMemberIds = (team.members || []).map((m) => m.employee?._id).filter(Boolean);
    setFormData({
      name: team.name,
      code: team.code,
      departmentId: team.departmentId?._id || '',
      teamLeadId: team.teamLeadId?._id || '',
      description: team.description || '',
      memberEmployeeIds: existingMemberIds,
    });
    setErrorMsg('');
    setEditModalOpen(true);
  };

  // Open Members Modal
  const handleOpenMembers = (team: ITeam) => {
    setSelectedTeam(team);
    setAddMemberEmpId('');
    setMembersModalOpen(true);
  };

  // Submit Create Team
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/v1/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message);
        setTimeout(() => setSuccessMsg(''), 4000);
        setCreateModalOpen(false);
        fetchData();
      } else {
        setErrorMsg(data.error || 'Failed to create team');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Update Team
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;
    setActionLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/v1/teams/${selectedTeam._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message);
        setTimeout(() => setSuccessMsg(''), 4000);
        setEditModalOpen(false);
        fetchData();
      } else {
        setErrorMsg(data.error || 'Failed to update team');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Add Member to Squad
  const handleAddMemberToSquad = async () => {
    if (!selectedTeam || !addMemberEmpId) return;
    setActionLoading(true);
    try {
      const currentIds = (selectedTeam.members || []).map((m) => m.employee?._id).filter(Boolean);
      if (currentIds.includes(addMemberEmpId)) {
        alert('This employee is already a member of this squad.');
        setActionLoading(false);
        return;
      }

      const updatedIds = [...currentIds, addMemberEmpId];
      const res = await fetch(`/api/v1/teams/${selectedTeam._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberEmployeeIds: updatedIds }),
      });
      const data = await res.json();
      if (data.success) {
        setAddMemberEmpId('');
        const refreshed = await (await fetch('/api/v1/teams')).json();
        if (refreshed.success) {
          setTeams(refreshed.teams || []);
          const updated = (refreshed.teams || []).find((t: any) => t._id === selectedTeam._id);
          if (updated) setSelectedTeam(updated);
        }
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Remove Member from Squad
  const handleRemoveMember = async (empId: string) => {
    if (!selectedTeam) return;
    setActionLoading(true);
    try {
      const currentIds = (selectedTeam.members || []).map((m) => m.employee?._id).filter(Boolean);
      const updatedIds = currentIds.filter((id) => id !== empId);

      const res = await fetch(`/api/v1/teams/${selectedTeam._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberEmployeeIds: updatedIds }),
      });
      const data = await res.json();
      if (data.success) {
        const refreshed = await (await fetch('/api/v1/teams')).json();
        if (refreshed.success) {
          setTeams(refreshed.teams || []);
          const updated = (refreshed.teams || []).find((t: any) => t._id === selectedTeam._id);
          if (updated) setSelectedTeam(updated);
        }
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Team
  const handleDeleteTeam = async (team: ITeam) => {
    if (!confirm(`Are you sure you want to delete squad "${team.name}"?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/teams/${team._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message);
        setTimeout(() => setSuccessMsg(''), 4000);
        fetchData();
      } else {
        alert(data.error || 'Failed to delete team');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const totalMembersAcrossTeams = teams.reduce((acc, t) => acc + (t.memberCount || 0), 0);
  const teamsWithLead = teams.filter((t) => t.teamLeadId).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* HEADER & QUICK NAV */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Users2 className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Teams & Functional Squads</h1>
                <p className="text-xs text-slate-500">
                  Agile delivery squads, designated technical leads, department alignment, and member allocations.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/organization"
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Network className="w-3.5 h-3.5 text-blue-600" />
              <span>Org Chart</span>
            </Link>
            <Link
              href="/departments"
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Departments</span>
            </Link>
            <Link
              href="/resource-allocation"
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>Resource Matrix</span>
            </Link>
            <button
              onClick={handleOpenCreate}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>Create Team</span>
            </button>
          </div>
        </div>

        {/* NOTIFICATIONS */}
        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* METRICS STRIP */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Squads</span>
              <Users2 className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{teams.length}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Active delivery squads</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Team Members</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{totalMembersAcrossTeams}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Assigned to functional teams</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Leads Assigned</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{teamsWithLead}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {teams.length - teamsWithLead} unassigned leads
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Departments</span>
              <Building2 className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{departments.length}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Covering organizational units</div>
          </div>
        </div>

        {/* SEARCH & FILTER BAR */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by team name, code, lead..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* TEAMS GRID */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading squads and memberships...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeams.map((team) => {
              const lead = team.teamLeadId;
              const members = team.members || [];

              return (
                <div
                  key={team._id}
                  className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Top Badges */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md">
                          {team.code}
                        </span>
                        {team.departmentId && (
                          <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md">
                            {team.departmentId.name}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(team)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Edit Team"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTeam(team)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Team"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{team.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {team.description || 'Dedicated functional team delivering core business deliverables.'}
                    </p>

                    {/* Technical Lead Card */}
                    <div className="mt-4 p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {lead ? `${lead.firstName[0]}${lead.lastName[0]}` : '—'}
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            Technical Lead (TL)
                          </div>
                          <div className="text-xs font-bold text-slate-800">
                            {lead ? `${lead.firstName} ${lead.lastName}` : 'Unassigned'}
                          </div>
                        </div>
                      </div>

                      {lead && (
                        <span className="text-[10px] font-mono text-slate-400 font-semibold">
                          {lead.employeeCode}
                        </span>
                      )}
                    </div>

                    {/* Members Avatar Preview */}
                    <div className="mt-3.5">
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">
                        Squad Members ({members.length})
                      </div>

                      {members.length === 0 ? (
                        <div className="text-[11px] text-slate-400 italic">No members assigned yet.</div>
                      ) : (
                        <div className="flex items-center -space-x-1.5 overflow-hidden py-1">
                          {members.slice(0, 5).map((m, idx) => (
                            <div
                              key={idx}
                              title={`${m.employee?.firstName} ${m.employee?.lastName} (${m.roleInTeam})`}
                              className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white text-slate-700 text-[10px] font-bold flex items-center justify-center shadow-xs"
                            >
                              {m.employee?.firstName?.[0]}
                              {m.employee?.lastName?.[0]}
                            </div>
                          ))}
                          {members.length > 5 && (
                            <div className="w-7 h-7 rounded-full bg-slate-800 border-2 border-white text-white text-[10px] font-bold flex items-center justify-center">
                              +{members.length - 5}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => handleOpenMembers(team)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Manage Members ({members.length})</span>
                    </button>

                    <button
                      onClick={() => handleOpenMembers(team)}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Roster</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CREATE TEAM MODAL */}
        {createModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-scaleIn max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                    <Users2 className="w-4 h-4" />
                  </span>
                  <h2 className="text-base font-bold text-slate-900">Create New Team / Squad</h2>
                </div>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleCreate} className="space-y-4 overflow-y-auto flex-1 pr-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Squad Name *</label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Frontend Core Squad"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Team Code *</label>
                    <input
                      required
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="e.g. FE-CORE"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                    <select
                      value={formData.departmentId}
                      onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">None / Cross-Department</option>
                      {departments.map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">Technical Lead (TL)</label>
                      <span className="text-[10px] text-indigo-600 font-semibold">TL roles only</span>
                    </div>
                    <select
                      value={formData.teamLeadId}
                      onChange={(e) => setFormData({ ...formData, teamLeadId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">
                        {eligibleLeads.length === 0 ? 'No employees with TL role yet' : 'None / Unassigned'}
                      </option>
                      {eligibleLeads.map((emp) => (
                        <option key={emp._id} value={emp._id}>
                          {emp.firstName} {emp.lastName} ({emp.employeeCode}) — {emp.roleId?.name || 'Lead'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Description / Goal</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Key deliverables, microservices, or client projects handled..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                {/* Member Multi-Select */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Initial Squad Members</label>
                  <div className="border border-slate-200 rounded-xl max-h-36 overflow-y-auto p-2 bg-slate-50/50 space-y-1.5">
                    {allEmployees.map((emp) => {
                      const isChecked = formData.memberEmployeeIds.includes(emp._id);
                      return (
                        <label
                          key={emp._id}
                          className="flex items-center gap-2 text-xs p-1.5 rounded-lg hover:bg-white cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  memberEmployeeIds: [...formData.memberEmployeeIds, emp._id],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  memberEmployeeIds: formData.memberEmployeeIds.filter((id) => id !== emp._id),
                                });
                              }
                            }}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="font-semibold text-slate-800">
                            {emp.firstName} {emp.lastName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">({emp.employeeCode})</span>
                          <span className="text-[10px] text-slate-500 ml-auto">{emp.roleId?.name || 'Staff'}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
                  >
                    {actionLoading ? 'Creating...' : 'Create Team'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT TEAM MODAL */}
        {editModalOpen && selectedTeam && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-scaleIn">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                    <Edit2 className="w-4 h-4" />
                  </span>
                  <h2 className="text-base font-bold text-slate-900">Edit Team: {selectedTeam.name}</h2>
                </div>
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Squad Name *</label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Team Code *</label>
                    <input
                      required
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                    <select
                      value={formData.departmentId}
                      onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">None / Cross-Department</option>
                      {departments.map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">Technical Lead (TL)</label>
                      <span className="text-[10px] text-indigo-600 font-semibold">TL roles only</span>
                    </div>
                    <select
                      value={formData.teamLeadId}
                      onChange={(e) => setFormData({ ...formData, teamLeadId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">None / Unassigned</option>
                      {eligibleLeads.map((emp) => (
                        <option key={emp._id} value={emp._id}>
                          {emp.firstName} {emp.lastName} ({emp.employeeCode}) — {emp.roleId?.name || 'Lead'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Description / Goal</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
                  >
                    {actionLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MANAGE MEMBERS MODAL */}
        {membersModalOpen && selectedTeam && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl animate-scaleIn max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md">
                      {selectedTeam.code}
                    </span>
                    <h2 className="text-base font-bold text-slate-900">{selectedTeam.name} Roster</h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Add or remove active contributors from this squad.
                  </p>
                </div>
                <button
                  onClick={() => setMembersModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Add Member Bar */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 mb-4 flex items-center gap-2 shrink-0">
                <select
                  value={addMemberEmpId}
                  onChange={(e) => setAddMemberEmpId(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select Employee to Add to Squad...</option>
                  {allEmployees
                    .filter(
                      (e) => !(selectedTeam.members || []).some((m) => m.employee?._id === e._id)
                    )
                    .map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeCode}) — {emp.roleId?.name || 'Staff'}
                      </option>
                    ))}
                </select>

                <button
                  disabled={!addMemberEmpId || actionLoading}
                  onClick={handleAddMemberToSquad}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs disabled:opacity-50 cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {/* Current Members List */}
              <div className="overflow-y-auto flex-1 pr-1 space-y-2">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Active Squad Members ({(selectedTeam.members || []).length})
                </div>

                {(selectedTeam.members || []).length === 0 ? (
                  <div className="py-10 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                    <p className="text-xs font-semibold">No members currently assigned to this squad.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden">
                    {(selectedTeam.members || []).map((m) => {
                      const emp = m.employee;
                      const isLead =
                        selectedTeam.teamLeadId && String(selectedTeam.teamLeadId._id) === String(emp?._id);

                      return (
                        <div key={m.membershipId || emp?._id} className="p-3 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center">
                              {emp?.firstName?.[0]}
                              {emp?.lastName?.[0]}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900">
                                  {emp?.firstName} {emp?.lastName}
                                </span>
                                {isLead && (
                                  <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded">
                                    Team Lead
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {emp?.email} • <span className="font-mono text-slate-600 font-semibold">{emp?.employeeCode}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md">
                              {emp?.roleId?.name || 'Member'}
                            </span>
                            <button
                              onClick={() => handleRemoveMember(emp._id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Remove from squad"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-end shrink-0">
                <button
                  onClick={() => setMembersModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
