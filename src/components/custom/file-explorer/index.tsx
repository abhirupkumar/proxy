"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Folder, FolderOpen, FileCode, File } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";

interface FileExplorerProps {
    onFileSelect: (path: string) => void;
    fileSystem: FileSystem;
}

interface FileData {
    code: string;
}

interface FileSystem {
    [key: string]: FileData;
}

export function FileExplorer({ onFileSelect, fileSystem }: FileExplorerProps) {
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
        new Set(["src"])
    );
    const [selectedFile, setSelectedFile] = useState<string | null>(null);

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
        onFileSelect(fullPath);
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
                                isExpanded && "bg-secondary text-primary"
                            )}
                            onClick={() => toggleFolder(fullPath)}
                            style={{ paddingLeft: `${depth + 4}px` }}
                        >
                            {isExpanded ? (
                                <FolderOpen className="h-4 w-4 mr-2 text-blue-400" />
                            ) : (
                                <Folder className="h-4 w-4 mr-2 text-yellow-400" />
                            )}
                            {name}
                        </button>
                        {isExpanded && item.children && (
                            <div className="ml-3 border-l border-gray-600 pl-2">
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
                    style={{ paddingLeft: `${depth + 6}px` }}
                >
                    <File className="h-4 w-4 mr-2 text-green-400" />
                    {name}
                </button>
            );
        });
    };

    const fileTree = createFileTree();

    return (
        <div className="border-r h-full text-secondary-foreground">
            <div className="p-4 border-b border-gray-700">
                <h2 className="font-semibold text-secondary-foreground/80">Explorer</h2>
            </div>
            <ScrollArea className="h-full">
                <div className="p-2">{renderFileSystem(fileTree)}</div>
            </ScrollArea>
        </div>
    );
}
