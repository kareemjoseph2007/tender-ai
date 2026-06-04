import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-4-20250514";

export function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }
  return new Anthropic({ apiKey });
}

export async function callClaude(
  system: string,
  userContent: string,
  maxTokens = 4096
): Promise<string> {
  const anthropic = getAnthropicClient();
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: userContent }],
  });

  const block = response.content.find((item) => item.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("No text response from Claude");
  }

  return block.text.trim();
}
