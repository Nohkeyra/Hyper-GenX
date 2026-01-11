/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { createContext, useState, ReactNode } from 'react';

interface AppContextType {
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
}

export const AppContext = createContext<AppContextType>({
    isLoading: false,
    setIsLoading: () => {},
});

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);

    return (
        <AppContext.Provider value={{ isLoading, setIsLoading }}>
            {children}
        </AppContext.Provider>
    );
};