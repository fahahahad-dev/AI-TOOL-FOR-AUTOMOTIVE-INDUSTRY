import { type NextRequest, NextResponse } from "next/server"

interface CodeSuggestionRequest {
  fileContent: string
  cursorLine: number
  cursorColumn: number
  suggestionType: string
  fileName?: string
}

interface CodeContext {
  language: string
  framework: string
  beforeContext: string
  currentLine: string
  afterContext: string
  cursorPosition: { line: number; column: number }
  isInFunction: boolean
  isInClass: boolean
  isAfterComment: boolean
  incompletePatterns: string[]
}

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 Suggestion API hit")

    const body: CodeSuggestionRequest = await request.json()
    const { fileContent, cursorLine, cursorColumn, suggestionType, fileName } = body

    if (!fileContent || cursorLine < 0 || cursorColumn < 0 || !suggestionType) {
      console.log("❌ Invalid input")
      return NextResponse.json({ error: "Invalid input parameters" }, { status: 400 })
    }

    console.log("🔍 Analyzing context...")
    const context = analyzeCodeContext(fileContent, cursorLine, cursorColumn, fileName)

    console.log("🧠 Building prompt...")
    const prompt = buildPrompt(context, suggestionType)

    console.log("🤖 Calling OpenAI gpt-5-nano...")
    const suggestion = await generateSuggestion(prompt)

    console.log("✅ Suggestion generated")

    return NextResponse.json({
      suggestion,
      metadata: {
        language: context.language,
        framework: context.framework,
        position: context.cursorPosition,
        generatedAt: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    console.error("🔥 API crashed:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    )
  }
}

/* ============================= */
/*        PROMPT BUILDER         */
/* ============================= */

function buildPrompt(context: CodeContext, suggestionType: string): string {
  return `
You are a deterministic senior-level ${context.language} engineer.

STRICT RULES:
- Output ONLY the code that should be inserted at the cursor
- Do NOT explain anything
- Do NOT wrap output in markdown
- Do NOT include backticks
- Do NOT repeat surrounding code
- Do NOT describe what you are doing
- No comments unless absolutely required by syntax
- Respect indentation
- Follow ${context.language} best practices
- Keep response concise and production-ready

SUGGESTION TYPE: ${suggestionType}

LANGUAGE: ${context.language}
FRAMEWORK: ${context.framework}

CURSOR CONTEXT:

${context.beforeContext}
${context.currentLine.substring(0, context.cursorPosition.column)}|CURSOR|${context.currentLine.substring(context.cursorPosition.column)}
${context.afterContext}

CODE ANALYSIS:
- In Function: ${context.isInFunction}
- In Class: ${context.isInClass}
- After Comment: ${context.isAfterComment}
- Incomplete Patterns: ${context.incompletePatterns.join(", ") || "None"}

Generate the exact code to insert at |CURSOR|:
`
}

/* ============================= */
/*       OPENAI GENERATION       */
/* ============================= */

async function generateSuggestion(prompt: string): Promise<string> {
  try {
    console.log("📡 Sending request to OpenAI...")

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
              "You are an elite code completion engine. Output only raw code. No markdown. No explanations.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error("❌ OpenAI error:", errText)
      throw new Error(`OpenAI API Error`)
    }

    const data = await response.json()

    let suggestion =
      data?.choices?.[0]?.message?.content || ""

    // Safety cleanup
    suggestion = suggestion
      .replace(/```[\s\S]*?```/g, "")
      .replace(/```/g, "")
      .replace(/\|CURSOR\|/g, "")
      .trim()

    console.log("📥 Raw model output:", suggestion)

    return suggestion || "// No suggestion"
  } catch (error) {
    console.error("🔥 OpenAI Generation Error:", error)
    return "// AI suggestion unavailable"
  }
}

/* ============================= */
/*      CONTEXT ANALYSIS         */
/* ============================= */

function analyzeCodeContext(
  content: string,
  line: number,
  column: number,
  fileName?: string
): CodeContext {
  const lines = content.split("\n")
  const currentLine = lines[line] || ""

  const contextRadius = 10
  const startLine = Math.max(0, line - contextRadius)
  const endLine = Math.min(lines.length, line + contextRadius)

  const beforeContext = lines.slice(startLine, line).join("\n")
  const afterContext = lines.slice(line + 1, endLine).join("\n")

  const language = detectLanguage(content, fileName)
  const framework = detectFramework(content)

  return {
    language,
    framework,
    beforeContext,
    currentLine,
    afterContext,
    cursorPosition: { line, column },
    isInFunction: detectInFunction(lines, line),
    isInClass: detectInClass(lines, line),
    isAfterComment: detectAfterComment(currentLine, column),
    incompletePatterns: detectIncompletePatterns(currentLine, column),
  }
}

/* ============================= */
/*      HELPER FUNCTIONS         */
/* ============================= */

function detectLanguage(content: string, fileName?: string): string {
  if (fileName) {
    const ext = fileName.split(".").pop()?.toLowerCase()
    const map: Record<string, string> = {
      ts: "TypeScript",
      tsx: "TypeScript",
      js: "JavaScript",
      jsx: "JavaScript",
      py: "Python",
      java: "Java",
      go: "Go",
      rs: "Rust",
      php: "PHP",
    }
    if (ext && map[ext]) return map[ext]
  }

  if (content.includes("interface ") || content.includes(": string"))
    return "TypeScript"
  if (content.includes("def ")) return "Python"

  return "JavaScript"
}

function detectFramework(content: string): string {
  if (content.includes("useState")) return "React"
  if (content.includes("@Component")) return "Angular"
  if (content.includes("next/")) return "Next.js"
  return "None"
}

function detectInFunction(lines: string[], currentLine: number): boolean {
  for (let i = currentLine - 1; i >= 0; i--) {
    if (lines[i]?.match(/function|def|=>/)) return true
  }
  return false
}

function detectInClass(lines: string[], currentLine: number): boolean {
  for (let i = currentLine - 1; i >= 0; i--) {
    if (lines[i]?.match(/class\s+/)) return true
  }
  return false
}

function detectAfterComment(line: string, column: number): boolean {
  const before = line.substring(0, column)
  return /\/\/.*$/.test(before) || /#.*$/.test(before)
}

function detectIncompletePatterns(line: string, column: number): string[] {
  const before = line.substring(0, column)
  const patterns: string[] = []

  if (/=\s*$/.test(before)) patterns.push("assignment")
  if (/\.\s*$/.test(before)) patterns.push("method-call")
  if (/\{\s*$/.test(before)) patterns.push("object")
  if (/\[\s*$/.test(before)) patterns.push("array")

  return patterns
}
