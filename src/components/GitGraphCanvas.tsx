import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GitState, LayoutOptions, Branch } from "../types";
import { computeLayout, RenderCommit } from "../utils/gitGraphLayout";
import {
  GitCommit,
  GitBranch,
  GitMerge,
  Tag,
  Clock,
  User,
  ArrowRight,
  Plus,
  RefreshCw,
  Trash2,
  ChevronRight,
  ChevronDown,
  Target,
  Download,
  ArrowDown,
  ArrowUp,
  MoreHorizontal,
  Copy,
  Cloud,
} from "lucide-react";

interface GitGraphCanvasProps {
  state: GitState;
  options: LayoutOptions;
  onExecuteCommand: (cmd: string) => void;
}

export const GitGraphCanvas: React.FC<GitGraphCanvasProps> = ({
  state,
  options,
  onExecuteCommand,
}) => {
  const [hoveredHash, setHoveredHash] = useState<string | null>(null);
  const [selectedHash, setSelectedHash] = useState<string | null>(null);
  const [newBranchName, setNewBranchName] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const layout = computeLayout(state, options);
  const { rowHeight, nodeRadius, lineWidth, showTags } = options;
  const spacerWidth = Math.max(layout.width - 80, 40);

  // Find branches pointing to each commit
  const getCommitRefs = (hash: string) => {
    const refs: { type: "branch" | "tag" | "head"; name: string; color?: string }[] = [];
    
    // Check HEAD
    const isHeadAttached = !!state.branches[state.head];
    const headTarget = isHeadAttached ? state.branches[state.head].target : state.head;
    
    if (headTarget === hash) {
      if (isHeadAttached) {
        refs.push({ type: "head", name: `HEAD -> ${state.head}` });
      } else {
        refs.push({ type: "head", name: "HEAD (detached)" });
      }
    }

    // Check Branches
    for (const [name, b] of Object.entries(state.branches) as [string, Branch][]) {
      if (b.target === hash) {
        refs.push({ type: "branch", name, color: b.color });
      }
    }

    // Check Tags
    const commit = state.commits[hash];
    if (commit && commit.tags && showTags) {
      commit.tags.forEach((t) => {
        refs.push({ type: "tag", name: t });
      });
    }

    return refs;
  };

  const handleCopyHash = (hash: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleAction = (cmd: string) => {
    onExecuteCommand(cmd);
    setSelectedHash(null);
    setNewBranchName("");
    setNewTagName("");
  };

  return (
    <div className="flex flex-col h-full bg-[#09090b] rounded-xl border border-zinc-800/80 shadow-2xl overflow-hidden font-sans text-zinc-100" id="git-graph-canvas">
      {/* Graph Toolbar/Header exactly matching the screenshot */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#09090b] border-b border-zinc-800/80 select-none">
        <div className="flex items-center gap-1.5 text-zinc-100 font-sans font-semibold text-xs tracking-wide">
          <ChevronDown size={14} className="text-zinc-400" />
          <span>Graph</span>
        </div>
        <div className="flex items-center gap-3 text-zinc-400">
          {/* Auto button */}
          <button className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-800/60 hover:bg-zinc-800 text-xs text-zinc-200 transition-colors border border-zinc-700/50">
            <GitBranch size={12} className="text-zinc-300" />
            <span className="text-[11px] font-medium">Auto</span>
          </button>
          
          {/* Target/Concentric Icon */}
          <button className="p-1 hover:bg-zinc-800 rounded hover:text-zinc-200 transition-colors" title="Focus HEAD">
            <Target size={14} />
          </button>

          {/* Pull Icon */}
          <button className="p-1 hover:bg-zinc-800 rounded hover:text-zinc-200 transition-colors" title="Git Pull" onClick={() => onExecuteCommand("git pull")}>
            <Download size={14} />
          </button>

          {/* Down arrow */}
          <button className="p-1 hover:bg-zinc-800 rounded hover:text-zinc-200 transition-colors" title="Scroll down">
            <ArrowDown size={14} />
          </button>

          {/* Up arrow */}
          <button className="p-1 hover:bg-zinc-800 rounded hover:text-zinc-200 transition-colors" title="Scroll up">
            <ArrowUp size={14} />
          </button>

          {/* Refresh/Sync */}
          <button className="p-1 hover:bg-[#18181b] rounded hover:text-zinc-200 transition-colors" title="Sync repository" onClick={() => onExecuteCommand("git log")}>
            <RefreshCw size={14} />
          </button>

          {/* Ellipsis */}
          <button className="p-1 hover:bg-[#18181b] rounded hover:text-zinc-200 transition-colors">
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>

      {/* Scrollable Panel holding integrated SVG lines on top of Full-row content list */}
      <div className="flex-1 overflow-auto relative bg-[#09090b]">
        {/* Dynamic unified width container */}
        <div className="relative select-none" style={{ height: `${layout.height}px`, minWidth: "100%" }}>
          
          {/* SVG Overlay sits absolutely positioned over the rows, passing clicks through */}
          <div className="absolute left-0 top-0 pointer-events-none z-20" style={{ width: `${spacerWidth}px`, height: `${layout.height}px` }}>
            <svg
              width={spacerWidth}
              height={layout.height}
              className="absolute inset-0"
            >
              {/* Branch Connection Paths */}
              <g>
                {layout.paths.map((p) => {
                  const isHovered = hoveredHash && p.id.includes(hoveredHash);
                  return (
                    <motion.path
                      key={p.id}
                      d={p.d}
                      fill="none"
                      stroke={p.color}
                      strokeWidth={isHovered ? lineWidth + 2 : lineWidth}
                      strokeLinecap="round"
                      opacity={isHovered ? 1.0 : 0.75}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.4 }}
                    />
                  );
                })}
              </g>

              {/* Commit Nodes */}
              <g>
                {layout.commits.map((c) => {
                  const isHovered = hoveredHash === c.hash;
                  const isSelected = selectedHash === c.hash;
                  return (
                    <g key={`node-${c.hash}`}>
                      {/* Pulse ring for HEAD commit */}
                      {c.isHead && (
                        <motion.circle
                          cx={c.x}
                          cy={c.y}
                          r={nodeRadius + 4}
                          fill="none"
                          stroke={c.color}
                          strokeWidth="2"
                          animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0.1, 0.6] }}
                          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                        />
                      )}

                      {/* Hover / Selection Accent Outline */}
                      {(isHovered || isSelected) && (
                        <circle
                          cx={c.x}
                          cy={c.y}
                          r={nodeRadius + 4.5}
                          fill="none"
                          stroke="#FFFFFF"
                          strokeWidth="1.5"
                          opacity={isSelected ? 0.9 : 0.5}
                        />
                      )}

                      {/* Main Commit Node Dot */}
                      <circle
                        cx={c.x}
                        cy={c.y}
                        r={isHovered ? nodeRadius + 1.5 : nodeRadius}
                        fill={c.isHead ? "#09090b" : c.color}
                        stroke={c.color}
                        strokeWidth={c.isHead ? 2.5 : 0}
                      />
                      {c.isHead && (
                        <circle
                          cx={c.x}
                          cy={c.y}
                          r={Math.max(nodeRadius - 2, 1.5)}
                          fill={c.color}
                        />
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>

          {/* Fully unified commit row list. Rows span full width of the container */}
          <div className="absolute inset-0 flex flex-col z-10">
            {layout.commits.map((c) => {
              const refs = getCommitRefs(c.hash);
              const isHovered = hoveredHash === c.hash;
              const isSelected = selectedHash === c.hash;

              return (
                <div
                  key={`row-${c.hash}`}
                  style={{ height: `${rowHeight}px` }}
                  className={`group flex items-center justify-between px-4 border-b border-zinc-900/40 cursor-default transition-all duration-150 ${
                    isSelected
                      ? "bg-indigo-500/5 text-white border-l-2 border-l-indigo-500"
                      : isHovered
                      ? "bg-zinc-900/80 text-white"
                      : "text-zinc-300 hover:bg-zinc-900/40"
                  }`}
                  onMouseEnter={() => setHoveredHash(c.hash)}
                  onMouseLeave={() => setHoveredHash(null)}
                  onClick={() => setSelectedHash(isSelected ? null : c.hash)}
                >
                  {/* Left SVG Spacer */}
                  <div style={{ width: `${spacerWidth}px` }} className="shrink-0 h-full" />

                  {/* Left row elements: Hash button and message */}
                  <div className="flex-1 min-w-0 flex items-center gap-3 pr-4">
                    {/* Compact 7-char hash tag label */}
                    <span className="font-mono text-[11px] text-zinc-500 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-900/80 shrink-0">
                      {c.hash.slice(0, 7)}
                    </span>

                    {/* Commit message */}
                    <span className="font-medium text-zinc-100 text-xs truncate">
                      {c.commit.message}
                    </span>

                    {/* Refs/Branch Pills Row next to commit message */}
                    {refs.length > 0 && (
                      <div className="flex items-center gap-1.5 shrink-0 select-none">
                        {refs.map((r, idx) => {
                          if (r.type === "head") {
                            return (
                              <span
                                key={idx}
                                className="text-[10px] font-semibold px-2 py-0.5 rounded border border-sky-400/20 bg-sky-500/10 text-sky-400 shadow shadow-sky-500/5 flex items-center gap-1"
                              >
                                <Target size={10} className="animate-pulse" />
                                {r.name}
                              </span>
                            );
                          } else if (r.type === "branch") {
                            const isCurrentHead = state.head === r.name;
                            return (
                              <span
                                key={idx}
                                style={{
                                  borderColor: `${r.color}30`,
                                  color: r.color,
                                  backgroundColor: `${r.color}15`,
                                }}
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded border shadow-sm flex items-center gap-1 ${
                                  isCurrentHead ? "ring-1 ring-offset-1 ring-offset-[#09090b] ring-blue-500/50" : ""
                                }`}
                              >
                                {isCurrentHead ? <Target size={10} /> : <GitBranch size={10} />}
                                {r.name}
                              </span>
                            );
                          } else {
                            return (
                              <span
                                key={idx}
                                className="text-[10px] font-medium px-2 py-0.5 rounded border border-amber-500/20 bg-amber-500/10 text-amber-400 shadow-sm flex items-center gap-1"
                              >
                                <Tag size={10} />
                                {r.name}
                              </span>
                            );
                          }
                        })}
                      </div>
                    )}
                  </div>

                  {/* Right metadata row elements */}
                  <div className="flex items-center gap-4 shrink-0 text-xs font-sans">
                    {/* Author */}
                    <span className="text-zinc-500 text-[11px] font-medium hidden sm:inline">
                      {c.commit.author.split(" <")[0]}
                    </span>
                    {/* Timestamp relative/friendly */}
                    <span className="text-zinc-600 text-[11px] font-mono whitespace-nowrap">
                      {new Date(c.commit.date).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </span>
                    
                    {/* Copy Hash Icon Button */}
                    <button
                      onClick={(e) => handleCopyHash(c.hash, e)}
                      className="p-1 rounded text-zinc-600 hover:text-zinc-200 hover:bg-zinc-800/50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                      title="Copy full hash"
                    >
                      <Copy size={12} />
                    </button>

                    {/* Decorative cloud icon on first row / HEAD row to match screenshot */}
                    {c.isHead && (
                      <Cloud size={13} className="text-indigo-400/80 animate-pulse shrink-0" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* Interactive Commit Context Dialog Box / Option Panel */}
      <AnimatePresence>
        {selectedHash && state.commits[selectedHash] && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="border-t border-zinc-800 bg-[#0F0F12]/95 p-4 backdrop-blur-md"
            id={`commit-details-dialog`}
          >
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-6 md:items-center justify-between">
              {/* Left Side: Summary of Selected Commit */}
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-zinc-800 text-zinc-400">
                    <GitCommit size={16} />
                  </span>
                  <h4 className="font-semibold text-zinc-200">
                    {state.commits[selectedHash].message}
                  </h4>
                  <span className="font-mono text-xs text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded">
                    {selectedHash}
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  Authored by <span className="text-zinc-300 font-semibold">{state.commits[selectedHash].author}</span> on{" "}
                  {new Date(state.commits[selectedHash].date).toLocaleString()}
                </p>
                {state.commits[selectedHash].parents.length > 0 && (
                  <p className="text-[11px] text-zinc-500 font-mono">
                    Parents: {state.commits[selectedHash].parents.join(", ")}
                  </p>
                )}
              </div>

              {/* Right Side: Quick Git Actions on the Selected Commit */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Checkout Button */}
                <button
                  onClick={() => handleAction(`git checkout ${selectedHash}`)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-700 hover:border-zinc-500 bg-zinc-800 text-xs font-semibold text-zinc-200 transition-all flex items-center gap-1.5"
                >
                  <ArrowRight size={13} />
                  Checkout
                </button>

                {/* Create Branch off this commit */}
                <div className="flex items-center gap-1 border border-zinc-800 bg-zinc-950 p-1 rounded-lg">
                  <input
                    type="text"
                    placeholder="branch-name"
                    value={newBranchName}
                    onChange={(e) => setNewBranchName(e.target.value)}
                    className="bg-transparent text-xs px-2 py-1 outline-none text-zinc-200 w-24 border-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newBranchName) {
                        handleAction(`git branch ${newBranchName} ${selectedHash}`);
                      }
                    }}
                  />
                  <button
                    onClick={() => handleAction(`git branch ${newBranchName} ${selectedHash}`)}
                    disabled={!newBranchName}
                    className="p-1 px-2 rounded bg-zinc-800 text-zinc-300 hover:text-white disabled:opacity-50 text-xs font-medium flex items-center gap-0.5 transition-colors"
                  >
                    <Plus size={12} />
                    Branch
                  </button>
                </div>

                {/* Create Tag on this commit */}
                <div className="flex items-center gap-1 border border-zinc-800 bg-zinc-950 p-1 rounded-lg">
                  <input
                    type="text"
                    placeholder="v1.0.0"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="bg-transparent text-xs px-2 py-1 outline-none text-zinc-200 w-20 border-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newTagName) {
                        handleAction(`git tag ${newTagName} ${selectedHash}`);
                      }
                    }}
                  />
                  <button
                    onClick={() => handleAction(`git tag ${newTagName} ${selectedHash}`)}
                    disabled={!newTagName}
                    className="p-1 px-2 rounded bg-zinc-800 text-zinc-300 hover:text-white disabled:opacity-50 text-xs font-medium flex items-center gap-0.5 transition-colors"
                  >
                    <Tag size={12} />
                    Tag
                  </button>
                </div>

                {/* Hard Reset branch to this commit */}
                <button
                  onClick={() => handleAction(`git reset --hard ${selectedHash}`)}
                  className="px-3 py-1.5 rounded-lg border border-red-950/50 hover:border-red-900 bg-red-950/20 text-xs font-semibold text-red-400 hover:text-red-300 transition-all flex items-center gap-1.5"
                  title="Resets current branch head to this commit (canceling intermediate commits)"
                >
                  <RefreshCw size={13} />
                  Reset Hard
                </button>

                {/* Cherry-Pick commit to HEAD */}
                <button
                  onClick={() => handleAction(`git cherry-pick ${selectedHash}`)}
                  className="px-3 py-1.5 rounded-lg border border-amber-950/50 hover:border-amber-900 bg-amber-950/20 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-all flex items-center gap-1.5"
                  title="Cherry-picks this commit onto HEAD branch"
                >
                  <GitMerge size={13} />
                  Cherry-Pick
                </button>

                {/* Close Button */}
                <button
                  onClick={() => setSelectedHash(null)}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
