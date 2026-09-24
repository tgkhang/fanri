import { useGraphStore } from "@/features/graph";

/** FR-6.2: details of the clicked node. */
export function DetailPanel() {
  const node = useGraphStore((s) => s.graph?.nodes.find((n) => n.id === s.selectedId));
  if (!node) return null;

  return (
    <aside className="w-80 overflow-auto border-l border-neutral-200 bg-white p-4 text-sm">
      <h2 className="font-semibold">{node.id}</h2>
      <p className="text-neutral-500">
        {node.source.file}:{node.source.line}
      </p>
      <pre className="mt-3 whitespace-pre-wrap text-xs">{JSON.stringify(node.attributes, null, 2)}</pre>
    </aside>
  );
}
