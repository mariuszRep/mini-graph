// Main component
export { ExecutionGraph } from "./components/execution-graph/index";
export type { ExecutionGraphProps } from "./components/execution-graph/index";

// Sub-components (for custom compositions)
export { ExecutionCanvas } from "./components/execution-graph/canvas";
export { ExecutionControls } from "./components/execution-graph/controls";
export { StepBadge } from "./components/execution-graph/step-badge";

// Types
export type {
  ExecutionState,
  Step,
  Run,
  StepType,
  LayoutOptions,
  ExampleExecution,
} from "./lib/types";

// Engine (for headless / controlled usage)
export {
  createInitialState,
  addStep,
  forkRun,
  switchRun,
  mergeRuns,
  addLabel,
  deleteRun,
  generateId,
  isAncestor,
  findLCA,
  RUN_COLORS,
  STEP_TYPE_COLORS,
  EXAMPLES,
} from "./lib/execution-engine";

// Layout (for custom renderers)
export { computeLayout } from "./lib/graph-layout";
export type {
  RenderStep,
  RenderPath,
  RenderRunTag,
  RenderLayout,
} from "./lib/graph-layout";
