import React, { useState, useRef } from "react";
import { Upload, FileText, Zap, Sparkles, HelpCircle, CheckCircle, File } from "lucide-react";
import { ViewType } from "../types";

interface TasksViewProps {
  onStartAnalysis: (text: string, filename: string) => void;
  isLoading: boolean;
}

export default function TasksView({ onStartAnalysis, isLoading }: TasksViewProps) {
  const [pasteText, setPasteText] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag and drop event handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile({
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(1) + " MB"
      });
      
      // Attempt to read text files
      if (file.type.startsWith("text/") || file.name.endsWith(".txt") || file.name.endsWith(".md") || file.name.endsWith(".json")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setPasteText(String(event.target.result));
          }
        };
        reader.readAsText(file);
      } else {
        // Fallback placeholder text if non-text file is dropped
        setPasteText(`[Uploaded Binary File: ${file.name}]\nAnalyzing assignment requirements from metadata and text contents.`);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile({
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(1) + " MB"
      });

      if (file.type.startsWith("text/") || file.name.endsWith(".txt") || file.name.endsWith(".md") || file.name.endsWith(".json")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setPasteText(String(event.target.result));
          }
        };
        reader.readAsText(file);
      } else {
        setPasteText(`[Attached Document: ${file.name}]\nPlease analyze and prioritize this executive material.`);
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleRescueSubmit = () => {
    const textToSend = pasteText.trim() || (selectedFile ? `Analyzing requirements from the document: ${selectedFile.name}` : "");
    const nameToSend = selectedFile?.name || "Pasted Brief";
    onStartAnalysis(textToSend, nameToSend);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 md:p-12 w-full">
      <div className="w-full max-w-4xl flex flex-col items-center">
        {/* Heading Group */}
        <div className="text-center mb-12">
          <span className="inline-block px-3 py-1 bg-primary text-black font-mono text-[10px] font-bold uppercase tracking-widest mb-4">
            INGESTION ENGINE
          </span>
          <h2 className="text-4xl md:text-5xl font-black font-display italic text-white mb-4 leading-tight">
            Rescue Your Deadline
          </h2>
          <p className="text-sm text-white/60 max-w-lg mx-auto font-sans font-light leading-relaxed">
            Upload your brief or paste raw instructions to initiate our high-velocity prioritization flow.
          </p>
        </div>

        {/* Bento Upload Zone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          {/* Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileInput}
            className={`group flex flex-col items-center justify-center p-8 border border-dashed bg-[#111111] hover:bg-[#161616] hover:border-primary transition-all cursor-pointer relative overflow-hidden h-[320px] select-none ${
              dragActive ? "border-primary bg-primary/10" : "border-white/10"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg,.md,.json"
            />
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center mb-6 group-hover:bg-primary transition-colors duration-300">
                <Upload size={22} />
              </div>

              {selectedFile ? (
                <div className="space-y-2">
                  <h3 className="text-xs font-mono font-bold text-primary uppercase tracking-widest flex items-center justify-center gap-1.5">
                    <File size={14} />
                    <span>Selected</span>
                  </h3>
                  <p className="text-sm text-white font-bold max-w-[240px] truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-[10px] font-mono text-white/40">
                    {selectedFile.size}
                  </p>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      setPasteText("");
                    }}
                    className="text-xs text-red-400 hover:underline mt-2 font-mono uppercase tracking-widest font-semibold cursor-pointer"
                  >
                    [ Remove ]
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="text-base font-bold font-mono uppercase tracking-widest text-white mb-2">
                    DROP SPECIFICATION
                  </h3>
                  <p className="text-xs text-white/40 leading-relaxed font-light">
                    PDF, DOCX, OR MD UP TO 25MB
                  </p>
                  <span className="mt-8 text-[11px] text-primary font-mono uppercase tracking-wider border-b border-primary/20 group-hover:border-primary transition-all bg-transparent">
                    Browse system files
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Paste Zone */}
          <div className="flex flex-col p-6 border border-white/10 bg-[#111111] h-[320px] hover:border-primary/40 transition-colors duration-300">
            <div className="flex items-center gap-2 mb-4 text-white">
              <FileText className="text-primary" size={16} />
              <h3 className="text-xs font-mono uppercase tracking-widest font-bold">PASTE PLAIN TEXT</h3>
            </div>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              className="flex-1 w-full bg-[#050505] border border-white/5 p-4 text-xs tracking-wider uppercase text-white focus:border-primary/50 outline-none resize-none placeholder:text-white/20 font-mono custom-scrollbar"
              placeholder="PASTE REQUIREMENTS, SPECIFICATIONS, OR CRITICAL PARAGRAPHS HERE..."
            ></textarea>
          </div>
        </div>

        {/* Primary CTA */}
        <div className="mt-10 w-full flex flex-col items-center">
          <button
            onClick={handleRescueSubmit}
            disabled={isLoading || (!pasteText.trim() && !selectedFile)}
            className="w-full md:w-auto min-w-[340px] bg-primary disabled:opacity-30 text-black font-mono font-bold text-xs uppercase tracking-[0.2em] py-5 transition-all flex items-center justify-center gap-2.5 cursor-pointer hover:bg-white hover:text-black border border-primary active:scale-[0.98]"
          >
            <span>[ INITIATE DEADLINE RESCUE ]</span>
            <Zap size={14} fill="currentColor" className="text-black" />
          </button>
          <p className="mt-4 text-[10px] font-mono tracking-[0.15em] font-bold text-white/40 uppercase">
            TARGETED: 4 PIPELINE SECTORS / 2 MILESTONES
          </p>
        </div>

        {/* Mobile quick tips section */}
        <footer className="md:hidden mt-12 w-full">
          <div className="p-5 bg-[#111111] border border-white/10 space-y-3">
            <p className="font-bold text-xs font-mono uppercase tracking-wider text-white">Quick Guides:</p>
            <ul className="space-y-2 text-xs text-white/60 font-sans">
              <li className="flex gap-2 items-start">
                <CheckCircle size={14} className="text-primary mt-0.5 flex-shrink-0" />
                <span>Uploading rubrics improves grade-weighting accuracy.</span>
              </li>
              <li className="flex gap-2 items-start">
                <CheckCircle size={14} className="text-primary mt-0.5 flex-shrink-0" />
                <span>Paste complex prompts as plain text for best results.</span>
              </li>
            </ul>
          </div>
        </footer>
      </div>
    </div>
  );
}
