import React, { useState } from "react";
import { ExecutionState, LayoutOptions, StepType } from "../../lib/types";
import {
  createInitialState,
  addStep,
  forkRun,
  switchRun,
  mergeRuns,
  addLabel,
  deleteRun,
} from "../../lib/execution-engine";
import { ExecutionCanvas } from "./canvas";
import { ExecutionControls } from "./controls";
import { cn } from "../../lib/utils";

export interface ExecutionGraphProps {
  /** Controlled state. If provided, onStateChange must also be provided. */
  state?: ExecutionState;
  /** Uncontrolled initial state. Ignored when `state` is provided. */
  defaultState?: ExecutionState;
  onStateChange?: (state: ExecutionState) => void;
  showControls?: boolean;
  className?: string;
}

const DEFAULT_OPTIONS: LayoutOptions = {
  orientation: "vertical",
  rowHeight: 32,
  columnWidth: 16,
  nodeRadius: 4,
  lineWidth: 2,
  showLabels: true,
  showComments: true,
  theme: "github",
};

export const ExecutionGraph: React.FC<ExecutionGraphProps> = ({
  state: controlledState,
  defaultState,
  onStateChange,
  showControls = true,
  className,
}) => {
  const [internalState, setInternalState] = useState<ExecutionState>(
    () => controlledState ?? defaultState ?? createInitialState()
  );
  const [options, setOptions] = useState<LayoutOptions>(DEFAULT_OPTIONS);

  const state = controlledState ?? internalState;

  const dispatch = (next: ExecutionState) => {
    if (!controlledState) setInternalState(next);
    onStateChange?.(next);
  };

  const handleAddStep = (
    content: string,
    type: StepType,
    author?: string,
    nodeName?: string
  ) => {
    const result = addStep(state, content, type, author, nodeName);
    if (!result.error) dispatch(result.state);
  };

  const handleForkRun = (fromStepId: string, runName: string) => {
    const result = forkRun(state, fromStepId, runName);
    if (!result.error) dispatch(result.state);
  };

  const handleSwitchRun = (runId: string) => {
    const result = switchRun(state, runId);
    if (!result.error) dispatch(result.state);
  };

  const handleMergeRuns = (sourceRunId: string) => {
    const result = mergeRuns(state, sourceRunId);
    if (!result.error) dispatch(result.state);
  };

  const handleAddLabel = (label: string, stepId: string) => {
    const result = addLabel(state, label, stepId);
    if (!result.error) dispatch(result.state);
  };

  const handleDeleteRun = (runId: string) => {
    const result = deleteRun(state, runId);
    if (!result.error) dispatch(result.state);
  };

  return (
    <div className={cn("flex h-full w-full gap-0", className)}>
      {showControls && (
        <div className="w-72 shrink-0 h-full">
          <ExecutionControls
            state={state}
            options={options}
            onOptionsChange={setOptions}
            onAddStep={handleAddStep}
            onForkRun={handleForkRun}
            onSwitchRun={handleSwitchRun}
            onMergeRuns={handleMergeRuns}
            onDeleteRun={handleDeleteRun}
            onLoadExample={() => {}}
            onReset={() => dispatch(createInitialState())}
          />
        </div>
      )}
      <div className="flex-1 h-full min-w-0">
        <ExecutionCanvas
          state={state}
          options={options}
          onForkFromStep={handleForkRun}
          onSetCursorToRun={handleSwitchRun}
          onAddLabel={handleAddLabel}
        />
      </div>
    </div>
  );
};
