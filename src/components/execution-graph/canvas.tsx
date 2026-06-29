import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ExecutionState, LayoutOptions } from "../../lib/types";
import { computeLayout } from "../../lib/graph-layout";
import { StepBadge } from "./step-badge";
import {
  ChevronDown,
  Target,
  ArrowDown,
  ArrowUp,
  RefreshCw,
  MoreHorizontal,
  Copy,
  GitFork,
  Plus,
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
}

export const ExecutionCanvas: React.FC<ExecutionCanvasProps> = ({
  state,
  options,
  onForkFromStep,
  onSetCursorToRun,
  onAddLabel,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [forkName, setForkName] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const layout = computeLayout(state, options);
  const { rowHeight, nodeRadius, lineWidth, showLabels } = options;
  const spacerWidth = Math.max(layout.width - 80, 40);

  // Resolve which run ID a step belongs to, and whether it's that run's head
  const getStepRefs = (stepId: string) => {
    const step = state.steps[stepId];
    if (!step) return { runName: "", runColor: "", isHead: false, isCursor: false };

    const run = state.runs[step.runId];
    const isHead = run?.head === stepId;
    const isCursor = state.cursor === step.runId && isHead;

    return {
      runName: run?.name ?? "",
      runColor: run?.color ?? "#9CA3AF",
      isHead,
      isCursor,
      runId: step.runId,
    };
  };

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFork = () => {
    if (!selectedId || !forkName.trim()) return;
    onForkFromStep(selectedId, forkName.trim());
    setSelectedId(null);
    setForkName("");
  };

  const handleAddLabel = () => {
    if (!selectedId || !newLabel.trim()) return;
    onAddLabel(newLabel.trim(), selectedId);
    setNewLabel("");
  };

  const handleSetActive = () => {
    if (!selectedId) return;
    const step = state.steps[selectedId];
    if (!step) return;
    const run = state.runs[step.runId];
    if (run?.head === selectedId) {
      onSetCursorToRun(step.runId);
    }
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
                  // Incoming to selected dot (path id = "${parentId}-${childId}-${idx}", selected is child)
                  const isSelectedOutgoing = !!selectedId && p.id.includes('-' + selectedId + '-');
                  const isHovered = !!hoveredId && p.id.includes(hoveredId);
                  return (
                    <motion.path
                      key={p.id}
                      d={p.d}
                      fill="none"
                      stroke={p.color}
                      strokeWidth={isSelectedOutgoing ? lineWidth + 2.5 : isHovered ? lineWidth + 1 : lineWidth}
                      strokeLinecap="round"
                      opacity={isSelectedOutgoing ? 1.0 : isHovered ? 0.9 : 0.55}
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
                      {/* Cursor pulse ring */}
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

                      {/* Hover / selection ring */}
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

                      {/* Main dot */}
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
              const refs = getStepRefs(s.id);
              const isHovered = hoveredId === s.id;
              const isSelected = selectedId === s.id;
              const stepLabels = s.step.labels ?? [];

              return (
                <div
                  key={`row-${s.id}`}
                  style={{ height: `${rowHeight}px` }}
                  className={`group flex items-center justify-between px-4 border-b border-zinc-900/40 cursor-default transition-all duration-150 ${
                    isSelected
                      ? "bg-indigo-500/5 text-white border-l-2 border-l-indigo-500"
                      : isHovered
                      ? "bg-zinc-900/80 text-white"
                      : "text-zinc-300 hover:bg-zinc-900/40"
                  }`}
                  onMouseEnter={() => setHoveredId(s.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => setSelectedId(isSelected ? null : s.id)}
                >
                  {/* SVG spacer */}
                  <div style={{ width: `${spacerWidth}px` }} className="shrink-0 h-full" />

                  {/* Step content */}
                  <div className="flex-1 min-w-0 flex items-center gap-2.5 pr-4">
                    {/* Step id chip */}
                    <span className="font-mono text-[11px] text-zinc-500 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-900/80 shrink-0">
                      {s.id.slice(0, 7)}
                    </span>

                    {/* Type badge */}
                    <StepBadge type={s.step.type} />

                    {/* Node name (workflow mode) */}
                    {s.step.nodeName && (
                      <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                        {s.step.nodeName}
                      </span>
                    )}

                    {/* Step content text */}
                    <span className="font-medium text-zinc-100 text-xs truncate">
                      {s.step.content}
                    </span>

                    {/* Run pill + label pills */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Run pill — only on head of run */}
                      {refs.isHead && (
                        <span
                          style={{
                            borderColor: `${refs.runColor}30`,
                            color: refs.runColor,
                            backgroundColor: `${refs.runColor}15`,
                          }}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded border flex items-center gap-1"
                        >
                          {refs.isCursor ? <Target size={10} className="animate-pulse" /> : <Zap size={10} />}
                          {refs.runName}
                        </span>
                      )}
                      {/* Label pills */}
                      {showLabels && stepLabels.map((lbl, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-medium px-2 py-0.5 rounded border border-amber-500/20 bg-amber-500/10 text-amber-400 flex items-center gap-1"
                        >
                          <Tag size={9} />
                          {lbl}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right metadata */}
                  <div className="flex items-center gap-4 shrink-0 text-xs">
                    {s.step.author && (
                      <span className="text-zinc-500 text-[11px] font-medium hidden sm:inline">
                        {s.step.author}
                      </span>
                    )}
                    <span className="text-zinc-600 text-[11px] font-mono whitespace-nowrap">
                      {new Date(s.step.timestamp).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <button
                      onClick={(e) => handleCopyId(s.id, e)}
                      className="p-1 rounded text-zinc-600 hover:text-zinc-200 hover:bg-zinc-800/50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                      title="Copy step id"
                    >
                      {copiedId === s.id ? <span className="text-[10px]">✓</span> : <Copy size={12} />}
                    </button>
                  </div>
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
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-6 md:items-center justify-between">
              {/* Step summary */}
              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <StepBadge type={state.steps[selectedId].type} />
                  {state.steps[selectedId].nodeName && (
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {state.steps[selectedId].nodeName}
                    </span>
                  )}
                  <span className="font-mono text-xs text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded">
                    {selectedId}
                  </span>
                </div>
                <p className="text-xs text-zinc-200 font-medium truncate">
                  {state.steps[selectedId].content}
                </p>
                {state.steps[selectedId].parents.length > 0 && (
                  <p className="text-[11px] text-zinc-500 font-mono">
                    Parents: {state.steps[selectedId].parents.join(", ")}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Set active run (only when step is the run's head) */}
                {(() => {
                  const step = state.steps[selectedId];
                  const run = state.runs[step?.runId ?? ""];
                  if (run?.head === selectedId && state.cursor !== step?.runId) {
                    return (
                      <button
                        onClick={handleSetActive}
                        className="px-3 py-1.5 rounded-lg border border-zinc-700 hover:border-zinc-500 bg-zinc-800 text-xs font-semibold text-zinc-200 transition-all flex items-center gap-1.5"
                      >
                        <Target size={13} />
                        Set Active
                      </button>
                    );
                  }
                  return null;
                })()}

                {/* Fork from this step */}
                <div className="flex items-center gap-1 border border-zinc-800 bg-zinc-950 p-1 rounded-lg">
                  <input
                    type="text"
                    placeholder="run-name"
                    value={forkName}
                    onChange={(e) => setForkName(e.target.value)}
                    className="bg-transparent text-xs px-2 py-1 outline-none text-zinc-200 w-24 border-none"
                    onKeyDown={(e) => { if (e.key === "Enter" && forkName.trim()) handleFork(); }}
                  />
                  <button
                    onClick={handleFork}
                    disabled={!forkName.trim()}
                    className="p-1 px-2 rounded bg-zinc-800 text-zinc-300 hover:text-white disabled:opacity-50 text-xs font-medium flex items-center gap-0.5 transition-colors cursor-pointer"
                  >
                    <GitFork size={12} />
                    Fork
                  </button>
                </div>

                {/* Add label to this step */}
                <div className="flex items-center gap-1 border border-zinc-800 bg-zinc-950 p-1 rounded-lg">
                  <input
                    type="text"
                    placeholder="label"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    className="bg-transparent text-xs px-2 py-1 outline-none text-zinc-200 w-20 border-none"
                    onKeyDown={(e) => { if (e.key === "Enter" && newLabel.trim()) handleAddLabel(); }}
                  />
                  <button
                    onClick={handleAddLabel}
                    disabled={!newLabel.trim()}
                    className="p-1 px-2 rounded bg-zinc-800 text-zinc-300 hover:text-white disabled:opacity-50 text-xs font-medium flex items-center gap-0.5 transition-colors cursor-pointer"
                  >
                    <Tag size={12} />
                    Label
                  </button>
                </div>

                {/* Close */}
                <button
                  onClick={() => { setSelectedId(null); setForkName(""); setNewLabel(""); }}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
