'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { generateOfferLetterPDF } from '@/lib/pdf-generator';
import {
  FileText,
  Plus,
  Download,
  Eye,
  CheckCircle2,
  Sparkles,
  Printer,
  X,
  FileCheck,
} from 'lucide-react';

export default function DocumentsPage() {
  const { user, organization } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [success, setSuccess] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<any>(null);

  const [form, setForm] = useState({
    documentType: 'OFFER_LETTER',
    recipientName: '',
    recipientEmail: '',
    title: 'Employment Offer Letter',
    designation: 'Senior Full Stack Engineer',
    ctcAnnual: 1500000,
    branchCity: 'Bengaluru',
  });

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/v1/documents');
      const data = await res.json();
      if (data.success) {
        setDocuments(data.documents || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const customContent = `REF: OFFICIAL LETTER\nDATE: ${new Date().toLocaleDateString('en-IN')}\n\nTO: ${form.recipientName}\nEMAIL: ${form.recipientEmail}\n\n` +
        `Subject: ${form.title} - ${form.designation}\n\nWe are pleased to issue this official ${form.documentType.replace(/_/g, ' ')} for the position of ${form.designation} at ${organization?.name || 'TechCorp Solutions India Pvt Ltd'}.\n` +
        `Cost to Company (CTC): INR ${Number(form.ctcAnnual).toLocaleString('en-IN')} per annum.\nLocation: ${form.branchCity}, India.\n\n` +
        `Issued by Human Resources & People Operations.`;

      const res = await fetch('/api/v1/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentType: form.documentType,
          recipientName: form.recipientName,
          recipientEmail: form.recipientEmail,
          title: form.title,
          customContent,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Document successfully generated and added to archives!');
        setModalOpen(false);
        fetchDocuments();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadPDF = (docItem: any) => {
    const pdf = generateOfferLetterPDF(
      organization?.name || 'TechCorp Solutions India Pvt Ltd',
      docItem.recipientName,
      docItem.title || 'Official Role',
      1500000,
      'Immediate',
      'Bengaluru'
    );
    pdf.save(`${docItem.documentNumber || 'DOCUMENT'}.pdf`);
  };

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold tracking-wider uppercase text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200/60">
              Document Management
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-medium text-slate-500">{documents.length} Issued Records</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            Letters & Document Generator
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Offer letters, appointment agreements, relieving certificates, and experience letters with immutable versions
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Generate New Letter</span>
        </button>
      </div>

      {success && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* TEMPLATES AVAILABLE OVERVIEW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs text-xs">
        <div className="p-2 border-r border-slate-100 last:border-0">
          <span className="text-[10px] text-orange-600 uppercase font-bold">Offer Letter</span>
          <p className="text-slate-900 font-bold mt-0.5">Corporate Candidate Offer</p>
          <p className="text-[10px] text-slate-500 font-medium">Includes CTC & joining clauses</p>
        </div>
        <div className="p-2 border-r border-slate-100 last:border-0">
          <span className="text-[10px] text-emerald-600 uppercase font-bold">Appointment Letter</span>
          <p className="text-slate-900 font-bold mt-0.5">Formal Employment Contract</p>
          <p className="text-[10px] text-slate-500 font-medium">Probation & confirmation terms</p>
        </div>
        <div className="p-2 border-r border-slate-100 last:border-0">
          <span className="text-[10px] text-purple-600 uppercase font-bold">Relieving Certificate</span>
          <p className="text-slate-900 font-bold mt-0.5">Exit & Full Settlement</p>
          <p className="text-[10px] text-slate-500 font-medium">Notice period completion</p>
        </div>
        <div className="p-2">
          <span className="text-[10px] text-amber-600 uppercase font-bold">Experience Letter</span>
          <p className="text-slate-900 font-bold mt-0.5">Service Record & Conduct</p>
          <p className="text-[10px] text-slate-500 font-medium">Tenure and roles performed</p>
        </div>
      </div>

      {/* ISSUED DOCUMENTS TABLE */}
      <div className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
            Issued Official Documents & Letters
          </h3>
          <span className="text-[11px] text-slate-500 font-medium">{documents.length} Total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Document Number</th>
                <th className="py-3.5 px-4">Recipient Name</th>
                <th className="py-3.5 px-4">Document Type</th>
                <th className="py-3.5 px-4">Title</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Issue Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.map((doc) => (
                <tr key={doc._id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-orange-600">
                    {doc.documentNumber}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{doc.recipientName}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{doc.recipientEmail}</div>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">
                    {doc.documentType?.replace(/_/g, ' ')}
                  </td>
                  <td className="py-3.5 px-4 text-slate-800 max-w-xs truncate font-medium">
                    {doc.title}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {doc.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-medium">
                    {new Date(doc.issuedAt || doc.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedDoc(doc)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors"
                        title="View Letter Content"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDownloadPDF(doc)}
                        className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm cursor-pointer transition-all"
                        title="Download PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {documents.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    No documents generated yet. Click &quot;Generate New Letter&quot; to issue.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* GENERATE LETTER MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 relative">
            <button onClick={() => setModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-black text-slate-900 mb-1">Generate Official Document</h2>
            <p className="text-xs text-slate-500 mb-4 font-medium">Creates verified document with immutable number</p>

            <form onSubmit={handleGenerate} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Document Type</label>
                <select
                  value={form.documentType}
                  onChange={(e) => setForm({ ...form, documentType: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:bg-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer"
                >
                  <option value="OFFER_LETTER">Employment Offer Letter</option>
                  <option value="APPOINTMENT_LETTER">Appointment Letter</option>
                  <option value="RELIEVING_LETTER">Relieving Letter</option>
                  <option value="EXPERIENCE_LETTER">Experience Certificate</option>
                  <option value="PROMOTION_LETTER">Promotion & Salary Revision Letter</option>
                  <option value="NOC">No Objection Certificate (NOC)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Recipient Legal Name *</label>
                <input
                  type="text"
                  required
                  value={form.recipientName}
                  onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
                  placeholder="e.g. Karan Malhotra"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:bg-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Recipient Email *</label>
                <input
                  type="email"
                  required
                  value={form.recipientEmail}
                  onChange={(e) => setForm({ ...form, recipientEmail: e.target.value })}
                  placeholder="karan.malhotra@gmail.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:bg-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={form.designation}
                    onChange={(e) => setForm({ ...form, designation: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:bg-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Annual CTC (INR)</label>
                  <input
                    type="number"
                    value={form.ctcAnnual}
                    onChange={(e) => setForm({ ...form, ctcAnnual: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:bg-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xs font-bold shadow-md shadow-orange-500/20 cursor-pointer transition-all"
                >
                  Issue Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW LETTER MODAL */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 relative">
            <button onClick={() => setSelectedDoc(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">{selectedDoc.title}</h3>
                <p className="text-xs font-mono font-bold text-orange-600">{selectedDoc.documentNumber}</p>
              </div>
              <button
                onClick={() => handleDownloadPDF(selectedDoc)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-500/20 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save PDF</span>
              </button>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 whitespace-pre-line leading-relaxed max-h-80 overflow-y-auto">
              {selectedDoc.content}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
