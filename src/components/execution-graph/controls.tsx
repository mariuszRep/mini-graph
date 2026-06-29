import React, { useState } from "react";
import { ExecutionState, Run, Step, StepType, LayoutOptions } from "../../lib/types";
import { EXAMPLES } from "../../lib/execution-engine";
import {
  MessageSquare,
  GitFork,
  Settings,
  BookOpen,
  RefreshCw,
  Plus,
  Merge,
  Trash2,
  Zap,
  Target,
} from "lucide-react";

interface ExecutionControlsProps {
  state: ExecutionState;
  options: LayoutOptions;
  onOptionsChange: (opts: LayoutOptions) => void;
  onAddStep: (content: string, type: StepType, author?: string, nodeName?: string) => void;
  onForkRun: (fromStepId: string, runName: string) => void;
  onSwitchRun: (runId: string) => void;
  onMergeRuns: (sourceRunId: string) => void;
  onDeleteRun: (runId: string) => void;
  onLoadExample: (exampleId: string) => void;
  onReset: () => void;
}

type TabType = "step" | "runs" | "examples" | "settings";

const STEP_TYPE_OPTIONS: { value: StepType; label: string }[] = [
  { value: "generic", label: "Generic" },
  { value: "user", label: "User" },
  { value: "assistant", label: "Assistant" },
  { value: "tool_call", label: "Tool Call" },
  { value: "tool_result", label: "Tool Result" },
  { value: "node_output", label: "Node Output" },
];

