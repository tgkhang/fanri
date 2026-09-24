import type { FanriGraph } from "@fanri/core/ir";
import type { Edge, Node } from "@xyflow/react";

const COLUMNS = 6;
const GAP_X = 220;
const GAP_Y = 100;

/**
 * IR -> React Flow elements. Uses a plain grid for now.
 * ELK.js in a Web Worker replaces this in P1 (doc 6 §6.5).
 */
export function toFlowElements(graph: FanriGraph): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = graph.nodes.map((node, i) => ({
    id: node.id,
    position: { x: (i % COLUMNS) * GAP_X, y: Math.floor(i / COLUMNS) * GAP_Y },
    data: { label: node.view?.label ?? `${node.type ?? node.kind}.${node.name}` },
  }));
  const edges: Edge[] = graph.edges.map((edge) => ({ id: edge.id, source: edge.from, target: edge.to }));
  return { nodes, edges };
}
