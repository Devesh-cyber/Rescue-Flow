import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Clock, CheckCircle, Circle, Play, AlertOctagon, TrendingUp } from "lucide-react";
import { ViewType } from "../types";

interface ExecutionViewProps {
  taskId: string;
  setView: (view: ViewType) => void;
}

export default function ExecutionView({ taskId, setView }: ExecutionViewProps) {
  const queryClient = useQueryClient();
  const [activeStepId, setActiveStepId] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["execution", taskId],
    queryFn: async () => {
      const response = await fetch(`https://rescue-flow-api.onrender.com/execution/${taskId}`);
      if (!response.ok) throw new Error("Failed to fetch execution plan");
      return response.json();
    }
  });

  const completeStepMutation = useMutation({
    mutationFn: async (stepId: string) => {
      const response = await fetch(`https://rescue-flow-api.onrender.com/execution/${taskId}/complete-step/${stepId}`, {
        method: "POST"
      });
      if (!response.ok) throw new Error("Failed to complete step");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["execution", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setActiveStepId(null);
    }
  });

  const startStepMutation = useMutation({
    mutationFn: async (stepId: string) => {
      const response = await fetch(`https://rescue-flow-api.onrender.com/execution/${taskId}/start-step/${stepId}`, {
        method: "POST"
      });
      if (!response.ok) throw new Error("Failed to start step");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["execution", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    }
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface">
        <div className="text-primary font-mono animate-pulse">Loading Execution Protocol...</div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-surface p-6">
        <AlertOctagon size={48} className="text-red-500 mb-4" />
        <h3 className="text-xl font-bold mb-2">Error Loading Execution Protocol</h3>
        <p className="text-on-surface-variant mb-6">{error instanceof Error ? error.message : "Unknown error"}</p>
        <button onClick={() => setView("dashboard")} className="px-6 py-2 bg-surface-container rounded-lg">Return to Dashboard</button>
      </div>
    );
  }

  const analysis = data.analysis || {};
  const executionPlan = data.execution_plan || {};
  const progress = data.progress || {};
  const emergencyMode = data.emergency_mode || {};
  const phases = Array.isArray(executionPlan.phases) ? executionPlan.phases : [];

  const handleToggleStep = (step: any) => {
    if (step.status === "Completed") return;
    if (step.status === "In Progress") {
      completeStepMutation.mutate(step.step_id);
    } else {
      startStepMutation.mutate(step.step_id);
      setActiveStepId(step.step_id);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto pb-16 font-sans bg-surface text-on-surface">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant p-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView("dashboard")}
              className="p-2 hover:bg-surface-container rounded-full transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-xl font-display font-black italic text-primary">{analysis.title || "Untitled Task"}</h2>
              <div className="flex items-center gap-3 text-sm text-on-surface-variant font-mono mt-1">
                <span className="flex items-center gap-1"><Clock size={14}/> {analysis.deadline || "No Deadline"}</span>
                <span className="uppercase border px-1.5 py-0.5 text-[10px] font-bold rounded">STATUS: {data.status}</span>
                <span className={`uppercase border px-1.5 py-0.5 text-[10px] font-bold rounded ${emergencyMode.risk_level === 'Critical' ? 'text-red-500 border-red-500/30' : emergencyMode.risk_level === 'Warning' ? 'text-yellow-500 border-yellow-500/30' : 'text-green-500 border-green-500/30'}`}>
                  RISK: {emergencyMode.risk_level || "Safe"}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-mono tracking-widest text-on-surface-variant uppercase">Overall Progress</span>
              <span className="text-2xl font-black font-mono text-primary">{progress.overall_completion || 0}%</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Execution Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Phase Timeline & Checklist */}
          {phases.map((phase: any, phaseIndex: number) => {
            const steps = Array.isArray(phase.steps) ? phase.steps : [];
            return (
              <div key={phase.phase_id || phaseIndex} className="bg-surface-container border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-surface-container-highest p-4 border-b border-outline-variant">
                  <h3 className="font-bold text-lg text-on-surface">{phase.title}</h3>
                  {phase.description && <p className="text-sm text-on-surface-variant mt-1">{phase.description}</p>}
                </div>
                
                <div className="p-4 space-y-3">
                  {steps.map((step: any) => {
                    const isCompleted = step.status === "Completed";
                    const isInProgress = step.status === "In Progress" || activeStepId === step.step_id;
                    const isBlocked = progress.blocked_step_ids?.includes(step.step_id);
                    
                    return (
                      <div 
                        key={step.step_id} 
                        className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                          isCompleted ? "bg-surface-container-lowest border-outline-variant opacity-60" : 
                          isInProgress ? "bg-primary/5 border-primary shadow-sm" : 
                          isBlocked ? "opacity-40 cursor-not-allowed border-transparent" : "bg-surface-container hover:border-primary/50 cursor-pointer border-outline-variant"
                        }`}
                        onClick={() => !isBlocked && handleToggleStep(step)}
                      >
                        <button 
                          className="mt-1 flex-shrink-0"
                          disabled={isBlocked || completeStepMutation.isPending || startStepMutation.isPending}
                        >
                          {isCompleted ? (
                            <CheckCircle className="text-primary" size={24} />
                          ) : isInProgress ? (
                            <Play className="text-primary animate-pulse" size={24} />
                          ) : (
                            <Circle className="text-on-surface-variant" size={24} />
                          )}
                        </button>
                        <div className="flex-1">
                          <h4 className={`font-bold ${isCompleted ? "line-through text-on-surface-variant" : "text-on-surface"}`}>
                            {step.title}
                          </h4>
                          <p className="text-sm text-on-surface-variant mt-1">{step.description}</p>
                          <div className="flex items-center gap-3 mt-3 font-mono text-[10px] uppercase font-bold tracking-wider">
                            <span className="bg-surface py-1 px-2 rounded">{step.estimated_hours}h</span>
                            <span className={`py-1 px-2 rounded ${step.emergency_priority === 'High' ? 'bg-red-500/10 text-red-400' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                              Priority: {step.emergency_priority || "Normal"}
                            </span>
                            {isInProgress && <span className="text-primary animate-pulse">Working Now</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          {/* Emergency Mode Panel */}
          <div className="bg-surface-container border border-outline-variant rounded-2xl p-6 shadow-sm relative overflow-hidden">
            <div className={`absolute top-0 inset-x-0 h-1 ${emergencyMode.risk_level === 'Critical' ? 'bg-red-500' : emergencyMode.risk_level === 'Warning' ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
            
            <div className="flex items-center gap-2 mb-4">
              <AlertOctagon size={20} className={emergencyMode.risk_level === 'Critical' ? 'text-red-500' : emergencyMode.risk_level === 'Warning' ? 'text-yellow-500' : 'text-green-500'} />
              <h3 className="font-bold text-lg font-display">Emergency Mode</h3>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-container-highest p-3 rounded-xl flex flex-col">
                  <span className="text-[10px] font-mono text-on-surface-variant uppercase">Time Left</span>
                  <span className="text-xl font-bold">{emergencyMode.remaining_hours || 0}h</span>
                </div>
                <div className="bg-surface-container-highest p-3 rounded-xl flex flex-col">
                  <span className="text-[10px] font-mono text-on-surface-variant uppercase">Risk Level</span>
                  <span className={`text-xl font-bold ${emergencyMode.risk_level === 'Critical' ? 'text-red-500' : emergencyMode.risk_level === 'Warning' ? 'text-yellow-500' : 'text-green-500'}`}>
                    {emergencyMode.risk_level || "Safe"}
                  </span>
                </div>
              </div>
              
              {emergencyMode.recovery_plan && Array.isArray(emergencyMode.recovery_plan) && emergencyMode.recovery_plan.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-xs font-mono font-bold uppercase text-on-surface-variant tracking-wider mb-3">Recommended Actions</h4>
                  <ul className="space-y-2">
                    {emergencyMode.recovery_plan.map((action: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm bg-surface p-3 rounded-lg border border-outline-variant">
                        <TrendingUp size={14} className="mt-0.5 text-primary flex-shrink-0" />
                        <span className="text-on-surface-variant">{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
