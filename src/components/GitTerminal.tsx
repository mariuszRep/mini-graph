import React, { useState, useRef, useEffect } from "react";
import { TerminalLine, GitState } from "../types";
import { Terminal, Trash2, ArrowRightLeft, Sparkles, HelpCircle, ChevronRight } from "lucide-react";

interface GitTerminalProps {
  state: GitState;
  lines: TerminalLine[];
  onExecuteCommand: (cmd: string) => void;
  onClear: () => void;
}

export const GitTerminal: React.FC<GitTerminalProps> = ({
  state,
  lines,
  onExecuteCommand,
  onClear,
}) => {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  // Handle keydown for Up/Down arrows to scroll command history
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex < history.length) {
        setHistoryIndex(nextIndex);
        setInput(history[history.length - 1 - nextIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = historyIndex - 1;
      if (nextIndex >= 0) {
        setHistoryIndex(nextIndex);
        setInput(history[history.length - 1 - nextIndex]);
      } else {
        setHistoryIndex(-1);
        setInput("");
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    if (trimmed === "clear") {
      onClear();
      setInput("");
      setHistoryIndex(-1);
      return;
    }

    if (trimmed === "help") {
      onExecuteCommand("help");
      setInput("");
      setHistoryIndex(-1);
      return;
    }

    onExecuteCommand(trimmed);
    setHistory((prev) => [...prev, trimmed]);
    setInput("");
    setHistoryIndex(-1);
  };

  const handleShortcutClick = (cmd: string) => {
    setInput(cmd);
    inputRef.current?.focus();
  };

  // Get current head label
  const isHeadAttached = !!state.branches[state.head];
  const headLabel = isHeadAttached ? state.head : `${state.head.slice(0, 7)} (detached)`;

  // Quick helper suggestions
  const suggestions = [
    { label: "Commit", cmd: 'git commit -m "feat: add secure auth route"' },
    { label: "Branch", cmd: "git branch feature/checkout" },
    { label: "Checkout", cmd: "git checkout feature/checkout" },
    { label: "Merge", cmd: "git merge feature/checkout" },
    { label: "Log", cmd: "git log" },
  ];

  return (
    <div className="flex flex-col h-full bg-zinc-950 rounded-xl border border-zinc-800 font-mono text-sm overflow-hidden text-zinc-300 shadow-xl" id="git-terminal">
      {/* Terminal Titlebar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded bg-zinc-800 text-sky-400">
            <Terminal size={14} />
          </span>
          <span className="text-xs font-bold text-zinc-300">Terminal Shell Console</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onClear}
            className="p-1 px-2 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 rounded text-xs font-semibold flex items-center gap-1 transition-all"
            title="Clear terminal log"
          >
            <Trash2 size={12} />
            Clear
          </button>
        </div>
      </div>

      {/* Terminal Logs Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-2.5 scrollbar-thin scrollbar-thumb-zinc-800">
        <div className="text-xs text-zinc-500 italic pb-1">
          Welcome to Git Shell Sandbox. Type commands below (e.g. `git commit -m "feat: test"`) or click the shortcuts. Arrow keys cycle through run history.
        </div>

        {lines.map((line) => {
          if (line.type === "command") {
            return (
              <div key={line.id} className="flex items-start gap-1 font-semibold text-zinc-100">
                <span className="text-emerald-500">➜</span>
                <span className="text-zinc-500 text-xs mr-1">git-sandbox</span>
                <span>{line.text}</span>
              </div>
            );
          } else if (line.type === "error") {
            return (
              <pre
                key={line.id}
                className="text-red-400 pl-4 whitespace-pre-wrap font-sans text-xs border-l border-red-900 bg-red-950/10 py-1"
              >
                {line.text}
              </pre>
            );
          } else {
            return (
              <pre
                key={line.id}
                className="text-zinc-400 pl-4 whitespace-pre-wrap font-mono text-xs border-l border-zinc-800 py-1 leading-relaxed"
              >
                {line.text}
              </pre>
            );
          }
        })}
        <div ref={terminalEndRef} />
      </div>

      {/* Quick click suggestions bar */}
      <div className="px-4 py-2 bg-zinc-900/60 border-t border-zinc-900 flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-[11px] text-zinc-500 font-bold uppercase flex items-center gap-1 mr-1.5">
          <Sparkles size={11} className="text-sky-500" />
          Shortcuts:
        </span>
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            onClick={() => handleShortcutClick(s.cmd)}
            className="px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer text-[11px]"
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Command prompt form input */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 px-4 py-3 bg-zinc-900 border-t border-zinc-800"
      >
        <div className="flex items-center gap-1 text-zinc-400 whitespace-nowrap text-xs">
          <span className="text-emerald-500 font-bold">coder@git:~/playground</span>
          <span className="text-zinc-500">on</span>
          <span className="text-purple-400 font-bold"> {headLabel}</span>
          <span className="text-zinc-500 font-bold">$</span>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="git commit -m 'new feat'..."
          className="flex-1 bg-transparent border-none outline-none text-zinc-100 placeholder-zinc-600 focus:ring-0 text-sm font-mono caret-sky-400"
          autoFocus
          id="terminal-input"
        />
        <button
          type="submit"
          className="p-1 px-2 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow shadow-sky-500/25"
        >
          Run
          <ChevronRight size={13} />
        </button>
      </form>
    </div>
  );
};
