import { useEffect, useState } from "react";
import { CheckCircle2, RefreshCw, Hourglass, ShieldAlert, BadgePercent, Zap, Terminal } from "lucide-react";

interface AnalyzingViewProps {
  filename?: string;
  onComplete: () => void;
  confidenceScore?: string;
  processingPriority?: string;
}

export default function AnalyzingView({
  filename = "Project_Alpha_V2.pdf",
  onComplete,
  confidenceScore = "98.4%",
  processingPriority = "Ultra-High"
}: AnalyzingViewProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Increment progress counter dynamically
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onComplete();
          }, 800);
          return 100;
        }
        // Random increments
        const next = prev + Math.floor(Math.random() * 8) + 3;
        return next > 100 ? 100 : next;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [onComplete]);

  // Determine stage states
  const stage1Status = progress >= 35 ? "SUCCESS" : "PROCESSING";
  const stage2Status = progress < 35 ? "PENDING" : progress >= 75 ? "SUCCESS" : "PROCESSING";
  const stage3Status = progress < 75 ? "PENDING" : progress >= 100 ? "SUCCESS" : "PROCESSING";

  // SVG parameters for circle
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <main className="flex-1 relative overflow-hidden flex flex-col items-center justify-center p-6 min-h-[calc(100vh-80px)] bg-[#0A0A0A]">
      {/* Central AI Processing Card */}
      <div className="relative z-10 w-full max-w-2xl">
        {/* Status Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black font-display italic text-white mb-4 leading-tight">
            Analyzing document
          </h1>
          <p className="text-sm text-white/60 max-w-lg mx-auto font-sans font-light leading-relaxed">
            AI engine is mapping project dependencies and computing priority sequence vectors.
          </p>
        </div>

        {/* Execution Mode Card */}
        <div className="bg-[#111111] border border-white/10 p-8 md:p-10 shadow-2xl relative overflow-hidden">
          {/* Progress Notch Decorative */}
          <div className="absolute top-0 left-12 w-16 h-1 bg-primary"></div>

          {/* Main Circular Progress Indicator */}
          <div className="mb-10 text-center flex flex-col items-center justify-center">
            <div className="relative inline-flex items-center justify-center mb-8">
              <svg className="w-40 h-40 -rotate-90">
                <circle
                  className="text-white/5"
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <circle
                  className="text-primary transition-all duration-300"
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="square"
                ></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black font-display italic text-white">
                  {progress}%
                </span>
                <span className="text-[9px] font-mono font-bold text-white/40 tracking-widest uppercase mt-1">
                  COMPUTED
                </span>
              </div>
            </div>

            {/* Pulse Bar with shimmering background */}
            <div className="w-full h-1 bg-[#050505] overflow-hidden relative">
              <div
                className="absolute top-0 left-0 h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              >
                <div className="progress-shimmer absolute inset-0 w-full h-full"></div>
              </div>
            </div>
          </div>

          {/* Progressive Checklist */}
          <div className="space-y-4">
            {/* Step 1: Document Ingestion */}
            <div className={`flex items-center gap-4 p-4 border transition-all duration-300 ${
              stage1Status === "SUCCESS"
                ? "bg-white/5 border-primary/20"
                : "bg-primary/5 border-primary/40"
            }`}>
              <div className={`w-8 h-8 flex items-center justify-center flex-shrink-0 ${
                stage1Status === "SUCCESS" ? "bg-primary text-black" : "bg-[#111111] text-primary border border-primary/30 animate-spin"
              }`}>
                {stage1Status === "SUCCESS" ? <CheckCircle2 size={16} /> : <RefreshCw size={16} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-mono font-bold uppercase tracking-wider text-xs ${stage1Status === "SUCCESS" ? "text-primary" : "text-white"}`}>
                  Document Ingestion
                </p>
                <p className="text-xs text-white/50 truncate font-sans font-light mt-0.5">
                  {stage1Status === "SUCCESS" ? "OCR and metadata extraction complete." : "Processing input parameters and documents..."}
                </p>
              </div>
              <div className={`text-[10px] font-mono font-bold px-2 py-0.5 border ${
                stage1Status === "SUCCESS" ? "text-primary border-primary/20" : "text-white/40 border-white/10"
              }`}>
                {stage1Status}
              </div>
            </div>

            {/* Step 2: Semantic Analysis */}
            <div className={`flex items-center gap-4 p-4 border transition-all duration-300 ${
              stage2Status === "SUCCESS"
                ? "bg-white/5 border-primary/20"
                : stage2Status === "PROCESSING"
                ? "bg-primary/5 border-primary/40"
                : "bg-transparent border-white/5 opacity-40"
            }`}>
              <div className={`w-8 h-8 flex items-center justify-center flex-shrink-0 ${
                stage2Status === "SUCCESS"
                  ? "bg-primary text-black"
                  : stage2Status === "PROCESSING"
                  ? "bg-[#111111] text-primary border border-primary/30 animate-spin"
                  : "bg-[#111111] text-white/20 border border-white/5"
              }`}>
                {stage2Status === "SUCCESS" ? (
                  <CheckCircle2 size={16} />
                ) : stage2Status === "PROCESSING" ? (
                  <RefreshCw size={16} />
                ) : (
                  <Terminal size={16} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-mono font-bold uppercase tracking-wider text-xs ${
                  stage2Status === "SUCCESS" ? "text-primary" : "text-white"
                }`}>
                  Semantic Analysis
                </p>
                <p className="text-xs text-white/50 truncate font-sans font-light mt-0.5">
                  {stage2Status === "SUCCESS"
                    ? "Mapping task dependencies and risk vectors."
                    : stage2Status === "PROCESSING"
                    ? "Evaluating prompt weights & priority sequences..."
                    : "Waiting for parser ingestion."}
                </p>
              </div>
              <div className={`text-[10px] font-mono font-bold px-2 py-0.5 border ${
                stage2Status === "SUCCESS"
                  ? "text-primary border-primary/20"
                  : "text-white/40 border-white/10"
              }`}>
                {stage2Status}
              </div>
            </div>

            {/* Step 3: Strategy Formulation */}
            <div className={`flex items-center gap-4 p-4 border transition-all duration-300 ${
              stage3Status === "SUCCESS"
                ? "bg-white/5 border-primary/20"
                : stage3Status === "PROCESSING"
                ? "bg-primary/5 border-primary/40"
                : "bg-transparent border-white/5 opacity-40"
            }`}>
              <div className={`w-8 h-8 flex items-center justify-center flex-shrink-0 ${
                stage3Status === "SUCCESS"
                  ? "bg-primary text-black"
                  : stage3Status === "PROCESSING"
                  ? "bg-[#111111] text-primary border border-primary/30 animate-spin"
                  : "bg-[#111111] text-white/20 border border-white/5"
              }`}>
                {stage3Status === "SUCCESS" ? (
                  <CheckCircle2 size={16} />
                ) : stage3Status === "PROCESSING" ? (
                  <RefreshCw size={16} />
                ) : (
                  <Hourglass size={16} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-mono font-bold uppercase tracking-wider text-xs ${
                  stage3Status === "SUCCESS" ? "text-primary" : "text-white"
                }`}>
                  Strategy Formulation
                </p>
                <p className="text-xs text-white/50 truncate font-sans font-light mt-0.5">
                  {stage3Status === "SUCCESS"
                    ? "Sequenced action list formulated successfully."
                    : stage3Status === "PROCESSING"
                    ? "Assembling milestone timelines..."
                    : "Waiting for preceding computation stages."}
                </p>
              </div>
              <div className={`text-[10px] font-mono font-bold px-2 py-0.5 border ${
                stage3Status === "SUCCESS"
                  ? "text-primary border-primary/20"
                  : "text-white/40 border-white/10"
              }`}>
                {stage3Status}
              </div>
            </div>
          </div>

          {/* AI Confidence Score Summary footer */}
          <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between font-mono">
            <div>
              <span className="text-[10px] font-bold text-white/40 tracking-widest uppercase block mb-1">
                CONFIDENCE INDEX
              </span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-white italic">{confidenceScore}</span>
                <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-white/40 tracking-widest uppercase block mb-1">
                PROCESSING PRIORITY
              </span>
              <span className="text-lg font-black text-primary italic">{processingPriority}</span>
            </div>
          </div>
        </div>

        {/* Footnote status animation info */}
        <div className="mt-8 flex items-center justify-center gap-2">
          <RefreshCw size={12} className="text-primary animate-spin" />
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-primary">
            {progress < 100
              ? `Compiling Roadmap vectors for ${filename}...`
              : "Finalizing pipeline rescue metrics..."}
          </span>
        </div>
      </div>
    </main>
  );
}
