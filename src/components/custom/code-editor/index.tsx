"use client";

import { Editor, type Monaco } from "@monaco-editor/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "next-themes";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Cross, FileText, X } from "lucide-react";
import Image from "next/image";
import { useWorkspaceData } from "@/context/WorkspaceDataContext";

interface FileData {
    code: string;
}

interface FileSystem {
    [key: string]: FileData;
}

export function CodeEditor() {
    const { resolvedTheme } = useTheme();
    const editorRef = useRef<any>(null)
    const monacoRef = useRef<any>(null)
    const [editorTheme, setEditorTheme] = useState("vs")

    const { selectedFile, files: fileSystem, selectedFiles, setSelectedFile, setSelectedFiles } = useWorkspaceData();

    useEffect(() => {
        if (resolvedTheme === "dark") {
            setEditorTheme("vs-dark")
        } else {
            setEditorTheme("vs")
        }
    }, [resolvedTheme])

    if (!selectedFile) {
        return (
            <div className="flex items-center justify-center w-full h-[100vh] bg-card text-muted-foreground">
                Select a file to view its contents
            </div>
        );
    }

    const getFileContent = (path: string) => {
        if (!fileSystem) return "// File not found";
        return fileSystem[path]?.code || "// File not found";
    };

    const getLanguage = (path: string) => {
        const ext = path.split(".").pop()?.toLowerCase();
        switch (ext) {
            case "tsx":
            case "ts":
                return "typescript";
            case "jsx":
            case "js":
                return "javascript";
            case "html":
                return "html";
            case "css":
                return "css";
            case "json":
                return "json";
            default:
                return "plaintext";
        }
    };

    const getFileLanguage = (path: string) => {
        const ext = path.split(".").pop()?.toLowerCase();
        switch (ext) {
            case "tsx":
                return "tsx";
            case "mts":
            case "ts":
                return "ts";
            case "jsx":
                return "jsx";
            case "mjs":
            case "js":
                return "js";
            case "html":
                return "html";
            case "css":
                return "css";
            case "json":
                return "json";
            default:
                return "txt";
        }
    };

    const removeFilePath = (fullpath: string) => {
        const updatedFiles = selectedFiles.filter((file) => file !== fullpath);
        setSelectedFiles(updatedFiles);
        if (selectedFile == fullpath) {
            console.log(selectedFiles[selectedFiles.length - 1]);
            if (updatedFiles.length > 0)
                setSelectedFile(updatedFiles[updatedFiles.length - 1]);
            else setSelectedFile(null);
        }
    }

    const handleEditorWillMount = (monaco: Monaco) => {
        // Disable validation
        monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: true,
            noSyntaxValidation: true,
        });

        monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: true,
            noSyntaxValidation: true,
        });

        monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
            validate: false,
        });
    };

    return (
        <ScrollArea className="h-full flex-1">
            <div className="h-full flex flex-col">
                <div className="flex overflow-x-auto">
                    {selectedFiles.map((filepath, index) => (
                        <div
                            key={index}
                            className={clsx(
                                "flex items-center px-2 py-1 rounded-t-md border-b border-gray-700 text-muted-foreground shadow-md"
                            )}
                        >
                            <button className="flex" onClick={() => setSelectedFile(filepath)}>
                                {getFileLanguage(filepath) !== 'txt' ? (
                                    <Image
                                        src={`/file-icons/${getFileLanguage(filepath)}.svg`}
                                        height={14}
                                        width={14}
                                        alt="ts-file"
                                        className="mr-1"
                                    />
                                ) : (
                                    <FileText className="h-4 w-4 mr-2 text-blue-400" />
                                )}
                                <span className="text-sm font-semibold hover:text-primary">{filepath}</span>
                            </button>
                            <button onClick={() => removeFilePath(filepath)}>
                                <X className="h-3 w-3 ml-1 hover:text-primary" />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Editor */}
                <Editor
                    height="calc(100vh - 5rem)"
                    defaultLanguage={getLanguage(selectedFile)}
                    language={getLanguage(selectedFile)}
                    value={getFileContent(selectedFile)}
                    theme={editorTheme}
                    path={selectedFile}
                    beforeMount={handleEditorWillMount}
                    options={{
                        readOnly: true,
                        minimap: { enabled: true },
                        fontSize: 13,
                        fontLigatures: true,
                        lineNumbers: "on",
                        wordWrap: "on",
                        scrollBeyondLastLine: true,
                        automaticLayout: true,
                        smoothScrolling: true,
                        cursorBlinking: 'smooth',
                        cursorSmoothCaretAnimation: 'on',
                        roundedSelection: true,
                        wrappingStrategy: 'advanced',
                        formatOnType: true,
                        formatOnPaste: true,
                        folding: true,
                        foldingStrategy: 'auto',
                        autoIndent: 'full',
                        matchBrackets: 'always',
                        dragAndDrop: true,
                        quickSuggestions: true,
                        foldingHighlight: false,
                        "semanticHighlighting.enabled": false,
                    }}
                />
            </div>
        </ScrollArea>
    );
}
