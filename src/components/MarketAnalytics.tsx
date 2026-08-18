import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { MapPin, AlertTriangle, ShieldCheck, TrendingDown, Landmark, FileText, Info } from "lucide-react";
import { MarketStat } from "../types";

export default function MarketAnalytics() {
  const [stats, setStats] = useState<MarketStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/market-stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Calculate Aggregates
  const totalLeasesAnalyzed = stats.reduce((acc, curr) => acc + curr.totalContracts, 0);
  const averageNairobiScore = Math.round(stats.reduce((acc, curr) => acc + curr.averageScore, 0) / stats.length);
  const avgNonRefundablePct = Math.round(stats.reduce((acc, curr) => acc + curr.nonRefundableDepositPct, 0) / stats.length);

  return (
    <div id="market-analytics-panel" className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between border-b border-[#E8E6E1] pb-6 gap-4">
        <div>
          <h2 className="text-3xl font-serif italic text-[#1A1A1A]">Nairobi Rental Market Analytics</h2>
          <p className="text-slate-500 mt-2 text-xs uppercase tracking-wider">
            Civic-tech data tracking landlord compliance, illegal clauses, and tenant fairness metrics.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2 bg-red-50 border border-[#D12D2D]/30 px-4 py-2 rounded-none text-[9px] uppercase tracking-widest text-[#D12D2D] font-bold">
          <Landmark className="w-4 h-4 text-[#D12D2D]" />
          <span>Nairobi Consumer Advocacy Active</span>
        </div>
      </div>

      {/* Bento Grid Aggregates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-none border border-[#E8E6E1] shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Leases Monitored</span>
            <div className="bg-[#F7F5F2] text-[#D12D2D] border border-[#E8E6E1] p-2">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-6">
            <span className="text-4xl font-serif italic text-[#1A1A1A]">{totalLeasesAnalyzed}</span>
            <span className="text-neutral-700 text-[8px] font-bold uppercase tracking-wider ml-2 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-none inline-flex items-center">
              +12% monthly
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-3 font-serif italic">Active tenancy registries across Nairobi county.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-none border border-[#E8E6E1] shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Avg Tenancy Fairness</span>
            <div className="bg-[#F7F5F2] text-[#D12D2D] border border-[#E8E6E1] p-2">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-6">
            <span className={`text-4xl font-serif italic ${averageNairobiScore < 60 ? "text-amber-700" : "text-emerald-700"}`}>
              {averageNairobiScore}/100
            </span>
            <span className="text-slate-500 text-[9px] uppercase tracking-wider block mt-2 font-bold">Sub-optimal fairness average</span>
          </div>
          <p className="text-slate-500 text-xs mt-2 font-serif italic">Reflects frequency of landlord-slanted legal wording.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-none border border-[#E8E6E1] shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Non-Refundable Deposits</span>
            <div className="bg-[#F7F5F2] text-[#D12D2D] border border-[#E8E6E1] p-2">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-6">
            <span className="text-4xl font-serif italic text-[#D12D2D]">{avgNonRefundablePct}%</span>
            <span className="text-[#D12D2D] text-[8px] font-bold uppercase tracking-wider ml-2 bg-red-50 border border-[#D12D2D]/30 px-2 py-0.5 rounded-none inline-flex items-center">
              ⚠️ Highly Illegal
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-3 font-serif italic">Contracts containing automatic security deposit forfeiture clauses.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-none border border-[#E8E6E1] shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Rent Restriction Breaches</span>
            <div className="bg-[#F7F5F2] text-[#D12D2D] border border-[#E8E6E1] p-2">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-6">
            <span className="text-4xl font-serif italic text-slate-800">42.4%</span>
            <span className="text-indigo-900 text-[8px] font-bold uppercase tracking-wider block mt-2">Contracts demanding &gt; 2 mo deposit</span>
          </div>
          <p className="text-slate-500 text-xs mt-2 font-serif italic">Direct violation of Section 13 of the Rent Restriction Act.</p>
        </motion.div>
      </div>

      {/* Nairobi Neighborhood Analysis */}
      <div className="bg-white rounded-none border border-[#E8E6E1] p-6 shadow-sm">
        <h3 className="text-xl font-serif italic text-[#1A1A1A] mb-6 flex items-center gap-2 border-b border-[#E8E6E1] pb-3">
          <MapPin className="w-5 h-5 text-[#D12D2D]" />
          <span>Nairobi Geographic Hotspots & Rent Compliance</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E8E6E1] text-slate-400 font-bold text-[9px] uppercase tracking-widest">
                <th className="py-4 px-4">Sub-County / Neighborhood</th>
                <th className="py-4 px-4">Fairness Rating</th>
                <th className="py-4 px-4">Illegal Deposit Clauses</th>
                <th className="py-4 px-4">Avg Deposit Demand</th>
                <th className="py-4 px-4 text-right">Sample Leases</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E6E1]">
              {stats.map((stat, idx) => (
                <tr key={idx} className="hover:bg-[#F7F5F2]/50 transition">
                  <td className="py-4 px-4 font-serif italic font-bold text-slate-800 text-sm">{stat.neighborhood}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-neutral-100 h-1.5 rounded-none overflow-hidden border border-neutral-200">
                        <div
                          className={`h-full rounded-none ${
                            stat.averageScore > 75 
                              ? "bg-emerald-600" 
                              : stat.averageScore > 60 
                              ? "bg-amber-600" 
                              : "bg-[#D12D2D]"
                          }`}
                          style={{ width: `${stat.averageScore}%` }}
                        ></div>
                      </div>
                      <span className={`font-mono text-xs font-bold ${
                        stat.averageScore > 75 
                          ? "text-emerald-700" 
                          : stat.averageScore > 60 
                          ? "text-amber-700" 
                          : "text-[#D12D2D]"
                      }`}>{stat.averageScore}/100</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-none border text-[9px] uppercase tracking-wider font-bold ${
                      stat.nonRefundableDepositPct > 60
                        ? "bg-red-50 text-[#D12D2D] border-[#D12D2D]/30"
                        : stat.nonRefundableDepositPct > 40
                        ? "bg-amber-50 text-amber-700 border-amber-500/30"
                        : "bg-emerald-50 text-emerald-700 border-emerald-300/30"
                    }`}>
                      {stat.nonRefundableDepositPct}% of leases
                    </span>
                  </td>
                  <td className="py-4 px-4 font-mono text-slate-600 text-xs">
                    {stat.averageDepositMonths} months rent
                  </td>
                  <td className="py-4 px-4 text-right font-bold text-slate-500 font-mono">{stat.totalContracts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Civic Tech Education Banner */}
      <div className="bg-[#1A1A1A] text-[#FDFCFB] rounded-none p-8 shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-l-4 border-l-[#D12D2D]">
        <div className="space-y-2 max-w-2xl">
          <h4 className="text-lg font-serif italic flex items-center gap-2 text-white">
            <Info className="w-5 h-5 text-[#D12D2D]" />
            <span>Know Your Tenancy Rights under the Laws of Kenya</span>
          </h4>
          <p className="text-neutral-400 text-xs font-serif italic leading-relaxed">
            Many landlords exploit tenants by adding non-refundable fees, locking gates during rent arrears, and demanding 3-month security deposits. Under Kenyan law, including the <strong>Rent Restriction Act (Cap 296)</strong>, <strong>Distress for Rent Act (Cap 293)</strong>, and <strong>Land Registration Act 2012</strong>, these clauses are void. LeaseGuardian gathers this aggregate data to lobby for tenant protection bills in the Nairobi County Assembly.
          </p>
        </div>
        <div className="bg-white hover:bg-neutral-100 text-[#1A1A1A] px-5 py-3 border border-transparent rounded-none transition cursor-pointer text-[10px] font-bold uppercase tracking-widest shrink-0 text-center">
          Download Nairobi Tenant Bill of Rights
        </div>
      </div>
    </div>
  );
}
