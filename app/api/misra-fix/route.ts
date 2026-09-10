import { NextRequest } from "next/server";

export const runtime = "edge";

async function callOpenAI(prompt: string) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-5-nano",
      messages: [
        {
          role: "system",
          content:
            "You fix MISRA C:2012 compliance issues. Never add libraries. Never add header files. Return only corrected C code.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  const text = await res.text();

  if (!res.ok) {
    console.error("OpenAI Error:", text);
    throw new Error("OpenAI request failed");
  }

  const data = JSON.parse(text);

  return data?.choices?.[0]?.message?.content || "";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileName, fileContent, violations } = body;

    const prompt = `
You are a deterministic MISRA C:2012 compliance correction engine for embedded automotive systems.

PRIMARY OBJECTIVE:
Fix only the reported MISRA violations in the provided C source file.

ABSOLUTE CONSTRAINTS:
- DO NOT add any #include directive
- DO NOT add <stdlib.h>, <stdint.h>, or ANY library
- DO NOT introduce external dependencies
- DO NOT create new header files
- DO NOT refactor unrelated code
- DO NOT rename functions unless required for compliance
- DO NOT alter logic unless required to fix a violation

COMPLIANCE REQUIREMENTS:
- Follow MISRA C:2012 rules strictly
- Use explicit casts where essential type rules require
- Add parentheses when operator precedence is ambiguous
- Add static or const only if required for compliance
- Add forward declarations only if required
- Preserve existing structure and formatting as much as possible

OUTPUT RULES:
- Return the FULL corrected C source file
- Output must be raw C code only
- No explanations
- No comments describing changes
- No markdown
- No JSON
- No extra text
- No code fences

INPUT FILE NAME:
${fileName}

REPORTED VIOLATIONS:
${JSON.stringify(violations, null, 2)}

SOURCE CODE:
${fileContent}
`;


    const result = await callOpenAI(prompt);

    return new Response(result, {
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error: any) {
    console.error("ROUTE ERROR:", error);

    return new Response(
      JSON.stringify({ error: error?.message || "Unknown error" }),
      { status: 500 }
    );
  }
}
