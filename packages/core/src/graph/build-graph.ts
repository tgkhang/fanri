import { type FanriGraph, IR_SCHEMA_VERSION } from "../ir";
import type { RawModule } from "../parser";

/** Raw parser output -> IR. Nodes and edges get filled in once the parser spike (P0) lands. */
export function buildGraph(raw: RawModule): FanriGraph {
  return {
    schemaVersion: IR_SCHEMA_VERSION,
    root: raw.root,
    nodes: [],
    edges: [],
    diagnostics: raw.diagnostics,
  };
}
