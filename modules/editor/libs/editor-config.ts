import type { Monaco } from "@monaco-editor/react";

export const getEditorLanguage = (fileExtension: string): string => {
  const extension = fileExtension.toLowerCase();

  const languageMap: Record<string, string> = {
    // JavaScript/TypeScript
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    mjs: "javascript",
    cjs: "javascript",

    // Web languages
    json: "json",
    html: "html",
    htm: "html",
    css: "css",
    scss: "scss",
    sass: "scss",
    less: "less",

    // Markup/Documentation
    md: "markdown",
    markdown: "markdown",
    xml: "xml",
    yaml: "yaml",
    yml: "yaml",

    // Programming languages
    py: "python",
    java: "java",
    c: "c",
    h: "c",        // Header C
    cpp: "cpp",
    cxx: "cpp",
    cc: "cpp",
    hpp: "cpp",     // C++ Header
    cs: "csharp",
    php: "php",
    rb: "ruby",
    go: "go",
    rs: "rust",
    sh: "shell",
    bash: "shell",
    sql: "sql",

    // Embedded Systems / Firmware
    ino: "cpp",       // Arduino
    asm: "asm",       // Assembly
    s: "asm",
    ld: "plaintext",  // Linker script
    hex: "plaintext", // Firmware hex
    map: "plaintext",
    cproj: "xml",     // Embedded project files
    vcxproj: "xml",

    // Config files
    toml: "ini",
    ini: "ini",
    conf: "ini",
    dockerfile: "dockerfile",
  };

  return languageMap[extension] || "plaintext";
};


export const configureMonaco = (monaco: Monaco) => {
  monaco.editor.defineTheme("modern-light", {
    base: "vs",      // <-- LIGHT MODE BASE
    inherit: true,
    rules: [
      { token: "comment", foreground: "7A7A7A", fontStyle: "italic" },
      { token: "keyword", foreground: "AF00DB", fontStyle: "bold" },
      { token: "string", foreground: "A31515" },
      { token: "number", foreground: "098658" },
      { token: "variable", foreground: "001080" },
      { token: "type", foreground: "267F99" },
      { token: "identifier", foreground: "001080" },
      { token: "delimiter", foreground: "000000" },
    ],
    colors: {
      "editor.background": "#FFFFFF",
      "editor.foreground": "#1F1F1F",

      // Line numbers
      "editorLineNumber.foreground": "#999",
      "editorLineNumber.activeForeground": "#333",

      // Cursor
      "editorCursor.foreground": "#000000",

      // Selection
      "editor.selectionBackground": "#CCE8FF",
      "editor.inactiveSelectionBackground": "#E5F3FF",

      // Current line highlight
      "editor.lineHighlightBackground": "#F7F9FB",

      // Minimap
      "minimap.background": "#FFFFFF",

      // Bracket matching
      "editorBracketMatch.border": "#6C6C6C",
    }
  });

  monaco.editor.setTheme("modern-light");
  
  // Typescript static configs
  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false,
  });

  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false,
  });

  monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.Latest,
    allowNonTsExtensions: true,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    allowJs: true,
    noEmit: true,
    jsx: monaco.languages.typescript.JsxEmit.React,
  });

  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.Latest,
    allowNonTsExtensions: true,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    allowJs: true,
    noEmit: true,
    jsx: monaco.languages.typescript.JsxEmit.React,
  });
};

export const defaultEditorOptions: any = {
  // Font settings
  fontSize: 14,
  fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, 'Liberation Mono', Menlo, Courier, monospace",
  fontLigatures: true,
  fontWeight: "400",
  
  // Layout
  minimap: { 
    enabled: true,
    size: "proportional",
    showSlider: "mouseover"
  },
  scrollBeyondLastLine: false,
  automaticLayout: true,
  padding: { top: 16, bottom: 16 },
  
  // Line settings
  lineNumbers: "on",
  lineHeight: 20,
  renderLineHighlight: "all",
  renderWhitespace: "selection",
  
  // Indentation
  tabSize: 2,
  insertSpaces: true,
  detectIndentation: true,
  
  // Word wrapping
  wordWrap: "on",
  wordWrapColumn: 120,
  wrappingIndent: "indent",
  
  // Code folding
  folding: true,
  foldingHighlight: true,
  foldingStrategy: "indentation",
  showFoldingControls: "mouseover",
  
  // Scrolling
  smoothScrolling: true,
  mouseWheelZoom: true,
  fastScrollSensitivity: 5,
  
  // Selection
  multiCursorModifier: "ctrlCmd",
  selectionHighlight: true,
  occurrencesHighlight: true,
  
  // Suggestions
  suggestOnTriggerCharacters: true,
  acceptSuggestionOnEnter: "on",
  tabCompletion: "on",
  wordBasedSuggestions: true,
  quickSuggestions: {
    other: true,
    comments: false,
    strings: false
  },
  
  // Formatting
  formatOnPaste: true,
  formatOnType: true,
  
  // Bracket matching
  matchBrackets: "always",
  bracketPairColorization: {
    enabled: true
  },
  
  // Guides
  renderIndentGuides: true,
  highlightActiveIndentGuide: true,
  rulers: [80, 120],
  
  // Performance
  disableLayerHinting: false,
  disableMonospaceOptimizations: false,
  
  // Accessibility
  accessibilitySupport: "auto",
  
  // Cursor
  cursorBlinking: "smooth",
  cursorSmoothCaretAnimation: true,
  cursorStyle: "line",
  cursorWidth: 2,
  
  // Find
  find: {
    addExtraSpaceOnTop: false,
    autoFindInSelection: "never",
    seedSearchStringFromSelection: "always"
  },
  
  // Hover
  hover: {
    enabled: true,
    delay: 300,
    sticky: true
  },
  
  // Semantic highlighting
  "semanticHighlighting.enabled": true,
  
  // Sticky scroll
  stickyScroll: {
    enabled: true
  }
};


