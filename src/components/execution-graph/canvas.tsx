import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ExecutionState, LayoutOptions } from "../../lib/types";
import { computeLayout } from "../../lib/graph-layout";
import { StepBadge } from "./step-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronDown,
  Target,
  ArrowDown,
  ArrowUp,
  RefreshCw,
  MoreHorizontal,
  Copy,
  GitBranch,
  Tag,
  Zap,
  X,
} from "lucide-react";

interface ExecutionCanvasProps {
  state: ExecutionState;
  options: LayoutOptions;
  onForkFromStep: (fromStepId: string, runName: string) => void;
  onSetCursorToRun: (runId: string) => void;
  onAddLabel: (label: string, stepId: string) => void;
  minimal?: boolean;
}

export const ExecutionCanvas: React.FC<ExecutionCanvasProps> = ({
  state,
  options,
  onForkFromStep,
  onSetCursorToRun,
  onAddLabel,
  minimal = false,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [branchName, setBranchName] = useState("");
  const [showBranchInput, setShowBranchInput] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const layout = computeLayout(state, options);
  const { rowHeight, nodeRadius, lineWidth, showLabels } = options;
  const spacerWidth = Math.max(layout.width - 80, 40);

  const getStepRun = (stepId: string) => {
    const step = state.steps[stepId];
    if (!step) return null;
    return state.runs[step.runId] ?? null;
  };


  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRowClick = (stepId: string) => {
    const step = state.steps[stepId];
    if (!step) return;
    // Immediately activate this step's node (run)
    onSetCursorToRun(step.runId);
    setSelectedId(selectedId === stepId ? null : stepId);
    setShowBranchInput(false);
    setBranchName("");
  };

  const handleBranch = () => {
    if (!selectedId || !branchName.trim()) return;
    onForkFromStep(selectedId, branchName.trim());
    setSelectedId(null);
    setBranchName("");
    setShowBranchInput(false);
  };

  const handleAddLabel = () => {
    if (!selectedId || !newLabel.trim()) return;
    onAddLabel(newLabel.trim(), selectedId);
    setNewLabel("");
  };

  const handleClosePanel = () => {
    setSelectedId(null);
    setBranchName("");
    setNewLabel("");
    setShowBranchInput(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#09090b] rounded-xl border border-zinc-800/80 shadow-2xl overflow-hidden font-sans text-zinc-100">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#09090b] border-b border-zinc-800/80 select-none">
        <div className="flex items-center gap-1.5 text-zinc-100 font-sans font-semibold text-xs tracking-wide">
          <ChevronDown size={14} className="text-zinc-400" />
          <span>Execution Graph</span>
        </div>
        <div className="flex items-center gap-3 text-zinc-400">
          <button className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-800/60 hover:bg-zinc-800 text-xs text-zinc-200 transition-colors border border-zinc-700/50">
            <Zap size={12} className="text-zinc-300" />
            <span className="text-[11px] font-medium">Live</span>
          </button>
          <button className="p-1 hover:bg-zinc-800 rounded hover:text-zinc-200 transition-colors" title="Focus cursor">
            <Target size={14} />
          </button>
          <button className="p-1 hover:bg-zinc-800 rounded hover:text-zinc-200 transition-colors" title="Scroll down">
            <ArrowDown size={14} />
          </button>
          <button className="p-1 hover:bg-zinc-800 rounded hover:text-zinc-200 transition-colors" title="Scroll up">
            <ArrowUp size={14} />
          </button>
          <button className="p-1 hover:bg-[#18181b] rounded hover:text-zinc-200 transition-colors">
            <RefreshCw size={14} />
          </button>
          <button className="p-1 hover:bg-[#18181b] rounded hover:text-zinc-200 transition-colors">
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>

      {/* Scrollable graph area */}
      <div className="flex-1 overflow-auto relative bg-[#09090b]">
        <div className="relative select-none" style={{ height: `${layout.height}px`, minWidth: "100%" }}>

          {/* SVG Overlay (pointer-events: none — clicks go through to rows) */}
          <div
            className="absolute left-0 top-0 pointer-events-none z-20"
            style={{ width: `${spacerWidth}px`, height: `${layout.height}px` }}
          >
            <svg width={spacerWidth} height={layout.height} className="absolute inset-0">
              {/* Paths */}
              <g>
                {layout.paths.map((p) => {
                  const isHighlighted = !!selectedId && p.id.includes('-' + selectedId + '-');
                  const isHovered = !!hoveredId && p.id.includes(hoveredId);
                  return (
                    <motion.path
                      key={p.id}
                      d={p.d}
                      fill="none"
                      stroke={p.color}
                      strokeWidth={isHighlighted ? lineWidth + 2.5 : isHovered ? lineWidth + 1 : lineWidth}
                      strokeLinecap="round"
                      opacity={isHighlighted ? 1.0 : isHovered ? 0.9 : 0.55}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.4 }}
                    />
                  );
                })}
              </g>

              {/* Step nodes */}
              <g>
                {layout.steps.map((s) => {
                  const isHovered = hoveredId === s.id;
                  const isSelected = selectedId === s.id;
                  return (
                    <g key={`node-${s.id}`}>
                      {s.isCursor && (
                        <motion.circle
                          cx={s.x}
                          cy={s.y}
                          r={nodeRadius + 4}
                          fill="none"
                          stroke={s.color}
                          strokeWidth="2"
                          animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0.1, 0.6] }}
                          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                        />
                      )}
                      {(isHovered || isSelected) && (
                        <circle
                          cx={s.x}
                          cy={s.y}
                          r={nodeRadius + 4.5}
                          fill="none"
                          stroke="#FFFFFF"
                          strokeWidth="1.5"
                          opacity={isSelected ? 0.9 : 0.5}
                        />
                      )}
                      <circle
                        cx={s.x}
                        cy={s.y}
                        r={isHovered ? nodeRadius + 1.5 : nodeRadius}
                        fill={s.isCursor ? "#09090b" : s.color}
                        stroke={s.color}
                        strokeWidth={s.isCursor ? 2.5 : 0}
                      />
                      {s.isCursor && (
                        <circle cx={s.x} cy={s.y} r={Math.max(nodeRadius - 2, 1.5)} fill={s.color} />
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>

          {/* Row list */}
          <div className="absolute inset-0 flex flex-col z-10">
            {layout.steps.map((s) => {
              const run = getStepRun(s.id);
              const runColor = run?.color ?? "#9CA3AF";
              const isHovered = hoveredId === s.id;
              const isSelected = selectedId === s.id;

              return (
                <div
                  key={s.id}
                  style={{ height: `${rowHeight}px`, borderLeft: `3px solid ${runColor}20` }}
                  className={`group flex items-center justify-between px-4 border-b border-zinc-900/40 cursor-default transition-all duration-150 shrink-0 ${
                    isSelected ? "bg-indigo-500/5 text-white"
                    : isHovered ? "bg-zinc-900/80 text-white"
                    : "text-zinc-300 hover:bg-zinc-900/40"
                  }`}
                  onMouseEnter={() => setHoveredId(s.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => handleRowClick(s.id)}
                >
                  <div style={{ width: `${spacerWidth}px` }} className="shrink-0 h-full" />

                  <div className="flex-1 min-w-0 flex items-center gap-2.5 pr-4">
                    {!minimal && (
                      <span className="font-mono text-[11px] text-zinc-500 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-900/80 shrink-0">
                        {s.id.slice(0, 7)}
                      </span>
                    )}
                    {!minimal && <StepBadge type={s.step.type} />}
                    <span className="font-medium text-zinc-100 text-xs whitespace-pre-wrap break-words">{s.step.content}</span>
                    {showLabels && s.step.labels.length > 0 && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {s.step.labels.map((lbl, i) => (
                          <span key={i} className="text-[10px] font-medium px-2 py-0.5 rounded border border-amber-500/20 bg-amber-500/10 text-amber-400 flex items-center gap-1">
                            <Tag size={9} />
                            {lbl}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {!minimal && (
                    <div className="flex items-center gap-4 shrink-0 text-xs">
                      {s.step.author && (
                        <span className="text-zinc-500 text-[11px] font-medium hidden sm:inline">{s.step.author}</span>
                      )}
                      <span className="text-zinc-600 text-[11px] font-mono whitespace-nowrap">
                        {new Date(s.step.timestamp).toLocaleDateString([], { month: "short", day: "numeric" })}
                      </span>
                      <button
                        onClick={(e) => handleCopyId(s.id, e)}
                        className="p-1 rounded text-zinc-600 hover:text-zinc-200 hover:bg-zinc-800/50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                        title="Copy step id"
                      >
                        {copiedId === s.id ? <span className="text-[10px]">✓</span> : <Copy size={12} />}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected step action panel */}
      <AnimatePresence>
        {selectedId && state.steps[selectedId] && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="border-t border-zinc-800 bg-[#0F0F12]/95 p-4 backdrop-blur-md"
          >
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-4 md:items-start justify-between">
              {/* Step summary */}
              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <StepBadge type={state.steps[selectedId].type} />
                  <span className="font-mono text-xs text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded">
                    {selectedId}
                  </span>
                  {(() => {
                    const run = getStepRun(selectedId);
                    if (!run) return null;
                    return (
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded border"
                        style={{
                          color: run.color,
                          borderColor: `${run.color}30`,
                          backgroundColor: `${run.color}15`,
                        }}
                      >
                        {run.name}
                      </span>
                    );
                  })()}
                </div>
                <p className="text-xs text-zinc-200 font-medium truncate">
                  {state.steps[selectedId].content}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                {/* Branch from this step */}
                {showBranchInput ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      placeholder="node-name"
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && branchName.trim()) handleBranch(); if (e.key === "Escape") setShowBranchInput(false); }}
                      className="h-8 text-xs w-32 bg-zinc-900 border-zinc-700 text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-zinc-600"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleBranch}
                      disabled={!branchName.trim()}
                      className="h-8 text-xs"
                    >
                      Create
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowBranchInput(false)}
                      className="h-8 text-xs text-zinc-500"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowBranchInput(true)}
                    className="h-8 text-xs border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 bg-transparent"
                  >
                    <GitBranch size={12} />
                    Branch new node from here
                  </Button>
                )}

                {/* Add label */}
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder="add label…"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && newLabel.trim()) handleAddLabel(); }}
                    className="h-8 text-xs w-32 bg-zinc-900 border-zinc-700 text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-zinc-600"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleAddLabel}
                    disabled={!newLabel.trim()}
                    className="h-8 text-xs text-zinc-400"
                  >
                    <Tag size={12} />
                    Label
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleClosePanel}
                    className="h-8 w-8 p-0 text-zinc-500"
                  >
                    <X size={14} />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
