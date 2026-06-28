import { Play, Sparkles, AlertTriangle, Clock, Calendar, Users, User as UserIcon, ArrowRight, CheckCircle } from "lucide-react";
import { RescuePlan, ActiveTask, ViewType } from "../types";

interface DashboardViewProps {
  plan: RescuePlan;
  setView: (view: ViewType) => void;
  onEnterExecution: () => void;
  onSetFocusTask: (task: any) => void;
  searchTerm: string;
}

export default function DashboardView({
  plan,
  setView,
  onEnterExecution,
  onSetFocusTask,
  searchTerm
}: DashboardViewProps) {
  // Filter active tasks based on search
  const filteredTasks = plan.activeTasks.filter(task =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.assignee.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // SVG parameters for circular indicator
  const circleRadius = 58;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (plan.focusTask.overallProgress / 100) * circumference;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full space-y-12">
      {/* Welcome & Overview Header */}
      <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black font-display italic text-white tracking-tight">
            {plan.welcomeMessage}
          </h1>
          <p className="text-sm font-mono uppercase tracking-[0.2em] text-white/60 mt-3">
            STATUS SUMMARY: YOU HAVE <span className="text-primary font-bold">{plan.urgentRescuePointsCount} URGENT ACTION POINTS</span> TODAY
          </p>
        </div>
        <div className="text-xs font-mono text-white/40 uppercase tracking-widest">
          SYSTEM / LATENCY SECURE
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Today's Focus Card */}
        <section className="lg:col-span-8 bg-[#111111] border border-outline-variant p-6 md:p-8 space-y-6 relative overflow-hidden group hover:border-primary/40 transition-all duration-300">
          {/* Decorative atmospheric background circle */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] pointer-events-none transition-all group-hover:scale-110"></div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-primary">// TARGET FOCUS</span>
            </div>
            <span className="text-[10px] font-mono font-bold px-3 py-1 bg-primary text-black tracking-wider uppercase">
              HIGH IMPACT
            </span>
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-stretch">
            {/* Focus Task details */}
            <div className="flex-1 flex flex-col justify-between space-y-6">
              <div>
                <h3 className="text-3xl font-black font-display text-white leading-tight">
                  {plan.focusTask.title}
                </h3>
                <p className="text-sm text-white/70 mt-3 leading-relaxed font-sans font-light">
                  {plan.focusTask.description}
                </p>
              </div>

              {/* Deadline & estimated effort */}
              <div className="flex gap-12 py-2 border-t border-b border-white/10 my-4">
                <div className="flex flex-col">
                  <span className="text-[9px] font-mono tracking-widest font-bold text-white/40 uppercase">
                    DEADLINE LIMIT
                  </span>
                  <span className="text-lg font-black font-display italic text-error mt-1">
                    {plan.focusTask.deadline}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-mono tracking-widest font-bold text-white/40 uppercase">
                    TIME ALLOCATION
                  </span>
                  <span className="text-lg font-black font-display italic text-white mt-1">
                    {plan.focusTask.timeEst}
                  </span>
                </div>
              </div>

              {/* Main CTA */}
              <div className="pt-2">
                <button
                  onClick={onEnterExecution}
                  className="bg-primary hover:bg-white text-black hover:text-black px-6 py-4 font-mono font-bold text-xs uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
                >
                  <Play size={14} fill="currentColor" className="text-black" />
                  <span>[ EXECUTE ACTION ]</span>
                </button>
              </div>
            </div>

            {/* Circular overall progress indicator */}
            <div className="w-full md:w-56 flex flex-col justify-center items-center bg-[#050505] p-6 border border-white/10 relative">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    className="text-white/5"
                    cx="72"
                    cy="72"
                    r={circleRadius}
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <circle
                    className="text-primary transition-all duration-1000"
                    cx="72"
                    cy="72"
                    r={circleRadius}
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="square"
                  ></circle>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black font-display italic text-white">
                    {plan.focusTask.overallProgress}%
                  </span>
                  <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-primary">
                    DONE
                  </span>
                </div>
              </div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-center mt-4 text-white/40 leading-normal">
                PIPELINE VELOCITY
              </p>
            </div>
          </div>
        </section>

        {/* Insights & Upcoming Risk Sidebar */}
        <section className="lg:col-span-4 flex flex-col gap-8 w-full">
          {/* Primary Insight container */}
          <div className="bg-primary text-black p-6 space-y-3 relative overflow-hidden group">
            <Sparkles className="absolute -bottom-2 -right-2 text-6xl opacity-10 rotate-12 transition-transform duration-300 group-hover:scale-110" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest flex items-center gap-2">
              <Sparkles size={14} />
              <span>RESCUE INSIGHT</span>
            </h3>
            <p className="text-xs leading-relaxed font-sans font-medium">
              {plan.insights[0]}
            </p>
          </div>

          {/* Upcoming Risk Panel */}
          <div className="bg-[#111111] border border-outline-variant p-6 space-y-4">
            <h3 className="text-[10px] font-mono font-bold text-white/40 tracking-widest uppercase">
              // UPCOMING CRITICAL RISKS
            </h3>
            <div className="space-y-4">
              {plan.upcomingRisks.map((risk, index) => (
                <div key={index} className="flex items-start gap-4 py-1 border-b border-white/5 last:border-b-0">
                  <div className={`w-8 h-8 flex items-center justify-center flex-shrink-0 ${
                    risk.type === "error"
                      ? "bg-red-500/10 text-red-400 border border-red-500/20"
                      : "bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/20"
                  }`}>
                    {risk.type === "error" ? <AlertTriangle size={14} /> : <Clock size={14} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white uppercase tracking-wider font-sans">
                      {risk.title}
                    </p>
                    <p className="text-[11px] text-white/50 leading-relaxed mt-1">
                      {risk.details}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Task List Grid Section */}
      <section className="space-y-6 pt-4">
        <div className="flex justify-between items-end border-b border-white/10 pb-4">
          <div>
            <h2 className="text-2xl font-black font-display text-white italic">Active Pipeline</h2>
            <p className="text-xs font-mono uppercase tracking-widest text-white/40 mt-1">
              CURRENT PIPELINE CONTAINS {filteredTasks.length} TARGETS
            </p>
          </div>
          <button
            onClick={() => setView("tasks")}
            className="text-primary hover:text-white font-mono font-bold text-xs uppercase tracking-widest flex items-center gap-1.5 transition-all cursor-pointer bg-transparent border-none"
          >
            <span>[ VIEW FULL PIPELINE ]</span>
            <ArrowRight size={12} />
          </button>
        </div>

        {/* Task Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTasks.map((task, index) => {
            // Pick corresponding theme status styles
            let statusColor = "bg-[#CCFF00]";
            let statusBadge = "text-primary bg-primary/10 border-primary/20";
            if (task.status === "AT RISK") {
              statusColor = "bg-red-500";
              statusBadge = "text-red-400 bg-red-500/10 border-red-500/20";
            } else if (task.status === "ACTIVE" || task.status === "WORKING NOW") {
              statusColor = "bg-white";
              statusBadge = "text-white bg-white/10 border-white/25";
            }

            return (
              <div
                key={index}
                onClick={() => onSetFocusTask(task)}
                className="group bg-[#111111] hover:bg-[#161616] border border-outline-variant hover:border-primary/40 p-6 flex flex-col justify-between min-h-[230px] transition-all duration-300 cursor-pointer"
              >
                <div>
                  <div className="flex justify-between items-center mb-5">
                    {/* Status Notch and Badge */}
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 ${statusColor}`}></div>
                      <span className="text-[10px] font-mono tracking-wider font-bold text-white/40 uppercase">
                        TASK ID #{index + 1}
                      </span>
                    </div>
                    <span className={`text-[9px] font-mono font-bold px-2.5 py-0.5 border ${statusBadge}`}>
                      {task.status}
                    </span>
                  </div>

                  <h4 className="text-lg font-black font-display text-white group-hover:text-primary transition-colors leading-tight line-clamp-2">
                    {task.title}
                  </h4>

                  {/* Metadata Row */}
                  <div className="flex items-center gap-4 text-white/50 text-xs mt-4 font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} className="text-primary" />
                      <span>{task.deadline}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={12} className="text-primary" />
                      <span>{task.assignee}</span>
                    </span>
                  </div>
                </div>

                {/* Progress bar container */}
                <div className="space-y-2 mt-6 pt-4 border-t border-white/5">
                  <div className="flex justify-between text-[10px] font-mono text-white/40 font-medium">
                    <span>PROGRESS STATUS</span>
                    <span>{task.progress}%</span>
                  </div>
                  <div className="w-full bg-[#050505] h-1 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-700 ${statusColor}`}
                      style={{ width: `${task.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredTasks.length === 0 && (
            <div className="col-span-full py-20 text-center bg-[#111111] border border-dashed border-white/10">
              <CheckCircle size={32} className="mx-auto text-primary mb-3" />
              <p className="text-sm text-white font-mono uppercase tracking-widest font-bold">NO TARGETS FOUND</p>
              <p className="text-xs text-white/40 mt-2 font-sans font-light">Adjust your queries or register new objectives in the Pipeline console.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
