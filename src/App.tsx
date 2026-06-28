import { useState, useEffect } from "react";
import { GitState, LayoutOptions, TerminalLine } from "./types";
import { GitControls } from "./components/GitControls";
import { GitGraphCanvas } from "./components/GitGraphCanvas";
import { GitTerminal } from "./components/GitTerminal";
import {
  createInitialState,
  executeCommand,
  loadScenario,
} from "./utils/gitEngine";
import {
  GitBranch,
  Github,
  BookOpen,
  Sparkles,
  GitCommit,
  RotateCcw,
  RefreshCw,
  Terminal,
} from "lucide-react";

const LOCAL_STORAGE_KEY = "aistudio-gitgraph-playground-state";

export default function App() {
  // 1. Initial State Load (from local storage or default)
  const [gitState, setGitState] = useState<GitState>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to restore Git State", e);
      }
    }
    return createInitialState();
  });

  // 2. Terminal Lines state
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>(() => [
    {
      id: "init-welcome",
      type: "output",
      text: "==============================================================\n   GIT GRAPH REACT COMPONENT SANDBOX & PLAYGROUND v1.1.0\n==============================================================\n\n• React 19 / Tailwind CSS v4 / Lucide / Motion\n• Rebuilt fully modular - replacement for @gitgraph/react\n• Live SVG timeline + horizontally aligned metadata rows\n• Click commit nodes or run CLI commands below to interact\n\nType 'help' to show all available git commands.\n",
    },
  ]);

  // 3. Layout customization options
  const [layoutOptions, setLayoutOptions] = useState<LayoutOptions>({
    orientation: "vertical",
    rowHeight: 32,
    columnWidth: 16,
    nodeRadius: 4,
    lineWidth: 2,
    showTags: true,
    showComments: true,
    theme: "github",
  });

  // Sync state back to localStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(gitState));
  }, [gitState]);

  // Execute a command, update state, and write outputs
  const handleExecuteCommand = (commandStr: string) => {
    const cmdId = Math.random().toString(36).substring(7);
    const cmdLine: TerminalLine = {
      id: `cmd-${cmdId}`,
      type: "command",
      text: commandStr,
    };

    setTerminalLines((prev) => [...prev, cmdLine]);

    // Check for special local commands
    const trimmed = commandStr.trim();
    if (trimmed === "help") {
      const helpOutput: TerminalLine = {
        id: `help-${cmdId}`,
        type: "output",
        text: `Available commands and interactive usage:

  git commit -m "message" [--author "Name"]
    Creates a new commit on the active branch, pointing to current HEAD.
    Example: git commit -m "feat: add user schema"

  git branch <branch-name> [<start-point>]
    Creates a new branch pointer pointing to HEAD or a specific commit hash.
    Example: git branch feature/payment

  git branch -d <branch-name>
    Deletes the specified branch target pointer (cannot delete checked-out branch).
    Example: git branch -d feature/payment

  git checkout <branch-name | commit-hash>
    Moves HEAD to point to the branch (attached) or commit hash (detached HEAD).
    Example: git checkout main  OR  git checkout a1b2c3d

  git merge <branch-name> [--no-ff]
    Merges the specified branch into the current checked-out branch.
    If fast-forwardable, moves branch tip. If not, creates a merge commit.
    Example: git merge feature/payment --no-ff

  git rebase <branch-name>
    Replays commits from the current branch chronologically on top of the target.
    Example: git rebase main

  git tag <tag-name> [<commit-hash>]
    Attaches a release/milestone tag on current HEAD or specific commit.
    Example: git tag v1.0.0

  git reset --hard <commit-hash>
    Resets the active branch head pointer back to the specified commit.
    Example: git reset --hard a1b2c3d

  git cherry-pick <commit-hash>
    Copies a single commit and applies its contents as a new commit on top of HEAD.
    Example: git cherry-pick b7c9f1a

  git log
    Prints chronological git repository history list in terminal log format.

  clear
    Clears the terminal screen outputs.`,
      };
      setTerminalLines((prev) => [...prev, helpOutput]);
      return;
    }

    // Run core engine command
    const res = executeCommand(gitState, commandStr);

    if (res.error) {
      setTerminalLines((prev) => [
        ...prev,
        { id: `err-${cmdId}`, type: "error", text: res.error! },
      ]);
    } else {
      setGitState(res.state);
      if (res.output) {
        setTerminalLines((prev) => [
          ...prev,
          { id: `out-${cmdId}`, type: "output", text: res.output },
        ]);
      }
    }
  };

  const handleClearTerminal = () => {
    setTerminalLines([]);
  };

  const handleLoadPreset = (presetId: string) => {
    const loadedState = loadScenario(presetId);
    setGitState(loadedState);

    const loadId = Math.random().toString(36).substring(7);
    setTerminalLines((prev) => [
      ...prev,
      {
        id: `preset-${loadId}`,
        type: "output",
        text: `>>> Successfully loaded preset scenario: '${presetId}'. Repository timeline populated.`,
      },
    ]);
  };

  const handleResetRepo = () => {
    const freshState = createInitialState();
    setGitState(freshState);
    const resetId = Math.random().toString(36).substring(7);
    setTerminalLines((prev) => [
      ...prev,
      {
        id: `reset-${resetId}`,
        type: "output",
        text: `>>> Repository reset. Started fresh with single 'Initial commit' on branch 'main'.`,
      },
    ]);
  };

  // Stats computation for header
  const numCommits = Object.keys(gitState.commits).length;
  const numBranches = Object.keys(gitState.branches).length;
  const currentHead = gitState.head;
  const isHeadAttached = !!gitState.branches[currentHead];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans select-none antialiased">
      {/* Premium Visual Header */}
      <header className="border-b border-zinc-900 bg-[#0F0F12]/80 backdrop-blur-md px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 shadow-md shadow-sky-500/10 flex items-center justify-center text-white">
              <GitBranch className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-white">GitGraph React Canvas</h1>
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-sky-950 text-sky-400 px-2 py-0.5 rounded border border-sky-900/60 flex items-center gap-1">
                  <Sparkles size={9} />
                  Pure Components
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-medium">
                Sleek SVG-rendered timeline & logs aligned. Perfect replacement for `@gitgraph/react`.
              </p>
            </div>
          </div>

          {/* Quick Stats Metrics HUD */}
          <div className="flex items-center gap-4 text-xs font-mono">
            {/* Commits HUD */}
            <div className="px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800/60 flex items-center gap-2">
              <span className="p-0.5 rounded bg-zinc-800 text-sky-400">
                <GitCommit size={12} />
              </span>
              <span className="text-zinc-500">Commits:</span>
              <span className="font-bold text-white">{numCommits}</span>
            </div>

            {/* Branches HUD */}
            <div className="px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800/60 flex items-center gap-2">
              <span className="p-0.5 rounded bg-zinc-800 text-emerald-400">
                <GitBranch size={12} />
              </span>
              <span className="text-zinc-500">Branches:</span>
              <span className="font-bold text-white">{numBranches}</span>
            </div>

            {/* HEAD Pointer HUD */}
            <div className="px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800/60 flex items-center gap-2">
              <span className="p-0.5 rounded bg-zinc-800 text-purple-400">
                <RotateCcw size={12} />
              </span>
              <span className="text-zinc-500">HEAD:</span>
              <span className={`font-bold ${isHeadAttached ? "text-purple-400" : "text-amber-400"}`}>
                {isHeadAttached ? currentHead : currentHead.slice(0, 7)}
              </span>
            </div>
          </div>

        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        
        {/* Left Column: Interactive Settings & GUI Direct Controls (Sidebar) */}
        <div className="lg:col-span-4 flex flex-col min-h-[400px] lg:h-[calc(100vh-140px)] sticky top-24">
          <GitControls
            state={gitState}
            options={layoutOptions}
            onOptionsChange={setLayoutOptions}
            onExecuteCommand={handleExecuteCommand}
            onLoadPreset={handleLoadPreset}
            onResetRepo={handleResetRepo}
          />
        </div>

        {/* Right Column: Visual SVG Canvas Timeline + Command Console */}
        <div className="lg:col-span-8 flex flex-col gap-6 lg:h-[calc(100vh-140px)] min-h-0">
          
          {/* Upper Section: Beautiful SVGGitGraph Canvas Viewer */}
          <div className="flex-1 min-h-[300px] flex flex-col">
            <GitGraphCanvas
              state={gitState}
              options={layoutOptions}
              onExecuteCommand={handleExecuteCommand}
            />
          </div>

          {/* Lower Section: Full terminal console simulation shell */}
          <div className="h-[280px] min-h-[220px] flex flex-col">
            <GitTerminal
              state={gitState}
              lines={terminalLines}
              onExecuteCommand={handleExecuteCommand}
              onClear={handleClearTerminal}
            />
          </div>

        </div>

      </main>
    </div>
  );
}
