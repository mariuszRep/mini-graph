import { ExecutionState, Step, Run, StepType, ExampleExecution } from "./types";

export const RUN_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
  "hsl(var(--chart-7))",
  "hsl(var(--chart-8))",
];

// User turns get a distinct amber color to stand out within any lane
export const STEP_TYPE_COLORS: Partial<Record<StepType, string>> = {
  user: "hsl(var(--chart-4))",
};

export function generateId(): string {
  return Math.random().toString(16).substring(2, 9);
}

export function isAncestor(
  state: ExecutionState,
  ancestorId: string,
  descendantId: string
): boolean {
  if (ancestorId === descendantId) return true;
  const visited = new Set<string>();
  const queue = [descendantId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === ancestorId) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    const step = state.steps[current];
    if (step) queue.push(...step.parents);
  }
  return false;
}

export function getAncestors(state: ExecutionState, id: string): Set<string> {
  const ancestors = new Set<string>();
  const queue = [id];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (ancestors.has(current)) continue;
    ancestors.add(current);
    const step = state.steps[current];
    if (step) queue.push(...step.parents);
  }
  return ancestors;
}

export function findLCA(
  state: ExecutionState,
  idA: string,
  idB: string
): string | null {
  if (!idA || !idB) return null;
  const ancestorsA = getAncestors(state, idA);
  const ancestorsB = getAncestors(state, idB);
  const intersection = new Set<string>();
  for (const id of ancestorsA) {
    if (ancestorsB.has(id)) intersection.add(id);
  }
  if (intersection.size === 0) return null;
  for (let i = state.stepOrder.length - 1; i >= 0; i--) {
    if (intersection.has(state.stepOrder[i])) return state.stepOrder[i];
  }
  return null;
}

export function createInitialState(): ExecutionState {
  const rootId = "root001";
  const runId = "run-main";

  const rootStep: Step = {
    id: rootId,
    parents: [],
    type: "generic",
    content: "Start",
    timestamp: new Date().toISOString(),
    runId,
    labels: [],
  };

  const mainRun: Run = {
    id: runId,
    name: "main",
    color: RUN_COLORS[0],
    head: rootId,
  };

  return {
    steps: { [rootId]: rootStep },
    runs: { [runId]: mainRun },
    cursor: runId,
    stepOrder: [rootId],
  };
}

export interface EngineResult {
  state: ExecutionState;
  error?: string;
}

export function addStep(
  state: ExecutionState,
  content: string,
  type: StepType = "generic",
  author?: string,
  nodeName?: string
): EngineResult {
  const activeRun = state.runs[state.cursor];
  if (!activeRun) {
    return { state, error: "No active run. Switch to a run first." };
  }

  const newId = generateId();
  const typeColor = STEP_TYPE_COLORS[type];

  const newStep: Step = {
    id: newId,
    parents: [activeRun.head],
    type,
    content,
    nodeName,
    author,
    timestamp: new Date().toISOString(),
    runId: activeRun.id,
    labels: [],
    typeColor,
  };

  return {
    state: {
      ...state,
      steps: { ...state.steps, [newId]: newStep },
      stepOrder: [...state.stepOrder, newId],
      runs: {
        ...state.runs,
        [activeRun.id]: { ...activeRun, head: newId },
      },
    },
  };
}

export function forkRun(
  state: ExecutionState,
  fromStepId: string,
  newRunName: string
): EngineResult {
  if (!state.steps[fromStepId]) {
    return { state, error: `Step '${fromStepId}' not found.` };
  }
  const nameConflict = Object.values(state.runs).find(
    (r) => r.name === newRunName
  );
  if (nameConflict) {
    return { state, error: `Run '${newRunName}' already exists.` };
  }

  const newRunId = generateId();
  const newStepId = generateId();
  const color =
    RUN_COLORS[Object.keys(state.runs).length % RUN_COLORS.length];

  const parentRunId = state.steps[fromStepId]?.runId;

  const forkStep: Step = {
    id: newStepId,
    parents: [fromStepId],
    type: "generic",
    content: `Start of node: ${newRunName}`,
    timestamp: new Date().toISOString(),
    runId: newRunId,
    labels: [],
  };

  const newRun: Run = {
    id: newRunId,
    name: newRunName,
    color,
    head: newStepId,
    parentRunId,
  };

  return {
    state: {
      ...state,
      steps: { ...state.steps, [newStepId]: forkStep },
      stepOrder: [...state.stepOrder, newStepId],
      runs: { ...state.runs, [newRunId]: newRun },
      cursor: newRunId,
    },
  };
}