export const ExecutionControls: React.FC<ExecutionControlsProps> = ({
  state,
  options,
  onOptionsChange,
  onAddStep,
  onForkRun,
  onSwitchRun,
  onMergeRuns,
  onDeleteRun,
  onLoadExample,
  onReset,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("step");

  // Step form
  const [stepContent, setStepContent] = useState("");
  const [stepType, setStepType] = useState<StepType>("generic");
  const [stepAuthor, setStepAuthor] = useState("");
  const [stepNodeName, setStepNodeName] = useState("");

  // Run operations
  const [forkFromId, setForkFromId] = useState("");
  const [newRunName, setNewRunName] = useState("");
  const [mergeSource, setMergeSource] = useState("");
  const [deleteRunId, setDeleteRunId] = useState("");

  const handleAddStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stepContent.trim()) return;
    onAddStep(stepContent.trim(), stepType, stepAuthor || undefined, stepNodeName || undefined);
    setStepContent("");
  };

  const handleFork = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forkFromId || !newRunName.trim()) return;
    onForkRun(forkFromId, newRunName.trim());
    setForkFromId("");
    setNewRunName("");
  };

  const handleMerge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mergeSource) return;
    onMergeRuns(mergeSource);
    setMergeSource("");
  };

  const handleDelete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteRunId) return;
    onDeleteRun(deleteRunId);
    setDeleteRunId("");
  };

  const activeRun = state.runs[state.cursor];
  const runList: Run[] = Object.values(state.runs);
  const stepList: Step[] = state.stepOrder
    .map((id) => state.steps[id])
    .filter((s): s is Step => s !== undefined);

  const tabBtn = (tab: TabType, icon: React.ReactNode, label: string) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
        activeTab === tab
          ? "bg-zinc-800/80 text-white shadow-sm"
          : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/10"
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-[#18181B]/40 rounded-xl border border-zinc-800 backdrop-blur-sm overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-zinc-800/80 bg-zinc-950/40 p-1">
        {tabBtn("step", <MessageSquare size={13} />, "Step")}
        {tabBtn("runs", <GitFork size={13} />, "Runs")}
        {tabBtn("examples", <BookOpen size={13} />, "Examples")}
        {tabBtn("settings", <Settings size={13} />, "Layout")}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto space-y-5">

        {/* ── STEP TAB ── */}
        {activeTab === "step" && (
          <div className="space-y-4">
            {/* Active run indicator */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-950/60 border border-zinc-800/50">
              <Target size={12} className="text-indigo-400 animate-pulse shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-zinc-500 font-semibold uppercase block">Active run</span>
                <span
                  className="text-xs font-bold truncate block"
                  style={{ color: activeRun?.color ?? "#9CA3AF" }}
                >
                  {activeRun?.name ?? "none"}
                </span>
              </div>
            </div>

            {/* Add step form */}
            <div className="p-3 bg-[#0F0F12]/40 rounded-lg border border-zinc-800/50 space-y-2.5">
              <div className="flex items-center gap-1.5 text-zinc-300 font-bold text-xs border-b border-zinc-800/30 pb-1.5">
                <MessageSquare size={14} className="text-sky-400" />
                <span>Add Step</span>
              </div>
              <form onSubmit={handleAddStep} className="space-y-2">
                <textarea
                  placeholder="Step content / output / message..."
                  value={stepContent}
                  onChange={(e) => setStepContent(e.target.value)}
                  rows={2}
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 outline-none focus:border-zinc-700 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAddStep(e as unknown as React.FormEvent);
                  }}
                />
                <div className="flex gap-2">
                  <select
                    value={stepType}
                    onChange={(e) => setStepType(e.target.value as StepType)}
                    className="flex-1 bg-zinc-950/80 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 outline-none focus:border-zinc-700"
                  >
                    {STEP_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={!stepContent.trim()}
                    className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                  >
                    <Plus size={12} />
                    Add
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Node name (optional)"
                    value={stepNodeName}
                    onChange={(e) => setStepNodeName(e.target.value)}
                    className="flex-1 bg-zinc-950/80 border border-zinc-800 rounded-lg px-2.5 py-1 text-[10px] text-zinc-400 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Author (optional)"
                    value={stepAuthor}
                    onChange={(e) => setStepAuthor(e.target.value)}
                    className="flex-1 bg-zinc-950/80 border border-zinc-800 rounded-lg px-2.5 py-1 text-[10px] text-zinc-400 outline-none"
                  />
                </div>
                <p className="text-[10px] text-zinc-600">⌘/Ctrl+Enter to submit</p>
              </form>
            </div>

            {/* Reset button */}
            <button
              onClick={onReset}
              className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={13} />
              Reset Graph
            </button>
          </div>
        )}

        {/* ── RUNS TAB ── */}
        {activeTab === "runs" && (
          <div className="space-y-4">
            {/* Switch run */}
            <div className="p-3 bg-[#0F0F12]/40 rounded-lg border border-zinc-800/50 space-y-2">
              <div className="flex items-center gap-1.5 text-zinc-300 font-bold text-xs border-b border-zinc-800/30 pb-1.5">
                <Zap size={14} className="text-emerald-400" />
                <span>Switch Active Run</span>
              </div>
              <div className="flex gap-2">
                <select
                  className="flex-1 bg-zinc-950/80 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 outline-none"
                  defaultValue=""
                  onChange={(e) => { if (e.target.value) onSwitchRun(e.target.value); e.target.value = ""; }}
                >
                  <option value="">Select run to activate…</option>
                  {runList.map((r) => (
                    <option key={r.id} value={r.id}>
                      {state.cursor === r.id ? `★ ${r.name}` : r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Fork run */}
            <div className="p-3 bg-[#0F0F12]/40 rounded-lg border border-zinc-800/50 space-y-2">
              <div className="flex items-center gap-1.5 text-zinc-300 font-bold text-xs border-b border-zinc-800/30 pb-1.5">
                <GitFork size={14} className="text-violet-400" />
                <span>Fork Run from Step</span>
              </div>
              <form onSubmit={handleFork} className="space-y-2">
                <select
                  value={forkFromId}
                  onChange={(e) => setForkFromId(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 outline-none"
                >
                  <option value="">Select step to fork from…</option>
                  {stepList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.id.slice(0, 7)} — {s.content.slice(0, 30)}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="New run name…"
                    value={newRunName}
                    onChange={(e) => setNewRunName(e.target.value)}
                    className="flex-1 bg-zinc-950/80 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!forkFromId || !newRunName.trim()}
                    className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Fork
                  </button>
                </div>
              </form>
            </div>

            {/* Merge run */}
            <div className="p-3 bg-[#0F0F12]/40 rounded-lg border border-zinc-800/50 space-y-2">
              <div className="flex items-center gap-1.5 text-zinc-300 font-bold text-xs border-b border-zinc-800/30 pb-1.5">
                <Merge size={14} className="text-indigo-400" />
                <span>Merge Run → Active</span>
              </div>
              <form onSubmit={handleMerge} className="flex gap-2">
                <select
                  value={mergeSource}
                  onChange={(e) => setMergeSource(e.target.value)}
                  className="flex-1 bg-zinc-950/80 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 outline-none"
                >
                  <option value="">Merge from run…</option>
                  {runList
                    .filter((r) => r.id !== state.cursor)
                    .map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                </select>
                <button
                  type="submit"
                  disabled={!mergeSource}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  Merge
                </button>
              </form>
            </div>

            {/* Delete run */}
            <div className="p-2.5 bg-zinc-900/20 border border-zinc-800/30 rounded-lg space-y-1.5">
              <span className="font-bold text-[11px] text-red-500/80 uppercase">Delete Run</span>
              <form onSubmit={handleDelete} className="flex gap-1.5">
                <select
                  value={deleteRunId}
                  onChange={(e) => setDeleteRunId(e.target.value)}
                  className="flex-1 bg-zinc-950/80 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300 outline-none"
                >
                  <option value="">Select run…</option>
                  {runList
                    .filter((r) => r.id !== state.cursor)
                    .map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                </select>
                <button
                  type="submit"
                  disabled={!deleteRunId}
                  className="p-1 px-2.5 bg-red-950/40 hover:bg-red-900 border border-red-900/60 text-red-400 hover:text-white font-semibold rounded text-xs transition-all cursor-pointer disabled:opacity-40 flex items-center gap-1"
                >
                  <Trash2 size={11} />
                  Delete
                </button>
              </form>
            </div>

            {/* Run list */}
            <div className="space-y-1.5">
              <p className="text-[10px] text-zinc-500 font-bold uppercase px-1">All Runs</p>
              {runList.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-zinc-800/40 bg-zinc-950/30"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: r.color }}
                  />
                  <span className="text-xs font-semibold text-zinc-200 flex-1 truncate">{r.name}</span>
                  {state.cursor === r.id && (
                    <span className="text-[9px] font-bold text-indigo-400 uppercase">active</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── EXAMPLES TAB ── */}
        {activeTab === "examples" && (
          <div className="space-y-4">
            <div className="text-xs text-zinc-500 pb-1 font-medium">
              Load a pre-built execution trace to explore how the graph represents different workflow patterns.
            </div>
            {EXAMPLES.map((ex) => (
              <div
                key={ex.id}
                className="p-3 rounded-lg border border-zinc-800/60 bg-zinc-950/40 hover:border-zinc-700 transition-all"
              >
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-zinc-200">{ex.name}</h4>
                  <p className="text-[11px] text-zinc-400 leading-normal">{ex.description}</p>
                </div>
                <button
                  onClick={() => onLoadExample(ex.id)}
                  className="mt-3 self-end py-1 px-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-[10px] font-bold rounded transition-all cursor-pointer"
                >
                  Load Example
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {activeTab === "settings" && (
          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold text-zinc-400 uppercase text-[10px]">
                <span>Row Spacing</span>
                <span>{options.rowHeight}px</span>
              </div>
              <input
                type="range" min="24" max="72" value={options.rowHeight}
                onChange={(e) => onOptionsChange({ ...options, rowHeight: Number(e.target.value) })}
                className="w-full accent-sky-500 bg-zinc-800 cursor-pointer h-1 rounded"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between font-bold text-zinc-400 uppercase text-[10px]">
                <span>Column Width</span>
                <span>{options.columnWidth}px</span>
              </div>
              <input
                type="range" min="10" max="48" value={options.columnWidth}
                onChange={(e) => onOptionsChange({ ...options, columnWidth: Number(e.target.value) })}
                className="w-full accent-sky-500 bg-zinc-800 cursor-pointer h-1 rounded"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between font-bold text-zinc-400 uppercase text-[10px]">
                <span>Node Size</span>
                <span>{options.nodeRadius * 2}px</span>
              </div>
              <input
                type="range" min="2" max="8" step="0.5" value={options.nodeRadius}
                onChange={(e) => onOptionsChange({ ...options, nodeRadius: Number(e.target.value) })}
                className="w-full accent-sky-500 bg-zinc-800 cursor-pointer h-1 rounded"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between font-bold text-zinc-400 uppercase text-[10px]">
                <span>Line Thickness</span>
                <span>{options.lineWidth}px</span>
              </div>
              <input
                type="range" min="1" max="5" step="0.5" value={options.lineWidth}
                onChange={(e) => onOptionsChange({ ...options, lineWidth: Number(e.target.value) })}
                className="w-full accent-sky-500 bg-zinc-800 cursor-pointer h-1 rounded"
              />
            </div>

            <div className="border-t border-zinc-900 pt-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-zinc-300 block">Show Labels</span>
                  <span className="text-[10px] text-zinc-500 block leading-tight">Display label annotations on steps</span>
                </div>
                <input
                  type="checkbox" checked={options.showLabels}
                  onChange={(e) => onOptionsChange({ ...options, showLabels: e.target.checked })}
                  className="rounded bg-zinc-950 border-zinc-800 text-sky-500 outline-none focus:ring-0 cursor-pointer h-4 w-4"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
