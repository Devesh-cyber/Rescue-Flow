// Frontend/src/adapters/taskAdapters.ts

// ============================================================================
// DTO INTERFACES
// ============================================================================

export interface FocusTaskDTO {
  title: string;
  description: string;
  deadline: string;
  timeEst: string;
  difficulty: string;
  overallProgress: number;
}

export interface UpcomingRiskDTO {
  title: string;
  details: string;
  type: string;
}

export interface DashboardDTO {
  taskId: string;
  welcomeMessage: string;
  urgentRescuePointsCount: number;
  focusTask: FocusTaskDTO;
  insights: string[];
  upcomingRisks: UpcomingRiskDTO[];
  confidenceScore: string;
  processingPriority: string;
  activeTasks: any[]; // Kept as any[] to safely pass through placeholder data for UI
}

export interface MilestoneDTO {
  id: string;
  title: string;
  description: string;
  durationTracked: string;
  status: string;
  difficulty: string;
}

export interface ExecutionDTO {
  taskId: string;
  taskTitle: string;
  milestones: MilestoneDTO[];
}

export interface ProgressDTO {
  overallProgress: number;
  timeEst: string;
  taskStatus: string;
}

export interface EmergencyDTO {
  enabled: boolean;
  riskLevel: string;
  protocolMessage: string;
  skippableSteps: string[];
  recommendations: string[];
}


// ============================================================================
// HELPER UTILITIES
// ============================================================================

const formatRelativeDeadline = (isoString?: string): string => {
  if (!isoString) return "Unknown Deadline";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "Invalid Date";
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return "Unknown Deadline";
  }
};

const formatEstimatedTime = (hours?: number): string => {
  if (hours === undefined || hours === null) return "0 hrs";
  return `${hours} hrs`;
};


// ============================================================================
// ADAPTER FUNCTIONS
// ============================================================================

export const backendTaskToDashboardDTO = (backendTask: any): DashboardDTO => {
  // Ensure safe fallback if completely null/undefined
  if (!backendTask) backendTask = {};
  
  const analysis = backendTask.analysis || {};
  const progress = backendTask.progress || {};
  const emergencyMode = backendTask.emergency_mode || {};
  
  // Extract risk metrics
  const isOverdue = emergencyMode.is_overdue || false;
  const riskLevel = emergencyMode.risk_level || "Safe";
  
  const upcomingRisks: UpcomingRiskDTO[] = [];
  if (isOverdue) {
    upcomingRisks.push({
      title: "Task Overdue",
      details: "The deadline has passed.",
      type: "error"
    });
  } else if (riskLevel === "Critical" || riskLevel === "Warning") {
    upcomingRisks.push({
      title: `${riskLevel} Risk`,
      details: "Completion is at risk based on remaining effort.",
      type: riskLevel === "Critical" ? "error" : "warning"
    });
  }

  // Calculate confidence string
  let confidenceScoreStr = "0%";
  if (analysis.confidence !== undefined) {
    confidenceScoreStr = `${(analysis.confidence * 100).toFixed(1)}%`;
  }

  return {
    taskId: backendTask._id || "unknown",
    welcomeMessage: "Good morning", // Provided as safe default for UI
    urgentRescuePointsCount: emergencyMode.mandatory_steps_remaining || 0,
    focusTask: {
      title: analysis.title || "Untitled Task",
      description: analysis.summary || "No description provided.",
      deadline: formatRelativeDeadline(analysis.deadline),
      timeEst: formatEstimatedTime(progress.remaining_hours),
      difficulty: analysis.difficulty || "Medium",
      overallProgress: Math.round(progress.overall_completion || 0)
    },
    insights: emergencyMode.recovery_plan && emergencyMode.recovery_plan.length > 0 
              ? emergencyMode.recovery_plan 
              : ["No insights available."],
    upcomingRisks,
    confidenceScore: confidenceScoreStr,
    processingPriority: analysis.priority || "Normal",
    // Passed through directly to prevent map() from crashing in DashboardView
    activeTasks: backendTask.activeTasks || []
  };
};

export const backendTaskToExecutionDTO = (backendTask: any): ExecutionDTO => {
  if (!backendTask) backendTask = {};
  
  const executionPlan = backendTask.execution_plan || {};
  const phases = executionPlan.phases || [];
  
  const milestones: MilestoneDTO[] = [];
  
  phases.forEach((phase: any) => {
    const steps = phase.steps || [];
    steps.forEach((step: any) => {
      
      // Map statuses exactly to what CSS themes expect
      let statusMapped = "UPCOMING";
      if (step.status === "Pending") statusMapped = "UPCOMING";
      else if (step.status === "In Progress") statusMapped = "WORKING NOW";
      else if (step.status === "Completed" || step.status === "COMPLETED") statusMapped = "COMPLETED";

      // Calculate tracked duration string
      let durationStr = "Not started";
      if (step.started_at) {
        if (step.completed_at) {
          const s = new Date(step.started_at).getTime();
          const e = new Date(step.completed_at).getTime();
          if (!isNaN(s) && !isNaN(e)) {
            const hours = ((e - s) / (1000 * 60 * 60)).toFixed(1);
            durationStr = `${hours}h tracked`;
          }
        } else {
           durationStr = "In progress";
        }
      } else if (statusMapped === "COMPLETED") {
          durationStr = "Tracked"; // Fallback
      }
      
      milestones.push({
        id: step.step_id || Math.random().toString(),
        title: step.title || "Untitled Step",
        description: step.description || "",
        durationTracked: durationStr,
        status: statusMapped,
        difficulty: step.emergency_priority || "Medium"
      });
    });
  });

  return {
    taskId: backendTask._id || "unknown",
    taskTitle: backendTask.analysis?.title || "Execution Mode",
    milestones
  };
};

export const backendTaskToProgressDTO = (backendTask: any): ProgressDTO => {
  if (!backendTask) backendTask = {};
  const progress = backendTask.progress || {};
  
  return {
    overallProgress: Math.round(progress.overall_completion || 0),
    timeEst: formatEstimatedTime(progress.remaining_hours),
    taskStatus: backendTask.status || "Unknown"
  };
};

export const backendTaskToEmergencyDTO = (backendTask: any): EmergencyDTO => {
  if (!backendTask) backendTask = {};
  const emergencyMode = backendTask.emergency_mode || {};
  
  let protocolMessage = "No emergency detected. Maintain current velocity.";
  if (emergencyMode.risk_level === "Critical") {
    protocolMessage = "Stress index exceeds standard parameters. We recommend triggering a 5-minute tactical box breathing cycle to restore focus capability.";
  } else if (emergencyMode.risk_level === "Warning") {
    protocolMessage = "Task is at risk. Evaluate skippable steps to recover schedule.";
  }
  
  return {
    enabled: emergencyMode.enabled || false,
    riskLevel: emergencyMode.risk_level || "Safe",
    protocolMessage: protocolMessage,
    skippableSteps: emergencyMode.steps_to_skip || [],
    recommendations: emergencyMode.recovery_plan || []
  };
};
