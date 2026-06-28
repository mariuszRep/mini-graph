import { GitState, Commit, Branch, PresetScenario } from "../types";

// Colors for branches
export const BRANCH_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#8B5CF6", // Violet
  "#EF4444", // Red
  "#06B6D4", // Cyan
  "#14B8A6", // Teal
];

// Helper to generate a unique random hash (7 chars)
export function generateHash(): string {
  return Math.random().toString(16).substring(2, 9);
}

// Check if a commit is an ancestor of another commit
export function isAncestor(
  state: GitState,
  ancestorHash: string,
  descendantHash: string
): boolean {
  if (ancestorHash === descendantHash) return true;
  
  const visited = new Set<string>();
  const queue = [descendantHash];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === ancestorHash) return true;

    if (visited.has(current)) continue;
    visited.add(current);

    const commit = state.commits[current];
    if (commit) {
      queue.push(...commit.parents);
    }
  }

  return false;
}

// Find all ancestors of a commit
export function getAncestors(state: GitState, hash: string): Set<string> {
  const ancestors = new Set<string>();
  const queue = [hash];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (ancestors.has(current)) continue;
    
    ancestors.add(current);
    const commit = state.commits[current];
    if (commit) {
      queue.push(...commit.parents);
    }
  }

  return ancestors;
}

// Find the Lowest Common Ancestor (LCA) of two commits
export function findLCA(state: GitState, hashA: string, hashB: string): string | null {
  if (!hashA || !hashB) return null;
  
  const ancestorsA = getAncestors(state, hashA);
  const ancestorsB = getAncestors(state, hashB);
  
  // Find intersection
  const intersection = new Set<string>();
  for (const h of ancestorsA) {
    if (ancestorsB.has(h)) {
      intersection.add(h);
    }
  }
  
  if (intersection.size === 0) return null;

  // We want the most recent common ancestor.
  // In our chronological order, this is the one that appears latest in commitOrder.
  for (let i = state.commitOrder.length - 1; i >= 0; i--) {
    const hash = state.commitOrder[i];
    if (intersection.has(hash)) {
      return hash;
    }
  }

  return Array.from(intersection)[0] || null;
}

// Get the commit hash pointed to by HEAD
export function getHeadCommitHash(state: GitState): string | null {
  if (!state.head) return null;
  if (state.branches[state.head]) {
    return state.branches[state.head].target;
  }
  if (state.commits[state.head]) {
    return state.head; // Detached HEAD
  }
  return null;
}

// Create an initial empty Git state
export function createInitialState(): GitState {
  const initialHash = "a1b2c3d";
  const initialCommit: Commit = {
    hash: initialHash,
    parents: [],
    message: "Initial commit",
    author: "coder <coder@aistudio.dev>",
    date: new Date().toISOString(),
    branchName: "main",
    tags: [],
  };

  const initialBranch: Branch = {
    name: "main",
    color: BRANCH_COLORS[0],
    target: initialHash,
  };

  return {
    commits: { [initialHash]: initialCommit },
    branches: { main: initialBranch },
    head: "main",
    commitOrder: [initialHash],
  };
}

