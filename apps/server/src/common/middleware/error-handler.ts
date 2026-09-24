import type { ErrorRequestHandler } from "express";

// Never echo attribute values or file contents back (doc 6 §6.8), only the message.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err instanceof Error ? err.message : "internal error" });
};
