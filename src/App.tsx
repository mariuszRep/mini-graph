import { useState, useEffect } from "react";
import { ExecutionState, LayoutOptions, StepType } from "./lib/types";
import { ExecutionCanvas } from "./components/execution-graph/canvas";
import { ExecutionControls } from "./components/execution-graph/controls";
import {
  createInitialState,
  addStep,
  forkRun,
  switchRun,
  addLabel,
  EXAMPLES,
} from "./lib/execution-engine";
import { ConversationView } from "./components/conversation-view";
import {
  Zap,
  Sparkles,
  Network,
  Copy,
  Check,
  MessageSquare,
} from "lucide-react";

type AppView = "playground" | "conversation";

const LOCAL_STORAGE_KEY = "mini-graph-execution-state";

export default function App() {
  const [view, setView] = useState<AppView>("playground");
  const [state, setState] = useState<ExecutionState>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return createInitialState();
  });

  const [layoutOptions, setLayoutOptions] = useState<LayoutOptions>({
    orientation: "vertical",
    rowHeight: 32,
    columnWidth: 16,
    nodeRadius: 4,
    lineWidth: 2,
    nodeHeaderHeight: 24,
    showLabels: true,
    showComments: true,
    theme: "github",
  });

  const [copiedInstall, setCopiedInstall] = useState(false);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const dispatch = (result: { state: ExecutionState; error?: string }) => {
    if (!result.error) setState(result.state);
  };

  const handleAddStep = (content: string, type: StepType, author?: string, nodeName?: string) => {
    dispatch(addStep(state, content, type, author, nodeName));
  };

  const handleForkRun = (fromStepId: string, runName: string) => {
    dispatch(forkRun(state, fromStepId, runName));
  };

  const handleForkFromCurrentHead = (runName: string) => {
    const head = state.runs[state.cursor]?.head;
    if (head) dispatch(forkRun(state, head, runName));
  };

  const handleSwitchRun = (runId: string) => {
    dispatch(switchRun(state, runId));
  };

  const handleAddLabel = (label: string, stepId: string) => {
    dispatch(addLabel(state, label, stepId));
  };

  const handleLoadExample = (exampleId: string) => {
    const ex = EXAMPLES.find((e) => e.id === exampleId);
    if (ex) setState(ex.state);
  };

  const handleReset = () => setState(createInitialState());

  const numSteps = Object.keys(state.steps).length;
  const numNodes = Object.keys(state.runs).length;
  const activeRun = state.runs[state.cursor];

  const installSnippet = "npx shadcn@latest add https://mini-graph.dev/r/execution-graph.json";

  const handleCopyInstall = () => {
    navigator.clipboard.writeText(installSnippet);
    setCopiedInstall(true);
    setTimeout(() => setCopiedInstall(false), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans select-none antialiased">
      {/* Header */}
      <header className="border-b border-zinc-900 bg-[#0F0F12]/80 backdrop-blur-md px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">

          {/* Logo + title */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 shadow-md shadow-sky-500/10 flex items-center justify-center text-white">
              <Network className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-white">Execution Graph</h1>
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-sky-950 text-sky-400 px-2 py-0.5 rounded border border-sky-900/60 flex items-center gap-1">
                  <Sparkles size={9} />
                  shadcn/ui
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-medium">
                Workflow &amp; agent execution trace visualizer · shadcn-compatible component
              </p>
            </div>
          </div>

          {/* View tabs */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-zinc-900/80 border border-zinc-800/60">
            <button
              onClick={() => setView("playground")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                view === "playground"
                  ? "bg-zinc-700 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Network size={12} />
              Playground
            </button>
            <button
              onClick={() => setView("conversation")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                view === "conversation"
                  ? "bg-zinc-700 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <MessageSquare size={12} />
              Conversation
            </button>
          </div>

          {/* Install snippet + stats */}
          <div className="flex items-center gap-3 text-xs font-mono">
            {/* Install snippet */}
            <button
              onClick={handleCopyInstall}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800/60 hover:border-zinc-700 transition-colors text-zinc-400 hover:text-zinc-200 max-w-xs"
              title="Click to copy install command"
            >
              <span className="truncate text-[10px]">{installSnippet}</span>
              {copiedInstall ? <Check size={11} className="text-emerald-400 shrink-0" /> : <Copy size={11} className="shrink-0" />}
            </button>

            {/* Steps stat */}
            <div className="px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800/60 flex items-center gap-2">
              <span className="p-0.5 rounded bg-zinc-800 text-sky-400">
                <Zap size={12} />
              </span>
              <span className="text-zinc-500">Steps:</span>
              <span className="font-bold text-white">{numSteps}</span>
            </div>

            {/* Nodes stat */}
            <div className="px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800/60 flex items-center gap-2">
              <span className="p-0.5 rounded bg-zinc-800 text-emerald-400">
                <Network size={12} />
              </span>
              <span className="text-zinc-500">Nodes:</span>
              <span className="font-bold text-white">{numNodes}</span>
            </div>

            {/* Active node */}
            <div className="px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800/60 flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse"
                style={{ backgroundColor: activeRun?.color ?? "#9CA3AF" }}
              />
              <span className="text-zinc-500">Node:</span>
              <span className="font-bold" style={{ color: activeRun?.color ?? "#9CA3AF" }}>
                {activeRun?.name ?? "—"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main workspace */}
      {view === "playground" ? (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
          {/* Sidebar */}
          <div className="lg:col-span-4 flex flex-col min-h-[400px] lg:h-[calc(100vh-140px)] sticky top-24">
            <ExecutionControls
              state={state}
              options={layoutOptions}
              onOptionsChange={setLayoutOptions}
              onAddStep={handleAddStep}
              onForkFromCurrentHead={handleForkFromCurrentHead}
              onLoadExample={handleLoadExample}
              onReset={handleReset}
            />
          </div>

          {/* Canvas */}
          <div className="lg:col-span-8 flex flex-col lg:h-[calc(100vh-140px)] min-h-[400px]">
            <ExecutionCanvas
              state={state}
              options={layoutOptions}
              onForkFromStep={handleForkRun}
              onSetCursorToRun={handleSwitchRun}
              onAddLabel={handleAddLabel}
            />
          </div>
        </main>
      ) : (
        <main className="flex flex-1 min-h-0 w-4/5 mx-auto overflow-hidden" style={{ height: "calc(100vh - 73px)" }}>
          <ConversationView />
        </main>
      )}
    </div>
  );
}
