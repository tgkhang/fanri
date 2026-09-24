import type { GNode } from "../ir";

type SourceKind = NonNullable<GNode["module"]>["sourceKind"];

/** FR-3.x: classify a `module.source` string. */
export function classifyModuleSource(source: string): SourceKind {
  if (source.startsWith("./") || source.startsWith("../")) return "local";
  if (source.startsWith("git::") || source.startsWith("github.com/") || source.endsWith(".git")) return "git";
  if (source.startsWith("s3::")) return "s3";
  if (/^https?:\/\//.test(source)) return "http";
  if (/^[\w-]+\/[\w-]+\/[\w-]+$/.test(source)) return "registry";
  return "other";
}
