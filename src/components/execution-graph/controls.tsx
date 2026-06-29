import React, { useState } from "react";
import { ExecutionState, StepType, LayoutOptions } from "../../lib/types";
import { EXAMPLES } from "../../lib/execution-engine";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageSquare,
  Settings,
  BookOpen,
  RefreshCw,
  Plus,
  GitBranch,
  Send,
} from "lucide-react";

interface ExecutionControlsProps {
  state: ExecutionState;
  options: LayoutOptions;
  onOptionsChange: (opts: LayoutOptions) => void;
  onAddStep: (content: string, type: StepType, author?: string, nodeName?: string) => void;
  onForkFromCurrentHead: (runName: string) => void;
  onLoadExample: (exampleId: string) => void;
  onReset: () => void;
}

const STEP_TYPE_OPTIONS: { value: StepType; label: string }[] = [
  { value: "user", label: "User" },
  { value: "assistant", label: "Assistant" },
  { value: "tool_call", label: "Tool Call" },
  { value: "tool_result", label: "Tool Result" },
  { value: "node_output", label: "Node Output" },
  { value: "generic", label: "Generic" },
];

export const ExecutionControls: React.FC<ExecutionControlsProps> = ({
  state,
  options,
  onOptionsChange,
  onAddStep,
  onForkFromCurrentHead,
  onLoadExample,
  onReset,
}) => {
  const [stepContent, setStepContent] = useState("");
  const [stepType, setStepType] = useState<StepType>("user");
  const [showNewNodeInput, setShowNewNodeInput] = useState(false);
  const [newNodeName, setNewNodeName] = useState("");

  const activeRun = state.runs[state.cursor];

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!stepContent.trim()) return;
    onAddStep(stepContent.trim(), stepType);
    setStepContent("");
  };

  const handleNewNode = () => {
    if (!newNodeName.trim()) return;
    onForkFromCurrentHead(newNodeName.trim());
    setNewNodeName("");
    setShowNewNodeInput(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#18181B]/40 rounded-xl border border-zinc-800 backdrop-blur-sm overflow-hidden">
      <Tabs defaultValue="chat" className="flex flex-col h-full">
        <TabsList className="rounded-none border-b border-zinc-800/80 bg-zinc-950/40 h-auto p-1 justify-start gap-0">
          <TabsTrigger
            value="chat"
            className="flex-1 text-xs font-bold data-[state=active]:bg-zinc-800/80 data-[state=active]:text-white text-zinc-500 rounded-lg py-2 flex items-center gap-1.5"
          >
            <MessageSquare size={13} />
            Chat
          </TabsTrigger>
          <TabsTrigger
            value="examples"
            className="flex-1 text-xs font-bold data-[state=active]:bg-zinc-800/80 data-[state=active]:text-white text-zinc-500 rounded-lg py-2 flex items-center gap-1.5"
          >
            <BookOpen size={13} />
            Examples
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="flex-1 text-xs font-bold data-[state=active]:bg-zinc-800/80 data-[state=active]:text-white text-zinc-500 rounded-lg py-2 flex items-center gap-1.5"
          >
            <Settings size={13} />
            Layout
          </TabsTrigger>
        </TabsList>

        {/* ── CHAT TAB ── */}
        <TabsContent value="chat" className="flex-1 p-4 overflow-y-auto space-y-4 mt-0">
          {/* Active node indicator */}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/50">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse"
              style={{ backgroundColor: activeRun?.color ?? "#9CA3AF" }}
            />
            <div className="min-w-0">
              <span className="text-[10px] text-zinc-500 font-semibold uppercase block">Active Node</span>
              <span
                className="text-xs font-bold truncate block"
                style={{ color: activeRun?.color ?? "#9CA3AF" }}
              >
                {activeRun?.name ?? "none"}
              </span>
            </div>
          </div>

          {/* Message form */}
          <form onSubmit={handleSendMessage} className="space-y-2.5">
            <Textarea
              placeholder="Message content…"
              value={stepContent}
              onChange={(e) => setStepContent(e.target.value)}
              rows={3}
              className="bg-zinc-950/80 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-zinc-600 resize-none text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSendMessage();
              }}
            />

            {/* Type selector */}
            <select
              value={stepType}
              onChange={(e) => setStepType(e.target.value as StepType)}
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-300 outline-none focus:border-zinc-700"
            >
              {STEP_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={!stepContent.trim()}
                className="flex-1 h-9 text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white"
              >
                <Send size={13} />
                Send Message
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setShowNewNodeInput(!showNewNodeInput); setNewNodeName(""); }}
                className="h-9 text-xs font-bold border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 bg-transparent"
              >
                <Plus size={13} />
                New Node
              </Button>
            </div>

            <p className="text-[10px] text-zinc-600">⌘/Ctrl+Enter to send</p>
          </form>

          {/* New node inline form */}
          {showNewNodeInput && (
            <div className="p-3 rounded-lg border border-zinc-700/60 bg-zinc-900/40 space-y-2">
              <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wide flex items-center gap-1.5">
                <GitBranch size={11} />
                Connect new node from current head
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="node-name"
                  value={newNodeName}
                  onChange={(e) => setNewNodeName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newNodeName.trim()) handleNewNode();
                    if (e.key === "Escape") { setShowNewNodeInput(false); setNewNodeName(""); }
                  }}
                  className="h-8 text-xs bg-zinc-950/80 border-zinc-700 text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-zinc-600"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={handleNewNode}
                  disabled={!newNodeName.trim()}
                  className="h-8 text-xs bg-violet-600 hover:bg-violet-500 text-white"
                >
                  Create
                </Button>
              </div>
              <p className="text-[10px] text-zinc-600">Creates a new node continuing linearly from the active node's head.</p>
            </div>
          )}

          {/* Reset */}
          <Button
            variant="ghost"
            onClick={onReset}
            className="w-full text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40 border border-zinc-800 h-8"
          >
            <RefreshCw size={12} />
            Reset Graph
          </Button>
        </TabsContent>

        {/* ── EXAMPLES TAB ── */}
        <TabsContent value="examples" className="flex-1 p-4 overflow-y-auto space-y-4 mt-0">
          <p className="text-xs text-zinc-500 font-medium">
            Load a pre-built execution trace to explore different workflow patterns.
          </p>
          {EXAMPLES.map((ex) => (
            <div
              key={ex.id}
              className="p-3 rounded-lg border border-zinc-800/60 bg-zinc-950/40 hover:border-zinc-700 transition-all space-y-2"
            >
              <h4 className="text-xs font-bold text-zinc-200">{ex.name}</h4>
              <p className="text-[11px] text-zinc-400 leading-normal">{ex.description}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onLoadExample(ex.id)}
                className="h-7 text-[11px] border-zinc-700 text-zinc-300 hover:text-white bg-transparent hover:border-zinc-500"
              >
                Load Example
              </Button>
            </div>
          ))}
        </TabsContent>

        {/* ── SETTINGS TAB ── */}
        <TabsContent value="settings" className="flex-1 p-4 overflow-y-auto space-y-5 mt-0 text-xs">
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
        </TabsContent>
      </Tabs>
    </div>
  );
};
