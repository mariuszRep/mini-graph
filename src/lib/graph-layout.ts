import { ExecutionState, Step, LayoutOptions } from "./types";

export interface RenderStep {
  id: string;
  x: number;
  y: number;
  row: number;
  col: number;
  color: string;
  isCursor: boolean;
  step: Step;
}

export interface RenderPath {
  id: string;
  d: string;
  color: string;
  isMerge: boolean;
}

export interface RenderRunTag {
  name: string;
  color: string;
  x: number;
  y: number;
  isCursor: boolean;
}

export interface RenderLayout {
  steps: RenderStep[];
  paths: RenderPath[];
  runTags: RenderRunTag[];
  width: number;
  height: number;
}

export function computeLayout(
  state: ExecutionState,
  options: LayoutOptions
): RenderLayout {
  const { rowHeight, columnWidth, nodeRadius } = options;
  const { stepOrder, steps, runs, cursor } = state;

  // 1. Assign stable columns to runs in order of first appearance
  const runColumns: Record<string, number> = {};
  // Primary run (main or first encountered) gets column 0
  const primaryRunId =
    Object.values(runs).find((r) => r.name === "main")?.id ??
    (stepOrder[0] ? steps[stepOrder[0]]?.runId : undefined);

  if (primaryRunId) runColumns[primaryRunId] = 0;
  let nextCol = primaryRunId !== undefined ? 1 : 0;

  for (const id of stepOrder) {
    const step = steps[id];
    if (step && runColumns[step.runId] === undefined) {
      runColumns[step.runId] = nextCol++;
    }
  }

  // 2. Map steps to row indices (chronological)
  const rowMap: Record<string, number> = {};
  stepOrder.forEach((id, idx) => { rowMap[id] = idx; });

  const totalRows = stepOrder.length;
  const totalCols = Math.max(nextCol, 1);

  const padX = columnWidth * 0.8;

  const getX = (col: number) => padX + col * columnWidth;
  const getY = (row: number) => (row + 0.5) * rowHeight;

  // 3. Resolve cursor step (tip of active run)
  const cursorRun = runs[cursor];
  const cursorStepId = cursorRun?.head;

  // 4. Build render steps
  const renderSteps: RenderStep[] = stepOrder.map((id, idx) => {
    const step = steps[id];
    const col = runColumns[step.runId] ?? 0;
    const runColor = runs[step.runId]?.color ?? "#9CA3AF";
    const dotColor = step.typeColor ?? runColor;

    return {
      id,
      row: idx,
      col,
      x: getX(col),
      y: getY(idx),
      color: dotColor,
      isCursor: id === cursorStepId,
      step,
    };
  });

  // 5. Build render paths (edges between parent → child)
  const renderPaths: RenderPath[] = [];

  for (const rs of renderSteps) {
    const childX = rs.x;
    const childY = rs.y;
    const childCol = rs.col;
    const childRow = rs.row;

    rs.step.parents.forEach((parentId, parentIdx) => {
      const parentStep = steps[parentId];
      if (!parentStep) return;

      const parentRow = rowMap[parentId];
      if (parentRow === undefined) return;

      const parentCol = runColumns[parentStep.runId] ?? 0;
      const parentX = getX(parentCol);
      const parentY = getY(parentRow);

      const pathId = `${parentId}-${rs.id}-${parentIdx}`;
      const isMergeLine = parentIdx > 0;

      // Edge color flows from the source dot: normal lines use parent's color (incl. typeColor override)
      const parentColor = parentStep.typeColor ?? (runs[parentStep.runId]?.color ?? "#9CA3AF");
      const lineColor = isMergeLine
        ? (runs[parentStep.runId]?.color ?? "#9CA3AF")
        : parentColor;

      let d = "";

      if (parentCol === childCol) {
        d = `M ${parentX} ${parentY} L ${childX} ${childY}`;
      } else {
        const isBranchOut = !isMergeLine && childRow === parentRow + 1;

        if (isBranchOut) {
          const bendY = parentY + rowHeight * 0.4;
          d =
            `M ${parentX} ${parentY} ` +
            `C ${parentX} ${parentY + rowHeight * 0.15}, ${childX} ${bendY - rowHeight * 0.15}, ${childX} ${bendY} ` +
            `L ${childX} ${childY}`;
        } else if (isMergeLine) {
          const bendY = childY - rowHeight * 0.4;
          d =
            `M ${parentX} ${parentY} ` +
            `L ${parentX} ${bendY} ` +
            `C ${parentX} ${bendY + rowHeight * 0.15}, ${childX} ${childY - rowHeight * 0.15}, ${childX} ${childY}`;
        } else {
          const bendY = parentY + rowHeight * 0.5;
          d =
            `M ${parentX} ${parentY} ` +
            `C ${parentX} ${parentY + rowHeight * 0.2}, ${childX} ${bendY - rowHeight * 0.2}, ${childX} ${bendY} ` +
            `L ${childX} ${childY}`;
        }
      }

      renderPaths.push({ id: pathId, d, color: lineColor, isMerge: isMergeLine });
    });
  }

  // 6. Run tip labels
  const renderRunTags: RenderRunTag[] = [];

  for (const run of Object.values(runs)) {
    const headStep = steps[run.head];
    if (!headStep) continue;

    const row = rowMap[run.head];
    if (row === undefined) continue;

    const col = runColumns[headStep.runId] ?? 0;

    renderRunTags.push({
      name: run.name,
      color: run.color,
      x: getX(col),
      y: getY(row),
      isCursor: cursor === run.id,
    });
  }

  const width = padX * 2 + (totalCols - 1) * columnWidth + 80;
  const height = totalRows * rowHeight;

  return {
    steps: renderSteps,
    paths: renderPaths,
    runTags: renderRunTags,
    width,
    height,
  };
}
