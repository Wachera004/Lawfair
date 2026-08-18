import React, { useState } from "react";
import { motion } from "motion/react";
import { FileUp, ClipboardCopy, FileText, AlertTriangle, HelpCircle, Landmark } from "lucide-react";

interface ContractUploadProps {
  onUploadSuccess: (contract: any) => void;
  currentUser?: {
    id: string;
    username: string;
    name: string;
    role: 'landlord' | 'tenant' | 'lawyer';
    firm?: string;
  } | null;
}

const TEMPLATE_LEASES = [
  {
    name: "Draft A: Extreme Landlord Lockout Clause",
    rent: 35000,
    deposit: 70000,
    apartment: "Roysambu Greens, Block C",
    landlord: "Njoroge Githongo",
    text: `TENANCY AGREEMENT
This agreement is made between Njoroge Githongo (Landlord) and the Tenant.
1. Rent is KES 35,000 per month payable on the 1st of every month.
2. The Tenant shall pay a security deposit of KES 70,000.
3. If rent is delayed by more than three (3) days, the landlord is fully authorized to immediately lock the tenant's doors, cut water and electricity, and seize any electronic goods, furniture, or assets within the house and auction them to recover arrears without requiring any court notice or licensed auctioneer.
4. The landlord may enter the apartment at any time, day or night, without warning, to inspect the premises.`
  },
  {
    name: "Draft B: Non-Refundable Triple Deposit Demand",
    rent: 50000,
    deposit: 150000,
    apartment: "Lavington Garden Villas, Apt 2",
    landlord: "Wanjiku Mwangi",
    text: `TENANCY CONTRACT
This contract is signed between Wanjiku Mwangi (Landlord) and the Tenant.
1. Monthly Rent: KES 50,000.
2. Security Deposit: KES 150,000 (three months' rent equivalent).
3. Under no circumstances is the security deposit refundable. Upon termination or expiry of this lease, the deposit of KES 150,000 shall be forfeited to the landlord automatically as liquidation for wear, tear, and general vacancy restoration fee.
4. The tenant must vacate the premises immediately upon 2 days' notice if the landlord wishes to remodel the premises, without any recourse to court or tribunals.`
  },
  {
    name: "Rasimu C: Mkataba wa Kiswahili (Amana na Kufunga)",
    rent: 25000,
    deposit: 75000,
    apartment: "Madaraka Palms, Ghorofa ya 3",
    landlord: "Joseph Kamau",
    text: `MKATABA WA UPANGAJI WA NYUMBA
Mkataba huu unafanywa kati ya Joseph Kamau (Mwenye Nyumba) na Mpangaji.
1. Kodi ya nyumba ni KES 25,000 kila mwezi, inayolipwa kufikia tarehe 1 ya kila mwezi.
2. Mpangaji atalipa amana (security deposit) ya KES 75,000 kabla ya kuhamia.
3. Mwenye nyumba ana haki ya kufunga mlango wa nyumba, kukata maji na umeme, na kutaifisha mali zote za ndani kama vile runinga, viti, au vyombo ili kulipia deni la kodi ikiwa kodi imecheleweshwa kwa zaidi ya siku tano (5) bila kutoa notisi yoyote au kuhitaji amri ya mahakama.
4. Mwenye nyumba au mawakala wake wanaweza kuingia katika nyumba wakati wowote mchana au usiku bila taarifa yoyote ili kukagua au kufanya matengenezo.`
  }
];

