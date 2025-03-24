"use client";

import { Editor, type Monaco } from "@monaco-editor/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { FileText } from "lucide-react";
import Image from "next/image";

interface FileExplorerProps {
    filePath: string | null;
    fileSystem: FileSystem;
}

interface FileData {
    code: string;
}

interface FileSystem {
    [key: string]: FileData;
}

export function CodeEditor({ filePath, fileSystem }: FileExplorerProps) {
    const { resolvedTheme } = useTheme();
    const editorRef = useRef<any>(null)
    const monacoRef = useRef<any>(null)
    const [editorTheme, setEditorTheme] = useState("vs")

    useEffect(() => {
        if (resolvedTheme === "dark") {
            setEditorTheme("vs-dark")
        } else {
            setEditorTheme("vs")
        }
    }, [resolvedTheme])

    if (!filePath) {
        return (
            <div className="flex items-center justify-center h-full bg-card text-muted-foreground">
                Select a file to view its contents
            </div>
        );
    }

    const getFileContent = (path: string) => {
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

    return (
        <ScrollArea className="h-full">
            <div className="h-full pt-4">
                <div
                    className={clsx(
                        "flex items-center px-4 py-2 rounded-t-md border-b border-gray-700 text-muted-foreground shadow-md"
                    )}
                >
                    {getFileLanguage(filePath) != 'txt' ? <Image src={`/file-icons/${getFileLanguage(filePath)}.svg`} height={14} width={14} alt="ts-file" className="mr-2" /> : <FileText className="h-4 w-4 mr-2 text-blue-400" />}
                    <span className="text-sm font-semibold">{filePath}</span>
                </div>
                <Editor
                    height="calc(100vh - 5rem)"
                    defaultLanguage={getLanguage(filePath)}
                    language={getLanguage(filePath)}
                    value={getFileContent(filePath)}
                    theme={editorTheme}
                    path={filePath}
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
                        roundedSelection: true
                    }}
                />
            </div>
        </ScrollArea>
    );
}
