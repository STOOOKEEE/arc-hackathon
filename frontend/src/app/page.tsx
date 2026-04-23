"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, ShieldCheck, ShieldAlert, CircleDollarSign, Loader2, Activity, Zap, Cpu } from "lucide-react";

type LogEntry = {
  id: number;
  agentId: string;
  action: string;
  status: "pending" | "402_PAYMENT" | "paid" | "approved" | "rejected";
  details?: string;
};

const RANDOM_ACTIONS = [
  "Purchase premium API data feed",
  "Bid 0.05 USDC on computation task",
  "Transfer 10 USDC to unknown wallet",
  "Scrape 100 pricing data points",
  "Buy storage on Filecoin network",
  "Swap 100 USDC for unregistered token",
  "Request code execution on remote server",
];

export default function Home() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalVerified, setTotalVerified] = useState(0);
  const [progress, setProgress] = useState(0);
  
  const logsEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  const addLog = (log: Omit<LogEntry, "id">) => {
    setLogs((prev) => [...prev, { ...log, id: Date.now() + Math.random() }]);
  };

  const updateLogStatus = (agentId: string, status: LogEntry["status"], details?: string) => {
    setLogs((prev) =>
      prev.map((l) => (l.agentId === agentId ? { ...l, status, details: details || l.details } : l))
    );
  };

  const simulateAgentTransaction = async (agentIndex: number) => {
    const agentId = `AGT-${agentIndex.toString().padStart(3, "0")}`;
    const action = RANDOM_ACTIONS[Math.floor(Math.random() * RANDOM_ACTIONS.length)];
    
    addLog({ agentId, action, status: "pending" });

    try {
      const payload = {
        userIntent: "Maximum budget is 0.1 USDC per action. Only allow data purchases, storage, or bids. Do not allow raw token swaps or transfers.",
        proposedAction: action,
        contractAddress: "0x1234567890123456789012345678901234567890",
        chainId: 42161,
        actionId: `0x${Math.random().toString(16).slice(2)}`,
        targetAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        amountWei: "50000000000000000",
      };

      let res = await fetch("http://localhost:3001/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 402) {
        updateLogStatus(agentId, "402_PAYMENT", "Received Invoice for 0.001 USDC");
        
        await new Promise((r) => setTimeout(r, 800)); 
        updateLogStatus(agentId, "paid", "Paid 0.001 USDC via Circle. Retrying...");
        setTotalSpent((prev) => prev + 0.001);

        res = await fetch("http://localhost:3001/api/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, circlePaymentToken: "tok_demo_paid_token" }),
        });
      }

      const data = await res.json();
      
      setTotalVerified((prev) => prev + 1);
      setProgress((prev) => Math.min(100, prev + (100 / 55)));

      if (data.status === "APPROVE") {
        updateLogStatus(agentId, "approved", `Gemini APPROVED. Signature: ${data.signature?.substring(0, 15)}...`);
      } else {
        updateLogStatus(agentId, "rejected", `Gemini REJECTED. Reason: ${data.reason}`);
      }

    } catch (error) {
      updateLogStatus(agentId, "rejected", "Network Error / Backend Offline");
    }
  };

  const startDemo = async () => {
    setIsRunning(true);
    setLogs([]);
    setTotalSpent(0);
    setTotalVerified(0);
    setProgress(0);

    for (let i = 1; i <= 55; i++) {
      simulateAgentTransaction(i);
      await new Promise((r) => setTimeout(r, 120)); 
    }
    
    setTimeout(() => setIsRunning(false), 5000);
  };

  return (
    <main className="min-h-screen bg-black text-white selection:bg-blue-500/30 overflow-hidden relative">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/10 rounded-xl border border-white/10 shadow-inner">
                <Cpu className="w-8 h-8 text-blue-400" />
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight">Micro<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Arbiter</span></h1>
            </div>
            <p className="text-neutral-400 font-medium">The Agentic Security Layer for High-Frequency Crypto-Commerce.</p>
            <div className="flex gap-2 mt-3">
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-neutral-300 font-mono flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> Arc L1</span>
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-neutral-300 font-mono">USDC Nanopayments</span>
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-neutral-300 font-mono">Gemini 1.5 Flash</span>
            </div>
          </motion.div>

          <motion.button 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startDemo} 
            disabled={isRunning}
            className="group relative flex items-center gap-3 bg-white text-black px-8 py-4 rounded-2xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(59,130,246,0.4)]"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-[100%] group-hover:animate-[shimmer_1.5s_infinite]" />
            {isRunning ? <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> : <Play className="w-5 h-5" fill="currentColor" />}
            <span className="relative z-10">{isRunning ? "Simulating Traffic..." : "Launch Demo (55 TXs)"}</span>
          </motion.button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-4 flex flex-col gap-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest">Network Stats</p>
                <Activity className="w-5 h-5 text-blue-400" />
              </div>
              
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-neutral-500 mb-1">Total Verified Actions</p>
                  <div className="flex items-end gap-2">
                    <span className="text-5xl font-black">{totalVerified}</span>
                    <span className="text-neutral-500 mb-1">/ 55</span>
                  </div>
                  <div className="w-full bg-white/10 h-2 rounded-full mt-3 overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-400" 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10">
                  <p className="text-sm text-neutral-500 mb-1">Arbitration Fees Collected</p>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-black text-green-400">{totalSpent.toFixed(3)}</span>
                    <span className="text-neutral-500 font-bold mb-1">USDC</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-blue-900/40 to-indigo-900/40 backdrop-blur-xl border border-blue-500/30 p-6 rounded-3xl relative overflow-hidden"
            >
              <Zap className="absolute top-[-20px] right-[-20px] w-32 h-32 text-blue-500/10 rotate-12" />
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <CircleDollarSign className="w-5 h-5 text-blue-400" />
                The Margin Explanation
              </h3>
              <p className="text-sm text-neutral-300 leading-relaxed font-medium">
                Charging exactly <strong className="text-white">0.001 USDC</strong> per AI verification is impossible on a standard Layer 2 (avg. gas ~$0.10). We would lose $0.099 on every API call.
              </p>
              <p className="text-sm text-blue-200 mt-4 leading-relaxed font-medium bg-blue-500/10 p-3 rounded-xl border border-blue-500/20">
                This high-frequency business model is strictly viable thanks to <strong>Arc&apos;s sub-cent, predictable fee structure</strong> and <strong>Circle Nanopayments</strong>.
              </p>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="lg:col-span-8 bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden flex flex-col h-[600px] shadow-2xl relative"
          >
            <div className="bg-white/5 border-b border-white/10 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <span className="text-xs font-mono text-neutral-500 ml-2">micro_arbiter_v1.0.sh</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-green-400/70">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                SYSTEM ONLINE
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 font-mono text-sm space-y-4">
              {logs.length === 0 && !isRunning && (
                <div className="h-full flex flex-col items-center justify-center text-neutral-600 opacity-50">
                  <Activity className="w-16 h-16 mb-4" />
                  <p>Awaiting transaction stream...</p>
                  <p className="text-xs mt-2">Press &quot;Launch Demo&quot; to begin</p>
                </div>
              )}
              
              <AnimatePresence initial={false}>
                {logs.map((log) => (
                  <motion.div 
                    key={log.id} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="group"
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-blue-400/80 shrink-0 select-none">[{log.agentId}]</span>
                      
                      <div className="flex-1 flex flex-col gap-1">
                        <span className="text-neutral-300 group-hover:text-white transition-colors">{log.action}</span>
                        
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          
                          {log.status === 'pending' && (
                            <span className="flex items-center gap-1.5 text-neutral-500 bg-white/5 px-2 py-0.5 rounded text-xs">
                              <Loader2 className="w-3 h-3 animate-spin" /> Analyzing Intent...
                            </span>
                          )}

                          {(log.status === '402_PAYMENT' || log.status === 'paid' || log.status === 'approved' || log.status === 'rejected') && (
                            <span className="flex items-center gap-1.5 text-yellow-500/90 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded text-xs">
                              <ShieldAlert className="w-3 h-3" /> HTTP 402: Verification Blocked
                            </span>
                          )}

                          {(log.status === 'paid' || log.status === 'approved' || log.status === 'rejected') && (
                            <span className="flex items-center gap-1.5 text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded text-xs">
                              <CircleDollarSign className="w-3 h-3" /> Paid $0.001 USDC
                            </span>
                          )}

                          {log.status === 'approved' && (
                            <span className="flex items-center gap-1.5 text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded text-xs shadow-[0_0_10px_rgba(74,222,128,0.2)]">
                              <ShieldCheck className="w-3 h-3" /> APPROVED
                            </span>
                          )}
                          
                          {log.status === 'rejected' && (
                            <span className="flex items-center gap-1.5 text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded text-xs shadow-[0_0_10px_rgba(248,113,113,0.2)]">
                              <ShieldAlert className="w-3 h-3" /> REJECTED
                            </span>
                          )}

                        </div>

                        {log.details && (
                          <div className={`mt-1 text-xs ${log.status === 'rejected' ? 'text-red-400/80' : 'text-neutral-500'}`}>
                            ↳ {log.details}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={logsEndRef} />
            </div>

            <div className="absolute top-[60px] left-0 w-full h-8 bg-gradient-to-b from-[#0a0a0a] to-transparent pointer-events-none" />
          </motion.div>

        </div>
      </div>
    </main>
  );
}