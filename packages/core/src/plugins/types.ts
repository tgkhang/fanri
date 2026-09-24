import type { FanriGraph, GNode } from "../ir";

/** Cloud plugin contract (doc 5 §5.7). Core has no cloud-specific code. */
export interface CloudPlugin {
  readonly name: string;
  /** Terraform provider prefixes this plugin owns, e.g. ["aws"]. */
  readonly providers: string[];
  /** Icon, category and label for one node. */
  decorate?(node: GNode): GNode["view"];
  /** Containment and extra edges (VPC -> subnet -> resource, SG/IAM hints). */
  enrich?(graph: FanriGraph): FanriGraph;
}
