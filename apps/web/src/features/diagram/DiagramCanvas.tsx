import { Background, Controls, MiniMap, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useMemo } from "react";
import { useGraphStore } from "@/features/graph";
import { toFlowElements } from "./to-flow-elements";

export function DiagramCanvas() {
  const graph = useGraphStore((s) => s.graph);
  const select = useGraphStore((s) => s.select);
  const { nodes, edges } = useMemo(() => (graph ? toFlowElements(graph) : { nodes: [], edges: [] }), [graph]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodeClick={(_e, node) => select(node.id)}
      onPaneClick={() => select(undefined)}
      fitView
    >
      <Background />
      <Controls />
      <MiniMap />
    </ReactFlow>
  );
}
