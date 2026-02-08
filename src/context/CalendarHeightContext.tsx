import React, { createContext, useContext } from 'react';
import { SharedValue } from 'react-native-reanimated';

interface CalendarHeightContextType {
    itemHeight: SharedValue<number>;
}

const CalendarHeightContext = createContext<CalendarHeightContextType | null>(null);

export const CalendarHeightProvider = ({
    children,
    itemHeight,
}: {
    children: React.ReactNode;
    itemHeight: SharedValue<number>;
}) => {
    return (
        <CalendarHeightContext.Provider value={{ itemHeight }}>
            {children}
        </CalendarHeightContext.Provider>
    );
};

export const useCalendarHeight = () => {
    const context = useContext(CalendarHeightContext);
    if (!context) {
        throw new Error('useCalendarHeight must be used within a CalendarHeightProvider');
    }
    return context;
};
