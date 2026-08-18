import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  ShieldAlert,
  ShieldCheck,
  Award,
  ChevronDown,
  ChevronUp,
  FileText,
  User,
  Phone,
  Home,
  MessageSquare,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Send,
  Clock
} from "lucide-react";
import { Contract } from "../types";
import SmsSimulator from "./SmsSimulator";

interface ContractAnalyzerProps {
  contract: Contract;
  onSelectAnother: () => void;
  onActivateDispute: () => void;
  onUpdateContract: (updated: Contract) => void;
}

export default function ContractAnalyzer({
  contract: initialContract,
  onSelectAnother,
  onActivateDispute,
  onUpdateContract
}: ContractAnalyzerProps) {
  const [contract, setContract] = useState<Contract>(initialContract);
  const [expandedClauseId, setExpandedClauseId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'clauses' | 'sms_gateway' | 'landlord_updates'>('clauses');
  
  // Landlord edit states (simulation)
  const [modifiedRent, setModifiedRent] = useState(contract.monthlyRent.toString());
  const [modifiedDeposit, setModifiedDeposit] = useState(contract.depositAmount.toString());
  const [updatingTerms, setUpdatingTerms] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  useEffect(() => {
    setContract(initialContract);
    setModifiedRent(initialContract.monthlyRent.toString());
    setModifiedDeposit(initialContract.depositAmount.toString());
  }, [initialContract]);

  const toggleClause = (id: string) => {
    if (expandedClauseId === id) {
      setExpandedClauseId(null);
    } else {
      setExpandedClauseId(id);
    }
  };

  const reloadContractStatus = () => {
    fetch(`/api/contracts/${contract.id}`)
      .then((res) => res.json())
      .then((data) => {
        setContract(data);
        onUpdateContract(data);
      })
      .catch((err) => console.error(err));
  };

  const handleLandlordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingTerms(true);
    setUpdateSuccess(false);

    // Simulate landlord resolving some clauses or changing financials
    const resolvedClauses = contract.clauses.map((c) => {
      // Landlord claims they are updating the clauses to comply (demo resolution)
      if (c.status === "illegal") {
        return {
          ...c,
          originalText: c.originalText + " (Amended: Subject to 30 days notice and legal dispute guidelines)",
          status: "compliant" as const
        };
      }
      return c;
    });

    fetch(`/api/contracts/${contract.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        monthlyRent: Number(modifiedRent),
        depositAmount: Number(modifiedDeposit),
        clauseUpdates: resolvedClauses,
        updateNotes: "Landlord agreed to amend the instant eviction clause to comply with Kenyan laws."
      })
    })
      .then((res) => res.json())
      .then((updated) => {
        setUpdatingTerms(false);
        setUpdateSuccess(true);
        setContract(updated);
        onUpdateContract(updated);
        setTimeout(() => setUpdateSuccess(false), 4000);
      })
      .catch((err) => {
        console.error(err);
        setUpdatingTerms(false);
      });
  };

  // Status Styling Helpers
  const statusStyles = {
    pending_review: { label: "Under AI Pre-Screen", bg: "bg-blue-50 text-blue-700 border-blue-200" },
    under_review: { label: "Advocate Legal Audit", bg: "bg-amber-50 text-amber-700 border-amber-200" },
    approved: { label: "Advocate Approved", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    revision_requested: { label: "Revision Requested", bg: "bg-rose-50 text-rose-700 border-rose-200" }
  };

  const scoreColorClass = (score: number) => {
    if (score >= 80) return "text-emerald-600 border-emerald-500 bg-emerald-50";
    if (score >= 60) return "text-amber-600 border-amber-500 bg-amber-50";
    return "text-rose-600 border-rose-500 bg-rose-50";
  };

  return (
    <div id="contract-analyzer-view" className="space-y-8">
      {/* Upper overview header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E8E6E1] pb-6">
        <div>
          <button
            onClick={onSelectAnother}
            className="text-[10px] font-bold text-[#D12D2D] hover:text-[#B12525] flex items-center gap-1 mb-3 uppercase tracking-widest transition"
          >
            ← Back to Active Leases
          </button>
          <h2 className="text-3xl font-serif italic text-[#1A1A1A] flex items-center gap-2">
            <FileText className="w-7 h-7 text-[#D12D2D]" />
            <span>Audit Registry: {contract.apartmentName}</span>
          </h2>
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <span className={`px-2.5 py-0.5 rounded-none text-[9px] uppercase tracking-wider font-extrabold border ${statusStyles[contract.status].bg}`}>
              {statusStyles[contract.status].label}
            </span>
            <span className="text-slate-300 text-xs">•</span>
            <span className="text-slate-500 text-[10px] uppercase tracking-wider font-bold flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              Tenant: {contract.tenantName}
            </span>
          </div>
        </div>

        {/* MakaziShield badge status */}
        {contract.status === "approved" && contract.smsStatus === "accepted" ? (
          <div className="shrink-0 flex items-center gap-3 bg-emerald-600 text-white px-6 py-4 rounded-none shadow-sm border border-emerald-500">
            <div className="bg-white/20 p-2 rounded-none text-white">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[9px] uppercase font-bold tracking-widest text-emerald-100">Retainer Defense</div>
              <div className="text-xs uppercase tracking-wider font-extrabold font-serif">🛡️ MakaziShield Active</div>
            </div>
          </div>
        ) : (
          <div className="shrink-0 flex items-center gap-3 bg-[#F7F5F2] text-slate-500 px-6 py-4 rounded-none border border-[#E8E6E1]">
            <div className="bg-slate-200/60 p-2 rounded-none text-slate-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[9px] uppercase font-bold tracking-widest text-slate-400">Retainer Status</div>
              <div className="text-xs uppercase tracking-wider font-bold text-slate-600">Shield Pending Approval</div>
            </div>
          </div>
        )}
      </div>

      {/* Main Analysis Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Columns (Audited Details) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Executive metrics card */}
          <div className="bg-white rounded-none border border-[#E8E6E1] p-6 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-sm">
            {/* Score Ring */}
            <div className="flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-[#E8E6E1] pb-6 md:pb-0 md:pr-6">
              <div className={`w-28 h-28 rounded-full border-2 flex flex-col items-center justify-center ${scoreColorClass(contract.fairnessScore)}`}>
                <span className="text-4xl font-serif italic font-bold">{contract.fairnessScore}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mt-1">Fairness</span>
              </div>
              <span className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold mt-3 block text-center">Tenant Score Rating</span>
            </div>

            {/* Financial summaries */}
            <div className="space-y-4 md:col-span-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#F7F5F2] p-4 rounded-none border border-[#E8E6E1]">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Monthly Rent</div>
                  <div className="text-lg font-bold font-mono text-[#1A1A1A] mt-1">KES {contract.monthlyRent.toLocaleString()}</div>
                </div>
                <div className="bg-[#F7F5F2] p-4 rounded-none border border-[#E8E6E1]">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Security Deposit</div>
                  <div className="text-lg font-bold font-mono text-[#1A1A1A] mt-1">KES {contract.depositAmount.toLocaleString()}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#D12D2D] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Summary of Terms:</span>
                </div>
                <p className="text-slate-700 text-xs leading-relaxed italic font-serif bg-[#FDFCFB] p-4 rounded-none border border-[#E8E6E1]">
                  "{contract.summary}"
                </p>
              </div>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="border-b border-[#E8E6E1] flex gap-6 text-xs font-semibold uppercase tracking-wider">
            <button
              onClick={() => setActiveTab('clauses')}
              className={`pb-3 border-b-2 transition-all cursor-pointer ${activeTab === 'clauses' ? "border-[#D12D2D] text-[#D12D2D]" : "border-transparent text-slate-400 hover:text-[#1A1A1A]"}`}
            >
              Citations & Clauses ({contract.clauses.length})
            </button>
            <button
              onClick={() => setActiveTab('sms_gateway')}
              className={`pb-3 border-b-2 transition-all cursor-pointer ${activeTab === 'sms_gateway' ? "border-[#D12D2D] text-[#D12D2D]" : "border-transparent text-slate-400 hover:text-[#1A1A1A]"}`}
            >
              Landlord SMS Portal
            </button>
            <button
              onClick={() => setActiveTab('landlord_updates')}
              className={`pb-3 border-b-2 transition-all cursor-pointer ${activeTab === 'landlord_updates' ? "border-[#D12D2D] text-[#D12D2D]" : "border-transparent text-slate-400 hover:text-[#1A1A1A]"}`}
            >
              Simulate Updates
            </button>
          </div>

          {/* Tab Content 1: Clause Audit */}
          {activeTab === 'clauses' && (
            <div className="space-y-4">
              {contract.clauses.map((clause) => {
                const isExpanded = expandedClauseId === clause.id;
                const badgeColor = {
                  compliant: "bg-emerald-50 text-emerald-700 border-emerald-300",
                  warning: "bg-amber-50 text-amber-700 border-amber-300",
                  illegal: "bg-red-50 text-[#D12D2D] border-[#D12D2D]/30"
                }[clause.status];

                return (
                  <div
                    key={clause.id}
                    className="bg-white rounded-none border border-[#E8E6E1] overflow-hidden shadow-sm hover:border-[#D12D2D] transition-all"
                  >
                    <div
                      onClick={() => toggleClause(clause.id)}
                      className="p-4 flex items-center justify-between cursor-pointer select-none bg-[#FDFCFB]"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-none border ${badgeColor}`}>
                          {clause.status}
                        </span>
                        <h3 className="font-serif italic text-base text-[#1A1A1A]">{clause.title}</h3>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-[#D12D2D]" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>

                    {isExpanded && (
                      <div className="border-t border-[#E8E6E1] p-6 bg-[#F7F5F2] space-y-4 text-xs">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1.5">
                            <h4 className="font-bold text-slate-500 uppercase tracking-widest text-[9px]">Clause text in lease:</h4>
                            <p className="bg-white text-slate-700 p-4 rounded-none border border-[#E8E6E1] italic font-mono leading-relaxed">
                              "{clause.originalText}"
                            </p>
                          </div>
                          <div className="space-y-1.5">
                            <h4 className="font-bold text-slate-500 uppercase tracking-widest text-[9px]">Tenant impact summary:</h4>
                            <p className="text-slate-600 leading-relaxed p-1 font-serif text-sm">
                              {clause.summary}
                            </p>
                          </div>
                        </div>

                        {clause.citation && (
                          <div className="bg-white p-5 rounded-none border-l-4 border-l-[#D12D2D] border border-[#E8E6E1] space-y-2">
                            <h4 className="font-extrabold text-[#D12D2D] flex items-center gap-1.5 text-[9px] uppercase tracking-wider">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Kenyan Law Citation Engine</span>
                            </h4>
                            <p className="text-slate-700 leading-relaxed font-serif italic">
                              {clause.citation}
                            </p>
                          </div>
                        )}

                        {clause.recommendation && (
                          <div className="bg-emerald-50/20 p-5 rounded-none border-l-4 border-l-emerald-600 border border-[#E8E6E1] space-y-2">
                            <h4 className="font-extrabold text-emerald-800 text-[9px] uppercase tracking-wider">
                              Recommended Tenant Wording:
                            </h4>
                            <p className="text-slate-700 font-medium leading-relaxed italic bg-white p-3 rounded-none border border-[#E8E6E1]">
                              "{clause.recommendation}"
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab Content 2: SMS Gateway */}
          {activeTab === 'sms_gateway' && (
            <SmsSimulator
              contractId={contract.id}
              landlordName={contract.landlordName}
              landlordPhone={contract.landlordPhone}
              onStatusChange={reloadContractStatus}
            />
          )}

          {/* Tab Content 3: Landlord Updates Simulation */}
          {activeTab === 'landlord_updates' && (
            <div className="bg-white rounded-none border border-[#E8E6E1] p-6 space-y-6 shadow-sm">
              <div className="border-b border-[#E8E6E1] pb-4">
                <h3 className="font-serif italic text-xl text-[#1A1A1A]">Landlord Update Panel</h3>
                <p className="text-slate-500 text-xs mt-1 uppercase tracking-wider">
                  In case of negotiations, simulate the landlord updating the tenancy parameters. This resets the contract state to "pending review" to alert the retainer lawyer.
                </p>
              </div>

              {contract.lastUpdateNotes && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-none text-amber-800 text-xs flex flex-col gap-1.5">
                  <span className="font-bold flex items-center gap-1.5 text-[10px] uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Recent Contract Modifications:</span>
                  </span>
                  <span className="italic">"{contract.lastUpdateNotes}"</span>
                </div>
              )}

              <form onSubmit={handleLandlordUpdate} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Modify Monthly Rent (KES)</label>
                    <input
                      type="number"
                      value={modifiedRent}
                      onChange={(e) => setModifiedRent(e.target.value)}
                      className="w-full px-4 py-3 rounded-none border border-[#E8E6E1] focus:border-[#D12D2D] text-sm outline-none bg-[#FDFCFB]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Modify Deposit (KES)</label>
                    <input
                      type="number"
                      value={modifiedDeposit}
                      onChange={(e) => setModifiedDeposit(e.target.value)}
                      className="w-full px-4 py-3 rounded-none border border-[#E8E6E1] focus:border-[#D12D2D] text-sm outline-none bg-[#FDFCFB]"
                    />
                  </div>
                </div>

                {updateSuccess && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-none text-emerald-800 text-xs flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>Contract terms modified successfully! The contract status has been reset to "pending review" for the advocate to audit.</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={updatingTerms}
                  className="w-full sm:w-auto inline-flex items-center gap-2 bg-[#1A1A1A] hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-widest py-3 px-6 rounded-none transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${updatingTerms ? "animate-spin" : ""}`} />
                  <span>Update Terms (Landlord Action)</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Sidebar: Retainer details / dispute action */}
        <div className="space-y-6">
          {/* Dispute Center Card */}
          <div className="bg-white rounded-none border border-[#E8E6E1] p-6 shadow-sm space-y-4">
            <h3 className="font-serif italic text-lg text-[#1A1A1A]">MakaziShield Protection</h3>
            <p className="text-slate-500 text-xs leading-relaxed font-serif italic">
              Once an advocate approves your contract and the landlord confirms, your lifetime legal defense retainer is locked. If any disputes occur, activate protection instantly.
            </p>

            {contract.status === "approved" && contract.smsStatus === "accepted" ? (
              <div className="space-y-4 pt-2">
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-none text-emerald-900 text-xs space-y-2">
                  <div className="font-bold flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Legal Custodian Assigned</span>
                  </div>
                  <p className="font-serif italic text-slate-700 leading-relaxed">
                    {contract.lawyerName || "Wakili Sharon Odhiambo"} is now the custodian of this contract. You are covered under retainer.
                  </p>
                </div>

                <button
                  onClick={onActivateDispute}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#D12D2D] hover:bg-[#B12525] text-white font-bold text-xs uppercase tracking-widest py-3.5 px-4 rounded-none shadow transition cursor-pointer"
                >
                  <span>Activate One-Click Dispute</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="p-4 bg-[#F7F5F2] border border-[#E8E6E1] rounded-none space-y-3">
                <div className="text-slate-400 text-[10px] uppercase tracking-wider font-bold flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>Shield Inactive (Awaiting Approval)</span>
                </div>
                <div className="space-y-1.5 text-slate-500 text-[11px] leading-relaxed">
                  <p>• Retainer requires lawyer review and approval stamps.</p>
                  <p>• Landlord must also acknowledge terms via SMS reply.</p>
                </div>
              </div>
            )}
          </div>

          {/* Assigned Lawyer Profile (if any) */}
          {contract.lawyerName && (
            <div className="bg-white rounded-none border border-[#E8E6E1] p-6 shadow-sm space-y-4">
              <h4 className="font-bold text-slate-400 text-[9px] uppercase tracking-widest">Assigned Legal Advocate</h4>
              <div className="flex items-center gap-4">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
                  alt="Wakili Sharon Odhiambo"
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-full object-cover border border-[#E8E6E1]"
                />
                <div>
                  <div className="font-serif italic text-base font-bold text-[#1A1A1A]">{contract.lawyerName}</div>
                  <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Odhiambo & Co. Advocates</div>
                  <div className="inline-flex items-center gap-1 mt-1 bg-emerald-50 text-emerald-700 border border-emerald-300 px-2 py-0.5 rounded-none text-[9px] font-bold">
                    <span>Verified High Court Counsel</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
