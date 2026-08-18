import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Users,
  UserPlus,
  Trash2,
  Briefcase,
  FileText,
  Building,
  RefreshCw,
  Plus,
  CheckCircle,
  AlertTriangle,
  Scale
} from "lucide-react";
import { Contract } from "../types";

interface UserItem {
  id: string;
  username: string;
  name: string;
  role: 'landlord' | 'tenant' | 'lawyer';
  firm?: string;
}

interface LandlordWorkspaceProps {
  contracts: Contract[];
  onRefreshContracts: () => void;
}

export default function LandlordWorkspace({ contracts, onRefreshContracts }: LandlordWorkspaceProps) {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'leases'>('users');
  
  // Add User Form State
  const [role, setRole] = useState<'tenant' | 'lawyer'>('tenant');
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [firm, setFirm] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchUsers = () => {
    setLoadingUsers(true);
    fetch("/api/users")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch users");
        return res.json();
      })
      .then((data) => {
        setUsers(data);
        setLoadingUsers(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Could not retrieve system users list.");
        setLoadingUsers(false);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!username || !password || !fullName) {
      setError("Please fill out all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          name: fullName,
          role,
          ...(role === "lawyer" ? { firm } : {})
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add user.");
      }

      setSuccess(`Successfully registered ${role === 'lawyer' ? 'Advocate' : 'Tenant'} "${fullName}"! They can now log in.`);
      setUsername("");
      setPassword("");
      setFullName("");
      setFirm("");
      fetchUsers();
    } catch (err: any) {
      setError(err.message || "Failed to register user.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(`Are you absolutely sure you want to remove user "${userName}"? They will lose login access instantly.`)) {
      return;
    }

    setError("");
    setSuccess("");
    setDeletingId(userId);

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE"
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete user.");
      }

      setSuccess(`Successfully removed user "${userName}" from the system.`);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || "Failed to remove user.");
    } finally {
      setDeletingId(null);
    }
  };

  // Stats calculation
  const totalTenants = users.filter((u) => u.role === "tenant").length;
  const totalLawyers = users.filter((u) => u.role === "lawyer").length;
  const pendingLeasesCount = contracts.filter((c) => c.status === "pending_review").length;
  const activeShieldCount = contracts.filter((c) => c.status === "approved" && c.smsStatus === "accepted").length;

  return (
    <div id="landlord-workspace-panel" className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#E8E6E1] pb-6 gap-4">
        <div>
          <h2 className="text-3xl font-serif italic text-[#1A1A1A] flex items-center gap-2">
            <Building className="text-[#D12D2D] w-7 h-7" />
            <span>Landlord Registry Control</span>
          </h2>
          <p className="text-slate-500 text-xs uppercase tracking-wider mt-2">
            Add or remove registry access for tenants and advocates, and monitor safe-tenancy leases.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2 bg-red-50 border border-[#D12D2D]/30 px-4 py-2 rounded-none text-[9px] uppercase tracking-widest text-[#D12D2D] font-bold">
          <Building className="w-4 h-4 text-[#D12D2D]" />
          <span>Mwangi Kuria, Esq. (Landlord Admin)</span>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-none border border-[#E8E6E1] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Registered Tenants</span>
            <div className="bg-[#F7F5F2] text-[#D12D2D] border border-[#E8E6E1] p-2">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-6 flex items-baseline gap-2">
            <span className="text-4xl font-serif italic text-[#1A1A1A]">{totalTenants}</span>
            <span className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold">Active Profiles</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-none border border-[#E8E6E1] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Retainer Advocates</span>
            <div className="bg-[#F7F5F2] text-[#D12D2D] border border-[#E8E6E1] p-2">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-6 flex items-baseline gap-2">
            <span className="text-4xl font-serif italic text-[#1A1A1A]">{totalLawyers}</span>
            <span className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold">Verified Counsel</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-none border border-[#E8E6E1] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Leases Pending Review</span>
            <div className="bg-[#F7F5F2] text-amber-700 border border-[#E8E6E1] p-2">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-6 flex items-baseline gap-2">
            <span className="text-4xl font-serif italic text-amber-700">{pendingLeasesCount}</span>
            <span className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold">Wakili Queue</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-none border border-[#E8E6E1] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Shield Active Leases</span>
            <div className="bg-[#F7F5F2] text-emerald-700 border border-[#E8E6E1] p-2">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-6 flex items-baseline gap-2">
            <span className="text-4xl font-serif italic text-emerald-700">{activeShieldCount}</span>
            <span className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold">Active Protection</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E8E6E1] text-xs uppercase tracking-widest font-bold">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-4 border-b-2 transition cursor-pointer ${
            activeTab === 'users' ? "border-[#D12D2D] text-[#D12D2D]" : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          User Registry ({users.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('leases');
            onRefreshContracts();
          }}
          className={`pb-3 px-4 border-b-2 transition cursor-pointer ${
            activeTab === 'leases' ? "border-[#D12D2D] text-[#D12D2D]" : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          All Managed Leases ({contracts.length})
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-red-50 border border-[#D12D2D]/30 text-[#D12D2D] text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Content Area */}
      {activeTab === 'users' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Panel */}
          <div className="bg-white border border-[#E8E6E1] p-6 rounded-none space-y-6">
            <h3 className="font-serif italic text-lg text-[#1A1A1A] border-b border-[#E8E6E1] pb-2 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#D12D2D]" />
              <span>Register New Member</span>
            </h3>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Select Account Role</label>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-bold uppercase tracking-wider">
                  <button
                    type="button"
                    onClick={() => setRole('tenant')}
                    className={`py-2 px-3 text-center transition ${
                      role === 'tenant'
                        ? "bg-[#1A1A1A] text-white"
                        : "bg-white border border-[#E8E6E1] text-slate-500 hover:border-slate-400 cursor-pointer"
                    }`}
                  >
                    Tenant
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('lawyer')}
                    className={`py-2 px-3 text-center transition ${
                      role === 'lawyer'
                        ? "bg-[#1A1A1A] text-white"
                        : "bg-white border border-[#E8E6E1] text-slate-500 hover:border-slate-400 cursor-pointer"
                    }`}
                  >
                    Advocate (Wakili)
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder={role === 'lawyer' ? "e.g. Wakili Evans Kamau" : "e.g. Brian Omondi"}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#E8E6E1] bg-[#FDFCFB] text-xs outline-none focus:border-[#D12D2D] rounded-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Username (Login ID)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. brian_omondi"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#E8E6E1] bg-[#FDFCFB] text-xs outline-none focus:border-[#D12D2D] rounded-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#E8E6E1] bg-[#FDFCFB] text-xs outline-none focus:border-[#D12D2D] rounded-none"
                />
              </div>

              {role === 'lawyer' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Law Firm / Chambers Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Kamau & Co. Advocates"
                    value={firm}
                    onChange={(e) => setFirm(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#E8E6E1] bg-[#FDFCFB] text-xs outline-none focus:border-[#D12D2D] rounded-none"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-[#D12D2D] hover:bg-[#B12525] text-white font-bold text-xs uppercase tracking-widest rounded-none shadow transition cursor-pointer mt-2"
              >
                {submitting ? "Registering..." : `Register New ${role === 'lawyer' ? 'Advocate' : 'Tenant'}`}
              </button>
            </form>
          </div>

          {/* Directory Queue Panel */}
          <div className="lg:col-span-2 bg-white border border-[#E8E6E1] p-6 rounded-none space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E6E1] pb-2">
              <h3 className="font-serif italic text-lg text-[#1A1A1A]">Registered Registry Directory</h3>
              <button
                onClick={fetchUsers}
                className="p-1.5 hover:bg-[#F7F5F2] border border-[#E8E6E1] text-slate-600 rounded-none transition"
                title="Refresh user registry list"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {loadingUsers ? (
              <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#D12D2D]"></div>
              </div>
            ) : users.length === 0 ? (
              <p className="text-center text-slate-400 py-12 text-xs font-serif italic">No registry profiles set up yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#E8E6E1] text-slate-400 font-bold text-[9px] uppercase tracking-widest">
                      <th className="py-3 px-3">Full Name</th>
                      <th className="py-3 px-3">Username</th>
                      <th className="py-3 px-3">Role</th>
                      <th className="py-3 px-3">Associated Details</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E6E1]">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-[#F7F5F2]/50 transition">
                        <td className="py-3.5 px-3 font-serif font-bold text-slate-800 text-sm">{user.name}</td>
                        <td className="py-3.5 px-3 font-mono text-slate-600 text-xs">{user.username}</td>
                        <td className="py-3.5 px-3">
                          <span className={`inline-block px-2 py-0.5 text-[8px] font-bold rounded-none uppercase tracking-wider border ${
                            user.role === 'landlord'
                              ? 'bg-neutral-900 text-white border-neutral-900'
                              : user.role === 'lawyer'
                              ? 'bg-red-50 text-[#D12D2D] border-[#D12D2D]/30'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-slate-500 font-serif italic text-xs">
                          {user.role === 'lawyer' ? user.firm || "Independent Chambers" : user.role === 'landlord' ? "Primary System Admin" : "Registered Tenant"}
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          {user.role !== 'landlord' ? (
                            <button
                              onClick={() => handleDeleteUser(user.id, user.name)}
                              disabled={deletingId === user.id}
                              className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-[#D12D2D] border border-transparent hover:border-[#D12D2D]/20 transition rounded-none cursor-pointer"
                              title="Revoke system access instantly"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest px-1">Protected</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Leases Tab */
        <div className="bg-white border border-[#E8E6E1] p-6 rounded-none space-y-4">
          <div className="flex items-center justify-between border-b border-[#E8E6E1] pb-2">
            <h3 className="font-serif italic text-lg text-[#1A1A1A]">Lease Agreement Registry Overview</h3>
            <span className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">Total monitored: {contracts.length}</span>
          </div>

          {contracts.length === 0 ? (
            <p className="text-center text-slate-400 py-12 text-xs font-serif italic">No tenants have uploaded lease contracts yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E8E6E1] text-slate-400 font-bold text-[9px] uppercase tracking-widest">
                    <th className="py-3 px-3">Apartment / Unit</th>
                    <th className="py-3 px-3">Tenant</th>
                    <th className="py-3 px-3">Rent (KES)</th>
                    <th className="py-3 px-3">Deposit (KES)</th>
                    <th className="py-3 px-3">AI Fairness Score</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Legal Advocate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E6E1]">
                  {contracts.map((contract) => (
                    <tr key={contract.id} className="hover:bg-[#F7F5F2]/50 transition">
                      <td className="py-4 px-3 font-serif font-bold text-[#1A1A1A] text-sm">{contract.apartmentName}</td>
                      <td className="py-4 px-3 text-slate-700 font-bold">{contract.tenantName}</td>
                      <td className="py-4 px-3 font-mono text-slate-700 text-xs">KES {contract.monthlyRent.toLocaleString()}</td>
                      <td className="py-4 px-3 font-mono text-slate-700 text-xs">KES {contract.depositAmount.toLocaleString()}</td>
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-8 h-8 rounded-full border flex items-center justify-center font-serif italic text-xs font-bold ${
                            contract.fairnessScore >= 70
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                              : "bg-red-50 text-[#D12D2D] border-[#D12D2D]/30"
                          }`}>
                            {contract.fairnessScore}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                            ({contract.riskLevel} Risk)
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-3">
                        <span className={`px-2 py-0.5 text-[8px] font-bold rounded-none uppercase tracking-wider border ${
                          contract.status === "approved" && contract.smsStatus === "accepted"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                            : contract.status === "approved"
                            ? "bg-emerald-50/50 text-emerald-600 border-emerald-200"
                            : contract.status === "pending_review"
                            ? "bg-amber-50 text-amber-700 border-amber-300"
                            : "bg-red-50 text-[#D12D2D] border-[#D12D2D]/20"
                        }`}>
                          {contract.status === "approved" && contract.smsStatus === "accepted" ? "🛡️ Shield Active" : contract.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-slate-500 font-serif italic text-xs">
                        {contract.lawyerName || "Awaiting Assignment"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
