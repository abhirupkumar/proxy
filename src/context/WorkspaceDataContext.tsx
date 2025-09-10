import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface Message {
    role: 'user' | "model" | "assistant";
    id: string;
    content: string,
    url?: string | null | undefined,
    photoUrls?: string[]
}

export interface FileSystem {
    [key: string]: { code: string }
}

// Define the type for the messages context
interface WorkspaceDataContextType {
    messages: Message[];
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    files: FileSystem | null;
    setFiles: React.Dispatch<React.SetStateAction<FileSystem | null>>;
    selectedFile: string | null;
    setSelectedFile: React.Dispatch<React.SetStateAction<string | null>>;
    selectedFiles: string[];
    setSelectedFiles: React.Dispatch<React.SetStateAction<string[]>>;
    handleFileSelect: (fullPath: string) => void
    isPrivate: boolean;
    setIsPrivate: React.Dispatch<React.SetStateAction<boolean>>;
    workspaceData: any;
    setWorkspaceData: React.Dispatch<React.SetStateAction<any>>;
    template: string;
    setTemplate: React.Dispatch<React.SetStateAction<string>>;
}

const WorkspaceDataContext = createContext<WorkspaceDataContextType | undefined>(undefined);

export const WorkspaceDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [files, setFiles] = useState<FileSystem | null>(null);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [isPrivate, setIsPrivate] = useState<boolean>(true);
    const [workspaceData, setWorkspaceData] = useState<any>(null)
    const [template, setTemplate] = useState<string>("react");

    const handleFileSelect = (fullPath: string) => {
        setSelectedFile(fullPath);
        if (!selectedFiles.includes(fullPath)) {
            setSelectedFiles((prev) => [
                ...prev, fullPath
            ]);
        }
    };

    return (
        <WorkspaceDataContext.Provider value={{ files, setFiles, selectedFile, setSelectedFile, selectedFiles, setSelectedFiles, handleFileSelect, messages, setMessages, isPrivate, setIsPrivate, workspaceData, setWorkspaceData, template, setTemplate }}>
            {children}
        </WorkspaceDataContext.Provider>
    );
};

// Custom hook to use the MessagesContext
export const useWorkspaceData = (): WorkspaceDataContextType => {
    const context = useContext(WorkspaceDataContext);
    if (context === undefined) {
        throw new Error('useMessages must be used within a WorkspaceDataProvider');
    }
    return context;
};
