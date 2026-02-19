import type { Response } from "express";

export function writeNdjson(res: Response, payload: unknown) {
  res.write(`${JSON.stringify(payload)}\n`);
}
