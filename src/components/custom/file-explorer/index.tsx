"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Folder, File, FileCode } from "lucide-react";
import { useState } from "react";

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
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["src"]));

    // Convert flat file structure to tree structure
    const createFileTree = () => {
        const tree: Record<string, any> = {};

        Object.keys(fileSystem).forEach((path) => {
            const parts = path.split('/');
            let current = tree;

            parts.forEach((part, index) => {

                if (index === parts.length - 1) {
                    // It's a file
                    current[part] = {
                        type: 'file',
                        content: fileSystem[path].code
                    };
                } else {
                    // It's a directory
                    current[part] = current[part] || {
                        type: 'directory',
                        children: {}
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

    const renderFileSystem = (structure: any, path = "") => {
        return Object.entries(structure).map(([name, item]: [string, any]) => {
            const fullPath = path ? `${path}/${name}` : name;

            if (item.type === "directory") {
                const isExpanded = expandedFolders.has(fullPath);
                return (
                    <div key={fullPath}>
                        <button
                            className="flex items-center w-full px-2 py-1 hover:bg-accent rounded-sm text-sm"
                            onClick={() => toggleFolder(fullPath)}
                        >
                            <Folder className="h-4 w-4 mr-2" />
                            {name}
                        </button>
                        {isExpanded && item.children && (
                            <div className="ml-4">
                                {renderFileSystem(item.children, fullPath)}
                            </div>
                        )}
                    </div>
                );
            }

            return (
                <button
                    key={fullPath}
                    className="flex items-center w-full px-2 py-1 hover:bg-accent rounded-sm text-sm"
                    onClick={() => onFileSelect(fullPath)}
                >
                    <FileCode className="h-4 w-4 mr-2" />
                    {name}
                </button>
            );
        });
    };

    const fileTree = createFileTree();

    return (
        <div className="border-r h-full bg-card">
            <div className="p-4 border-b">
                <h2 className="font-semibold">Files</h2>
            </div>
            <ScrollArea className="h-[calc(100vh-8rem)]">
                <div className="p-2">
                    {renderFileSystem(fileTree)}
                </div>
            </ScrollArea>
        </div>
    );
}