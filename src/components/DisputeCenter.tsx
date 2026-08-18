import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldAlert,
  ShieldCheck,
  FileText,
  User,
  AlertTriangle,
  Scale,
  Send,
  Loader2,
  CheckCircle2,
  Download,
  Copy,
  Clock
} from "lucide-react";
import { Dispute, Contract } from "../types";

interface DisputeCenterProps {
  contracts: Contract[];
  onBackToDashboard: () => void;
}

export default function DisputeCenter({ contracts, onBackToDashboard }: DisputeCenterProps) {
  const [activeContracts, setActiveContracts] = useState<Contract[]>([]);
  const [selectedContractId, setSelectedContractId] = useState("");
  const [disputeType, setDisputeType] = useState<'deposit_retention' | 'wrongful_eviction' | 'repair_breach' | 'other'>('deposit_retention');
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [activeDispute, setActiveDispute] = useState<Dispute | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchDisputes = () => {
    fetch("/api/disputes")
      .then((res) => res.json())
      .then((data) => {
        setDisputes(data);
        if (data.length > 0) {
          setActiveDispute(data[0]);
        }
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    // Filter contracts that have active retainers (approved)
    const approved = contracts.filter((c) => c.status === "approved");
    setActiveContracts(approved);
    if (approved.length > 0) {
      setSelectedContractId(approved[0].id);
    }
    fetchDisputes();
  }, [contracts]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleActivateDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContractId) return;
    if (!description.trim()) return;

    setLoading(true);

    fetch("/api/disputes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contractId: selectedContractId,
        disputeType,
        description
      })
    })
      .then((res) => res.json())
      .then((data) => {
        setLoading(false);
        setActiveDispute(data);
        setDescription("");
        fetchDisputes();
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  return (
    <div id="dispute-center-panel" className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E8E6E1] pb-6">
        <div>
          <button
            onClick={onBackToDashboard}
            className="text-[10px] font-bold text-[#D12D2D] hover:text-[#B12525] flex items-center gap-1 mb-3 uppercase tracking-widest transition"
          >
            ← Back to General Dashboard
          </button>
          <h2 className="text-3xl font-serif italic text-[#1A1A1A] flex items-center gap-2">
            <Scale className="text-[#D12D2D] w-7 h-7" />
            <span>Dispute & Legal Shield Activations</span>
          </h2>
          <p className="text-slate-500 text-xs uppercase tracking-wider mt-2">
            Instantly invoke your LeaseGuardian retainer. We draft legal demand letters and alert assigned advocates.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Form Panel */}
        <div className="space-y-6">
          {activeContracts.length === 0 ? (
            <div className="bg-white border border-l-4 border-l-[#D12D2D] border-[#E8E6E1] rounded-none p-6 space-y-4">
              <div className="flex items-center gap-2 text-[#D12D2D] font-bold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>No Approved Retainers Found</span>
              </div>
              <p className="text-slate-600 text-xs font-serif leading-relaxed italic">
                You do not have any officially approved leases in your cabinet. Disputes can only be raised for properties currently locked under active <strong>MakaziShield Advocate Custody</strong>.
              </p>
              <button
                onClick={onBackToDashboard}
                className="w-full py-3 bg-[#1A1A1A] hover:bg-neutral-800 text-white hover:text-white font-bold text-xs uppercase tracking-widest rounded-none shadow transition cursor-pointer"
              >
                Onboard lease contract
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-none border border-[#E8E6E1] p-6 shadow-sm space-y-6">
              <h3 className="font-serif italic text-lg text-[#1A1A1A] border-b border-[#E8E6E1] pb-2">File Landlord Infringement</h3>
              <form onSubmit={handleActivateDispute} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Select Lease Location</label>
                  <select
                    value={selectedContractId}
                    onChange={(e) => setSelectedContractId(e.target.value)}
                    className="w-full px-4 py-3 rounded-none border border-[#E8E6E1] text-xs outline-none focus:border-[#D12D2D] bg-[#FDFCFB]"
                  >
                    {activeContracts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.apartmentName} (Wakili: {c.lawyerName})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Breach / Dispute Category</label>
                  <div className="grid grid-cols-2 gap-2 text-[9px] uppercase tracking-wider font-extrabold">
                    {[
                      { id: 'deposit_retention', label: 'Deposit Refund' },
                      { id: 'wrongful_eviction', label: 'Unfair Eviction' },
                      { id: 'repair_breach', label: 'Neglected Repairs' },
                      { id: 'other', label: 'Utility Locks' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setDisputeType(item.id as any)}
                        className={`py-2 px-2.5 rounded-none border text-left transition-all ${
                          disputeType === item.id
                            ? "border-[#D12D2D] bg-[#F7F5F2] text-[#D12D2D]"
                            : "border-[#E8E6E1] hover:border-slate-400 text-slate-500 bg-white cursor-pointer"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Provide Issue Details</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe exactly what happened (e.g., Landlord changed gate locks without notice, landlord refused to refund KES 90,000 deposit despite move-out report, etc.)"
                    rows={5}
                    required
                    className="w-full px-4 py-3 border border-[#E8E6E1] focus:border-[#D12D2D] rounded-none text-xs outline-none resize-none bg-[#FDFCFB]"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#D12D2D] hover:bg-[#B12525] disabled:bg-neutral-400 text-white font-bold text-xs uppercase tracking-widest rounded-none shadow transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Drafting legal demand...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Activate Shield & Draft Letter</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Active cases queue */}
          {disputes.length > 0 && (
            <div className="bg-white rounded-none border border-[#E8E6E1] p-5 shadow-sm space-y-4">
              <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Your Active Cases</h4>
              <div className="space-y-2">
                {disputes.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => setActiveDispute(d)}
                    className={`p-4 rounded-none border cursor-pointer transition-all ${
                      activeDispute?.id === d.id
                        ? "border-[#D12D2D] bg-[#F7F5F2]"
                        : "border-[#E8E6E1] bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-serif italic font-bold text-[#1A1A1A] capitalize">{d.disputeType.replace('_', ' ')}</span>
                      <span className="bg-red-50 text-[#D12D2D] border border-[#D12D2D]/30 font-extrabold text-[8px] px-2 py-0.5 rounded-none uppercase tracking-wider">
                        {d.status}
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono block mt-2 uppercase tracking-wider">
                      Case ID: {d.id.substring(0, 12).toUpperCase()}...
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Demand Letter Viewer */}
        <div className="lg:col-span-2">
          {activeDispute ? (
            <div className="bg-white rounded-none border border-[#E8E6E1] p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E6E1] pb-4">
                <div>
                  <h3 className="font-serif italic text-xl text-[#1A1A1A]">Legal Case File & Demand Letter</h3>
                  <div className="flex items-center gap-1.5 text-[9px] text-slate-400 uppercase tracking-wider mt-1.5 font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Filed: {activeDispute.activatedAt ? new Date(activeDispute.activatedAt).toLocaleDateString() : "Today"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(activeDispute.demandLetter)}
                    className="py-2.5 px-4 bg-white hover:bg-[#F7F5F2] text-slate-700 rounded-none border border-[#E8E6E1] shadow-sm transition uppercase tracking-widest text-[9px] font-bold cursor-pointer"
                    title="Copy demand letter"
                  >
                    {copied ? (
                      <span className="text-[10px] text-emerald-700 font-bold px-1 uppercase">Copied!</span>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Copy className="w-3.5 h-3.5 text-[#D12D2D]" />
                        <span>Copy Letter</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* Demand Letter Content Sheet */}
              <div className="bg-[#FDFCFB] p-8 rounded-none border border-[#E8E6E1] font-mono text-xs text-slate-800 leading-relaxed max-h-[500px] overflow-y-auto whitespace-pre-wrap shadow-inner border-t-4 border-t-[#D12D2D]">
                {activeDispute.demandLetter}
              </div>

              <div className="bg-emerald-50/20 border border-l-4 border-l-emerald-600 border-[#E8E6E1] rounded-none p-5 flex items-start gap-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-emerald-800 text-[10px] uppercase tracking-wider">Retainer Coverage active for this dispute</h4>
                  <p className="text-slate-600 text-xs font-serif italic leading-relaxed">
                    This document has been logged inside LeaseGuardian court filing gateway and dispatched to the landlord. Wakili Sharon Odhiambo has been notified and stands ready to represent you at the Rent Restriction Tribunal at no extra fee.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#F7F5F2] border border-dashed border-[#E8E6E1] rounded-none p-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-4 h-full min-h-[350px]">
              <Scale className="w-12 h-12 text-[#D12D2D]/50 animate-pulse" />
              <span className="font-serif italic text-[#1A1A1A]/80 text-base max-w-sm">Select an active dispute case file or complete the form on the left to activate LeaseGuardian legal shield representation.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
