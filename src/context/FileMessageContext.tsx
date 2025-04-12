import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Message {
    role: 'user' | "assistant",
    content: string,
    url?: string | null | undefined,
}

export interface FileSystem {
    [key: string]: { code: string }
}

// Define the type for the messages context
interface FileMessageContextType {
    messages: Message[];
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    files: FileSystem | null;
    setFiles: React.Dispatch<React.SetStateAction<FileSystem | null>>;
    selectedFile: string | null;
    setSelectedFile: React.Dispatch<React.SetStateAction<string | null>>;
    selectedFiles: string[];
    setSelectedFiles: React.Dispatch<React.SetStateAction<string[]>>;
    handleFileSelect: (fullPath: string) => void
}

const FileMessageContext = createContext<FileMessageContextType | undefined>(undefined);

export const FileMessageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [files, setFiles] = useState<FileSystem | null>(null);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

    const handleFileSelect = (fullPath: string) => {
        setSelectedFile(fullPath);
        if (!selectedFiles.includes(fullPath)) {
            setSelectedFiles((prev) => [
                ...prev, fullPath
            ]);
        }
    };

    return (
        <FileMessageContext.Provider value={{ files, setFiles, selectedFile, setSelectedFile, selectedFiles, setSelectedFiles, handleFileSelect, messages, setMessages }}>
            {children}
        </FileMessageContext.Provider>
    );
};

// Custom hook to use the MessagesContext
export const useFileMessage = (): FileMessageContextType => {
    const context = useContext(FileMessageContext);
    if (context === undefined) {
        throw new Error('useMessages must be used within a FileMessageProvider');
    }
    return context;
};