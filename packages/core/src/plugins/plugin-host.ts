import type { FanriGraph } from "../ir";
import type { CloudPlugin } from "./types";

export function applyPlugins(graph: FanriGraph, plugins: CloudPlugin[]): FanriGraph {
  let result = graph;
  for (const plugin of plugins) {
    result = {
      ...result,
      nodes: result.nodes.map((node) => {
        const owns = node.provider !== undefined && plugin.providers.includes(node.provider);
        const view = owns ? plugin.decorate?.(node) : undefined;
        return view ? { ...node, view: { ...node.view, ...view } } : node;
      }),
    };
    result = plugin.enrich?.(result) ?? result;
  }
  return result;
}
