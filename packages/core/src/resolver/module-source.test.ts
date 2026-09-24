import { describe, expect, it } from "vitest";
import { classifyModuleSource } from "./module-source";

describe("classifyModuleSource", () => {
  it.each([
    ["./modules/vpc", "local"],
    ["../shared", "local"],
    ["git::https://example.com/net.git?ref=v1", "git"],
    ["terraform-aws-modules/vpc/aws", "registry"],
    ["https://example.com/mod.zip", "http"],
    ["s3::https://bucket/mod.zip", "s3"],
  ])("%s -> %s", (source, kind) => {
    expect(classifyModuleSource(source)).toBe(kind);
  });
});
