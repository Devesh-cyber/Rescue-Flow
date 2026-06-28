import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import DashboardView from "./components/DashboardView";
import TasksView from "./components/TasksView";
import AnalyzingView from "./components/AnalyzingView";
import ExecutionView from "./components/ExecutionView";
import SettingsView from "./components/SettingsView";
import { RescuePlan, ViewType, Milestone } from "./types";
import { LayoutDashboard, CheckSquare, Settings as SettingsIcon } from "lucide-react";
import { backendTaskToDashboardDTO } from "./adapters/taskAdapters";

// Q4 Strategy Presentation Preset
const strategyPreset: RescuePlan = {
  welcomeMessage: "Good morning, Alex",
  urgentRescuePointsCount: 3,
  focusTask: {
    title: "Finalize Q4 Strategy Presentation",
    description: "Priority task to align executive team on growth projections. Requires 90 minutes of focused execution.",
    deadline: "2:00 PM",
    timeEst: "1.5 hrs",
    difficulty: "High Impact",
    overallProgress: 70
  },
  insights: [
    "You are most productive between 9:00 AM and 11:30 AM. Tackle your 'Strategy' task now to avoid the 3 PM fatigue dip.",
    "Clear PDF scans yield 40% faster analysis. Consider compiling reference slide notes prior to presentation rehearsal.",
    "You previously spent 45 minutes on 'Strategy Slides v1.' Efficiency for this step is expected to increase by 15%."
  ],
  upcomingRisks: [
    {
      title: "Client Feedback Loop",
      details: "Due tomorrow, no progress yet.",
      type: "error"
    },
    {
      title: "Budget Review",
      details: "Starts in 3 hours.",
      type: "warning"
    }
  ],
  milestones: [
    {
      title: "Gather Q4 Growth Projections",
      description: "Aggregate target milestones from sales and product leads.",
      durationTracked: "1.2h tracked",
      status: "COMPLETED",
      difficulty: "Low"
    },
    {
      title: "Structure Narrative Flow",
      description: "Outline slides covering market validation and margin projections.",
      durationTracked: "0.8h tracked",
      status: "COMPLETED",
      difficulty: "Medium"
    },
    {
      title: "Design Financial Dashboards",
      description: "Generate tables showing net revenue retention and target ARR.",
      durationTracked: "Focusing on slide design",
      status: "WORKING NOW",
      difficulty: "High"
    },
    {
      title: "Executive Team Rehearsal",
      description: "Dry run slide notes and timing constraints.",
      durationTracked: "Not started",
      status: "UPCOMING",
      difficulty: "Medium"
    }
  ],
  activeTasks: [
    {
      title: "Website Performance Audit",
      deadline: "Oct 24",
      assignee: "Dev Team",
      progress: 85,
      status: "ON TRACK"
    },
    {
      title: "Contract Renewal Documentation",
      deadline: "Oct 22 (Late)",
      assignee: "You",
      progress: 15,
      status: "AT RISK"
    },
    {
      title: "Onboarding System Redesign",
      deadline: "Oct 28",
      assignee: "Design",
      progress: 40,
      status: "ACTIVE"
    }
  ],
  confidenceScore: "98.4%",
  processingPriority: "Ultra-High"
};

// AI Campus Assistant Preset
const campusPreset: RescuePlan = {
  welcomeMessage: "Good morning, Alex",
  urgentRescuePointsCount: 5,
  focusTask: {
    title: "AI Campus Assistant Architecture",
    description: "Design and implement vector index pipeline with FastAPI and Pinecone DB.",
    deadline: "Today, 11:59 PM",
    timeEst: "4.5 Hours",
    difficulty: "High Complexity",
    overallProgress: 65
  },
  insights: [
    "You are most productive between 9:00 AM and 11:30 AM. Tackle your vector pipeline tasks now.",
    "Based on your recent commits, the indexing logic for PDF assets might need an asynchronous worker to prevent timeout during bulk uploads.",
    "You previously spent 45 minutes on 'Schema Definition.' Efficiency for this step is expected to increase by 15%."
  ],
  upcomingRisks: [
    {
      title: "Pinecone DB Key Rotation",
      details: "Database credentials scheduled to rotate in 2 hours.",
      type: "warning"
    },
    {
      title: "Web Dev Final",
      details: "Due in 2 days, high risk.",
      type: "error"
    }
  ],
  milestones: [
    {
      title: "Requirement Gathering",
      description: "Gather initial specifications and stakeholder constraints.",
      durationTracked: "1.2h tracked",
      status: "COMPLETED",
      difficulty: "Low"
    },
    {
      title: "Database Schema Design",
      description: "Draft entity relationship diagram and index keys.",
      durationTracked: "0.8h tracked",
      status: "COMPLETED",
      difficulty: "Medium"
    },
    {
      title: "Implement Vector Search Architecture",
      description: "Integrate Pinecone DB with the FastAPI backend. Ensure embeddings are normalized before upserting.",
      durationTracked: "Focusing on index logic",
      status: "WORKING NOW",
      difficulty: "High"
    },
    {
      title: "Frontend Integration",
      description: "Connect React context to backend search API endpoints.",
      durationTracked: "React Context setup",
      status: "UPCOMING",
      difficulty: "Medium"
    },
    {
      title: "QA & Prompt Testing",
      description: "Run adversarial prompt tests to verify agent guardrails.",
      durationTracked: "Not started",
      status: "UPCOMING",
      difficulty: "High"
    }
  ],
  activeTasks: [
    {
      title: "Web Dev Final Project",
      deadline: "2 days left",
      assignee: "You",
      progress: 60,
      status: "ACTIVE"
    },
    {
      title: "Marketing Research",
      deadline: "5 days left",
      assignee: "Research Group",
      progress: 25,
      status: "ON TRACK"
    },
    {
      title: "Lab Report 4",
      deadline: "12 days left",
      assignee: "Lab Partner",
      progress: 85,
      status: "ON TRACK"
    }
  ],
  confidenceScore: "98.4%",
  processingPriority: "Ultra-High"
};

