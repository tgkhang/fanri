import { Router } from "express";
import type { ServerConfig } from "../../config/server-config";
import { GraphService } from "./graph.service";

export function createGraphRouter(config: ServerConfig): Router {
  const service = new GraphService(config.root);

  return Router()
    .get("/", async (_req, res) => {
      res.json(await service.getGraph());
    })
    .get("/nodes/:id", async (req, res) => {
      const node = await service.getNode(req.params.id);
      if (!node) {
        res.status(404).json({ error: "node not found" });
        return;
      }
      res.json(node);
    });
}
