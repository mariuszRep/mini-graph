import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GraphNodeProps {
  /** Dot and edge color — use a chart CSS var e.g. "hsl(var(--chart-1))" */
  color?: string;
  /** Show cursor ring on this node */
  active?: boolean;
  /** Pulse the inner dot (use while streaming/loading) */
  streaming?: boolean;
  /** Extra classes on the content wrapper */
  className?: string;
  children?: React.ReactNode;
}

export interface GraphFeedProps {
  /**
   * Distance from the top of each row to the dot center, in px.
   * Should match: content padding-top + half of first-line height.
   * Default 16 aligns with text-xs (12px/16px) + py-2 (8px padding).
   */
  dotOffset?: number;
  nodeRadius?: number;
  lineWidth?: number;
  className?: string;
  children?: React.ReactNode;
}

const DEFAULT_COLOR = "hsl(var(--chart-1))";
// Width of the left graph column — matches the original SVG overlay width
const COL_WIDTH = 32;
// Horizontal center of node within the column — matches original nodeX
const NODE_CX = 12; // nodeRadius(4) + 8

// ─── GraphNode ── data-holding shell, rendered by GraphFeed ──────────────────

export function GraphNode(_props: GraphNodeProps) {
  return null;
}
GraphNode.displayName = "GraphNode";

// ─── GraphFeed ────────────────────────────────────────────────────────────────

export const GraphFeed = React.forwardRef<HTMLDivElement, GraphFeedProps>(
  (
    {
      dotOffset = 16,
      nodeRadius = 4,
      lineWidth = 2,
      className,
      children,
    },
    ref
  ) => {
    const nodes = React.Children.toArray(children)
      .filter((c): c is React.ReactElement<GraphNodeProps> =>
        React.isValidElement(c) && (c.type as any).displayName === "GraphNode"
      )
      .map((c, i, arr) => ({
        color: c.props.color ?? DEFAULT_COLOR,
        prevColor: (arr[i - 1] as React.ReactElement<GraphNodeProps> | undefined)?.props.color ?? DEFAULT_COLOR,
        active: c.props.active ?? false,
        streaming: c.props.streaming ?? false,
        className: c.props.className,
        children: c.props.children,
        isFirst: i === 0,
        isLast: i === arr.length - 1,
      }));

    const lineX = NODE_CX - lineWidth / 2;

    return (
      <div ref={ref} className={cn("flex flex-col select-none", className)}>
        {nodes.map((node, i) => (
          <div
            key={i}
            className="flex"
            style={{
              minHeight: dotOffset * 2,
              borderLeft: `3px solid color-mix(in srgb, ${node.color} 12%, transparent)`,
            }}
          >
            {/* Left column — dot + vertical line segments */}
            <div className="relative shrink-0" style={{ width: COL_WIDTH }}>
              {/* Line from top of row down to dot — uses PREVIOUS node's color for continuity */}
              {!node.isFirst && (
                <div
                  className="absolute"
                  style={{
                    left: lineX,
                    top: 0,
                    width: lineWidth,
                    height: dotOffset,
                    backgroundColor: node.prevColor,
                    opacity: 0.55,
                  }}
                />
              )}
              {/* Line from dot down to bottom of row — stretches with content height */}
              {!node.isLast && (
                <div
                  className="absolute"
                  style={{
                    left: lineX,
                    top: dotOffset,
                    width: lineWidth,
                    bottom: 0,
                    backgroundColor: node.color,
                    opacity: 0.55,
                  }}
                />
              )}

              {/* Dot — inline SVG so circle + ring look identical to ExecutionCanvas */}
              <svg
                className="absolute overflow-visible"
                style={{
                  left: NODE_CX - nodeRadius - 6,
                  top: dotOffset - nodeRadius - 6,
                  width: (nodeRadius + 6) * 2,
                  height: (nodeRadius + 6) * 2,
                }}
              >
                {/* Cursor pulse ring */}
                {node.active && (
                  <motion.circle
                    cx={nodeRadius + 6}
                    cy={nodeRadius + 6}
                    r={nodeRadius + 4}
                    fill="none"
                    stroke={node.color}
                    strokeWidth="2"
                    animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0.1, 0.6] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                  />
                )}
                {/* Outer circle */}
                <circle
                  cx={nodeRadius + 6}
                  cy={nodeRadius + 6}
                  r={nodeRadius}
                  fill={node.active ? "hsl(var(--background))" : node.color}
                  stroke={node.color}
                  strokeWidth={node.active ? 2.5 : 0}
                />
                {/* Inner fill dot (active = hollow ring; streaming = pulses) */}
                {(node.active || node.streaming) && (
                  <motion.circle
                    cx={nodeRadius + 6}
                    cy={nodeRadius + 6}
                    r={Math.max(nodeRadius - 2, 1.5)}
                    fill={node.color}
                    animate={node.streaming ? { opacity: [1, 0.3, 1] } : {}}
                    transition={node.streaming ? { repeat: Infinity, duration: 1.2 } : {}}
                  />
                )}
              </svg>
            </div>

            {/* Content slot — open; callers define any columns */}
            <div className={cn("flex-1 min-w-0 py-2 pr-4", node.className)}>
              {node.children}
            </div>
          </div>
        ))}
      </div>
    );
  }
);
GraphFeed.displayName = "GraphFeed";
