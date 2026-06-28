import React, { useState } from "react";
import { GitState, LayoutOptions, PresetScenario } from "../types";
import { PRESETS } from "../utils/gitEngine";
import {
  GitCommit,
  GitBranch,
  GitMerge,
  Tag,
  Settings,
  BookOpen,
  Wrench,
  HelpCircle,
  RotateCcw,
  RefreshCw,
  Plus,
} from "lucide-react";

interface GitControlsProps {
  state: GitState;
  options: LayoutOptions;
  onOptionsChange: (newOptions: LayoutOptions) => void;
  onExecuteCommand: (cmd: string) => void;
  onLoadPreset: (presetId: string) => void;
  onResetRepo: () => void;
}

type TabType = "presets" | "actions" | "settings";

export const GitControls: React.FC<GitControlsProps> = ({
  state,
  options,
  onOptionsChange,
  onExecuteCommand,
  onLoadPreset,
  onResetRepo,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("actions");

  // State for Action forms
  const [commitMsg, setCommitMsg] = useState("");
  const [commitAuthor, setCommitAuthor] = useState("coder <coder@aistudio.dev>");
  const [branchName, setBranchName] = useState("");
  const [checkoutTarget, setCheckoutTarget] = useState("");
  const [mergeSource, setMergeSource] = useState("");
  const [noFF, setNoFF] = useState(false);
  const [tagName, setTagName] = useState("");
  const [tagTarget, setTagTarget] = useState("");
  const [resetTarget, setResetTarget] = useState("");
  const [cherryPickTarget, setCherryPickTarget] = useState("");

  const handleCommit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitMsg) return;
    onExecuteCommand(`git commit -m "${commitMsg}" --author "${commitAuthor}"`);
    setCommitMsg("");
  };

  const handleBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName) return;
    onExecuteCommand(`git branch ${branchName}`);
    setBranchName("");
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutTarget) return;
    onExecuteCommand(`git checkout ${checkoutTarget}`);
    setCheckoutTarget("");
  };

  const handleMerge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mergeSource) return;
    const ffFlag = noFF ? " --no-ff" : "";
    onExecuteCommand(`git merge ${mergeSource}${ffFlag}`);
    setMergeSource("");
  };

  const handleTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName) return;
    const commitArg = tagTarget ? ` ${tagTarget}` : "";
    onExecuteCommand(`git tag ${tagName}${commitArg}`);
    setTagName("");
    setTagTarget("");
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;
    onExecuteCommand(`git reset --hard ${resetTarget}`);
    setResetTarget("");
  };

  const handleCherryPick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cherryPickTarget) return;
    onExecuteCommand(`git cherry-pick ${cherryPickTarget}`);
    setCherryPickTarget("");
  };

  // Lists for dropdown selectors
  const branchList = Object.keys(state.branches);
  const commitList = Object.keys(state.commits);

  return (
    <div className="flex flex-col h-full bg-[#18181B]/40 rounded-xl border border-zinc-800 backdrop-blur-sm overflow-hidden" id="git-controls-panel">
      {/* Tab Navigation Headers */}
      <div className="flex border-b border-zinc-800/80 bg-zinc-950/40 p-1">
        <button
          onClick={() => setActiveTab("actions")}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === "actions"
              ? "bg-zinc-800/80 text-white shadow-sm"
              : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/10"
          }`}
        >
          <Wrench size={13} />
          Git Actions
        </button>
        <button
          onClick={() => setActiveTab("presets")}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === "presets"
              ? "bg-zinc-800/80 text-white shadow-sm"
              : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/10"
          }`}
        >
          <BookOpen size={13} />
          Concepts
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === "settings"
              ? "bg-zinc-800/80 text-white shadow-sm"
              : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/10"
          }`}
        >
          <Settings size={13} />
          Layout
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-5">
        
        {/* --- TAB 1: ACTIONS FORM --- */}
        {activeTab === "actions" && (
          <div className="space-y-4" id="tab-actions-content">
            
            {/* Git Commit Card */}
            <div className="p-3 bg-[#0F0F12]/40 rounded-lg border border-zinc-800/50 space-y-2">
              <div className="flex items-center gap-1.5 text-zinc-300 font-bold text-xs border-b border-zinc-800/30 pb-1.5">
                <GitCommit size={14} className="text-sky-400" />
                <span>Create Commit</span>
              </div>
              <form onSubmit={handleCommit} className="space-y-2">
                <input
                  type="text"
                  placeholder="feat: add OAuth login button"
                  value={commitMsg}
                  onChange={(e) => setCommitMsg(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 outline-none focus:border-zinc-700"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Author name"
                    value={commitAuthor}
                    onChange={(e) => setCommitAuthor(e.target.value)}
                    className="flex-1 bg-zinc-950/80 border border-zinc-800 rounded-lg px-2.5 py-1 text-[10px] text-zinc-400 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!commitMsg}
                    className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                  >
                    Commit
                  </button>
                </div>
              </form>
            </div>

            {/* Git Branch Card */}
            <div className="p-3 bg-[#0F0F12]/40 rounded-lg border border-zinc-800/50 space-y-2">
              <div className="flex items-center gap-1.5 text-zinc-300 font-bold text-xs border-b border-zinc-800/30 pb-1.5">
                <GitBranch size={14} className="text-emerald-400" />
                <span>New Branch</span>
              </div>
              <form onSubmit={handleBranch} className="flex gap-2">
                <input
                  type="text"
                  placeholder="feature/payment-gate"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  className="flex-1 bg-zinc-950/80 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 outline-none focus:border-zinc-700"
                />
                <button
                  type="submit"
                  disabled={!branchName}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                >
                  Branch
                </button>
              </form>
            </div>

            {/* Git Checkout Card */}
            <div className="p-3 bg-[#0F0F12]/40 rounded-lg border border-zinc-800/50 space-y-2">
              <div className="flex items-center gap-1.5 text-zinc-300 font-bold text-xs border-b border-zinc-800/30 pb-1.5">
                <RotateCcw size={14} className="text-purple-400" />
                <span>Checkout Branch / Commit</span>
              </div>
              <form onSubmit={handleCheckout} className="flex gap-2">
                <select
                  value={checkoutTarget}
                  onChange={(e) => setCheckoutTarget(e.target.value)}
                  className="flex-1 bg-zinc-950/80 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 outline-none focus:border-zinc-700"
                >
                  <option value="">Select target...</option>
                  <optgroup label="Branches">
                    {branchList.map((b) => (
                      <option key={b} value={b}>
                        {b === state.head ? `* ${b}` : b}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Commits">
                    {commitList.map((h) => (
                      <option key={h} value={h}>
                        {h.slice(0, 7)} - {state.commits[h].message.slice(0, 20)}...
                      </option>
                    ))}
                  </optgroup>
                </select>
                <button
                  type="submit"
                  disabled={!checkoutTarget}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  Checkout
                </button>
              </form>
            </div>

            {/* Git Merge Card */}
            <div className="p-3 bg-[#0F0F12]/40 rounded-lg border border-zinc-800/50 space-y-2.5">
              <div className="flex items-center gap-1.5 text-zinc-300 font-bold text-xs border-b border-zinc-800/30 pb-1.5">
                <GitMerge size={14} className="text-indigo-400" />
                <span>Merge Branch</span>
              </div>
              <form onSubmit={handleMerge} className="space-y-2">
                <div className="flex gap-2">
                  <select
                    value={mergeSource}
                    onChange={(e) => setMergeSource(e.target.value)}
                    className="flex-1 bg-zinc-950/80 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 outline-none focus:border-zinc-700"
                  >
                    <option value="">Select branch to merge...</option>
                    {branchList
                      .filter((b) => b !== state.head)
                      .map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                  </select>
                  <button
                    type="submit"
                    disabled={!mergeSource}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Merge
                  </button>
                </div>
                <div className="flex items-center justify-between px-1">
                  <label htmlFor="no-ff" className="text-[10px] text-zinc-500 font-semibold cursor-pointer">
                    Enable `--no-ff` (Strict Merge Commit)
                  </label>
                  <input
                    id="no-ff"
                    type="checkbox"
                    checked={noFF}
                    onChange={(e) => setNoFF(e.target.checked)}
                    className="rounded bg-zinc-950 border-zinc-800 text-indigo-500 outline-none focus:ring-0 cursor-pointer h-3 w-3"
                  />
                </div>
              </form>
            </div>

            {/* Git Rebase, Tag, Reset Quick Grid Collapse */}
            <div className="grid grid-cols-1 gap-2.5">
              {/* Cherry-Pick */}
              <div className="p-2.5 bg-zinc-900/20 border border-zinc-800/30 rounded-lg text-xs space-y-1.5">
                <span className="font-bold text-[11px] text-amber-500/80 uppercase">Cherry-Pick Commit</span>
                <form onSubmit={handleCherryPick} className="flex gap-1.5">
                  <select
                    value={cherryPickTarget}
                    onChange={(e) => setCherryPickTarget(e.target.value)}
                    className="flex-1 bg-zinc-950/80 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300 outline-none"
                  >
                    <option value="">Select commit...</option>
                    {commitList.map((h) => (
                      <option key={h} value={h}>
                        {h.slice(0, 7)} - {state.commits[h].message.slice(0, 20)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={!cherryPickTarget}
                    className="p-1 px-2.5 bg-amber-600/90 hover:bg-amber-500 text-white font-semibold rounded text-xs transition-colors cursor-pointer disabled:opacity-40"
                  >
                    Pick
                  </button>
                </form>
              </div>

              {/* Reset Hard */}
              <div className="p-2.5 bg-zinc-900/20 border border-zinc-800/30 rounded-lg text-xs space-y-1.5">
                <span className="font-bold text-[11px] text-red-500/80 uppercase">Hard Reset HEAD</span>
                <form onSubmit={handleReset} className="flex gap-1.5">
                  <select
                    value={resetTarget}
                    onChange={(e) => setResetTarget(e.target.value)}
                    className="flex-1 bg-zinc-950/80 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300 outline-none"
                  >
                    <option value="">Reset to...</option>
                    {commitList.map((h) => (
                      <option key={h} value={h}>
                        {h.slice(0, 7)} - {state.commits[h].message.slice(0, 20)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={!resetTarget}
                    className="p-1 px-2.5 bg-red-950/40 hover:bg-red-900 border border-red-900/60 text-red-400 hover:text-white font-semibold rounded text-xs transition-all cursor-pointer disabled:opacity-40"
                  >
                    Reset
                  </button>
                </form>
              </div>
            </div>

            {/* Total Repo Reset Action */}
            <button
              onClick={onResetRepo}
              className="w-full mt-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <RefreshCw size={13} />
              Reset Repository State
            </button>
          </div>
        )}

        {/* --- TAB 2: PRESETS / CONCEPTS --- */}
        {activeTab === "presets" && (
          <div className="space-y-4" id="tab-presets-content">
            <div className="text-xs text-zinc-500 pb-1 font-medium">
              Click any of the scenarios below to populate the interactive graph with realistic, educational Git states instantly.
            </div>

            {PRESETS.map((p) => {
              return (
                <div
                  key={p.id}
                  className="p-3 rounded-lg border border-zinc-800/60 bg-zinc-950/40 hover:border-zinc-700 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-zinc-200">{p.name}</h4>
                    <p className="text-[11px] text-zinc-400 leading-normal">{p.description}</p>
                  </div>
                  <button
                    onClick={() => onLoadPreset(p.id)}
                    className="mt-3.5 self-end py-1 px-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-[10px] font-bold rounded transition-all cursor-pointer"
                  >
                    Load Scenario
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* --- TAB 3: SETTINGS / CUSTOMIZER --- */}
        {activeTab === "settings" && (
          <div className="space-y-4 text-xs" id="tab-settings-content">
            {/* Row Height Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold text-zinc-400 uppercase text-[10px]">
                <span>Commit Row Spacing</span>
                <span>{options.rowHeight}px</span>
              </div>
              <input
                type="range"
                min="24"
                max="72"
                value={options.rowHeight}
                onChange={(e) =>
                  onOptionsChange({ ...options, rowHeight: Number(e.target.value) })
                }
                className="w-full accent-sky-500 bg-zinc-800 cursor-pointer h-1 rounded"
              />
            </div>

            {/* Column Width Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold text-zinc-400 uppercase text-[10px]">
                <span>Branch Column Width</span>
                <span>{options.columnWidth}px</span>
              </div>
              <input
                type="range"
                min="10"
                max="48"
                value={options.columnWidth}
                onChange={(e) =>
                  onOptionsChange({ ...options, columnWidth: Number(e.target.value) })
                }
                className="w-full accent-sky-500 bg-zinc-800 cursor-pointer h-1 rounded"
              />
            </div>

            {/* Node Radius Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold text-zinc-400 uppercase text-[10px]">
                <span>Node Circle Size</span>
                <span>{options.nodeRadius * 2}px</span>
              </div>
              <input
                type="range"
                min="2"
                max="8"
                step="0.5"
                value={options.nodeRadius}
                onChange={(e) =>
                  onOptionsChange({ ...options, nodeRadius: Number(e.target.value) })
                }
                className="w-full accent-sky-500 bg-zinc-800 cursor-pointer h-1 rounded"
              />
            </div>

            {/* Line Width Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold text-zinc-400 uppercase text-[10px]">
                <span>Connection Line Thickness</span>
                <span>{options.lineWidth}px</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="0.5"
                value={options.lineWidth}
                onChange={(e) =>
                  onOptionsChange({ ...options, lineWidth: Number(e.target.value) })
                }
                className="w-full accent-sky-500 bg-zinc-800 cursor-pointer h-1 rounded"
              />
            </div>

            <div className="border-t border-zinc-900 pt-3 space-y-3.5">
              {/* Show Tags toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-zinc-300 block">Show Commit Tags</span>
                  <span className="text-[10px] text-zinc-500 block leading-tight">Display release & build tags on logs</span>
                </div>
                <input
                  type="checkbox"
                  checked={options.showTags}
                  onChange={(e) => onOptionsChange({ ...options, showTags: e.target.checked })}
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
