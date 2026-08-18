import React, { useState } from "react";
import { motion } from "motion/react";
import {
  ShieldAlert,
  User,
  Scale,
  Building,
  Key,
  ChevronRight,
  AlertTriangle
} from "lucide-react";

interface LoginProps {
  onLoginSuccess: (user: { id: string; username: string; name: string; role: 'landlord' | 'tenant' | 'lawyer'; firm?: string }) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message || "Invalid username or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoUsername: string) => {
    setUsername(demoUsername);
    setPassword("password");
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: demoUsername, password: "password" })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-container" className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] font-sans flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 bg-white border border-[#E8E6E1] shadow-xl overflow-hidden">
        
        {/* Left column: Brand and Info */}
        <div className="bg-[#1A1A1A] text-[#FDFCFB] p-8 md:p-12 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#E8E6E1]/10">
          <div className="space-y-6">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-serif font-bold tracking-tighter uppercase text-white">LeaseGuardian</span>
              <span className="w-2.5 h-2.5 bg-[#D12D2D] rounded-full"></span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 ml-2 border-l border-[#E8E6E1]/20 pl-2">MakaziShield</span>
            </div>

            <div className="space-y-4 pt-8">
              <h1 className="text-3xl font-serif italic text-white leading-tight">
                Empowering safe tenancies under Kenyan Law.
              </h1>
              <p className="text-neutral-400 text-xs leading-relaxed font-serif italic">
                A civic-tech advocacy platform combining real-time AI clause analysis with instant advocate retainer custody to protect tenants from illegal eviction, rent distress, and arbitrary deposit withholdings.
              </p>
            </div>
          </div>

          <div className="pt-12 md:pt-0 space-y-3">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-neutral-400">
              <ShieldAlert className="w-4 h-4 text-[#D12D2D]" />
              <span>Advocate Retainer Active Protection</span>
            </div>
            <p className="text-[10px] text-neutral-500 uppercase tracking-wider leading-relaxed">
              Rent Restriction Act (Cap 296) • Distress for Rent Act (Cap 293) • Constitution of Kenya 2010 Article 31
            </p>
          </div>
        </div>

        {/* Right column: Login form */}
        <div className="p-8 md:p-12 flex flex-col justify-center space-y-8 bg-white">
          <div className="space-y-2">
            <h2 className="text-2xl font-serif font-bold text-[#1A1A1A]">Secure Portal Access</h2>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">
              Sign in to manage your tenancy files or retainers
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-[#D12D2D]/30 text-[#D12D2D] text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Username</span>
              </label>
              <input
                type="text"
                required
                placeholder="Enter your registry username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2.5 border border-[#E8E6E1] bg-[#FDFCFB] text-xs outline-none focus:border-[#D12D2D] rounded-none font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-slate-400" />
                <span>Password</span>
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-[#E8E6E1] bg-[#FDFCFB] text-xs outline-none focus:border-[#D12D2D] rounded-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#D12D2D] hover:bg-[#B12525] text-white font-bold text-xs uppercase tracking-widest rounded-none shadow transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{loading ? "Authenticating Secure Session..." : "Access Secured Cabinet"}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick-fill Demo Accounts (Evaluator Shortcuts) */}
          <div className="border-t border-[#E8E6E1] pt-6 space-y-4">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
              Quick-Fill Test Credentials
            </span>
            
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("landlord")}
                className="flex items-center justify-between p-3 border border-[#E8E6E1] hover:border-[#D12D2D]/40 bg-[#FDFCFB] hover:bg-[#F7F5F2] transition text-left text-xs cursor-pointer rounded-none group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-[#1A1A1A] text-white">
                    <Building className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-serif font-bold text-slate-800 block">Mwangi Kuria (Landlord)</span>
                    <span className="text-[9px] text-slate-400 font-mono">User: landlord / Pass: password</span>
                  </div>
                </div>
                <span className="text-[9px] font-bold text-[#D12D2D] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition">Login →</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("tenant")}
                className="flex items-center justify-between p-3 border border-[#E8E6E1] hover:border-[#D12D2D]/40 bg-[#FDFCFB] hover:bg-[#F7F5F2] transition text-left text-xs cursor-pointer rounded-none group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-serif font-bold text-slate-800 block">Chèrabelle Edith (Tenant)</span>
                    <span className="text-[9px] text-slate-400 font-mono">User: tenant / Pass: password</span>
                  </div>
                </div>
                <span className="text-[9px] font-bold text-[#D12D2D] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition">Login →</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("lawyer")}
                className="flex items-center justify-between p-3 border border-[#E8E6E1] hover:border-[#D12D2D]/40 bg-[#FDFCFB] hover:bg-[#F7F5F2] transition text-left text-xs cursor-pointer rounded-none group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-red-50 text-[#D12D2D] border border-[#D12D2D]/20">
                    <Scale className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-serif font-bold text-slate-800 block">Wakili Sharon Odhiambo (Advocate)</span>
                    <span className="text-[9px] text-slate-400 font-mono">User: lawyer / Pass: password</span>
                  </div>
                </div>
                <span className="text-[9px] font-bold text-[#D12D2D] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition">Login →</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
