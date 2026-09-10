import { type NextRequest, NextResponse } from "next/server"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

interface EnhancePromptRequest {
  prompt: string
  context?: {
    fileName?: string
    language?: string
    codeContent?: string
  }
}

// async function generateAIResponse(messages: ChatMessage[]) {
//   const systemPrompt = `You are an expert AI coding assistant. You help developers with:
// - Code explanations and debugging
// - Best practices and architecture advice
// - Writing clean, efficient code
// - Troubleshooting errors
// - Code reviews and optimizations

// Always provide clear, practical answers. When showing code, use proper formatting with language-specific syntax.
// Keep responses concise but comprehensive. Use code blocks with language specification when providing code examples.`

//   const fullMessages = [{ role: "system", content: systemPrompt }, ...messages]

//   const prompt = fullMessages.map((msg) => `${msg.role}: ${msg.content}`).join("\n\n")

//   const controller = new AbortController()
//   const timeoutId = setTimeout(() => controller.abort(), 600000)

//   try {
//     const response = await fetch("http://localhost:11434/api/generate", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         model: "codellama:latest",
//         prompt,
//         stream: false,
//         options: {
//           temperature: 0.7,
//           top_p: 0.9,
//           max_tokens: 1000,
//           num_predict: 1000,
//           repeat_penalty: 1.1,
//           context_length: 4096,
//         },
//       }),
//       signal: controller.signal,
//     })

//     clearTimeout(timeoutId)

//     if (!response.ok) {
//       const errorText = await response.text()
//       console.error("Error from AI model API:", errorText)
//       throw new Error(`AI model API error: ${response.status} - ${errorText}`)
//     }

//     const data = await response.json()
//     if (!data.response) {
//       throw new Error("No response from AI model")
//     }
//     return data.response.trim()
//   } catch (error) {
//     clearTimeout(timeoutId)
//     if ((error as Error).name === "AbortError") {
//       throw new Error("Request timeout: AI model took too long to respond")
//     }
//     console.error("AI generation error:", error)
//     throw error
//   }
// }

// async function enhancePrompt(request: EnhancePromptRequest) {
//   const enhancementPrompt = `You are a prompt enhancement assistant. Take the user's basic prompt and enhance it to be more specific, detailed, and effective for a coding AI assistant.

// Original prompt: "${request.prompt}"

// Context: ${request.context ? JSON.stringify(request.context, null, 2) : "No additional context"}

// Enhanced prompt should:
// - Be more specific and detailed
// - Include relevant technical context
// - Ask for specific examples or explanations
// - Be clear about expected output format
// - Maintain the original intent

// Return only the enhanced prompt, nothing else.`

//   try {
//     const response = await fetch("http://localhost:11434/api/generate", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         model: "codellama:latest",
//         prompt: enhancementPrompt,
//         stream: false,
//         options: {
//           temperature: 0.3,
//           max_tokens: 500,
//         },
//       }),
//     })

//     if (!response.ok) {
//       throw new Error("Failed to enhance prompt")
//     }

//     const data = await response.json()
//     return data.response?.trim() || request.prompt
//   } catch (error) {
//     console.error("Prompt enhancement error:", error)
//     return request.prompt // Return original if enhancement fails
//   }
// }
async function generateAIResponse(messages: ChatMessage[]) {
  const systemPrompt = `You are an expert AI coding assistant. You help developers with:
- Code explanations and debugging
- Best practices and architecture advice
- Writing clean, efficient code
- Troubleshooting errors
- Code reviews and optimizations

Always provide clear, practical answers with proper code formatting and language syntax.`

  const allMessages = [
    { role: "system", content: systemPrompt },
    ...messages
  ]

  const prompt = allMessages
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n\n")

  try {
  const response = await fetch(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-5-nano",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI API Error: ${errorText}`)
  }

  const data = await response.json()

  const aiText =
    data?.choices?.[0]?.message?.content?.trim() ||
    "No response from OpenAI"

  return aiText
} catch (error) {
  console.error("OpenAI Error:", error)
  throw new Error("OpenAI request failed")
}

}

async function enhancePrompt(request: EnhancePromptRequest) {
  const enhancementPrompt = `You are a prompt enhancement assistant. 
Take the user's prompt and make it more specific, detailed, and optimized for coding AI.

Original Prompt: "${request.prompt}"

Context: ${request.context ? JSON.stringify(request.context, null, 2) : "No context"}

Rules:
- Make it clearer and more actionable
- Add relevant technical details
- Maintain original intention
- Return ONLY the enhanced prompt text`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: enhancementPrompt }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 300,
          },
        }),
      }
    )

    if (!response.ok) {
      throw new Error("Gemini failed to enhance prompt")
    }

    const data = await response.json()

    return (
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      request.prompt
    )
  } catch (error) {
    console.error("Prompt enhancement error:", error)
    return request.prompt
  }
}


export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    console.log('Hello')

    // Handle prompt enhancement
    if (body.action === "enhance") {
      const enhancedPrompt = await enhancePrompt(body as EnhancePromptRequest)
      return NextResponse.json({ enhancedPrompt })
    }

    // Handle regular chat
    const { message, history } = body

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required and must be a string" }, { status: 400 })
    }

    const validHistory = Array.isArray(history)
      ? history.filter(
          (msg: any) =>
            msg &&
            typeof msg === "object" &&
            typeof msg.role === "string" &&
            typeof msg.content === "string" &&
            ["user", "assistant"].includes(msg.role),
        )
      : []

    const recentHistory = validHistory.slice(-10)
    const messages: ChatMessage[] = [...recentHistory, { role: "user", content: message }]

    const aiResponse = await generateAIResponse(messages)

    if (!aiResponse) {
      throw new Error("Empty response from AI model")
    }

    return NextResponse.json({
      response: aiResponse,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error in AI chat route:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json(
      {
        error: "Failed to generate AI response",
        details: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: "AI Chat API is running",
    timestamp: new Date().toISOString(),
    info: "Use POST method to send chat messages or enhance prompts",
  })
}
