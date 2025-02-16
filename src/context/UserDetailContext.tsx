import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the context type
interface UserDetailContextType {
    userDetail: any | null;
    setUserDetail: React.Dispatch<React.SetStateAction<any | null>>;
}

// Create the context
const UserDetailContext = createContext<UserDetailContextType | undefined>(undefined);

// Create a provider component
export const UserDetailProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [userDetail, setUserDetail] = useState<any | null>(null);

    return (
        <UserDetailContext.Provider value={{ userDetail, setUserDetail }}>
            {children}
        </UserDetailContext.Provider>
    );
};

// Custom hook to use the UserDetailContext
export const useUserDetail = () => {
    const context = useContext(UserDetailContext);
    if (context === undefined) {
        throw new Error("useUserDetail must be used within a UserDetailProvider");
    }
    return context;
};