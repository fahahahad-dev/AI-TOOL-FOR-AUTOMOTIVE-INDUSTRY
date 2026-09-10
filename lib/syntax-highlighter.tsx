"use client";

import React from "react";

/**
 * High-level highlight wrapper
 */
export function highlightSyntax(code: string, fileExtension: string): string {
  if (!code) return "";

  switch (fileExtension) {
    case "c":
    case "h":
      return highlightC(code);

    case "cpp":
    case "cc":
    case "hpp":
      return highlightCPP(code);

    default:
      return code; // no highlight for unknown files
  }
}

/**
 * Component wrapper
 */
export default function SyntaxHighlighter({
  code,
  fileExtension,
}: {
  code: string;
  fileExtension: string;
}) {
  const highlightedCode = React.useMemo(() => {
    return highlightSyntax(code, fileExtension);
  }, [code, fileExtension]);

  return (
    <pre className="rounded-md bg-muted p-4 overflow-auto max-h-[calc(100vh-8rem)] whitespace-pre-wrap text-sm">
      <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
    </pre>
  );
}

/**
 * C keywords (MISRA-oriented)
 */
function highlightC(code: string): string {
  return code
    .replace(
      /\b(auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|inline|int|long|register|restrict|return|short|signed|sizeof|static|struct|switch|typedef|union|unsigned|void|volatile|while)\b/g,
      '<span style="color:#c678dd;">$1</span>'
    )
    .replace(/(".*?"|'.*?')/g, '<span style="color:#98c379;">$1</span>')
    .replace(/(\/\/.*|\/\*[\s\S]*?\*\/)/g, '<span style="color:#7f848e;">$1</span>')
    .replace(/(\d+)/g, '<span style="color:#d19a66;">$1</span>')
    .replace(/(\{|\}|\(|\)|;|,)/g, '<span style="color:#abb2bf;">$1</span>');
}

/**
 * C++ additional keywords
 */
function highlightCPP(code: string): string {
  return highlightC(code)
    .replace(
      /\b(class|namespace|template|typename|using|public|private|protected|virtual|operator|new|delete|this|try|catch|throw|nullptr|bool|true|false)\b/g,
      '<span style="color:#56b6c2;">$1</span>'
    );
}
