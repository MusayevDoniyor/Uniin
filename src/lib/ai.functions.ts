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
    // Read key from LOVABLE_API_KEY as the user has configured it there, or GEMINI_API_KEY
    const apiKey = process.env.LOVABLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey)
      throw new Error(
        "Google AI Studio API Key (LOVABLE_API_KEY / GEMINI_API_KEY) is not configured on the server",
      );

    // Clean model name (e.g. google/gemini-2.5-flash -> gemini-2.5-flash)
    let model = data.model;
    if (model.includes("/")) {
      model = model.split("/").pop() || model;
    }

    const payload = {
      ...data,
      model,
    };

    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      },
    );

    const text = await res.text();
    if (!res.ok) {
      // Surface status so client can show specific messages
      const err = new Error(text || `Google AI Studio error ${res.status}`);
      (err as any).status = res.status;
      throw err;
    }
    try {
      return JSON.parse(text);
    } catch {
      return { raw: text };
    }
  });
