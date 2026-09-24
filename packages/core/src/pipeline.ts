import { buildGraph } from "./graph";
import type { FanriGraph } from "./ir";
import { loadWorkspace } from "./loader";
import type { Parser } from "./parser";
import { applyPlugins, type CloudPlugin } from "./plugins";

export interface PipelineOptions {
  root: string;
  parser: Parser;
  plugins: CloudPlugin[];
}

/** load -> parse -> build IR -> plugins (doc 5 §5.5). */
export async function runPipeline({ root, parser, plugins }: PipelineOptions): Promise<FanriGraph> {
  const files = await loadWorkspace(root);
  const raw = await parser.parse(files);
  return applyPlugins(buildGraph(raw), plugins);
}
