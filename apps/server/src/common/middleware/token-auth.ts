import type { RequestHandler } from "express";

export const TOKEN_HEADER = "x-fanri-token";

/** Every API call must carry the session token printed by the CLI (NFR-2). */
export function tokenAuth(token: string): RequestHandler {
  return (req, res, next) => {
    if (req.get(TOKEN_HEADER) === token) return next();
    res.status(401).json({ error: "missing or invalid token" });
  };
}
