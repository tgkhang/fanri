import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export interface SourceFile {
  /** Path relative to the workspace root, always with forward slashes. */
  path: string;
  content: string;
}

export interface FileSet {
  root: string;
  files: SourceFile[];
}

const IGNORED_DIRS = new Set([".terraform", ".git", "node_modules"]);
const TF_FILE = /\.tf(\.json)?$/;

/** FR-1.1 / FR-1.3: read every *.tf file under root, skipping ignored folders. */
export async function loadWorkspace(root: string): Promise<FileSet> {
  const absRoot = path.resolve(root);
  const files: SourceFile[] = [];

  async function walk(dir: string): Promise<void> {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) await walk(full);
      } else if (TF_FILE.test(entry.name)) {
        files.push({
          path: path.relative(absRoot, full).split(path.sep).join("/"),
          content: await readFile(full, "utf8"),
        });
      }
    }
  }

  await walk(absRoot);
  files.sort((a, b) => a.path.localeCompare(b.path)); // NFR-5 determinism
  return { root: absRoot, files };
}
