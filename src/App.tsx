import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  ShieldAlert,
  ShieldCheck,
  Scale,
  Award,
  Landmark,
  User,
  LayoutDashboard,
  FilePlus2,
  FileText,
  AlertTriangle,
  LineChart,
  HelpCircle,
  LogOut,
  Building,
  Users
} from "lucide-react";
import { Contract } from "./types";
import ContractUpload from "./components/ContractUpload";
import ContractAnalyzer from "./components/ContractAnalyzer";
import DisputeCenter from "./components/DisputeCenter";
import LawyerPortal from "./components/LawyerPortal";
import MarketAnalytics from "./components/MarketAnalytics";
import LandlordWorkspace from "./components/LandlordWorkspace";
import Login from "./components/Login";

export default function App() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'cabinet' | 'upload' | 'disputes' | 'lawyer' | 'landlord' | 'analytics'>('cabinet');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  
  // Real authentication session state
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    username: string;
    name: string;
    role: 'landlord' | 'tenant' | 'lawyer';
    firm?: string;
  } | null>(null);

  const [checkingSession, setCheckingSession] = useState(true);

  // Load saved session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("leaseguardian_user");
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        
        // Route to the role's default dashboard
        if (user.role === 'landlord') {
          setCurrentView('landlord');
        } else if (user.role === 'lawyer') {
          setCurrentView('lawyer');
        } else {
          setCurrentView('cabinet');
        }
      } catch (e) {
        console.error("Failed to parse saved user:", e);
      }
    }
    setCheckingSession(false);
  }, []);

  const fetchContracts = () => {
    setLoading(true);
    fetch("/api/contracts")
      .then((res) => res.json())
      .then((data) => {
        setContracts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching contracts:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (currentUser) {
      fetchContracts();
    }
  }, [currentUser]);

  const handleContractUploaded = (newContract: Contract) => {
    setContracts((prev) => [newContract, ...prev]);
    setSelectedContract(newContract);
    setCurrentView('cabinet');
  };

  const handleContractUpdated = (updatedContract: Contract) => {
    setContracts((prev) => prev.map((c) => (c.id === updatedContract.id ? updatedContract : c)));
    setSelectedContract(updatedContract);
  };

  const handleLoginSuccess = (user: { id: string; username: string; name: string; role: 'landlord' | 'tenant' | 'lawyer'; firm?: string }) => {
    setCurrentUser(user);
    localStorage.setItem("leaseguardian_user", JSON.stringify(user));
    
    // Set appropriate initial view
    if (user.role === 'landlord') {
      setCurrentView('landlord');
    } else if (user.role === 'lawyer') {
      setCurrentView('lawyer');
    } else {
      setCurrentView('cabinet');
    }
    setSelectedContract(null);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("leaseguardian_user");
    setSelectedContract(null);
    setCurrentView('cabinet');
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D12D2D]"></div>
      </div>
    );
  }

  // If not logged in, render the Login screen
  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] font-sans flex flex-col">
      {/* Top Session Ribbon */}
      <div className="bg-[#1A1A1A] border-b border-[#E8E6E1]/20 text-[#F7F5F2] py-2 px-6 flex items-center justify-between text-[10px] tracking-wider uppercase font-semibold">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Secure Custody Session Active</span>
        </div>
        <div className="font-mono text-[#F7F5F2]/60">
          Role: <span className="text-[#D12D2D] font-bold">{currentUser.role}</span> • User: {currentUser.username}
        </div>
      </div>

      {/* Main Header navigation */}
      <header className="bg-[#FDFCFB] border-b border-[#E8E6E1] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-baseline gap-1 cursor-pointer" onClick={() => {
            if (currentUser.role === 'landlord') setCurrentView('landlord');
            else if (currentUser.role === 'lawyer') setCurrentView('lawyer');
            else { setCurrentView('cabinet'); setSelectedContract(null); }
          }}>
            <span className="text-2xl font-serif font-bold tracking-tighter uppercase text-[#1A1A1A]">LeaseGuardian</span>
            <span className="w-2.5 h-2.5 bg-[#D12D2D] rounded-full"></span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 ml-2 border-l border-[#E8E6E1] pl-2 hidden sm:inline">MakaziShield</span>
          </div>

          {/* Navigation links based on role */}
          <nav className="hidden md:flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-slate-600">
            {currentUser.role === 'tenant' && (
              <>
                <button
                  onClick={() => {
                    setSelectedContract(null);
                    setCurrentView('cabinet');
                  }}
                  className={`transition-all pb-1 cursor-pointer flex items-center gap-1.5 ${
                    currentView === 'cabinet' && !selectedContract ? "text-[#D12D2D] border-b-2 border-[#D12D2D]" : "opacity-60 hover:opacity-100 border-b-2 border-transparent"
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>My Cabinet</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedContract(null);
                    setCurrentView('disputes');
                  }}
                  className={`transition-all pb-1 cursor-pointer flex items-center gap-1.5 ${
                    currentView === 'disputes' ? "text-[#D12D2D] border-b-2 border-[#D12D2D]" : "opacity-60 hover:opacity-100 border-b-2 border-transparent"
                  }`}
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Dispute Center</span>
                </button>
              </>
            )}

            {currentUser.role === 'lawyer' && (
              <button
                onClick={() => setCurrentView('lawyer')}
                className={`transition-all pb-1 cursor-pointer flex items-center gap-1.5 ${
                  currentView === 'lawyer' ? "text-[#D12D2D] border-b-2 border-[#D12D2D]" : "opacity-60 hover:opacity-100 border-b-2 border-transparent"
                }`}
              >
                <Landmark className="w-3.5 h-3.5" />
                <span>Advocate Portal</span>
              </button>
            )}

            {currentUser.role === 'landlord' && (
              <>
                <button
                  onClick={() => setCurrentView('landlord')}
                  className={`transition-all pb-1 cursor-pointer flex items-center gap-1.5 ${
                    currentView === 'landlord' ? "text-[#D12D2D] border-b-2 border-[#D12D2D]" : "opacity-60 hover:opacity-100 border-b-2 border-transparent"
                  }`}
                >
                  <Building className="w-3.5 h-3.5" />
                  <span>Registry Control</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedContract(null);
                    setCurrentView('cabinet');
                  }}
                  className={`transition-all pb-1 cursor-pointer flex items-center gap-1.5 ${
                    currentView === 'cabinet' && !selectedContract ? "text-[#D12D2D] border-b-2 border-[#D12D2D]" : "opacity-60 hover:opacity-100 border-b-2 border-transparent"
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>My Cabinet</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedContract(null);
                    setCurrentView('upload');
                  }}
                  className={`transition-all pb-1 cursor-pointer flex items-center gap-1.5 ${
                    currentView === 'upload' ? "text-[#D12D2D] border-b-2 border-[#D12D2D]" : "opacity-60 hover:opacity-100 border-b-2 border-transparent"
                  }`}
                >
                  <FilePlus2 className="w-3.5 h-3.5" />
                  <span>Audit Lease</span>
                </button>
              </>
            )}

            {/* Public Analytics view accessible to all roles */}
            <button
              onClick={() => {
                setSelectedContract(null);
                setCurrentView('analytics');
              }}
              className={`transition-all pb-1 cursor-pointer flex items-center gap-1.5 ${
                currentView === 'analytics' ? "text-[#D12D2D] border-b-2 border-[#D12D2D]" : "opacity-60 hover:opacity-100 border-b-2 border-transparent"
              }`}
            >
              <LineChart className="w-3.5 h-3.5" />
              <span>Market Analytics</span>
            </button>
          </nav>

          {/* User Profile and Sign Out */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-serif font-bold text-slate-800 line-clamp-1">{currentUser.name}</span>
              <span className="text-[8px] uppercase tracking-wider text-slate-400 font-extrabold">{currentUser.role} Account</span>
            </div>
            
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#E8E6E1] hover:border-red-300 hover:text-[#D12D2D] hover:bg-red-50 text-[10px] font-bold uppercase tracking-widest transition cursor-pointer rounded-none"
              title="Sign out of system secure vault"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile navigation bar */}
      <div className="md:hidden border-b border-[#E8E6E1] bg-[#FDFCFB] px-4 py-2 flex items-center justify-around text-[9px] uppercase tracking-widest font-bold text-slate-500">
        {currentUser.role === 'tenant' && (
          <>
            <button
              onClick={() => { setSelectedContract(null); setCurrentView('cabinet'); }}
              className={currentView === 'cabinet' ? "text-[#D12D2D]" : ""}
            >
              Cabinet
            </button>
            <button
              onClick={() => { setSelectedContract(null); setCurrentView('disputes'); }}
              className={currentView === 'disputes' ? "text-[#D12D2D]" : ""}
            >
              Disputes
            </button>
          </>
        )}
        {currentUser.role === 'lawyer' && (
          <button
            onClick={() => setCurrentView('lawyer')}
            className={currentView === 'lawyer' ? "text-[#D12D2D]" : ""}
          >
            Advocate Portal
          </button>
        )}
        {currentUser.role === 'landlord' && (
          <>
            <button
              onClick={() => setCurrentView('landlord')}
              className={currentView === 'landlord' ? "text-[#D12D2D]" : ""}
            >
              Registry
            </button>
            <button
              onClick={() => { setSelectedContract(null); setCurrentView('cabinet'); }}
              className={currentView === 'cabinet' ? "text-[#D12D2D]" : ""}
            >
              Cabinet
            </button>
            <button
              onClick={() => { setSelectedContract(null); setCurrentView('upload'); }}
              className={currentView === 'upload' ? "text-[#D12D2D]" : ""}
            >
              Audit
            </button>
          </>
        )}
        <button
          onClick={() => { setSelectedContract(null); setCurrentView('analytics'); }}
          className={currentView === 'analytics' ? "text-[#D12D2D]" : ""}
        >
          Analytics
        </button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8">
        
        {/* LANDLORD WORKSPACE VIEW */}
        {currentUser.role === 'landlord' && currentView === 'landlord' && (
          <LandlordWorkspace contracts={contracts} onRefreshContracts={fetchContracts} />
        )}

        {/* LAWYER PORTAL VIEW */}
        {currentUser.role === 'lawyer' && currentView === 'lawyer' && (
          <LawyerPortal currentUser={currentUser} />
        )}

        {/* COMPONENT DESKTOP & MOBILE VIEWS */}
        {selectedContract ? (
          /* 1. Selected Contract Analyzer View for Tenant or Landlord */
          <ContractAnalyzer
            contract={selectedContract}
            onSelectAnother={() => setSelectedContract(null)}
            onActivateDispute={() => {
              if (currentUser.role === 'tenant') {
                setCurrentView('disputes');
              } else {
                setCurrentView('landlord');
              }
              setSelectedContract(null);
            }}
            onUpdateContract={handleContractUpdated}
          />
        ) : currentView === 'upload' && currentUser.role === 'landlord' ? (
          /* 2. Onboarding Upload View - Exclusively for Landlords */
          <ContractUpload onUploadSuccess={handleContractUploaded} currentUser={currentUser} />
        ) : currentView === 'disputes' && currentUser.role === 'tenant' ? (
          /* 3. Dispute Center View - Exclusively for Tenants */
          <DisputeCenter contracts={contracts} onBackToDashboard={() => setCurrentView('cabinet')} />
        ) : currentView === 'cabinet' && (currentUser.role === 'tenant' || currentUser.role === 'landlord') ? (
          /* 4. Cabinet View - Shared by Tenants and Landlords */
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E8E6E1] pb-6">
              <div>
                <h2 className="text-4xl font-serif italic text-[#1A1A1A]">
                  {currentUser.role === 'landlord' ? "My Landlord Cabinet" : "My Safe-Tenancy Cabinet"}
                </h2>
                <p className="text-slate-500 text-xs uppercase tracking-widest mt-2 font-semibold">
                  {currentUser.role === 'landlord' 
                    ? "Your registered lease contracts protected under active MakaziShield advocate custody."
                    : "Your registered lease contracts protected under active MakaziShield advocate custody."}
                </p>
              </div>
              {currentUser.role === 'landlord' && (
                <button
                  onClick={() => setCurrentView('upload')}
                  className="inline-flex items-center gap-1.5 bg-[#D12D2D] hover:bg-[#B12525] text-white font-bold text-xs uppercase tracking-widest py-3 px-6 rounded-none shadow-sm transition cursor-pointer"
                >
                  <FilePlus2 className="w-4 h-4" />
                  <span>Audit New Lease</span>
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center p-12 h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D12D2D]"></div>
              </div>
            ) : contracts.length === 0 ? (
              <div className="bg-white rounded-none border border-[#E8E6E1] p-12 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-4">
                <FileText className="w-12 h-12 text-[#D12D2D]/60" />
                <p className="font-serif italic text-xl text-[#1A1A1A]">Your lease cabinet is empty.</p>
                <p className="text-slate-500 text-xs max-w-sm mx-auto leading-relaxed font-semibold">
                  {currentUser.role === 'landlord'
                    ? "Audit or upload your first tenancy contract to establish lifetime retainer support under a local legal advocate."
                    : "Audit your first tenancy contract to establish lifetime retainer support under a local legal advocate at no additional cost."}
                </p>
                {currentUser.role === 'landlord' && (
                  <button
                    onClick={() => setCurrentView('upload')}
                    className="mt-2 py-3 px-6 bg-[#1A1A1A] hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-widest rounded-none shadow transition cursor-pointer"
                  >
                    Audit Tenancy Agreement
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {contracts.map((contract) => (
                  <motion.div
                    key={contract.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setSelectedContract(contract)}
                    className="bg-white border border-[#E8E6E1] rounded-none p-6 hover:border-[#D12D2D] transition-all cursor-pointer flex flex-col justify-between h-64 shadow-sm"
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-serif italic text-xl text-[#1A1A1A] line-clamp-1">{contract.apartmentName}</h3>
                          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                            {currentUser.role === 'landlord' ? `Tenant: ${contract.tenantName}` : `Landlord: ${contract.landlordName}`}
                          </span>
                        </div>
                        <span className={`px-2.5 py-0.5 border text-[9px] font-bold uppercase tracking-wider rounded-none ${
                          contract.riskLevel === 'High' 
                            ? 'bg-red-50 text-[#D12D2D] border-[#D12D2D]' 
                            : contract.riskLevel === 'Medium'
                            ? 'bg-amber-50 text-amber-700 border-amber-500/30'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-500/30'
                        }`}>
                          {contract.riskLevel}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs font-mono text-slate-700">
                        <div className="bg-[#F7F5F2] p-3 rounded-none border border-[#E8E6E1]/60">
                          <span className="text-[9px] text-slate-400 uppercase tracking-widest block mb-1 font-bold">Rent</span>
                          <span className="font-bold text-[#1A1A1A]">KES {contract.monthlyRent.toLocaleString()}</span>
                        </div>
                        <div className="bg-[#F7F5F2] p-3 rounded-none border border-[#E8E6E1]/60">
                          <span className="text-[9px] text-slate-400 uppercase tracking-widest block mb-1 font-bold">Deposit</span>
                          <span className="font-bold text-[#1A1A1A]">KES {contract.depositAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-[#E8E6E1] pt-4 mt-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-serif italic text-base border ${
                          contract.fairnessScore >= 70 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300" 
                            : "bg-red-50 text-[#D12D2D] border-[#D12D2D]/30"
                        }`}>
                          {contract.fairnessScore}
                        </div>
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold">Fairness Score</span>
                      </div>

                      {contract.status === "approved" && contract.smsStatus === "accepted" ? (
                        <span className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-[9px] uppercase tracking-wider font-extrabold px-2.5 py-1">
                          🛡️ Shield Active
                        </span>
                      ) : (
                        <span className="bg-[#F7F5F2] border border-[#E8E6E1] text-slate-500 text-[9px] uppercase tracking-wider font-bold px-2.5 py-1">
                          Awaiting Approval
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {/* PUBLIC MARKET ANALYTICS PANEL */}
        {currentView === 'analytics' && <MarketAnalytics />}
      </main>

      {/* Footer credits and information */}
      <footer className="bg-[#FDFCFB] border-t border-[#E8E6E1] py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-[9px] uppercase tracking-widest text-[#1A1A1A]/50 font-semibold">
          <div className="flex items-center gap-2">
            <Landmark className="w-4 h-4 text-slate-400" />
            <span>LEGAL PROTECTION FUND • KENYA RENT RESTRICTION ACT COMPLIANT SYSTEM 2.0</span>
          </div>
          <div className="flex gap-6">
            <span className="hover:text-[#D12D2D] transition-colors cursor-pointer">Cap 296</span>
            <span className="hover:text-[#D12D2D] transition-colors cursor-pointer">Cap 293</span>
            <span className="hover:text-[#D12D2D] transition-colors cursor-pointer">© 2026 LEASEGUARDIAN PLATFORM</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
