export interface FocusTask {
  title: string;
  description: string;
  deadline: string;
  timeEst: string;
  difficulty: string;
  overallProgress: number;
}

export interface UpcomingRisk {
  title: string;
  details: string;
  type: 'error' | 'warning' | string;
}

export interface Milestone {
  title: string;
  description: string;
  durationTracked: string;
  status: 'COMPLETED' | 'WORKING NOW' | 'UPCOMING' | string;
  difficulty: string;
}

export interface ActiveTask {
  title: string;
  deadline: string;
  assignee: string;
  progress: number;
  status: 'ON TRACK' | 'AT RISK' | 'ACTIVE' | string;
}

export interface RescuePlan {
  welcomeMessage: string;
  urgentRescuePointsCount: number;
  focusTask: FocusTask;
  insights: string[];
  upcomingRisks: UpcomingRisk[];
  milestones: Milestone[];
  activeTasks: ActiveTask[];
  confidenceScore: string;
  processingPriority: string;
}

export type ViewType = 'dashboard' | 'tasks' | 'execution' | 'analyzing' | 'settings';
