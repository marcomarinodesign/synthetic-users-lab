import type { VercelRequest, VercelResponse } from "@vercel/node";
import { streamHandler } from "./simulate.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return streamHandler(req, res);
}