export default function App() {
  const [currentView, setView] = useState<ViewType>("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeFilename, setActiveFilename] = useState("Project_Alpha_V2.pdf");
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  // User Profile
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem("rescue_user_profile");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return {
      name: "Alex Rivera",
      plan: "Pro Plan",
      avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDONe1F3Bj9L3yShypN6CEemY_TJiUUkoso4dkSq2uIl4NL8VtJxNqrWfz-bBIee6jyRv-mxm5IaS0QlVcmzzJ9b-DivmyKf2K9_ESFrtc69zIms4RZr_h7O2vx6BnW6pOV9MTRWuSQspLNHXBAeH1XzyM9CJC17GYHCbvS9M_PRptRyrXNEqsl4-enfnK2U7Ippd1O7l0zrmlXxPjCUn0dC7ODgcAo0bgmDj6ehGl_uPAgn1n88hH5nhjnHoeC_7FlkZM5kpDYisw"
    };
  });

  // Rescue Plan Data
  const [rescuePlan, setRescuePlan] = useState<RescuePlan>(() => {
    const saved = localStorage.getItem("rescue_plan_data");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return strategyPreset;
  });

  // Save state updates to Local Storage
  useEffect(() => {
    localStorage.setItem("rescue_user_profile", JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem("rescue_plan_data", JSON.stringify(rescuePlan));
  }, [rescuePlan]);

  // Dashboard Data Fetch
  useEffect(() => {
    if (!activeTaskId) return;

    const fetchDashboard = async () => {
      setIsDashboardLoading(true);
      try {
        const response = await fetch(`http://localhost:8000/dashboard/${activeTaskId}`);
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        
        const data = await response.json();
        const dashboardDTO = backendTaskToDashboardDTO(data);
        
        // Merge into state to preserve milestones for ExecutionView
        setRescuePlan(prev => ({
          ...prev,
          ...dashboardDTO
        }));
      } catch (err: any) {
        console.warn("Backend dashboard fetch failed, falling back to local presets:", err);
        setDashboardError(err.message);
      } finally {
        setIsDashboardLoading(false);
      }
    };

    fetchDashboard();
  }, [activeTaskId]);

  // Handle Preset updates from settings
  const handleResetToPreset = (presetType: "strategy" | "campus") => {
    if (presetType === "strategy") {
      setRescuePlan(strategyPreset);
    } else {
      setRescuePlan(campusPreset);
    }
    setView("dashboard");
  };

  // Set any clicked task as the active Focus Task
  const handleSetFocusTask = (task: any) => {
    const updatedPlan: RescuePlan = {
      ...rescuePlan,
      focusTask: {
        title: task.title,
        description: `Active pipeline task prioritized for ${task.assignee}. Target confidence is high.`,
        deadline: task.deadline,
        timeEst: "2.0 Hours",
        difficulty: "Medium",
        overallProgress: task.progress
      }
    };
    setRescuePlan(updatedPlan);
    setView("execution");
  };

  // Callback to update roadmap milestones
  const handleUpdateMilestones = (updatedMilestones: Milestone[]) => {
    // Calculate new overall focus task progress based on completed steps
    const completedCount = updatedMilestones.filter(m => m.status === "COMPLETED").length;
    const progressPercent = Math.round((completedCount / updatedMilestones.length) * 100);

    setRescuePlan(prev => ({
      ...prev,
      milestones: updatedMilestones,
      focusTask: {
        ...prev.focusTask,
        overallProgress: progressPercent
      }
    }));
  };

  // Start analysis trigger
  const handleStartAnalysis = async (text: string, filename: string) => {
    setIsAnalyzing(true);
    setActiveFilename(filename || "document_brief.pdf");
    setView("analyzing");

    try {
      const response = await fetch("http://localhost:8000/tasks/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: text })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.task_id) {
        setActiveTaskId(data.task_id);
      }
    } catch (e) {
      console.error("Task creation error:", e);
      // Fallback is automatically the current strategy/campus preset
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRescueClick = () => {
    setView("tasks");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-surface text-on-surface select-none">
      {/* Sidebar (Desktop) */}
      <Sidebar
        currentView={currentView}
        setView={setView}
        onRescueClick={handleRescueClick}
        userProfile={userProfile}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Header Bar */}
        <Header
          currentView={currentView}
          setView={setView}
          onRescueClick={handleRescueClick}
          userProfile={userProfile}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        />

        {/* Dynamic Inner Page Routing */}
        <div className="flex-1 flex flex-col">
          {currentView === "dashboard" && (
            <div className="flex-1 flex flex-col">
              {isDashboardLoading && (
                <div className="w-full bg-primary/10 text-primary text-center py-2 text-xs font-mono uppercase tracking-widest border-b border-primary/20">
                  [ Syncing Dashboard with Backend... ]
                </div>
              )}
              {dashboardError && (
                <div className="w-full bg-red-500/10 text-red-400 text-center py-2 text-xs font-mono uppercase tracking-widest border-b border-red-500/20">
                  [ Backend Sync Failed: Using Local Fallback Mode ]
                </div>
              )}
              <DashboardView
                plan={rescuePlan}
                setView={setView}
                onEnterExecution={() => setView("execution")}
                onSetFocusTask={handleSetFocusTask}
                searchTerm={searchTerm}
              />
            </div>
          )}

          {currentView === "tasks" && (
            <TasksView
              onStartAnalysis={handleStartAnalysis}
              isLoading={isAnalyzing}
            />
          )}

          {currentView === "analyzing" && (
            <AnalyzingView
              filename={activeFilename}
              confidenceScore={rescuePlan.confidenceScore}
              processingPriority={rescuePlan.processingPriority}
              onComplete={() => setView("dashboard")}
            />
          )}

          {currentView === "execution" && (
            <ExecutionView
              plan={rescuePlan}
              setView={setView}
              onUpdateMilestones={handleUpdateMilestones}
            />
          )}

          {currentView === "settings" && (
            <SettingsView
              userProfile={userProfile}
              setUserProfile={setUserProfile}
              onResetToPreset={handleResetToPreset}
              plan={rescuePlan}
            />
          )}
        </div>

        {/* Global Footer (shown in dashboard view) */}
        {currentView === "dashboard" && (
          <footer className="mt-auto py-8 border-t border-outline-variant bg-surface-container-lowest">
            <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-primary opacity-50 font-display">Deadline Rescue</span>
                <span className="text-on-surface-variant text-xs font-sans">
                  © {new Date().getFullYear()}. Productivity Optimized.
                </span>
              </div>
              <div className="flex gap-6 text-xs font-semibold text-on-surface-variant font-sans">
                <a className="hover:text-primary transition-colors cursor-pointer">Privacy Policy</a>
                <a className="hover:text-primary transition-colors cursor-pointer">Terms of Service</a>
                <a className="hover:text-primary transition-colors cursor-pointer">API Reference</a>
              </div>
            </div>
          </footer>
        )}

        {/* Bottom Navigation Bar for Mobile */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-around items-center px-4 py-3 bg-surface border-t border-outline-variant shadow-lg">
          <button
            onClick={() => setView("dashboard")}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
              currentView === "dashboard" ? "text-primary scale-105 font-bold" : "text-on-surface-variant hover:text-primary"
            }`}
          >
            <LayoutDashboard size={20} />
            <span className="text-[10px] font-medium mt-1 font-sans">Dashboard</span>
          </button>

          <button
            onClick={() => setView("tasks")}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
              currentView === "tasks" || currentView === "analyzing" ? "text-primary scale-105 font-bold" : "text-on-surface-variant hover:text-primary"
            }`}
          >
            <CheckSquare size={20} />
            <span className="text-[10px] font-medium mt-1 font-sans">Tasks</span>
          </button>

          <button
            onClick={() => setView("settings")}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
              currentView === "settings" ? "text-primary scale-105 font-bold" : "text-on-surface-variant hover:text-primary"
            }`}
          >
            <SettingsIcon size={20} />
            <span className="text-[10px] font-medium mt-1 font-sans">Settings</span>
          </button>
        </nav>
      </div>

      {/* Mobile Sidebar overlay backdrop drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="relative flex flex-col w-64 max-w-xs bg-surface-container-lowest h-full z-10 p-6 shadow-2xl">
            <Sidebar
              currentView={currentView}
              setView={(view) => {
                setView(view);
                setMobileMenuOpen(false);
              }}
              onRescueClick={() => {
                setView("tasks");
                setMobileMenuOpen(false);
              }}
              userProfile={userProfile}
            />
          </div>
        </div>
      )}
    </div>
  );
}
