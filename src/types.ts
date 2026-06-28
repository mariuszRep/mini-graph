export interface Commit {
  hash: string;
  parents: string[];
  message: string;
  author: string;
  date: string;
  branchName: string;
  tags: string[];
}

export interface Branch {
  name: string;
  color: string; // Tailwind color class or hex string
  target: string; // Last commit hash
}

export interface GitState {
  commits: Record<string, Commit>;
  branches: Record<string, Branch>;
  head: string; // Name of current branch, or direct commit hash (detached HEAD)
  commitOrder: string[]; // Chronological list of commit hashes
}

export interface LayoutOptions {
  orientation: "vertical" | "horizontal";
  rowHeight: number;
  columnWidth: number;
  nodeRadius: number;
  lineWidth: number;
  showTags: boolean;
  showComments: boolean;
  theme: "github" | "gitlab" | "neon" | "monochrome";
}

export interface PresetScenario {
  id: string;
  name: string;
  description: string;
  setupCommands: string[];
}

export interface TerminalLine {
  id: string;
  type: "command" | "output" | "error";
  text: string;
}
