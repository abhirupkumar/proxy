import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the type for the messages context
interface MessagesContextType {
    messages: {
        role: 'user' | 'bot';
        content: string;
    } | null;
    setMessages: React.Dispatch<React.SetStateAction<{
        role: 'user' | 'bot';
        content: string;
    } | null>>;
}

// Create the context with default values
const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

// Define the provider component
export const MessagesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [messages, setMessages] = useState<{
        role: 'user' | 'bot';
        content: string;
    } | null>(null);

    return (
        <MessagesContext.Provider value={{ messages, setMessages }}>
            {children}
        </MessagesContext.Provider>
    );
};

// Custom hook to use the MessagesContext
export const useMessages = (): MessagesContextType => {
    const context = useContext(MessagesContext);
    if (context === undefined) {
        throw new Error('useMessages must be used within a MessagesProvider');
    }
    return context;
};