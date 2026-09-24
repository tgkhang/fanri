import type { Diagnostic } from "../ir";
import type { FileSet } from "../loader";

/** A top-level HCL block (resource, module, variable, ...) with the references found in its expressions. */
export interface RawBlock {
  kind: string;
  labels: string[];
  body: Record<string, unknown>;
  refs: string[];
  source: { file: string; line: number };
}

export interface RawModule {
  root: string;
  blocks: RawBlock[];
  diagnostics: Diagnostic[];
}

/** Parser front-end (doc 5 §5.5). Nothing outside a parser package imports an HCL library directly. */
export interface Parser {
  readonly name: string;
  parse(files: FileSet): Promise<RawModule>;
}
