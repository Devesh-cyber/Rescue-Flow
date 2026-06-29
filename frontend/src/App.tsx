import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import DashboardView from "./components/DashboardView";
import NewTaskView from "./components/NewTaskView";
import TasksHubView from "./components/TasksHubView";
import AnalyzingView from "./components/AnalyzingView";
import ExecutionView from "./components/ExecutionView";
import SettingsView from "./components/SettingsView";
import { RescuePlan, ViewType, Milestone } from "./types";
import { LayoutDashboard, CheckSquare, Settings as SettingsIcon } from "lucide-react";
import { backendTaskToDashboardDTO } from "./adapters/taskAdapters";

const queryClient = new QueryClient();

export default function AppWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
}

function App() {
  const [currentView, setView] = useState<ViewType>("tasklist");
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

  // Rescue Plan Data - Now strictly from backend based on activeTaskId
  const [rescuePlan, setRescuePlan] = useState<RescuePlan | null>(null);

  useEffect(() => {
    localStorage.setItem("rescue_user_profile", JSON.stringify(userProfile));
  }, [userProfile]);

  // Dashboard Data Fetch
  useEffect(() => {
    if (!activeTaskId) {
      setRescuePlan(null);
      return;
    }

    const fetchDashboard = async () => {
      setIsDashboardLoading(true);
      setDashboardError(null);
      try {
        const response = await fetch(`https://rescue-flow-api.onrender.com/dashboard/${activeTaskId}`);
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        
        const data = await response.json();
        const dashboardDTO = backendTaskToDashboardDTO(data);
        setRescuePlan(dashboardDTO);
      } catch (err: any) {
        console.error("Backend dashboard fetch failed:", err);
        setDashboardError(err.message);
        setRescuePlan(null);
      } finally {
        setIsDashboardLoading(false);
      }
    };

    fetchDashboard();
  }, [activeTaskId]);

  const handleSetFocusTask = (task: any) => {
    if (!rescuePlan) return;
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

  // handleUpdateMilestones moved to ExecutionView internally

  const handleStartAnalysis = async (text: string, filename: string) => {
    setIsAnalyzing(true);
    setActiveFilename(filename || "document_brief.pdf");
    setView("analyzing");

    try {
  const response = await fetch(
    "https://rescue-flow-api.onrender.com/tasks/create",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: text })
    }
  );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `API error: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.task_id) {
        setActiveTaskId(data.task_id);
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
        setView("dashboard");
      }
    } catch (e) {
      console.error("Task creation error:", e);
      setView("upload"); // Revert on failure
      alert(e instanceof Error ? e.message : "Failed to create task");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectTask = (taskId: string) => {
    setActiveTaskId(taskId);
    setView("dashboard");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-surface text-on-surface select-none">
      {/* Sidebar (Desktop) */}
      <Sidebar
        currentView={currentView}
        setView={setView}
        onRescueClick={() => setView("upload")}
        userProfile={userProfile}
        hasActiveTask={!!activeTaskId}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Header Bar */}
        <Header
          currentView={currentView}
          setView={setView}
          onRescueClick={() => setView("upload")}
          userProfile={userProfile}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        />

        {/* Dynamic Inner Page Routing */}
        <div className="flex-1 flex flex-col">
          {currentView === "tasklist" && (
            <TasksHubView onSelectTask={handleSelectTask} onNewTask={() => setView("upload")} />
          )}

          {currentView === "dashboard" && (
            <div className="flex-1 flex flex-col">
              {isDashboardLoading && (
                <div className="w-full bg-primary/10 text-primary text-center py-2 text-xs font-mono uppercase tracking-widest border-b border-primary/20">
                  [ Syncing Dashboard with Backend... ]
                </div>
              )}
              {dashboardError && (
                <div className="w-full bg-red-500/10 text-red-400 text-center py-2 text-xs font-mono uppercase tracking-widest border-b border-red-500/20">
                  [ Backend Sync Failed: {dashboardError} ]
                </div>
              )}
              {rescuePlan && !isDashboardLoading && !dashboardError && (
                <DashboardView
                  plan={rescuePlan}
                  setView={setView}
                  onEnterExecution={() => setView("execution")}
                />
              )}
              {!rescuePlan && !isDashboardLoading && !dashboardError && (
                 <div className="flex flex-col items-center justify-center p-16 text-center h-full">
                    <p className="text-on-surface-variant max-w-md">No task loaded. Please select a task from the hub.</p>
                 </div>
              )}
            </div>
          )}

          {currentView === "upload" && (
            <NewTaskView
              onStartAnalysis={handleStartAnalysis}
              isLoading={isAnalyzing}
            />
          )}

          {currentView === "analyzing" && (
            <AnalyzingView
              filename={activeFilename}
              confidenceScore={"Calculating..."}
              processingPriority={"High"}
              onComplete={() => setView("dashboard")}
            />
          )}

          {currentView === "execution" && activeTaskId && (
            <ExecutionView
              taskId={activeTaskId}
              setView={setView}
            />
          )}

          {currentView === "settings" && (
            <SettingsView
              userProfile={userProfile}
              setUserProfile={setUserProfile}
              onResetToPreset={() => {}}
              plan={rescuePlan || undefined}
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
            onClick={() => { if(activeTaskId) setView("dashboard"); }}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
              currentView === "dashboard" ? "text-primary scale-105 font-bold" : (activeTaskId ? "text-on-surface-variant hover:text-primary" : "text-on-surface-variant/30")
            }`}
          >
            <LayoutDashboard size={20} />
            <span className="text-[10px] font-medium mt-1 font-sans">Dashboard</span>
          </button>

          <button
            onClick={() => setView("tasklist")}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
              currentView === "tasklist" ? "text-primary scale-105 font-bold" : "text-on-surface-variant hover:text-primary"
            }`}
          >
            <CheckSquare size={20} />
            <span className="text-[10px] font-medium mt-1 font-sans">Hub</span>
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
                setView("upload");
                setMobileMenuOpen(false);
              }}
              userProfile={userProfile}
              hasActiveTask={!!activeTaskId}
            />
          </div>
        </div>
      )}
    </div>
  );
}
