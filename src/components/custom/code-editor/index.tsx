"use client";

import Editor from "@monaco-editor/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "next-themes";

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
    const { theme } = useTheme();
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

    return (
        <ScrollArea className="h-full">
            <div className="p-4 h-full">
                <div className="mb-4 px-2 py-1 bg-muted inline-block rounded text-sm">
                    {filePath}
                </div>
                <Editor
                    height="calc(90vh - 10rem)"
                    defaultLanguage={getLanguage(filePath)}
                    value={getFileContent(filePath)}
                    theme={theme === 'dark' ? "vs-dark" : "light"}
                    options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        fontSize: 13,
                        lineNumbers: "on",
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                    }}
                />
            </div>
        </ScrollArea>
    );
}
