import "server-only";
import Anthropic from "@anthropic-ai/sdk";

export const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

let client: Anthropic | undefined;

// Created lazily so `next build` doesn't need ANTHROPIC_API_KEY.
export function getAnthropic(): Anthropic {
  client ??= new Anthropic();
  return client;
}
