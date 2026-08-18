import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  ShieldAlert,
  ShieldCheck,
  Check,
  X,
  FileText,
  Clock,
  Briefcase,
  TrendingUp,
  Landmark,
  User,
  ExternalLink,
  MessageSquare,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { Contract } from "../types";

interface LawyerPortalProps {
  currentUser?: {
    id: string;
    username: string;
    name: string;
    role: 'landlord' | 'tenant' | 'lawyer';
    firm?: string;
  } | null;
}

export default function LawyerPortal({ currentUser }: LawyerPortalProps) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [actionSuccess, setActionSuccess] = useState(false);

  const fetchContracts = () => {
    setLoading(true);
    fetch("/api/contracts")
      .then((res) => res.json())
      .then((data) => {
        setContracts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const handleApprove = (contractId: string) => {
    fetch(`/api/contracts/${contractId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lawyerId: currentUser?.id || "lawyer-1" }) // Use logged in lawyer ID
    })
      .then((res) => res.json())
      .then(() => {
        setActionSuccess(true);
        setSelectedContract(null);
        fetchContracts();
        setTimeout(() => setActionSuccess(false), 3000);
      })
      .catch((err) => console.error(err));
  };

  const handleRequestRevision = (contractId: string) => {
    fetch(`/api/contracts/${contractId}/request-revision`, {
      method: "POST"
    })
      .then((res) => res.json())
      .then(() => {
        setActionSuccess(true);
        setSelectedContract(null);
        fetchContracts();
        setTimeout(() => setActionSuccess(false), 3000);
      })
      .catch((err) => console.error(err));
  };

  const pendingCount = contracts.filter((c) => c.status === "pending_review").length;

  return (
    <div id="lawyer-portal-view" className="space-y-8">
      {/* Portal Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#E8E6E1] pb-6 gap-4">
        <div>
          <h2 className="text-3xl font-serif italic text-[#1A1A1A] flex items-center gap-2">
            <Landmark className="text-[#D12D2D] w-7 h-7" />
            <span>Advocate Retainer Workspace</span>
          </h2>
          <p className="text-slate-500 text-xs uppercase tracking-wider mt-2">
            Wakili Board: Approve AI pre-screened leases and manage your tenant legal retainers.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2 bg-red-50 border border-[#D12D2D]/30 px-4 py-2 rounded-none text-[9px] uppercase tracking-widest text-[#D12D2D] font-bold">
          <Briefcase className="w-4 h-4 text-[#D12D2D]" />
          <span>{currentUser?.name || "Sharon Odhiambo, Esq."} ({currentUser?.firm || "Odhiambo & Co. Advocates"})</span>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-none text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span>Advocate Retainer status updated successfully! Stamped and synced with SMS and client dashboards.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Contract list pending review */}
        <div className="space-y-4">
          <div className="bg-white rounded-none border border-[#E8E6E1] p-5 shadow-sm space-y-4">
            <h3 className="font-serif italic text-lg text-[#1A1A1A] pb-2 border-b border-[#E8E6E1] flex items-center justify-between">
              <span>Inbox Queue</span>
              <span className="bg-red-50 text-[#D12D2D] border border-[#D12D2D]/30 text-[9px] font-bold px-2 py-0.5 rounded-none uppercase tracking-wider">
                {pendingCount} Pending
              </span>
            </h3>

            <div className="space-y-3">
              {loading ? (
                <div className="py-12 text-center text-slate-400 text-xs font-serif italic">Loading board...</div>
              ) : contracts.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs font-serif italic">No contracts uploaded yet.</div>
              ) : (
                contracts.map((contract) => (
                  <div
                    key={contract.id}
                    onClick={() => setSelectedContract(contract)}
                    className={`p-4 rounded-none border cursor-pointer transition-all flex flex-col gap-2 ${
                      selectedContract?.id === contract.id
                        ? "border-[#D12D2D] bg-[#F7F5F2]"
                        : "border-[#E8E6E1] hover:border-slate-400 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-serif italic font-bold text-sm text-[#1A1A1A] line-clamp-1">{contract.apartmentName}</span>
                      <span className={`px-2 py-0.5 text-[8px] font-bold rounded-none uppercase tracking-wider ${
                        contract.status === "approved"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : contract.status === "pending_review"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-[#F7F5F2] text-slate-500 border border-[#E8E6E1]"
                      }`}>
                        {contract.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                      <span>Rent: KES {contract.monthlyRent.toLocaleString()}</span>
                      <span className="font-mono text-[9px] text-slate-600 font-bold">Score: {contract.fairnessScore}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Columns: Active contract workspace */}
        <div className="lg:col-span-2 space-y-4">
          {selectedContract ? (
            <div className="bg-white rounded-none border border-[#E8E6E1] p-8 space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E6E1] pb-4">
                <div>
                  <h3 className="text-xl font-serif italic text-[#1A1A1A]">{selectedContract.apartmentName}</h3>
                  <p className="text-slate-500 text-xs uppercase tracking-wider mt-1.5">
                    Tenant: {selectedContract.tenantName} | Landlord: {selectedContract.landlordName}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1.5 border text-[9px] uppercase tracking-widest font-bold rounded-none ${
                    selectedContract.fairnessScore >= 70 ? "bg-emerald-50 text-emerald-700 border-emerald-300" : "bg-red-50 text-[#D12D2D] border-[#D12D2D]/30"
                  }`}>
                    AI Score: {selectedContract.fairnessScore}/100
                  </span>
                </div>
              </div>

              {/* AI Pre-Screen summary for lawyer */}
              <div className="bg-white border-l-4 border-l-[#D12D2D] border border-[#E8E6E1] p-5 space-y-2">
                <div className="flex items-center gap-1.5 text-[#D12D2D] font-extrabold text-[9px] uppercase tracking-widest">
                  <ShieldAlert className="w-4 h-4" />
                  <span>AI Pre-Screen Diagnostics (Save 90% Review Time)</span>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed font-serif italic">
                  The Kenyan Citation Engine has already parsed this contract and flagged <strong>{selectedContract.clauses.filter(c => c.status !== 'compliant').length} illegal or risky terms</strong>. Please review the AI's legal findings below before stamping.
                </p>
              </div>

              {/* Clauses Checklist */}
              <div className="space-y-4">
                <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Flagged Clauses for Verification</h4>
                {selectedContract.clauses.map((clause, idx) => (
                  <div key={idx} className="border border-[#E8E6E1] rounded-none p-5 bg-[#FDFCFB] space-y-4">
                    <div className="flex items-center justify-between gap-2 border-b border-[#E8E6E1] pb-2">
                      <span className="font-serif italic font-bold text-base text-[#1A1A1A]">{clause.title}</span>
                      <span className={`px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wider rounded-none border ${
                        clause.status === "illegal" 
                          ? "bg-red-50 text-[#D12D2D] border-[#D12D2D]/30" 
                          : "bg-amber-50 text-amber-700 border-amber-500/30"
                      }`}>
                        {clause.status}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Lease Contract Text:</span>
                      <p className="text-xs text-slate-700 italic bg-[#F7F5F2] p-3 rounded-none border border-[#E8E6E1] font-mono">
                        "{clause.originalText}"
                      </p>
                    </div>

                    <div className="space-y-1.5 bg-white p-4 border-l-4 border-l-[#D12D2D] border border-[#E8E6E1]">
                      <span className="text-[9px] font-extrabold text-[#D12D2D] uppercase tracking-wider block">AI Kenyan Citation Recommendation:</span>
                      <p className="text-xs text-slate-700 font-serif italic leading-relaxed mt-1">
                        {clause.citation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Interactive Retainer Annotation & Stamps */}
              {selectedContract.status === "pending_review" && (
                <div className="border-t border-[#E8E6E1] pt-6 space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Lawyer Custody Retainer Note (Sent to Tenant)</label>
                    <textarea
                      placeholder="e.g. Approved. Eviction notice and triple deposit terms must be resolved before shield activation. Outbound summary sent to landlord via Africa's Talking SMS..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-[#E8E6E1] focus:border-[#D12D2D] rounded-none text-xs outline-none resize-none transition bg-[#FDFCFB]"
                    ></textarea>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => handleApprove(selectedContract.id)}
                      className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest rounded-none shadow transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve & Lock Retainer</span>
                    </button>
                    <button
                      onClick={() => handleRequestRevision(selectedContract.id)}
                      className="flex-1 py-4 bg-white hover:bg-[#F7F5F2] text-slate-700 border border-[#E8E6E1] font-bold text-xs uppercase tracking-widest rounded-none transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <X className="w-4 h-4 text-[#D12D2D]" />
                      <span>Request Tenant Revision</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#F7F5F2] border border-dashed border-[#E8E6E1] rounded-none p-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-4 h-full min-h-[350px]">
              <AlertCircle className="w-10 h-10 text-[#D12D2D]/50" />
              <span className="font-serif italic text-base text-[#1A1A1A]/80 max-w-sm">Select an uploaded lease agreement from the sidebar queue to start the review.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
