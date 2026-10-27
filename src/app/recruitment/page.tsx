'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Briefcase,
  Users,
  Plus,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  UserCheck,
  Star,
  ExternalLink,
  X,
  Mail,
  Phone,
} from 'lucide-react';

export default function RecruitmentPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'PIPELINE' | 'JOBS'>('PIPELINE');

  // New Job Modal
  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [jobForm, setJobForm] = useState({
    title: '',
    jobType: 'FULL_TIME',
    experienceRequired: '3-5 years',
    openings: 1,
    salaryMin: 800000,
    salaryMax: 1400000,
    description: '',
  });

  // Convert to Employee Modal
  const [convertCandidate, setConvertCandidate] = useState<any>(null);
  const [convertSuccess, setConvertSuccess] = useState('');

  const fetchData = async () => {
    try {
      const [resJobs, resCandidates] = await Promise.all([
        fetch('/api/v1/recruitment/jobs'),
        fetch('/api/v1/recruitment/candidates'),
      ]);
      const dataJobs = await resJobs.json();
      const dataCandidates = await resCandidates.json();

      if (dataJobs.success) setJobs(dataJobs.jobs || []);
      if (dataCandidates.success) setCandidates(dataCandidates.candidates || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/recruitment/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobForm),
      });
      const data = await res.json();
      if (data.success) {
        setJobModalOpen(false);
        setJobForm({
          title: '',
          jobType: 'FULL_TIME',
          experienceRequired: '3-5 years',
          openings: 1,
          salaryMin: 800000,
          salaryMax: 1400000,
          description: '',
        });
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStageChange = async (candidateId: string, newStage: string) => {
    try {
      const res = await fetch('/api/v1/recruitment/candidates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId, stage: newStage }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleConvertCandidate = async () => {
    if (!convertCandidate) return;
    try {
      const res = await fetch('/api/v1/recruitment/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: convertCandidate._id,
          joiningDate: new Date().toISOString().split('T')[0],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setConvertSuccess(data.message);
        setConvertCandidate(null);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const stages = ['APPLIED', 'SCREENING', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'OFFER', 'HIRED'];

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">Recruitment & ATS</span>
            <span className="text-slate-500">•</span>
            <span className="text-xs text-slate-400">{jobs.length} Active Positions • {candidates.length} Candidates</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Hiring Pipeline & Candidate Tracking
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Requisitions, stages, interview evaluations, offer generation, and 1-click candidate-to-employee onboarding
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setJobModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Job Opening</span>
          </button>
        </div>
      </div>

      {convertSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{convertSuccess}</span>
        </div>
      )}

      {/* TABS */}
      <div className="flex items-center gap-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('PIPELINE')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'PIPELINE'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Candidate Pipeline ({candidates.length})
        </button>
        <button
          onClick={() => setActiveTab('JOBS')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'JOBS'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Active Job Requisitions ({jobs.length})
        </button>
      </div>

      {/* TAB 1: CANDIDATE PIPELINE */}
      {activeTab === 'PIPELINE' && (
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Applied Position</th>
                  <th className="py-3 px-4">Current / Expected CTC</th>
                  <th className="py-3 px-4">ATS Stage</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {candidates.map((cand) => (
                  <tr key={cand._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{cand.firstName} {cand.lastName}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-500" /> {cand.email}</span>
                        {cand.phone && <span className="flex items-center gap-1">• {cand.phone}</span>}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-200">{cand.jobId?.title || 'General Engineering'}</div>
                      <div className="text-[10px] text-slate-500">Source: {cand.source}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <div>Current: INR {(cand.currentCtc || 0).toLocaleString('en-IN')}</div>
                      <div className="text-[11px] text-indigo-400 font-medium">
                        Expected: INR {(cand.expectedCtc || 0).toLocaleString('en-IN')}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={cand.stage}
                        onChange={(e) => handleStageChange(cand._id, e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-indigo-300 font-semibold focus:outline-none focus:border-indigo-500"
                      >
                        {stages.map((stg) => (
                          <option key={stg} value={stg}>
                            {stg}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 text-amber-400">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span className="font-bold text-xs">{cand.rating || 4}.0</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {cand.stage === 'OFFER' && !cand.convertedToEmployeeId && (
                        <button
                          onClick={() => setConvertCandidate(cand)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all inline-flex items-center gap-1"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>1-Click Hire</span>
                        </button>
                      )}
                      {cand.convertedToEmployeeId && (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase">
                          Converted to Employee
                        </span>
                      )}
                    </td>
                  </tr>
                ))}

                {candidates.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No candidate applications found in this requisition cycle.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVE JOBS */}
      {activeTab === 'JOBS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <div key={job._id} className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    {job.jobType}
                  </span>
                  <span className="text-[11px] text-emerald-400 font-semibold">{job.candidateCount || 0} Candidates</span>
                </div>
                <h3 className="text-base font-bold text-white">{job.title}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{job.description}</p>
                <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
                  <span>Exp: <strong className="text-slate-200">{job.experienceRequired}</strong></span>
                  <span>•</span>
                  <span>Range: <strong className="text-slate-200">INR {(job.salaryMin/100000).toFixed(1)}L - {(job.salaryMax/100000).toFixed(1)}L</strong></span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">{job.openings} Openings</span>
                <span className="text-indigo-400 font-semibold flex items-center gap-1">
                  Active in Portal <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE JOB MODAL */}
      {jobModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 relative">
            <button onClick={() => setJobModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-white mb-4">Post New Job Opening</h2>
            <form onSubmit={handleCreateJob} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Job Title *</label>
                <input
                  type="text"
                  required
                  value={jobForm.title}
                  onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  placeholder="e.g. Lead Devops Architect"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Experience</label>
                  <input
                    type="text"
                    value={jobForm.experienceRequired}
                    onChange={(e) => setJobForm({ ...jobForm, experienceRequired: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Openings</label>
                  <input
                    type="number"
                    value={jobForm.openings}
                    onChange={(e) => setJobForm({ ...jobForm, openings: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Min Salary (INR)</label>
                  <input
                    type="number"
                    value={jobForm.salaryMin}
                    onChange={(e) => setJobForm({ ...jobForm, salaryMin: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Max Salary (INR)</label>
                  <input
                    type="number"
                    value={jobForm.salaryMax}
                    onChange={(e) => setJobForm({ ...jobForm, salaryMax: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Job Description *</label>
                <textarea
                  required
                  rows={3}
                  value={jobForm.description}
                  onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  placeholder="Key responsibilities and qualifications..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setJobModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30"
                >
                  Publish Opening
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONVERT CANDIDATE CONFIRMATION MODAL */}
      {convertCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Convert Candidate to Employee</h3>
            <p className="text-xs text-slate-400 mt-1">
              Do you want to convert <strong className="text-slate-200">{convertCandidate.firstName} {convertCandidate.lastName}</strong> into an active employee record?
            </p>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 my-4 text-xs text-left">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Position:</span>
                <span className="font-semibold text-white">{convertCandidate.jobId?.title || 'Engineer'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Offered CTC:</span>
                <span className="font-semibold text-emerald-400">
                  INR {(convertCandidate.offerDetails?.offeredCtc || 1650000).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setConvertCandidate(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConvertCandidate}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30"
              >
                Confirm & Create Employee Record
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
