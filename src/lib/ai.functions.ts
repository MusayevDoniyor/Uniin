import { createServerFn } from "@tanstack/react-start";

type Body = {
  model: string;
  messages: any[];
  tools?: any[];
  tool_choice?: any;
};

export const callAI = createServerFn({ method: "POST" })
  .inputValidator((data: Body) => data)
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured on the server");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(data),
    });

    const text = await res.text();
    if (!res.ok) {
      // Surface status so client can show specific messages (402 / 429)
      const err = new Error(text || `AI gateway error ${res.status}`);
      (err as any).status = res.status;
      throw err;
    }
    try { return JSON.parse(text); } catch { return { raw: text }; }
  });
