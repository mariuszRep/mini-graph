import { GitState, Commit, LayoutOptions } from "../types";

export interface RenderCommit {
  hash: string;
  x: number;
  y: number;
  row: number;
  col: number;
  color: string;
  isHead: boolean;
  commit: Commit;
}

export interface RenderPath {
  id: string;
  d: string;
  color: string;
  isMerge: boolean;
}

export interface RenderBranchTag {
  name: string;
  color: string;
  x: number;
  y: number;
  isHead: boolean;
}

export interface RenderLayout {
  commits: RenderCommit[];
  paths: RenderPath[];
  branchTags: RenderBranchTag[];
  width: number;
  height: number;
}

export function computeLayout(
  state: GitState,
  options: LayoutOptions
): RenderLayout {
  const { rowHeight, columnWidth, nodeRadius } = options;
  const commitOrder = state.commitOrder;
  const commits = state.commits;
  const branches = state.branches;

  // 1. Assign stable columns to branches.
  // We want to assign columns sequentially from oldest to newest commit
  const branchColumns: Record<string, number> = { main: 0 };
  let nextCol = 1;

  for (const hash of commitOrder) {
    const commit = commits[hash];
    if (commit && branchColumns[commit.branchName] === undefined) {
      branchColumns[commit.branchName] = nextCol++;
    }
  }

  // 2. Map commits to row indices
  const rowMap: Record<string, number> = {};
  commitOrder.forEach((hash, idx) => {
    rowMap[hash] = idx;
  });

  const totalRows = commitOrder.length;
  const totalCols = Math.max(nextCol, 1);

  // Padding
  const padX = columnWidth * 0.8;
  const padY = rowHeight * 0.5;

  // Helper to get coordinates
  const getX = (col: number) => padX + col * columnWidth;
  const getY = (row: number) => (row + 0.5) * rowHeight;

  // 3. Map render commits
  const headHash = state.head ? (branches[state.head] ? branches[state.head].target : state.head) : null;
  
  const renderCommits: RenderCommit[] = commitOrder.map((hash, idx) => {
    const commit = commits[hash];
    const col = branchColumns[commit.branchName] ?? 0;
    const branchColor = branches[commit.branchName]?.color ?? "#9CA3AF"; // default gray if branch not found
    
    return {
      hash,
      row: idx,
      col,
      x: getX(col),
      y: getY(idx),
      color: branchColor,
      isHead: headHash === hash,
      commit,
    };
  });

  // 4. Compute connections (paths)
  const renderPaths: RenderPath[] = [];

  for (const commit of renderCommits) {
    const childX = commit.x;
    const childY = commit.y;
    const childCol = commit.col;
    const childRow = commit.row;

    commit.commit.parents.forEach((parentHash, parentIdx) => {
      const parentCommit = commits[parentHash];
      if (!parentCommit) return;

      const parentRow = rowMap[parentHash];
      if (parentRow === undefined) return;

      const parentCol = branchColumns[parentCommit.branchName] ?? 0;
      const parentX = getX(parentCol);
      const parentY = getY(parentRow);

      const pathId = `${parentHash}-${commit.hash}-${parentIdx}`;

      // Decide path color:
      // If parent and child are on same branch: branch color
      // If branch-out (child is first commit on its branch): child branch color
      // If merge: secondary parent line colored like parent branch, primary same
      const isMergeLine = parentIdx > 0;
      const lineColor = isMergeLine
        ? (branches[parentCommit.branchName]?.color ?? "#9CA3AF")
        : (branches[commit.commit.branchName]?.color ?? "#9CA3AF");

      let d = "";

      if (parentCol === childCol) {
        // Straight line
        d = `M ${parentX} ${parentY} L ${childX} ${childY}`;
      } else {
        // Curved line (branch out or merge)
        const isBranchOut = !isMergeLine && childRow === parentRow + 1;

        if (isBranchOut) {
          // Bend immediately below parent, then go straight down to child
          const bendY = parentY + rowHeight * 0.4;
          d = `M ${parentX} ${parentY} ` +
              `C ${parentX} ${parentY + rowHeight * 0.15}, ${childX} ${bendY - rowHeight * 0.15}, ${childX} ${bendY} ` +
              `L ${childX} ${childY}`;
        } else if (isMergeLine) {
          // Go straight down to just above child, then bend into child
          const bendY = childY - rowHeight * 0.4;
          d = `M ${parentX} ${parentY} ` +
              `L ${parentX} ${bendY} ` +
              `C ${parentX} ${bendY + rowHeight * 0.15}, ${childX} ${childY - rowHeight * 0.15}, ${childX} ${childY}`;
        } else {
          // Generic curve (e.g. rebase flow or branch-out spanning multiple rows)
          // Start at parent, bend to child's column, then run straight to child
          const bendY = parentY + rowHeight * 0.5;
          d = `M ${parentX} ${parentY} ` +
              `C ${parentX} ${parentY + rowHeight * 0.2}, ${childX} ${bendY - rowHeight * 0.2}, ${childX} ${bendY} ` +
              `L ${childX} ${childY}`;
        }
      }

      renderPaths.push({
        id: pathId,
        d,
        color: lineColor,
        isMerge: isMergeLine,
      });
    });
  }

  // 5. Compute Branch tags
  const renderBranchTags: RenderBranchTag[] = [];

  for (const [branchName, branch] of Object.entries(branches)) {
    const targetHash = branch.target;
    const targetCommit = commits[targetHash];
    if (!targetCommit) continue;

    const row = rowMap[targetHash];
    if (row === undefined) continue;

    const col = branchColumns[targetCommit.branchName] ?? 0;
    const isHead = state.head === branchName;

    // We position the branch label next to the commit.
    // If multiple branches point to the same commit, they stack horizontally or vertically.
    renderBranchTags.push({
      name: branchName,
      color: branch.color,
      x: getX(col),
      y: getY(row),
      isHead,
    });
  }

  // Calculate width and height
  const width = padX * 2 + (totalCols - 1) * columnWidth + 80; // extra padding for text tags
  const height = totalRows * rowHeight;

  return {
    commits: renderCommits,
    paths: renderPaths,
    branchTags: renderBranchTags,
    width,
    height,
  };
}
