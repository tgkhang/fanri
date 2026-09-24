import type { Parser, RawModule } from "@fanri/core";

/**
 * HCL parser adapter. P0 spike: wire up @cdktf/hcl2json here (doc 6 §6.3), later swap for hcl-wasm.
 * For now it only reports how many files it received.
 */
export function createHclParser(): Parser {
  return {
    name: "hcl",
    async parse(files): Promise<RawModule> {
      return {
        root: files.root,
        blocks: [],
        diagnostics: [
          { severity: "info", message: `HCL parser not implemented yet (${files.files.length} .tf files found)` },
        ],
      };
    },
  };
}
