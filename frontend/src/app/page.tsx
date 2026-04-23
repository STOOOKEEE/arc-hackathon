"use client";

import { useState, useRef, useEffect } from "react";
import { Play, ShieldCheck, ShieldAlert, CircleDollarSign, Loader2, Activity } from "lucide-react";

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
  "Transfer 10 USDC to unknown wallet", // Malicious
  "Scrape 100 pricing data points",
  "Buy storage on Filecoin network",
  "Swap 100 USDC for unregistered token", // Malicious
];

export default function Home() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalVerified, setTotalVerified] = useState(0);
  
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
    const agentId = `AGENT-${agentIndex.toString().padStart(3, "0")}`;
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

      // 1. Initial Request -> Expect 402 Payment Required
      let res = await fetch("http://localhost:3001/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 402) {
        updateLogStatus(agentId, "402_PAYMENT", "Received Invoice for 0.001 USDC");
        
        // Simulating the agent paying the invoice via Circle Nanopayments...
        await new Promise((r) => setTimeout(r, 600)); 
        updateLogStatus(agentId, "paid", "Paid 0.001 USDC. Retrying verification...");
        setTotalSpent((prev) => prev + 0.001);

        // 2. Retry with Payment Token
        res = await fetch("http://localhost:3001/api/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, circlePaymentToken: "tok_demo_paid_token" }),
        });
      }

      const data = await res.json();
      
      setTotalVerified((prev) => prev + 1);

      if (data.status === "APPROVE") {
        updateLogStatus(agentId, "approved", `Gemini APPROVED. Signature: ${data.signature.substring(0, 15)}...`);
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

    // Launch 55 transactions rapidly to hit the 50+ criteria for the hackathon
    for (let i = 1; i <= 55; i++) {
      simulateAgentTransaction(i);
      // Wait a tiny bit between starting agents to simulate parallel high-frequency traffic
      await new Promise((r) => setTimeout(r, 150)); 
    }
    
    // Give it a moment to finish pending transactions
    setTimeout(() => setIsRunning(false), 5000);
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-200 p-8 font-mono">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex items-center justify-between border-b border-neutral-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tighter">Micro-Arbiter <span className="text-blue-500">Live Demo</span></h1>
            <p className="text-neutral-400 mt-2 text-sm">Powered by Gemini 1.5 Flash & Circle Nanopayments on Arc L1</p>
          </div>
          <button 
            onClick={startDemo} 
            disabled={isRunning}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white px-6 py-3 rounded-lg font-semibold transition-all"
          >
            {isRunning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
            <span>{isRunning ? "Agents Running..." : "Launch 50+ Agents"}</span>
          </button>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-400 uppercase tracking-wider">Arbitration Fees Collected</p>
              <p className="text-3xl font-bold text-white mt-1">{totalSpent.toFixed(3)} <span className="text-sm text-blue-400">USDC</span></p>
            </div>
            <CircleDollarSign className="w-10 h-10 text-blue-500 opacity-50" />
          </div>
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-400 uppercase tracking-wider">Transactions Verified</p>
              <p className="text-3xl font-bold text-white mt-1">{totalVerified} <span className="text-sm text-green-400">/ 55</span></p>
            </div>
            <Activity className="w-10 h-10 text-green-500 opacity-50" />
          </div>
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl flex flex-col justify-center">
            <p className="text-sm text-neutral-400 uppercase tracking-wider mb-2">The Margin Explanation</p>
            <p className="text-xs text-neutral-500 leading-relaxed">
              If we charged <span className="text-white">0.001 USDC</span> per AI verification on a traditional L2 (where gas is ~$0.10), we would lose $0.099 per transaction. This business model is ONLY viable thanks to Arc's gas-free, sub-cent environment.
            </p>
          </div>
        </div>

        {/* Live Feed */}
        <div className="bg-black border border-neutral-800 rounded-xl overflow-hidden flex flex-col h-[500px]">
          <div className="bg-neutral-900 px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-300">Live Agent Verification Feed</h2>
            <div className="flex space-x-2">
              <span className="flex h-3 w-3 rounded-full bg-red-500"></span>
              <span className="flex h-3 w-3 rounded-full bg-yellow-500"></span>
              <span className="flex h-3 w-3 rounded-full bg-green-500"></span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {logs.length === 0 && !isRunning && (
              <div className="h-full flex items-center justify-center text-neutral-600 text-sm">
                Click "Launch 50+ Agents" to begin the high-frequency test.
              </div>
            )}
            {logs.map((log) => (
              <div key={log.id} className="text-sm flex flex-col border-b border-neutral-900 pb-2">
                <div className="flex items-center space-x-3">
                  <span className="text-purple-400 font-bold w-24">[{log.agentId}]</span>
                  <span className="text-neutral-300 flex-1 truncate">{log.action}</span>
                  
                  {/* Status Badge */}
                  <span className={`px-2 py-1 rounded text-xs font-semibold flex items-center space-x-1
                    ${log.status === 'pending' ? 'bg-neutral-800 text-neutral-400' : ''}
                    ${log.status === '402_PAYMENT' ? 'bg-yellow-900/50 text-yellow-500' : ''}
                    ${log.status === 'paid' ? 'bg-blue-900/50 text-blue-400' : ''}
                    ${log.status === 'approved' ? 'bg-green-900/50 text-green-400' : ''}
                    ${log.status === 'rejected' ? 'bg-red-900/50 text-red-400' : ''}
                  `}>
                    {log.status === 'pending' && <Loader2 className="w-3 h-3 animate-spin" />}
                    {log.status === '402_PAYMENT' && <CircleDollarSign className="w-3 h-3" />}
                    {log.status === 'paid' && <CircleDollarSign className="w-3 h-3" />}
                    {log.status === 'approved' && <ShieldCheck className="w-3 h-3" />}
                    {log.status === 'rejected' && <ShieldAlert className="w-3 h-3" />}
                    <span className="uppercase">{log.status.replace("_", " ")}</span>
                  </span>
                </div>
                {log.details && (
                  <div className={`mt-1 ml-28 text-xs ${log.status === 'rejected' ? 'text-red-500' : 'text-neutral-500'}`}>
                    ↳ {log.details}
                  </div>
                )}
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>

      </div>
    </main>
  );
}