// Parse custom command arguments (simple parser)
export function parseArgs(args: string[]): Record<string, string | boolean> {
  const parsed: Record<string, string | boolean> = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      if (i + 1 < args.length && !args[i + 1].startsWith("-")) {
        parsed[key] = args[i + 1].replace(/^["']|["']$/g, ""); // strip quotes
        i++;
      } else {
        parsed[key] = true;
      }
    } else if (arg.startsWith("-")) {
      const key = arg.slice(1);
      if (i + 1 < args.length && !args[i + 1].startsWith("-")) {
        parsed[key] = args[i + 1].replace(/^["']|["']$/g, "");
        i++;
      } else {
        parsed[key] = true;
      }
    }
  }
  return parsed;
}

// Execute a git command and return new state + output/error
export function executeCommand(
  state: GitState,
  commandStr: string
): { state: GitState; output: string; error?: string } {
  const trimmed = commandStr.trim();
  if (!trimmed.startsWith("git ")) {
    return {
      state,
      output: "",
      error: `Command must start with 'git'. Try 'git commit -m "message"' or typing 'help'.`,
    };
  }

  const parts = trimmed.split(/\s+/);
  const gitCmd = parts[1]; // e.g., 'commit', 'checkout', 'branch', 'merge', etc.
  const argsList = parts.slice(2);

  // Re-join quoted strings in arguments (e.g. -m "hello world")
  const args: string[] = [];
  let inQuotes = false;
  let quoteChar = "";
  let currentArg = "";

  for (let i = 0; i < argsList.length; i++) {
    const part = argsList[i];
    if (!inQuotes && (part.startsWith('"') || part.startsWith("'"))) {
      inQuotes = true;
      quoteChar = part[0];
      currentArg = part.slice(1);
      if (part.endsWith(quoteChar) && part.length > 1) {
        inQuotes = false;
        args.push(currentArg.slice(0, -1));
        currentArg = "";
      }
    } else if (inQuotes) {
      if (part.endsWith(quoteChar)) {
        inQuotes = false;
        currentArg += " " + part.slice(0, -1);
        args.push(currentArg);
        currentArg = "";
      } else {
        currentArg += " " + part;
      }
    } else {
      args.push(part);
    }
  }
  if (inQuotes) {
    args.push(currentArg); // fallback for unclosed quotes
  }

  switch (gitCmd) {
    case "commit": {
      const parsed = parseArgs(args);
      let message = (parsed["m"] || parsed["message"]) as string;
      if (!message) {
        // Find if they just passed a string at the end as fallback
        const mIndex = args.indexOf("-m");
        if (mIndex !== -1 && mIndex + 1 < args.length) {
          message = args[mIndex + 1];
        } else {
          return { state, output: "", error: `error: switch \`m' requires a value\nUsage: git commit -m "commit message"` };
        }
      }

      const author = ((parsed["author"] || "coder <coder@aistudio.dev>") as string);
      const headHash = getHeadCommitHash(state);
      if (!headHash) {
        return { state, output: "", error: "error: HEAD is in an invalid state" };
      }

      const currentBranchName = state.branches[state.head] ? state.head : "";
      const commitBranch = currentBranchName || state.commits[headHash].branchName;

      const newHash = generateHash();
      const newCommit: Commit = {
        hash: newHash,
        parents: [headHash],
        message,
        author,
        date: new Date().toISOString(),
        branchName: commitBranch,
        tags: [],
      };

      const newState = { ...state };
      newState.commits = { ...state.commits, [newHash]: newCommit };
      newState.commitOrder = [...state.commitOrder, newHash];

      if (currentBranchName) {
        newState.branches = {
          ...state.branches,
          [currentBranchName]: {
            ...state.branches[currentBranchName],
            target: newHash,
          },
        };
      } else {
        // Detached HEAD updates to the new commit hash
        newState.head = newHash;
      }

      return {
        state: newState,
        output: `[${currentBranchName || "detached HEAD"} ${newHash}] ${message}\n 1 file changed, 1 insertion(+)`,
      };
    }

    case "branch": {
      if (args.length === 0) {
        // List branches
        const branchList = Object.keys(state.branches)
          .map((name) => {
            const isCurrent = state.head === name;
            return `${isCurrent ? "* " : "  "}${name}`;
          })
          .join("\n");
        return { state, output: branchList };
      }

      // Check for branch deletion
      const dIndex = args.indexOf("-d") !== -1 ? args.indexOf("-d") : args.indexOf("--delete");
      if (dIndex !== -1) {
        const branchToDelete = args[dIndex + 1] || args[dIndex === 0 ? 1 : 0];
        if (!branchToDelete) {
          return { state, output: "", error: "error: branch name required" };
        }
        if (branchToDelete === "main") {
          return { state, output: "", error: "error: cannot delete branch 'main'" };
        }
        if (state.head === branchToDelete) {
          return { state, output: "", error: `error: cannot delete branch '${branchToDelete}' checked out at '${state.branches[branchToDelete].target}'` };
        }
        if (!state.branches[branchToDelete]) {
          return { state, output: "", error: `error: branch '${branchToDelete}' not found` };
        }

        const newState = { ...state };
        const newBranches = { ...state.branches };
        delete newBranches[branchToDelete];
        newState.branches = newBranches;

        return {
          state: newState,
          output: `Deleted branch ${branchToDelete} (was ${state.branches[branchToDelete].target}).`,
        };
      }

      const branchName = args[0];
      if (state.branches[branchName]) {
        return { state, output: "", error: `fatal: A branch named '${branchName}' already exists.` };
      }

      const startPoint = args[1] || getHeadCommitHash(state);
      if (!startPoint || !state.commits[startPoint]) {
        return { state, output: "", error: `fatal: Not a valid object name: '${startPoint}'.` };
      }

      const branchColor = BRANCH_COLORS[Object.keys(state.branches).length % BRANCH_COLORS.length];
      const newBranch: Branch = {
        name: branchName,
        color: branchColor,
        target: startPoint,
      };

      const newState = {
        ...state,
        branches: {
          ...state.branches,
          [branchName]: newBranch,
        },
      };

      return {
        state: newState,
        output: `Branch '${branchName}' set up to track commit '${startPoint}'.`,
      };
    }

    case "checkout": {
      const target = args[0];
      if (!target) {
        return { state, output: "", error: "error: branch name or commit hash required\nUsage: git checkout <branch-or-commit>" };
      }

      // Check if it's a branch
      if (state.branches[target]) {
        const branch = state.branches[target];
        return {
          state: { ...state, head: target },
          output: `Switched to branch '${target}'\nYour branch is up to date with origin/` + target,
        };
      }

      // Check if it's a commit (full or prefix matching)
      const foundHash = Object.keys(state.commits).find(
        (h) => h === target || h.startsWith(target)
      );

      if (foundHash) {
        return {
          state: { ...state, head: foundHash },
          output: `Note: switching to '${target}'.\n\nYou are in 'detached HEAD' state. You can look around, make experimental\nchanges and commit them...`,
        };
      }

      // Check if user is trying to create and checkout
      const bIndex = args.indexOf("-b");
      if (bIndex !== -1 && bIndex + 1 < args.length) {
        const newBranchName = args[bIndex + 1];
        if (state.branches[newBranchName]) {
          return { state, output: "", error: `fatal: A branch named '${newBranchName}' already exists.` };
        }
        const startPoint = getHeadCommitHash(state)!;
        const branchColor = BRANCH_COLORS[Object.keys(state.branches).length % BRANCH_COLORS.length];
        
        const newBranch: Branch = {
          name: newBranchName,
          color: branchColor,
          target: startPoint,
        };

        const newState = {
          ...state,
          branches: {
            ...state.branches,
            [newBranchName]: newBranch,
          },
          head: newBranchName,
        };

        return {
          state: newState,
          output: `Switched to a new branch '${newBranchName}'`,
        };
      }

      return { state, output: "", error: `error: pathspec '${target}' did not match any file(s) known to git` };
    }

    case "merge": {
      const targetBranch = args[0];
      if (!targetBranch) {
        return { state, output: "", error: "error: branch to merge required\nUsage: git merge <branch>" };
      }

      if (!state.branches[targetBranch]) {
        return { state, output: "", error: `merge: ${targetBranch} - not something we can merge` };
      }

      const currentBranchName = state.branches[state.head] ? state.head : "";
      if (!currentBranchName) {
        return { state, output: "", error: "fatal: You are in 'detached HEAD' state. Please checkout a branch first." };
      }

      if (currentBranchName === targetBranch) {
        return { state, output: "Already up to date." };
      }

      const headHash = state.branches[currentBranchName].target;
      const targetHash = state.branches[targetBranch].target;

      // 1. Check if target commit is already merged in current branch
      if (isAncestor(state, targetHash, headHash)) {
        return { state, output: "Already up to date." };
      }

      // 2. Check if current branch is ancestor of target branch (Fast-forward)
      const parsed = parseArgs(args);
      const noFF = parsed["no-ff"] as boolean;
      
      if (isAncestor(state, headHash, targetHash) && !noFF) {
        // Fast-Forward! Just advance current branch to target commit
        const newState = { ...state };
        newState.branches = {
          ...state.branches,
          [currentBranchName]: {
            ...state.branches[currentBranchName],
            target: targetHash,
          },
        };
        return {
          state: newState,
          output: `Updating ${headHash.slice(0, 7)}..${targetHash.slice(0, 7)}\nFast-forward\n Merged branch '${targetBranch}' into '${currentBranchName}' (Fast-Forward)`,
        };
      }

      // 3. True Merge (Create merge commit)
      const newHash = generateHash();
      const defaultMsg = `Merge branch '${targetBranch}' into ${currentBranchName}`;
      const msg = (parsed["m"] || parsed["message"] || defaultMsg) as string;

      const newCommit: Commit = {
        hash: newHash,
        parents: [headHash, targetHash],
        message: msg,
        author: "coder <coder@aistudio.dev>",
        date: new Date().toISOString(),
        branchName: currentBranchName,
        tags: [],
      };

      const newState = { ...state };
      newState.commits = { ...state.commits, [newHash]: newCommit };
      newState.commitOrder = [...state.commitOrder, newHash];
      newState.branches = {
        ...state.branches,
        [currentBranchName]: {
          ...state.branches[currentBranchName],
          target: newHash,
        },
      };

      return {
        state: newState,
        output: `Merge made by the 'ort' strategy.\n [${currentBranchName} ${newHash}] ${msg}`,
      };
    }

    case "rebase": {
      const upstreamBranch = args[0];
      if (!upstreamBranch) {
        return { state, output: "", error: "error: branch to rebase onto required\nUsage: git rebase <branch>" };
      }

      if (!state.branches[upstreamBranch]) {
        return { state, output: "", error: `fatal: no such branch: ${upstreamBranch}` };
      }

      const currentBranchName = state.branches[state.head] ? state.head : "";
      if (!currentBranchName) {
        return { state, output: "", error: "fatal: You are in 'detached HEAD' state. Please checkout a branch first." };
      }

      if (currentBranchName === upstreamBranch) {
        return { state, output: "Current branch is up to date." };
      }

      const headHash = state.branches[currentBranchName].target;
      const upstreamHash = state.branches[upstreamBranch].target;

      // 1. If upstream is already ancestor of HEAD, nothing to do
      if (isAncestor(state, upstreamHash, headHash)) {
        return { state, output: `Current branch ${currentBranchName} is up to date.` };
      }

      // 2. If HEAD is ancestor of upstream, fast-forward current branch to upstream
      if (isAncestor(state, headHash, upstreamHash)) {
        const newState = { ...state };
        newState.branches = {
          ...state.branches,
          [currentBranchName]: {
            ...state.branches[currentBranchName],
            target: upstreamHash,
          },
        };
        return {
          state: newState,
          output: `Successfully rebased and updated refs/heads/${currentBranchName} (Fast-Forward to ${upstreamBranch}).`,
        };
      }

      // 3. True rebase: find LCA (merge base)
      const lcaHash = findLCA(state, headHash, upstreamHash);
      if (!lcaHash) {
        return { state, output: "", error: "fatal: No common ancestor found. Cannot rebase." };
      }

      // Find all commits on current branch since LCA
      // We can collect them by traversing back from HEAD to LCA.
      const commitsToReplay: Commit[] = [];
      let currentHash: string | null = headHash;
      const visited = new Set<string>();

      while (currentHash && currentHash !== lcaHash) {
        if (visited.has(currentHash)) break;
        visited.add(currentHash);

        const commit = state.commits[currentHash];
        if (!commit) break;

        // Skip merge commits during rebase
        if (commit.parents.length <= 1) {
          commitsToReplay.push(commit);
        }
        
        currentHash = commit.parents[0] || null; // Follow primary parent
      }

      // Reverse so we replay in chronological order (oldest first)
      commitsToReplay.reverse();

      if (commitsToReplay.length === 0) {
        return { state, output: "No commits to replay. Already up to date." };
      }

      const newState = { ...state };
      newState.commits = { ...state.commits };
      newState.commitOrder = [...state.commitOrder];

      let lastParentHash = upstreamHash;
      const replayedHashes: string[] = [];

      for (const commit of commitsToReplay) {
        const newHash = generateHash();
        const replayedCommit: Commit = {
          ...commit,
          hash: newHash,
          parents: [lastParentHash],
          message: `${commit.message} (rebased)`,
          date: new Date().toISOString(),
          branchName: currentBranchName,
          tags: [...commit.tags], // copy tags
        };

        newState.commits[newHash] = replayedCommit;
        newState.commitOrder.push(newHash);
        lastParentHash = newHash;
        replayedHashes.push(newHash);
      }

      // Point current branch to the last replayed commit
      newState.branches = {
        ...state.branches,
        [currentBranchName]: {
          ...state.branches[currentBranchName],
          target: lastParentHash,
        },
      };

      const logMsg = replayedHashes
        .map((h, idx) => `Applying: ${commitsToReplay[idx].message}`)
        .join("\n");

      return {
        state: newState,
        output: `Successfully rebased and updated refs/heads/${currentBranchName}.\n${logMsg}`,
      };
    }

    case "tag": {
      if (args.length === 0) {
        // List tags
        const allTags = Object.values(state.commits)
          .flatMap((c) => c.tags)
          .join("\n");
        return { state, output: allTags || "No tags created." };
      }

      const tagName = args[0];
      const targetHash = args[1] || getHeadCommitHash(state);

      if (!targetHash || !state.commits[targetHash]) {
        return { state, output: "", error: `fatal: Failed to resolve '${targetHash}' as a valid commit.` };
      }

      // Check if tag already exists and remove it first
      const newState = { ...state };
      newState.commits = { ...state.commits };

      for (const hash of Object.keys(newState.commits)) {
        if (newState.commits[hash].tags.includes(tagName)) {
          newState.commits[hash] = {
            ...newState.commits[hash],
            tags: newState.commits[hash].tags.filter((t) => t !== tagName),
          };
        }
      }

      // Add tag to target commit
      newState.commits[targetHash] = {
        ...newState.commits[targetHash],
        tags: [...newState.commits[targetHash].tags, tagName],
      };

      return {
        state: newState,
        output: `Created tag '${tagName}' pointing to commit '${targetHash.slice(0, 7)}'.`,
      };
    }

    case "reset": {
      const parsed = parseArgs(args);
      const isHard = parsed["hard"] as boolean; // in our simulation, hard and soft reset both move pointer
      
      // Find the commit hash to reset to
      let targetRef = args.find((a) => !a.startsWith("-"));
      if (!targetRef) {
        targetRef = "HEAD";
      }

      let targetHash: string | null = null;
      if (targetRef === "HEAD") {
        targetHash = getHeadCommitHash(state);
      } else if (state.branches[targetRef]) {
        targetHash = state.branches[targetRef].target;
      } else if (state.commits[targetRef]) {
        targetHash = targetRef;
      } else {
        // prefix match
        targetHash = Object.keys(state.commits).find((h) => h.startsWith(targetRef!)) || null;
      }

      if (!targetHash) {
        return { state, output: "", error: `fatal: ambiguous argument '${targetRef}': unknown revision or path not in the working tree.` };
      }

      const currentBranchName = state.branches[state.head] ? state.head : "";
      const newState = { ...state };

      if (currentBranchName) {
        newState.branches = {
          ...state.branches,
          [currentBranchName]: {
            ...state.branches[currentBranchName],
            target: targetHash,
          },
        };
      } else {
        newState.head = targetHash;
      }

      return {
        state: newState,
        output: `HEAD is now at ${targetHash.slice(0, 7)} ${state.commits[targetHash].message}`,
      };
    }

    case "cherry-pick": {
      const targetRef = args[0];
      if (!targetRef) {
        return { state, output: "", error: "error: commit to cherry-pick is required\nUsage: git cherry-pick <commit>" };
      }

      let targetHash: string | null = null;
      if (state.commits[targetRef]) {
        targetHash = targetRef;
      } else {
        targetHash = Object.keys(state.commits).find((h) => h.startsWith(targetRef)) || null;
      }

      if (!targetHash) {
        return { state, output: "", error: `fatal: bad revision '${targetRef}'` };
      }

      const targetCommit = state.commits[targetHash];
      const headHash = getHeadCommitHash(state);

      if (!headHash) {
        return { state, output: "", error: "fatal: HEAD is in an invalid state" };
      }

      const currentBranchName = state.branches[state.head] ? state.head : "";
      const commitBranch = currentBranchName || state.commits[headHash].branchName;

      const newHash = generateHash();
      const newCommit: Commit = {
        hash: newHash,
        parents: [headHash],
        message: `${targetCommit.message} (cherry-picked from ${targetHash.slice(0, 7)})`,
        author: targetCommit.author,
        date: new Date().toISOString(),
        branchName: commitBranch,
        tags: [],
      };

      const newState = { ...state };
      newState.commits = { ...state.commits, [newHash]: newCommit };
      newState.commitOrder = [...state.commitOrder, newHash];

      if (currentBranchName) {
        newState.branches = {
          ...state.branches,
          [currentBranchName]: {
            ...state.branches[currentBranchName],
            target: newHash,
          },
        };
      } else {
        newState.head = newHash;
      }

      return {
        state: newState,
        output: `[${currentBranchName || "detached HEAD"} ${newHash}] ${newCommit.message}\n 1 file changed, 1 insertion(+)`,
      };
    }

    case "log": {
      // Return log
      const logLines: string[] = [];
      const order = [...state.commitOrder].reverse(); // newest first
      
      for (const hash of order) {
        const commit = state.commits[hash];
        const isHead = getHeadCommitHash(state) === hash;
        const pointingRefs: string[] = [];
        
        if (isHead) pointingRefs.push("HEAD");
        for (const [bName, branch] of Object.entries(state.branches)) {
          if (branch.target === hash) {
            pointingRefs.push(bName);
          }
        }
        for (const tag of commit.tags) {
          pointingRefs.push(`tag: ${tag}`);
        }

        const refStr = pointingRefs.length > 0 ? ` (\x1b[33m${pointingRefs.join(", ")}\x1b[0m)` : "";
        logLines.push(`commit \x1b[33m${hash}\x1b[0m${refStr}`);
        logLines.push(`Author: ${commit.author}`);
        logLines.push(`Date:   ${new Date(commit.date).toLocaleDateString()}`);
        logLines.push(`\n    ${commit.message}\n`);
      }

      return { state, output: logLines.join("\n") };
    }

    default:
      return {
        state,
        output: "",
        error: `Unknown command 'git ${gitCmd}'. Try 'commit', 'checkout', 'branch', 'merge', 'rebase', 'tag', 'reset', 'cherry-pick' or 'log'.`,
      };
  }
}

// Scenarios setup
export const PRESETS: PresetScenario[] = [
  {
    id: "basic",
    name: "Basic Workflow",
    description: "Learn commit creation, branching out, working in parallel, and merging back into main.",
    setupCommands: [
      "git commit -m \"Add landing page layout\"",
      "git branch feature/checkout",
      "git checkout feature/checkout",
      "git commit -m \"feat: create stripe checkout button\"",
      "git checkout main",
      "git commit -m \"fix: fix mobile header navbar padding\"",
      "git checkout feature/checkout",
      "git commit -m \"feat: connect backend callback webhooks\"",
      "git checkout main",
      "git merge feature/checkout -m \"Merge feature/checkout into main\""
    ]
  },
  {
    id: "rebase",
    name: "Git Rebase Demonstration",
    description: "See how rebasing lifts feature commits and reapplies them sequentially on top of another branch.",
    setupCommands: [
      "git commit -m \"Setup API client utilities\"",
      "git branch feature/dashboard",
      "git checkout feature/dashboard",
      "git commit -m \"feat: build user profile widget\"",
      "git checkout main",
      "git commit -m \"docs: update contributing guidelines\"",
      "git checkout feature/dashboard",
      "git commit -m \"feat: wire profile charts using D3\"",
      "git checkout main",
      "git commit -m \"refactor: improve error logging module\"",
      "git checkout feature/dashboard"
    ]
  },
  {
    id: "detached",
    name: "Detached HEAD",
    description: "Explore checkout of specific commit hashes directly to inspect state without being on a branch.",
    setupCommands: [
      "git commit -m \"Implement routing logic\"",
      "git commit -m \"Add user login screen container\"",
      "git commit -m \"Add password reset modal dialog\"",
      "git commit -m \"fix: repair authentication redirect loop\"",
      "git checkout a1b2c3d" // checkout first commit
    ]
  },
  {
    id: "conflict",
    name: "Complex Branching & Tagging",
    description: "Demonstrates multiple parallel branches, releases via tags, and cherry-picking critical fixes.",
    setupCommands: [
      "git commit -m \"Core: introduce redux store state management\"",
      "git tag v1.0.0",
      "git branch v1-hotfixes",
      "git branch feature/reports",
      "git checkout feature/reports",
      "git commit -m \"feat: write sales report export to CSV\"",
      "git checkout v1-hotfixes",
      "git commit -m \"fix: core redux store leak in production\"",
      "git tag v1.0.1",
      "git checkout main",
      "git commit -m \"chore: bump dependencies list\"",
      "git cherry-pick v1-hotfixes"
    ]
  }
];

// Helper to fully load a scenario from scratch
export function loadScenario(presetId: string): GitState {
  const preset = PRESETS.find((p) => p.id === presetId);
  if (!preset) return createInitialState();

  let state = createInitialState();
  // We can strip out the a1b2c3d commit to avoid double-initiating or let the preset build on top.
  // Actually, let's execute each command in order starting with the default state.
  for (const cmd of preset.setupCommands) {
    // If command checkout is "git checkout a1b2c3d" but the initial hash changed, we map the target.
    // However, our initial state *does* have "a1b2c3d" as the first commit! So "git checkout a1b2c3d" will work perfectly.
    const res = executeCommand(state, cmd);
    if (!res.error) {
      state = res.state;
    }
  }

  return state;
}
