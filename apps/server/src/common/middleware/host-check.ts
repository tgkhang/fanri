import type { RequestHandler } from "express";

const ALLOWED_HOSTNAMES = new Set(["127.0.0.1", "localhost"]);

/** Rejects requests whose Host header is not local. Blocks DNS-rebinding attacks (doc 6 §6.8). */
export const hostCheck: RequestHandler = (req, res, next) => {
  if (ALLOWED_HOSTNAMES.has(req.hostname)) return next();
  res.status(403).json({ error: "forbidden host" });
};
