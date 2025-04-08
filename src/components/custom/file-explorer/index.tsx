"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Folder, FolderOpen, FileCode, File, FileText } from "lucide-react";
import { Dispatch, SetStateAction, useState } from "react";
import clsx from "clsx";
import Image from "next/image";

interface FileExplorerProps {
    selectedFile: string | null;
    selectedFiles: string[];
    setSelectedFile: Dispatch<SetStateAction<string | null>>;
    setSelectedFiles: Dispatch<SetStateAction<string[]>>;
    fileSystem: FileSystem;
}

interface FileData {
    code: string;
}

interface FileSystem {
    [key: string]: FileData;
}

export function FileExplorer({ selectedFile, selectedFiles, setSelectedFile, setSelectedFiles, fileSystem }: FileExplorerProps) {
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
        new Set(["src"])
    );

    const createFileTree = () => {
        const tree: Record<string, any> = {};

        Object.keys(fileSystem).forEach((path) => {
            const parts = path.split("/");
            let current = tree;

            parts.forEach((part, index) => {
                if (index === parts.length - 1) {
                    // File
                    current[part] = {
                        type: "file",
                        content: fileSystem[path].code,
                    };
                } else {
                    // Directory
                    current[part] = current[part] || {
                        type: "directory",
                        children: {},
                    };
                    current = current[part].children;
                }
            });
        });

        return tree;
    };

    const toggleFolder = (path: string) => {
        const newExpanded = new Set(expandedFolders);
        if (newExpanded.has(path)) {
            newExpanded.delete(path);
        } else {
            newExpanded.add(path);
        }
        setExpandedFolders(newExpanded);
    };

    const handleFileSelect = (fullPath: string) => {
        setSelectedFile(fullPath);
        if (!selectedFiles.includes(fullPath)) {
            setSelectedFiles((prev) => [
                ...prev, fullPath
            ]);
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

    const renderFileSystem = (structure: any, path = "", depth = 0) => {
        // Sort folders first, then files (both alphabetically)
        const sortedEntries = Object.entries(structure).sort(([nameA, itemA]: [string, any], [nameB, itemB]: [string, any]) => {
            if (itemA.type === "directory" && itemB.type !== "directory") return -1;
            if (itemA.type !== "directory" && itemB.type === "directory") return 1;
            return nameA.localeCompare(nameB);
        });

        return sortedEntries.map(([name, item]: [string, any]) => {
            const fullPath = path ? `${path}/${name}` : name;
            const isExpanded = expandedFolders.has(fullPath);
            const isSelected = selectedFile === fullPath;

            if (item.type === "directory") {
                return (
                    <div key={fullPath}>
                        <button
                            className={clsx(
                                "flex items-center w-full px-2 py-1 rounded-sm text-sm hover:bg-secondary text-muted-foreground transition text-left",
                                isExpanded && "text-primary"
                            )}
                            onClick={() => toggleFolder(fullPath)}
                            style={{ paddingLeft: `${depth}px` }}
                        >
                            {isExpanded ? (
                                <FolderOpen className="h-4 w-4 mr-2 text-sky-400" />
                            ) : (
                                <Folder className="h-4 w-4 mr-2 text-sky-400" />
                            )}
                            {name}
                        </button>
                        {isExpanded && item.children && (
                            <div className="ml-1 border-l border-gray-600 pl-1">
                                {renderFileSystem(item.children, fullPath, depth + 1)}
                            </div>
                        )}
                    </div>
                );
            }

            return (
                <button
                    key={fullPath}
                    className={clsx(
                        "flex items-center w-full px-2 py-1 rounded-sm text-sm hover:bg-secondary text-muted-foreground transition",
                        isSelected && "bg-secondary text-primary"
                    )}
                    onClick={() => handleFileSelect(fullPath)}
                    style={{ paddingLeft: `${depth}px` }}
                >
                    {getFileLanguage(fullPath) != 'txt' ? <Image src={`/file-icons/${getFileLanguage(fullPath)}.svg`} height={14} width={14} alt="ts-file" className="mr-2" /> : <FileText className="h-4 w-4 mr-2 text-blue-400" />}
                    {name}
                </button>
            );
        });
    };

    const fileTree = createFileTree();

    return (
        <ScrollArea className="border-r h-[calc(100vh-3rem)] min-w-48 text-secondary-foreground">
            <div className="p-4 border-b border-gray-700">
                <h2 className="font-semibold text-secondary-foreground/80">Explorer</h2>
            </div>
            <div>
                <div className="p-2">{renderFileSystem(fileTree)}</div>
            </div>
        </ScrollArea>
    );
}