export function switchRun(
  state: ExecutionState,
  runId: string
): EngineResult {
  if (!state.runs[runId]) {
    return { state, error: `Run '${runId}' not found.` };
  }
  return { state: { ...state, cursor: runId } };
}

export function mergeRuns(
  state: ExecutionState,
  sourceRunId: string
): EngineResult {
  const activeRun = state.runs[state.cursor];
  const sourceRun = state.runs[sourceRunId];
  if (!activeRun) return { state, error: "No active run." };
  if (!sourceRun) return { state, error: `Run '${sourceRunId}' not found.` };
  if (sourceRunId === state.cursor) {
    return { state, error: "Cannot merge a run into itself." };
  }

  const newId = generateId();
  const mergeStep: Step = {
    id: newId,
    parents: [activeRun.head, sourceRun.head],
    type: "generic",
    content: `Merge: ${sourceRun.name} → ${activeRun.name}`,
    timestamp: new Date().toISOString(),
    runId: activeRun.id,
    labels: [],
  };

  return {
    state: {
      ...state,
      steps: { ...state.steps, [newId]: mergeStep },
      stepOrder: [...state.stepOrder, newId],
      runs: {
        ...state.runs,
        [activeRun.id]: { ...activeRun, head: newId },
      },
    },
  };
}

export function addLabel(
  state: ExecutionState,
  labelText: string,
  stepId?: string
): EngineResult {
  const targetId = stepId ?? state.runs[state.cursor]?.head;
  if (!targetId || !state.steps[targetId]) {
    return { state, error: "No step to label." };
  }
  const step = state.steps[targetId];
  return {
    state: {
      ...state,
      steps: {
        ...state.steps,
        [targetId]: { ...step, labels: [...step.labels, labelText] },
      },
    },
  };
}

export function deleteRun(
  state: ExecutionState,
  runId: string
): EngineResult {
  const run = state.runs[runId];
  if (!run) return { state, error: `Run '${runId}' not found.` };
  if (runId === state.cursor) {
    return { state, error: "Cannot delete the active run. Switch away first." };
  }
  const remainingRuns = { ...state.runs };
  delete remainingRuns[runId];
  return { state: { ...state, runs: remainingRuns } };
}

// ── Example executions ──────────────────────────────────────────────────────

const TS = (offset = 0) =>
  new Date(Date.now() - offset * 60_000).toISOString();

