"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck, ArrowRight, Play, Terminal, CircleDollarSign } from "lucide-react";

// --- Minimalist Diagram Components ---

// A small vertical tick used at the ends of connecting lines
const Tick = () => <div className="h-3 w-[2px] bg-red-800/80 rounded-full shrink-0" />;

// The horizontal connecting dotted line
const ConnectorLine = ({ delay = 0 }: { delay?: number }) => (
  <motion.div 
    initial={{ width: 0, opacity: 0 }}
    whileInView={{ width: "100%", opacity: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.8, delay }}
    className="flex items-center mx-1 flex-1 min-w-[20px] sm:min-w-[40px] max-w-[80px]"
  >
    <Tick />
    <div className="flex-1 h-[2px] border-t-2 border-dotted border-red-800/60 mx-[1px]" />
    <Tick />
  </motion.div>
);

// The numbered badge
const StepBadge = ({ num }: { num: string }) => (
  <div className="w-8 h-8 rounded-lg bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.4)] flex items-center justify-center text-white font-bold text-xs shrink-0 z-10">
    {num}
  </div>
);

// The elegant content card (like the Nava "USER/INTENT" boxes)
const NodeCard = ({ 
  title, 
  subtitle, 
  desc,
  isSecondary = false
}: { 
  title: string; 
  subtitle?: string; 
  desc?: string;
  isSecondary?: boolean;
}) => (
  <div className={`relative flex flex-col justify-center rounded-xl border ${isSecondary ? 'border-neutral-800/80 bg-neutral-900/40' : 'border-red-900/60 bg-gradient-to-b from-red-950/40 to-black/80'} p-4 shadow-xl backdrop-blur-sm min-w-[160px] sm:min-w-[200px] z-10 transition-colors hover:border-red-700/80`}>
    <span className={`text-[10px] font-bold tracking-widest uppercase mb-1 ${isSecondary ? 'text-neutral-400' : 'text-red-500'}`}>
      {title}
    </span>
    {subtitle && <span className="text-white text-xs sm:text-sm font-medium tracking-wide">{subtitle}</span>}
    {desc && <p className="text-neutral-400 text-[11px] sm:text-xs leading-relaxed mt-2">{desc}</p>}
  </div>
);

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-black text-slate-50 font-sans selection:bg-red-500/30 overflow-x-hidden">
      
      {/* Very subtle ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-1/4 w-[60vw] h-[60vh] bg-red-900/10 rounded-full blur-[150px] opacity-60" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vh] bg-rose-900/5 rounded-full blur-[120px] opacity-40" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full border-b border-white/5 bg-black/50 backdrop-blur-xl z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-red-500" />
            <span className="font-semibold text-lg tracking-tight text-white">
              Nava<span className="text-red-500">Arc</span>
            </span>
          </div>
          <Link href="/demo" className="text-xs font-medium text-neutral-400 hover:text-white transition-colors flex items-center gap-2">
            Dashboard <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative z-10 min-h-[85vh] flex flex-col justify-center items-center text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto flex flex-col items-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-medium tracking-wide mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            Agentic Economy on Arc L1
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.05] text-white">
            Trust the Agent.<br/>
            <span className="text-neutral-500">Verify the Action.</span>
          </h1>
          
          <p className="text-base md:text-lg text-neutral-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            The high-frequency security verification layer for autonomous AI agents. 
            Powered by Gemini 1.5 Flash and settled instantly on Arc L1 via Circle Nanopayments.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link href="/demo">
              <button className="group flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-semibold transition-all hover:bg-neutral-200 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                <Play className="w-4 h-4 fill-current" />
                <span>Launch Demo</span>
              </button>
            </Link>
            <a href="#how-it-works" className="flex items-center gap-2 text-neutral-400 hover:text-white px-6 py-3 font-medium transition-colors rounded-full border border-transparent hover:border-white/10 hover:bg-white/5">
              Explore Architecture
            </a>
          </div>
        </motion.div>
      </section>

      {/* The Margin Explanation - Elegant Version */}
      <section className="py-24 px-6 relative z-10 border-y border-white/5 bg-gradient-to-b from-neutral-900/20 to-black">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center"
          >
            <CircleDollarSign className="w-8 h-8 text-neutral-600 mb-6" />
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-white tracking-tight">
              The Margin Explanation
            </h2>
            <p className="text-neutral-400 md:text-lg leading-relaxed max-w-2xl mx-auto mb-8">
              A high-frequency AI security layer cannot exist on traditional networks. 
              Charging <strong className="text-white font-mono bg-white/10 px-1.5 py-0.5 rounded">0.001 USDC</strong> per verification check on an L2 with $0.10 gas fees yields a net loss of $0.099 per call.
            </p>
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl border border-red-500/20 bg-red-950/20 text-red-200 text-sm">
              <ShieldCheck className="w-4 h-4 text-red-500" />
              <span>NavaArc is strictly viable thanks to Arc's sub-cent programmable value.</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Elegant Architecture Diagram (Like NavaLabs) */}
      <section id="how-it-works" className="py-32 px-6 relative z-10">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-3xl font-bold mb-4 tracking-tight">System Architecture</h2>
            <p className="text-neutral-500 text-sm">Every action is independently verified. Execution is escrow-gated. If verification fails, nothing executes.</p>
          </div>

          {/* The Horizontal Flow (Scrollable on mobile) */}
          <div className="w-full overflow-x-auto pb-12 pt-4 hide-scrollbar">
            <div className="flex flex-row items-center justify-start lg:justify-center min-w-max px-4">
              
              {/* STEP 1 */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                className="flex items-center"
              >
                <StepBadge num="1" />
                <div className="ml-4 mr-2">
                  <NodeCard 
                    title="User / Intent" 
                    subtitle="INTENT.CREATED()" 
                  />
                </div>
              </motion.div>

              <ConnectorLine delay={0.2} />

              {/* STEP 2 */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
                className="flex items-center"
              >
                <StepBadge num="2" />
                <div className="ml-4 mr-2 flex flex-col gap-3 relative">
                  {/* Branching layout for the agent logic */}
                  <NodeCard 
                    title="AI Agent" 
                    subtitle="AGENT.PROPOSE()" 
                  />
                  <div className="absolute top-[120%] left-0 w-full">
                    <NodeCard 
                      isSecondary
                      title="Internal Logic"
                      desc="Your agent analyzes context, reasons, and generates a transaction payload based on the user's intent boundaries." 
                    />
                  </div>
                </div>
              </motion.div>

              <ConnectorLine delay={0.4} />

              {/* STEP 3 & 4 (The Core Pipeline) */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 }}
                className="flex items-center"
              >
                <div className="flex flex-col gap-3 relative">
                  <NodeCard 
                    title="NavaArc Intercept" 
                    subtitle="HTTP_402_PAYMENT" 
                  />
                  <NodeCard 
                    isSecondary
                    title="Gemini Verification" 
                    subtitle="AI_ARBITER.VERIFY()" 
                  />
                </div>
              </motion.div>

              <ConnectorLine delay={0.6} />

              {/* STEP 5 */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.6 }}
                className="flex items-center"
              >
                <div className="mr-4">
                  <NodeCard 
                    title="Arc L1 Settlement" 
                    subtitle="ESCROW.EXECUTE()" 
                    desc="If approved by the arbiter, the node signs the payload, executing the transaction on-chain."
                  />
                </div>
              </motion.div>

            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-black py-12 relative z-10 text-center">
        <div className="flex items-center justify-center gap-2 text-neutral-600 text-sm mb-2">
          <Terminal className="w-4 h-4" />
          <span className="tracking-widest font-medium text-xs">NAVA<span className="text-red-900">ARC</span></span>
        </div>
        <p className="text-neutral-600 text-xs">
          Engineered for the Agentic Economy on Arc Hackathon. Powered by Circle & Gemini.
        </p>
      </footer>

    </main>
  );
}