"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Folder, FolderOpen, FileText, Search, Plus, Trash2, Edit2, MoreVertical } from "lucide-react";
import { Dispatch, SetStateAction, useMemo, useState, useRef } from "react";
import clsx from "clsx";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { useWorkspaceData } from "@/context/WorkspaceDataContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

export function FileExplorer() {
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
        new Set(["src"])
    );
    const [dialogOpen, setDialogOpen] = useState<boolean>(false);
    const [dialogType, setDialogType] = useState<"addFile" | "addFolder" | "rename">("addFile");
    const [dialogPath, setDialogPath] = useState<string>("");
    const [newItemName, setNewItemName] = useState<string>("");
    const [dialogError, setDialogError] = useState<string>("");

    const {
        selectedFile,
        selectedFiles,
        setSelectedFile,
        setSelectedFiles,
        files: fileSystem,
        setFiles: setFileSystem
    } = useWorkspaceData();

    const createFileTree = (searchFilter: string = "") => {
        const tree: Record<string, any> = {};
        if (!fileSystem) return tree;

        Object.keys(fileSystem).forEach((path) => {
            if (searchFilter && !path.toLowerCase().includes(searchFilter.toLowerCase())) {
                return;
            }

            const parts = path.split("/");
            let current = tree;

            parts.forEach((part, index) => {
                if (index === parts.length - 1) {
                    current[part] = {
                        type: "file",
                        content: fileSystem[path].code,
                        path: path,
                    };
                } else {
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

    const handleAddFile = (parentPath: string) => {
        setDialogType("addFile");
        setDialogPath(parentPath);
        setNewItemName("");
        setDialogError("");
        setDialogOpen(true);
    };

    const handleAddFolder = (parentPath: string) => {
        setDialogType("addFolder");
        setDialogPath(parentPath);
        setNewItemName("");
        setDialogError("");
        setDialogOpen(true);
    };

    const handleRename = (itemPath: string, isFolder: boolean) => {
        setDialogType("rename");
        setDialogPath(itemPath);
        const name = itemPath.split("/").pop() || "";
        setNewItemName(name);
        setDialogError("");
        setDialogOpen(true);
    };

    const handleDeleteItem = (itemPath: string, isFolder: boolean) => {
        if (isFolder) {
            // Delete folder and all its contents
            const newFileSystem = { ...fileSystem };
            Object.keys(newFileSystem).forEach(filePath => {
                if (filePath === itemPath || filePath.startsWith(`${itemPath}/`)) {
                    delete newFileSystem[filePath];
                }
            });
            setFileSystem(newFileSystem);

            // Update selected files
            if (selectedFiles.some(file => file === itemPath || file.startsWith(`${itemPath}/`))) {
                setSelectedFiles(prev => prev.filter(file => file !== itemPath && !file.startsWith(`${itemPath}/`)));
            }

            // Update selected file
            if (selectedFile === itemPath || (selectedFile && selectedFile.startsWith(`${itemPath}/`))) {
                setSelectedFile(null);
            }

            // Remove from expanded folders
            if (expandedFolders.has(itemPath)) {
                const newExpanded = new Set(expandedFolders);
                newExpanded.delete(itemPath);
                setExpandedFolders(newExpanded);
            }
        } else {
            // Delete single file
            const newFileSystem = { ...fileSystem };
            delete newFileSystem[itemPath];
            setFileSystem(newFileSystem);

            // Update selected files
            if (selectedFiles.includes(itemPath)) {
                setSelectedFiles(prev => prev.filter(file => file !== itemPath));
            }

            // Update selected file
            if (selectedFile === itemPath) {
                setSelectedFile(null);
            }
        }
    };

    const handleDialogSubmit = () => {
        if (!newItemName.trim()) {
            setDialogError("Name cannot be empty");
            return;
        }

        // Handle naming validations
        if (newItemName.includes("/") || newItemName.includes("\\")) {
            setDialogError("Name cannot contain slashes");
            return;
        }

        if (dialogType === "addFile") {
            // Create new file
            const newPath = dialogPath ? `${dialogPath}/${newItemName}` : newItemName;

            // Check if file already exists
            if (fileSystem![newPath]) {
                setDialogError("A file with this name already exists");
                return;
            }

            const newFileSystem = { ...fileSystem };
            newFileSystem[newPath] = { code: "" };
            setFileSystem(newFileSystem);
        } else if (dialogType === "addFolder") {
            // For folders, we don't actually add entries to fileSystem until files are created inside them
            // But we should expand the folder
            const newPath = dialogPath ? `${dialogPath}/${newItemName}` : newItemName;

            // Check if a file with this exact path already exists
            if (fileSystem![newPath]) {
                setDialogError("A file with this name already exists");
                return;
            }

            // Check if folder already exists by checking if any files have this as a parent path
            const folderExists = Object.keys(fileSystem!).some(path =>
                path === newPath || path.startsWith(`${newPath}/`)
            );

            if (folderExists) {
                setDialogError("A folder with this name already exists");
                return;
            }

            // Create an empty file to ensure the folder exists in the tree
            const placeholderPath = `${newPath}/.placeholder`;
            const newFileSystem = { ...fileSystem };
            newFileSystem[placeholderPath] = { code: "" };
            setFileSystem(newFileSystem);

            // Expand the new folder
            setExpandedFolders(prev => {
                const newSet = new Set(prev);
                newSet.add(newPath);
                if (dialogPath) newSet.add(dialogPath);
                return newSet;
            });
        } else if (dialogType === "rename") {
            // Rename file or folder
            const isFolder = !fileSystem![dialogPath]; // If it doesn't exist directly, it's a folder
            const pathParts = dialogPath.split("/");
            const parentPath = pathParts.slice(0, -1).join("/");
            const newPath = parentPath ? `${parentPath}/${newItemName}` : newItemName;

            // Check if destination already exists
            if (newPath !== dialogPath && (fileSystem![newPath] || Object.keys(fileSystem!).some(path =>
                path === newPath || path.startsWith(`${newPath}/`)
            ))) {
                setDialogError("A file or folder with this name already exists");
                return;
            }

            if (isFolder) {
                // Rename folder and all its contents
                const newFileSystem = { ...fileSystem };
                const filesToRename = Object.keys(newFileSystem).filter(
                    path => path === dialogPath || path.startsWith(`${dialogPath}/`)
                );

                filesToRename.forEach(oldPath => {
                    const relativePath = oldPath.slice(dialogPath.length);
                    const updatedPath = newPath + relativePath;
                    newFileSystem[updatedPath] = newFileSystem[oldPath];
                    delete newFileSystem[oldPath];
                });

                setFileSystem(newFileSystem);

                // Update selected files
                setSelectedFiles(prev => prev.map(file => {
                    if (file === dialogPath || file.startsWith(`${dialogPath}/`)) {
                        const relativePath = file.slice(dialogPath.length);
                        return newPath + relativePath;
                    }
                    return file;
                }));

                // Update selected file
                if (selectedFile === dialogPath || selectedFile?.startsWith(`${dialogPath}/`)) {
                    const relativePath = selectedFile.slice(dialogPath.length);
                    setSelectedFile(newPath + relativePath);
                }

                // Update expanded folders
                if (expandedFolders.has(dialogPath)) {
                    const newExpanded = new Set(expandedFolders);
                    newExpanded.delete(dialogPath);
                    newExpanded.add(newPath);
                    setExpandedFolders(newExpanded);
                }
            } else {
                // Rename single file
                const newFileSystem = { ...fileSystem };
                newFileSystem[newPath] = newFileSystem[dialogPath];
                delete newFileSystem[dialogPath];
                setFileSystem(newFileSystem);

                // Update selected files
                if (selectedFiles.includes(dialogPath)) {
                    setSelectedFiles(prev => prev.map(file => file === dialogPath ? newPath : file));
                }

                // Update selected file
                if (selectedFile === dialogPath) {
                    setSelectedFile(newPath);
                }
            }
        }

        setDialogOpen(false);
    };

    const renderFileSystem = (structure: any, path = "", depth = 0) => {
        const sortedEntries = Object.entries(structure).sort(([nameA, itemA]: [string, any], [nameB, itemB]: [string, any]) => {
            if (itemA.type === "directory" && itemB.type !== "directory") return -1;
            if (itemA.type !== "directory" && itemB.type === "directory") return 1;
            return nameA.localeCompare(nameB);
        });

        return sortedEntries.map(([name, item]: [string, any]) => {
            // Skip placeholder files
            if (name === ".placeholder") return null;

            const fullPath = path ? `${path}/${name}` : name;
            const isExpanded = expandedFolders.has(fullPath);
            const isSelected = selectedFile === item.path;

            if (item.type === "directory") {
                return (
                    <div key={fullPath}>
                        <div className="relative flex items-center group">
                            <button
                                className={clsx(
                                    "flex items-center flex-grow px-2 py-1 rounded-sm text-sm hover:bg-secondary text-muted-foreground transition text-left",
                                    isExpanded && "text-primary"
                                )}
                                onClick={() => toggleFolder(fullPath)}
                                style={{ paddingLeft: `${depth * 12}px` }}
                            >
                                {isExpanded ? (
                                    <FolderOpen className="h-4 w-4 mr-2 text-sky-400" />
                                ) : (
                                    <Folder className="h-4 w-4 mr-2 text-sky-400" />
                                )}
                                {name}
                            </button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 ml-auto mr-1 opacity-0 group-hover:opacity-100"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <MoreVertical className="h-3 w-3" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                    <DropdownMenuItem onClick={() => handleAddFile(fullPath)}>
                                        <Plus className="h-3 w-3 mr-2" />
                                        Add File
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleAddFolder(fullPath)}>
                                        <Folder className="h-3 w-3 mr-2" />
                                        Add Folder
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleRename(fullPath, true)}>
                                        <Edit2 className="h-3 w-3 mr-2" />
                                        Rename
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        className="text-red-500"
                                        onClick={() => handleDeleteItem(fullPath, true)}
                                    >
                                        <Trash2 className="h-3 w-3 mr-2" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        {isExpanded && item.children && (
                            <div className="ml-1 border-l border-gray-600 pl-1">
                                {renderFileSystem(item.children, fullPath, depth + 1)}
                            </div>
                        )}
                    </div>
                );
            }

            return (
                <div
                    key={item.path}
                    className="relative flex items-center group"
                >
                    <button
                        className={clsx(
                            "flex items-center flex-grow px-2 py-1 rounded-sm text-sm hover:bg-secondary text-muted-foreground transition",
                            isSelected && "bg-secondary text-primary"
                        )}
                        onClick={() => handleFileSelect(item.path)}
                        style={{ paddingLeft: `${depth * 12}px` }}
                    >
                        {getFileLanguage(item.path) !== 'txt' ?
                            <Image src={`/file-icons/${getFileLanguage(item.path)}.svg`} height={14} width={14} alt="file" className="mr-2" /> :
                            <FileText className="h-4 w-4 mr-2 text-blue-400" />
                        }
                        {name}
                    </button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 ml-auto mr-1 opacity-0 group-hover:opacity-100"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <MoreVertical className="h-3 w-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => handleRename(item.path, false)}>
                                <Edit2 className="h-3 w-3 mr-2" />
                                Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-red-500"
                                onClick={() => handleDeleteItem(item.path, false)}
                            >
                                <Trash2 className="h-3 w-3 mr-2" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            );
        });
    };

    const fileTree = useMemo(() => createFileTree(searchTerm), [fileSystem, searchTerm]);

    return (
        <ScrollArea className="border-r h-[100vh] min-w-48 text-secondary-foreground">
            <div className="flex flex-col h-full">
                <div className="flex justify-between items-center p-1 border-b">
                    <div className="flex gap-x-2 items-center flex-1">
                        <Search className="h-3 w-3 absolute ml-1" />
                        <Input
                            className="rounded-full text-sm border-none pl-5 py-0 h-auto"
                            placeholder="Search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                            >
                                <MoreVertical className="h-3 w-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => handleAddFile("")}>
                                <Plus className="h-3 w-3 mr-2" />
                                Add File
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAddFolder("")}>
                                <Folder className="h-3 w-3 mr-2" />
                                Add Folder
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="px-2 py-1">
                    {renderFileSystem(fileTree)}
                </div>
            </div>

            {/* Dialog for adding files/folders and renaming */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>
                            {dialogType === "addFile" ? "Add New File" :
                                dialogType === "addFolder" ? "Add New Folder" : "Rename"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Input
                                id="name"
                                className="col-span-4"
                                placeholder={dialogType === "addFile" ? "filename.ext" : dialogType === "addFolder" ? "folder name" : "new name"}
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                            />
                            {dialogError && (
                                <p className="text-red-500 text-sm col-span-4">{dialogError}</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleDialogSubmit}>
                            {dialogType === "addFile" ? "Create File" :
                                dialogType === "addFolder" ? "Create Folder" : "Rename"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </ScrollArea>
    );
}