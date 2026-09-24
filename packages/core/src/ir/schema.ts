import { z } from "zod";

/** The IR is the contract (doc 5 §5.6): parsers produce it, plugins decorate it, UI and exporters consume it. */
export const IR_SCHEMA_VERSION = "0.1" as const;

export const NodeKind = z.enum(["resource", "data", "module", "variable", "output", "local", "provider", "group"]);

export const SourceLocation = z.object({ file: z.string(), line: z.number().int() });

export const Badge = z.object({ label: z.string(), tone: z.string().optional() });

export const GNode = z.object({
  id: z.string(),
  kind: NodeKind,
  type: z.string().optional(),
  name: z.string(),
  provider: z.string().optional(),
  parentId: z.string().optional(),
  multiplicity: z
    .object({ mode: z.enum(["count", "for_each"]), expr: z.string(), value: z.number().optional() })
    .optional(),
  attributes: z.record(z.string(), z.unknown()),
  source: SourceLocation,
  module: z
    .object({
      source: z.string(),
      version: z.string().optional(),
      sourceKind: z.enum(["local", "git", "registry", "http", "s3", "other"]),
      resolution: z.enum(["local", "resolved", "supplemented", "guessed", "unresolved"]),
      inputs: z.record(z.string(), z.unknown()),
    })
    .optional(),
  view: z
    .object({
      icon: z.string().optional(),
      category: z.string().optional(),
      label: z.string().optional(),
      badges: z.array(Badge).optional(),
    })
    .optional(),
});

export const GEdge = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  kind: z.string(),
  via: z.string().optional(),
  inferred: z.boolean().optional(),
});

export const Diagnostic = z.object({
  severity: z.enum(["error", "warning", "info"]),
  message: z.string(),
  source: SourceLocation.optional(),
});

export const FanriGraph = z.object({
  schemaVersion: z.literal(IR_SCHEMA_VERSION),
  root: z.string(),
  nodes: z.array(GNode),
  edges: z.array(GEdge),
  diagnostics: z.array(Diagnostic),
});

export type NodeKind = z.infer<typeof NodeKind>;
export type GNode = z.infer<typeof GNode>;
export type GEdge = z.infer<typeof GEdge>;
export type Diagnostic = z.infer<typeof Diagnostic>;
export type FanriGraph = z.infer<typeof FanriGraph>;