export default function ContractUpload({ onUploadSuccess, currentUser }: ContractUploadProps) {
  const [tenantName, setTenantName] = useState("");
  const [landlordName, setLandlordName] = useState(
    currentUser?.role === 'landlord' ? currentUser.name : ""
  );
  const [landlordPhone, setLandlordPhone] = useState("+254712345678");
  const [apartmentName, setApartmentName] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const applyTemplate = (tpl: typeof TEMPLATE_LEASES[0]) => {
    setLandlordName(tpl.landlord);
    setApartmentName(tpl.apartment);
    setMonthlyRent(tpl.rent.toString());
    setDepositAmount(tpl.deposit.toString());
    setFileContent(tpl.text);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFileContent(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFileContent(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!tenantName.trim()) return setError("Please enter the tenant's full name.");
    if (!landlordName.trim()) return setError("Please enter the landlord's full name.");
    if (!apartmentName.trim()) return setError("Please enter the apartment or estate name.");
    if (!monthlyRent || Number(monthlyRent) <= 0) return setError("Please enter a valid monthly rent amount.");
    if (!depositAmount || Number(depositAmount) < 0) return setError("Please enter a valid security deposit amount.");

    setLoading(true);

    fetch("/api/contracts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantName,
        landlordName,
        landlordPhone,
        apartmentName,
        monthlyRent: Number(monthlyRent),
        depositAmount: Number(depositAmount),
        fileContent: fileContent || undefined
      })
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to analyze contract.");
        }
        return res.json();
      })
      .then((data) => {
        setLoading(false);
        onUploadSuccess(data);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || "Something went wrong during the analysis.");
        setLoading(false);
      });
  };

  return (
    <div id="contract-upload-panel" className="bg-white rounded-none border border-[#E8E6E1] p-8 shadow-sm">
      <div className="border-b border-[#E8E6E1] pb-6 mb-8">
        <h2 className="text-3xl font-serif italic text-[#1A1A1A] flex items-center gap-2">
          <Landmark className="text-[#D12D2D] w-6 h-6" />
          <span>Onboard a New Tenancy Agreement</span>
        </h2>
        <p className="text-slate-500 text-xs uppercase tracking-wider mt-2">
          Upload your rental contract below. Our AI pre-screens for Kenyan Rent Restriction compliance, which a panel advocate then stamps for lifetime retainership representation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Forms column */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Tenant Name</label>
              <input
                type="text"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                placeholder="e.g. Chèrabelle Edith"
                required
                className="w-full px-4 py-3 rounded-none border border-[#E8E6E1] focus:border-[#D12D2D] focus:ring-0 text-sm outline-none transition bg-[#FDFCFB]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Landlord Name</label>
              <input
                type="text"
                value={landlordName}
                onChange={(e) => setLandlordName(e.target.value)}
                placeholder="e.g. Mwangi Kuria"
                required
                className="w-full px-4 py-3 rounded-none border border-[#E8E6E1] focus:border-[#D12D2D] focus:ring-0 text-sm outline-none transition bg-[#FDFCFB]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Landlord Phone (for SMS/WA)</label>
              <input
                type="text"
                value={landlordPhone}
                onChange={(e) => setLandlordPhone(e.target.value)}
                placeholder="e.g. +254712345678"
                className="w-full px-4 py-3 rounded-none border border-[#E8E6E1] focus:border-[#D12D2D] focus:ring-0 text-sm outline-none transition bg-[#FDFCFB]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Apartment/Estate Name</label>
              <input
                type="text"
                value={apartmentName}
                onChange={(e) => setApartmentName(e.target.value)}
                placeholder="e.g. Ridgeview Heights, Apt 4B"
                required
                className="w-full px-4 py-3 rounded-none border border-[#E8E6E1] focus:border-[#D12D2D] focus:ring-0 text-sm outline-none transition bg-[#FDFCFB]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Monthly Rent (KES)</label>
              <input
                type="number"
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(e.target.value)}
                placeholder="e.g. 45000"
                required
                className="w-full px-4 py-3 rounded-none border border-[#E8E6E1] focus:border-[#D12D2D] focus:ring-0 font-mono text-sm outline-none transition bg-[#FDFCFB]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Security Deposit (KES)</label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="e.g. 90000"
                required
                className="w-full px-4 py-3 rounded-none border border-[#E8E6E1] focus:border-[#D12D2D] focus:ring-0 font-mono text-sm outline-none transition bg-[#FDFCFB]"
              />
            </div>
          </div>

          {/* Drag & Drop File Container */}
          <div className="space-y-2">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Lease Agreement Text (Optional)</label>
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border border-dashed rounded-none p-6 text-center transition flex flex-col items-center justify-center min-h-[140px] cursor-pointer ${
                dragActive ? "border-[#D12D2D] bg-[#F7F5F2]" : "border-[#E8E6E1] bg-[#FDFCFB] hover:border-slate-400"
              }`}
            >
              <FileUp className="w-8 h-8 text-[#D12D2D]/60 mb-2" />
              <p className="text-xs text-slate-600 font-medium">
                Drag and drop your tenancy PDF/TXT contract file here, or{" "}
                <label className="text-[#D12D2D] font-bold hover:underline cursor-pointer">
                  browse local files
                  <input type="file" accept=".txt,.pdf" onChange={handleFileInput} className="hidden" />
                </label>
              </p>
              <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Plain Text (.txt) or PDF files are accepted.</p>
            </div>
          </div>

          {/* Copy Paste Text area if file is not dropped */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <ClipboardCopy className="w-3.5 h-3.5" />
                <span>Or Paste Lease Terms Below</span>
              </label>
              {fileContent && (
                <button
                  type="button"
                  onClick={() => setFileContent("")}
                  className="text-slate-400 hover:text-[#D12D2D] text-[10px] font-bold uppercase tracking-wider"
                >
                  Clear pasted text
                </button>
              )}
            </div>
            <textarea
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
              placeholder="e.g. Paste specific clauses or the full tenancy agreement content here..."
              rows={4}
              className="w-full px-4 py-3 rounded-none border border-[#E8E6E1] focus:border-[#D12D2D] focus:ring-0 text-sm outline-none transition resize-none font-mono text-xs bg-[#FDFCFB]"
            ></textarea>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-none text-[#D12D2D] text-xs flex items-center gap-2 font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#D12D2D] hover:bg-[#B12525] disabled:bg-neutral-400 text-white font-bold text-xs uppercase tracking-[0.2em] rounded-none shadow transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Analyzing with Kenyan Citation Engine...</span>
              </>
            ) : (
              <span>Submit & Run AI Compliance Review</span>
            )}
          </button>
        </form>

        {/* Right column: Pre-loaded Demo templates */}
        <div className="space-y-6">
          <div className="bg-[#F7F5F2] rounded-none border border-[#E8E6E1] p-6 space-y-4">
            <h3 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-1">
              <FileText className="w-4 h-4 text-[#D12D2D]" />
              <span>Select High-Arrears Demo Contracts</span>
            </h3>
            <p className="text-slate-500 text-xs leading-relaxed font-serif italic">
              Don't have a copy of a contract handy? Click one of the standard Nairobi tenant dispute templates below to auto-populate the details and run AI pre-screen auditing.
            </p>

            <div className="space-y-3">
              {TEMPLATE_LEASES.map((tpl, i) => (
                <div
                  key={i}
                  onClick={() => applyTemplate(tpl)}
                  className="bg-white p-4 rounded-none border border-[#E8E6E1] hover:border-[#D12D2D] hover:shadow-sm cursor-pointer transition-all space-y-2"
                >
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">{tpl.name}</h4>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                    <span>Rent: KES {tpl.rent.toLocaleString()}</span>
                    <span>•</span>
                    <span>Deposit: KES {tpl.deposit.toLocaleString()}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 italic font-serif">
                    "{tpl.text}"
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border-l-4 border-l-[#D12D2D] border border-[#E8E6E1] rounded-none p-5 space-y-2">
            <h4 className="text-xs font-bold text-[#D12D2D] uppercase tracking-widest flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Did you know?</span>
            </h4>
            <p className="text-slate-600 text-xs leading-relaxed font-serif italic">
              Section 13 of the <strong>Rent Restriction Act of Kenya</strong> renders any residential security deposit exceeding two months' rent legally void. However, nearly 42% of estate agents in Nairobi routinely demand three months' security.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
