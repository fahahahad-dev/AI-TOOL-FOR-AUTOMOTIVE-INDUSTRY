"use client";

import React, { useRef } from "react";
import { useState, useCallback } from "react";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  FileText,
  FolderOpen,
  AlertCircle,
  Save,
  X,
  Settings,
  Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useProject } from "@/modules/projects/hooks/useProject";
import { UploadFileTree } from "@/modules/editor/components/sidebar-file-tree";
import LoadingStep from "@/components/ui/loader";
import { useFileExplorer } from "@/modules/editor/hooks/use-file-explorer";
import { findFilePath } from "@/modules/editor/libs";
import { UploadFolder } from "@/modules/editor/types/types";
import { UploadFile } from "@/modules/projects/libs/path-to-json";
import { PlaygroundEditor } from "@/modules/editor/components/main-editor";
import ToggleAI from "@/modules/editor/components/toggle-ai";
import { useAISuggestions } from "@/modules/editor/hooks/use-ai-sugg";
import { ConfirmationDialog } from "@/modules/editor/components/dialogs/confirmation";
// import { PlaygroundEditor } from "@/features/playground/components/playground-editor";
// import { useFileExplorer } from "@/features/playground/hooks/useFileExplorer";
// import { usePlayground } from "@/features/playground/hooks/usePlayground";
// import { useAISuggestions } from "@/features/playground/hooks/useAISuggestion";
import { useWebContainer } from "@/hooks/use-web-container";

const MainEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [confirmationDialog, setConfirmationDialog] = useState({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => { },
    onCancel: () => { },
  });

  const [isPreviewVisible, setIsPreviewVisible] = useState(true);


  type LintMessage = {
    file: string;
    line: number;
    type: "error" | "warning" | "info" | "note" | "supplemental";
    desc: string;
  };

  const [lintResults, setLintResults] = useState<LintMessage[]>([]);
  const [isLinting, setIsLinting] = useState(false);
  const [scanCompleted, setScanCompleted] = useState(false);

  const [isFixing, setIsFixing] = useState(false);
  const [modifiedCode, setModifiedCode] = useState<string | null>(null);
  const [showDiff, setShowDiff] = useState(false);


  const { projectData, uploadData, isLoading, error, saveUploadData } =
    useProject(id);

  console.log('Project Data: ', projectData)
  console.log('Uploaded Data: ', uploadData)

  const handleFixViolations = async () => {
  if (!activeFile || isFixing) return;

  setIsFixing(true);

  try {
    const response = await fetch("/api/misra-fix", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: `${activeFile.filename}.${activeFile.fileExtension}`,
        fileContent: activeFile.content,
        violations: lintResults,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error?.error || "Fix failed");
    }

    const fixedCode = await response.text();

    setModifiedCode(fixedCode);
    setShowDiff(true);

    toast.success("AI fix generated");
  } catch (err) {
    console.error(err);
    toast.error("AI fix failed");
  } finally {
    setIsFixing(false);
  }
};






  const aiSuggestions = useAISuggestions();
  const {
    activeFileId,
    closeAllFiles,
    openFile,
    closeFile,
    editorContent,
    updateFileContent,
    handleAddFile,
    handleAddFolder,
    handleDeleteFile,
    handleDeleteFolder,
    handleRenameFile,
    handleRenameFolder,
    openFiles,
    setUploadData,
    setActiveFileId,
    setProjectId,
    setOpenFiles,
  } = useFileExplorer();

  const {
    instance,
    writeFileSync,
    // @ts-ignore
  } = useWebContainer({ uploadData });

  const lastSyncedContent = useRef<Map<string, string>>(new Map());

  // Set template data when playground loads
  React.useEffect(() => {
    setProjectId(id);
  }, [id, setProjectId]);

  // Initialize zustand templateData from usePlayground only on first load
  React.useEffect(() => {
    if (uploadData && !openFiles.length) {


      setUploadData(uploadData);
    }
  }, [uploadData, setUploadData, openFiles.length]);

  // --- Export helpers for lint results ---
                                  function exportLintResultsAsJSON(messages: any, filename = "lint_report.json") {
                                    const blob = new Blob([JSON.stringify({ messages }, null, 2)], { type: "application/json" });
                                    const url = URL.createObjectURL(blob);
                                    triggerDownload(url, filename);
                                  }

                                  function exportLintResultsAsXML(messages: any, filename = "lint_report.xml") {
                                    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n<lintResults>\n';
                                    const xmlFooter = '</lintResults>';
                                    const xmlBody = messages.map((msg: { file: any; line: any; type: any; code: any; desc: any; }) => `\n  <message>\n    <file>${escapeXml(msg.file)}</file>\n    <line>${msg.line}</line>\n    <type>${msg.type}</type>\n    <code>${msg.code || ''}</code>\n    <desc>${escapeXml(msg.desc)}</desc>\n  </message>`).join("\n");
                                    const xml = xmlHeader + xmlBody + "\n" + xmlFooter;
                                    const blob = new Blob([xml], { type: "application/xml" });
                                    const url = URL.createObjectURL(blob);
                                    triggerDownload(url, filename);
                                  }

                                  function escapeXml(unsafe: any) {
                                    return String(unsafe).replace(/[<>&'\"]/g, c => ({
                                      '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;'
                                    }[c] || c));
                                  }

                                  function triggerDownload(url: any, filename: any) {
                                    const a = document.createElement("a");
                                    a.href = url;
                                    a.download = filename;
                                    a.style.display = "none";
                                    document.body.appendChild(a);
                                    a.click();
                                    setTimeout(() => {
                                      document.body.removeChild(a);
                                      URL.revokeObjectURL(url);
                                    }, 100);
                                  }

  // Create wrapper functions that pass saveUploadData
  const wrappedHandleAddFile = useCallback(
    (newFile: UploadFile, parentPath: string) => {
      return handleAddFile(
        newFile,
        parentPath,
        writeFileSync!,
        instance,
        saveUploadData
      );
    },
    [handleAddFile, writeFileSync, instance, saveUploadData]
  );

  const wrappedHandleAddFolder = useCallback(
    (newFolder: UploadFolder, parentPath: string) => {
      return handleAddFolder(newFolder, parentPath, instance, saveUploadData);
    },
    [handleAddFolder, instance, saveUploadData]
  );

  const wrappedHandleDeleteFile = useCallback(
    (file: UploadFile, parentPath: string) => {
      return handleDeleteFile(file, parentPath, saveUploadData);
    },
    [handleDeleteFile, saveUploadData]
  );

  const wrappedHandleDeleteFolder = useCallback(
    (folder: UploadFolder, parentPath: string) => {
      return handleDeleteFolder(folder, parentPath, saveUploadData);
    },
    [handleDeleteFolder, saveUploadData]
  );

  const wrappedHandleRenameFile = useCallback(
    (
      file: UploadFile,
      newFilename: string,
      newExtension: string,
      parentPath: string
    ) => {
      return handleRenameFile(
        file,
        newFilename,
        newExtension,
        parentPath,
        saveUploadData
      );
    },
    [handleRenameFile, saveUploadData]
  );

  const wrappedHandleRenameFolder = useCallback(
    (folder: UploadFolder, newFolderName: string, parentPath: string) => {
      return handleRenameFolder(
        folder,
        newFolderName,
        parentPath,
        saveUploadData
      );
    },
    [handleRenameFolder, saveUploadData]
  );

  const activeFile = openFiles.find((file) => file.id === activeFileId);
  const hasUnsavedChanges = openFiles.some((file) => file.hasUnsavedChanges);

  const handleFileSelect = (file: UploadFile) => {
    openFile(file);
  };

  const handleSave = useCallback(
    async (fileId?: string) => {
      const targetFileId = fileId || activeFileId;
      if (!targetFileId) return;

      const fileToSave = openFiles.find((f) => f.id === targetFileId);
      if (!fileToSave) return;

      const latestTemplateData = useFileExplorer.getState().uploadData;
      if (!latestTemplateData) return;

      try {
        const filePath = findFilePath(fileToSave, latestTemplateData);
        if (!filePath) {
          toast.error(
            `Could not find path for file: ${fileToSave.filename}.${fileToSave.fileExtension}`
          );
          return;
        }

        // Update file content in template data (clone for immutability)
        const updatedUploadData = JSON.parse(
          JSON.stringify(latestTemplateData)
        );
        const updateFileContent: any = (items: any[]) =>
          items.map((item) => {
            if ("folderName" in item) {
              return { ...item, items: updateFileContent(item.items) };
            } else if (
              item.filename === fileToSave.filename &&
              item.fileExtension === fileToSave.fileExtension
            ) {
              return { ...item, content: fileToSave.content };
            }
            return item;
          });
        updatedUploadData.items = updateFileContent(
          updatedUploadData.items
        );

        // Sync with WebContainer
        if (writeFileSync) {
          await writeFileSync(filePath, fileToSave.content);
          lastSyncedContent.current.set(fileToSave.id, fileToSave.content);
          if (instance && instance.fs) {
            await instance.fs.writeFile(filePath, fileToSave.content);
          }
        }

        // Use saveTemplateData to persist changes
        const newUploadData = await saveUploadData(updatedUploadData);
        setUploadData(updatedUploadData);

        // Update open files
        const updatedOpenFiles = openFiles.map((f) =>
          f.id === targetFileId
            ? {
              ...f,
              content: fileToSave.content,
              originalContent: fileToSave.content,
              hasUnsavedChanges: false,
            }
            : f
        );
        setOpenFiles(updatedOpenFiles);

        toast.success(
          `Saved ${fileToSave.filename}.${fileToSave.fileExtension}`
        );
      } catch (error) {
        console.error("Error saving file:", error);
        toast.error(
          `Failed to save ${fileToSave.filename}.${fileToSave.fileExtension}`
        );
        throw error;
      }
    },
    [
      activeFileId,
      openFiles,
      writeFileSync,
      instance,
      saveUploadData,
      setUploadData,
      setOpenFiles,
    ]
  );

  const handleSaveAll = async () => {
    const unsavedFiles = openFiles.filter((f) => f.hasUnsavedChanges);

    if (unsavedFiles.length === 0) {
      toast.info("No unsaved changes");
      return;
    }

    try {
      await Promise.all(unsavedFiles.map((f) => handleSave(f.id)));
      toast.success(`Saved ${unsavedFiles.length} file(s)`);
    } catch (error) {
      toast.error("Failed to save some files");
    }
  };

  const handleScan = useCallback(async () => {
    if (!activeFile) return;

    setIsLinting(true);
    setLintResults([]);

    try {
      const response = await fetch("/api/lint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: activeFile.content,
        }),
      });

      if (!response.ok) throw new Error("Scan failed");

      const data = await response.json();

      const messages: LintMessage[] = data.messages || [];
      setLintResults(messages);

      toast.success(`Scan done — ${messages.length} issue(s)`);

      setScanCompleted(true);

    } catch (err: any) {
      toast.error("Lint scan failed");
    } finally {
      setIsLinting(false);
    }
  }, [activeFile]);


  // Add event to save file by click ctrl + s
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] p-4">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-red-600 mb-2">
          Something went wrong
        </h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()} variant="destructive">
          Try Again
        </Button>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] p-4">
        <div className="w-full max-w-md p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-6 text-center">
            Loading Playground
          </h2>
          <div className="mb-8">
            <LoadingStep
              currentStep={1}
              step={1}
              label="Loading playground data"
            />
            <LoadingStep
              currentStep={2}
              step={2}
              label="Setting up environment"
            />
            <LoadingStep currentStep={3} step={3} label="Ready to code" />
          </div>
        </div>
      </div>
    );
  }

  // No Upload data
  if (!uploadData) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] p-4">
        <FolderOpen className="h-12 w-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-semibold text-amber-600 mb-2">
          No Upload data available
        </h2>
        <Button onClick={() => window.location.reload()} variant="outline">
          If there is an issue. Please Add Project Again.
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <>
        <UploadFileTree
          // @ts-ignore
          data={uploadData}
          onFileSelect={handleFileSelect}
          selectedFile={activeFile}
          title="C/C++ Project"
          onAddFile={wrappedHandleAddFile}
          onAddFolder={wrappedHandleAddFolder}
          onDeleteFile={wrappedHandleDeleteFile}
          onDeleteFolder={wrappedHandleDeleteFolder}
          onRenameFile={wrappedHandleRenameFile}
          onRenameFolder={wrappedHandleRenameFolder}
        />

        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />

            <div className="flex flex-1 items-center gap-2">
              <div className="flex flex-col flex-1">
                <h1 className="text-sm font-medium">
                  {projectData?.name || "AI Tool For Automotive Industry"}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {openFiles.length} file(s) open
                  {hasUnsavedChanges && " • Unsaved changes"}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      // onClick={() => handleSave()}
                      disabled={!activeFile || !activeFile.hasUnsavedChanges}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Save (Ctrl+S)</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      // onClick={handleSaveAll}
                      disabled={!hasUnsavedChanges}
                    >
                      <Save className="h-4 w-4" /> All
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Save All (Ctrl+Shift+S)</TooltipContent>
                </Tooltip>

                <ToggleAI
                  isEnabled={aiSuggestions.isEnabled}
                  onToggle={aiSuggestions.toggleEnabled}
                  suggestionLoading={aiSuggestions.isLoading}
                />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setIsPreviewVisible(!isPreviewVisible)}
                    >
                      {isPreviewVisible ? "Hide" : "Show"} Preview
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={closeAllFiles}>
                      Close All Files
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <div className="h-[calc(100vh-4rem)]">
            {openFiles.length > 0 ? (
              <div className="h-full flex flex-col">
                {/* File Tabs */}
                <div className="border-b bg-muted/30">
                  <Tabs
                    value={activeFileId || ""}
                    onValueChange={setActiveFileId}
                  >
                    <div className="flex items-center justify-between px-4 py-2">
                      <TabsList className="h-8 bg-transparent p-0">
                        {openFiles.map((file) => (
                          <TabsTrigger
                            key={file.id}
                            value={file.id}
                            className="relative h-8 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm group"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="h-3 w-3" />
                              <span>
                                {file.filename}.{file.fileExtension}
                              </span>
                              {file.hasUnsavedChanges && (
                                <span className="h-2 w-2 rounded-full bg-orange-500" />
                              )}
                              <span
                                className="ml-2 h-4 w-4 hover:bg-destructive hover:text-destructive-foreground rounded-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  closeFile(file.id);
                                }}
                              >
                                <X className="h-3 w-3" />
                              </span>
                            </div>
                          </TabsTrigger>
                        ))}
                      </TabsList>

                      {openFiles.length > 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={closeAllFiles}
                          className="h-6 px-2 text-xs"
                        >
                          Close All
                        </Button>
                      )}
                    </div>
                  </Tabs>
                </div>

                {/* Editor and Preview */}
                <div className="flex-1">
                  <ResizablePanelGroup
                    direction="horizontal"
                    className="h-full"
                  >
                    <ResizablePanel defaultSize={isPreviewVisible ? 50 : 100}>
                      <PlaygroundEditor
                        activeFile={activeFile}
                        content={activeFile?.content || ""}
                        onContentChange={(value) =>
                          activeFileId && updateFileContent(activeFileId, value)
                        }
                        suggestion={aiSuggestions.suggestion}
                        suggestionLoading={aiSuggestions.isLoading}
                        suggestionPosition={aiSuggestions.position}
                        lintResults={lintResults}
                        onAcceptSuggestion={(editor, monaco) =>
                          aiSuggestions.acceptSuggestion(editor, monaco)
                        }
                        onRejectSuggestion={(editor) =>
                          aiSuggestions.rejectSuggestion(editor)
                        }
                        onTriggerSuggestion={(type, editor) =>
                          aiSuggestions.fetchSuggestion(type, editor)
                        }
                        showDiff={showDiff}
                        modifiedCode={modifiedCode}
                        onExitDiff={() => {
                          setShowDiff(false);
                          setModifiedCode(null);
                        }}
                        onApplyAllChanges={(newCode: any) => {
                          if (activeFileId) updateFileContent(activeFileId, newCode);
                          setShowDiff(false);
                          setModifiedCode(null);
                        }}
                      />
                    </ResizablePanel>

                    {isPreviewVisible && (
                      <>
                        <ResizableHandle />
                        <ResizablePanel defaultSize={50}>
                          <div className="h-full flex flex-col bg-background">
                            {/* Header / Title area */}
                            <div className="border-b px-4 py-3 flex items-center justify-between bg-muted/40">
                              <h3 className="text-sm font-medium">MISRA Compliance Scanner</h3>

                              {/* Optional: small status indicator */}
                              {activeFile ? (
                                <span className="text-xs text-muted-foreground">
                                  Active file: {activeFile.filename}.{activeFile.fileExtension}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">
                                  No file selected
                                </span>
                              )}
                            </div>

                            {/* Main content area */}
                            

                            <div className="h-full flex flex-col bg-background">
                              {scanCompleted ? (
                                // Post-scan formal view
                                <>
                                  {/* Header */}
                                  <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/20">
                                    <div className="text-sm font-medium">
                                      {activeFile?.filename}.{activeFile?.fileExtension} — {lintResults.length} violations
                                    </div>
                                    <div className="flex gap-2">
                                      <Button size="sm" variant="outline" onClick={() => { setScanCompleted(false); handleScan(); }}>
                                        Retry
                                      </Button>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button size="sm" variant="outline">
                                            Export Report
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem onClick={() => exportLintResultsAsJSON(lintResults)}>
                                            Export as JSON
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => exportLintResultsAsXML(lintResults)}>
                                            Export as XML
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </div>

                                  {/* Main Content */}
                                  <div className="flex flex-1 flex-col items-center justify-center p-6 text-center gap-4">
                                    <h2 className="text-lg font-bold">
                                      Fix violations with MISRA AI Agent
                                    </h2>
                                    <p className="text-sm text-muted-foreground max-w-md">
                                      Click “Fix” to automatically apply AI suggestions to resolve MISRA violations.
                                    </p>
                                    <Button
                                      size="lg"
                                      onClick={handleFixViolations}
                                      disabled={isFixing}
                                      className="min-w-[200px]"
                                    >
                                      {isFixing ? (
                                        <>
                                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                                          AI Thinking...
                                        </>
                                      ) : (
                                        "Fix Violations"
                                      )}
                                    </Button>
                                  </div>
                                </>
                              ) : (
                                // Original scan view
                                <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
                              {activeFile ? (
                                // ── When a file is open ──
                                <>
                                  <div className="text-center max-w-md">
                                    <p className="text-lg font-medium mb-2">
                                      Ready to scan for MISRA compliance
                                    </p>
                                    <p className="text-sm text-muted-foreground mb-6">
                                      {/* Current file: <strong>{activeFile.filename}.{activeFile.fileExtension}</strong><br /> */}
                                      Click "Scan" to check for violations according to MISRA C/C++ rules.
                                    </p>
                                  </div>

                                  {/* The Scan button */}
                                  <Button
                                    size="lg"
                                    onClick={handleScan}
                                    disabled={isLinting}
                                    className="gap-2 min-w-[180px]"
                                  >
                                    {isLinting ? (
                                      <>
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                        Scanning...
                                      </>
                                    ) : (
                                      <>
                                        <Play className="h-5 w-5" />
                                        Scan File
                                      </>
                                    )}
                                  </Button>

                                  {/* Optional extra info / teaser */}
                                  <div className="text-xs text-muted-foreground text-center mt-4 space-y-1">
                                    <p>• Checks for mandatory & required rules</p>
                                    <p>• Results appear here after scan</p>
                                    <p>• AI can suggest fixes for detected violations</p>
                                  </div>
                                </>
                              ) : (
                                // ── When NO file is open ──
                                <div className="text-center text-muted-foreground">
                                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                  <p className="text-lg font-medium mb-2">
                                    No file open
                                  </p>
                                  <p className="text-sm">
                                    Select or open a file from the sidebar to enable scanning
                                  </p>
                                </div>
                              )}
                            </div>
                              )}
                            </div>


                            {/* Future scan result area – for now just placeholder */}
                            {/* {lintResults.length > 0 && (
                              <div className="border-t max-h-48 overflow-auto bg-muted/30">
                                {lintResults.map((msg, i) => (
                                  <div
                                    key={i}
                                    className="flex gap-3 px-4 py-2 text-sm border-b hover:bg-muted cursor-pointer"
                                    onClick={() => {
                                      // jump to line
                                      if (window.editorInstance) {
                                        window.editorInstance.revealLineInCenter(msg.line);
                                        window.editorInstance.setPosition({
                                          lineNumber: msg.line,
                                          column: 1,
                                        });
                                        window.editorInstance.focus();
                                      }
                                    }}
                                  >
                                    <AlertCircle
                                      className={
                                        msg.type === "error"
                                          ? "text-red-500"
                                          : msg.type === "warning"
                                            ? "text-yellow-500"
                                            : "text-blue-500"
                                      }
                                      size={16}
                                    />
                                    <div>
                                      <p className="font-medium">
                                        Line {msg.line}
                                      </p>
                                      <p className="text-muted-foreground">
                                        {msg.desc}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )} */}

                          </div>
                        </ResizablePanel>
                      </>
                    )}
                  </ResizablePanelGroup>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full items-center justify-center text-muted-foreground gap-4">
                <FileText className="h-16 w-16 text-gray-300" />
                <div className="text-center">
                  <p className="text-lg font-medium">No files open</p>
                  <p className="text-sm text-gray-500">
                    Select a file from the sidebar to start editing
                  </p>
                </div>
              </div>
            )
            }
          </div>
        </SidebarInset>

        <ConfirmationDialog
          isOpen={confirmationDialog.isOpen}
          title={confirmationDialog.title}
          description={confirmationDialog.description}
          onConfirm={confirmationDialog.onConfirm}
          onCancel={confirmationDialog.onCancel}
          setIsOpen={(open) => setConfirmationDialog((prev) => ({ ...prev, isOpen: open }))}
        />
      </>
    </TooltipProvider>
  );
}

export default MainEditorPage;