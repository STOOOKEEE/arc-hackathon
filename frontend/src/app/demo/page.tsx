"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Loader2 } from "lucide-react";

// --- Types & Constants ---
type AgentStatus = "idle" | "intent_submit" | "402_req" | "circle_paid" | "gemini_verify" | "approved" | "rejected";

type Agent = {
  id: string;
  status: AgentStatus;
  action: string;
  gasUsed?: string;
  signature?: string;
  reason?: string;
};

type LogEntry = {
  id: number;
  time: string;
  agentId: string;
  text: string;
  type: "info" | "warn" | "success" | "error";
};

const RANDOM_ACTIONS = [
  "REQ_DATA_FEED_API",
  "BID_COMPUTE_TASK",
  "TX_UNKNOWN_WALLET", // Malicious trigger
  "SCRAPE_PRICE_DATA",
  "BUY_STORAGE_FILECOIN",
  "SWAP_UNREG_TOKEN", // Malicious trigger
];

const INITIAL_AGENTS: Agent[] = Array.from({ length: 55 }).map((_, i) => ({
  id: `AG-${(i + 1).toString().padStart(2, "0")}`,
  status: "idle",
  action: "",
}));

// --- Helper Functions ---
const getFormattedTime = () => {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}.${Math.floor(d.getMilliseconds() / 100)}`;
};

export default function Home() {
  // --- State ---
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [focusedAgentId, setFocusedAgentId] = useState<string>("AG-13"); // Default focus
  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useState({ load: 12.4, throughput: 0, active: 0 });
  const [chartData, setChartData] = useState<number[]>(Array(15).fill(20));

  const logsEndRef = useRef<HTMLDivElement>(null);
  
  // Automatically scroll ledger
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Simulating random chart fluctuations
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setChartData(prev => {
        const newData = [...prev.slice(1), Math.max(10, Math.min(100, prev[prev.length - 1] + (Math.random() * 40 - 20)))];
        return newData;
      });
      setStats(prev => ({
        ...prev,
        load: Math.min(99.9, prev.load + (Math.random() * 5 - 2)),
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  // --- Handlers ---
  const addLog = useCallback((agentId: string, text: string, type: LogEntry["type"] = "info") => {
    setLogs((prev) => [...prev, { id: Date.now() + Math.random(), time: getFormattedTime(), agentId, text, type }]);
  }, []);

  const updateAgent = useCallback((id: string, updates: Partial<Agent>) => {
    setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  }, []);

  const processAgent = async (agent: Agent) => {
    const action = RANDOM_ACTIONS[Math.floor(Math.random() * RANDOM_ACTIONS.length)];
    updateAgent(agent.id, { status: "intent_submit", action });
    addLog(agent.id, `INTENT_SUBMIT -> ${action}`, "info");
    
    // Focus randomly to show telemetry
    if (Math.random() > 0.7) setFocusedAgentId(agent.id);

    try {
      const payload = {
        userIntent: "Max 0.1 USDC. Allow data, storage, compute bids. Reject raw token transfers/swaps.",
        proposedAction: action,
        contractAddress: "0xNAVA_NODE_PRIME",
        chainId: 42161,
        actionId: `0x${Math.random().toString(16).slice(2)}`,
        targetAddress: "0xEXT_PROTOCOL",
        amountWei: "1000000000000000", // 0.001
      };

      // 1. Submit to API (Expect 402)
      await new Promise(r => setTimeout(r, 400 + Math.random() * 400));
      let res = await fetch("http://localhost:3001/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 402) {
        updateAgent(agent.id, { status: "402_req" });
        addLog(agent.id, "HTTP_402_PAYMENT_REQ", "warn");
        
        // Simulating Circle Payment via mock Token
        await new Promise(r => setTimeout(r, 800 + Math.random() * 500));
        updateAgent(agent.id, { status: "circle_paid", gasUsed: "0.00000002 ETH" });
        addLog(agent.id, "CIRCLE_NANO_PAID (0.001)", "info");

        // 2. Retry with Payment
        updateAgent(agent.id, { status: "gemini_verify" });
        addLog(agent.id, "GEMINI_AI_VERIFY_START", "info");
        
        res = await fetch("http://localhost:3001/api/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, circlePaymentToken: "tok_demo_paid" }),
        });
      }

      const data = await res.json();
      await new Promise(r => setTimeout(r, 300)); // UI delay

      if (data.status === "APPROVE") {
        updateAgent(agent.id, { status: "approved", signature: data.signature?.substring(0, 16) });
        addLog(agent.id, "L1_SIG_CONFIRMED -> APPROVED", "success");
      } else {
        updateAgent(agent.id, { status: "rejected", reason: data.reason });
        addLog(agent.id, "GEMINI_VERIFY_FAIL -> REJECTED", "error");
      }

      setStats(prev => ({ ...prev, throughput: prev.throughput + 1 }));

    } catch (error) {
      updateAgent(agent.id, { status: "rejected", reason: "NODE_OFFLINE" });
      addLog(agent.id, "SYS_ERR -> NODE_OFFLINE", "error");
    }
  };

  const startSwarm = async () => {
    setIsRunning(true);
    setLogs([]);
    setAgents(INITIAL_AGENTS);
    setStats({ load: 84.2, throughput: 0, active: 55 });

    // Staggered launch
    for (const agent of INITIAL_AGENTS) {
      processAgent(agent);
      await new Promise((r) => setTimeout(r, 50 + Math.random() * 150));
    }
    
    // Check for completion
    const checkInterval = setInterval(() => {
      setAgents(curr => {
        const active = curr.filter(a => a.status !== "idle" && a.status !== "approved" && a.status !== "rejected").length;
        setStats(s => ({ ...s, active }));
        if (active === 0) {
          setIsRunning(false);
          clearInterval(checkInterval);
        }
        return curr;
      });
    }, 1000);
  };

  // --- Render Helpers ---
  const focusedAgent = agents.find((a) => a.id === focusedAgentId) || agents[0];

  const getAgentColorClass = (status: AgentStatus) => {
    switch (status) {
      case "idle": return "border-[#1e293b] text-[#334155]"; // Dim slate
      case "intent_submit": 
      case "gemini_verify": return "border-[#2dd4bf] text-[#2dd4bf] shadow-[0_0_8px_rgba(45,212,191,0.4)]"; // Bright Teal Glow
      case "402_req": 
      case "circle_paid": return "border-[#fb923c] text-[#fb923c] shadow-[0_0_8px_rgba(251,146,60,0.4)]"; // Orange Glow
      case "approved": return "bg-[#0f766e] border-[#2dd4bf] text-white"; // Solid Teal
      case "rejected": return "bg-[#7f1d1d] border-[#f87171] text-white"; // Solid Red
      default: return "border-[#1e293b] text-[#334155]";
    }
  };

  return (
    <>
      <div className="scanlines" />
      <main className="h-screen w-screen overflow-hidden p-4 md:p-8 flex flex-col uppercase tracking-wider text-[10px] sm:text-xs">
        
        {/* TOP HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-[#1e293b] pb-4 mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#2dd4bf] tracking-widest flex items-center gap-2">
              <span className="text-[#334155]">[</span> NAVA-ARC <span className="text-[#334155]">]</span>
            </h1>
            <div className="flex flex-col gap-1 mt-1">
              <span className="text-[#64748b]">MICRO-ARBITER SEC-VERIFICATION // V2.4.1</span>
              {/* Margin Explanation hidden in plain sight as system text */}
              <span className="text-[#fb923c]/80 text-[9px]">SYS_NOTE: L2_GAS_COST &gt; $0.10. MICRO_FEE_MODEL REQUIRES ARC L1 FOR POSITIVE YIELD.</span>
            </div>
          </div>
          
          <div className="flex items-end gap-8 mt-4 md:mt-0 text-right">
            <div>
              <div className="text-[#64748b] mb-1">NETWORK LOAD</div>
              <div className="text-xl text-[#2dd4bf]">{stats.load.toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-[#64748b] mb-1">THROUGHPUT (TX/S)</div>
              <div className="text-xl text-[#2dd4bf]">{stats.throughput}</div>
            </div>
            <div>
              <div className="text-[#64748b] mb-1">ACTIVE AGENTS</div>
              <div className="text-xl text-[#2dd4bf]">{stats.active}</div>
            </div>
            <button 
              onClick={startSwarm}
              disabled={isRunning}
              className="bg-transparent border border-[#2dd4bf] text-[#2dd4bf] px-4 py-2 hover:bg-[#2dd4bf]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" fill="currentColor" />}
              EXECUTE_SWARM
            </button>
          </div>
        </header>

        {/* 3 COLUMN GRID */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
          
          {/* COLUMN 1: SWARM STATUS MATRIX */}
          <section className="lg:col-span-4 border border-[#1e293b] flex flex-col min-h-0">
            <div className="flex justify-between items-center border-b border-[#1e293b] p-3 text-[#2dd4bf]">
              <span>[ SWARM_STATUS_MATRIX ]</span>
              <span className="text-[#64748b]">OP: {isRunning ? "LIVE" : "STANDBY"}</span>
            </div>
            <div className="p-4 grid grid-cols-4 sm:grid-cols-5 gap-3 overflow-y-auto">
              {agents.map((agent) => (
                <div 
                  key={agent.id}
                  onClick={() => setFocusedAgentId(agent.id)}
                  className={`
                    border px-1 py-2 text-center cursor-pointer transition-all duration-300
                    ${getAgentColorClass(agent.status)}
                    ${focusedAgentId === agent.id ? "ring-2 ring-white/50" : ""}
                  `}
                >
                  {agent.id}
                </div>
              ))}
            </div>
          </section>

          {/* COLUMN 2: TX PIPELINE TELEMETRY */}
          <section className="lg:col-span-4 border border-[#1e293b] flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-center border-b border-[#1e293b] p-3 text-[#2dd4bf]">
              <span>[ TX_PIPELINE_TELEMETRY ]</span>
              <span className="text-[#64748b]">FOCUS: {focusedAgent.id}</span>
            </div>
            
            <div className="flex-1 p-6 relative">
              {/* Vertical Line Connector */}
              <div className="absolute left-[39px] top-10 bottom-10 w-px bg-[#1e293b] -z-10" />

              <div className="space-y-8">
                
                {/* Step 1: Submit */}
                <div className={`flex gap-6 items-start ${focusedAgent.status === 'idle' ? 'opacity-30' : 'opacity-100'}`}>
                  <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center bg-[#050a10]
                    ${focusedAgent.status === 'idle' ? 'border-[#334155]' : 'border-[#2dd4bf] shadow-[0_0_8px_rgba(45,212,191,0.5)]'}
                  `}>
                    {focusedAgent.status !== 'idle' && <div className="w-2 h-2 bg-[#2dd4bf] rounded-full" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-[#64748b] flex justify-between">
                      <span className={focusedAgent.status !== 'idle' ? 'text-[#2dd4bf]' : ''}>INTENT_SUBMIT</span>
                      <span>T-0.45</span>
                    </div>
                  </div>
                </div>

                {/* Step 2: 402 Block */}
                <div className={`flex gap-6 items-start ${['idle', 'intent_submit'].includes(focusedAgent.status) ? 'opacity-30' : 'opacity-100'}`}>
                  <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center bg-[#050a10]
                    ${['idle', 'intent_submit'].includes(focusedAgent.status) ? 'border-[#334155]' : 'border-[#fb923c] shadow-[0_0_8px_rgba(251,146,60,0.5)]'}
                  `}>
                    {!['idle', 'intent_submit'].includes(focusedAgent.status) && <div className="w-2 h-2 bg-[#fb923c] rounded-full" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-[#64748b] flex justify-between mb-2">
                      <span className={!['idle', 'intent_submit'].includes(focusedAgent.status) ? 'text-[#fb923c]' : ''}>HTTP_402_PAYMENT_REQ</span>
                      <span>T-0.35</span>
                    </div>
                    {/* Detail Box */}
                    <div className={`border p-3 text-[9px] sm:text-[10px] leading-relaxed
                      ${focusedAgent.status === '402_req' ? 'border-[#fb923c] text-[#fb923c]' : 'border-[#1e293b] text-[#64748b]'}
                    `}>
                      ACCESS_DENIED: INSUFFICIENT_FUNDS<br/>
                      REQ_AMOUNT: 0.001 USDC<br/>
                      DEST: NAVA_NODE_PRIME
                    </div>
                  </div>
                </div>

                {/* Step 3: Circle Payment */}
                <div className={`flex gap-6 items-start ${['idle', 'intent_submit', '402_req'].includes(focusedAgent.status) ? 'opacity-30' : 'opacity-100'}`}>
                  <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center bg-[#050a10]
                    ${['idle', 'intent_submit', '402_req'].includes(focusedAgent.status) ? 'border-[#334155]' : 'border-[#2dd4bf] shadow-[0_0_8px_rgba(45,212,191,0.5)]'}
                  `}>
                    {!['idle', 'intent_submit', '402_req'].includes(focusedAgent.status) && <div className="w-2 h-2 bg-[#2dd4bf] rounded-full" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-[#64748b] flex justify-between mb-2">
                      <span className={!['idle', 'intent_submit', '402_req'].includes(focusedAgent.status) ? 'text-[#2dd4bf]' : ''}>CIRCLE_NANOPAYMENT</span>
                      <span>T-0.15</span>
                    </div>
                    <div className="border border-[#1e293b] p-3 text-[9px] sm:text-[10px] text-[#64748b] leading-relaxed">
                      TX_HASH: 0X8F...3A92<br/>
                      STATUS: SETTLED<br/>
                      GAS_USED: {focusedAgent.gasUsed || "0.00000002 ETH"}
                    </div>
                  </div>
                </div>

                {/* Step 4: Gemini Verification */}
                <div className={`flex gap-6 items-start ${['idle', 'intent_submit', '402_req', 'circle_paid'].includes(focusedAgent.status) ? 'opacity-30' : 'opacity-100'}`}>
                  <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center bg-[#050a10]
                    ${focusedAgent.status === 'gemini_verify' ? 'border-[#2dd4bf] shadow-[0_0_8px_rgba(45,212,191,0.8)]' : 
                      ['approved', 'rejected'].includes(focusedAgent.status) ? 'border-[#2dd4bf]' : 'border-[#334155]'}
                  `}>
                    {!['idle', 'intent_submit', '402_req', 'circle_paid'].includes(focusedAgent.status) && <div className="w-2 h-2 bg-[#2dd4bf] rounded-full animate-pulse" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-[#64748b] flex justify-between mb-2">
                      <span className={focusedAgent.status === 'gemini_verify' ? 'text-[#2dd4bf]' : ''}>GEMINI_AI_VERIFY</span>
                      <span>{focusedAgent.status === 'gemini_verify' ? "PROCESSING..." : "DONE"}</span>
                    </div>
                    <div className={`border p-3 text-[9px] sm:text-[10px] leading-relaxed
                      ${focusedAgent.status === 'gemini_verify' ? 'border-[#2dd4bf] text-[#2dd4bf]' : 'border-[#1e293b] text-[#64748b]'}
                    `}>
                      ANALYZING_INTENT_PAYLOAD   [.....]<br/>
                      MODEL: GEMINI-1.5-FLASH<br/>
                      HEURISTIC_CHECK: {focusedAgent.status === 'rejected' ? 'FAIL' : 'PASS'}<br/>
                      ACTION: {focusedAgent.action || "NULL"}
                    </div>
                  </div>
                </div>

                {/* Step 5: Final Arc L1 Sig */}
                <div className={`flex gap-6 items-start ${!['approved', 'rejected'].includes(focusedAgent.status) ? 'opacity-30' : 'opacity-100'}`}>
                  <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center bg-[#050a10]
                    ${focusedAgent.status === 'approved' ? 'border-[#0f766e]' : 
                      focusedAgent.status === 'rejected' ? 'border-[#7f1d1d]' : 'border-[#334155]'}
                  `}>
                    {['approved', 'rejected'].includes(focusedAgent.status) && <div className={`w-2 h-2 rounded-full ${focusedAgent.status === 'approved' ? 'bg-[#2dd4bf]' : 'bg-[#f87171]'}`} />}
                  </div>
                  <div className="flex-1">
                    <div className="text-[#64748b] flex justify-between">
                      <span className={focusedAgent.status === 'approved' ? 'text-[#2dd4bf]' : focusedAgent.status === 'rejected' ? 'text-[#f87171]' : ''}>
                        {focusedAgent.status === 'rejected' ? "VERIFICATION_FAILED" : "ARC_L1_CRYPTO_SIG"}
                      </span>
                      <span>{focusedAgent.status === 'approved' ? focusedAgent.signature : focusedAgent.reason || "AWAITING"}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* COLUMN 3: SETTLEMENT LEDGER */}
          <section className="lg:col-span-4 flex flex-col gap-6 min-h-0">
            
            {/* Pseudo Chart Component */}
            <div className="border border-[#1e293b] h-48 flex flex-col p-3">
              <div className="flex justify-between items-center text-[#2dd4bf] mb-4">
                <span>[ SETTLEMENT_LEDGER ]</span>
                <span className="text-[#64748b]">SYNC: OK</span>
              </div>
              <div className="flex-1 flex items-end gap-1 px-2 pb-2">
                {/* Fake bar chart bars */}
                <div className="absolute top-10 left-4 text-[#64748b] text-[9px]">REALTIME_VOL (USDC FEES)</div>
                {chartData.map((val, i) => (
                  <div 
                    key={i} 
                    className="flex-1 bg-[#0f766e] opacity-60 transition-all duration-300"
                    style={{ height: `${val}%`, backgroundColor: val > 60 ? '#fb923c' : undefined }}
                  />
                ))}
              </div>
            </div>

            {/* Scrolling Logs Terminal */}
            <div className="border border-[#1e293b] flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-4 space-y-1 text-[9px] sm:text-[10px]">
                {logs.length === 0 && <span className="text-[#64748b]">AWAITING_TX_STREAM...</span>}
                {logs.map((log) => (
                  <div key={log.id} className="flex gap-3">
                    <span className="text-[#64748b] shrink-0 w-24">{log.time}</span>
                    <span className="text-[#2dd4bf] shrink-0 w-12">{log.agentId}</span>
                    <span className={`
                      truncate
                      ${log.type === 'warn' ? 'text-[#fb923c]' : ''}
                      ${log.type === 'error' ? 'text-[#f87171]' : ''}
                      ${log.type === 'success' ? 'text-[#2dd4bf] font-bold' : ''}
                      ${log.type === 'info' ? 'text-[#94a3b8]' : ''}
                    `}>
                      {log.text}
                    </span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            </div>

          </section>

        </div>
      </main>
    </>
  );
}