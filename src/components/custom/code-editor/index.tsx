"use client";

import { useTheme } from "next-themes";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { githubDark, githubLight } from "@uiw/codemirror-theme-github";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";
import clsx from "clsx";
import { json } from "@codemirror/lang-json";

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
            <div className="flex items-center justify-center h-full bg-gray-900 text-muted-foreground">
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
                return javascript({ jsx: ext === 'tsx', typescript: true });
            case "jsx":
            case "js":
                return javascript({ jsx: ext === 'jsx' });
            case "html":
                return html();
            case "css":
                return css();
            case "json":
                return json();
            default:
                return [];
        }
    };

    return (
        <ScrollArea className="h-full  border-l border-gray-800">
            <div className="h-full">
                {/* VS Code Style Tab */}
                <div
                    className={clsx(
                        "flex items-center px-4 py-2 rounded-t-md border-b border-gray-700 text-muted-foreground shadow-md"
                    )}
                >
                    <FileText className="h-4 w-4 text-blue-400 mr-2" />
                    <span className="text-sm font-semibold">{filePath}</span>
                </div>

                {/* Code Editor */}
                <CodeMirror
                    value={getFileContent(filePath)}
                    extensions={[getLanguage(filePath)]}
                    theme={theme === "dark" ? githubDark : githubLight}
                    basicSetup={{
                        lineNumbers: true,
                        highlightActiveLine: true,
                        foldGutter: true,
                        autocompletion: true,
                        lintKeymap: true,
                        allowMultipleSelections: true,
                    }}
                    readOnly
                    className="h-full border border-gray-700 rounded-b-md shadow-lg"
                />
            </div>
        </ScrollArea>
    );
}
