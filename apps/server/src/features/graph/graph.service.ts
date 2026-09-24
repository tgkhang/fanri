import { type FanriGraph, runPipeline } from "@fanri/core";
import { createHclParser } from "@fanri/parser-hcl";
import { awsPlugin } from "@fanri/plugin-aws";

/** Runs the core pipeline for one root folder and caches the result until invalidated (watch mode). */
export class GraphService {
  private cached?: Promise<FanriGraph>;
  private readonly parser = createHclParser();
  private readonly plugins = [awsPlugin];

  constructor(private readonly root: string) {}

  getGraph(): Promise<FanriGraph> {
    this.cached ??= runPipeline({ root: this.root, parser: this.parser, plugins: this.plugins });
    return this.cached;
  }

  async getNode(id: string) {
    const graph = await this.getGraph();
    return graph.nodes.find((node) => node.id === id);
  }

  invalidate(): void {
    this.cached = undefined;
  }
}
