import React from "react";
import { useQuery } from "@tanstack/react-query";
import { TaskListItem } from "../types";
import { AlertCircle, CheckCircle, Clock, Trash2, ArrowRight } from "lucide-react";

interface TasksHubViewProps {
  onSelectTask: (taskId: string) => void;
  onNewTask: () => void;
}

export default function TasksHubView({ onSelectTask, onNewTask }: TasksHubViewProps) {
  const { data: tasks = [], isLoading, isError, error, refetch } = useQuery<TaskListItem[]>({
    queryKey: ["tasks"],
    queryFn: async () => {
      const response = await fetch("https://rescue-flow-api.onrender.com/tasks/");
      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }
      return response.json();
    }
  });

  const handleDelete = async (
  e: React.MouseEvent,
  taskId: string
) => {
  e.stopPropagation();

  if (
    !window.confirm(
      "Delete this task permanently?"
    )
  ) {
    return;
  }

  try {
    const response = await fetch(
      `https://rescue-flow-api.onrender.com/tasks/${taskId}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new Error(
        "Failed to delete task"
      );
    }

    refetch();
  } catch (error) {
    console.error(error);
    alert("Delete failed");
  }
};
  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case "critical": return "text-red-500 border-red-500/30 bg-red-500/10";
      case "warning": return "text-yellow-500 border-yellow-500/30 bg-yellow-500/10";
      case "safe": return "text-green-500 border-green-500/30 bg-green-500/10";
      default: return "text-on-surface-variant border-outline-variant bg-surface-container";
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk.toLowerCase()) {
      case "critical": return <AlertCircle size={16} className="text-red-500" />;
      case "warning": return <Clock size={16} className="text-yellow-500" />;
      case "safe": return <CheckCircle size={16} className="text-green-500" />;
      default: return null;
    }
  };

  return (
    <div className="p-8 max-w-[1200px] mx-auto w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-extrabold text-on-surface tracking-tight">Mission Control</h1>
          <p className="text-on-surface-variant mt-1 font-sans">Select a project to begin execution or create a new one.</p>
        </div>
        <button
          onClick={onNewTask}
          className="bg-primary text-on-primary px-6 py-3 rounded-full font-bold hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/20 flex items-center gap-2"
        >
          New Project <ArrowRight size={18} />
        </button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-surface-container rounded-2xl border border-outline-variant"></div>
          ))}
        </div>
      )}

      {isError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-2xl text-center">
          <AlertCircle className="mx-auto mb-2 opacity-50" size={32} />
          <p>Failed to load tasks. {error instanceof Error ? error.message : "Unknown error"}</p>
          <button onClick={() => refetch()} className="mt-4 px-4 py-2 bg-red-500/20 rounded-lg font-semibold hover:bg-red-500/30 transition-colors">
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && tasks.length === 0 && (
        <div className="flex flex-col items-center justify-center p-16 text-center border-2 border-dashed border-outline-variant rounded-3xl bg-surface-container-lowest">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
            <CheckCircle size={32} />
          </div>
          <h3 className="text-xl font-bold text-on-surface mb-2">No Active Projects</h3>
          <p className="text-on-surface-variant max-w-md mb-6">You're all caught up! Ready to tackle your next big challenge?</p>
          <button
            onClick={onNewTask}
            className="px-6 py-3 bg-surface-container border border-outline-variant rounded-full text-on-surface font-semibold hover:border-primary/50 transition-colors"
          >
            Create Your First Project
          </button>
        </div>
      )}

      {!isLoading && !isError && tasks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map(task => (
            <div
              key={task.id}
              onClick={() => onSelectTask(task.id)}
              className="group bg-surface-container border border-outline-variant rounded-2xl p-6 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 cursor-pointer transition-all flex flex-col h-full relative overflow-hidden"
            >
              {/* Top Row: Risk Badge & Delete */}
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getRiskColor(task.risk)} uppercase tracking-wider`}>
                  {getRiskIcon(task.risk)}
                  {task.risk}
                </div>
                <button 
                  onClick={(e) => handleDelete(e, task.id)}
                  className="text-on-surface-variant opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all p-1"
                  title="Delete Task"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Title & Deadline */}
              <div className="mb-6 relative z-10">
                <h3 className="text-lg font-extrabold text-on-surface leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
                  {task.title}
                </h3>
                <div className="flex flex-col gap-1.5 text-sm text-on-surface-variant font-mono">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="opacity-70 text-primary" />
                    <span>DL: {task.deadline || "No deadline"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={14} className="opacity-70 text-primary" />
                    <span className="uppercase tracking-wider text-[10px] font-bold border border-outline-variant px-1.5 py-0.5 rounded-md">Status: {task.status.replace("_", " ")}</span>
                  </div>
                  {task.created_at && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="opacity-50">Created:</span>
                      <span>{task.created_at ? new Date(task.created_at).toLocaleDateString() : "N/A"}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Spacer to push progress to bottom */}
              <div className="flex-1"></div>

              {/* Progress */}
              <div className="mt-auto relative z-10">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Progress</span>
                  <span className="text-lg font-bold text-on-surface font-mono">{task.progress}%</span>
                </div>
                <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(100, Math.max(0, task.progress))}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Hover highlight effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