export const EXAMPLES: ExampleExecution[] = [
  {
    id: "linear-agent",
    name: "Linear Agent Conversation",
    description:
      "Single-thread agent handling a weather query with tool use. Shows how user turns (amber) and tool calls differ visually on one lane.",
    state: {
      steps: {
        s0: { id: "s0", parents: [], type: "generic", content: "Start", runId: "r0", labels: [], timestamp: TS(10) },
        s1: { id: "s1", parents: ["s0"], type: "user", content: "What's the weather in NYC right now?", runId: "r0", labels: [], timestamp: TS(9), typeColor: "hsl(var(--chart-4))" },
        s2: { id: "s2", parents: ["s1"], type: "assistant", content: "Let me check the weather for you.", runId: "r0", labels: [], timestamp: TS(8) },
        s3: { id: "s3", parents: ["s2"], type: "tool_call", content: 'get_weather(location="NYC")', nodeName: "weather_tool", runId: "r0", labels: [], timestamp: TS(7) },
        s4: { id: "s4", parents: ["s3"], type: "tool_result", content: '{"temp":"72°F","condition":"Sunny","humidity":"45%"}', runId: "r0", labels: [], timestamp: TS(6) },
        s5: { id: "s5", parents: ["s4"], type: "assistant", content: "It's currently 72°F and sunny in NYC, with 45% humidity.", runId: "r0", labels: ["final"], timestamp: TS(5) },
      },
      runs: {
        r0: { id: "r0", name: "main", color: "hsl(var(--chart-1))", head: "s5" },
      },
      cursor: "r0",
      stepOrder: ["s0", "s1", "s2", "s3", "s4", "s5"],
    },
  },
  {
    id: "parallel-workflow",
    name: "Parallel Workflow",
    description:
      "A pipeline that forks input into two parallel processing runs (validation + enrichment), then converges back.",
    state: {
      steps: {
        s0: { id: "s0", parents: [], type: "generic", content: "Start", runId: "r0", labels: [], timestamp: TS(15) },
        s1: { id: "s1", parents: ["s0"], type: "node_output", content: "Input received", nodeName: "input", runId: "r0", labels: [], timestamp: TS(14) },
        s2: { id: "s2", parents: ["s1"], type: "node_output", content: "Fork: validation", nodeName: "router", runId: "r1", labels: [], timestamp: TS(13) },
        s3: { id: "s3", parents: ["s1"], type: "node_output", content: "Fork: enrichment", nodeName: "router", runId: "r2", labels: [], timestamp: TS(13) },
        s4: { id: "s4", parents: ["s2"], type: "node_output", content: "Schema validated ✓", nodeName: "validator", runId: "r1", labels: [], timestamp: TS(11) },
        s5: { id: "s5", parents: ["s3"], type: "node_output", content: "External API lookup", nodeName: "enricher", runId: "r2", labels: [], timestamp: TS(11) },
        s6: { id: "s6", parents: ["s4"], type: "node_output", content: "Types coerced ✓", nodeName: "coerce", runId: "r1", labels: [], timestamp: TS(9) },
        s7: { id: "s7", parents: ["s5"], type: "node_output", content: "Data enriched ✓", nodeName: "enricher", runId: "r2", labels: [], timestamp: TS(9) },
        s8: { id: "s8", parents: ["s6", "s7"], type: "node_output", content: "Merge: results combined", nodeName: "merge", runId: "r0", labels: [], timestamp: TS(7) },
        s9: { id: "s9", parents: ["s8"], type: "node_output", content: "Output dispatched", nodeName: "output", runId: "r0", labels: ["done"], timestamp: TS(6) },
      },
      runs: {
        r0: { id: "r0", name: "pipeline", color: "hsl(var(--chart-1))", head: "s9" },
        r1: { id: "r1", name: "validation", color: "hsl(var(--chart-2))", head: "s6" },
        r2: { id: "r2", name: "enrichment", color: "hsl(var(--chart-3))", head: "s7" },
      },
      cursor: "r0",
      stepOrder: ["s0", "s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9"],
    },
  },
  {
    id: "multi-agent",
    name: "Multi-Agent Orchestration",
    description:
      "An orchestrator delegates subtasks to a search agent and a code agent in parallel, then aggregates their outputs.",
    state: {
      steps: {
        s0: { id: "s0", parents: [], type: "generic", content: "Start", runId: "r0", labels: [], timestamp: TS(20) },
        s1: { id: "s1", parents: ["s0"], type: "user", content: "Build a React component that fetches weather data", runId: "r0", labels: [], timestamp: TS(19), typeColor: "hsl(var(--chart-4))" },
        s2: { id: "s2", parents: ["s1"], type: "assistant", content: "Delegating to specialized agents...", runId: "r0", labels: [], timestamp: TS(18) },
        s3: { id: "s3", parents: ["s2"], type: "tool_call", content: "Fork: agent-search", nodeName: "orchestrator", runId: "r1", labels: [], timestamp: TS(17) },
        s4: { id: "s4", parents: ["s2"], type: "tool_call", content: "Fork: agent-code", nodeName: "orchestrator", runId: "r2", labels: [], timestamp: TS(17) },
        s5: { id: "s5", parents: ["s3"], type: "tool_call", content: 'web_search("weather API React hooks")', nodeName: "search-agent", runId: "r1", labels: [], timestamp: TS(15) },
        s6: { id: "s6", parents: ["s4"], type: "node_output", content: "Generated: useWeather() hook scaffold", nodeName: "code-agent", runId: "r2", labels: [], timestamp: TS(15) },
        s7: { id: "s7", parents: ["s5"], type: "tool_result", content: "Found: openweathermap.org, weatherapi.com", runId: "r1", labels: [], timestamp: TS(13) },
        s8: { id: "s8", parents: ["s6"], type: "tool_result", content: "Tests: 4/4 passed", nodeName: "code-agent", runId: "r2", labels: [], timestamp: TS(13) },
        s9: { id: "s9", parents: ["s7", "s8"], type: "assistant", content: "Aggregating results from both agents...", runId: "r0", labels: [], timestamp: TS(10) },
        s10: { id: "s10", parents: ["s9"], type: "assistant", content: "Here's your WeatherWidget component using OpenWeatherMap API.", runId: "r0", labels: ["final"], timestamp: TS(9) },
      },
      runs: {
        r0: { id: "r0", name: "orchestrator", color: "hsl(var(--chart-1))", head: "s10" },
        r1: { id: "r1", name: "agent-search", color: "hsl(var(--chart-2))", head: "s7" },
        r2: { id: "r2", name: "agent-code", color: "hsl(var(--chart-3))", head: "s8" },
      },
      cursor: "r0",
      stepOrder: ["s0", "s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9", "s10"],
    },
  },
  {
    id: "intent-router",
    name: "Intent Router",
    description:
      "A router classifies user intent and dispatches to different specialist agents (billing vs tech support), each following their own lane.",
    state: {
      steps: {
        s0: { id: "s0", parents: [], type: "generic", content: "Start", runId: "r0", labels: [], timestamp: TS(25) },
        s1: { id: "s1", parents: ["s0"], type: "user", content: "My invoice shows a charge I don't recognize", runId: "r0", labels: [], timestamp: TS(24), typeColor: "hsl(var(--chart-4))" },
        s2: { id: "s2", parents: ["s1"], type: "tool_call", content: 'classify_intent(text="invoice charge")', nodeName: "router", runId: "r0", labels: [], timestamp: TS(23) },
        s3: { id: "s3", parents: ["s2"], type: "tool_result", content: '{"intent":"billing","confidence":0.97}', nodeName: "router", runId: "r0", labels: [], timestamp: TS(22) },
        s4: { id: "s4", parents: ["s3"], type: "node_output", content: "Fork: billing-agent", nodeName: "dispatcher", runId: "r1", labels: [], timestamp: TS(21) },
        s5: { id: "s5", parents: ["s4"], type: "tool_call", content: 'lookup_invoice(customer_id="C-4821")', nodeName: "billing-agent", runId: "r1", labels: [], timestamp: TS(19) },
        s6: { id: "s6", parents: ["s5"], type: "tool_result", content: '{"charge":"$9.99","description":"Pro plan renewal","date":"2026-06-01"}', runId: "r1", labels: [], timestamp: TS(18) },
        s7: { id: "s7", parents: ["s6"], type: "assistant", content: "That charge is your Pro plan renewal from June 1st. Want me to issue a refund?", runId: "r1", labels: ["resolved"], timestamp: TS(17) },
      },
      runs: {
        r0: { id: "r0", name: "router", color: "hsl(var(--chart-1))", head: "s3" },
        r1: { id: "r1", name: "billing-agent", color: "hsl(var(--chart-5))", head: "s7" },
      },
      cursor: "r1",
      stepOrder: ["s0", "s1", "s2", "s3", "s4", "s5", "s6", "s7"],
    },
  },
];
