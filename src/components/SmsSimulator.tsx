import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Smartphone, Send, Clock, User, CheckCircle2, XCircle, AlertCircle, RefreshCw } from "lucide-react";

interface SmsLog {
  id: string;
  contractId: string;
  phone: string;
  direction: 'outbound' | 'inbound';
  message: string;
  timestamp: string;
}

interface SmsSimulatorProps {
  contractId: string;
  landlordName: string;
  landlordPhone: string;
  onStatusChange: () => void;
}

export default function SmsSimulator({ contractId, landlordName, landlordPhone, onStatusChange }: SmsSimulatorProps) {
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const fetchLogs = () => {
    setLoading(true);
    fetch(`/api/sms-logs/${contractId}`)
      .then((res) => res.json())
      .then((data) => {
        setLogs(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLogs();
  }, [contractId]);

  const sendSimulatedSms = () => {
    setLoading(true);
    fetch(`/api/contracts/${contractId}/send-sms`, {
      method: "POST",
    })
      .then((res) => res.json())
      .then(() => {
        fetchLogs();
      })
      .catch((err) => console.error(err));
  };

  const handleLandlordReply = (text: "YES" | "NO") => {
    setSendingReply(true);
    fetch(`/api/contracts/${contractId}/landlord-respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ responseText: text }),
    })
      .then((res) => res.json())
      .then(() => {
        setSendingReply(false);
        fetchLogs();
        onStatusChange();
      })
      .catch((err) => {
        console.error(err);
        setSendingReply(false);
      });
  };

  return (
    <div id="sms-simulator-panel" className="bg-slate-50 rounded-2xl border border-slate-150 p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h3 className="text-lg font-bold font-display text-slate-800 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-indigo-600" />
            <span>Asymmetric Landlord SMS Gateway</span>
          </h3>
          <p className="text-slate-500 text-xs mt-1">
            Simulates plain-language SMS legal binding over Africa's Talking API for offline/informal landlords.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="inline-flex items-center gap-1 text-slate-500 hover:text-indigo-600 font-semibold text-xs py-1 px-2.5 rounded bg-white border border-slate-200 shadow-sm transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh SMS Gateway</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Phone Simulator UI */}
        <div className="flex flex-col items-center justify-center py-4">
          <div className="relative w-full max-w-[320px] h-[580px] bg-slate-900 rounded-[40px] shadow-2xl border-[12px] border-slate-800 flex flex-col overflow-hidden ring-4 ring-indigo-500/10">
            {/* Phone Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-20 flex items-center justify-center">
              <div className="w-12 h-1.5 bg-slate-900 rounded-full mb-1"></div>
            </div>

            {/* Phone Screen Header */}
            <div className="bg-slate-800 pt-8 pb-3 px-6 text-center text-white z-10 border-b border-slate-700">
              <div className="font-bold text-xs flex items-center justify-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span>{landlordName || "Landlord"}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">{landlordPhone || "+254700000000"}</div>
            </div>

            {/* Chat/Sms Message Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-950 space-y-3 flex flex-col justify-end text-xs">
              <AnimatePresence initial={false}>
                {logs.length === 0 ? (
                  <div className="text-slate-500 text-center py-12 flex flex-col items-center gap-2">
                    <AlertCircle className="w-8 h-8 text-slate-600" />
                    <span>No active SMS messages. Click "Send Plain Language Summary" to start.</span>
                  </div>
                ) : (
                  logs.map((log) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className={`max-w-[85%] rounded-2xl px-3 py-2.5 space-y-1 ${
                        log.direction === "outbound"
                          ? "bg-slate-800 text-slate-100 self-start rounded-tl-none"
                          : "bg-indigo-600 text-white self-end rounded-tr-none"
                      }`}
                    >
                      <p className="leading-relaxed whitespace-pre-wrap">{log.message}</p>
                      <div className="flex items-center justify-end gap-1 text-[9px] text-slate-400">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* Quick Action Simulated Responses */}
            <div className="bg-slate-900 p-4 border-t border-slate-800 flex gap-2">
              <button
                onClick={() => handleLandlordReply("YES")}
                disabled={sendingReply || logs.length === 0 || logs[logs.length - 1].direction === "inbound"}
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition disabled:opacity-50"
              >
                Reply YES
              </button>
              <button
                onClick={() => handleLandlordReply("NO")}
                disabled={sendingReply || logs.length === 0 || logs[logs.length - 1].direction === "inbound"}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition disabled:opacity-50"
              >
                Reply NO
              </button>
            </div>

            {/* Home indicator bar */}
            <div className="h-6 bg-slate-900 flex items-center justify-center">
              <div className="w-24 h-1 bg-slate-700 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Right Column: SMS Control Center */}
        <div className="space-y-5 flex flex-col justify-center">
          <div className="bg-white rounded-2xl border border-slate-150 p-5 space-y-4 shadow-sm">
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">SMS Control Dashboard</h4>
            <p className="text-slate-600 text-xs leading-relaxed">
              Lease Guardian ensures formal lease protection is accessible even to informal landlords who do not use smart devices or apps.
              We draft an immediate visual SMS summary with the core legally binding points (rent, deposit, dispute waiver) and send it.
            </p>

            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-2">
              <div className="flex items-center gap-2 text-indigo-700 font-semibold text-xs">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                <span>Simulated Africa's Talking API Status</span>
              </div>
              <p className="text-slate-500 text-xs">
                Active Sandbox: Outbound SMS notifications compile dynamically, bridging off-grid landlords directly into modern escrow and legal retainers.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={sendSimulatedSms}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm py-2.5 px-4 rounded-xl shadow transition disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>Send Plain Language Summary SMS</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-150 p-5 space-y-3 shadow-sm">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Smartphone className="w-4.5 h-4.5 text-slate-400" />
              <span>How To Test this Flow:</span>
            </h4>
            <ol className="list-decimal pl-4 space-y-2 text-slate-500 text-xs">
              <li>Click <strong className="text-indigo-600">"Send Plain Language Summary SMS"</strong> above to send the analyzed contract terms from LeaseGuardian to the Landlord's phone.</li>
              <li>Observe the summary message appearing inside the phone simulator.</li>
              <li>Click <strong className="text-emerald-600">"Reply YES"</strong> inside the phone simulator. This triggers a webhook representing the landlord accepting the terms on their local phone.</li>
              <li>The LeaseGuardian contract state will immediately update to <strong className="text-emerald-600">Approved & Accepted</strong>.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
